import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import CategoryNav from '../components/customer/CategoryNav';
import MenuCard from '../components/customer/MenuCard';
import ItemDetailModal from '../components/customer/ItemDetailModal';
import CartDrawer from '../components/customer/CartDrawer';
import PaymentModal from '../components/customer/PaymentModal';
import { tableApi, menuApi } from '../api/apiServices';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatters';
import {
  Search,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Coffee,
  Clock3,
  ArrowRight,
  Utensils,
  X,
} from 'lucide-react';
import '../styles/customer-order.css';

const CustomerMenuPage = () => {
  const { token } = useParams();
  const {
    setToken,
    tableInfo,
    setTableInfo,
    customerInfo,
    setCustomerInfo,
    addItem,
    itemCount,
    totalAmount,
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Check-In modal state
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    name: customerInfo?.name || '',
    phone: customerInfo?.phone || '',
    guests: customerInfo?.guests || 1,
  });
  const [checkingIn, setCheckingIn] = useState(false);
  // Where to go once the guest has given a name — set when they hit "Review order".
  const [afterCheckin, setAfterCheckin] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);

  // Modals state
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const heroRef = useRef(null);

  // Set token in Cart context
  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token, setToken]);

  // Validate QR token and load menu
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Validate table QR token
        const tableRes = await tableApi.validateToken(token);
        if (!tableRes.success || !tableRes.data?.table) {
          throw new Error('This QR code is invalid or has expired. Please ask staff for assistance.');
        }
        const tbl = tableRes.data.table;
        setTableInfo(tbl);

        // A returning guest keeps their name. A new one is asked at checkout, not here —
        // the menu should be readable before anyone asks who you are.
        const savedCustomer = localStorage.getItem(`cafe_customer_${token}`);
        if (savedCustomer) {
          try {
            const parsed = JSON.parse(savedCustomer);
            if (parsed.name) {
              setCustomerInfo(parsed);
              setCheckinForm(parsed);
            }
          } catch {
            // Unreadable local copy: start fresh, the checkout will ask.
          }
        }

        // 2. Fetch categories and menu items
        const [catRes, itemsRes] = await Promise.all([
          menuApi.getCategories(),
          menuApi.getMenuItems(),
        ]);

        if (catRes.success) setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
        if (itemsRes.success) setMenuItems(Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data?.items || []);
      } catch (err) {
        setError(err.message || 'Failed to load cafe menu.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      initPage();
    }
  }, [token, setTableInfo, setCustomerInfo]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || loading || error || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const updatePointer = (event) => {
      const rect = hero.getBoundingClientRect();
      if (rect.width && rect.height) {
        hero.style.setProperty('--order-pointer-x', `${((event.clientX - rect.left) / rect.width - 0.5) * -12}px`);
        hero.style.setProperty('--order-pointer-y', `${((event.clientY - rect.top) / rect.height - 0.5) * -8}px`);
      }
    };
    window.addEventListener('pointermove', updatePointer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', updatePointer);
    };
  }, [loading, error]);

  // After a name is saved, carry on to wherever the guest was heading.
  const continueAfterCheckin = () => {
    if (afterCheckin === 'payment') {
      setAfterCheckin(null);
      setIsCartOpen(false);
      setIsPaymentOpen(true);
    }
  };

  // "Review order" asks for a name first if we don't have one, then opens payment.
  const handleProceedToPayment = () => {
    if (!customerInfo?.name) {
      setAfterCheckin('payment');
      setIsCartOpen(false);
      setIsCheckinOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  // Handle Check-in submit
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!checkinForm.name.trim()) return;

    try {
      setCheckingIn(true);
      await tableApi.checkin(token, {
        customerName: checkinForm.name.trim(),
        customerPhone: checkinForm.phone.trim(),
        guests: Number(checkinForm.guests) || 1,
      });

      const updated = {
        name: checkinForm.name.trim(),
        phone: checkinForm.phone.trim(),
        guests: Number(checkinForm.guests) || 1,
      };

      setCustomerInfo(updated);
      localStorage.setItem(`cafe_customer_${token}`, JSON.stringify(updated));
      setTableInfo((prev) => ({ ...prev, status: 'occupied' }));
      setIsCheckinOpen(false);
      continueAfterCheckin();
    } catch (err) {
      console.warn('Checkin error:', err);
      // Still proceed locally
      const updated = {
        name: checkinForm.name.trim(),
        phone: checkinForm.phone.trim(),
        guests: Number(checkinForm.guests) || 1,
      };
      setCustomerInfo(updated);
      localStorage.setItem(`cafe_customer_${token}`, JSON.stringify(updated));
      setIsCheckinOpen(false);
      continueAfterCheckin();
    } finally {
      setCheckingIn(false);
    }
  };

  // Filter items based on search, category, and veg filter
  const filteredItems = menuItems.filter((item) => {
    if (vegOnly && !item.isVeg) return false;
    if (selectedCategory !== 'all') {
      const itemCatId = item.category?._id || item.category;
      if (itemCatId !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  // Handle direct quick add
  const handleQuickAdd = (item) => {
    addItem(item, { quantity: 1 });
  };

  if (loading) {
    return <div className="order-state-screen"><Loader2 className="order-spinner" /><p>Preparing the menu…</p><small>Checking your table</small></div>;
  }

  if (error) {
    return <div className="order-state-screen order-error-screen"><span><AlertCircle size={25} /></span><h1>This table link isn’t ready</h1><p>{error}</p><small>Please ask a team member to check the table QR code.</small></div>;
  }

  const tableLabel = tableInfo?.displayName || `Table ${tableInfo?.tableId || ''}`;

  return (
    <div className="customer-order-page">
      <header className="order-header">
        <div className="order-brand" aria-label="Little Window Café">
          <span className="order-brand-mark"><Coffee size={19} /></span>
          <span><strong>Little Window</strong><small>Order at your table</small></span>
        </div>
        <div className="order-table-chip"><span>Ordering at</span><strong>{tableLabel}</strong></div>
        <div className="order-header-actions">
          <Link to={`/track/${token}`} className="order-track-link"><Clock3 size={16} /><span>My orders</span></Link>
          <button type="button" className="order-header-cart" onClick={() => setIsCartOpen(true)} aria-label={`Open cart, ${itemCount} items`}><ShoppingBag size={17} /><span>Cart</span><b>{itemCount}</b></button>
        </div>
      </header>

      <main>
        <section className="order-hero">
          <div className="order-hero-copy">
            <span className="order-hero-location"><i />{customerInfo?.name ? `Hi, ${customerInfo.name.split(' ')[0]}` : `Welcome to ${tableLabel}`}</span>
            <h1>What sounds<br />good today?</h1>
            <p>Fresh from our kitchen, brought right to your table.</p>
          </div>
          <div className="order-hero-photo" ref={heroRef} aria-label="A freshly prepared Indian café meal" role="img"><div className="order-hero-food" /></div>
        </section>

        <section className="order-menu-section" id="menu">
          <div className="order-menu-heading"><div><span>Little Window menu</span><h2>Pick your favourites</h2></div><small>{filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}</small></div>
          <div className="order-menu-toolbar">
            <label className="order-search"><Search size={18} /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find a dish or drink" aria-label="Search menu" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={15} /></button>}</label>
            <CategoryNav categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} vegOnly={vegOnly} onToggleVegOnly={() => setVegOnly((value) => !value)} />
          </div>

          {filteredItems.length === 0 ? (
            <div className="order-empty-state"><Coffee size={22} /><strong>No dishes found</strong><span>Try another search or menu category.</span></div>
          ) : (
            <div className="order-food-grid">
              {filteredItems.map((item) => <MenuCard key={item._id} item={item} onSelect={setSelectedItemForModal} onQuickAdd={handleQuickAdd} />)}
            </div>
          )}
        </section>
      </main>

      {itemCount > 0 && <div className="order-cart-dock"><div><strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong><span>{formatINR(totalAmount)}</span></div><button type="button" onClick={() => setIsCartOpen(true)}>Review order <ArrowRight size={16} /></button></div>}

      <ItemDetailModal isOpen={!!selectedItemForModal} onClose={() => setSelectedItemForModal(null)} item={selectedItemForModal} onAddToCart={addItem} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onProceedToPayment={handleProceedToPayment} />
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />

      {isCheckinOpen && (
        <div className="order-checkin-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCheckinOpen(false); }}>
          <section className="order-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="order-checkin-title">
            <div className="order-checkin-heading"><span><Utensils size={18} /></span><div><h2 id="order-checkin-title">Welcome to {tableLabel}</h2><p>A name so the team knows whose order this is.</p></div><button type="button" onClick={() => setIsCheckinOpen(false)} aria-label="Close check-in"><X size={18} /></button></div>
            <form onSubmit={handleCheckinSubmit} className="order-checkin-form">
              <label>Your name<input type="text" required autoComplete="name" placeholder="Name for the order" value={checkinForm.name} onChange={(event) => setCheckinForm({ ...checkinForm, name: event.target.value })} autoFocus /></label>
              <label>Phone number <span>Optional</span><input type="tel" autoComplete="tel" placeholder="For order updates" value={checkinForm.phone} onChange={(event) => setCheckinForm({ ...checkinForm, phone: event.target.value })} /></label>
              <label>Guests<select value={checkinForm.guests} onChange={(event) => setCheckinForm({ ...checkinForm, guests: Number(event.target.value) })}>{Array.from({ length: tableInfo?.capacity || 4 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'guest' : 'guests'}</option>)}</select></label>
              <button type="submit" disabled={checkingIn || !checkinForm.name.trim()}>{checkingIn ? 'Saving…' : afterCheckin === 'payment' ? 'Save & continue to payment' : 'Save my name'}<ArrowRight size={16} /></button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default CustomerMenuPage;
