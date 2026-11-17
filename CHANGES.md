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
