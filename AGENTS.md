# AGENTS.md — Little Window Café

Notes for anyone (human or AI) working on this project: what it does, what already exists, and the
things that will trip you up. It is written to be read top to bottom before you change anything.

## What this project is

Little Window Café is a café ordering system built around QR codes on tables. A guest sits down, scans the
QR code on the table, gets the menu on their phone, orders, pays online, and then watches the order move
through the kitchen on a live tracker. On the staff side there is a console where the owner can watch
orders, manage the menu, look at the tables and read reports.

There is also a fairly elaborate front-of-house layer on top of that: an animated landing page and a 3D
café room that doubles as the public order board. That part is presentation, not business logic, but it is
where most of the visual work in this repo lives.

The client is React 19 with Vite, Tailwind CSS 4, React Router 7 and socket.io-client. The server is
Express 5 with Mongoose 9, Socket.IO 4, JSON web tokens for staff login and Razorpay for payments. Data
lives in MongoDB, either a local instance or an Atlas cluster, and the schema is defined directly in
`server/src/models` with no migration layer.

One thing that is easy to get wrong: the 3D café does not use Three.js from npm. An old copy of Three.js is
checked into `client/public/vendor/three.min.js`, loaded by a plain script tag in `client/index.html`, and
the scene reads it from `window.THREE`. Do not try to `import` from `three`; it is not installed.

## What a guest can do

A guest opens the table menu by scanning the table's QR code, which carries a signed token for that
specific table. The server validates the token, so an order cannot be placed against a table it did not
come from. The menu has 24 Indian café dishes across six categories, a pure-veg filter, and keyword search.
Each dish can be customised — regular or large, paid add-ons like extra cheese or an extra shot, and a free
text note for the kitchen — and the cart shows the full bill breakdown including CGST, SGST and service
charge.

Payment goes through Razorpay. Prices are always recalculated on the server, so a tampered browser cannot
change what is charged, and the payment signature is verified with HMAC-SHA256 before an order is allowed
into the kitchen. When real Razorpay keys are not configured the server falls back to a sandbox mode so the
whole flow can still be demonstrated.

After paying, the guest is on the tracker page at `/track/:token`, which shows a four-step rail
(received, accepted, cooking, ready) with a progress bar, the current stage with a running clock, and an
estimated ready time that turns into an overdue note if the kitchen falls behind. The page updates itself
over the socket as staff move the order along, and re-checks every twenty seconds in case a message was
missed.

At the table, visitors can also reserve a table up to ninety days ahead, from the landing page. The server
checks capacity and availability, and an unclaimed reservation is released half an hour after the booking
time.

## What staff can do

Staff sign in at `/admin/login`, which offers one-click presets for the demo accounts. The console at
`/admin` has four areas: an overview with key numbers, a live orders table, the table floor plan with QR
codes, and the menu catalog, plus reports on sales and popular dishes.

The live orders table is the operational heart of it. Each row shows the order, its table, the items and
the money, and a progress cell with the current stage, a bar, a clock and either an estimated ready time or
an overdue flag. In the inspector, every dish on the ticket has a tick the kitchen can use as it cooks, and
a bumped ticket has a button to send it back to the kitchen. Where an order is waiting on a decision there is a button to send it to the kitchen or
start cooking. Clicking a row opens an inspector with the full order, the payment details and the timeline
of every status change with the time and any note attached. The list refreshes every fifteen seconds
because the progress percentage is based on time, so it moves even when nobody clicks anything.

Moving an order forward is the normal path: waiting for payment, then new, accepted, preparing, ready, and
finally completed, with cancelled as the alternative ending. A ready order can also be sent back to
preparing when it was bumped too early; that clears the ready time, restarts the cooking clock and gives
the order a fresh estimate. Each move stamps a timestamp on the order and adds a row to the order history,
which is what the timeline reads.

The tables area shows six tables and can generate and download the QR code for each one, clear a table
when guests leave, and open a simulation link that behaves like the guest's phone. There is also a
printable page at `/admin/print-tables` for producing physical QR standees.

The console is split into `client/src/components/admin/`, one file per job, so the page itself is only
data loading, socket wiring, handlers and layout:

- `OverviewTab` — the KPI cards, shortcuts and last five orders.
- `OrdersTab` and `OrderProgressCell` — the filter pills, the live table, and the per-row progress readout.
- `OrderInspectorDialog` — the order drawer with its timeline, dish ticks and actions.
- `TablesTab` — the floor: table QR codes, seating, freeing, standees.
- `MenuTab` — the catalog with stock toggles, edit and delete.
- `ReportsTab` — the sales numbers.
- `TableQrDialog`, `MenuItemDialog` and `ActionDialog` — the three modals.

New console work follows the same shape: a component in that folder, props in, no shared mutable state.

## What visitors see on the website

The landing page at `/` is the introduction to the brand. It has an arched café window with layered
parallax that follows the pointer, a light switch that changes the time of day between morning, golden
hour and dusk, a scrubbing rail through the service story, a gallery, and a booking form. At the end, the
window itself opens outward and the page travels into the café, handing over to `/cafe`.

The café room at `/cafe` is the 3D scene: a planted courtyard, a counter with staff, tables, a concealed
kitchen and a live order board. Tables in the scene can be clicked, guests are animated from the counter to
their table as orders progress, and the whole room serves as the public display for the dining area.

Both of these are cosmetic and can be changed freely, as long as the arrivals keep working: the mist that
clears on arrival is drawn with gradients and opacity rather than a full-screen blur filter, because the
filter version stuttered on modest hardware. Keep it that way. Reduced-motion preferences are already
respected in `landing-window.css` and `customer-order.css`, so put new animation inside those rules.

## How to run it

Install and seed the server once, then start both halves:

```
cd server
npm install
npm run seed
npm run dev
```

```
cd client
npm install
npm run dev
```

The server is supposed to listen on port 5000 and the client on 5173, with Vite proxying `/api`,
`/socket.io`, `/uploads` and `/qrcodes` across to the server.

There is a catch in `server/.env`: it sets `PORT=0`, which tells the server to pick a random free port.
Everything then looks broken because the client is talking to 5000 and nothing is there. Start the server
with the port set explicitly instead:

```
PORT=5000 node src/server.js
```

Because of the way the environment file is loaded, a port set in the shell wins over the one in the file,
so this override is enough and you do not need to edit the file.

Demo accounts are `admin@cafe.com` with `admin123` for the owner, `counter@cafe.com` with `counter123` for
counter staff, and `kitchen@cafe.com` with `kitchen123` for the kitchen.

There is no test suite. The usual check is to run `npm run build` and `npx oxlint <file>` in `client/`, and
then exercise the endpoint you touched against the running server.

## Which pages exist

The routes are declared in `client/src/App.jsx`.

The landing page at `/` is `ProjectLandingPage`, and `/cafe` is `CafePage` with the 3D scene.

The guest menu is `CustomerMenuPage`, and it answers to both `/table/:token` and `/order/:token`. The
tracker is `OrderStatusPage` at `/track/:token`.

`/kitchen` and `/display` used to be their own pages and are now plain redirects to `/cafe`, because the
café room absorbed both jobs.

Staff pages are `/admin/login` for `AdminLoginPage`, `/admin` for `AdminDashboardPage`, and
`/admin/print-tables` for the printable QR cards.

Three page files are no longer reachable and are not imported anywhere: `KitchenKDSPage.jsx`,
`PublicDisplayPage.jsx` and the old `LandingPage.jsx`. They still build, so nothing complains, but do not
add features there unless you first give them a route.

## Where the server keeps things

Controllers live in `server/src/controllers` and are named by area: authentication, menu, orders, payments,
settings and tables. The routes in `server/src/routes` are mounted under `/api` by `app.js`, with a health
check at `/api/health`.

The models in `server/src/models` cover users, dining tables, QR tokens, menu categories and items, orders,
order history, payments, refunds, café settings, notifications and an audit log.

Two pieces of middleware matter in day-to-day work. The auth middleware provides `protect` and
`authorize`, with roles for owner, counter, kitchen and display. The QR middleware validates a table token
and also accepts the demo tokens `demo-token-TBL-001` through `-006`, which is how the demo tables work
without real printed codes.

## How order progress is decided

Everything about "how far along is this order" comes from one function, `describeProgress` in
`server/src/services/progressService.js`. It takes an order and the current time and returns nine things: the stage, a human label, a percentage, an estimated ready time, whether it is
late and by how much, how many dishes are ticked off against how many there are, and how long it has been
in the current stage.

The percentage follows fixed slices of the timeline. A new order sits at zero to eight percent, an accepted
order at eight to sixteen, cooking runs from sixteen to ninety and is interpolated across the estimated
prep time, a ready order sits at ninety to ninety-six, and a completed one at one hundred.

Cooking is the interesting slice. Each dish on the order can be ticked off by the kitchen through
`PATCH /api/orders/:id/items/:itemId`, which takes `{ isDone }` and simply flips the dish when the body is
empty. Whichever is further along inside the cooking slice wins — the clock or the ticked dishes — so a
ticket that is genuinely half cooked reads half cooked, and an order nobody touches still creeps forward.
Un-ticking a dish pulls the bar back, which is correct: that dish is in the pan again. The endpoint
refuses once the order is closed. Orders still
waiting for payment show zero, and a cancelled order keeps the value it had reached so the bar does not jump
backwards.

That descriptor is attached to every order payload the API returns — the guest's orders, the admin list,
the kitchen list, the display list, and the responses to status changes and cancellations — and it travels
along on the socket messages too. This is deliberate: clients display what the server calculated and never
work out percentages or dates themselves.

The timeline behind the order inspector comes from `GET /api/orders/:id/timeline`, which reads the order
history and returns a list of entries, each with the stage it moved to, a label for that stage, the time,
and any note. Rows are labelled by the server so the admin page does not need its own copy of the stage
names.

## Live updates

The socket layer in `server/src/sockets/index.js` puts connections into rooms. There is a room each for the
kitchen, the admin console and the display, plus a room per order and a room per table token.

The events are `order:new` when an order is created, `order:paid` after payment, `order:statusUpdate` and
`order:status:changed` as staff move an order, `order:items:update` when a dish is ticked off or put back,
`order:cancelled`, `order:served` and `table:statusUpdate` when a table changes state.

Clients join rooms with `joinRoom` from `context/SocketContext`, which emits `join:room` to the server. The
guest tracker joins the room for each order it is showing, the admin console listens on the admin room, and
the kitchen listens on the kitchen room. The guest tracker also keeps a twenty-second poll and the admin
list a fifteen-second one, purely as a safety net for missed messages and to let time-based percentages
move.

## House rules

Add a numbered entry to `CHANGES.md` for every change, saying what changed, why, and which files were
touched. The file is the running history of the project and it is expected to stay current.

CSS is organised by prefix so styles do not leak between pages: `lwc-` is the landing page, `order-` is the
guest order pages, `cafe-` is the 3D world, and `pixel-` and `staff-` belong to the console. Design tokens
live in `styles/design-system.css`.

All API calls go through `client/src/api/apiServices.js`, which is grouped by area and built on
`api/axios.js`. The axios instance resolves to `response.data` and rejects with a plain `Error` carrying
the server's message, so callers can rely on that shape.

For formatting money and dates use `client/src/utils/formatters.js`, which already has rupees, date and
time formatting, elapsed minutes, a duration formatter and the status colour configuration. Please do not
add a fourth way to format a time.

One Tailwind quirk in this setup: `bg-gradient-to-r` compiles to no background image at all, while other
gradients work. For progress bar fills, use an inline `linear-gradient` in the style attribute.

Finally, `PATCH /api/orders/:id/status` is deliberately unauthenticated. The public café room changes
orders without anyone logged in, so adding `protect` to that route breaks the room. If it needs securing,
give the room a real session first.

Two smaller things worth knowing. The guest tracking endpoint only returns orders from the last twenty-four
hours, so older seeded orders will not appear on the tracker. And the overview numbers in the console come
from a period-filtered stats endpoint, which is independent of the live orders list, so the two can
legitimately disagree — for example zero revenue today while dozens of past orders are listed.

## Where the history lives

`CHANGES.md` is the full, numbered record of what has been built and why. The landing page plan is in
`docs/plans/2026-11-15-landing-window.md`. If you are unsure how something came to be the way it is, those
two files will usually tell you.
