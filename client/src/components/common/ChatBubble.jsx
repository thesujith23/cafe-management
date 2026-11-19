import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Loader2, Send } from 'lucide-react';
const ChatBubbleIcon = MessageCircle;
import { chatBotApi } from '../../api/apiServices';

const EMPTY = {
  role: 'assistant',
  content: 'Hi, I am the Little Window Café assistant. Ask me about the menu, ordering, payments, or how to find your order.',
};

const Sleep = ({ visible }) => {
  if (!visible) return null;
  return <Loader2 className="chat-send-loader" aria-hidden="true" />;
};

const TypingBubble = () => (
  <div
    className="chat-bubble chat-bubble-assistant chat-typing"
    role="status"
    aria-live="polite"
    aria-label="Assistant is typing"
    title="Assistant is typing…"
  >
    <span className="chat-typing-dot" />
    <span className="chat-typing-dot" />
    <span className="chat-typing-dot" />
  </div>
);

const isRealReply = (res) => {
  if (!res || typeof res !== 'object') return false;
  if (res.success === true && typeof res.reply === 'string' && res.reply.trim()) return true;
  if (typeof res.reply === 'string' && res.reply.trim()) return true;
  return false;
};

const getPlaceholderFallback = (res) => {
  return (
    res?.message ||
    res?.error?.message ||
    'I am not available right now. Please try again in a moment.'
  );
};

const ChatBubble = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([EMPTY]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // `.chat-scroll` is the element that actually scrolls (`.chat-body` is overflow: hidden),
  // so the newest reply was landing below the fold. Scroll the right box, after paint.
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

  useEffect(() => {
    if (!open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      const res = await chatBotApi.sendMessage(text);

      if (isRealReply(res)) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      } else {
        const fallback = getPlaceholderFallback(res);
        setMessages((prev) => [...prev, { role: 'assistant', content: String(fallback || 'I am not available right now. Please try again in a moment.') }]);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'I could not reach the café assistant. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: String(message) }]);
    } finally {
      setSending(false);
    }
  }, [draft, sending]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const bubbles = messages.map((message, index) => {
    const isUser = message.role === 'user';
    return (
      <div
        key={index}
        className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
        title={message.content}
        aria-label={isUser ? `You: ${message.content}` : `Assistant: ${message.content}`}
      >
        <span className="chat-bubble-text">{message.content}</span>
      </div>
    );
  });

  return (
    <>
      <button
        type="button"
        className={`chat-launcher ${sending ? 'chat-launcher-busy' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        title={open ? 'Close the café chat' : 'Open the café chat'}
      >
        <span className="chat-launcher-ring" aria-hidden="true" />
        <ChatBubbleIcon className="chat-launcher-icon" aria-hidden="true" />
        <span className="chat-launcher-label">Chat</span>
      </button>

      {open && (
        <div className="chat-window" role="dialog" aria-label="Little Window Café chat">
          <div className="chat-header">
            <span className="chat-header-avatar" aria-hidden="true">☕</span>
            <span className="chat-header-titles">
              <span className="chat-header-title">Little Window Café</span>
              <span className="chat-header-sub">
                {sending ? (
                  <span className="chat-header-typing">
                    <span className="chat-header-typing-dot" />
                    <span className="chat-header-typing-dot" />
                    <span className="chat-header-typing-dot" />
                    <span className="chat-header-typing-text">brewing a reply…</span>
                  </span>
                ) : (
                  'Ordering assistant'
                )}
              </span>
            </span>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="chat-body">
            <div className="chat-scroll" ref={scrollRef}>
              {bubbles}
              {sending && <TypingBubble />}
            </div>
          </div>

          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask about the café, menu, or your order"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              autoComplete="off"
              aria-label="Chat message"
            />
            <button
              type="button"
              className="chat-send"
              onClick={send}
              disabled={!draft.trim() || sending}
              aria-label={sending ? 'Sending message' : 'Send message'}
              title={sending ? 'Sending…' : 'Send message'}
            >
              {sending ? <Loader2 className="chat-send-loader" aria-hidden="true" /> : <Send className="chat-send-icon" size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBubble;
