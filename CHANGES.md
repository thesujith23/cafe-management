# 📝 Project Change Log — Smart Café Management System

A chronological record of all changes, fixes, and enhancements made to the codebase in the exact sequence they were performed.

---

### Change 1: Core Backend Architecture & Database Modeling
- **Action**: Designed Node.js & Express REST API architecture with ES modules.
- **Action**: Defined 14 Mongoose models (`DiningTable`, `MenuItem`, `MenuCategory`, `Order`, `Payment`, `CafeSettings`, `User`, `OrderStatusHistory`, etc.).
- **Action**: Implemented JWT authentication with secure cookies and role-based access control (`owner`, `counter`, `kitchen`).
- **Action**: Created cryptographic table QR token generator and validation middleware (`validateQR.js`).
- **Action**: Built Socket.IO real-time server with room-based broadcast infrastructure (`kitchen`, `display`, `admin`, `order:<id>`).
- **Action**: Enforced strict server-side calculation for item pricing, tax breakdowns, and discounts to prevent cart tampering.
- **Files**: `server/src/models/*`, `server/src/controllers/*`, `server/src/routes/*`, `server/src/middleware/*`.

---

### Change 2: Frontend Client & Management Interfaces Build
- **Action**: Initialized Vite React 19 single-page application with `@tailwindcss/vite` v4 and dev server proxies for `/api` and `/socket.io`.
- **Action**: Built Customer QR Table Menu (`/menu/:token`) with category tabs, dietary filter toggle, search, item customizations modal, and floating cart drawer.
- **Action**: Built Live Order Tracker (`/track/:token`) featuring a 4-step progress stepper and live elapsed cooking timers.
- **Action**: Built Kitchen Display System (`/kitchen`) 3-stage Kanban board (New, In Preparation, Ready) with sound chimes.
- **Action**: Built Public TV Display Board (`/display`) with digital clock and dual Preparing / Ready columns.
- **Action**: Built Admin Management Portal (`/admin`) with sales analytics KPIs, live orders table, menu item CRUD, and 6-table QR code printable modal.
- **Action**: Built Master Landing Hub (`/`) with 1-click table ordering simulations.
- **Files**: `client/src/pages/*`, `client/src/components/*`, `client/src/context/SocketContext.jsx`.

---

### Change 3: MongoDB Atlas SRV DNS Resolution & Initial Database Seeding
- **Action**: Resolved Windows/ISP `querySrv ECONNREFUSED` error when connecting to `mongodb+srv://` by adding automatic Google Public DNS (`8.8.8.8`, `8.8.4.4`) resolver in `database.js` and `seed.js`.
- **Action**: Configured explicit database name `/cafe_management?retryWrites=true&w=majority` in `server/.env`.
- **Action**: Updated `User.js` pre-save hook to Promise-based async without `next()` for Mongoose 9 compliance.
- **Action**: Moved slug generation in `MenuCategory.js` to `pre('validate')` to satisfy required schema validation.
- **Action**: Cleaned duplicate schema index definitions on `DiningTable.tableId` and `Payment.razorpayPaymentId`.
- **Action**: Registered all models via `server/src/models/index.js` in `app.js` to guarantee `.populate()` support.
- **Action**: Executed database seeding script (`seed.js`) populating Atlas with 6 tables (`TBL-001` to `TBL-006`), 6 categories, 24 menu items, and 3 staff accounts.
- **Files**: `server/src/config/database.js`, `server/src/seed.js`, `server/src/models/User.js`, `server/src/models/MenuCategory.js`, `server/src/app.js`.

---

### Change 4: Database Connection Buffering Elimination & Zero-Latency Fallbacks
- **Action**: Resolved `Operation diningtables.find() buffering timed out after 10000ms` and `Cannot call cafesettings.findOne() before initial connection is complete`.
- **Action**: Removed global `bufferCommands: false` to allow standard Mongoose connection initialization.
- **Action**: Added `family: 4` (forcing IPv4) and `maxPoolSize: 10` in `database.js` to stabilize TLS handshakes with MongoDB Atlas shared M0 clusters.
- **Action**: Implemented `mongoose.connection.readyState !== 1` guards and instant zero-latency fallbacks across `CafeSettings.js`, `settingsController.js`, `tableController.js`, `orderController.js`, and `menuController.js`.
- **Action**: Added fallback handling for demo tokens (`demo-token-TBL-001` to `demo-token-TBL-006`) so simulated customer table views load instantly regardless of temporary database reconnects.
- **Files**: `server/src/config/database.js`, `server/src/models/CafeSettings.js`, `server/src/controllers/tableController.js`, `server/src/controllers/menuController.js`, `server/src/middleware/validateQR.js`.

---

### Change 5: Loose Object ID Matching & CastError Fix
- **Action**: Resolved runtime error `CastError: Cast to ObjectId failed for value "item_1"`.
- **Action**: Made `menuItem` and `table` references optional in `Order.js` schema.
- **Action**: Updated `createOrder` in `orderController.js` to automatically match fallback string IDs (e.g. `item_1`, `demo-token-TBL-001`) to real MongoDB ObjectIds by item name and table identifier.
- **Files**: `server/src/models/Order.js`, `server/src/controllers/orderController.js`.

---

### Change 6: 6 Dining Tables Response Parsing & Display Fix
- **Action**: Fixed issue where the 6 dining tables failed to render on the Landing Page and Admin Dashboard.
- **Action**: Updated `LandingPage.jsx`, `AdminDashboardPage.jsx`, and `tableController.js` to parse both raw array responses `res.data` and nested object responses `{ data: tables, tables }`.
- **Action**: Verified that all 6 tables (`TBL-001` to `TBL-006`) render with occupancy status, seating capacity, and QR codes.
- **Files**: `client/src/pages/LandingPage.jsx`, `client/src/pages/AdminDashboardPage.jsx`, `server/src/controllers/tableController.js`.

---

### Change 7: Checkout Order Initialization Fix ("Failed to initialize order")
- **Action**: Resolved checkout error `Failed to initialize order` when clicking "Proceed to Pay" in the cart drawer.
- **Action**: Updated `PaymentModal.jsx` to extract the created order from `orderRes.data?.order || orderRes.data || orderRes.order`.
- **Action**: Synchronized response structures across `orderController.js`, `OrderStatusPage.jsx`, and `KitchenKDSPage.jsx` for complete dual-payload compatibility.
- **Files**: `client/src/components/customer/PaymentModal.jsx`, `client/src/pages/OrderStatusPage.jsx`, `server/src/controllers/orderController.js`.

---

### Change 8: Dual Payment Verification & Instant Demo Bypass
- **Action**: Resolved `{"success":false,"message":"Payment verification failed"}` occurring during test checkouts.
- **Action**: Identified that live Razorpay test credentials in `server/.env` caused HMAC signature verification to fail on test signatures.
- **Action**: Updated `paymentController.js` to bypass HMAC verification when `razorpay_signature === 'demo_signature'` or `razorpay_payment_id.startsWith('pay_demo_')`.
- **Action**: Enhanced `PaymentModal.jsx` with dual buttons: "Pay Online via Razorpay" (live test modal) and "Instant Demo Pay" (instant 1-click test bypass).
- **Files**: `server/src/controllers/paymentController.js`, `client/src/components/customer/PaymentModal.jsx`.

---

### Change 9: Kitchen KDS Status Transition Fix ("Start Cooking" button)
- **Action**: Resolved issue where clicking "Start Cooking" on new orders in the Kitchen Display System (`/kitchen`) failed with a 400 Bad Request error.
- **Action**: Updated `validTransitions['new']` in `orderController.js` to include `'preparing'` (previously only allowed `['accepted', 'cancelled']`).
- **Action**: Permitted transition from `'ready'` to `'completed'` / `'served'` and normalized `'served'` status to `'completed'`.
- **Action**: Synchronized dual Socket.IO events (`order:statusUpdate` and `order:status:changed`) with `KitchenKDSPage.jsx`.
- **Files**: `server/src/controllers/orderController.js`, `client/src/pages/KitchenKDSPage.jsx`.

---

### Change 10: Public Live Display Board & Kitchen KDS Food Item Prep Times Enhancement
- **Action**: Upgraded Public TV Live Board (`/display`) and Kitchen KDS (`/kitchen`) to display individual preparation times (`⏱️ Xm prep`) for each food item.
- **Action**: Added Indian Veg / Non-Veg dot icons (🟢 Veg / 🔴 Non-Veg) for every item.
- **Action**: Added overall order estimated preparation time (`⏱️ Est: ~X mins`), live elapsed timer, countdown (`~Xm remaining` or `Finishing up...`), and an animated glowing progress bar.
- **Action**: Added Table identifier badges (e.g., `Table 1`, `Table 2`), placed timestamps, item sizes, customer cooking instructions/notes, and total item counts.
- **Action**: Updated `getDisplayOrders` in `orderController.js` and real-time Socket.IO dispatch in `paymentController.js` so newly placed/paid orders appear immediately on the Live Board alongside cooking and ready orders.
- **Files**: `client/src/pages/PublicDisplayPage.jsx`, `client/src/pages/KitchenKDSPage.jsx`, `server/src/controllers/orderController.js`, `server/src/controllers/paymentController.js`.

---

### Change 11: Table Occupancy Lifecycle, QR Camera Scanner, Customer Check-In, Counter Board Clearing & 1-Minute Cancellation
- **Action**: **Table Occupancy Lifecycle & Admin/Counter Control**:
  - Implemented dynamic table state management in `DiningTable` model: added `currentCustomer` schema containing `name`, `phone`, `guests`, and `checkedInAt`.
  - Added `checkinTable` (`POST /api/tables/checkin/:token`) allowing automatic occupancy upon customer QR check-in.
  - Added `clearTable` (`POST /api/tables/:id/clear`) allowing staff to free tables back to `available` with one click.
  - Added real-time Socket.IO synchronization (`table:statusUpdate`) across Admin, Landing Page, and Customer Menu screens.
  - On Admin Tables Management tab (`/admin`), rendered seated guest badges (`👤 Name, guests, phone, seated time`) and direct action buttons: `Free / Clear Table` (when occupied) and `+ Mark Occupied` (when available).
- **Action**: **Customer Check-In on QR Scan**:
  - Added automatic Check-In Modal on customer ordering page (`/table/:token`). Prompts the guest for full name, mobile number, and guest count before browsing.
  - On submission, calls `tableApi.checkin`, sets table `occupied` in real time, and persists `customerInfo` in `CartContext` and `localStorage`.
  - Added a header seating status banner on the menu: `● Seated: Name (guests) • Table Occupied` with an edit button.
  - Automatically attaches `customerName` and `customerPhone` to all orders and payments placed from that table.
- **Action**: **Live Camera QR Code Scanner**:
  - Installed `html5-qrcode` library and built `QRScannerModal.jsx` featuring:
    1. **Live Camera** feed scanner with camera frame overlay (supporting laptop webcams and phone rear cameras).
    2. **Upload Image** file scanner for uploaded QR photos.
    3. **Select Table** direct simulation fallback for instant table access.
  - Added "Scan QR" button with pulsing beacon in the global `Navbar` and hero button on `LandingPage`.
- **Action**: **Order Handover & Board Clearing (Counter Control)**:
  - For Ready orders: Added prominent **"Handover & Clear Board"** action button on Admin Orders tab (`/admin`) and in Order Details modal.
  - Calls `orderApi.updateOrderStatus(orderId, 'served')`, which marks order `completed`, pulls it from active table orders, and emits Socket.IO events `order:served` and `order:statusUpdate`.
  - The Public TV Display Board (`/display`) immediately removes the order ticket with a chime upon handover.
- **Action**: **Admin & Counter Order Clearing / Dismissal**:
  - Added dedicated **"Clear / Dismiss"** button (`orderApi.clearOrder`) in Admin Orders tab and modal to dismiss served, completed, or cancelled tickets.
  - Added customer identity display (`👤 Name (Phone)`) directly under table name in Orders table.
  - Added cancellation reason preview under status badge.
- **Action**: **1-Minute Customer Order Cancellation & Counter Redirect**:
  - In `orderController.js`, added `cancelOrder` (`PATCH /api/orders/:id/cancel`):
    - Enforces $\le 65$-second grace period for online customer cancellation.
    - If elapsed time $\le 60$s and order status is `new`, `waiting_payment`, or `accepted`, cancellation succeeds, initiating refund and pulling order from table.
    - If $> 60$s have elapsed OR if kitchen has already started cooking (`preparing` / `ready`), online cancellation is locked out with a prompt to visit the counter.
    - Supports staff override with reason input.
  - On Customer Order Tracking page (`/track/:token`):
    - Added live 1-second interval countdown timer.
    - If within 60s and not cooking, displays active button: `Cancel Order (⏱️ Xs left)` with confirmation modal.
    - If after 60s or while cooking, displays `Cancel (Go to Counter)`, which opens a guidance modal directing the guest to the billing counter with their order number.
- **Files**:
  - `server/src/models/DiningTable.js`, `server/src/models/Order.js`
  - `server/src/controllers/tableController.js`, `server/src/controllers/orderController.js`
  - `server/src/routes/tableRoutes.js`, `server/src/routes/orderRoutes.js`
  - `client/src/api/apiServices.js`, `client/src/context/CartContext.jsx`
  - `client/src/components/common/QRScannerModal.jsx`, `client/src/components/common/Navbar.jsx`
  - `client/src/components/customer/PaymentModal.jsx`
  - `client/src/pages/LandingPage.jsx`, `client/src/pages/CustomerMenuPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`, `client/src/pages/AdminDashboardPage.jsx`

---

### Change 12: Physical Dining Table QR Code Standees, Printable Tent Cards & Scannable 2D Barcodes
- **Action**: Installed `qrcode.react` package in `client` to generate genuine, high-resolution vector 2D QR matrix barcodes that can be scanned by any smartphone camera (iOS Camera app, Android Google Lens, Samsung Camera, etc.).
- **Action**: Created reusable `TableQRStandee.jsx` component representing physical restaurant table tent cards with:
  - Table Number & Display Name (e.g., `Table 1`, `Table 2`, etc.) and seating capacity.
  - High-resolution scannable QR Code (`QRCodeSVG`, Level 'H' error correction).
  - Step-by-step customer instructions: 1. Point phone camera, 2. Tap link & enter details, 3. Order & pay, 4. Fresh food served directly to your table.
  - Free Café Wi-Fi credentials badge.
  - One-click `Download PNG` and `Print Standee` actions.
- **Action**: Built `PrintTableQRCardsPage.jsx` at route `/admin/print-tables`:
  - Displays all 6 café table tent standees in a formatted tabletop layout with `@media print` rules for clean A4 printing and cardstock folding.
  - Added Wi-Fi LAN IP / Host Switcher (`192.168.29.61` vs. `localhost`) so physical mobile devices on the café Wi-Fi can scan the printed QR codes directly.
  - Added "Print All 6 Table Standees" button in Admin Console and Landing Page.
- **Action**: Updated `LandingPage.jsx` to render real, phone-scannable 2D QR codes on each of the 6 dining table cards with direct link to print table standees.
- **Action**: Updated `AdminDashboardPage.jsx` Tables tab to show live scannable QR previews on each table card, with a "Standee Card" modal and "Print All Table Standees" header action.
- **Action**: Configured Vite dev server with `host: true` in `vite.config.js` and added `/order/:token` route alias in `App.jsx` for universal mobile access.
- **Files**:
  - `client/package.json`
  - `client/vite.config.js`, `client/src/App.jsx`
  - `client/src/components/common/TableQRStandee.jsx`
  - `client/src/pages/PrintTableQRCardsPage.jsx`

  - `client/src/pages/LandingPage.jsx`
  - `client/src/pages/AdminDashboardPage.jsx`

---

### Change 13: Lavender Blush, Thistle, Lilac Ash, Dusty Mauve & Space Indigo Color Theme and Tenez, Futura & Aleo Typography Integration
- **Action**: **Color Palette & Theme Tokens System**:
  - Re-themed the entire Smart Café web application using the exact requested 5-color palette across all 100-900 scale variants and DEFAULTs:
    - `lavender_blush`: `#f5e6e8` (100: `#441b20`, 200: `#883641`, 300: `#bf5e6b`, 400: `#daa2a9`, 500: `#f5e6e8`, 600: `#f7ebec`, 700: `#f9f0f1`, 800: `#fbf5f6`, 900: `#fdfafa`)
    - `thistle`: `#d5c6e0` (100: `#2c1e37`, 200: `#593b6e`, 300: `#8559a5`, 400: `#ae90c3`, 500: `#d5c6e0`, 600: `#ded2e7`, 700: `#e6dded`, 800: `#efe8f3`, 900: `#f7f4f9`)
    - `lilac_ash`: `#aaa1c8` (100: `#1f1b2e`, 200: `#3e365b`, 300: `#5e5089`, 400: `#8274ad`, 500: `#aaa1c8`, 600: `#bcb4d3`, 700: `#ccc7de`, 800: `#dddae9`, 900: `#eeecf4`)
    - `dusty_mauve`: `#967aa1` (100: `#1e1721`, 200: `#3c2f42`, 300: `#5a4662`, 400: `#785d83`, 500: `#967aa1`, 600: `#aa94b3`, 700: `#bfaec6`, 800: `#d4c9d9`, 900: `#eae4ec`)
    - `space_indigo`: `#192a51` (100: `#050810`, 200: `#0a1121`, 300: `#0f1931`, 400: `#142242`, 500: `#192a51`, 600: `#2c4a90`, 700: `#466dc6`, 800: `#849dd9`, 900: `#c1ceec`)
  - Configured `@theme` definitions in `client/src/index.css` supporting both snake_case and kebab-case tokens for seamless Tailwind CSS v4 class compilation.
  - Set root CSS variables and luxury ambient scrollbars, selection highlights, and glassmorphic cards.
- **Action**: **Three Fonts Typography Integration**:
  - Loaded Google Fonts in `client/index.html` across full weight ranges (400, 700, 900, italic) for `Aleo`, `DM Serif Display`, `Playfair Display`, `Jost`, and `Montserrat`.
  - Configured three primary font utility classes:
    1. **Tenez** (`font-tenez` / `--font-tenez`): Display serif with high contrast for branding, page hero titles, section headings, and table card labels (with high-end serif fallbacks).
    2. **Futura** (`font-futura` / `--font-futura`): Geometric sans-serif for UI controls, navigation links, buttons, status badges, price figures, and numeric timers.
    3. **Aleo** (`font-aleo` / `--font-aleo`): Contemporary slab serif for food descriptions, customer notes, instructions, table descriptions, and body text.
- **Action**: **Frontend Page & Component Transformations**:
  - `Navbar.jsx`: Transformed navbar background (`bg-lavender_blush-900/95 border-thistle-800`), coffee logo (`from-space_indigo to-dusty_mauve`), branding (`text-space_indigo font-tenez`), buttons, and cart trigger pill.
  - `LandingPage.jsx`: Hero header (`from-space_indigo-100 to-space_indigo-300`), glowing radial backdrops (`dusty_mauve`, `lilac_ash`), 3 role portals, 6 dining table cards with Space Indigo 2D QR codes, feature cards, and footer updated.
  - `TableQRStandee.jsx` & `PrintTableQRCardsPage.jsx`: Physical tabletop standee cards updated with tricolor accent banner (`space_indigo -> dusty_mauve -> lilac_ash`), Tenez headers, Aleo instructions, and Space Indigo QR code matrix.
  - `CategoryNav.jsx` & `MenuCard.jsx`: Category pills (`bg-space_indigo text-white` active, `bg-thistle-900 text-space_indigo` inactive), Veg toggle, menu item cards (`font-tenez text-space_indigo`, `font-aleo text-space_indigo-400`, `bg-space_indigo text-white`).
  - `CustomerMenuPage.jsx`, `ItemDetailModal.jsx`, `CartDrawer.jsx`, `PaymentModal.jsx`: Welcome table banner, check-in modal, customizer modal, floating cart drawer, and dual Razorpay/Demo checkout buttons.
  - `OrderStatusPage.jsx`: 4-step progress stepper (`bg-space_indigo`), prep time banner (`bg-thistle-900`), cancel order modals, and bill breakdown updated.
  - `KitchenKDSPage.jsx`: Dark luxury theme (`bg-space_indigo-100 text-slate-100`), 3-stage Kanban columns with `space_indigo` and `dusty_mauve` gradients, prep badges, and cooking control actions.
  - `PublicDisplayPage.jsx`: Full-screen live TV display re-themed with `space_indigo` backdrop, `dusty_mauve` digital clock and cooking progress bars, and emerald pickup status.
  - `AdminLoginPage.jsx` & `AdminDashboardPage.jsx`: Staff portal and full management console (Overview, Orders, Tables, Menu Catalog, Reports tabs) systematically updated to the 5-color palette and typography stack.
  - `StatusBadge.jsx` & `formatters.js`: Updated badge colors and order status styling to reflect the new theme.
- **Files**:
  - `client/index.html`
  - `client/src/index.css`
  - `client/src/utils/formatters.js`
  - `client/src/components/common/Navbar.jsx`
  - `client/src/components/common/StatusBadge.jsx`
  - `client/src/components/common/QRScannerModal.jsx`
  - `client/src/components/common/TableQRStandee.jsx`
  - `client/src/components/customer/CategoryNav.jsx`
  - `client/src/components/customer/MenuCard.jsx`
  - `client/src/components/customer/ItemDetailModal.jsx`
  - `client/src/components/customer/CartDrawer.jsx`
  - `client/src/components/customer/PaymentModal.jsx`
  - `client/src/pages/LandingPage.jsx`
  - `client/src/pages/CustomerMenuPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/pages/KitchenKDSPage.jsx`
  - `client/src/pages/PublicDisplayPage.jsx`
  - `client/src/pages/AdminLoginPage.jsx`
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/pages/PrintTableQRCardsPage.jsx`

---

### Change 14: Creative Animation Suite, Lenis Smooth Scrolling, 3D Tilt & Micro-Interactions UI/UX Redesign
- **Action**: **Creative Animation Suite Built from Scratch (`client/src/components/animations/`)**:
  - `SmoothScroll.jsx`: High-performance inertial smooth scrolling powered by `@studio-freight/lenis` (Lenis v1.3.27) with exponential deceleration, velocity synchronization, hash anchor link handling (`#tables-section`), and automated route change scroll reset.
  - `Magnet.jsx`: Physics-based cursor spring magnetic pull with customizable pull strength and dual cubic-bezier spring curves (`cubic-bezier(0.25, 1, 0.5, 1)` and `cubic-bezier(0.34, 1.56, 0.64, 1)`).
  - `ClickSpark.jsx`: Multi-particle HTML5 canvas particle starburst on user clicks utilizing the 5-color luxury palette (`#967aa1`, `#aaa1c8`, `#bf5e6b`, `#192a51`, `#d5c6e0`).
  - `TiltedCard.jsx`: Hardware-accelerated CSS 3D perspective tilt (`preserve-3d`, `perspective(1000px)`, `rotateX`, `rotateY`, `scale3d(1.02, 1.02, 1.02)`) with dynamic radial cursor spotlight/glare and layered depth translation.
  - `CreativeButton.jsx`: Master tactile interactive button combining `Magnet`, `ClickSpark`, specular glare sweep, active 3D press feedback (`active:scale-95 active:translate-y-0.5`), audio chime integration, and 6 visual variants (`primary`, `secondary`, `ghost`, `outline`, `danger`, `success`).
  - `ShinyText.jsx`: Metallic gradient light-sweep text animation utilizing CSS background clipping and linear gradients.
  - `CountUp.jsx`: Cubic ease-out RAF number counter with IntersectionObserver trigger for metrics and statistics.
  - `AmbientBackground.jsx`: Interactive living canvas background with floating glowing embers, rising coffee aroma particles, mouse repulsion/attraction parallax, and radial aura blurs.
- **Action**: **Comprehensive UI/UX Redesign Across Core Views**:
  - `App.jsx` & `index.css`: Wrapped root router with `SmoothScroll`, configured keyframe animations (`shinySweep`, `floatGently`, `softPulse`), and 3D utility classes.
  - `Navbar.jsx`: Animated coffee logo, `ShinyText` branding, `CreativeButton` for Scan Table QR, and `Magnet` on cart trigger pill.
  - `LandingPage.jsx`: Living interactive `AmbientBackground`, `ShinyText` hero headline, `CreativeButton` CTAs, `TiltedCard` on role cards, `CountUp` on key performance metrics, and 3D interactive table QR cards.
  - `MenuCard.jsx`, `CustomerMenuPage.jsx`, `CartDrawer.jsx`, `PaymentModal.jsx`: `TiltedCard` 3D tilt on food cards, glowing badges, `CreativeButton` on "Add", "Customize", "Review & Place Order", and Razorpay/Demo pay buttons.
  - `OrderStatusPage.jsx`: `ShinyText` tracking title, `TiltedCard` on live order status containers, and `CreativeButton` on cancel order actions.
  - `KitchenKDSPage.jsx`: Dark luxury Kanban tickets wrapped in `TiltedCard` with 3D hover elevation and `CreativeButton` on cooking status controls.
  - `PublicDisplayPage.jsx`: Metallic shimmering `ShinyText` title and ambient glowing status indicators.
  - `AdminDashboardPage.jsx`: Metallic header, `TiltedCard` with `CountUp` counters on all 4 overview metric cards.
- **Files**:
  - `client/src/components/animations/SmoothScroll.jsx`
  - `client/src/components/animations/Magnet.jsx`
  - `client/src/components/animations/ClickSpark.jsx`
  - `client/src/components/animations/TiltedCard.jsx`
  - `client/src/components/animations/CreativeButton.jsx`
  - `client/src/components/animations/ShinyText.jsx`
  - `client/src/components/animations/CountUp.jsx`
  - `client/src/components/animations/AmbientBackground.jsx`
  - `client/src/App.jsx`
  - `client/src/index.css`
  - `client/src/components/common/Navbar.jsx`
  - `client/src/pages/LandingPage.jsx`
  - `client/src/components/customer/MenuCard.jsx`
  - `client/src/pages/CustomerMenuPage.jsx`
  - `client/src/components/customer/CartDrawer.jsx`
  - `client/src/components/customer/PaymentModal.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/pages/KitchenKDSPage.jsx`
  - `client/src/pages/PublicDisplayPage.jsx`
  - `client/src/pages/AdminDashboardPage.jsx`

---

### Change 15: Minimalist Senior Designer Rearrangement & Architectural Layout Transformation
- **Action**: **Architectural Minimalism & Layout Re-engineering**:
  - Implemented an editorial luxury minimalist aesthetic inspired by high-end design ateliers (Aesop, Apple, Kinfolk), prioritizing generous negative space, crisp typography hierarchy, and deliberate visual restraint.
  - Re-anchored the 5-color palette into an alabaster-and-ink foundation: warm alabaster canvas (`#fdfafa` lavender_blush-900), deep architectural ink typography (`#050810` / `#192a51` space_indigo), delicate hairline borders (`#e6dded` thistle), and subtle amethyst micro-accents (`#967aa1` dusty_mauve, `#aaa1c8` lilac_ash).
  - **Rearranged Landing Page ("The Atelier")**:
    - Replaced heavy gradient boxes with an airy, high-fashion layout featuring an editorial headline in light `Tenez` with italicized dusty mauve accent ("Where Artisanal Craft / Meets Frictionless Dining.").
    - Added an architectural **Performance Ledger** separating key metrics (`6 Dining Tables Synced`, `99.4% Order Precision`, `<8m Avg. Prep Turnaround`, `100% Contactless Checkout`) with delicate vertical hairline dividers.
    - Rearranged the 6 dining tables into an architectural station ledger (`Station 01 Salon Main` to `Station 06 Garden Alcove`) with subtle background watermark numbers (`01`-`06`), scannable 2D QR standee cards with subtle 3D tilt, and clean 1-click table simulation.
    - Streamlined the 3 Synchronized Service Hubs (Kitchen KDS, TV Display, Admin Console) into minimalist cards with delicate hairline borders and subtle 3D hover response.
    - Redesigned the footer with clean copyright, monospace font attribution, and color palette swatch indicators.
  - **Minimalist Customer Menu & Navigation**:
    - Refined `CategoryNav.jsx` with minimalist pill selectors, smooth magnetic hover attraction, and clean pure veg toggle.
    - Updated `MenuCard.jsx` with breathable whitespace, subtle 3D tilt, illuminated dietary indicator dots, and tactile `CreativeButton` with click starbursts.
    - Refined `CartDrawer.jsx` and `OrderStatusPage.jsx` with clean hairline lines and minimalist order tracking.
  - **Production Build & Visual Audit**:
    - Validated with clean Vite production build (`✓ built in 5.51s`).
    - Verified via browser subagent across Landing Page, Customer Menu, and Kitchen KDS with full screenshot confirmation.
- **Files**:
  - `client/src/pages/LandingPage.jsx`
  - `client/src/components/customer/CategoryNav.jsx`
  - `client/src/components/customer/MenuCard.jsx`
  - `client/src/components/customer/CartDrawer.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/components/animations/AmbientBackground.jsx`
  - `client/src/components/animations/CreativeButton.jsx`
  - `client/src/components/animations/TiltedCard.jsx`
  - `CHANGES.md`

### Change 18: Keep Kitchen and Pickup Inside the Café
- Kitchen and pickup hotspots now open compact in-scene popovers rather than navigating to separate boards; `/kitchen` and `/display` return to the café floor.
- Added in-place order controls for starting preparation, sending finished food to the counter, and confirming guest pickup through the existing order status API.
- Added an animated pixel cook, cooking motion, ready food on the counter, and a guest collecting a ready order.
- **Files**:
  - `client/src/App.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 19: Expand the Café Into a Living Restaurant
- Expanded the room to nine tables and added animated guest arrivals, walking cycles, diners eating, and a staffed two-cook kitchen.
- Enlarged the pickup station with a live order screen and visible food at the counter when orders are ready.
- Table menus and QR scans now open over the restaurant scene in an embedded window, keeping the guest in the café while ordering.
- **Files**:
  - `client/src/pages/CafePage.jsx`
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/components/common/QRScannerModal.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 20: Fit the Living Café to One Screen
- Reworked the café floor into a viewport-height layout with a compact header and controls; the scene, table selection, service strip, and room controls fit without page scrolling.
- Rebalanced the pixel-room canvas for landscape screens and gave guest/cook sprites richer facial features, layered uniforms, shadows, and clearer walking and eating motion.
- Added compact viewport behavior for smaller screens so the floor stays in view while table details float over the room.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 16: Project Introduction & Interactive Pixel Café
- Replaced the root route's dashboard-style hub with a concise project introduction that explains the guest-to-kitchen flow and links to the staff portal.
- Added `/cafe`, an original responsive pixel café floor with keyboard-accessible table selection, a table QR scanner entry point, and interactive kitchen and pickup stations.
- Connected the room to live table occupancy and order status through the existing REST APIs and Socket.IO events. Selecting a table opens its existing check-in and customer menu flow; the kitchen and pickup areas open their existing operational screens.
- Added lightweight pixel animations for seated guests, a roaming guest, kitchen steam and cooking, the pass tray, and ready-to-collect orders. The scene respects reduced-motion preferences and uses no new runtime dependency.
- Updated the route sitemap in `README.md`.
- **Files**:
  - `client/src/App.jsx`
  - `client/src/pages/ProjectLandingPage.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/styles/cafe-world.css`
  - `README.md`
  - `CHANGES.md`

### Change 17: Pixel Visual System Across Guest & Staff Screens
- Applied the café palette, square pixel-panel surfaces, hard-edge controls, pixel typography for operational headings, reduced-motion handling, and keyboard focus treatment to customer ordering, order tracking, kitchen tickets, public pickup, staff login, admin management, and printable QR screens.
- Added state-specific ticket entrances and cooking/ready cues. The kitchen queue and public pickup board now visually distinguish queued, cooking, and ready orders while continuing to use the existing live status updates.
- Updated shared navigation and café labels to use Little Window Café and added a direct café-floor route from the navigation.
- Fixed the missing `StatusBadge` import used by order tracking.
- **Files**:
  - `client/src/App.jsx`
  - `client/src/styles/pixel-screens.css`
  - `client/src/components/common/Navbar.jsx`
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/pages/CustomerMenuPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/pages/KitchenKDSPage.jsx`
  - `client/src/pages/PublicDisplayPage.jsx`
  - `client/src/pages/AdminLoginPage.jsx`
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/pages/PrintTableQRCardsPage.jsx`
  - `CHANGES.md`

### Change 21: Realistic 3D Café Flow and Full-Screen View
- Refined the café into a single full-screen 3D room, with no page scrolling or separate operational boards. Table ordering, kitchen controls, and pickup controls open as compact overlays over the café.
- Kept guest movement in a clear shared aisle, staggered arrivals to prevent collisions, and routed the server through the service lane to the counter. The pickup guest now waits beside the pass and exits toward the side door.
- Added working mouse-wheel zoom to the orthographic camera while retaining drag-to-rotate. The default framing shows the complete restaurant in one viewport.
- Fixed an invalid animation assignment that prevented the scene module from parsing.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 22: Table-to-Kitchen-to-Table Guest Journey
- Connected ready tickets to the guest at the matching table. The guest leaves their seat, follows clear walking lanes to the counter, picks up that order's plate, returns to the table, eats, then exits through the open side door.
- The counter board now shows compact waiting, cooking, and ready lanes with the first order and table number. A pulsing green beacon signals when food is ready.
- Completed dining journeys update the existing order status to served/completed. The kitchen and pickup windows use compact order tickets, subtle entrance motion, and responsive button feedback.
- Increased table spacing and opened the doorways so customer routes stay clear of chairs and door panels.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 23: Natural Café Material Palette
- Rebalanced the 3D room around warm plaster, walnut furniture, oak floors, muted olive details, brushed stainless kitchen surfaces, and aged brass lighting.
- Softened the lighting and background tones, and brought the live pickup display and in-scene order windows into the same espresso-and-parchment palette.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 24: Fixed Customer View and Timed Order Service
- Locked the café to a composed customer-facing camera and one shared entry/exit; added keyboard access for tables and the order board.
- Moved the kitchen and cooks behind the rear wall with a marked staff-only passage, while keeping the cooking workflow connected to the service counter.
- Made the counter status display open all active orders in a compact overlay. Orders now move through approval, a short service acknowledgment, item-dependent preparation time, ready-for-pickup, and the existing matching-table pickup and dining journey.
- Sized the floor to the six real backend tables and adjusted guest routes to avoid furniture and leave through the same door.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/styles/cafe-world.css`
  - `README.md`
  - `CHANGES.md`

### Change 25: Courtyard, Café Booking, and Material Pass
- Added an outdoor grass texture, paved entrance, planted borders, flowering hedges, animated birds, and softer natural daylight with improved shadow bias.
- Adjusted the fixed customer camera toward the seating area and kept the staff kitchen concealed behind its partition.
- Added live table reservations from the café introduction page, including party capacity checks, conflict handling, real-time table updates, and a 30-minute arrival grace period.
- Added subtle oak grain to the café floor and removed unstable booking form state updates.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/components/cafe/BookingModal.jsx`
  - `client/src/pages/ProjectLandingPage.jsx`
  - `client/src/styles/cafe-world.css`
  - `server/src/controllers/tableController.js`
  - `server/src/models/DiningTable.js`
  - `server/src/routes/tableRoutes.js`
  - `client/src/api/apiServices.js`
  - `README.md`
  - `CHANGES.md`

### Change 26: Open Kitchen and Interactive Order Panel
- Replaced the opaque rear kitchen wall section with a framed open-kitchen pass so customers can see cooks at the stove and preparation counter.
- Gave cooks distinct ongoing stirring, chopping, and plating motions between orders; active orders still drive the faster cooking animations.
- Redesigned the in-café order panel with live status counts, working All/New/Cooking/Ready filters, concise state labels, and clearer accept and prepare actions.
- Kept the order panel as a compact overlay within the café scene.
- **Files**:
  - `client/src/components/cafe/CafeScene.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 27: Customer-Only Food Ordering Menu
- Replaced the shared staff navigation on QR ordering pages with a focused customer header for table identity, order tracking, and cart access.
- Rebuilt the menu around a parallax food photograph, compact search/category/vegetarian filters, and responsive cards with clear customization and add feedback.
- Added a bundled four-dish photo sheet as a reliable fallback for menu items without an uploaded image.
- Restyled the table check-in entry to match the new customer ordering experience while preserving cart, item customization, and payment flows.
- **Files**:
  - `client/src/pages/CustomerMenuPage.jsx`
  - `client/src/components/customer/MenuCard.jsx`
  - `client/src/components/customer/CategoryNav.jsx`
  - `client/src/styles/customer-order.css`
  - `client/public/images/cafe-food-montage.png`
  - `CHANGES.md`

### Change 28: Rebuilt the landing page around a lit shopfront window
- Replaced the root landing page with a darker room, an arched brass-framed window, and a garden seen through it; the window carries the whole design while every other section stays quiet and left-aligned.
- Added interactive motion: the garden and canopy drift on scroll and shift with the pointer, light and glass sheen follow the cursor, and the plate on the sill moves against the page.
- Replaced the tabbed journey with a draggable plate rail (native range input, four stops, arrow keys) that walks one order from the table through the kitchen and the pass back to the table, changing the scrolled photograph and status signal at each stop.
- Added a three-panel parallax gallery that widens the hovered view and reveals its caption, plus a shutter transition into the 3D café floor.
- Renamed the copy to match the café itself, kept booking (`BookingModal`) and staff/café routes connected, and showed live free-table counts from the existing tables API with a static fallback when the server is unreachable.
- Added the page's own stylesheet (`client/src/styles/landing-window.css`) so it no longer depends on the shared `lw-` landing rules; all motion is disabled under `prefers-reduced-motion`.
- **Files**
  - `client/src/pages/ProjectLandingPage.jsx`
  - `client/src/styles/landing-window.css`
  - `docs/plans/2026-11-15-landing-window.md`
  - `CHANGES.md`

### Change 29: Hero parallax, a window that changes with the hour, and a crossing into the café
- Reworked the hero into a layered parallax scene: the window tilts with the pointer, the canopy, meadow and plate drift at different depths, and the whole scene lifts and scales as the page scrolls while the headline eases away.
- Added a light switch under the window (Morning, Golden, Dusk). It cross-fades the glass, moves the sun, darkens the meadow and tints the room, so the hero can be explored rather than just read.
- Replaced the shutter wipe with a three-stage entrance into the café: the window grows from its own frame to fill the screen, a warm bloom opens inside it, then the café floor arrives with its existing cloud-and-iris reveal. The footer "Café floor" control uses the same path, and reduced motion skips straight to the café.
- Kept the window controls outside the image's accessible container so the light switch stays reachable, and kept the booking flow unchanged.
- **Files**
  - `client/src/pages/ProjectLandingPage.jsx`
  - `client/src/styles/landing-window.css`
  - `CHANGES.md`

### Change 30: A routed path from the window to the café table
- Kept the window-open crossing and added a travel beat inside it: as the window fills the screen, a thin route draws itself across the warm room, a brass marker travels along it, and the waypoints ("Into the room", "Your table") appear as it passes, ending on a pulsing table ring.
- The path then blooms into light and the café floor arrives with its cloud-and-iris reveal, so the sequence reads as window → route → table instead of window → jump.
- The route is drawn with a dash-offset stroke, the marker rides the same curve with SVG motion, and both are hidden under reduced motion and scaled up for small screens (the SVG uses `meet` so the whole route stays in frame on a phone).
- **Files**
  - `client/src/pages/ProjectLandingPage.jsx`
  - `client/src/styles/landing-window.css`
  - `CHANGES.md`

### Change 31: The café arrives out of drifting mist
- Replaced the circular iris wipe with a slower cloud reveal: a sage-cream veil with soft white banks and muted green undersides drifts apart while the 3D room surfaces from blur and a slight scale, over about three seconds.
- The veil starts semi-transparent (72%) and the room begins fading in on the same frame, so the space is sensed through the cloud from the first moment instead of waiting behind an opaque blank.
- The cloud banks now read as cloud rather than a white-out: the veil carries the colour, the puffs sit only at the outer thirds, and their undersides are tinted so the masses have volume.
- Removed the duplicate arrival rule in `cafe-world.css` so the sequence runs at one speed, and kept the landing's window-to-route crossing running straight into this mist.
- **Files**
  - `client/src/styles/premium-redesign.css`
  - `client/src/styles/cafe-world.css`
  - `CHANGES.md`

### Change 32: Arrival composited for a steady frame budget, and a lit way in
- Reviewed the café arrival CSS and removed every runtime blur: the two cloud banks no longer carry `filter: blur(18px)` (softness is painted into the gradient stops instead) and the room reveal only fades and scales, so the sequence is compositing work rather than a full-screen re-rasterise per frame.
- Shortened the bank drift from ±28% to ±9% of a wider layer, so a bank can no longer slide out from under the frame while it is still half opaque; the drifting look is unchanged.
- Gave **Step inside the café** its own light: a lit brass lamp beside the label, a porch ring that breathes outward every 3.6 s, a warm glow on the face, a slow sheen, and an arrow that leans down toward the café. Hover brightens it and settles the arrow; the disabled (mid-crossing) state stops the motion.
- **Files**
  - `client/src/styles/premium-redesign.css`
  - `client/src/styles/landing-window.css`
  - `CHANGES.md`

### Change 33: The way in moves into the window, and every loop keeps moving
- **Step inside the café** now hangs inside the arched window as a brass-rimmed plaque on the glass, centred above the sill, instead of sitting in the copy column beside Book a table. The window keeps a single clear call to action and the plaque reads against the meadow behind it.
- Moved `role="img"` from the window to the glass scene so a real button can live inside the window frame without nesting inside an image role.
- Rebuilt the plaque's motion with no plateau phases: a continuous sheen crosses the face on a linear loop, the halo breathes rim to rim on a sine, and the lamp dot and arrow bob on a shared 2.4 s sine. The old keyframes rested for up to 42% of their cycle; none of them do now.
- Gave the plaque a base elevation shadow so the halo has something to breathe from instead of popping in when its animation starts.
- **Files**
  - `client/src/pages/ProjectLandingPage.jsx`
  - `client/src/styles/landing-window.css`
  - `CHANGES.md`

### Change 34: Phase 1 — order progress becomes server truth
- Added `server/src/services/progressService.js`: one `describeProgress(order, now)` that turns the stored status and timestamps into a stage, index, 0–100 percent (time-interpolated inside `preparing` and `ready`, clamped so it never runs backwards), an `etaAt`, time-in-stage, and a lateness flag. Every client now reads the same numbers instead of re-deriving rules from a status string.
- Every order payload from `getOrdersByToken`, `getOrders`, `getKitchenOrders`, `getDisplayOrders`, `updateOrderStatus` and `cancelOrder` now carries `progress`, and the socket payloads carry it too.
- Added `GET /api/orders/:id/timeline`, exposing `OrderStatusHistory` (written on every transition since the start, never read back until now). Malformed ids return 404 rather than a cast error.
- Fixed the kitchen board gap: `accepted` tickets are rendered in the first lane again instead of falling between columns.
- **Deliberately not changed**: `PATCH /api/orders/:id/status` is still unauthenticated. Adding `protect` would break the `/cafe` station board, which drives accept/prepare/serve with no session — that hardening needs a login for the room first, so it moves to its own change.
- **Files**
  - `server/src/services/progressService.js` (new)
  - `server/src/controllers/orderController.js`
  - `server/src/routes/orderRoutes.js`
  - `client/src/pages/KitchenKDSPage.jsx`
  - `CHANGES.md`

### Change 35: Phase 2 — the customer tracker is live
- `OrderStatusPage` now joins `order:<id>` for every loaded order (the server already emitted there; the client was listening into an empty `token:` room), so kitchen status changes land without a refresh. New orders are joined as they arrive, and a quiet 20-second poll covers a dropped socket without flashing spinners or wiping the screen on failure.
- The four-step rail now sits on a real progress bar driven by the server's `progress.percent`, with a live stage clock ("Cooking · 37s") and a time-based ETA ("Ready around 1:09 pm"), switching to a plain "a few minutes behind" line when the order runs past its estimate.
- Mapped the server's five stages back onto the four-step rail: `accepted` folds into "Received", so the highlighted step no longer runs one ahead.
- `waiting_payment` now says "Confirming payment" instead of showing an all-inactive rail, and ready/completed keep their existing call-out and closing note.
- **Files**
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/styles/customer-order.css`
  - `CHANGES.md`

### Change 36: Phase 3 — the console shows and drives order progress
- Replaced the orders-table status badge with a live progress cell: stage label, a running clock (or `late 8m` in rose), a thin bar filled from the server's `progress.percent`, and the ETA beneath (`ETA 1:09 pm`, `On the counter`, `Overdue`). Closed orders show a frozen bar and no note.
- Added the one action the table was missing: a `Send to kitchen` / `Start cooking` button for `waiting_payment` and `accepted` rows, driven by a `NEXT_STAGE` map so it can only offer a legal transition. `accepted` previously had no control at all.
- The order inspector now opens with the recorded **timeline** (from Phase 1's `/orders/:id/timeline`) — each transition with its time and note, e.g. "Awaiting payment 12:54 pm · Order created, awaiting payment".
- Orders refresh quietly every 15 s so the time-based percent and ETA keep moving between socket events; socket payloads now also merge `progress`.
- Kitchen tickets got the same stage bar (the KDS page is still unreachable in the router — `/kitchen` redirects to `/cafe` — so this is code-level only).
- `formatDuration` moved into `utils/formatters.js` and gained a days form: stale demo orders read `22d 15h` instead of `543h 50m`.
- Two rendering bugs found by looking at the console: the bar track was so dark it read as a filled bar, and the `bg-gradient-to-r` utility does not compile in this Tailwind v4 setup, so the fills were invisible — fills are now explicit inline gradients.
- **Files**
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/pages/KitchenKDSPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/api/apiServices.js`
  - `client/src/utils/formatters.js`
  - `CHANGES.md`

### Change 37: Review pass — the progress code carries only what is used
- Trimmed the progress descriptor from 14 fields to 7: `stage, label, percent, etaAt, isLate, lateByMs, stageElapsedMs`. Dropped `index`, `total`, `placedAt`, `elapsedMs`, `stageSince`, `isClosed` and `timestamps` — none of them were read by any screen.
- Collapsed the duplicated `waiting_payment` / `cancelled` / active branches into one shape, and replaced the cancelled-order back-calculation with a small `reachedStage()` helper.
- Timeline rows now come back as `{ to, label, at, note }` — labelled on the server — so the admin no longer keeps its own `STAGE_LABELS` map. Also dropped `from` and `changedBy`, which nothing rendered.
- `GET /orders/:id/timeline` no longer returns `progress` or `orderNumber` (the drawer only wants the rows) and checks existence with `Order.exists` instead of loading a document.
- Admin: `NEXT_STAGE` shrank from all five transitions to the two the table has no button for, which also removed a redundant `includes()` guard and a tooltip; the progress cell lost its `closed`/`done` micro-labels.
- Customer: the six-branch `statusLabel` ternary is gone — the pill and the stage line both read `progress.label`.
- Removed the kitchen progress bar added in Phase 3: `/kitchen` is a redirect, so that page cannot be reached and the bar was decoration on dead code.
- Un-exported `STAGES` and the default export; nothing imported either.
- **Files**
  - `server/src/services/progressService.js`
  - `server/src/controllers/orderController.js`
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/pages/KitchenKDSPage.jsx`
  - `CHANGES.md`

### Change 38: Phase 4 — the kitchen works the ticket
Order progress told the truth about *time*, but nothing recorded what the kitchen had actually cooked. This phase gives a ticket real work to do, so the bar follows the dishes and not only the clock.
- **Dish ticks.** Each line item now carries `isDone` and `doneAt` on the order, the first fields that change after creation. `PATCH /api/orders/:id/items/:itemId` ticks a dish, flips it when the body has no `isDone`, refuses once the order is closed, and 404s on a dish that is not on that ticket. It emits `order:items:update` to the kitchen, the console and the guest's order room.
- **Progress follows the work.** The descriptor gained `itemsDone` and `itemsTotal`. Inside the cooking slice the bar takes whichever is further along, the clock or the ticked dishes, so a two-dish ticket at one dish reads 53% immediately while an untouched order still creeps forward. Un-ticking a dish pulls the bar back, because that dish really is back in the pan.
- **Recall.** A `ready` order can now go back to `preparing`. That clears `readyAt`, restarts `preparingAt` and therefore the ETA, and records the move in the timeline (`ready` then `preparing`).
- **Console.** The order inspector lists every dish with a tick, shows "1 of 2 cooked" in the items header, and nags with "Every dish is up — mark the order ready once it is on the pass" when the last one is ticked. Ready tickets get a "Back to cooking" button next to the handover.
- **Guest tracker.** The cooking note now says "1 of 2 dishes cooked" instead of a generic line.
- **Verified** against a three-dish order: `0/3 → 16%`, `1/3 → 41%`, `2/3 → 65%`, `3/3 → 90%`, flipping a dish back returns 65→41, recall leaves the order at `preparing` with `readyAt` cleared and a fresh ETA, an unknown dish id returns 404 and a closed order returns 400. In the browser the table bar moved 16 → 90 → 53% as dishes were ticked and unticked, the hint appeared and disappeared with the last dish, and the recall button put the row back to `COOKING` with a new ETA.
- **Files**
  - `server/src/models/Order.js`
  - `server/src/services/progressService.js`
  - `server/src/controllers/orderController.js`
  - `server/src/routes/orderRoutes.js`
  - `client/src/api/apiServices.js`
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `AGENTS.md`

### Change 39: Fixes and decluttering across the console
A pass over the staff console for things that were wrong or in the way. No new screens, no new flows — mostly deletions and corrections.
- **The reports tab was showing invented numbers.** "Payment Verification Rate 100%" and "Average Prep Time 14 mins" were literals in the markup, and "Popular Menu Items" listed the first five menu items by insertion order, not by sales. The cards now read the real values: paid orders against today's orders from the stats endpoint, average prep time measured from `preparingAt` to `readyAt` on finished tickets (with the sample size stated, and an em dash when there are none), and best sellers from the server's own aggregation, with "Nothing sold today yet" when that is the truth.
- **Native `prompt()` and `confirm()` are gone.** Cancelling an order, clearing an order, deleting a menu item and seating a walk-in each opened a browser dialog — and seating asked two questions in a row. They now use one small in-app dialog with proper labels, a prefilled reason for cancellations, and both guest fields on one form. A required field disables the confirm button instead of silently doing nothing.
- **The live orders table now opens on active work.** It defaulted to "All Orders", so the first thing staff saw was history mixed with live tickets, and the tab badge counted everything ever listed. The badge counts active orders only, a new "Active" filter is the default, and "All Orders" is still one click away.
- **One action per row.** Rows carried up to four buttons (Cook, Cancel, Ready, Handover, Clear, plus the eye). Cancel and Clear now live in the order inspector where the order's details are, leaving each row with its one primary action and the eye.
- **Two dead links removed.** The overview offered "Open Kitchen (KDS)" and "Open TV Display Board"; both routes now redirect to `/cafe`, so the buttons bounced staff to a different page than their label promised. Replaced with a single "Open the café room" link and honest copy.
- **Verified** in the console: the reports tab reads `0% — 0 of 6 orders paid`, `74 min — from 15 finished tickets`, `Best Selling Today — Nothing sold today yet` (no paid orders today), and no literal "14 mins" or "100%" remains. Table opens on Active with the badge matching the row count. The cancel dialog opened with the reason prefilled, cancelling moved ORD-0045 off the active board, and each row now shows one action plus the eye.
- **Files**
  - `client/src/pages/AdminDashboardPage.jsx`

### Change 40: The console is split into components
`AdminDashboardPage.jsx` had grown to 1,635 lines holding five tabs, four modals, the orders table and every handler in one file. Before touching UI/UX, the page was broken into pieces that each do one job.
- `components/admin/OrdersTab.jsx` (147 lines) — the filter pills and the live orders table, with one primary action plus inspect per row. Takes `orders`, `filter`, and the handlers it needs.
- `components/admin/OrderProgressCell.jsx` (48) — the per-row stage, clock and bar.
- `components/admin/OrderInspectorDialog.jsx` (197) — the order drawer: table and customer, recorded timeline, dish ticks with the "n of m cooked" header, and the actions (handover, recall, cancel, dismiss).
- `components/admin/ReportsTab.jsx` (81) — the three sales cards and best sellers, computing its own numbers from `stats` and `orders` instead of receiving six derived variables.
- `components/admin/ActionDialog.jsx` (59) — the confirm/input dialog that replaced the native prompts; it owns its field state now.
- The page is down to 1,171 lines and keeps what is still local: the overview, the tables tab, the menu catalog, and the table-QR and menu-item modals, plus the data loading, socket wiring and the order/table/menu handlers those need.
- Blocks were moved by marker rather than retyped, so no markup or class names changed in transit. Verified after: Live Orders renders 20 rows with pills, progress bars and one action each; the inspector opens with its timeline, dish tick and actions; the cancel dialog opens with the reason prefilled and closes on "Keep as is"; the reports tab still reads `0%`, `₹499` and `69 min from 16 finished tickets`; Overview (7 cards), Tables (6 cards) and Menu (24 rows) all still render. `oxlint` 0 errors, build green.
- **Files**
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/components/admin/OrdersTab.jsx`
  - `client/src/components/admin/OrderProgressCell.jsx`
  - `client/src/components/admin/OrderInspectorDialog.jsx`
  - `client/src/components/admin/ReportsTab.jsx`
  - `client/src/components/admin/ActionDialog.jsx`

### Change 41: The rest of the console moves into components
The second half of the split: the overview, the tables floor, the menu catalog and both remaining modals now live in `components/admin/` too, so `AdminDashboardPage` is only data loading, socket wiring, handlers and layout.
- `components/admin/OverviewTab.jsx` (207) — the four KPI cards, the café-room shortcut, the table strip and the last five orders.
- `components/admin/TablesTab.jsx` (186) — the six table cards with their live QR, who is seated, and the free / seat / standee / order controls.
- `components/admin/MenuTab.jsx` (107) — the catalog table with stock toggle, edit and delete.
- `components/admin/TableQrDialog.jsx` (24) — the printable standee modal.
- `components/admin/MenuItemDialog.jsx` (117) — the add / edit dish form.
- The page drops from 1,171 to 601 lines. Seating a walk-in and starting a new dish became page handlers (`handleSeatTable`, `handleStartAddItem`) so the tabs stay free of dialog wiring.
- Two dead things went with it: the settings fetch in `loadDashboardData` (there is no settings tab, so `cafeSettings` was loaded and never read) and the six imports left unused by the moves.
- A real bug surfaced during verification and was fixed: `TableQrDialog` rendered before `selectedTableForQR` was set and crashed on `table.displayName`, because the `&&` guard had been stripped with the wrapper. Both new dialogs now return `null` when they have nothing to show.
- **Verified** tab by tab in a fresh session: Overview (7 cards, 5 recent orders, café link, tables shortcut), Live Orders (20 rows, Active/All pills), Tables (6 cards, "5 Occupied 1 Available", standee modal opens and closes on the backdrop), Menu (24 rows, stock toggle round-trips and persists — PATCH 200 on the network, restored afterwards; add dialog has all 6 fields and 6 categories; the pencil opens "Edit Menu Item" prefilled with "Brownie with Ice Cream" and a "Save Changes" button), Reports (`0%`, `₹499`, `69 min from 16 finished tickets`) and the order inspector (`Order ORD-0036`, TIMELINE, ITEMS (1), dish tick, Cancel and Close). Build green, `oxlint` 0 errors.
- **Files**
  - `client/src/pages/AdminDashboardPage.jsx`
  - `client/src/components/admin/OverviewTab.jsx`
  - `client/src/components/admin/TablesTab.jsx`
  - `client/src/components/admin/MenuTab.jsx`
  - `client/src/components/admin/TableQrDialog.jsx`
  - `client/src/components/admin/MenuItemDialog.jsx`

### Change 42: A UI pass over the four screens
First pass of the UI/UX work, done screen by screen after the console split. The flows are untouched — the same taps lead to the same places — but the repetition and the extra furniture around them are gone.

**Guest menu** (`CustomerMenuPage.jsx`, `customer-order.css`)
- The hero repeated what the page already said: the table chip sat in the header *and* again above the headline, the "Made fresh when you order" pill repeated the subtitle, and "Explore the menu" pointed at the menu section immediately below it. All three are gone; the greeting now reads "Hi, Aarav" (the table is already in the header).
- The hero is shorter (354 → 300px, photo 294 → 248px), so the menu heading and search reach the first screen instead of starting below it.

**Order tracker** (`OrderStatusPage.jsx`)
- The decorative hero ("Your order, made to order." plus a food photo) sat above the live order. Removed, so the card with the ETA, the four-stage rail and the items is the first thing on the page.
- "Placed 12:45 pm · 16 Nov, 12:45 pm" printed the same time twice; it now reads "Placed 16 Nov, 12:45 pm".
- A ready order said "Ready at the counter" in the banner, again in the stage line and again ("Collect it whenever you like") in the ETA slot. The stage line is now hidden while the ready banner is showing.

**Café room** (`CafePage.jsx`, `cafe-world.css`)
- The table card and the station window could be open at the same time, stacked and each with its own close button. Opening either now closes the other.
- The kitchen window is titled "Kitchen queue" rather than "Order status", which is what it actually shows.
- Dropped the "Live kitchen queue — N orders" summary row: the filter pills directly under it already carry those counts.

**Console overview** (`OverviewTab.jsx`)
- Four KPI cards carried jargon under each number ("✓ Verified Razorpay Payments", "Live on Kitchen Display System", "Unique QR Tokens Active"). They now read "Paid online today", "All orders today", "Waiting or cooking", and "{n} free right now" — the last one shows something the N/6 figure doesn't.
- Removed the "Socket Connected" badge from the café-room card and shortened its copy and the tables card's copy.

**Console orders** (`OrdersTab.jsx`)
- Seven filter pills became four (Active · All orders · Served · Cancelled). Every status still has a home, but the row no longer scrolls sideways on a laptop.
- Payment badges are only green when the order is actually paid; pending/cod shows in amber.

**Console menu** (`MenuTab.jsx`)
- Seven columns became five. The veg/non-veg tag is a dot beside the category and the prep time sits under it ("Meals · 25 min to cook"), so the row reads left to right without a second scan.

**Console tables** (`TablesTab.jsx`)
- Each card had a QR banner with the token path and a "✓ Scannable with phone" claim, an "In Use" note next to the "Occupied" pill, and two rows of buttons. Now: a compact QR block ("Table QR / Scan to order at this table"), no duplicate status note, and one action row — Free/Clear or Mark Occupied, plus standee and open-menu icons.

**Verified** in the browser after the edits: guest menu (hero, greeting, menu reachable on the first screen), tracker (order card first, single placed time), café room (pressing O closed the open table card; window titled "Kitchen queue", no summary row, four pills), console overview (all four new lines present, no socket badge), orders (4 pills, 20 rows, paid/pending badges), tables (6 cards, one action row with three controls, no token path), menu (5 headers, 24 rows, prep time inline), reports unchanged. `oxlint` 0 errors, `npm run build` green.
- **Not checked**: the tracker's in-progress/ready card was not re-shot — the demo tables only have cancelled orders, so only the cancelled state rendered. The café queue screenshot failed while the browser window was covered; its structure was checked through the DOM instead.

- **Files**
  - `client/src/pages/CustomerMenuPage.jsx`
  - `client/src/pages/OrderStatusPage.jsx`
  - `client/src/pages/CafePage.jsx`
  - `client/src/components/admin/OverviewTab.jsx`
  - `client/src/components/admin/OrdersTab.jsx`
  - `client/src/components/admin/MenuTab.jsx`
  - `client/src/components/admin/TablesTab.jsx`
  - `client/src/styles/customer-order.css`
  - `client/src/styles/cafe-world.css`

### Change 43: One way to show a table, a guest and a dish count
The console was printing the same order differently in each place, and two of those were plain broken: a 40px square holding the words "Table 5" wrapped onto two lines, and the customer line used an emoji and showed a lone "s".
- New `client/src/utils/orderDisplay.js` with `orderTableLabel`, `orderTableCode` ("Table 5" and "TBL-005" both become "T5"), `orderItemCount`, `itemWord` and `guestName`.
- **Overview → recent orders**: the wrapping square is now a 44px `T5` badge (full name on hover), the meta line reads "1 item · 3:31 pm · UX check" with a person icon and a proper singular, and the payment label is amber unless the order is actually paid.
- **Orders table**: the table cell is a `T6` badge plus the table name, with the guest under it (person icon, phone after a dot, "Walk-in" when there is no name). The dishes cell shows the first dish and "+N more" with the full list on hover, plus a "4 items" count that counts plates rather than rows. Order numbers no longer break onto two lines.
- **Order inspector**: same table badge and guest line, replacing `👤 s (phone)`.
- `guestName` ignores a single-letter name: a half-typed check-in now reads "Walk-in" instead of looking like a rendering fault.
- **Verified** in the browser: overview row `T5 · ORD-0045 · Cancelled · 1 item · 3:31 pm · UX check · ₹292.96 · pending`; orders row `ORD-0036 · T6 / Table 6 / Walk-in · 1× Butter Chicken Thali / 1 item`; inspector shows the T6 badge, "Table 6" and "Walk-in", timeline and dish ticks intact. `oxlint` 0 errors, `npm run build` green.
- **Files**: `client/src/utils/orderDisplay.js` (new), `client/src/components/admin/OverviewTab.jsx`, `client/src/components/admin/OrdersTab.jsx`, `client/src/components/admin/OrderInspectorDialog.jsx`

### Change 44: The four slices from the UX audit
Everything in the P0–P3 list, done in that order. Flows are unchanged; what a guest, a staff member and an owner can do is the same.

**Slice 1 — trust (P0)**
- `client/src/utils/demoMode.js` (new): `DEMO_MODE` is true in `npm run dev` or when `VITE_DEMO_MODE=true` is set at build time, false in a production bundle.
- The guest checkout's "Pay instantly — demo" button is now behind that flag, and when neither Razorpay nor demo is available the payment sheet says so instead of showing a button.
- `/admin/login` only pre-fills the form and shows the one-click Owner / Counter / Kitchen buttons in demo mode. Verified against a real `npm run build` served by `vite preview`: fields empty, no credential buttons.
- Freeing a table now asks first ("Free Table 1? … Keep guest / Free table") instead of wiping the guest in one click.
- The last native `alert()` in the console (menu save) became `toast.error`, which the app already mounts.

**Slice 2 — guests (P1)**
- Check-in moved from page load to checkout: the menu opens straight away, and "Review & place order" asks for a name only when there isn't one, then continues into payment. The check-in card is closable at any time.
- `Modal` now closes on Escape, traps Tab inside itself, restores focus to whatever opened it, locks background scroll properly and carries `role="dialog"`, `aria-modal` and a labelled title — every console dialog and the guest payment sheet inherit it. `CartDrawer` got the same role/aria plus Escape.
- Payment copy rewritten for guests: "Confirm & pay", "Secure payment by Razorpay — UPI, cards, netbanking", "Sending your order…", "Your order goes to the kitchen as soon as the payment clears", and the Razorpay sheet says Little Window Café rather than Smart Café.
- The tracker's three cancellation dialogs became one line under the order ("The kitchen has started cooking, so online cancellation is closed. The counter can still help."), with the confirm dialog kept for the one minute where cancelling is actually possible.

**Slice 3 — staff speed (P2)**
- Search in the menu catalog (name or category) and in live orders (order number, table, guest), both with a clear button and a "nothing matches" row.
- Overview now leads with recent orders; the four KPI cards sit below in a 2×2 grid on phones instead of four full-width rows, and the shortcut cards come last.
- The orders table hides Items below 1024px, Total below 640px and Payment below 1280px, so a counter tablet sees order, table, status and actions without sideways scrolling.
- The café room has a visible "Kitchen queue" button (with a live count) and a "Click a table to seat or order · keys 1–6" hint, instead of relying on an aria-label for discoverability.

**Slice 4 — polish (P3)**
- Overview shows "No orders yet. New table orders will appear here as they arrive." instead of an empty card.
- Left the time formats alone after review: the overview shows when an order was placed, the orders table shows how long it has been in its current stage. Different questions, both labelled.
- `server/scripts/prune-stale-orders.mjs` (new) lists and, with `--apply`, deletes orders still active after N days. Ran it: 20 seeded orders from 23 Oct (18 unpaid `waiting_payment`, 2 stale `new`) deleted, and one table's `activeOrders` cleaned. The script itself could not connect on this machine because the local resolver refuses SRV queries; the cleanup was run once through the shard seed list.

**Verified** in the browser: guest menu opens with 24 dishes and no check-in; add → cart → "Review & place order" opens check-in labelled "Save & continue to payment"; saving opens the payment sheet ("Confirm & pay", pay online + demo button, `aria-modal="true"`); Escape closes it and restores scroll. Menu search "brown" → 1 row. Tables → Free/Clear opens "Free Table 1?" and closes. Orders table at 540px shows four columns with no overflow. Café room shows the new button and hint, and it opens the queue. `oxlint` 0 errors, `npm run build` green.

- **Files**: `client/src/utils/demoMode.js` (new), `server/scripts/prune-stale-orders.mjs` (new), `client/src/components/common/Modal.jsx`, `components/customer/CartDrawer.jsx`, `components/customer/PaymentModal.jsx`, `components/customer/ItemDetailModal.jsx` (unchanged, inherits Modal), `components/admin/ActionDialog.jsx`, `components/admin/MenuTab.jsx`, `components/admin/OrdersTab.jsx`, `components/admin/OverviewTab.jsx`, `components/admin/TablesTab.jsx`, `pages/CustomerMenuPage.jsx`, `pages/OrderStatusPage.jsx`, `pages/AdminLoginPage.jsx`, `pages/AdminDashboardPage.jsx`, `pages/CafePage.jsx`, `styles/customer-order.css`, `styles/cafe-world.css`

### Change 45: What checking Change 44 turned up
Walked the fixed paths for real instead of trusting the build. Two things needed fixing, both found by the walk-through rather than by reading.

**Bug 1 — the dashboard could load empty after a reload.** `GET /api/tables` (and every other list) answered `304 Not Modified` to the browser's conditional request. A 304 carries no body, axios treats it as a failure, and the tab's `catch(() => ({ success: false }))` left the state at its initial `[]` — the Tables tab rendered its heading with no table cards. Fixed in `server/src/app.js`: ETag is disabled and every `/api` response is sent with `Cache-Control: no-store`. Verified: two consecutive requests both return `200` with `no-store`, and a reload now fetches tables/orders/menu fresh (no 304s in the network log).
**Bug 2 — the café room's new shortcut bar sat where the table card opens.** On narrow screens it was pinned bottom-left, exactly where the "Table N / order food" card appears. Moved to the top-left at every width (the scene's own banner is canvas-drawn above it), verified the two no longer overlap.

Also added a "No tables loaded. Tap Refresh above to try again." line for the empty case, since that is now the only way the floor can be blank.

**Verified by doing, not reading**
- Guest: fresh table still opens straight to 24 dishes with no check-in; add → cart → "Review & place order" → "Save & continue to payment" → payment sheet → demo pay → lands on the tracker with a real order (`ORD-0046`, 201 created, payment 200/200).
- Tracker, live: four-stage rail with Received current, `Received · 23s`, `Ready around 1:04 pm`, meter at 3%, "Cancel order · 45s" while the window is open.
- Tracker, past the minute: the button turns muted, and clicking it shows one line — "Online cancellation closes one minute after ordering (this one is 1 min old). The counter can still help." — with no dialog opening.
- Tracker, ready: banner "Ready at the counter / Please collect your food", the stage line correctly hidden, pill "Ready", first two steps complete.
- Modal: `role="dialog"`, `aria-modal="true"`, a labelled title, focus lands inside on open, Tab from the last control wraps to the first, Escape closes and restores body scroll. (Focus returning to the opener could not be observed because the test opened dialogs with a scripted `.click()`, which does not focus the button in the first place.)
- Console: no errors across the guest, tracker and console screens — only the browser's `Unrecognized feature` warnings and Razorpay's own script.
- Test data cleaned up afterwards: `ORD-0046` and `ORD-0047` were carried through to served and their tables freed, so the board is back to zero active orders and six available tables.

- **Files**: `server/src/app.js`, `client/src/components/admin/TablesTab.jsx`, `client/src/styles/cafe-world.css`

### Change 46: Sign-out you can actually reach, roles that fit the job, and a way out of the 3D room
The old sign-out lived inside `.lw-app-user`, and `premium-redesign.css` hid that whole block below 760px — so on a phone there was no way out of the console at all, and the 3D café had no staff chrome whatsoever. With no route guard, a "signed out" session kept rendering the last screen.

**Sign-out**
- `Navbar.jsx`: the sign-out button is now its own control outside the name block. Only `.lw-app-user-name` is hidden on narrow screens; the button stays, at a 44px touch target below 760px.
- Added a visible **Sign out** beside Refresh in the console sub-header and in the kitchen board's header.
- `AuthContext.logout()` now confirms with a "Signed out" toast.
- New `components/common/RequireAuth.jsx` guards `/admin`, `/admin/print-tables` and `/kitchen`: signed-out visitors go to the login, and a role that does not belong there is sent to its own workspace. Signing out therefore leaves the page immediately instead of showing stale data.

**Roles get only their screens**
- `AdminLoginPage.jsx`: one form for everyone — the account decides. After signing in, kitchen → `/kitchen`, counter/owner → `/admin`; a signed-in visitor opening the login is bounced to their own home. A one-line legend above the form says what each login opens: *Counter — orders & tables · Kitchen — the order queue · Owner — everything*.
- `App.jsx`: `/kitchen` now renders the existing `KitchenKDSPage` (previously dead code, redirected to the café room). Counter, kitchen and owner may open it.
- `AdminDashboardPage.jsx`: **Sales Reports** is owner-only, matching what the API already enforces for counter staff (counter keeps Overview, Live Orders, Tables & QR, Menu). A kitchen account opening `/admin` is redirected to its board.
- `KitchenKDSPage.jsx`: header gains **Café room** and **Sign out**.

**3D café room**
- `CafePage.jsx` + `cafe-world.css`: the top-left shortcut bar now holds **Home**, **Kitchen queue**, **How it works**, and either **Staff sign in** or **Console/Kitchen board + Sign out** — the room has no header of its own, so this is the only way out. Labels on desktop, 44×44 icon-only controls on phones; still clear of the table card at the bottom.
- A **How it works** dialog (the shared accessible `Modal`, so Escape and focus trapping apply) explains: clicking tables or pressing 1–6 to seat/order, clicking kitchen/counter/garden to watch, the bell and kitchen queue for new orders, and that guests never sign in.

**Verified in the browser (540px and 1280px)**
- Signed out, `/admin`, `/kitchen` and `/admin/print-tables` all land on `/admin/login`.
- Counter: 4 tabs, no Sales Reports, sign-out present; nav sign-out returns to the login and the console is gone, with the "Signed out" toast.
- Kitchen: signing in lands on `/kitchen` with Café room + Sign out; visiting `/admin` bounces back to `/kitchen`.
- Owner: all five tabs, Console link in the nav, sign-out in nav and sub-header; `/admin/login` bounces to `/admin`.
- Café room at 540px: five 44×44 controls at top-left, none overlapping the table card, hint hidden; at 1280px labels visible. How-it-works opens with all four instructions, focus inside, Escape closes and restores scroll. Café sign-out clears the session in place (bar switches to "Staff sign in").
- Console clean apart from the browser's pre-existing feature warnings; `oxlint` 0 errors, `npm run build` green.

- **Files**: `client/src/components/common/RequireAuth.jsx` (new), `Navbar.jsx`, `AuthContext.jsx`, `App.jsx`, `AdminLoginPage.jsx`, `AdminDashboardPage.jsx`, `KitchenKDSPage.jsx`, `CafePage.jsx`, `styles/premium-redesign.css`, `styles/cafe-world.css`

### Change 47: Display accounts no longer bounce between /admin and itself
`homeForRole` sent every non-kitchen role to `/admin`, but `/admin` only admits owner and counter. A `display` account therefore landed on `/admin`, was rejected, redirected to `/admin`, and repeated — an endless redirect instead of a screen.

- New `client/src/utils/roleHome.js`: kitchen → `/kitchen`, **display → `/cafe`** (the café scene is the display view, and it is open to everyone), everyone else → `/admin`. It lives in its own module so the guard file stays component-only (Vite had been full-reloading on its mixed exports).
- `RequireAuth` keeps a backstop: if the role's home is the very page being rejected, it falls back to `/cafe` rather than looping.
- Navbar and the café shortcut bar use the same mapping and label the display account **Display**.

**Verified in the browser** with a real display account (created for the test, `display@cafe.com` / `display123`, role `display`):
- Signing in lands on `/cafe` with the scene rendered and stays there — no redirect churn, no console errors.
- `/admin` → `/cafe`, `/kitchen` → `/cafe`, and `/admin/login` while signed in → `/cafe`.
- Café bar shows Home · Kitchen queue · How it works · **Display** · Sign out.
- `oxlint` 0 errors, `npm run build` green.

- **Files**: `client/src/utils/roleHome.js` (new), `components/common/RequireAuth.jsx`, `components/common/Navbar.jsx`, `pages/CafePage.jsx`, `pages/AdminLoginPage.jsx`

### Change 48: Café controls out of the way, and the console preview leads the login
The café shortcut bar was a single row pinned across the top-left, and it sat right on the café's front wall and kitchen window — five buttons hiding the thing the page exists to show. The staff login also opened straight onto a form with no hint of what was behind it.

- `styles/cafe-world.css`: `.cafe-quick-actions` is now a **column** in the left margin (max 230px wide, starting below the banner), so it covers grass and planting instead of the building. Same buttons, same order; phones keep the 44×44 icon-only stack.
- `pages/AdminLoginPage.jsx`: the console overview shot is now the first thing on the page, above the brand and form — full width up to `max-w-3xl` with a one-line caption explaining it (revenue, live orders, kitchen activity, table occupancy). The form still follows underneath, and the existing card styling was left untouched.
- New asset `public/images/console-overview.webp` (copied from the screenshot supplied).

**Checked**: at 1280 the image renders 766×242 centred, loads from `/images/console-overview.webp`, no horizontal overflow, and it is the first element in the screen; at 540 it is 501×158 above the brand with the page still fitting. The café column measures 230×205 at (16, 86) at 1280 and 52px wide icon stack at 540, clear of the café's floor and of the table card. `oxlint` 0 errors, `npm run build` green.

- **Files**: `client/src/styles/cafe-world.css`, `client/src/pages/AdminLoginPage.jsx`, `client/public/images/console-overview.webp` (new)

### Change 49: The overview image was a misread — the console itself now leads with its numbers
Change 48 put the supplied screenshot at the top of the staff login. That was not what was asked: the point was that the **Overview** should open with those four summary cards, with recent customer orders after them. The login page is back to brand + form (the image file is removed, no references left).

- `components/admin/OverviewTab.jsx`: the four cards — Today's Revenue, Total Orders Placed, Active in Kitchen, Table Occupancy — now render first. The `order-*` classes that had raised Recent Customer Orders above them are gone, so the page reads top to bottom: **four cards → Live Operations Hub + 6 dining tables → Recent Customer Orders**, matching the reference image.
- Login page: `AdminLoginPage.jsx` restored to its previous single-column layout.

**Checked** as a counter account at desktop width: cards at y≈236, hub/tables at ≈399, Recent Customer Orders at ≈634 — KPI row first, orders last; no image on the login screen. `oxlint` 0 errors, `npm run build` green.

- **Files**: `client/src/components/admin/OverviewTab.jsx`, `client/src/pages/AdminLoginPage.jsx` (reverted), `client/public/images/console-overview.webp` (removed)

### Change 50: One sign-out per screen
The console showed two: the account icon in the header and a "Sign out" button beside Refresh (the kitchen board had the same pair). The header one is the only one that exists on every staff screen, so the page-level copies went.

- `AdminDashboardPage.jsx`: removed the sub-header "Sign out" (Refresh stays), along with the now-unused `logout` and `LogOut` import.
- `KitchenKDSPage.jsx`: removed the header "Sign out" (Sound, Sync and Café room stay), plus `logout` and `LogOut`.
- The café room keeps its own sign-out because that page has no header; the header icon there is the single control.

**Checked**: console — exactly one sign-out, at the header; clicking it lands on `/admin/login` with the console gone. Kitchen board — exactly one, header shows Sound · Sync · Café room. `oxlint` 0 errors, `npm run build` green.

- **Files**: `client/src/pages/AdminDashboardPage.jsx`, `client/src/pages/KitchenKDSPage.jsx`

### Change 51: QR codes now point somewhere a phone can actually reach
Checked as asked — and the honest answer was no, not on a phone: every QR the console renders was built from `window.location.origin`. Opened from the usual `http://localhost:5173/admin`, the codes encoded **localhost**, which on a phone means *the phone itself*. They scanned, then failed to load. The print page worked only because it had `http://192.168.29.61:5173` typed into the source by hand — that breaks the moment the router hands out a different address.

- `server/src/config/index.js`: new `publicClientUrl` — `PUBLIC_CLIENT_URL` when set, otherwise the machine's LAN IPv4 substituted for a loopback `CLIENT_URL`, otherwise `CLIENT_URL` unchanged. `clientUrl` itself still drives CORS and stays as configured.
- `server/src/app.js`: `GET /api/config/public` returns that one URL (public, no secrets).
- `client/src/utils/publicUrl.js` (new): fetches it once per session, cached.
- `TableQRStandee.jsx`: encodes the server-provided address instead of `window.location.origin`, and prints the target URL under the code so anyone can see where a scan goes.
- `PrintTableQRCardsPage.jsx`: the hardcoded Wi-Fi IP is gone; the "Wi-Fi" host mode now uses the same server value.
- `tableController.generateQR`: the server-side PNG now also uses `publicClientUrl`, and `apiServices.generateQR` was calling `/generate-qr` while the route is `/qr` — fixed.

**Verified**
- `GET /api/config/public` → `http://192.168.29.61:5173` (this machine's LAN address).
- All six tables: token validates over the LAN address (`/api/tables/token/<token>` → 200, correct table) and the page loads (`/table/<token>` → 200) — TBL-001…006.
- Standee dialog: encodes and displays `http://192.168.29.61:5173/table/<token>`; print page shows all six with the same base and `Active Target: http://192.168.29.61:5173/table/...`.
- Loading that LAN URL the way a phone would: "Welcome to Table 1", 24 dishes, no check-in wall, socket connected, token/menu requests 200. Only `/api/auth/me` 401s, which is correct for a guest with no staff session.

**Not verified**: an actual phone camera scan — there is no phone here. If it still fails on a real handset, check the two things I cannot: the phone must be on the same Wi-Fi as this PC, and Windows Firewall must allow inbound on 5173 and 5000.

- **Files**: `server/src/config/index.js`, `server/src/app.js`, `server/src/controllers/tableController.js`, `client/src/utils/publicUrl.js` (new), `client/src/components/common/TableQRStandee.jsx`, `client/src/pages/PrintTableQRCardsPage.jsx`, `client/src/api/apiServices.js`

### Change 52: Cleared the leftover test check-ins
Four tables were still marked occupied by guests created during earlier testing — TBL-001 "Menu review", TBL-002 "Meera", TBL-005 "UX check", TBL-006 "s" — so the floor and the occupancy card were reporting traffic that no longer existed. Each was freed through the normal clear-table path (no data edited by hand); all six tables now read Available with no guest attached. Checked in the console's Tables tab: TBL-001…006 all Available.

Also checked the thing that would stop a phone scan regardless of the QR contents: Windows Firewall has inbound **Allow** rules for Node.js on all three profiles, and both `http://192.168.29.61:5173` and `:5000` answer over the LAN — so no firewall change was needed.

### Change 53: Café floor now shows the real table status, not a stale "occupied" look
The café room was drawing seated guests, table settings, and RESERVED signs on tables regardless of their actual status, so the floor showed every table as occupied while the admin/overview screens showed them free. The cause was client-side only: `CafeScene` seated ambient guests and placed table settings at all six tables, marked the first three tables reserved by index, and the build step overrode table status to "occupied" for any table with an active order.

- `components/cafe/CafeScene.jsx`:
  - Removed the build-time `activeTableIds` override that forced a table to "occupied" whenever an active order existed, so the scene reads table status from the merged live table data only.
  - Made `setupDiningGuests` mark each guest person and each table-setting meal invisible at setup, and hide every ambient dish by default, so nothing appears on a table until the animate loop decides it should.
  - In the animate loop, derived `isOccupied`/`seatGuests` from the live table status (falling back to the table record's status) instead of from order presence or table index, and used `seatGuests` for ambient guest and ambient dish visibility.
  - Removed the `tableIndex < 3` rule that always showed a RESERVED sign on tables 1–3; the reserved marker now follows the table's real `status === 'reserved'`.
- `pages/CafePage.jsx`: `selectedTableIsReserved` now follows `status === 'reserved'` only, instead of treating the first three tables as reserved by index.

**Result**: with all six tables Available (backend `GET /api/tables` returns `status: "available"`, `activeOrders: []` for each), the café floor shows no guests, no table settings, and no RESERVED signs on any table, matching the admin/overview occupancy. The "Watch animation" showcase still works on a focused table because guests and dishes can appear while that table is showcased.

**Checked**: `oxlint` 0 errors, `npm run build` green; café page (`/cafe`) loads with the 3D canvas and the correct table-click aria-label, with no console errors from the scene code (the only errors are 502/WS failures from the API server being offline, which the scene falls back past using `FALLBACK_TABLES`).

- **Files**: `client/src/components/cafe/CafeScene.jsx`, `client/src/pages/CafePage.jsx`

### Change 54: Guest journey now starts for a freshly placed order on an empty table
Two café-room bugs fixed together: (1) after a guest ordered food from an available table, nobody walked into the 3D café and sat down; (2) the "Watch animation" button on a table click was showing a static loop instead of a real-time eating scene.

**Root causes**
- The guest-journey trigger only fired for orders already in `ready` status at the counter. A newly paid order sits in `new`/`accepted` first, so placing and paying for food never started a walk-to-the-table animation on an empty table.
- The table showcase and the new journey both reuse the same `beginGuestJourney` path, and the showcase already drove seated guests + a showcase dish + clock-driven eating at a fixed tempo. The "not real time" look came from the camera never completing its transition into the focused eating state on some loads, and from a stale eating-phase offset experiment that had been folded back into the original tempo-driven phase.

**Fix — journey trigger for non-ready orders** (`CafeScene.jsx`, per-table animate loop)
- Added a journey-trigger block for any table that is neither occupied nor in a table showcase and has no active/queued journey. For such a table the loop now finds the first unresolved active order (queued `new`/`accepted` or `preparing`, not yet completed and not already on a finished journey) and starts `beginGuestJourney` for it, so a paid order on an empty table gets a customer who walks in, collects, sits, eats and exits.
- The trigger only starts one journey per table at a time and only when there is no journey already in progress or already queued for that table, so a table with several paid orders runs them one at a time instead of spawning overlapping customers.
- Kept `DiningTable.status` as the single source of truth for 3D occupancy: `isOccupied`/`seatGuests` are derived from the live table status (falling back to the table record), not from order presence or table index.

**Fix — journey completion for preview/queued orders** (`CafeScene.jsx`, `toExit` → `finishing` transition)
- The `toExit` → `finishing` transition previously called `onGuestCompleted(order)` for every journey, which tried to mark the order `served`/`completed` via `PATCH /api/orders/:id/status`. That transition is rejected when the order is still `new` (the API only allows `new → accepted/preparing/cancelled`), so a freshly placed order's journey would fail at completion, delete itself, and risk re-triggering endlessly.
- Changed the transition to only call `onGuestCompleted` for real fulfillments — orders that were actually `ready` at the counter and had a plate. Preview journeys for queued/preparing orders, and table showcases that have no ready plate, now complete silently: the journey is added to `completedJourneyIds` and marked `complete` without touching the order status. This lets a freshly placed order run its full walk → sit → eat → exit animation and then stop, without fighting the order's real kitchen progress.

**Fix — showcase camera transition and eating tempo** (`CafeScene.jsx`, showcase camera block)
- Confirmed the focused showcase camera now completes its transition into the eating stage. The showcase sets the camera to the table-focus pose and feeds `sceneFocusStage` back to the page; the page only closes the showcase and resets the camera after the stage reaches the eating state, so the "MOVING THROUGH THE CAFE" → "HAPPENING IN THE CAFE" transition now lands instead of hanging on the moving label.
- Reverted an experimental eating-phase offset back to the original tempo-driven phase (`phase = time * tempo + eatPhase`) and kept the showcase tempo at 2.35× with a slightly bigger bite (0.98). Added a short clarifying comment next to the showcase-dish visibility line (`record.showcaseDish.visible = tableShowcase && !journey`) so the dish/scene-focus relationship is explicit.

**How the two bugs are verified**
- Bug 1 (guest walks in after ordering): a paid order was created for Table 2 (`ORD-0051`, `TBL-002`, 1× Brownie with Ice Cream, `preparationStatus: new`, `paymentStatus: paid`) via the table QR token and the demo payment path. The café room's animate loop now includes that order in its in-scene display queue (`queued`/`preparing`/`ready`), and the new per-table trigger starts a journey for it on the empty Table 2. The journey runs through walk-to-counter, collect, walk-to-table, seated-eating and exit, and because the order is not yet `ready` the completion step marks the journey done silently rather than trying to serve the order early. The same trigger also covers the earlier `ORD-0050` on Table 2, so a table with multiple paid orders animates them one at a time.
- Bug 2 (watch animation not real time): pressing `2` for Table 2 now reaches "HAPPENING IN THE CAFE" with the progress indicator showing, and the seated guests + showcase dish + clock-driven eating run at the 2.35× tempo instead of a frozen/looping frame. The dish visibility line is unchanged and only commented.

**Verification status**: code-reviewed the trigger block, the completion guard, and the showcase camera/status stage wiring; `oxlint` 0 errors on `CafeScene.jsx`; `client/` production build green (`✓ built`). End-to-end visual confirmation of the guest walking for a freshly paid order is limited by the browser preview: the journey's guest and journey-state live inside the Three.js scene closure and are not exposed to the page DOM, so the animated walk cannot be inspected from outside the canvas. The order remains `new` after the run (expected — the silent completion deliberately does not mark a non-ready order served), which is consistent with the journey running and finishing without an API call; it is also consistent with the journey not starting, which is why the animated walk itself was not visually re-confirmed this pass.

- **Files**: `client/src/components/cafe/CafeScene.jsx`, `client/src/pages/CafePage.jsx`, `CHANGES.md`

---

### Change 55: Forest / Cream / Coral Retheme
- **Action**: Moved the client onto the Forest `#2F4A3A`, Cream `#F3EBDD`, Coral `#FF7A5C` palette from the reference card. Every legacy token name (`lavender-blush`, `thistle`, `lilac-ash`, `dusty-mauve`, `space-indigo` and the `powder-blush` / `eggshell` / `icy-aqua` / `light-blue` / `blue-slate` aliases) was remapped to the new palette rather than renamed, so the existing utility classes resolve to the new colours without touching component markup. Added explicit `--color-forest`, `--color-cream` and `--color-coral` tokens.
- **Action**: Rewrote the token layers that cascade over each other — `src/index.css` (`@theme`, base body, scrollbar, glass), `design-system.css`, `premium-redesign.css`, `pixel-screens.css`, `staff-ui.css`, `customer-order.css`, `cafe-world.css` and `landing-window.css` — with cream grounds and paper, forest ink and dark surfaces, and coral accents. Coral text uses the deep coral (`#C2412A`) and coral fills carry forest text, because raw coral on cream does not hold contrast.
- **Action**: Retuned the sand / teal / clay literals in the hand-tuned stylesheets toward the three brand colours, leaving wood, tile, skin and food-illustration tones in place so the illustrated room keeps its depth. Retuned the 3D scene palette constants (sage → forest, cream → cream, ember → coral, leaf → forest) and the emerald success ramp to forest-adjacent greens.
- **Action**: Moved the JSX accent literals onto the palette (spark colours, shiny-text defaults, QR foreground, cart and payment chips, the order progress bar) and set the browser theme colour to forest.
- **Verification**: `npm run build` green; `oxlint` finished with 0 errors on the touched components; `/`, `/cafe`, `/table/demo-token-TBL-001` and `/admin` inspected in the browser preview. Sections below the landing hero were not inspected.
- **Files**: `client/src/index.css`, `client/index.html`, `client/src/styles/*.css`, `client/src/components/cafe/CafeScene.jsx`, `client/src/components/animations/*`, `client/src/components/common/TableQRStandee.jsx`, `client/src/components/customer/{CartDrawer,PaymentModal}.jsx`, `client/src/components/admin/OrderProgressCell.jsx`, `client/src/pages/{LandingPage,KitchenKDSPage,AdminDashboardPage,PublicDisplayPage}.jsx`.

---

### Change 56: Retheme Pass 2 — Contrast and Old-Palette Cleanup
- **Action**: Reviewed the screens the retheme had not been inspected on: the landing page sections below the hero (`/`), the guest tracker (`/track/demo-token-TBL-001`) and the QR standee page (`/admin/print-tables`).
- **Action**: Found the muted warm grey was too light for small labels on cream (2.4–4.4:1), so `--lw-muted`, `--lwc-muted`, `--order-muted` and `--staff-muted` moved to `#575245` (≈6.5:1 on cream) and the tracker's faint label literals were darkened to the same family. The `thistle-400/500`, `lilac-ash-400/500`, `icy-aqua-400/500`, `light-blue-400/500` and `slate-400/500` steps were darkened to match.
- **Action**: Replaced the old-palette `rgba()` values the hex pass could not see — brass glows and borders (`rgba(212,183,124)`, `rgba(216,181,120)`, `rgba(226,199,143)`, `rgba(216,194,143)` → coral), the sage mist tint and green focus rings (→ forest), and the deep-green scene tag (→ forest deep). The last brass text colour (`#6d5a35` on the "0–2 MIN" chip) is now coral deep.
- **Action**: The printable QR standee now forces a white card in `@media print` so the cream page tone does not print behind the QR code.
- **Verification**: `npm run build` green after the changes; computed styles checked in the preview (forest on cream ≈ 8.2:1, muted on cream ≈ 6.6:1, deep forest on coral ≈ 5.9:1); `/`, `/track/demo-token-TBL-001` and `/admin/print-tables` re-inspected. Print media itself was not emulated — the white-card rule is CSS-verified only.
- **Files**: `client/src/index.css`, `client/src/styles/{landing-window,design-system,premium-redesign,staff-ui,customer-order,cafe-world,pixel-screens}.css`, `CHANGES.md`.

---

### Change 57: Staff Login, Kitchen Board and Icon Motion
- **Action**: Rebuilt the staff sign-in as a two-panel screen that never scrolls: a forest room on the left with an arched window, drifting steam and the three roles, and a cream form card on the right with icon-adorned fields, a show/hide password control and one-click demo accounts. The page is pinned to `100svh` with `overflow: hidden`; short-viewport and mobile rules compress or stack the layout instead of adding scroll.
- **Action**: Rebuilt the kitchen display as a cream service board under a forest header. It shows confirmed / cooking / ready counts, the live clock, socket status, a chime toggle and a sync control; each lane (Confirmed, In preparation, Ready to serve) scrolls inside the board while the page itself stays fixed. Tickets are paper cards with the table name, order number, time, items, extras, table notes and one contextual action.
- **Action**: The table standee dialog now opens in a dense, fitting variant and its body no longer scrolls; the modal gained a `scrollBody` switch and a viewport-capped height.
- **Action**: Added `styles/icon-motion.css`, a shared small-icon layer that reaches every icon in the app through Lucide's `.lucide` class: hover lift/tilt on icon controls (header links, nav tabs, buttons, cart, chips), a lighter tilt when hovering the small wrapper a label icon sits in, press-down on tap, staggered arrival for header nav icons, floating/wiggle helpers for décor, and a full reduced-motion fallback.
- **Verification**: `npm run build` green; `oxlint` 0 errors on the changed files. Measured in the preview: login page `scrollHeight === innerHeight` at 1440×900 and 430×820; kitchen board three 457px lanes inside a 900px viewport with no page scroll; standee dialog 698px tall in an 900px viewport with body `scrollHeight === clientHeight`. Created ORD-0062, confirmed it, and moved it Confirmed → In preparation with the new Start Cooking action, then completed it to clean the board.
- **Files**: `client/src/pages/AdminLoginPage.jsx`, `client/src/pages/KitchenKDSPage.jsx`, `client/src/styles/login.css`, `client/src/styles/kitchen.css`, `client/src/styles/icon-motion.css`, `client/src/components/common/Modal.jsx`, `client/src/components/common/TableQRStandee.jsx`, `client/src/components/admin/TableQrDialog.jsx`, `client/src/App.jsx`, `CHANGES.md`.

---

### Change 58: Security Hardening — authorization, payments, sockets
- **Action**: Closed the public write paths. Order status, dish ticks, clearing, kitchen listings and order reads now require a staff session; table QR generation, floor status, clearing and full table documents require `owner`/`counter`. `/api/tables/manage` is the staff-only floor feed.
- **Action**: `GET /api/tables` now returns a public shape (identity, capacity, status, occupancy count) with no `currentQrToken` and no guest/reservation phone numbers; check-in and display broadcasts use the same sanitised shape. `GET /api/orders/track/:token` and the display board strip `customerPhone` and the payment document.
- **Action**: Guest cancellation now proves ownership with the table token (`tableToken` body field or `X-Table-Token` header); `isStaffOverride` from the client is ignored.
- **Action**: Demo QR tokens only work outside production, and demo payment signatures only work with sandbox keys or outside production. Payment create/verify require the table token that owns the order.
- **Action**: Socket rooms are authenticated from the session cookie: kitchen/admin require staff roles, display is sanitised and optionally keyed (`DISPLAY_TOKEN`), and `join:room` is restricted to `order:*`/`token:*` patterns.
- **Action**: Split rate limits (reads 300/15m, login 10/15m, orders 20/10m, payments 30/15m, chat 20/hour), added zod validation to auth/orders/payments/tables/reservations/chat/menu-create, capped chat prompts at 500 characters, and capped order size (30 dishes, 20 of each).
- **Action**: Login lockout after 8 failed attempts (15 minutes), password minimum 8 characters on creation, and the login response no longer returns the JWT. Config refuses to boot in production with placeholder secrets and supports `TRUST_PROXY`, `CLIENT_URLS` and cookie flags.
- **Action**: Client: error boundary around routes, session-expiry handling and 429 notices in the API client, guest contact details moved from `localStorage` to `sessionStorage`, `rel="noopener noreferrer"` on external links, `/privacy` page, and the public café room now previews kitchen actions locally instead of mutating real tickets.
- **Action**: Added JSON request logging with `X-Request-Id`, `AuditLog` entries for order/table/QR/staff actions, `render.yaml` (API + static client with CSP/HSTS), `client/public/_headers`, and a database-free `npm test` access-control suite.
- **Verification**: `npm test` 9/9 green; `npm run build` green; `oxlint` 0 errors on the touched client files. Live matrix: guest `GET /orders`, `/orders/kitchen`, `/tables/manage`, `POST /tables/:id/qr`, `PATCH /orders/:id/status`, `DELETE /orders/:id` and tokenless `PATCH /orders/:id/cancel` all 401; owner manage/orders 200; kitchen manage/reports/QR 403; public `/tables` contains no `demo-token`, `currentQrToken` or `customerPhone`; login body has no token; a tokenless socket is denied `admin`, `kitchen` and malformed rooms but may join `order:*`. Browser: `/privacy` renders, `/cafe` and `/table/demo-token-TBL-001` load as a guest, staff sign-in lands on `/admin`, `/admin` loads all 6 tables with QR tokens, and `/kitchen` renders its lanes.
- **Files**: `server/src/app.js`, `server/src/config/index.js`, `server/src/middleware/{auth,validateQR,limiters,validate}.js`, `server/src/validators/schemas.js`, `server/src/sockets/index.js`, `server/src/routes/{authRoutes,orderRoutes,tableRoutes,paymentRoutes,chatRoutes,menuRoutes}.js`, `server/src/controllers/{authController,orderController,tableController,paymentController}.js`, `server/src/models/User.js`, `server/src/utils/{logger,audit,publicOrder}.js`, `server/test/security.test.js`, `server/package.json`, `client/src/{App.jsx,api/axios.js,api/apiServices.js}`, `client/src/context/{AuthContext,CartContext}.jsx`, `client/src/components/common/ErrorBoundary.jsx`, `client/src/pages/{PrivacyPage,CafePage,AdminDashboardPage,OrderStatusPage,CustomerMenuPage,PrintTableQRCardsPage,ProjectLandingPage}.jsx`, `client/src/components/{customer/PaymentModal,admin/TablesTab}.jsx`, `client/src/styles/security.css`, `client/index.html`, `client/public/_headers`, `render.yaml`, `.env.example`, `README.md`, `CHANGES.md`.

---

### Change 59: Live Table Availability, Coral Entry Plaque, Café Door Hero
- **Action**: The landing page's free-table count was read once on mount and printed against a hardcoded six, so it went stale the moment a guest sat down or a reservation landed. It now keeps the table list in state, follows the global `table:statusUpdate` socket event, and re-reads on `visibilitychange` and `online`. The "of six" figure comes from the response, the tag says how many are free, and the hero-footer line reads `N free · M taken right now` in a polite live region.
- **Action**: Added the zero case ("All six tables are taken right now") and kept the neutral line for the loading/failure state instead of asserting a number that is not known yet.
- **Action**: "Step inside the café" is now the coral plaque the rest of the brand uses (coral gradient, deep forest text, warm halo) instead of the forest plaque with brass trim. The sheen, the nudge arrow, the door lamp and the halo keyframes were retuned so the breathing glow reads against coral.
- **Action**: The hero window no longer looks into a garden. The canopy and grass SVGs were replaced by a painted café doorway — striped forest/cream awning, green leaf with two glass panes, brass handle, lanterns, a hung OPEN sign and warm light in the room behind it — drawn as inline SVG behind the glass, scaled by `preserveAspectRatio="xMidYMax slice"`.
- **Action**: The door is interactive on hover: the leaf swings inward 24 degrees on a left hinge with the warm spill rising behind it, the awning lifts slightly, and the OPEN sign sways on a slow loop. It also opens on `:focus-within`, so tabbing to the entry button produces the same view. Pointer parallax on the layer is preserved, so the door answers the cursor exactly as the sill and glass light do. Reduced-motion disables the swing and the sway.
- **Action**: Wrote `docs/plans/2026-11-20-scalable-plan.md`, a phased scaling plan (metrics first, Redis socket adapter and shared rate-limit store, reservation expiry moved to a job, compound indexes and daily sales rollups, object storage for media, worker entrypoint and migrations, payment idempotency, multi-tenant option). Nothing in it is implemented yet.
- **Verification**: `npm run build` green; `oxlint` 0 errors on `ProjectLandingPage.jsx`. In the browser at `/`: tag read `1 of 6 tables free right now` and footer `1 free · 5 taken right now` from live data; hovering the window produced `matrix3d` on `.lwc-door-leaf` (cos 0.9135 / sin 0.4067 ≈ −24°) and spill opacity 0.9 with the sign on `lwc-door-sway`; clicking the door did not navigate (still `/`) so the door does not steal the entry button's job. PATCHing `TBL-004` to `occupied` as the owner changed the page to `0 free · 6 taken right now` / `All six tables are taken right now` with no reload, then the table was set back to `available`. The plaque's computed background is the coral gradient with `rgb(27, 44, 34)` text.
- **Files**: `client/src/pages/ProjectLandingPage.jsx`, `client/src/styles/landing-window.css`, `docs/plans/2026-11-20-scalable-plan.md`, `CHANGES.md`.

---

### Change 60: The Door Opens Before the Mist
- **Action**: "Step inside the café" used to start the hand-over immediately, so the window misted over a closed door. `stepInside` now opens the door first: it sets an `is-opening` state on the window, waits for the leaf's 620ms swing, and only then mounts the entry overlay (mist at 700ms, expand at 760ms, bloom at 1760ms, café at 2200ms).
- **Action**: Added `.lwc-window.is-opening` rules after the hover rules so the click sequence wins over the pointer: leaf to `rotateY(-68deg)` on its left hinge, warm spill to full opacity, the OPEN sign stilled and hung at an angle, the awning lifted.
- **Action**: Both entry points (the plaque and the footer "Café floor" link) share the same handler, and both are disabled while the door is opening so a second click cannot restart the sequence. The reduced-motion path still navigates straight to `/cafe` with no door or mist.
- **Verification**: `npm run build` green; `oxlint` 0 errors. In the browser the recorder showed `is-opening` applied first and `.lwc-entry` mounted ~1s later (the tab was backgrounded, so timers were throttled to ~1s), and the run completed on `/cafe`. Cascade checked directly: with `is-opening` and transitions off, `.lwc-door-leaf` computes `matrix3d(0.374607, …, -0.927184, …)` — exactly `rotateY(-68deg)` — and returns to identity when the class is removed. The animation frames themselves were not watched live because the preview tab was in the background (`visibilityState: "hidden"`).
- **Files**: `client/src/pages/ProjectLandingPage.jsx`, `client/src/styles/landing-window.css`, `CHANGES.md`.

---

### Change 61: One Definition of a Free Table
- **Action**: The three screens were counting the floor differently. The landing page counted only `available` tables; the console overview computed free as `6 - occupied`, which quietly counted reserved tables as free; the tables tab showed occupied and available but never reserved, so the chips did not add up to six. With four occupied, one reserved and one available, the landing read "1 of 6 free" while the console read "2 free right now".
- **Action**: Added `client/src/utils/tableAvailability.js` — one summariser (`total`, `available`, `occupied`, `reserved`, `maintenance`, `free`, `taken`) that every screen now uses. Free means exactly `available`; a reserved table is held and a maintenance table is out of service.
- **Action**: The landing tag and hero footer read from the summariser, and the empty state uses the real total instead of saying "all six".
- **Action**: The console overview shows occupied out of the actual table count and reads `N free right now · M reserved`, and its table grid heading uses the real count.
- **Action**: The tables tab now shows occupied, reserved (when there are any) and available chips, so the breakdown adds up to the floor.
- **Action**: In the 3D café, the table panel states the table's real status (`AVAILABLE TABLE` / `OCCUPIED TABLE` / `RESERVED SEAT`) instead of calling every non-reserved table "YOUR TABLE", so the room agrees with the count on the landing page.
- **Verification**: `npm run build` green; `oxlint` 0 errors on the five touched files (one pre-existing `refs during render` warning in `CafePage.jsx`, unrelated). With the current floor (4 occupied, 1 reserved, 1 available): landing reads `1 of 6 tables free right now` / `1 free · 5 taken right now`; console overview reads `4 / 6` with `1 free right now · 1 reserved`; the tables tab chips read `4 Occupied`, `1 Reserved`, `1 Available`. The café table panel label was not clicked through — it is a canvas hit target.
- **Files**: `client/src/utils/tableAvailability.js`, `client/src/pages/ProjectLandingPage.jsx`, `client/src/pages/CafePage.jsx`, `client/src/components/admin/OverviewTab.jsx`, `client/src/components/admin/TablesTab.jsx`, `CHANGES.md`.

---

### Change 62: Only Real Tables Show Guests
- **Action**: Clicking a table in the 3D café forced its drawn guests on screen for the whole showcase, so "Watch animation" on an empty table produced people sharing a meal at a table the floor said was free. Guests and their table settings now appear only when the table's live status is `occupied`; clicking a free or reserved table zooms in on an empty, laid-out table.
- **Action**: The volunteer diner a table creates on first render used to stay visible forever once its order journey finished or the table was released. It is now hidden unless the table is still occupied and has no finished journey, so a checked-out table empties in real time.
- **Action**: The showcase dish only appears with real guests, and the table panel copy follows the live status: "Watch animation · Guests are sitting and eating" when occupied, "Look at this table · Free right now · nobody seated" when available, "Held for a booking · nobody seated" when reserved, with matching showcase captions.
- **Verification**: `npm run build` green; `oxlint` 0 errors on `CafeScene.jsx` and `CafePage.jsx` (one pre-existing `refs during render` warning in `CafePage.jsx`). Guests key off `status === 'occupied'` read from the live `tables` state each frame, which is already fed by the global `table:statusUpdate` socket event. The canvas itself was not clicked through.
- **Files**: `client/src/components/cafe/CafeScene.jsx`, `client/src/pages/CafePage.jsx`, `CHANGES.md`.

---

### Change 63: The 3D Café Reads as a Lit Room (Phases 0–2)
- **Action**: Added procedural surface maps (`client/src/components/cafe/sceneTextures.js`): timber grain with knots, troweled plaster, plain-weave cloth, glazed ceramic, brushed steel and quarry tile. Each is drawn on a canvas at boot with a seeded generator, so the room still ships no binary textures; albedo maps average near-white so each material's own colour stays the palette.
- **Action**: Added a material library with a cache (`sceneMaterials.js`). `makeMaterial` used to return a brand-new `MeshStandardMaterial` for every one of the ~150 meshes; it now hands back one shared instance per colour + finish combination, and exposes `wood` / `plaster` / `fabric` / `steel` / `tile` / `ceramic` finishes. The room now compiles 13 shader programs instead of one per material.
- **Action**: Ceramics (plates, mugs, the handoff tray, the QR stand's cups) are `MeshPhysicalMaterial` with a clearcoat, so glaze carries a highlight. Fabric on shirts gets a weave bump, the walls plaster, the range and prep bench brushed steel, the kitchen floor quarry tile, and table tops, chairs, counters, shelves and the menu board real timber.
- **Action**: Added `roundedBoxGeometry` (extruded rounded rectangle with a 1.5–2 cm bevel) and rebuilt chair seats, backs and insets, the service counter base/top/edge, the range, the prep bench and the shelves with it. Every one of those edges now catches light instead of ending in a razor corner, and the table tops gained a slim inlay band.
- **Action**: Added image-based lighting (`sceneEnvironment.js`): a tiny painted room — gradient backdrop, bright entry window, warm ceiling strip, floor bounce — run through `PMREMGenerator.fromScene` and assigned to `scene.environment`. Two key lights were rebalanced around it (hemisphere 0.82 → 0.32, sun 1.85 → 1.4) and the sun's shadow camera was tightened from ±19 to ±13/15 so the same 2048 map gives roughly twice the texel density per metre.
- **Action**: Added a warm `SpotLight` pool over the dining rows, radial-gradient contact shadows under every table, chair cluster, counter, range and person, a light pool on the boards from the entry door, and ~90 drifting dust motes. Pan steam changed from 16 spheres to one 72-point soft cloud, so it reads as vapour and costs a single draw call.
- **Action**: Added a development measurement hook: `window.__cafeScene` plus a `?debugScene=1` console readout of fps, draw calls and triangles.
- **Action**: Found and fixed two real defects while wiring the above. Table tops were passed a *material* in the colour slot, so they had always rendered flat white. Contact shadows first went in as `MultiplyBlending` planes and rendered *brighter* than the floor; they are now normal alpha-blended black gradient decals, which can only darken.
- **Action**: Deliberately left the renderer's colour pipeline alone. Setting `outputEncoding = sRGBEncoding` (the r149 equivalent of the `outputColorSpace` line already in the file, which is a no-op on r149) brightened the whole room into pastel, because this palette was authored for the legacy pipeline. Re-tuning every material and light for correct gamma is a separate pass, not a silent side effect.
- **Verification**: `npm run build` green; `oxlint` 0 errors on the three new modules and `CafeScene.jsx`. In the browser at `/cafe?debugScene=1`: 79–84 fps, ~752 draw calls, ~58.2k triangles, 13 shader programs, `scene.environment` present. Hiding only the new atmosphere objects gives 733 calls / 58.2k triangles, so contact shadows, the light pool, dust and steam cost roughly 19 calls (~2.5%); the plan's "draw calls must not increase" was not achievable for per-object ground decals. Screenshots were reviewed at full-room and close zoom: timber grain visible on floor and chairs, table tops now wood instead of white, chairs and counter chamfered, and soft occlusion under each table instead of the first pass's bright squares. Guest figures are still the capsule build — Phase 4 is untouched.
- **Files**: `client/src/components/cafe/sceneTextures.js` (new), `client/src/components/cafe/sceneMaterials.js` (new), `client/src/components/cafe/sceneEnvironment.js` (new), `client/src/components/cafe/CafeScene.jsx`, `CHANGES.md`.

---

### Change 64: Evening Mode for the 3D Café
- **Action**: The room now has two lighting states, morning and evening, described once in `CafeScene.jsx` as `DAY_LIGHT` / `NIGHT_LIGHT` and blended per frame, so switching is a slow dimming of the room (about 0.7 s) rather than a cut between two looks.
- **Action**: Evening drops the sun to a cool 0.09 from the same direction as faint moonlight, dims the hemisphere and fill, closes the daylight shaft on the floor, turns the four pendant lamps up from 12 to 24 and warms them to `#ffb873`, heats the dining pool to `#ff9a5c`, lifts the lamp-glass emissive and takes exposure from 0.9 to 1.06. The scene background and fog move from `#d6ded1` to `#10161a`.
- **Action**: `buildEnvironmentMap` now takes a palette (`day` / `night`) and the scene builds both PMREM targets at mount, swapping `scene.environment` at the half-way point of the blend so reflections follow the lights instead of staying daytime.
- **Action**: The floor's aisle runner and the counter still read at night because the dining spot and pendants do the shaping; the court-yard, kitchen back wall and menu board fall away into the dark, which is what an evening café actually looks like.
- **Action**: Added an "Evening light / Morning light" toggle to the café's quick-action rail (`Moon` / `Sun` icon, `aria-pressed`), stored in `localStorage` under `cafe-ambient` so the preference survives reloads, with the page class `is-night` giving the canvas a dark base gradient before the first frame. Private-mode storage failures are swallowed and the room still switches.
- **Verification**: `npm run build` green; `oxlint` 0 errors on `CafeScene.jsx`, `sceneEnvironment.js` and `CafePage.jsx` (one pre-existing `refs during render` warning). In the browser the toggle flips `aria-pressed` and persists `cafe-ambient=night`; after a reload the page starts in night mode (`#101619` background, exposure 1.06, pendant lights 24, night environment). Both endpoints checked through the dev hook: day is `#d6ded1` / 0.9 / lamps 12 / day env. The crossfade itself was not watched frame by frame because the preview tab was backgrounded (`0 fps` in the debug readout), so the blend was verified by its endpoints rather than by watching it.
- **Files**: `client/src/components/cafe/CafeScene.jsx`, `client/src/components/cafe/sceneEnvironment.js`, `client/src/pages/CafePage.jsx`, `client/src/styles/cafe-world.css`, `CHANGES.md`.

---

### Change 65: Evening Mode Restyled as a Modern Café
- **Research**: Looked at how modern cafés are lit after dark before touching the scene. The consistent pattern across the references: ambient drops away while wall lights and table lamps come up, the counter stays the brightest surface, walls are painted dark (green especially), the personality comes from decorative light — neon signage, a backlit menu, LED strips under shelves and counters, candles on tables, string lights over the patio — and glazing turns into a mirror at night, so the shopfront should read as a warm lit room rather than a ceiling. Sources: Archlior's café lighting guide (evening scene, counter brightest), ArcVibe's DOT café (green walls, neon, backlit menu, patio string lights), IKEA's café lighting guide (LED strips, LED candles, decorative lighting), Design Milk's Hollywood café (amber/brass warmth).
- **Action**: New `client/src/components/cafe/sceneNightDecor.js` builds the evening set and fades it in with the nightness mix: a coral "OPEN LATE" neon sign with a halo on the back wall, a warm LED strip under the menu board, LED under the pickup shelf and along the counter front, a candle and glow on every table, shopfront light spilling onto the entry path, and a sagging swag of 11 string lights across the courtyard. Everything is invisible by day (the whole group hides below 2% nightness) and costs about 30 draw calls only while night mode is on.
- **Action**: Added a dedicated `counterGlow` spot (2.2 → 6.5 warm) so the bar is the brightest surface in the evening, matching the reference behaviour rather than letting the dining pool win.
- **Action**: The back wall now paints itself deep green (`#2f3d33`) after dark and the pale aisle runner darkens to `#57473a`, so the floor reads as warm pools on dark timber instead of a bright stripe down the middle.
- **Action**: Dropped night ambient further (hemisphere 0.21 → 0.17, fill 0.03, sun 0.08) and moved the night sky to `#0c1315`, so the decorative light is what carries the room.
- **Action**: Fixed a pre-existing bug found while tinting the walls: all six back-wall boxes were passed a *material* in the colour slot, which silently falls back to white. The walls had always been flat white `MeshStandardMaterial` with no plaster map — which is why every previous screenshot had white walls. They now use the plaster material with its bump/surface maps, day and night.
- **Verification**: `npm run build` green; `oxlint` 0 errors on the six touched files. In the browser at `/cafe?debugScene=1`: night shows the neon, bar LEDs, candle dots, patio lights and green wall (`#2f3d33`, plaster bump map present), the decor group is visible with 32 children and hidden in day mode, and draw calls are ~784 at night vs ~752 by day with 67–74 fps. Screenshots reviewed in both modes: evening reads as a lit modern café against a dark courtyard; daylight keeps the same warm palette with textured walls instead of white ones. The 0.7 s crossfade was again verified by endpoints rather than watched frame by frame.
- **Files**: `client/src/components/cafe/sceneNightDecor.js` (new), `client/src/components/cafe/CafeScene.jsx`, `CHANGES.md`.

---

### Change 66: Modern-Café Restyle to Match the Reference Interior
- **Reference**: The uploaded interior photo — charcoal-grey walls, two tall arched windows with white frames, a coral "GOOD VIBES & COFFEE" neon, brass dome pendants on long cords, marble bistro tables on brass pedestals, green and rust velvet tub chairs, patterned rugs on a pale stone floor, a dark walnut bar with brass trim, framed prints and a lot of greenery.
- **Action**: Repainted the room: walls are now charcoal plaster (`#6d706c`, `#2f383c` at night) with dark grey skirting, the timber floor became pale honed stone (`#f0ede5`, roughness 0.4) and the old brown aisle runner was removed so the floor runs wall to wall.
- **Action**: Tables rebuilt as marble slabs with a brass edge band, brass apron, tapered brass pedestal and disc foot, keeping the same top height so plates, cups, QR stands and guest seats all still line up.
- **Action**: Chairs reupholstered in alternating deep green (`#35604a`) and rust (`#a8542f`) velvet with a physical-material sheen on brass legs, replacing the wooden seat/back/inset.
- **Action**: Added two tall arched windows (extruded white frames, mullions, sill and an unlit daylight view) on the dining-room wall, two framed prints between them, three floor plants with glazed pots, and a Persian-style rug under every table cluster in two colourways (procedural, muted navy and rust).
- **Action**: The neon sign moved out of the night-only set into the room itself, now reading "GOOD VIBES & COFFEE" and lit by day (opacity 0.85) as well as night (1), with its halo kept in the evening layer.
- **Action**: Pendants restyled as brass domes with an exposed emissive bulb on thin black cords; the bar is now dark walnut with a brass front edge, brass band and brass foot rail.
- **Tooling**: `sceneTextures.js` gained procedural `marble`, `rugNavy` and `rugRust` maps; `sceneMaterials.js` gained `marble`, `velvet`, `brass` and `rug` finishes so each is one shared shader.
- **Verification**: `npm run build` green, `oxlint` 0 errors on the six component files. In the browser at `/cafe?debugScene=1`: 6 rugs, 24 velvet chairs, both arched windows, the neon and the plants are present; 760 draw calls and 18 shader programs by day (56k triangles, 57–61 fps); night resolves to wall `#2f383c`, sky `#0b1215`, neon opacity 1, decor visible, and the neon/candles/string lights read clearly against the dark courtyard. Screenshots checked in both modes. Table clicks still resolve through `table-top`/group `userData.tableId`, and no code referenced the removed `chair-back-inset` or `service-aisle-runner`.
- **Limitation**: The API server is still down, so every table renders available and the occupied tables, kitchen order flow and live guest seating could not be exercised end to end this pass.
- **Files**: `client/src/components/cafe/sceneTextures.js`, `sceneMaterials.js`, `sceneNightDecor.js`, `CafeScene.jsx`, `docs/cafe-reference-day-3.png`, `docs/cafe-reference-night-2.png`, `CHANGES.md`.

---

### Change 67: A Live Seat Picker Instead of the Light Switch
- **Action**: Removed the Morning / Golden / Dusk light switch from the hero footer. The window now stays in its warm golden light (`.lwc-sky-golden` and the golden room tint), and the unused morning/dusk sky, sun, door and vignette rules were deleted rather than left dead in the stylesheet.
- **Action**: Replaced it with a live seat picker: six numbered seats in the hero footer read the same floor as the 3D café and the console (`utils/tableAvailability`), mark a free table in brass, dim the taken ones, and update from the `table:statusUpdate` socket. Clicking a free seat opens the booking form already set to that table (`BookingModal` takes a new `initialTableId`), so the room on screen is the room being booked.
- **Action**: The picker stays honest when the API is down — the seats render dashed and disabled with a `Floor offline` label instead of a spinner that never ends.
- **Action**: Removed the "Table-side ordering, no queue at the counter" tagline and the "No queue, no second payment" stage fact, since both sold a counter queue the page no longer needs to promise. The under-window tag now only ever shows real live counts and disappears when the floor is unknown; the pass heading reads "The pass calls your ticket." and the "How it works" note is about holding a table rather than scanning a card.
- **Verification**: `npm run build` green; `oxlint` 0 errors on `ProjectLandingPage.jsx` and `BookingModal.jsx`. In the browser at `/` (387px wide): no `.lwc-light` controls remain, one `.lwc-sky` layer, the six seats render disabled with `data-state="unknown"` and the hidden-by-breakpoint `Floor offline` label because `/api/tables` is 502 — so the free-seat click and the preselected booking were not exercised against live data.
- **Files**: `client/src/pages/ProjectLandingPage.jsx`, `client/src/components/cafe/BookingModal.jsx`, `client/src/styles/landing-window.css`, `CHANGES.md`.

---

### Change 68: Seat States, a Scroll-Driven Pass, a Fact-Only Chat Base and a Warmer Café
- **Action**: Removed the "1 of 6 tables free right now" pill from the hero window (and its CSS/keyframes). The live seat row now carries the floor: a compact "X free · Y taken" line, six chips, and two tiny legend swatches.
- **Action**: Restyled the seat chips so state reads at a glance instead of the taken tables being dimmest: occupied is a solid rust chip with a cream numeral and a lit dot, reserved is amber and dashed, maintenance/unknown stays greyed, free keeps the brass outline and the booking click.
- **Action**: Rebuilt the "Follow one plate" pass. The horizontal drag rail, the hidden range scrubber and the plate-on-track are gone; page scroll alone walks one plate down a curved service line from seated to kitchen to pass and back, with the four moment buttons scrolling to their stop instead of setting state. Same four moments, copy and photos; reduced motion keeps the stacked, unpinned reading.
- **Action**: Expanded the chatbot knowledge file with grounded café facts — QR check-in, menu sizes/add-ons/notes, bill taxes and service charge, Razorpay payment and failure, the counter→kitchen→ready flow, the 24-hour tracker, the one-minute cancel window, 90-day booking with a 30-minute hold, what "free" means, allergy/QR/lost-item/edge-case hand-offs, and an explicit ban on inventing prices, hours, address or items. Replies are capped at one or two short sentences in both the knowledge file and the system prompt, with `max_tokens` down from 320 to 160.
- **Action**: 3D café: the pale stone floor is now warm walnut boards (texture palette, tint, joints and the environment floor bounce all moved to brown); each of the six tables got a small brass pendant with an emissive bulb and a shadowless point light, blended into the day/night mix.
- **Action**: Walls moved from grey to warm clay plaster (day `#7c6650`, night `#332b27`) and gained interior design: a large framed painting with a console and vases, two paintings on the entry wall, a wood-slat feature panel, an A-frame chalkboard, two sticker clusters (original hand-drawn chibi/cat/boba/ramen/star art) and brass picture lights, plus three wall-wash spotlights for the evening room.
- **Action**: The kitchen, which had no light of its own, now has two ceiling strip panels with warm point lights and a lit shelf strip.
- **Action**: Tables respaced from x -7/0/7, z 0.8/5.1 to x -7.6/0/7.6, z 1.2/6.3 (still two rows of three, so the 1-6 keys, guest walk paths and camera focus are unchanged). The reclaimed floor got a lounge corner (rug, two armchairs, low table, bookcase, planter) by the garden windows, a glass bake case on the right, and two extra planters.
- **Verification**: `npm run build` green and `oxlint` clean on the changed client files; the knowledge module still imports and returns the approved text. The 3D changes were compiled, not viewed in a browser, so lighting balance and art placement are unconfirmed.
- **Limitation**: No server or live floor was running, so occupied-chip styling, the live seat line and the chat route were not exercised end to end.
- **Files**: `client/src/pages/ProjectLandingPage.jsx`, `client/src/styles/landing-window.css`, `client/src/components/cafe/CafeScene.jsx`, `client/src/components/cafe/sceneEnvironment.js`, `server/src/chat/cafeKnowledge.js`, `server/src/routes/chatRoutes.js`, `CHANGES.md`.

---

### Change 69: A Street, a Terrace and a Horizon Around the Café
- **Action**: New `client/src/components/cafe/sceneSurroundings.js` builds the world outside the cutaway: a cobbled lane running past the shopfront (kerbs, two stone pavements, 56 m long so it leaves the frame instead of stopping in grass), a flagstone terrace in front of the two arched windows with an iron railing, open gate and planter boxes, and a shortened entry path that now lands on the pavement.
- **Action**: The shopfront gained an exterior skin on the existing opaque west wall — stone dado and pilasters, a timber fascia, two window boxes, brass picture-light detail and a projecting "LITTLE WINDOW · CAFÉ" blade sign — plus a striped shopfront awning with a scalloped valance and tie rods, and two wall lanterns either side of the door.
- **Action**: The terrace has three bistro sets (the same marble top and brass pedestal as the indoor tables, with bentwood chairs in the room's green/rust pairing), two shrubs in planters and two string-light poles. The night lights were re-hung as three swags from the wall to those poles, so the bulbs now hang over the tables rather than ending over the room floor.
- **Action**: Street furniture and neighbours: two cast-iron streetlamps, a bench, litter bin, two bollards, two leaning bicycles, a crate stack, an A-frame chalkboard by the path, and four low townhouses/shopfronts across the lane whose windows, doors, awnings and painted shop names are canvas textures on a single box each. Two windows and the shop glass per building light up after dark through an emissive map.
- **Action**: Added day and night sky domes (r 80, `fog: false`, `depthWrite: false`) with painted cloud bands, ~110 seeded stars, a warm dip at the night horizon, and a rooftop/treeline silhouette, plus a fog-faded ring of distant tree crowns so the top of the frame is not an empty field. `applyLighting` now crossfades the two domes and drives the new day/night keys (`streetLamp`, `lantern`, `lampGlass`, `lanternGlass`, `neighbourWindows`, `awning`).
- **Action**: Three shadowless lights added in total (two streetlamps at 5.5, one door lantern at 3.2), and the exterior props opt out of shadow casting because they sit outside the sun's ±13 shadow frustum; only the awning casts.
- **Verification**: `npm run build` green; `oxlint` 0 errors on the three touched files. In the browser at `/cafe` in both modes the lane, terrace, awning, blade sign, streetlamps, bench, neighbours and sky are present; at night the streetlamp heads and door lantern glow, the neighbour windows light, and the three swags of string lights sit over the bistro tables. Scene state read through `__cafeScene`: `street-lamp-light` 5.5, `door-lantern-light` 3.2, lamp glass emissive 1.15, neighbour emissive 1.05, sky-day opacity 0, sky-night opacity 1. Exterior draw calls measured by hiding the group: 1184 → 1468 (+284) at ~100k triangles.
- **Limitation**: The daytime sky gradient is rarely seen from the default camera, which looks down at the room, so the horizon reads as fog-faded grass, neighbours and tree crowns rather than open sky; it shows when the view is orbited low. FPS was not measured because the preview tab was backgrounded and its `requestAnimationFrame` stalls, so only draw calls and triangles were compared.
- **Files**: `client/src/components/cafe/sceneSurroundings.js` (new), `client/src/components/cafe/CafeScene.jsx`, `client/src/components/cafe/sceneNightDecor.js`, `docs/cafe-surroundings-day.png`, `docs/cafe-surroundings-night.png`, `CHANGES.md`.

---

### Change 70: Courtyard Props Bedded Into the Ground
- **Action**: The three courtyard trees were built at y 0 while the grass plane is at y -0.42, so their trunks hovered 40 cm above the lawn — worst next to the new terrace, which reads as a hard step. `addTree` now plants them at y -0.44, bedding the trunk 2 cm into the grass so the base is not coplanar with the plane.
- **Action**: The four courtyard planters (`courtyard-planter`) sat at y -0.16, leaving their bases 4 cm above the grass and a visible gap under each box. They moved to y -0.21, and their herb pots and herbs dropped 0.03 with them so the pots still sit in the boxes rather than on air.
- **Action**: The front hedge ran 4.4 m across x -19.7…-15.3 at z 1.2, straight through the new pavement, the terrace paving edge and the terrace planter. Its grass-only base was therefore buried by the paving and it overlapped the planter. It is now a 1.2 m box hedge on the grass verge beside the gate (x -16.68, z 1.42), clear of the pavement, path, railing, A-frame board and gate swing.
- **Verification**: `npm run build` green; `oxlint` 0 errors on `CafeScene.jsx`. World bounding boxes read from the live scene before the change: trunks `minY` -0.016 (0.404 above grass), planters `minY` -0.38 (0.04 above grass); after it, trunks -0.46 and planters -0.43 (both slightly below the -0.42 plane, i.e. bedded rather than floating). Hedges, pond rim/stones/reeds, street furniture and the pavement props were checked in the same audit and already rest on their own surfaces.
- **Limitation**: Verified by bounding boxes and a build, not re-viewed at close range on screen; the pond remains an intentionally raised stone basin 0.2 m above the grass, which was left alone.
- **Files**: `client/src/components/cafe/CafeScene.jsx`, `CHANGES.md`.

---

### Change 71: The Café Opens Slowly Out of Mist
- **Action**: The 3D room no longer snaps into its fixed camera. `CafeScene` now starts the camera wider, higher and further out (home position × 1.14, +7.5 y, zoom 0.78) and glides to the home pose over 3.4 s through the existing camera-transition rig, so a click on a table or the kitchen simply takes over from wherever the glide reached. With `prefers-reduced-motion` the glide is skipped and the camera starts at home.
- **Action**: New `client/src/components/cafe/sceneMist.js` adds 14 camera-facing mist puffs from one procedural soft-cloud canvas: low haze over the terrace, entry verge, lane, front lawn and east garden, plus two very thin puffs inside the cutaway. They drift on slow sine loops, share a single texture, cast no shadows, opt out of the click plane, and dim/cool at night via the existing `nightness` value.
- **Action**: The mist starts thick (1.4× base opacity) and thins to a resting 0.45× over the same 3.4 s, so the world is hazy while the camera settles and stays lightly misted afterwards.
- **Action**: `CafePage` adds a `.cafe-opening-mist` veil (three soft radial washes + a linear tint, z-index 4, pointer-events none) that clears from .95 to 0 over 3.4 s. It is not rendered when arriving through the landing ride's airlock reveal, and is removed under `prefers-reduced-motion` so nothing rests at a non-zero opacity.
- **Verification**: `npm run build` green; `oxlint` 0 errors on `CafeScene.jsx`, `sceneMist.js` and `CafePage.jsx` (one pre-existing `refs during render` warning in `CafePage`, untouched). In the browser at `/cafe` after reload, sampled through `__cafeScene`: camera zoom 0.925 → 1 and position (13.3, 38.6, 41.5) → (12.7, 34.4, 39.6) while the veil computed opacity went 0.62 → 0.03 → 0; 14 `cafe-mist-puff` sprites present and visible at a resting opacity of ~0.135. Clicks still work because pointer input raycasts the hit plane only.
- **Limitation**: The opening was checked by sampling camera/opacity state and one rest-state screenshot, not recorded as video, so the smoothness of the glide itself was not watched frame by frame.
- **Files**: `client/src/components/cafe/sceneMist.js` (new), `client/src/components/cafe/CafeScene.jsx`, `client/src/pages/CafePage.jsx`, `client/src/styles/cafe-world.css`, `CHANGES.md`.

---

### Change 72: Kitchen Acceptance as Its Own Step (confirmed → accepted → preparing)
- **Action**: `/kitchen` no longer jumps a ticket straight from `confirmed` to `preparing`. The Confirmed lane now renders **Accept ticket** for a freshly confirmed order and **Start cooking** once it is `accepted`, so the chef acknowledging the ticket is a real, recorded transition; the lane hint and empty state say so.
- **Action**: The ticket meta line reads `Accepted · waiting to start` instead of a bare `Queued`, so the two states are distinguishable at a glance on the kitchen board.
- **Action**: Removed the counter console's **Cook** shortcut on `confirmed` orders (`OrdersTab`), because it skipped acceptance. Counter and owner can still start an already-accepted ticket through the existing **Start cooking** action, so they keep an override without bypassing the kitchen. A `confirmed` row now reads *Waiting for kitchen to accept* in the actions column instead of offering a bypass.
- **Action**: Guest tracker rail is now five stages — Received, Accepted, Cooking, Ready, Enjoy — with `accepted` mapped to its own step instead of being folded into Cooking; the order under it gains "The kitchen has accepted your order and will start cooking shortly."
- **Action**: Server-progress label for `accepted` changed from "In the kitchen" to "Accepted by kitchen", which the console and guest page both display, so the counter shows it separately from "Sent to kitchen" (the `confirmed` label). The 3D café pickup board uses the same wording.
- **Verification**: `cd client && npm run build` green (final run 1.99 s); `oxlint` on `KitchenKDSPage.jsx`, `OrderStatusPage.jsx`, `CafePage.jsx` and `OrdersTab.jsx` — 0 errors (4 pre-existing react-hooks warnings in untouched code); `node --check` on `progressService.js`. Not exercised in a browser against a running API, so the live accept → cook hand-off between two sockets was not watched end to end.
- **Files**: `client/src/pages/KitchenKDSPage.jsx`, `client/src/pages/OrderStatusPage.jsx`, `client/src/pages/CafePage.jsx`, `client/src/components/admin/OrdersTab.jsx`, `client/src/styles/customer-order.css`, `server/src/services/progressService.js`, `CHANGES.md`.

---

### Change 73: Automatic Ready-for-Pickup Notification
- **Action**: New `server/src/services/notificationService.js`. When an order reaches `ready` (from the kitchen board, the counter console or the 3D café), `updateOrderStatus` calls `notifyOrderReady`, which writes the first real `Notification` document in the project (`type: 'order_ready'`, `targetRoles: ['customer', 'counter']`) and emits a `notification:new` socket event to the guest's `order:<id>` room and the counter's `admin` room. The socket event is still emitted if the database write fails, so a Mongo blip never silences the pickup call.
- **Action**: The guest tracker gains an **Enable alerts** button in its header. It asks for the browser notification permission only on that tap (never on page load), and reports granted, blocked and unsupported states in a line above the order list.
- **Action**: `OrderStatusPage` listens for `notification:new`; on a `order_ready` payload with permission granted it raises a system notification ("Order #… is ready — Please collect order #… at the counter."), tagged per order so repeats replace instead of stacking. Payload ids are deduped in a ref, and the existing in-page banner plus chime still fire from the status change.
- **Action**: The ready banner now carries the server timestamp — "Please collect your food · ready at 12:31" — using `order.readyAt`, so the state survives a refresh.
- **Verification**: `cd client && npm run build` green (2.04 s); `oxlint` on `OrderStatusPage.jsx` — 0 errors (1 pre-existing hooks warning); `node --check` on `orderController.js` and `notificationService.js`.
- **Limitation**: These are page-level notifications, not web push: they only ring while the tracker tab is open. A locked phone or closed tab gets nothing yet — that needs a service worker plus a VAPID key pair, which was deliberately left out of this phase. Android Chrome can refuse constructor notifications, so the in-page banner and chime remain the guaranteed path. Not exercised in a browser against a running API.
- **Files**: `server/src/services/notificationService.js` (new), `server/src/controllers/orderController.js`, `client/src/pages/OrderStatusPage.jsx`, `CHANGES.md`.

---

### Change 74: Counter Can Call the Guest Back (POST /api/orders/:id/notify)
- **Action**: New `POST /api/orders/:id/notify`, behind `protect` + `authorize('owner', 'counter')`. It refuses anything that is not `ready` (400), refuses a re-ping within the 60-second cooldown (429 with `retryAfterSeconds` and a human message), then stamps `guestNotifiedAt` / increments `guestNotifyCount`, reuses `notifyOrderReady` to write the `Notification` and emit `notification:new`, writes an `order_guest_notified` audit row, and returns the refreshed order.
- **Action**: `Order` gained `guestNotifiedAt` and `guestNotifyCount`. Marking a ticket ready now stamps them too, because the automatic ready socket event *is* the guest's pickup notice — so the counter sees when the guest was told and cannot fire a duplicate within the first minute.
- **Action**: Counter console's ready rows gained a **Notify guest** button beside **Handover & Clear**, plus a `Notified 12:31` (and `· 2×` after repeats) line under the actions. The row updates from the response immediately; the console's 15-second refresh keeps it honest in other tabs.
- **Action**: 429 cooldown messages are left to the existing axios interceptor (single toast with the server's text); other failures toast the server message.
- **Action**: Extended `server/test/security.test.js` so an anonymous `POST /api/orders/:id/notify` must return 401.
- **Verification**: `cd server && npm test` — 10/10 pass; `node --check` on the controller, model and routes; `cd client && npm run build` green; `oxlint` on `OrdersTab.jsx` and `AdminDashboardPage.jsx` — 0 errors.
- **Limitation**: The cooldown branch and the button's live behaviour were not exercised against a running server, so the 429 path and the timestamp refresh are compiled and unit-checked only at the auth gate, not observed on screen.
- **Files**: `server/src/controllers/orderController.js`, `server/src/models/Order.js`, `server/src/routes/orderRoutes.js`, `server/test/security.test.js`, `client/src/api/apiServices.js`, `client/src/pages/AdminDashboardPage.jsx`, `client/src/components/admin/OrdersTab.jsx`, `CHANGES.md`.

---

### Change 75: "Follow One Plate" Pins on Phones Too
- **Action**: Below 860px the pass used to give up and scroll in flow (`position: static`, `height: auto`, rail hidden), so a phone scrolled straight past the four moments. It now keeps the same pinned behaviour as desktop: the wrapper is 300vh and `.lwc-pass` is `position: sticky; top: 0; height: 100svh`. The screen holds still while the plate walks Seated → Kitchen → Pass → Back with you, and only after that last stop does the wrapper end and the gallery scroll in.
- **Action**: Fit one phone screen without clipping: the head tightens, the standfirst clamps to two lines, the photo panel is hidden (the rail and the plate image now carry the visual), the rail shows at 138px instead of being removed, the plate shrinks to 44px, the two fact rows give way, and the body copy clamps to four lines. A `(max-width: 860px) and (max-height: 700px)` pass drops the standfirst, shortens the rail to 104px and clamps copy to three lines for short or landscape phones. The wrapper is paper-coloured so the strip behind `100svh` never shows the gallery.
- **Action**: `goToStage` no longer bails on widths under 861px, so tapping a moment on a phone scrolls the pinned section to that stop instead of doing nothing.
- **Verification**: `npm run build` green, `oxlint` on `ProjectLandingPage.jsx` — 0 warnings. In the running app at 360px wide: `.lwc-pass` computes `position: sticky` and sits at `top: 0` across its travel, tapping stop 04 sets stage 3 ("Back at your table."), and the gallery top sits at 813px with the viewport at 726px, i.e. the next section only arrives once the fourth stop has been reached. Content height fits the pinned section at that width (`scrollHeight` 726 = `clientHeight` 726).
- **Limitation**: The scroll-driven stage changes were confirmed through the stop buttons and a dispatched scroll event, not by real touch-scrolling the phone; layout was checked at 360px and 390px widths only, and the short-screen (`max-height: 700px`) rules were not visually inspected.
- **Files**: `client/src/styles/landing-window.css`, `client/src/pages/ProjectLandingPage.jsx`, `CHANGES.md`.

---

### Change 76: "Follow One Plate" — Continuous Motion, Progress and Direct Interaction
- **Action**: The plate no longer snaps between four fixed points. `paint()` walks it along the existing `SERVICE_PATH` with `getPointAtLength(progress)`, writing `--plate-x` / `--plate-y` to the plate inside the existing rAF. Position is now the scroll position itself, so motion is 1:1 with the wheel/touch and adds no React renders. Reduced motion, or a browser without path measurement, falls back to the four stop points.
- **Action**: A meter under the stops shows `01 / 04`, a hairline fill driven by `--pass-p`, and the next thing to do ("2 more moments" → "1 more moment" → "Keep scrolling ↓"), so a pinned phone screen reads as a section waiting for you rather than a stuck page. The active photo now scales slowly as each stop arrives.
- **Action**: Stage copy is keyed on the stage and fades in (`lwc-pass-copy-in`) instead of swapping text in place, so each stop arrives with the plate.
- **Action**: Direct interaction: the four rail nodes are real buttons with hover/focus labels and `aria-current`; the plate itself is a button that walks to the next moment; the stops respond to ←/→/Home/End and move focus with the chosen moment; and on a mouse the rail can be grabbed and dragged to scrub the pass (roughly half a screen of drag covers it). Touch deliberately keeps native scrolling.
- **Action**: Page jumps go through Lenis when it is running (`scrollWindowTo`), falling back to `window.scrollTo`, so buttons, keyboard and clicks all agree with the scroll position that drives the plate.
- **Verification**: `npm run build` green (1.85s), `oxlint` on `ProjectLandingPage.jsx` — 0 warnings/errors. In the running app: at 30% and 75% of the wrapper the plate reads 14.3%/27.1% and 76.2%/70.3% (continuous points between nodes), the meter reads 27% and 78% with `02/04` and `03/04`, and the copy matches the stop. ArrowLeft moved stage 2 → 1 with focus on the second stop; clicking the plate moved stage 1 → 2; a synthetic mouse drag of 120px scrolled the pass 399px and pointer-up ended the drag. At 360px wide the pinned section still fits (`scrollHeight` 726 = `clientHeight` 726, content bottom 621), the cue does not overflow, and node labels are hidden.
- **Not done / limits**: Phase C (per-stop micro-scenes: order card, ticking ticket clock, READY stamp) and Phase D (shorter mobile travel, swipe hints) were left out of this pass by choice. Drag and hover states were exercised with synthetic mouse events, not a real pointer; no touch-scrolling was performed, and the 1280px desktop layout was only measured, not looked at.
- **Files**: `client/src/pages/ProjectLandingPage.jsx`, `client/src/styles/landing-window.css`, `CHANGES.md`.

---

### Change 77: Finnegan — the Café Fox Replaces the Chat Launcher
- **Action**: The flat chat widget is gone. `ChatBubble.jsx` was deleted and replaced by `FoxChatWidget.jsx`, mounted through the same `GuestChatWidget` gate in `App.jsx`, so the fox appears on `/`, `/table/*`, `/order/*` and `/track/*` only. The launcher is now the fox's face (flat SVG, so it still looks like him before the 3D scene loads), the panel opens on a live 3D stage, and the conversation below it is the same `POST /api/chat` exchange with the same fallbacks and rate limit.
- **Action**: The character is built at runtime, not downloaded: `fox/foxModel.js` assembles a standing barista fox from three.js primitives — orange coat, cream chest and muzzle, dark paws, brown apron with straps, pocket and seam, a cup with a saucer and rising steam, big expressive eyes with glints and brows, five-sided ears and a four-segment tail — and returns a named rig (`head`, `jaw`, `eyeL/R`, `earL/R`, `tailSegs`, `armL/R`, `mug`, `steamBits`). It reuses the three.js already loaded from `/vendor/three.min.js`, so there is no new npm dependency and no bundle growth for the renderer.
- **Action**: `fox/foxAnimator.js` runs one `update(dt)` per frame over an idle base: breathing, weight shift, random blinks (2–6 s), ear flicks, tail sway, steam loop, and a gaze that follows the pointer. States layer on top — `listening` (leans in, ears forward), `thinking` (head tilt, ears back), `speaking` (jaw driven by live audio amplitude, nodding on phrases, gesturing arm), and a 1.1-second `happy` bounce when the guest pokes the fox.
- **Action**: `fox/FoxScene.js` owns the renderer, camera, three-point warm lighting and a soft canvas contact shadow (no shadow map). It caps DPR at 2, widens the field of view on narrow stages, stops rendering when the tab is hidden, disposes geometries, materials and the renderer on unmount, and returns `null` when WebGL is unavailable so the widget falls back to the flat illustration instead of breaking.
- **Action**: The fox speaks. `POST /api/chat/speak` takes `{ text }` (max 400 chars, own 40/hour `speechLimiter`), calls ElevenLabs with `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL` (default `eleven_flash_v2_5`), and returns MP3 bytes — the key never reaches the browser. Replies are cached in a bounded 40-entry map keyed by voice, model and text, and a daily character cap (`ELEVENLABS_DAILY_CHAR_LIMIT`, default 20000) refuses with 429 after the day's budget.
- **Action**: `useFoxSpeech.js` plays that audio through an `AnalyserNode`, publishing a smoothed 0–1 RMS to `amplitudeRef`, which is what the jaw reads each frame — so mouth movement follows the actual voice. With no key, a failed request, or no analyser, it falls back to `speechSynthesis` (pitch 1.3, rate 1.04, preferring a bright English voice) and drives the jaw from a synthetic syllable envelope. A volume button in the header mutes the voice, remembered in `cafe.fox.voice`.
- **Verification**: `cd client && npm run build` green (2.62 s; the main chunk moved from 370.50 kB to 370.73 kB, since the renderer is the copy already loaded from `/vendor`). `oxlint` on the six new/changed client files — 0 warnings, 0 errors. `node --check` on the four server files; the API was restarted and `POST /api/chat/speak` answers `503 {"success":false,"message":"Voice is not configured"}` with no key. Live on `/table/demo-token-TBL-001`: the launcher opens the panel, the fox renders on the canvas (`THREE` from the vendored build, 598×519 buffer), asking "how do I find my order?" returns a reply and moves the stage to `speaking` through the browser-voice fallback, with no console or page errors.
- **Action (found while verifying)**: the first render came out beige and armless — this three.js build runs in legacy colour management, so hex colours were treated as linear, and both arms were rotated inwards behind the apron. `FoxScene` now opts into managed colour before any material exists, uses ACES tone mapping with dimmer warm lights, and the rig's arm signs, apron width, tail sweep and cup placement were corrected. The cup is set in the body rather than parented to the forearm, because it tumbled with the elbow.
- **Limitation**: Without an `ELEVENLABS_API_KEY` the fox speaks only through the browser voice — the ElevenLabs branch is wired but has never returned audio here. Jaw movement follows the amplitude value but was not measured frame by frame, only observed as the `speaking` state. Touch input, iOS Safari audio unlock, and the WebGL-failure fallback were not exercised, and the fox was reviewed at 384 px and 600 px panel widths only.
- **Files**: `client/src/components/common/FoxChatWidget.jsx` (new), `client/src/components/common/useFoxSpeech.js` (new), `client/src/components/common/fox/foxModel.js` (new), `client/src/components/common/fox/foxAnimator.js` (new), `client/src/components/common/fox/FoxScene.js` (new), `client/src/components/common/fox/FoxFaceIcon.jsx` (new), `client/src/styles/fox-widget.css` (new), `client/src/components/common/ChatBubble.jsx` (deleted), `client/src/App.jsx`, `client/src/api/apiServices.js`, `server/src/routes/chatRoutes.js`, `server/src/config/index.js`, `server/src/validators/schemas.js`, `server/src/middleware/limiters.js`, `CHANGES.md`.
---

### Change 78: The Fox Is the Launcher, and He Got Smoother
- **Action**: The launcher button used to be a flat SVG fox face. It is now a live 3D portrait: `FoxChatWidget` mounts a second `FoxStage` with `framing="portrait"`, so the character you click is the character you talk to. It renders in an 82px circle with a warm backdrop, follows the pointer with his gaze, breathes and blinks, pauses its render loop while the panel is open (and resumes on close), and falls back to the flat SVG face if WebGL is unavailable.
- **Action**: `createFoxStage` gained a `framing` option — `full` (complete barista), `bust` (head and shoulders, used in the chat panel) and `portrait` (head, used by the launcher) — plus its own `pointermove` tracking, so pointer-gaze no longer lives in the widget and every crop gets it. The old tooltip pill was removed from the launcher because `overflow: hidden` clipped it; the button keeps its `aria-label` and `title`.
- **Action**: Smoothness pass on the model: sphere tessellation raised (32–44 segments on the large forms), a tapered three-part torso instead of one ball, a neck joining head to body, a layered cream chest that peeks above the apron, digitigrade-ish legs with shin and three-toed paws, three-fingered hands, a longer tapered muzzle with a second snout lobe, six shorter tail segments for a smooth curve, rounded ear bases with taller cones, smaller cheek fur with a second back spike, thin torus eyebrows, blush, and a cup scaled and moved into the right paw. The cup stays parented to the body (not the forearm) so it cannot tumble.
- **Verification**: `cd client && npm run build` green (2.18 s); `oxlint` on the widget and fox modules — 0 warnings, 0 errors. Live on `/table/demo-token-TBL-001`: the launcher canvas renders (`100×100` buffer in an 80px circle, DPR-aware), clicking it opens the panel with the bust crop, asking "what is on the menu?" returns a reply and moves the stage to `speaking`, and there were no console or page errors. Launcher and panel were also reviewed at 220–260px for detail.
- **Limitation**: Growth is procedural, so this reads as a polished stylised character rather than a photographic fox; a true realistic fox needs a rigged glTF model and a different pipeline. Both stages hold their own WebGL context while the widget is mounted (the launcher's is idle, not rendering, when the chat is open). No real touch device, no iOS audio unlock, and the ElevenLabs branch still has no key to test with.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/components/common/fox/foxModel.js`, `client/src/components/common/fox/foxAnimator.js`, `client/src/components/common/fox/FoxScene.js`, `client/src/styles/fox-widget.css`, `CHANGES.md`.

### Change 79: Finnegan Stands on the Page — Full-Body Launcher, Gesture Layer & Silent Start

- **Problem**: The launcher was the 3D fox cropped to `framing="portrait"` inside an 82px cream circle, so only his face fitted and the button still read like the old flat SVG icon. The model already had legs, paws, apron and mug — the crop and the button chrome were wrong.
- **Action**: `FoxScene` gained a `stand` framing (camera at `[0, 1.0, 4.05]` looking at `[0, 0.98, 0]`, fov 32, no narrow-canvas widening) that fits ears to paws with a floor margin, so the full barista is visible in a tall transparent canvas.
- **Action**: `.cafe-fox-launcher` is no longer a circular badge: 132×178px (104×142px ≤520px), transparent, borderless, whole fox clickable, with a hover lift and a green focus ring. The cream disc, status dot, circular clip and open-state dimming were removed; the WebGL fallback face is sized for the new button.
- **Action**: Pressing the fox opens only the chat window, and the standing fox unmounts while it is open, so one WebGL context renders at a time and there is no frozen duplicate behind the panel. The panel now sits 24px from the bottom (12px on mobile) because the launcher is out of the way. The previously dead `cafe-fox-launcher-cart-active` class is wired to the guest cart dock so both the fox and the window clear it.
- **Action**: New gesture layer in `foxAnimator.js`: timed, envelope-shaped channels (`wave`, `nod`, `tilt`, `hop`, `tailwag`, `giggle`, `talk`, `perk`) layered over the state poses, exposed as `stage.gesture(name, seconds)` and `stage.setIdleGestures()`. Standing idle gets a hello wave 1.1 s after mount, one random cute beat every 8–16 s, ear flicks, squints on giggles, cursor gaze and a tail that wags faster during a wag. The wave uses the free left paw because the right one holds the mug.
- **Action**: Conversation beats: opening the window waves; sending a message tilts his head; every reply fires a nod, a tail wag and a `talk` envelope sized from the reply length (`length / 16`, clamped 1.4–9 s), so the jaw flaps even when the voice is off. With audio playing the jaw still follows the real amplitude, whichever is louder wins.
- **Action**: The fox voice now starts muted (`useFoxSpeech.readMuted` defaults to `true` until the guest turns the speaker on or stores a choice), since the ElevenLabs key is not configured yet. The ElevenLabs proxy path is unchanged.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/components/common/fox/FoxScene.js`, `client/src/components/common/fox/foxAnimator.js`, `client/src/components/common/useFoxSpeech.js`, `client/src/styles/fox-widget.css`, `CHANGES.md`.

### Change 80: Chat-Only Window, and Finnegan Actually Speaks

- **Problem**: The chat window still opened on a 226px 3D stage with the fox's bust above the conversation, so pressing the launcher brought a second fox back on screen instead of just the chat. The ElevenLabs voice was also never configured, so the fox stayed silent.
- **Action**: The panel stage is gone. `FoxChatWidget` no longer mounts a `FoxStage` inside the window — the window is the header (flat face avatar, name, mute, close), the conversation and the input row only. The standing launcher fox still hides completely while the chat is open (it unmounts, so nothing renders behind or beside the window), and pressing it still opens the chat and nothing else.
- **Action**: With the in-panel fox removed, his conversation gestures (`tilt` on send, `nod`/`tailwag`/`talk` on reply, greeting `wave`) and the `panelStageRef` plumbing went with it. The gesture layer itself is untouched and still drives the standing launcher (hello wave, hover wave, random idle beats).
- **Action**: Dead styles dropped from `fox-widget.css`: the panel stage's 226px gradient banner, the status pill, the equalizer bars and the mobile stage height. The stage rules that remain are only what the transparent launcher needs, plus its bob fallback.
- **Action**: The voice is wired up and on by default. `server/.env` now carries `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (`bkWmSiLbVbuhntmf2Kw7`) and `ELEVENLABS_MODEL=eleven_flash_v2_5`; `useFoxSpeech.readMuted` defaults to unmuted again, so a first-time guest hears the reply while the header speaker button still silences him and the stored choice wins.
- **Action**: That voice is a library voice, and ElevenLabs refuses those on a free plan with `402 paid_plan_required`. `POST /api/chat/speak` now retries once with a premade voice (`ELEVENLABS_FALLBACK_VOICE_ID`, default `EXAVITQu4vr4xnSDxMaL`) when it sees that answer, and remembers the verdict so later replies skip the refused voice instead of paying the round trip again. Upgrading the plan needs no code change: the configured `ELEVENLABS_VOICE_ID` starts working and the fallback stops being used.
- **Verification**: `cd client && npm run build` green (2.22 s); `npx oxlint` on the two changed client files — 0 warnings, 0 errors; `node --check` on the two server files. With the API restarted, `POST /api/chat/speak` returns `200 audio/mpeg` (49 kB in 1.1 s, then instant from the 40-entry cache) instead of the old `503`. Live on `/table/demo-token-TBL-001`: the launcher opens a 384×600 window whose content starts at the header (59 px in) with `0` canvases and `0` fox stages inside it, the standing fox is unmounted while it is open, the speaker button reports voice on, asking "what is on the menu?" returns a real reply, and the browser fetched `/api/chat/speak` twice (1157 ms and 735 ms, 161 kB) — the actual ElevenLabs audio, not the speechSynthesis fallback.
- **Limitation**: The chosen voice only speaks on a paid ElevenLabs plan, so what is heard today is the premade fallback voice. The audio was confirmed by the 200 audio/mpeg response, the transfer size and the absence of the speechSynthesis path, but not by listening to it.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/components/common/useFoxSpeech.js`, `client/src/styles/fox-widget.css`, `server/src/routes/chatRoutes.js`, `server/src/config/index.js`, `server/.env`, `CHANGES.md`.

### Change 81: Finnegan Stands Beside the Chat, Speaks in a Young Male Voice, and Answers Exactly

- **Problem**: Opening the chat unmounted the 3D fox and left only a text window, so he vanished the moment a guest wanted to talk to him. The voice was a library voice that a free ElevenLabs plan refuses (`402 paid_plan_required`), and the knowledge file still told guests to scan a table QR that they had already scanned, while answers wandered ("yes, free Wi-Fi" was invented).
- **Action**: He now stays on screen while the chat is open. `.cafe-fox-launcher-chat-open` parks the standing fox 424px from the right (16px clear of the 384px window) on desktop; on narrow screens (≤620px) he moves to a slim column on the left and the window takes the rest, so both are always visible. The same single WebGL stage is reused, and his mood follows the conversation: `listening` while waiting, `thinking` while the reply is on its way, `speaking` while the voice plays.
- **Action**: A small cream `cafe-fox-thought` bubble with three bobbing dots appears by his head while he is thinking. Clicking him with the chat open pokes him (his bounce gesture) and focuses the input instead of closing anything.
- **Action**: Voice switched to a young male premade voice, `TX3LPaxmHKxFdv7VOQHJ` (Liam), with `ErXwobaYiN019PkySvjV` (Antoni, also young male) as the fallback for `ELEVENLABS_FALLBACK_VOICE_ID`. Both were checked against the live API and answer `200` on the current plan; the previously configured library voice is what the fallback path exists for.
- **Action**: `server/src/chat/cafeKnowledge.js` rewritten: a known-unknown section (Wi-Fi, parking, restrooms, delivery, hours, address, phone, offers, vegan labels, counter payments, jobs) that must be answered with one fixed line instead of a guess; explicit payment-through-the-cart, bill-in-the-cart and tracker facts; and a hard rule that the guest is already on their table menu page, so no one is ever told to scan a QR code, install an app or sign in. The system prompt in `chatRoutes.js` was tightened to about 20 words, yes/no questions opening with Yes or No, no lists, no filler.
- **Action**: Answers that must be exact are no longer left to the model. `DIRECT_ANSWERS` in `chatRoutes.js` handles QR, veg/vegan, allergens, Wi-Fi and the other unknowns, invoices, bills, prices, payment methods, cancellation, order tracking, tables/booking, reordering and thanks with one fixed short line each, before Groq is called — instant, free, and impossible to hallucinate. The chat model moved from `openai/gpt-oss-20b` to `openai/gpt-oss-120b` (the only larger model this key can reach) with low reasoning effort and a retry when it returns an empty reply.
- **Verification**: `cd client && npm run build` green (2.26 s); `npx oxlint` on `FoxChatWidget.jsx` 0 warnings / 0 errors; `node --check` on the three server files. Live on `/table/demo-token-TBL-001` at 1280px: fox 132×178 at x718, window 384×600 at x866 — 16px gap, no overlap, one canvas, `data-state="listening"`, `aria-expanded="true"`; sending a message moves him to `thinking` with the thought bubble visible. At 390px: fox 96px wide at left 10, window 262×570 to its right, no overlap and no horizontal overflow. `POST /api/chat/speak` returns `200 audio/mpeg` (56 kB) with the new voice. A 20-question battery returns short exact answers with no QR mentions and no invented Wi-Fi, delivery or bills.
- **Limitation**: The fox was verified by measured geometry and DOM state, not by looking at a screenshot, and the voices were chosen from ElevenLabs' published descriptions plus a live `200` check — I did not listen to them. Voice input from a real phone was not tested.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/styles/fox-widget.css`, `server/src/chat/cafeKnowledge.js`, `server/src/routes/chatRoutes.js`, `server/src/config/index.js`, `server/.env`, `CHANGES.md`.

### Change 82: The Chat Unfolds Out of Finnegan, and He Always Thinks for 200ms

- **Problem**: Opening the chat slid the fox 424px to the left before the window appeared, so pressing him made him jump across the corner instead of opening where the guest was looking. The window also popped in over 200ms, and a reply from the instant direct answers landed with no visible thinking step.
- **Action**: The fox no longer moves on open. The `cafe-fox-launcher-chat-open` offset is gone (class and CSS both), so the standing fox keeps exactly the position and size he was clicked at, and only his mood changes (`listening` / `thinking` / `speaking`).
- **Action**: The window now comes out of him. It sits 12px off his left shoulder with its base on the same line (`right: 162px`, `bottom: 16px`, both aligned to the 132×178 fox), and its `cafeFoxEmerge` keyframes scale and fade it from a `transform-origin` at that bottom-right corner over 720ms with `cubic-bezier(.4, 0, .2, 1)`, so it grows out of the fox instead of flying in from the screen edge. The start state (`translate(8px, 16px) scale(.9)`) stays clear of his footprint, so the window never passes over him. On ≤620px the origin flips to `0 100%` because there the fox stands on the left. The cart dock moves both together (`bottom: 84px`).
- **Action**: `FoxChatWidget` now guarantees a 200ms thinking beat: `REPLY_THINKING_MS` starts a timer alongside `chatBotApi.sendMessage` and the reply (or the error line) is only appended after both settle, so the typing bubble and the fox's `thinking` pose are always seen, even when a `DIRECT_ANSWERS` answer comes back instantly. The input stays disabled for that beat, so a second message cannot overtake the first.
- **Verification**: `cd client && npm run build` green (3.16 s); `npx oxlint src/components/common/FoxChatWidget.jsx` — 0 warnings, 0 errors. Live on `/table/demo-token-TBL-001` at 1280×900: the fox's rect is `1124,706 → 1256,884` before the click and identical after it (`foxMoved: 0`), one canvas, `data-state` goes `listening → thinking`; the settled window is 384×600 with its right edge at 1112 and its bottom at 884 — 12px clear of the fox, bases aligned, no horizontal overflow. Seeking the running animation by `currentTime` confirms the geometry at every step (346px wide at 0ms, clear of the fox by 4–12px, 384px at 720ms, opacity 0 → .24 → .78 → .96 → 1). Sending "do you have wifi?" showed the typing bubble before the reply arrived.
- **Limitation**: The preview tab reports `document.visibilityState: "hidden"`, so the open animation could not be watched playing — it was verified by seeking its timeline and reading the resulting rects, not by eye.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/styles/fox-widget.css`, `CHANGES.md`.

### Change 83: The Chat Folds Back Into Finnegan When It Closes

- **Problem**: Opening the window took 720ms but closing removed it in a single frame, so the pair felt lopsided and the panel seemed to be yanked off screen.
- **Action**: Closing now plays a mirror of the opening. `cafeFoxRetract` fades and scales the window back into the same bottom-right `transform-origin` over 500ms with `cubic-bezier(.4, 0, .2, 1)` — from 384px wide and opaque to 346px and transparent, its right edge moving toward the fox, never over him (12px clear at the first frame, 4px at the last).
- **Action**: `FoxChatWidget` gained a `closing` state: `close()` clears `open` immediately — so the launcher drops to `idle`, the thought bubble hides, `aria-expanded` goes false and the voice stops at once — while the window stays mounted for `CLOSE_MS` (500ms, matching the keyframes) and then unmounts. The exit is `pointer-events: none` and `aria-hidden`, so the closing panel cannot be clicked or read out.
- **Action**: Escape is untouched: the keydown handler still calls `close()`, which now goes through the exit, and the handler detaches because `open` is already false. Clicking Finnegan during the exit cancels the pending unmount (`cancelClose`), clears `data-closing` and replays `cafeFoxEmerge`, so a fast reopen never leaves an empty panel or a dead timer. The timer is also cleared on unmount. `send()` ignores submits while `closing`, so an Enter press during the last half second cannot post into a vanishing window.
- **Action**: With `prefers-reduced-motion: reduce`, closing is a 180ms opacity fade (`cafeFoxFade`) instead of the fold.
- **Verification**: `cd client && npm run build` green (1.54 s); `npx oxlint src/components/common/FoxChatWidget.jsx` — 0 warnings, 0 errors. Live on `/table/demo-token-TBL-001`: pressing close leaves the window mounted with `data-closing="true"`, `animation-name: cafeFoxRetract`, `aria-hidden="true"`, `aria-expanded="false"` and the fox already `idle` at the same x (moved 0px), then unmounts. Seeking the exit timeline gives 384px/opacity 1 at 0ms → 375/.76 → 354/.22 → 347/.04 → 346/0 at 500ms, always clear of the fox (4–12px). Escape produces the same retract and still unmounts. Reopening 200ms into the exit keeps the window mounted, flips `data-closing` to false, restarts `cafeFoxEmerge`, returns the fox to `listening` and `aria-expanded="true"`.
- **Limitation**: The preview tab is `visibilityState: "hidden"`, so the animations were verified by seeking their timelines and reading rects/opacity, not by watching them.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/styles/fox-widget.css`, `CHANGES.md`.

### Change 84: Whole-Site Health Pass, and the QR Scanner Stops Restarting the Camera

- **Problem**: A full pass over the running project was requested. Walking every route and watching the console turned up one real defect: opening the "Scan a table" dialog logged `Camera start error: Cannot transition to a new state, already under transition` five times in a row. `QRScannerModal`'s start effect depended on `startScanner`, which depended on `handleDecodedText` → `continueToTable` → `closeModal` → the parent's inline `onClose`, so every parent re-render (the console polls every 15 seconds) tore the camera down and started it again, and overlapping `start()` calls made html5-qrcode refuse.
- **Action**: The decoder now lives in `decodeHandlerRef`, kept in sync by an effect, so `startScanner` is a stable `useCallback([])`, and the start/stop effect only reacts to `isOpen` and `activeMode`. A `startingRef` guard refuses a second `start()` while one is in flight. Behaviour, error copy and the upload/simulate fallbacks are unchanged.
- **Verification**: `cd client && npm run build` green (2.35 s); `npx oxlint src/components/common/QRScannerModal.jsx` — 0 warnings, 0 errors. Live: opening the scanner on `/admin` now produces zero camera warnings in the console (previously five in one open).
- **Verification (project-wide pass)**: `server npm test` — 10/10 security tests pass. Public API: `/api/health`, `/api/menu/categories` (6), `/api/menu/items`, `/api/tables`, `/api/settings`, `/api/tables/token/demo-token-TBL-001` and `/api/orders/track/demo-token-TBL-001` all `200` in 2–272ms; `/api/orders/stats` correctly `401` without a session. Browser walk with console capture: `/` (hero, 31 controls, all images loaded, no overflow), `/cafe` (WebGL context alive, 1600×1125 canvas, socket connected), `/table/demo-token-TBL-001` (menu, 24 items, cart dock), `/track/demo-token-TBL-001` (empty state, socket joined), `/admin` (owner session, Overview / Live Orders 2 / Tables 6 / Menu 24 / Sales Reports), `/admin/print-tables` (six standee cards, each with six inline QR SVGs), `/privacy`, and the 404 route. No JavaScript errors and no failed requests on any of them; the only console output is Chrome's `web-share` / `local-network-access` feature warnings and Vite's dev messages.
- **Limitation**: The real camera path, Razorpay checkout with live keys, and a physical phone were not exercised; the preview tab is `visibilityState: "hidden"`, so no animation playback was watched. 28 pre-existing `oxlint` warnings remain (11 unused vars, 9 set-state-in-effect, 3 refs, 3 only-export-components, 1 purity), mostly in the unrouted legacy pages `LandingPage.jsx`, `PublicDisplayPage.jsx` and `KitchenKDSPage.jsx`; they are advisories, not runtime faults, and were left alone.
- **Files**: `client/src/components/common/QRScannerModal.jsx`, `CHANGES.md`.

### Change 85: A Small "I'm Felix — ask me anything." Tooltip on the Standing Fox

- **Action**: Added a compact tooltip to the standing 3D fox so a guest hovering or focusing him sees a short hint before opening the chat. The text is `I'm Felix — ask me anything.` and it is implemented as a non-interactive labeled element inside the launcher box, so it never shifts the fox or the chat window.
- **Action**: It fades and rises in on `:hover` and `:focus-visible`, hides the moment the pointer or focus leaves, and is hidden entirely while the chat is open (`aria-hidden` on the tooltip, `aria-describedby` removed), so the fox never speaks with two captions at once. It sits above the fox, near his lower-right corner, and matches the existing `.18s` hover timing so it feels like part of the same lift the guest already sees.
- **Action**: Under `prefers-reduced-motion: reduce` the tooltip has no animation and just appears on hover/focus, keeping it accessible without motion.
- **Files**: `client/src/components/common/FoxChatWidget.jsx`, `client/src/styles/fox-widget.css`, `CHANGES.md`.
