import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import RequireAuth from './components/common/RequireAuth';
import SmoothScroll from './components/animations/SmoothScroll';
import './styles/pixel-screens.css';
import './styles/staff-ui.css';
import './styles/design-system.css';
import './styles/premium-redesign.css';

function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <AuthProvider>
          <CartProvider>
            <SocketProvider>
              <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
              <Suspense fallback={<div className="lw-route-loading" role="status" aria-live="polite"><span aria-hidden="true" />Setting the table…</div>}>
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

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </SocketProvider>
          </CartProvider>
        </AuthProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
}

export default App;
