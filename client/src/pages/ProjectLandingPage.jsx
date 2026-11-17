import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, CalendarDays, Coffee } from 'lucide-react';
import BookingModal from '../components/cafe/BookingModal';
import { tableApi } from '../api/apiServices';
import '../styles/landing-window.css';

const PASS_STAGES = [
  {
    label: 'At your table',
    short: 'Seated',
    title: 'You choose, seated.',
    body: 'Scan the card on your table, read the menu, and send your order without getting up. The cart shows the full bill before you pay.',
    signal: 'Table 04 · menu open',
    scene: 'Your table',
  },
  {
    label: 'In the kitchen',
    short: 'Kitchen',
    title: 'Cooked when you order it.',
    body: 'The ticket reaches the kitchen the moment it is paid for, with your notes and any extras. Nothing is started ahead of time.',
    signal: 'Ticket 118 · cooking',
    scene: 'On the stove',
  },
  {
    label: 'At the pass',
    short: 'Pass',
    title: 'Ready at the counter.',
    body: 'The pass chimes and the screen by the counter calls your ticket. The same board shows what is cooking and what is waiting.',
    signal: 'Ticket 118 · ready',
    scene: 'At the pass',
  },
  {
    label: 'Back with you',
    short: 'Served',
    title: 'Back at your table.',
    body: 'Collect your plate and stay as long as you like. There is no queue at the counter and nothing left to settle.',
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

const LIGHTS = [
  { id: 'morning', label: 'Morning' },
  { id: 'golden', label: 'Golden' },
  { id: 'dusk', label: 'Dusk' },
];

const ENTRY_ROUTE = 'M92 566C226 566 268 480 400 480S568 524 682 456S836 366 904 356';

function ProjectLandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const windowRef = useRef(null);
  const entryTimers = useRef([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [light, setLight] = useState('golden');
  const [freeTables, setFreeTables] = useState(null);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    let active = true;
    tableApi
      .getTables()
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response?.data)
          ? response.data
          : (response?.data?.tables || response?.tables || []);
        if (list.length) {
          setFreeTables(list.filter((table) => table.status === 'available').length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const head = root?.querySelector('.lwc-head');
    const hero = root?.querySelector('.lwc-hero');
    const layers = Array.from(root?.querySelectorAll('[data-parallax]') || []);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const paint = () => {
      frame = 0;
      const y = window.scrollY;
      if (head) head.dataset.solid = y > 92 ? 'true' : 'false';
      if (!hero) return;
      const progress = Math.min(1, Math.max(0, y / Math.max(1, hero.offsetHeight)));
      hero.style.setProperty('--hero-p', progress.toFixed(4));
      if (reduceMotion) return;

      const middle = window.innerHeight / 2;
      layers.forEach((layer) => {
        const host = layer.parentElement;
        if (!host) return;
        const rect = host.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const speed = Number(layer.dataset.parallax) || 0;
        const shift = -(rect.top + rect.height / 2 - middle) * speed;
        layer.style.setProperty('--shift', `${shift.toFixed(1)}px`);
      });
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

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
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !windowRef.current) {
      navigate('/cafe', { state: { fromLandingRide: true } });
      return;
    }
    if (entry) return;
    const rect = windowRef.current.getBoundingClientRect();
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
    entryTimers.current = [
      window.setTimeout(() => setEntry((current) => (current ? { ...current, phase: 'expanded' } : current)), 110),
      window.setTimeout(() => setEntry((current) => (current ? { ...current, phase: 'bloom' } : current)), 1240),
      window.setTimeout(() => navigate('/cafe', { state: { fromLandingRide: true } }), 1720),
    ];
  };

  const active = PASS_STAGES[stage];
  const tagCopy = freeTables === null
    ? 'Table-side ordering, no queue at the counter'
    : `${freeTables} of 6 tables free right now`;

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
        <button className="lwc-head-action" type="button" onClick={() => setBookingOpen(true)}>
          Book a table
          <ArrowRight size={15} />
        </button>
        <button className="lwc-head-compact" type="button" onClick={() => setBookingOpen(true)} aria-label="Book a table">
          <CalendarDays size={17} />
        </button>
      </header>

      <section className="lwc-hero" id="lwc-main" data-light={light} aria-labelledby="lwc-title">
        <span className="lwc-room-tint" aria-hidden="true" />

        <div className="lwc-hero-copy">
          <p className="lwc-hero-note">A small café in the garden, open for short coffees and long afternoons.</p>
          <h1 id="lwc-title">
            <span style={{ '--i': 0 }}>Good food,</span>
            <span style={{ '--i': 1 }}>a quiet room,</span>
            <span style={{ '--i': 2 }}>and no hurry.</span>
          </h1>
          <p className="lwc-hero-lede">
            Order from the card on your table and follow your plate to the kitchen pass. Six tables, one kitchen,
            and a garden to sit in while you wait.
          </p>
          <div className="lwc-hero-actions">
            <button className="lwc-btn" type="button" onClick={() => setBookingOpen(true)}>
              Book a table
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <div className="lwc-window-wrap">
        <div className="lwc-window" ref={windowRef}>
          <div className="lwc-glass" role="img" aria-label="The café's arched window: garden light, a plate of food on the sill, and grasses moving in the breeze.">
            <span className="lwc-sky lwc-sky-morning" aria-hidden="true" />
            <span className="lwc-sky lwc-sky-golden" aria-hidden="true" />
            <span className="lwc-sky lwc-sky-dusk" aria-hidden="true" />
            <div className="lwc-sun" />
            <div className="lwc-glass-light" />
            <div className="lwc-canopy" data-parallax="0.085" aria-hidden="true">
              <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMin slice">
                <g fill="#527750" opacity="0.62">
                  <ellipse cx="26" cy="18" rx="92" ry="56" />
                  <ellipse cx="104" cy="-6" rx="68" ry="46" />
                  <ellipse cx="374" cy="14" rx="102" ry="52" />
                  <ellipse cx="312" cy="-10" rx="66" ry="44" />
                  <ellipse cx="212" cy="-24" rx="102" ry="42" />
                </g>
                <g fill="#2f4c36" opacity="0.5">
                  <ellipse cx="-2" cy="58" rx="68" ry="40" />
                  <ellipse cx="398" cy="64" rx="76" ry="38" />
                  <ellipse cx="188" cy="-12" rx="54" ry="30" />
                </g>
              </svg>
            </div>
            <svg className="lwc-garden" data-parallax="0.05" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <defs>
                <linearGradient id="lwc-garden-haze" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#93a47d" stopOpacity="0" />
                  <stop offset="0.6" stopColor="#6d8659" stopOpacity="0.32" />
                  <stop offset="1" stopColor="#4f6b45" stopOpacity="0.62" />
                </linearGradient>
              </defs>
              <g stroke="#7e9470" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.34">
                <path d="M36 200c-2-48 4-78 12-96" />
                <path d="M104 200c-4-44 2-72 10-92" />
                <path d="M172 200c-3-52 3-84 11-104" />
                <path d="M238 200c-3-46 3-76 11-96" />
                <path d="M306 200c-4-50 2-80 10-100" />
                <path d="M370 200c-3-42 3-70 11-90" />
              </g>
              <rect y="104" width="400" height="96" fill="url(#lwc-garden-haze)" />
              <g stroke="#3f5c3e" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7">
                <path d="M8 200c-3-52 3-88 10-112" />
                <path d="M22 200c-2-40 2-68 8-86" />
                <path d="M37 200c-3-60 3-98 11-122" />
                <path d="M52 200c-2-34 2-58 7-74" />
                <path d="M67 200c-3-46 3-78 10-98" />
                <path d="M82 200c-2-30 2-52 7-66" />
                <path d="M98 200c-3-56 3-92 11-114" />
                <path d="M113 200c-2-38 2-64 8-82" />
                <path d="M128 200c-3-48 3-80 10-100" />
                <path d="M144 200c-2-32 2-54 7-70" />
                <path d="M159 200c-3-58 3-96 11-118" />
                <path d="M175 200c-2-42 2-70 8-88" />
                <path d="M190 200c-3-36 3-62 10-78" />
                <path d="M206 200c-2-50 2-84 7-104" />
                <path d="M221 200c-3-30 3-52 11-66" />
                <path d="M237 200c-2-44 2-74 8-94" />
                <path d="M252 200c-3-54 3-90 10-110" />
                <path d="M268 200c-2-34 2-58 7-74" />
                <path d="M283 200c-3-48 3-80 11-100" />
                <path d="M299 200c-2-38 2-66 8-84" />
                <path d="M314 200c-3-60 3-98 10-120" />
                <path d="M330 200c-2-32 2-54 7-68" />
                <path d="M345 200c-3-44 3-74 11-92" />
                <path d="M361 200c-2-36 2-62 8-78" />
                <path d="M376 200c-3-52 3-86 10-106" />
                <path d="M391 200c-2-40 2-68 8-86" />
              </g>
              <g fill="#3f5c3e" opacity="0.72">
                <ellipse cx="18" cy="88" rx="4" ry="8" transform="rotate(-12 18 88)" />
                <ellipse cx="48" cy="78" rx="4" ry="8" transform="rotate(9 48 78)" />
                <ellipse cx="109" cy="118" rx="3.6" ry="7" transform="rotate(-9 109 118)" />
                <ellipse cx="170" cy="84" rx="4" ry="8" transform="rotate(13 170 84)" />
                <ellipse cx="245" cy="106" rx="4" ry="8" transform="rotate(-14 245 106)" />
                <ellipse cx="324" cy="80" rx="4" ry="8" transform="rotate(10 324 80)" />
                <ellipse cx="384" cy="114" rx="3.6" ry="7" transform="rotate(-11 384 114)" />
              </g>
              <g stroke="#3a563a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55">
                <path d="M206 46q7-7 14 0M220 46q7-7 14 0" />
                <path d="M250 30q5-5 10 0M260 30q5-5 10 0" />
                <path d="M168 26q5-5 10 0M178 26q5-5 10 0" />
              </g>
            </svg>
            <div className="lwc-glass-sheen" />
            <div className="lwc-vignette" />
          </div>

          <div className="lwc-sill" aria-hidden="true">
            <div className="lwc-sill-plate" data-parallax="-0.035" />
          </div>
          <div className="lwc-steam" aria-hidden="true"><i /><i /><i /></div>
          <div className="lwc-mullions" aria-hidden="true"><i /><i /></div>
          <button className="lwc-window-enter" type="button" onClick={stepInside} disabled={Boolean(entry)}>
            <span className="lwc-door-lamp" aria-hidden="true" />
            Step inside the café
            <ArrowDown size={16} />
          </button>
          <p className="lwc-window-tag"><i aria-hidden="true" />{tagCopy}</p>
        </div>
        </div>

        <div className="lwc-hero-foot">
          <span>Reservations held live against six tables</span>
          <div className="lwc-light" role="group" aria-label="Change the light in the window">
            {LIGHTS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="lwc-light-btn"
                aria-pressed={light === option.id}
                onClick={() => setLight(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span>Scroll to follow a plate <ArrowDown size={13} /></span>
        </div>
      </section>

      <section className="lwc-intro" id="the-room" aria-labelledby="lwc-room-title">
        <h2 id="lwc-room-title">A small room, warm plates, and no reason to rush the afternoon.</h2>
        <aside>
          <b>How it works</b>
          <p>
            Every table has its own card. Scanning it opens the menu for that seat, so food arrives where you are
            sitting. Book ahead and the table is held for thirty minutes past your time.
          </p>
        </aside>
      </section>

      <section className="lwc-pass" id="the-pass" data-stage={stage} aria-labelledby="lwc-pass-title">
        <div className="lwc-pass-head">
          <h2 id="lwc-pass-title">Follow one plate.</h2>
          <p>Four moments between your chair and the pass. Drag the rail, or use the arrow keys, to move through them.</p>
        </div>

        <div className="lwc-rail" style={{ '--p': stage / (PASS_STAGES.length - 1) }}>
          <div className="lwc-rail-track" />
          <div className="lwc-rail-progress" />
          <div className="lwc-rail-marks" aria-hidden="true">
            {PASS_STAGES.map((step, index) => (
              <i key={step.label} style={{ left: `${(index / (PASS_STAGES.length - 1)) * 100}%` }} />
            ))}
          </div>
          <div className="lwc-plate" aria-hidden="true"><i /></div>
          <input
            className="lwc-scrub"
            type="range"
            min="0"
            max={PASS_STAGES.length - 1}
            step="1"
            value={stage}
            onChange={(event) => setStage(Number(event.target.value))}
            aria-label="Move the plate through service"
            aria-valuetext={active.label}
          />
        </div>

        <div className="lwc-stops">
          {PASS_STAGES.map((step, index) => (
            <button
              key={step.label}
              type="button"
              className="lwc-stop"
              data-edge={index === 0 ? 'start' : index === PASS_STAGES.length - 1 ? 'end' : 'middle'}
              data-short={step.short}
              aria-current={index === stage ? 'true' : 'false'}
              onClick={() => setStage(index)}
              style={{
                left: `${(index / (PASS_STAGES.length - 1)) * 100}%`,
                transform: index === 0 ? 'none' : index === PASS_STAGES.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {step.label}
            </button>
          ))}
        </div>

        <div className="lwc-pass-body">
          <div className="lwc-pass-copy" aria-live="polite">
            <h3>{active.title}</h3>
            <p>{active.body}</p>
            <span className="lwc-signal"><i aria-hidden="true" />{active.signal}</span>
          </div>
          <div className="lwc-pass-scene">
            <div className="lwc-scene-photo" />
            <div className="lwc-cook" aria-hidden="true"><i /><i /><i /></div>
            <span className="lwc-scene-tag">{active.scene}</span>
          </div>
        </div>
      </section>

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
            <button className="lwc-btn" type="button" onClick={() => setBookingOpen(true)}>
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
            <button type="button" className="lwc-foot-link" onClick={stepInside} disabled={Boolean(entry)}>
              Café floor
            </button>
            <Link to="/admin/login">Staff sign in</Link>
          </nav>
        </div>
      </section>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
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
