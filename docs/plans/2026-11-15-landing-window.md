# Little Window Café landing rebuild — implementation plan

> **For agentic workers:** work the tasks in order; each ends in a runnable check. Steps use `- [ ]`.

**Goal:** Replace the root landing page (`/`) with an interactive, parallax-led introduction to Little Window Café that keeps booking, ordering and the staff entry points working.

**Architecture:** One page component (`client/src/pages/ProjectLandingPage.jsx`) plus one scoped stylesheet (`client/src/styles/landing-window.css`, prefix `lwc-`). Motion is CSS transforms driven by a single rAF scroll listener, one pointer listener inside the hero window, and one native range input for the plate-scrubbing section. No new dependencies; `BookingModal`, `tableApi`, react-router and the existing Vite/Tailwind setup are reused.

**Tech stack:** React 19, react-router 7, Vite 8, Tailwind v4 (unused by this page), lucide-react, existing `/images/cafe-food-montage.png` photography.

**Spec:** `client/DESIGN.md` (palette, type stack, "follow one plate" concept, reduced-motion rule).

## Global constraints

- Route `/` stays `ProjectLandingPage`; all other routes stay untouched.
- Do not invent address, opening hours, awards, customer counts or menu facts.
- Colours, display face (Bricolage Grotesque), text face (Instrument Sans), mono (DM Mono) come from `premium-redesign.css` tokens.
- Every animation is disabled under `prefers-reduced-motion: reduce`; content stays visible and focusable.
- Visible keyboard focus; 44px minimum tap targets; page readable at 360px wide.

## File structure

- Modify `client/src/pages/ProjectLandingPage.jsx` — page composition, interactions, live table count.
- Create `client/src/styles/landing-window.css` — layout, tokens, motion.
- Modify `CHANGES.md` — one entry describing the rebuild.

## Design decisions (locked)

- **Palette:** room `#0d211a`, room lift `#17392d`, paper `#f3f1e6`, ink `#12241d`, muted `#5a685e`, line `#d3d8c9`, brass `#d8b578`, brass deep `#b78c4d`, leaf `#6d8a63`.
- **Signature:** an arched shopfront window. Dark room outside, warm garden light inside, brass mullions, plate and steam on the sill. The window is the only loud element.
- **Motion verb:** "pass along". Plate travels the rail; garden drifts with scroll; sheen follows the pointer.
- **Copy voice:** sentence case, active, no eyebrow labels, no numbered markers, no middle-dot meta strings.

## Tasks

### Task 1: Hero window and page shell

**Files:** create `client/src/styles/landing-window.css`; modify `client/src/pages/ProjectLandingPage.jsx`.

**Interfaces:**
- Produces: `.lwc-page`, `.lwc-head[data-solid]`, `.lwc-hero`, `.lwc-window`, `[data-parallax="<speed>"]` contract (element reads `--shift` from its parent), `.lwc-btn`, `.lwc-curtain`.

- [ ] **Step 1:** Write the stylesheet with tokens, header, hero grid (type column + window column), arched window, glass layers, mullions, sill plate, steam, hero foot strip.
- [ ] **Step 2:** Compose the hero in the component: header with brand/nav/book, headline "Good food, / a quiet room, / and no hurry.", lede, two actions, window scene with aria-label, foot strip.
- [ ] **Step 3:** Add the scroll listener that toggles `data-solid` on the header and writes `--shift` on `[data-parallax]` elements from their parent's rect.
- [ ] **Step 4:** Add pointer parallax inside the window via `--px` / `--py` custom properties.
- [ ] **Check:** `npm run build` succeeds; no unused imports.

### Task 2: The pass (scrubbable plate rail)

**Interfaces:**
- Produces: `.lwc-pass[data-stage="0..3"]`, `.lwc-rail` with `--p` (0 → 1), `.lwc-plate i`, `.lwc-scene-photo`, `.lwc-stop`.

- [ ] **Step 1:** Define `PASS_STAGES` (label, title, body, signal) in the component.
- [ ] **Step 2:** Mark up rail: track, progress, travelling plate, four stop buttons, transparent range input (`min=0 max=3 step=1`, label "Move the plate through service").
- [ ] **Step 3:** Readout: stage title, body, signal chip; scene photo crop and scale keyed off `data-stage`.
- [ ] **Step 4:** Style focus, active stop, plate rim, and the cooking steam on stage 1.
- [ ] **Check:** clicking a stop, dragging the rail and arrow keys all change the stage; the plate lands on the matching marker.

### Task 3: Parallax gallery

- [ ] **Step 1:** Three panels (savoury / cold / sweet) with montage crops, `data-parallax` at differing speeds, hover expansion and caption reveal.
- [ ] **Step 2:** Stack to a column under 800px with the caption body always visible.
- [ ] **Check:** build passes; no horizontal overflow at 360px.

### Task 4: Booking close, live availability, route hand-off

- [ ] **Step 1:** Fetch tables once; show `n of 6 tables free right now` in the window tag, fall back to static copy on failure.
- [ ] **Step 2:** Booking section with `BookingModal`; footer with café floor + staff links.
- [ ] **Step 3:** "Step inside" closes two shutter panels, then `navigate('/cafe')`; instant navigation under reduced motion. Clear timers on unmount.
- [ ] **Check:** `npm run build`, `npx oxlint src/pages/ProjectLandingPage.jsx`, and one dev-server load of `/`.

## Review focus

- Reduced motion: no transform, no shutter, no travelling plate — all copy still readable.
- Backend down: booking modal shows its own error; hero tag falls back instead of showing "0 of 6".
- 360px: headline does not clip, window keeps its arch, rail stop labels do not overlap.
- Keyboard: header book button, stops, rail, and footer links reachable with visible focus.
- Route change: no scroll listener or timer leaks after navigating to `/cafe`.
