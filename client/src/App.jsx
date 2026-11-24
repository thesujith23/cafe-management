import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

// Pages
const ProjectLandingPage = lazy(() => import('./pages/ProjectLandingPage'));
const CafePage = lazy(() => import('./pages/CafePage'));
const CustomerMenuPage = lazy(() => import('./pages/CustomerMenuPage'));
const OrderStatusPage = lazy(() => import('./pages/OrderStatusPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const KitchenKDSPage = lazy(() => import('./pages/KitchenKDSPage'));
const PrintTableQRCardsPage = lazy(() => import('./pages/PrintTableQRCardsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import RequireAuth from './components/common/RequireAuth';
import ErrorBoundary from './components/common/ErrorBoundary';
import FoxChatWidget from './components/common/FoxChatWidget';
import SmoothScroll from './components/animations/SmoothScroll';


import './styles/pixel-screens.css';
import './styles/staff-ui.css';
import './styles/design-system.css';
import './styles/premium-redesign.css';
import './styles/icon-motion.css';
import './styles/security.css';
import './styles/fox-widget.css';
import './styles/index.css';

// Finnegan, the 3D café fox, belongs to the guest experience only: the public website and
// the table-side ordering flow a QR code opens. Staff screens stay clean.
const GUEST_CHAT_PATHS = ['/table/', '/order/', '/track/'];

function GuestChatWidget() {
  const { pathname } = useLocation();
  const isGuestRoute = pathname === '/'
    || GUEST_CHAT_PATHS.some((path) => pathname.startsWith(path));
  return isGuestRoute ? <FoxChatWidget /> : null;
}

function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <AuthProvider>
          <CartProvider>
            <SocketProvider>
              <GuestChatWidget />
              <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
              <Suspense fallback={<div className="lw-route-loading" role="status" aria-live="polite"><span aria-hidden="true" />Setting the table…</div>}>
                <ErrorBoundary>
                <Routes>
                  {/* Home & Interactive Hub */}
                  <Route path="/" element={<ProjectLandingPage />} />
                  <Route path="/cafe" element={<CafePage />} />

                {/* Customer QR Ordering Flow (supports /table/:token and /order/:token) */}
                  <Route path="/table/:token" element={<CustomerMenuPage />} />
                  <Route path="/order/:token" element={<CustomerMenuPage />} />
                  <Route path="/track/:token" element={<OrderStatusPage />} />

                {/* The kitchen has its own board; pickup stays a view inside the café scene */}
                  <Route path="/kitchen" element={<RequireAuth roles={['kitchen', 'counter', 'owner']}><KitchenKDSPage /></RequireAuth>} />
                  <Route path="/display" element={<Navigate to="/cafe" replace />} />

                {/* Staff & Admin Console — counters and owners only; kitchen is sent to /kitchen */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<RequireAuth roles={['owner', 'counter']}><AdminDashboardPage /></RequireAuth>} />
                  <Route path="/admin/print-tables" element={<RequireAuth roles={['owner', 'counter']}><PrintTableQRCardsPage /></RequireAuth>} />
                  <Route path="/privacy" element={<PrivacyPage />} />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </ErrorBoundary>
              </Suspense>
            </SocketProvider>
          </CartProvider>
        </AuthProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
}

export default App;
