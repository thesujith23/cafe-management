# ☕ Smart QR-Based Café Management System

A full-stack, real-time MERN application built with Express.js, React 19, Tailwind CSS, Socket.IO, and Razorpay.

---

## 🌟 Key Features

1. **6 Unique Tables & QR Ordering**:
   - 6 uniquely identified dining tables (`Table 1` to `Table 6` / `TBL-001` to `TBL-006`).
   - Tamper-proof, cryptographically signed QR tokens per table.
   - Customers scan the table QR code to open their dedicated table menu.
   - Server-side validation guarantees orders cannot be spoofed or assigned to incorrect tables.

2. **Mobile-First Customer Experience**:
   - Browse 24 Indian café dishes across 6 categories (Meals, Snacks, Breakfast, Beverages, Desserts, Specials).
   - Pure Veg filter toggle and instant keyword search.
   - Item customizer for sizing (Regular/Large), custom add-ons (extra cheese, extra shot, dips), and special instructions.
   - Live sliding cart drawer with real-time bill breakdown (Subtotal, CGST 2.5%, SGST 2.5%, Service Charge 5%, and Total).

3. **Verified Online Payments (Razorpay)**:
   - Server-side price calculation (never trusts client price data).
   - Razorpay order creation + HMAC-SHA256 signature verification.
   - Supports live Razorpay credentials and instant **Sandbox / Demo Verification Mode** for seamless evaluations.
   - Only verified, paid orders reach the kitchen queue.

4. **Kitchen Display System (KDS)**:
   - Route: `/kitchen`
   - 3-stage Kanban workflow: **New Orders** ➔ **In Preparation** ➔ **Ready for Pickup**.
   - Preparation countdown timers and visual alerts for urgent orders.
   - Web Audio API synthetic chimes on incoming tickets (zero external audio file dependencies).

5. **Public Order Display Board**:
   - Route: `/display`
   - TV-optimized, full-screen dark mode display for café dining area monitors.
   - Split view: **PREPARING** (amber) vs. **READY TO SERVE** (emerald).
   - Live digital clock and pleasant audio chime when an order is ready.

6. **Staff & Admin Management Dashboard**:
   - Route: `/admin` (Login: `/admin/login`)
   - KPI metrics (Today's Sales, Orders Count, Active Tickets, Table Occupancy).
   - Live Orders manager with status advance actions.
   - 6-table floor plan with QR modal and direct customer simulation links.
   - Menu item manager (add/edit items, toggle in-stock/out-of-stock, delete).
   - Sales reports and popular dish analytics.

7. **Interactive Café & Table Reservations**:
   - Route `/` introduces Little Window Café with a layered courtyard scene, subtle parallax, and reduced-motion support.
   - Visitors can reserve an available table for up to 90 days ahead; capacity and table availability are checked by the server.
   - Route `/cafe` is a fixed customer-facing 3D café with a planted courtyard, live order board, staffed counter, and guest-to-counter-to-table service animation.
   - Reservations release automatically after a 30-minute arrival grace period if the guest does not check in.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** (local `mongodb://localhost:27017` or MongoDB Atlas URI in `server/.env`)

### 2. Starting the Backend Server
```bash
cd server
npm install
npm run seed     # Seeds 6 tables, 24 menu items, and 3 staff accounts
npm run dev      # Runs Express + Socket.IO on http://localhost:5000
```

### 3. Starting the Frontend Client
```bash
cd client
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Owner (Admin)** | `admin@cafe.com` | `admin123` | Full dashboard, menu editing, table QR generation, reports |
| **Counter Staff** | `counter@cafe.com` | `counter123` | Order tracking, table occupancy, menu viewing |
| **Kitchen Chef** | `kitchen@cafe.com` | `kitchen123` | Kitchen Display System (KDS), ticket status updates |

---

## 🌐 Application Route Sitemap

- `/` — Project introduction with a guided overview of the guest-to-kitchen ordering flow
- `/cafe` — Fixed-camera 3D café with live table QR ordering, a concealed staff kitchen, and an in-place order status board
- `/table/:token` — Customer Mobile Menu for specific table QR token
- `/track/:token` — Live Customer Order Tracker with animated stepper and audio chime
- `/kitchen` — Kitchen Display System (KDS) 3-stage cooking queue
- `/display` — Public Order Board for café TV screens
- `/admin/login` — Staff login portal with 1-click credential presets
- `/admin` — Private Admin Dashboard
