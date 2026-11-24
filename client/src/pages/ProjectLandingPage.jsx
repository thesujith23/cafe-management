import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, CalendarDays, Coffee } from 'lucide-react';
import BookingModal from '../components/cafe/BookingModal';
import { tableApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import { summariseTables } from '../utils/tableAvailability';
import '../styles/landing-window.css';

const PASS_STAGES = [
  {
    label: 'At your table',
    short: 'Seated',
    time: '0–2 min',
    title: 'You choose, seated.',
    body: 'The card on your table opens the menu for that seat — not the whole room. Pick what you want, add a note if you need one, and see the full bill before you pay.',
    facts: [
      { key: 'You', value: 'Scan the card, choose, pay once.' },
      { key: 'The room', value: 'Your table stays yours while you order.' },
    ],
    image: '/images/menu/weekend-brunch-platter.jpg',
    signal: 'Table 04 · menu open',
    scene: 'Your table',
  },
  {
    label: 'In the kitchen',
    short: 'Kitchen',
    time: '6–9 min',
    title: 'Cooked when you order it.',
    body: 'The ticket prints the moment the payment clears, with your notes and any extras. A cook accepts it and the timer starts — nothing is cooked ahead and nothing waits under a lamp.',
    facts: [
      { key: 'You', value: 'Nothing to do. Stay where you are.' },
      { key: 'The kitchen', value: 'Accept, cook, plate — in that order.' },
    ],
    image: '/images/menu/paneer-tikka-masala.jpg',
    signal: 'Ticket 118 · cooking',
    scene: 'On the stove',
  },
  {
    label: 'At the pass',
    short: 'Pass',
    time: 'Ready',
    title: 'The pass calls your ticket.',
    body: 'When the plate is dressed the pass marks the ticket ready. The screen above the counter calls that number, and the same board still shows everything cooking behind it.',
    facts: [
      { key: 'You', value: 'Watch for ticket 118 on the counter screen.' },
      { key: 'The pass', value: 'One plate, checked, set down hot.' },
    ],
    image: '/images/menu/masala-dosa.jpg',
    signal: 'Ticket 118 · ready',
    scene: 'At the pass',
  },
  {
    label: 'Back with you',
    short: 'Served',
    time: '1 min',
    title: 'Back at your table.',
    body: 'Collect your plate when it is called and take it back to your seat. The bill was settled with the order, so there is nothing left to ask for at the end.',
    facts: [
      { key: 'You', value: 'Collect, eat, stay as long as you like.' },
      { key: 'The room', value: 'Nothing left to settle at the end.' },
    ],
    image: '/images/menu/chicken-biryani.jpg',
    signal: 'Table 04 · served',
    scene: 'Back at the table',
  },
];

const GALLERY = [
  { crop: '0', title: 'A full plate', body: 'Curry, rice and bread, sent from the kitchen while everything is still hot.' },
  { crop: '1', title: 'Straight off the griddle', body: 'Dosa folded at the pass, with sambar and chutney on the side.' },
  { crop: '2', title: 'Something cold', body: 'Blended mango, poured at the counter and carried to your table.' },
  { crop: '3', title: 'The sweet end', body: 'A small finish, made in the same kitchen, on the same tray.' },
];

const ENTRY_ROUTE = 'M92 566C226 566 268 480 400 480S568 524 682 456S836 366 904 356';

// Where the plate sits at each stop of the service line, in percent of the track.
// The curve below runs through these same four points, so the plate never drifts
// off the line it is travelling on.
const PASS_POINTS = [
  { left: 50, top: 0 },
  { left: 20, top: 33.333 },
  { left: 80, top: 66.666 },
  { left: 50, top: 100 },
];
const SERVICE_PATH = 'M50 0 C 8 12 8 24 20 33.333 C 66 46 96 52 80 66.666 C 64 82 54 92 50 100';

function ProjectLandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const windowRef = useRef(null);
  const entryTimers = useRef([]);
  const passRef = useRef(null);
  const passScrollRef = useRef(null);
  const stopRefs = useRef([]);
  const railDrag = useRef(null);
  const stageRef = useRef(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingTable, setBookingTable] = useState('');
  const [stage, setStage] = useState(0);
  const [tables, setTables] = useState(null);
  const [floorOffline, setFloorOffline] = useState(false);
  const [entry, setEntry] = useState(null);
  const [doorOpening, setDoorOpening] = useState(false);
  const { socket } = useSocket();

  // The floor is live: read it once, then follow the socket and re-read whenever the tab
  // comes back, so a guest never reads a count that is an hour old.
  useEffect(() => {
    let active = true;
    const load = () => {
      tableApi
        .getTables()
        .then((response) => {
          if (!active) return;
          const list = Array.isArray(response?.data)
            ? response.data
            : (response?.data?.tables || response?.tables || []);
          setFloorOffline(false);
          if (!list.length) return;
          setTables(list.map((table) => ({
            _id: table._id,
            tableId: table.tableId,
            status: table.status,
          })));
        })
        .catch(() => {
          if (active) setFloorOffline(true);
        });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };

    load();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', load);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', load);
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onTableStatus = (table) => {
      if (!table) return;
      setTables((prev) => {
        if (!prev) return prev;
        const key = table._id || table.tableId;
        const index = prev.findIndex((current) => (current._id || current.tableId) === key);
        if (index === -1) {
          return [...prev, { _id: table._id, tableId: table.tableId, status: table.status }];
        }
        const next = [...prev];
        next[index] = { ...next[index], status: table.status };
        return next;
      });
    };

    socket.on('table:statusUpdate', onTableStatus);
    return () => socket.off('table:statusUpdate', onTableStatus);
  }, [socket]);

  useEffect(() => {
    const root = rootRef.current;
    const head = root?.querySelector('.lwc-head');
    const hero = root?.querySelector('.lwc-hero');
    const layers = Array.from(root?.querySelectorAll('[data-parallax]') || []).map((layer) => ({
      element: layer,
      host: layer.parentElement,
      speed: Number(layer.dataset.parallax) || 0,
    }));
    const pass = passScrollRef.current;
    const section = passRef.current;
    const plateEl = section?.querySelector('.lwc-service-plate');
    const railPath = section?.querySelector('.lwc-service-line');
    // The rail is a fixed viewBox path, so its length is measured once and reused.
    let pathLength = 0;
    try {
      pathLength = railPath?.getTotalLength?.() || 0;
    } catch {
      pathLength = 0;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const lastStage = PASS_STAGES.length - 1;

    const paint = () => {
      frame = 0;
      const y = window.scrollY;
      const viewportHeight = window.innerHeight;
      const heroHeight = hero?.offsetHeight || 1;
      const layerRects = reduceMotion
        ? []
        : layers.map(({ element, host, speed }) => {
          if (!host) return null;
          const rect = host.getBoundingClientRect();
          return { element, speed, top: rect.top, bottom: rect.bottom, height: rect.height };
        });
      const passRect = pass?.getBoundingClientRect();

      if (head) {
        const isSolid = y > 92;
        if ((head.dataset.solid === 'true') !== isSolid) {
          head.dataset.solid = String(isSolid);
        }
      }

      if (hero && !reduceMotion) {
        const progress = Math.min(1, Math.max(0, y / heroHeight));
        hero.style.setProperty('--hero-p', progress.toFixed(4));
      }

      if (!reduceMotion) {
        const middle = viewportHeight / 2;
        layerRects.forEach((layer) => {
          if (!layer || layer.bottom < -200 || layer.top > viewportHeight + 200) return;
          const shift = -(layer.top + layer.height / 2 - middle) * layer.speed;
          layer.element.style.setProperty('--shift', `${shift.toFixed(1)}px`);
        });
      }

      if (passRect) {
        const span = Math.max(1, passRect.height - viewportHeight);
        const raw = -passRect.top / span;
        const progress = Math.min(1, Math.max(0, (raw - 0.06) / 0.88));
        const next = Math.min(lastStage, Math.max(0, Math.round(progress * lastStage)));
        if (next !== stageRef.current) {
          stageRef.current = next;
          setStage(next);
        }

        // The meter reads straight from this, and the plate is walked along the drawn
        // curve by distance, so its position is the scroll position and nothing else.
        section?.style.setProperty('--pass-p', progress.toFixed(4));
        if (plateEl) {
          if (reduceMotion || !pathLength) {
            const stopPoint = PASS_POINTS[next];
            plateEl.style.setProperty('--plate-x', `${stopPoint.left}%`);
            plateEl.style.setProperty('--plate-y', `${stopPoint.top}%`);
          } else {
            const point = railPath.getPointAtLength(progress * pathLength);
            plateEl.style.setProperty('--plate-x', `${point.x.toFixed(2)}%`);
            plateEl.style.setProperty('--plate-y', `${point.y.toFixed(2)}%`);
          }
        }
      }
    };

    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(paint); };

    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const scene = windowRef.current;
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const move = (event) => {
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      scene.style.setProperty('--px', (x * 2).toFixed(3));
      scene.style.setProperty('--py', (y * 2).toFixed(3));
      scene.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`);
      scene.style.setProperty('--tilt-x', `${(y * -4).toFixed(2)}deg`);
    };
    const reset = () => {
      scene.style.setProperty('--px', '0');
      scene.style.setProperty('--py', '0');
      scene.style.setProperty('--tilt-x', '0deg');
      scene.style.setProperty('--tilt-y', '0deg');
    };

    scene.addEventListener('pointermove', move, { passive: true });
    scene.addEventListener('pointerleave', reset);
    return () => {
      scene.removeEventListener('pointermove', move);
      scene.removeEventListener('pointerleave', reset);
    };
  }, []);

  useEffect(() => () => entryTimers.current.forEach(window.clearTimeout), []);

  const stepInside = () => {
    // Warm the café chunk now, so the hand-over never waits on a lazy route.
    import('./CafePage').catch(() => {});
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !windowRef.current) {
      navigate('/cafe', { state: { fromLandingRide: true } });
      return;
    }
    if (entry || doorOpening) return;

    // The door leads the way in: it swings open first, and only then does the glass
    // start to mist. The hand-over waits for the leaf to be most of the way open, so
    // the room arrives through a door you just opened rather than over a still frame.
    const rect = windowRef.current.getBoundingClientRect();
    setDoorOpening(true);
    entryTimers.current = [
      window.setTimeout(() => {
        setEntry({
          phase: 'at-window',
          style: {
            '--et': `${Math.max(0, Math.round(rect.top))}px`,
            '--er': `${Math.max(0, Math.round(window.innerWidth - rect.right))}px`,
            '--eb': `${Math.max(0, Math.round(window.innerHeight - rect.bottom))}px`,
            '--el': `${Math.max(0, Math.round(rect.left))}px`,
            '--erad': `${Math.round(Math.min(rect.width * 0.3, 240))}px`,
          },
        });
      }, 700),
      window.setTimeout(() => setEntry((current) => (current ? { ...current, phase: 'expanded' } : current)), 760),
      window.setTimeout(() => setEntry((current) => (current ? { ...current, phase: 'bloom' } : current)), 1760),
      // Hand over while the mist is at its brightest, so the café opens out of the mist instead of a cut.
      window.setTimeout(() => navigate('/cafe', { state: { fromLandingRide: true } }), 2200),
    ];
  };

  const openBooking = (tableId = '') => {
    setBookingTable(tableId);
    setBookingOpen(true);
  };

  // Move the page the way the site already scrolls: through Lenis while it is running,
  // the browser otherwise. `smooth: false` is only for dragging the rail.
  const scrollWindowTo = (top, smooth = true) => {
    if (window.__lenis?.scrollTo) {
      window.__lenis.scrollTo(top, { immediate: !smooth });
      return;
    }
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  };

  // The moment buttons move the page, not the state: the scroll position is the
  // single source of truth for which stop the plate is standing at.
  const goToStage = (index) => {
    stageRef.current = index;
    setStage(index);
    const wrapper = passScrollRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    // The pass pins on every width now, so a stop button jumps on phones as well.
    const pinned = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!pinned || span < 120) return;
    // Inverse of the progress mapping in paint(), so a click lands on the stop.
    const target = (index / (PASS_STAGES.length - 1)) * 0.88 + 0.06;
    scrollWindowTo(window.scrollY + rect.top + target * span);
  };

  // Arrow keys walk the rail, Home/End take either end, and focus follows the moment
  // that was chosen so the keyboard does not get lost in the pinned section.
  const handleStopsKeyDown = (event) => {
    const last = PASS_STAGES.length - 1;
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(last, stage + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, stage - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    goToStage(next);
    stopRefs.current[next]?.focus({ preventScroll: true });
  };

  // Drag the rail to scrub the pinned pass with a mouse. Touch keeps native scrolling:
  // fighting a thumb on a pinned section is worse than not offering the gesture.
  const handleRailPointerDown = (event) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    if (event.target.closest('button')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wrapper = passScrollRef.current;
    if (!wrapper) return;
    const span = wrapper.offsetHeight - window.innerHeight;
    if (span < 120) return;
    railDrag.current = { startY: event.clientY, startScroll: window.scrollY, span };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // A synthetic or already-released pointer still drags fine without capture.
    }
    event.preventDefault();
  };

  const handleRailPointerMove = (event) => {
    const drag = railDrag.current;
    if (!drag) return;
    // About half a screen of drag covers the whole pass, so it never feels stuck.
    const perPixel = drag.span / Math.max(240, window.innerHeight * 0.6);
    scrollWindowTo(drag.startScroll + (drag.startY - event.clientY) * perPixel, false);
  };

  const endRailDrag = (event) => {
    if (!railDrag.current) return;
    railDrag.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // The pointer can already be gone after a cancelled drag.
    }
  };

  const active = PASS_STAGES[stage];
  const remainingMoments = PASS_STAGES.length - 1 - stage;
  const passCue = remainingMoments > 0
    ? `${remainingMoments} more ${remainingMoments === 1 ? 'moment' : 'moments'}`
    : 'Keep scrolling \u2193';
  // Same counting rule as the café room and the console (utils/tableAvailability).
  const floor = tables ? summariseTables(tables) : null;
  // The seats under the window read the same live floor as the café and the console,
  // so picking one here opens the booking form already set to that table.
  const seats = (tables || Array.from({ length: 6 }, () => null)).map((table, index) => ({
    key: table?.tableId || `seat-${index + 1}`,
    tableId: table?.tableId || '',
    number: String(index + 1).padStart(2, '0'),
    status: table?.status || 'unknown',
  }));
  const floorCopy = !floor
    ? 'Table availability updates live against the floor'
    : `${floor.free} free · ${floor.taken} taken right now`;

  return (
    <>
    <main className={'lwc-page' + (entry ? ' is-departing' : '')} ref={rootRef}>
      <a className="lwc-skip" href="#lwc-main">Skip to content</a>

      <header className="lwc-head" data-solid="false">
        <Link className="lwc-brand" to="/" aria-label="Little Window Café, home">
          <span className="lwc-brand-mark"><Coffee size={16} strokeWidth={1.8} /></span>
          <span className="lwc-brand-name">Little Window<span>CAFÉ &amp; GARDEN</span></span>
        </Link>
        <nav className="lwc-nav" aria-label="Sections">
          <a href="#the-room">The room</a>
          <a href="#the-pass">The pass</a>
          <Link to="/admin/login">Staff sign in</Link>
        </nav>
        <button className="lwc-head-action" type="button" onClick={() => openBooking()}>
          Book a table
          <ArrowRight size={15} />
        </button>
        <button className="lwc-head-compact" type="button" onClick={() => openBooking()} aria-label="Book a table">
          <CalendarDays size={17} />
        </button>
      </header>

      <section className="lwc-hero" id="lwc-main" data-light="golden" aria-labelledby="lwc-title">
        <span className="lwc-room-tint" aria-hidden="true" />

        <div className="lwc-hero-copy">
          <p className="lwc-hero-note">A small café in the garden, open for short coffees and long afternoons.</p>
          <h1 id="lwc-title">
            <span style={{ '--i': 0 }}>Good food,</span>
            <span style={{ '--i': 1 }}>a quiet room,</span>
            <span style={{ '--i': 2 }}>and no hurry.</span>
          </h1>
          <p className="lwc-hero-lede">
            Six tables, one kitchen, and a garden to sit in while your plate is cooked. Pick a free table below
            and we will hold it for you.
          </p>
          <div className="lwc-hero-actions">
            <button className="lwc-btn" type="button" onClick={() => openBooking()}>
              Book a table
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <div className="lwc-window-wrap">
        <div className={'lwc-window' + (doorOpening ? ' is-opening' : '')} ref={windowRef}>
          <div className="lwc-glass" role="img" aria-label="The café's arched window: a green café door under a striped awning, lamplight on the wall, and a plate of food on the sill.">
            <span className="lwc-sky lwc-sky-golden" aria-hidden="true" />
            <div className="lwc-sun" />
            <div className="lwc-glass-light" />
            {/* The way in: a painted café door behind the glass. It stands ajar on hover,
                the way a door does when someone is already expecting you. */}
            <div className="lwc-door-scene" data-parallax="0.055" aria-hidden="true">
              <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice">
                <defs>
                  <linearGradient id="lwc-door-wall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#e2d7c0" />
                    <stop offset="0.62" stopColor="#cbb99a" />
                    <stop offset="1" stopColor="#ab9776" />
                  </linearGradient>
                  <linearGradient id="lwc-door-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffeccb" />
                    <stop offset="0.55" stopColor="#ffcf93" />
                    <stop offset="1" stopColor="#e99b58" />
                  </linearGradient>
                  <linearGradient id="lwc-door-glass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e6efe6" stopOpacity="0.9" />
                    <stop offset="0.58" stopColor="#b9cfc0" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#7f9f8b" stopOpacity="0.5" />
                  </linearGradient>
                </defs>

                <rect width="400" height="320" fill="url(#lwc-door-wall)" />

                {/* Faint coursing so the wall reads as a wall, never as a pattern. */}
                <g stroke="#9d8967" strokeWidth="1" opacity="0.16">
                  <path d="M0 34h400M0 68h400M0 102h400M0 136h400M0 170h400M0 204h400M0 238h400M0 272h400M0 306h400" />
                  <path d="M60 0v34M180 0v34M300 0v34M120 34v34M240 34v34M360 34v34M60 68v34M180 68v34M300 68v34M120 102v34M240 102v34M360 102v34M60 136v34M180 136v34M300 136v34M120 170v34M240 170v34M360 170v34M60 204v34M180 204v34M300 204v34M120 238v34M240 238v34M360 238v34M60 272v34M180 272v34M300 272v34M120 306v14M240 306v14M360 306v14" />
                </g>

                {/* Awning over the door: forest and cream stripes. */}
                <g className="lwc-door-awning">
                  <path d="M108 44h184l26 44H82z" fill="#2f4a3a" />
                  <path d="M126 44h18l8 44h-18zM162 44h18l8 44h-18zM198 44h18l8 44h-18zM234 44h18l8 44h-18zM270 44h9l6 44h-9z" fill="#f3ebdd" opacity="0.86" />
                  <path d="M82 88h236l-12 16H94z" fill="#24382c" />
                </g>

                {/* Warm light behind the door, the only warm thing on the wall. */}
                <path className="lwc-door-spill" d="M140 320V186a60 60 0 0 1 120 0v134z" fill="url(#lwc-door-glow)" />

                {/* The leaf itself, hinged on the left so it swings inward. */}
                <g className="lwc-door-leaf">
                  <path d="M140 320V186a60 60 0 0 1 120 0v134z" fill="#2f4a3a" stroke="#203327" strokeWidth="3" />
                  <path d="M154 320V190a46 46 0 0 1 92 0v130z" fill="url(#lwc-door-glass)" />
                  <rect x="154" y="232" width="92" height="4" fill="#f3ebdd" opacity="0.62" />
                  <rect x="154" y="286" width="92" height="3" fill="#24382c" opacity="0.5" />
                  <circle cx="236" cy="262" r="4.2" fill="#dcb87a" stroke="#9d7a3c" strokeWidth="1.4" />
                  <rect x="230" y="266" width="4" height="12" rx="2" fill="#c9a468" />
                </g>

                {/* Door frame, drawn over the leaf so the edge reads crisply. */}
                <path d="M137 320V186a63 63 0 0 1 126 0v134" fill="none" stroke="#24382c" strokeWidth="5" strokeLinecap="round" />
                <rect x="120" y="312" width="160" height="8" rx="2" fill="#6a5130" />

                {/* Two wall lanterns either side of the door. */}
                <g fill="#24382c">
                  <rect x="104" y="186" width="18" height="24" rx="3" />
                  <rect x="278" y="186" width="18" height="24" rx="3" />
                </g>
                <g fill="#ffd79a">
                  <rect x="107" y="190" width="12" height="16" rx="2" />
                  <rect x="281" y="190" width="12" height="16" rx="2" />
                </g>
                <g stroke="#24382c" strokeWidth="2" strokeLinecap="round">
                  <path d="M113 186v-8M287 186v-8" />
                </g>

                {/* The open sign, hung from the awning on two thin chains. */}
                <g className="lwc-door-sign">
                  <path d="M176 104v8M224 104v8" stroke="#24382c" strokeWidth="1.6" />
                  <rect x="166" y="112" width="68" height="26" rx="4" fill="#f3ebdd" stroke="#2f4a3a" strokeWidth="2" />
                  <text x="200" y="130" textAnchor="middle" fill="#2f4a3a" fontSize="13" fontWeight="700" letterSpacing="1.6">OPEN</text>
                </g>
              </svg>
            </div>
            <div className="lwc-glass-sheen" />
            <div className="lwc-vignette" />
          </div>

          <div className="lwc-sill" aria-hidden="true">
            <div className="lwc-sill-plate" data-parallax="-0.035" />
          </div>
          <div className="lwc-steam" aria-hidden="true"><i /><i /><i /></div>
          <div className="lwc-mullions" aria-hidden="true"><i /><i /></div>
          <button className="lwc-window-enter" type="button" onClick={stepInside} disabled={Boolean(entry) || doorOpening}>
            <span className="lwc-door-lamp" aria-hidden="true" />
            Step inside the café
            <ArrowDown size={16} />
          </button>
        </div>
        </div>

        <div className="lwc-hero-foot">
          <span className="lwc-floor-line" aria-live="polite"><i aria-hidden="true" />{floorCopy}</span>
          <div className="lwc-seats" role="group" aria-label="Pick a seat to book">
            <span className="lwc-seats-label">
              {tables ? 'Pick a seat' : floorOffline ? 'Floor offline' : 'Checking the floor'}
            </span>
            {seats.map((seat) => {
              const stateLabel = seat.status === 'available'
                ? 'free'
                : seat.status === 'unknown' ? 'not loaded yet' : seat.status;
              return (
                <button
                  key={seat.key}
                  type="button"
                  className="lwc-seat"
                  data-state={seat.status}
                  disabled={seat.status !== 'available'}
                  aria-label={
                    seat.status === 'available'
                      ? `Table ${seat.number} is free — book it`
                      : `Table ${seat.number} is ${stateLabel}`
                  }
                  title={`Table ${seat.number} · ${stateLabel}`}
                  onClick={() => openBooking(seat.tableId)}
                >
                  {seat.number}
                </button>
              );
            })}
            <span className="lwc-seat-legend" aria-hidden="true">
              <i data-state="available" />free<i data-state="occupied" />taken
            </span>
          </div>
          <span className="lwc-hero-scroll">Scroll to follow a plate <ArrowDown size={13} /></span>
        </div>
      </section>

      <section className="lwc-intro" id="the-room" aria-labelledby="lwc-room-title">
        <h2 id="lwc-room-title">A small room, warm plates, and no reason to rush the afternoon.</h2>
        <aside>
          <b>How it works</b>
          <p>
            Choose a table and a time, and we will hold it for thirty minutes past your booking. The kitchen
            keeps the same hours as the room.
          </p>
        </aside>
      </section>

      <div className="lwc-pass-scroll" ref={passScrollRef}>
      <section className="lwc-pass" id="the-pass" ref={passRef} data-stage={stage} aria-labelledby="lwc-pass-title">
        <div className="lwc-pass-head">
          <h2 id="lwc-pass-title">Follow one plate.</h2>
          <p>Four moments between your chair and the pass. Most tickets go from paid to ready in under ten minutes — scroll, or pick a moment, to follow one plate through.</p>
        </div>

        <div
          className="lwc-stops"
          role="group"
          aria-label="Jump to a moment in the service line"
          onKeyDown={handleStopsKeyDown}
        >
          {PASS_STAGES.map((step, index) => (
            <button
              key={step.label}
              type="button"
              className="lwc-stop"
              ref={(element) => { stopRefs.current[index] = element; }}
              aria-current={index === stage ? 'true' : 'false'}
              onClick={() => goToStage(index)}
            >
              <b aria-hidden="true">{String(index + 1).padStart(2, '0')}</b>
              <span>{step.label}</span>
            </button>
          ))}
        </div>

        {/* How much of the pass is left to scroll. Without this a pinned phone screen
            reads as a stuck page rather than a section that is waiting for you. */}
        <div className="lwc-pass-meter" aria-hidden="true">
          <span className="lwc-pass-count">
            {String(stage + 1).padStart(2, '0')}
            <i> / {String(PASS_STAGES.length).padStart(2, '0')}</i>
          </span>
          <span className="lwc-pass-track"><i /></span>
          <span className="lwc-pass-cue">{passCue}</span>
        </div>

        <div className="lwc-pass-body">
          {/* The service line: one plate on a quiet curve through the four stops. It is
              decoration, so it is hidden from assistive tech — the stops and the live
              copy above carry the same information. */}
          <div
            className="lwc-service-track"
            role="group"
            aria-label="The service line: pick a moment"
            onPointerDown={handleRailPointerDown}
            onPointerMove={handleRailPointerMove}
            onPointerUp={endRailDrag}
            onPointerCancel={endRailDrag}
          >
            <div className="lwc-service-inner">
              <svg className="lwc-service-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className="lwc-service-line" d={SERVICE_PATH} pathLength="100" />
                <path
                  className="lwc-service-line is-done"
                  d={SERVICE_PATH}
                  pathLength="100"
                  style={{ strokeDashoffset: 100 - (stage / (PASS_STAGES.length - 1)) * 100 }}
                />
              </svg>
              {PASS_STAGES.map((step, index) => (
                <button
                  key={step.label}
                  type="button"
                  className={'lwc-service-node' + (index <= stage ? ' is-done' : '')}
                  style={{ left: `${PASS_POINTS[index].left}%`, top: `${PASS_POINTS[index].top}%` }}
                  aria-current={index === stage ? 'true' : undefined}
                  aria-label={`Moment ${index + 1}: ${step.label}`}
                  onClick={() => goToStage(index)}
                >
                  <span className="lwc-node-label">{step.short}</span>
                </button>
              ))}
              <button
                type="button"
                className="lwc-service-plate"
                title="Next moment"
                aria-label={stage < PASS_STAGES.length - 1
                  ? `Next moment: ${PASS_STAGES[stage + 1].label}`
                  : 'Last moment of the pass'}
                onClick={() => goToStage(Math.min(PASS_STAGES.length - 1, stage + 1))}
              >
                <i style={{ backgroundImage: `url(${active.image})` }} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="lwc-pass-copy" aria-live="polite">
            {/* Keying on the stage remounts this block, so the copy fades in on every
                stop instead of swapping text in place. */}
            <div className="lwc-pass-copy-in" key={stage}>
              <span className="lwc-stage-time">{active.time}</span>
              <h3>{active.title}</h3>
              <p>{active.body}</p>
              <dl className="lwc-stage-facts">
                {active.facts.map((fact) => (
                  <div key={fact.key}>
                    <dt>{fact.key}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <span className="lwc-signal"><i aria-hidden="true" />{active.signal}</span>
            </div>
          </div>
          <div className="lwc-pass-scene">
            {PASS_STAGES.map((step, index) => (
              <div
                key={step.image}
                className={'lwc-scene-photo' + (index === stage ? ' is-active' : '')}
                style={{ backgroundImage: `url(${step.image})` }}
                role={index === stage ? 'img' : undefined}
                aria-label={index === stage ? `${step.label}: ${step.scene}` : undefined}
                aria-hidden={index === stage ? undefined : 'true'}
              />
            ))}
            <div className="lwc-cook" aria-hidden="true"><i /><i /><i /></div>
            <span className="lwc-scene-tag">{active.scene}</span>
          </div>
        </div>
      </section>
      </div>

      <section className="lwc-gallery" aria-label="Food from the kitchen">
        {GALLERY.map((panel) => (
          <figure className="lwc-panel" data-crop={panel.crop} key={panel.title}>
            <div className="lwc-panel-photo" data-parallax="0.07" />
            <figcaption className="lwc-panel-cap">
              <h3>{panel.title}</h3>
              <p>{panel.body}</p>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="lwc-close" aria-labelledby="lwc-close-title">
        <div className="lwc-close-main">
          <h2 id="lwc-close-title">Make a little room in your day.</h2>
          <div className="lwc-close-side">
            <p>
              Choose a time and we will hold an available table, up to ninety days ahead. The kitchen keeps the
              same hours as the room.
            </p>
            <button className="lwc-btn" type="button" onClick={() => openBooking()}>
              Book a table
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
        <div className="lwc-close-foot">
          <span>Little Window Café · a neighbourhood room</span>
          <nav aria-label="Footer">
            <a href="#the-room">The room</a>
            <a href="#the-pass">The pass</a>
            <button type="button" className="lwc-foot-link" onClick={stepInside} disabled={Boolean(entry) || doorOpening}>
              Café floor
            </button>
            <Link to="/admin/login">Staff sign in</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </section>

      {bookingOpen && (
        <BookingModal
          initialTableId={bookingTable}
          onClose={() => {
            setBookingOpen(false);
            setBookingTable('');
          }}
        />
      )}
    </main>

    {entry && (
      <div className={`lwc-entry is-${entry.phase}`} style={entry.style} aria-hidden="true">
        <div className="lwc-entry-sky" />
        <div className="lwc-entry-route">
          <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet">
            <path className="lwc-route-track" pathLength="100" d={ENTRY_ROUTE} />
            <circle className="lwc-route-start" cx="92" cy="566" r="4.5" />
            <circle className="lwc-route-end" cx="904" cy="356" r="13" />
            <circle className="lwc-route-end-inner" cx="904" cy="356" r="4.5" />
            <text className="lwc-route-label is-a" x="114" y="600">Into the room</text>
            <text className="lwc-route-label is-b" x="892" y="404" textAnchor="end">Your table</text>
            <circle className="lwc-route-dot" r="7.5">
              <animateMotion dur="1.15s" begin="0.16s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0.1 0.2 1" path={ENTRY_ROUTE} />
            </circle>
          </svg>
        </div>
        <div className="lwc-entry-bloom" />
        <div className="lwc-entry-copy">
          <span>Through the window, into the room</span>
          <strong>Your table is this way.</strong>
        </div>
      </div>
    )}
    </>
  );
}

export default ProjectLandingPage;
