import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../utils/roleHome';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';
import QRScannerModal from './QRScannerModal';
import { Coffee, Clock3, LayoutDashboard, LogOut, QrCode, ShoppingBag } from 'lucide-react';

const Navbar = ({ onOpenCart }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const { itemCount, tableInfo } = useCart();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const location = useLocation();
  // Kitchen staff work in the queue board, display screens show the café, everyone else in the console.
  const staffHome = isAuthenticated ? homeForRole(user?.role) : '/admin/login';
  const staffLabel = user?.role === 'kitchen' ? 'Kitchen' : user?.role === 'display' ? 'Display' : 'Console';
  const isCustomerRoute = location.pathname.startsWith('/table') || location.pathname.startsWith('/order') || location.pathname.startsWith('/track');

  return (
    <>
      <header className="lw-app-header">
        <div className="lw-app-header-inner">
          <Link to="/" className="lw-app-brand" aria-label="Little Window Café home">
            <span className="lw-app-brand-mark"><Coffee size={19} strokeWidth={1.7} /></span>
            <span><strong>Little Window</strong><small>CAFÉ &amp; GARDEN</small></span>
          </Link>
          <div className="lw-app-live" aria-live="polite">
            <i className={isConnected ? 'is-online' : ''} />
            <span>{isConnected ? 'Service live' : 'Reconnecting'}</span>
          </div>
          <nav className="lw-app-nav" aria-label="Café tools">
            <Link to="/cafe" aria-current={location.pathname === '/cafe' ? 'page' : undefined} className={'lw-app-link ' + (location.pathname === '/cafe' ? 'is-active' : '')}>
              <Coffee size={16} /><span>Café floor</span>
            </Link>
            <button type="button" className="lw-app-link" onClick={() => setIsScannerOpen(true)}><QrCode size={16} /><span>Scan a table</span></button>
            {isCustomerRoute && tableInfo && <span className="lw-app-table"><Clock3 size={14} />{tableInfo.displayName || `Table ${tableInfo.tableId}`}</span>}
            {isCustomerRoute && onOpenCart && <button type="button" className="lw-app-cart" onClick={onOpenCart} aria-label={`Open cart, ${itemCount} items`}><ShoppingBag size={16} /><span>Cart</span><b>{itemCount}</b></button>}
            <Link to={isAuthenticated ? staffHome : '/admin/login'} aria-current={location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen') ? 'page' : undefined} className="lw-app-link lw-app-staff">
              <LayoutDashboard size={16} /><span>{isAuthenticated ? staffLabel : 'Staff'}</span>
            </Link>
            {/* The sign-out button stays outside the name block: on a phone the name is
                hidden for space, the way out never should be. */}
            {isAuthenticated && <div className="lw-app-user">
              <span className="lw-app-user-name"><strong>{user?.name}</strong><small>{user?.role}</small></span>
              <button type="button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
            </div>}
          </nav>
        </div>
      </header>
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </>
  );
};

export default Navbar;
