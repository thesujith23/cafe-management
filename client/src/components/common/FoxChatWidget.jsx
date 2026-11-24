import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Send, Volume2, VolumeX, X } from 'lucide-react';
import { chatBotApi } from '../../api/apiServices';
import { useCart } from '../../context/CartContext';
import { useFoxSpeech } from './useFoxSpeech';
import { createFoxStage } from './fox/FoxScene';
import FoxFaceIcon from './fox/FoxFaceIcon';

/**
 * Finnegan — the café fox.
 *
 * He stands on the page at full height, not inside a button-shaped badge: the standing 3D
 * fox is the launcher. Pressing him opens the chat window and nothing else — and he does
 * not move to make room for it. The window unfolds out of the corner he is standing on, so
 * the fox stays exactly where the guest clicked him while the conversation grows beside him.
 * There is no second fox inside the panel: the conversation, the header avatar and the
 * input row are all the guest sees. The exchange underneath is the same `POST /api/chat`
 * call as before, so replies, fallbacks and rate limits are unchanged.
 */

// A reply never appears faster than this: the guest gets at least 200ms of Finnegan
// thinking, so answers land as a reaction to the question instead of a silent snap.
const REPLY_THINKING_MS = 200;

// Matches the `cafeFoxRetract` animation in fox-widget.css. The window stays mounted this
// long after closing so it can fold back into the fox instead of disappearing in a frame.
const CLOSE_MS = 500;

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const GREETING = {
  role: 'assistant',
  content: "Hi, I'm Finnegan, the café fox. Ask me about the menu, ordering, payments, or how to find your order.",
};

const isRealReply = (res) => {
  if (!res || typeof res !== 'object') return false;
  return typeof res.reply === 'string' && res.reply.trim().length > 0;
};

const fallbackText = (res) => (
  res?.message
  || res?.error?.message
  || 'I am not available right now. Please try again in a moment.'
);

const TypingBubble = () => (
  <div
    className="chat-bubble chat-bubble-assistant chat-typing"
    role="status"
    aria-live="polite"
    aria-label="Finnegan is thinking"
    title="Finnegan is thinking…"
  >
    <span className="chat-typing-dot" />
    <span className="chat-typing-dot" />
    <span className="chat-typing-dot" />
  </div>
);

/**
 * One mounted fox on one canvas. `framing` picks the crop, `idleGestures` turns on his
 * standing-around beats, `showTag` adds the little state pill, and `stageApiRef` hands the
 * widget the stage so it can play a gesture at the right moment.
 */
function FoxStage({
  state,
  speaking = false,
  amplitudeRef,
  framing = 'full',
  idleGestures = true,
  showTag = true,
  className = '',
  title,
  stageApiRef,
  onPoke,
  onHover,
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stage = createFoxStage(canvasRef.current, { amplitudeRef, framing, idleGestures });
    if (!stage) {
      setFailed(true);
      return undefined;
    }
    stageRef.current = stage;
    if (stageApiRef) stageApiRef.current = stage;
    stage.start();
    return () => {
      stage.dispose();
      stageRef.current = null;
      if (stageApiRef) stageApiRef.current = null;
    };
  }, [amplitudeRef, framing, idleGestures, stageApiRef]);

  useEffect(() => {
    stageRef.current?.setState(state);
  }, [state]);

  const label = state === 'thinking' ? 'thinking' : state === 'speaking' ? 'speaking' : 'listening';

  return (
    <div
      className={`cafe-fox-stage ${className}`}
      data-state={state}
      onClick={onPoke}
      onPointerEnter={onHover}
      title={title}
      aria-hidden="true"
    >
      {failed ? (
        <FoxFaceIcon className="cafe-fox-stage-fallback" />
      ) : (
        <canvas ref={canvasRef} className="cafe-fox-canvas" />
      )}
      {showTag && <span className="cafe-fox-stage-tag">{label}</span>}
      {showTag && (
        <span className="cafe-fox-eq" data-active={speaking ? 'true' : 'false'}>
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}

const FoxChatWidget = () => {
  const { pathname } = useLocation();
  const { itemCount } = useCart();
  const hasCartDock = itemCount > 0
    && (pathname.startsWith('/table/') || pathname.startsWith('/order/'));

  const [open, setOpen] = useState(false);
  // `open` drops immediately on close (so the fox is idle at once); `closing` keeps the
  // window mounted just long enough to play its exit.
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const windowRef = useRef(null);
  const launcherStageRef = useRef(null);
  const { speak, stop: stopSpeech, muted, setMuted, speaking, amplitudeRef } = useFoxSpeech();

  // `.cafe-fox-scroll` is the element that scrolls, so the newest reply has to be scrolled
  // after paint or it lands under the input row.
  const scrollToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(scrollToLatest);
    return () => window.cancelAnimationFrame(frame);
  }, [messages, sending, open, scrollToLatest]);

  // Autofocus is a desktop courtesy only: on a phone it throws the keyboard up in the
  // middle of the open animation, so the panel is resized before the guest has seen it.
  useEffect(() => {
    if (!open) return;
    const finePointer = window.matchMedia
      && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer) return;
    inputRef.current?.focus();
  }, [open]);

  // Phones shrink the *visual* viewport when the keyboard opens, and some browsers leave the
  // layout viewport at full height. Publishing both numbers to the panel lets the CSS keep it
  // above the keyboard instead of letting the input row slide underneath it.
  useEffect(() => {
    if (!open && !closing) return undefined;

    const viewport = window.visualViewport;
    let frame = 0;
    let lastHeight = -1;

    const sync = () => {
      frame = 0;
      const node = windowRef.current;
      if (!node) return;
      const height = viewport ? viewport.height : window.innerHeight;
      const keyboard = viewport
        ? Math.max(0, window.innerHeight - (viewport.offsetTop + viewport.height))
        : 0;
      const rounded = Math.round(height);
      node.style.setProperty('--cafe-fox-vvh', `${rounded}px`);
      node.style.setProperty('--cafe-fox-kb', `${Math.round(keyboard)}px`);
      // The visible area only changes on keyboard / rotation, so this is the moment to keep
      // the newest bubble in view — not on every one of iOS' many viewport scroll events.
      if (rounded !== lastHeight) {
        lastHeight = rounded;
        scrollToLatest();
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    const target = viewport || window;
    target.addEventListener('resize', schedule);
    target.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      target.removeEventListener('resize', schedule);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
    };
  }, [open, closing, scrollToLatest]);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosing(false);
  }, []);

  const openChat = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const close = useCallback(() => {
    // The fox goes back to idle and the voice stops right away; only the window lingers,
    // folding away for CLOSE_MS before it unmounts.
    setOpen(false);
    stopSpeech();
    setClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setClosing(false);
    }, CLOSE_MS);
  }, [stopSpeech]);

  // A close that is cut short by navigation still releases its timer.
  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const send = useCallback(async () => {
    const text = draft.trim();
    // `closing` is checked too: the input keeps focus for the half second the window folds
    // away, and Enter during that beat should not post a message into a vanished panel.
    if (!text || sending || closing) return;

    setDraft('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);

    // Started before the request so the thinking beat runs alongside it, not after it.
    const thinking = wait(REPLY_THINKING_MS);

    try {
      const res = await chatBotApi.sendMessage(text);
      await thinking;
      const reply = isRealReply(res) ? res.reply : String(fallbackText(res));
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch (error) {
      await thinking;
      const message = error?.response?.data?.message
        || error?.message
        || 'I could not reach the café assistant. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: String(message) }]);
    } finally {
      setSending(false);
    }
  }, [draft, sending, closing, speak]);

  const handleSubmit = (event) => {
    event.preventDefault();
    send();
  };

  // He stays exactly where he stands while the chat is open: listening while the guest
  // types, thinking while the reply is on its way, talking while the voice plays.
  const foxMood = sending ? 'thinking' : speaking ? 'speaking' : 'listening';

  return (
    <>
      <button
        type="button"
        className={[
          'cafe-fox-launcher',
          hasCartDock ? 'cafe-fox-launcher-cart-active' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          if (!open) {
            openChat();
            return;
          }
          launcherStageRef.current?.poke();
          inputRef.current?.focus();
        }}
        aria-label={open ? 'Poke Finnegan, the café fox' : 'Chat with Finnegan, the café fox'}
        aria-expanded={open}
        title={open ? 'Give Finnegan a poke' : 'Ask Finnegan, the café fox'}
      >
        <span className="cafe-fox-launcher-fox">
          <FoxStage
            state={open ? foxMood : 'idle'}
            speaking={speaking}
            amplitudeRef={amplitudeRef}
            framing="stand"
            showTag={false}
            className="cafe-fox-stage-launcher"
            stageApiRef={launcherStageRef}
            onHover={() => launcherStageRef.current?.gesture('wave', 1.5)}
          />
        </span>
        <span
          className="cafe-fox-thought"
          data-visible={sending ? 'true' : 'false'}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
        </span>
        <span
          className="cafe-fox-launcher-felix-tip"
          id="cafe-fox-launcher-tip"
          role="tooltip"
          aria-hidden={open || undefined}
        >
          I'm Felix — ask me anything.
        </span>
      </button>

      {(open || closing) && (
        <div
          ref={windowRef}
          className={`cafe-fox-window ${hasCartDock ? 'cafe-fox-window-cart-active' : ''}`}
          role="dialog"
          data-closing={closing ? 'true' : 'false'}
          aria-label="Finnegan, the Little Window Café fox"
          aria-hidden={closing ? 'true' : undefined}
        >
          <header className="cafe-fox-header">
            <span className="cafe-fox-header-face" aria-hidden="true">
              <FoxFaceIcon />
            </span>
            <span className="cafe-fox-header-titles">
              <span className="cafe-fox-header-title">Finnegan</span>
              <span className="cafe-fox-header-sub">
                {sending ? 'sniffing out the answer…' : speaking ? 'talking…' : 'Little Window Café fox'}
              </span>
            </span>
            <button
              type="button"
              className="cafe-fox-icon-button"
              onClick={() => setMuted(!muted)}
              aria-pressed={!muted}
              aria-label={muted ? 'Turn the fox voice on' : 'Turn the fox voice off'}
              title={muted ? 'Voice is off — turn it on' : 'Voice is on — turn it off'}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <button
              type="button"
              className="cafe-fox-icon-button"
              onClick={close}
              aria-label="Close chat"
              title="Close chat"
            >
              <X size={18} />
            </button>
          </header>

          <div className="cafe-fox-body">
            <div className="cafe-fox-scroll" ref={scrollRef}>
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                const isLatest = index === messages.length - 1;
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
                    data-speaking={!isUser && isLatest && speaking ? 'true' : undefined}
                    aria-label={isUser ? `You: ${message.content}` : `Finnegan: ${message.content}`}
                  >
                    <span className="chat-bubble-text">{message.content}</span>
                  </div>
                );
              })}
              {sending && <TypingBubble />}
            </div>
          </div>

          <form className="cafe-fox-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask Finnegan about the café or your order"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={sending}
              autoComplete="off"
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!draft.trim() || sending}
              aria-label={sending ? 'Sending message' : 'Send message'}
              title={sending ? 'Sending…' : 'Send message'}
            >
              {sending
                ? <Loader2 className="chat-send-loader" aria-hidden="true" />
                : <Send className="chat-send-icon" size={18} aria-hidden="true" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FoxChatWidget;
