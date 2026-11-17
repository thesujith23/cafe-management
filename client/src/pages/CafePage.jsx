import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BellRing, CalendarDays, ChefHat, Coffee, Eye, Flame, HelpCircle, LayoutDashboard, LogIn, LogOut, ShoppingBag, Trees, Utensils, Waves, X } from 'lucide-react';
import { tableApi, orderApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sounds } from '../utils/sound';
import Modal from '../components/common/Modal';
import { homeForRole } from '../utils/roleHome';
import CafeScene from '../components/cafe/CafeScene';
import '../styles/cafe-world.css';

const FALLBACK_TABLES = Array.from({ length: 6 }, (_, index) => ({
  _id: `demo-${index + 1}`,
  tableId: `TBL-00${index + 1}`,
  displayName: `Table ${index + 1}`,
  capacity: 4,
  status: 'available',
  currentQrToken: { token: `demo-token-TBL-00${index + 1}` },
}));

const getList = (response) => Array.isArray(response?.data)
  ? response.data
  : (response?.data?.tables || response?.tables || []);

const getOrderGroups = (response) => {
  const data = response?.data || {};
  return {
    queued: data.queued || data.active?.filter((order) => ['new', 'accepted'].includes(order.preparationStatus)) || [],
    preparing: data.preparing || data.active?.filter((order) => order.preparationStatus === 'preparing') || [],
    ready: data.ready || data.active?.filter((order) => order.preparationStatus === 'ready') || [],
  };
};

const getPreparationTime = (order) => {
  const items = (order.items || []).map((item) => item.name || item.menuItem?.name || '').join(' ').toLowerCase();
  if (/coffee|tea|latte|espresso|juice|shake|smoothie/.test(items)) return 8000;
  if (/toast|sandwich|wrap|panini|burger|fries/.test(items)) return 12000;
  if (/pizza|pasta|biryani|curry|meal|thali|rice/.test(items)) return 17000;
  return Math.min(18000, 11000 + Math.max(0, (order.items || []).length - 1) * 1800);
};

const getPreparationTimeRemaining = (order) => {
  const startedAt = Date.parse(order.preparingAt) || Date.now();
  return Math.max(250, getPreparationTime(order) - (Date.now() - startedAt));
};

const getPreparationAction = (order) => {
  const items = (order.items || []).map((item) => item.name || item.menuItem?.name || '').join(' ').toLowerCase();
  if (/coffee|tea|latte|espresso|juice|shake|smoothie/.test(items)) return 'Brewing and pouring';
  if (/toast|sandwich|wrap|panini|burger|fries/.test(items)) return 'Grilling and assembling';
  if (/pizza|pasta|biryani|curry|meal|thali|rice/.test(items)) return 'Cooking and plating';
  return 'Preparing fresh ingredients';
};

const getFoodSheetPosition = (item) => {
  const name = `${item?.name || ''} ${item?.category?.name || ''}`.toLowerCase();
  if (/dessert|brownie|cake|sweet|ice cream|jamun|rasmalai/.test(name)) return '100% 100%';
  if (/drink|beverage|coffee|tea|lassi|juice|soda|shake/.test(name)) return '0% 100%';
  if (/breakfast|dosa|idli|poha|snack|samosa|fries|roll|pakora/.test(name)) return '100% 0%';
  return '0% 0%';
};

const getKitchenVisualType = (item) => {
  const name = `${item?.name || ''} ${item?.category?.name || ''}`.toLowerCase();
  if (/coffee|tea|latte|espresso|juice|lassi|shake|smoothie|beverage/.test(name)) return 'beverage';
  if (/cake|brownie|cookie|dessert|pastry|bake|sweet/.test(name)) return 'oven';
  if (/toast|sandwich|wrap|panini|burger|fries|grill|dosa/.test(name)) return 'grill';
  return 'pan';
};

const getOrderKey = (order) => String(order?._id || order?.orderNumber || order?.displayOrderId || '');

const SCENE_SHOWCASES = {
  table: { title: 'A seat at the table', caption: 'Watch the guests share a meal and conversation.', icon: Utensils },
  kitchen: { title: 'In the kitchen', caption: 'Chefs stir, plate, and prepare the next dish.', icon: ChefHat },
  counter: { title: 'At the counter', caption: 'The barista takes an order and gets it ready.', icon: Coffee },
  trees: { title: 'Under the trees', caption: 'Garden birds circle the canopy and settle nearby.', icon: Trees },
  pond: { title: 'The garden pond', caption: 'Little fish glide through the water beneath the lilies.', icon: Waves },
};

const CafePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, isAuthenticated, logout } = useAuth();
  const staffHome = homeForRole(user?.role);
  const staffLabel = user?.role === 'kitchen' ? 'Kitchen board' : user?.role === 'display' ? 'Display' : 'Console';
  const [helpOpen, setHelpOpen] = useState(false);
  const [tables, setTables] = useState(FALLBACK_TABLES);
  const [orders, setOrders] = useState({ queued: [], preparing: [], ready: [] });
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false);
  const [stationPopup, setStationPopup] = useState(null);
  const [selectedTableForAction, setSelectedTableForAction] = useState(null);
  const [sceneFocus, setSceneFocus] = useState(null);
  const [sceneFocusStage, setSceneFocusStage] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [reservedTable, setReservedTable] = useState(null);
  const [menuToken, setMenuToken] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [orderActionError, setOrderActionError] = useState('');
  const [now, setNow] = useState(0);
  const completedOrderIds = useRef(new Set());
  const readyTimers = useRef(new Map());
  const pendingOrderIds = useRef(new Set());
  const [pendingOrders, setPendingOrders] = useState([]);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [kitchenFocusOrder, setKitchenFocusOrder] = useState(null);
  const [kitchenCameraMode, setKitchenCameraMode] = useState('');
  const previousQueuedIds = useRef(null);
  const incomingOrderTimer = useRef(null);
  const sceneFocusTimer = useRef(null);

  useEffect(() => {
    if (!location.state?.fromLandingRide) return undefined;
    const clearArrivalState = window.setTimeout(() => navigate('/cafe', { replace: true, state: null }), 3000);
    return () => window.clearTimeout(clearArrivalState);
  }, [location.state, navigate]);

  const loadOrders = useCallback(async () => {
    try {
      const response = await orderApi.getDisplayOrders();
      if (response?.success) {
        const groupedOrders = getOrderGroups(response);
        setOrders(groupedOrders);
        setHasLoadedOrders(true);
        setKitchenFocusOrder((current) => {
          if (!current) return current;
          const liveOrder = [...groupedOrders.queued, ...groupedOrders.preparing, ...groupedOrders.ready]
            .find((order) => getOrderKey(order) === getOrderKey(current));
          if (!liveOrder) return current;
          const rank = { new: 0, accepted: 1, preparing: 2, ready: 3 };
          return (rank[liveOrder.preparationStatus] ?? 0) > (rank[current.preparationStatus] ?? 0) ? liveOrder : current;
        });
      }
    } catch {
      // The room remains interactive while live order services are offline.
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialOrderLoad = window.setTimeout(() => { if (active) loadOrders(); }, 0);
    tableApi.getTables().then((response) => {
      if (!active) return;
      const list = getList(response);
      if (list.length) setTables([...FALLBACK_TABLES.map((fallback) => ({
        ...fallback,
        ...(list.find((table) => table.tableId === fallback.tableId) || {}),
      }))]);
    }).catch(() => {});
    return () => {
      active = false;
      window.clearTimeout(initialOrderLoad);
    };
  }, [loadOrders]);

  useEffect(() => {
    if (!hasLoadedOrders) return;
    const currentIds = new Set(orders.queued.map(getOrderKey));
    if (previousQueuedIds.current === null) {
      previousQueuedIds.current = currentIds;
      return;
    }
    const newOrder = orders.queued.find((order) => !previousQueuedIds.current.has(getOrderKey(order)));
    previousQueuedIds.current = currentIds;
    if (!newOrder) return;

    setIncomingOrder(newOrder);
    sounds.playNewOrder();
    window.clearTimeout(incomingOrderTimer.current);
    incomingOrderTimer.current = window.setTimeout(() => setIncomingOrder(null), 9000);
  }, [hasLoadedOrders, orders.queued]);

  useEffect(() => () => window.clearTimeout(incomingOrderTimer.current), []);

  useEffect(() => () => window.clearTimeout(sceneFocusTimer.current), []);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => { window.setTimeout(loadOrders, 250); };
    const updateTable = (changed) => setTables((current) => current.map((table) =>
      table._id === changed._id || table.tableId === changed.tableId ? { ...table, ...changed } : table));
    socket.emit('join:display');
    socket.on('table:statusUpdate', updateTable);
    socket.on('order:new', refresh);
    socket.on('order:statusUpdate', refresh);
    socket.on('order:status:changed', refresh);
    const timer = window.setInterval(loadOrders, 15000);
    return () => {
      window.clearInterval(timer);
      socket.off('table:statusUpdate', updateTable);
      socket.off('order:new', refresh);
      socket.off('order:statusUpdate', refresh);
      socket.off('order:status:changed', refresh);
    };
  }, [socket, loadOrders]);

  useEffect(() => () => {
    readyTimers.current.forEach(window.clearTimeout);
    readyTimers.current.clear();
  }, []);

  useEffect(() => {
    if (!orders.preparing.length) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [orders.preparing.length]);

  const openTable = (tableId) => {
    setSelectedTableForAction(null);
    const table = tables.find((item) => item.tableId === tableId);
    if (table?.status === 'reserved') {
      setReservedTable(table);
      setStationPopup('reservation');
      return;
    }
    setMenuToken(table?.currentQrToken?.token || `demo-token-${tableId}`);
    setStationPopup('menu');
  };

  const beginSceneShowcase = useCallback((place, tableId = null, point = null) => {
    window.clearTimeout(sceneFocusTimer.current);
    setStationPopup(null);
    setSelectedTableForAction(null);
    setSceneFocusStage('travelling');
    setSceneFocus({
      id: `${place}:${tableId || Date.now()}`,
      place,
      tableId,
      x: point?.x,
      z: point?.z,
    });
  }, []);

  const handleSceneFocusStage = useCallback((stage, focusId) => {
    if (!sceneFocus || sceneFocus.id !== focusId) return;
    setSceneFocusStage(stage);
    if (stage === 'focused') {
      window.clearTimeout(sceneFocusTimer.current);
      sceneFocusTimer.current = window.setTimeout(() => {
        setSceneFocus(null);
        setSceneFocusStage('returning');
      }, sceneFocus.place === 'table' ? 8000 : 5000);
    }
  }, [sceneFocus]);

  const closeSceneShowcase = useCallback(() => {
    window.clearTimeout(sceneFocusTimer.current);
    setSceneFocus(null);
    setSceneFocusStage('returning');
  }, []);

  const handleSceneTableClick = useCallback((tableId) => {
    window.clearTimeout(sceneFocusTimer.current);
    setSceneFocus(null);
    setSceneFocusStage('returning');
    // Only one panel at a time: the table card replaces whatever window was open.
    setStationPopup(null);
    setSelectedTableForAction(tableId);
  }, []);

  const openStationPopup = useCallback((station) => {
    window.clearTimeout(sceneFocusTimer.current);
    setSceneFocus(null);
    setSceneFocusStage('returning');
    setSelectedTableForAction(null);
    setStationPopup(station);
  }, []);

  const setOrderPending = useCallback((orderId, pending) => {
    if (pending) pendingOrderIds.current.add(orderId);
    else pendingOrderIds.current.delete(orderId);
    setPendingOrders((current) => pending
      ? (current.includes(orderId) ? current : [...current, orderId])
      : current.filter((id) => id !== orderId));
  }, []);

  const updateOrder = useCallback(async (orderId, status) => {
    const response = await orderApi.updateOrderStatus(orderId, status);
    if (!response?.success) throw new Error(response?.message || 'The order status could not be updated.');
    await loadOrders();
  }, [loadOrders]);

  const handleKitchenCameraStage = useCallback((stage, orderId) => {
    if (!kitchenFocusOrder || getOrderKey(kitchenFocusOrder) !== orderId) return;
    setKitchenCameraMode(stage);
    if (stage !== 'kitchen' || kitchenFocusOrder.preparationStatus === 'preparing' || kitchenFocusOrder.preparationStatus === 'ready') return;

    setOrderPending(orderId, true);
    updateOrder(orderId, 'preparing').then(() => {
      setOrderPending(orderId, false);
    }).catch((error) => {
      setOrderActionError(error.message || 'The kitchen could not start this order.');
      setOrderPending(orderId, false);
      setKitchenFocusOrder(null);
      setKitchenCameraMode('');
    });
  }, [kitchenFocusOrder, setOrderPending, updateOrder]);

  const scheduleReady = useCallback((order) => {
    const orderId = order?._id;
    if (!orderId || readyTimers.current.has(orderId)) return;
    const timer = window.setTimeout(async () => {
      readyTimers.current.delete(orderId);
      try {
        await updateOrder(orderId, 'ready');
        sounds.playOrderReady();
        setOrderPending(orderId, false);
      } catch (error) {
        setOrderActionError(error.message || 'The completed meal could not be marked ready.');
        setOrderPending(orderId, false);
      }
    }, getPreparationTimeRemaining(order));
    readyTimers.current.set(orderId, timer);
  }, [setOrderPending, updateOrder]);

  const startPreparation = async (order) => {
    const orderId = order?._id;
    if (!orderId || pendingOrderIds.current.has(orderId)) return;
    setOrderPending(orderId, true);
    setOrderActionError('');
    setUpdatingOrder(orderId);
    setKitchenFocusOrder({ ...order, preparationStatus: 'accepted' });
    setKitchenCameraMode('travelling-to-kitchen');
    setStationPopup(null);
    let workflowScheduled = false;
    try {
      if (order.preparationStatus === 'new') {
        await updateOrder(orderId, 'accepted');
        workflowScheduled = true;
      } else if (order.preparationStatus === 'accepted') {
        workflowScheduled = true;
      }
    } catch (error) {
      setKitchenFocusOrder(null);
      setKitchenCameraMode('');
      setOrderActionError(error.message || 'The order could not be started.');
    } finally {
      setUpdatingOrder(null);
      if (!workflowScheduled) setOrderPending(orderId, false);
    }
  };

  useEffect(() => {
    orders.preparing.forEach(scheduleReady);
  }, [orders.preparing, scheduleReady]);

  const completeGuestOrder = useCallback(async (order) => {
    if (!order?._id || completedOrderIds.current.has(order._id)) return;
    completedOrderIds.current.add(order._id);
    try {
      const response = await orderApi.updateOrderStatus(order._id, 'served');
      if (!response?.success) throw new Error('The completed order could not be saved.');
      await loadOrders();
    } catch (error) {
      completedOrderIds.current.delete(order._id);
      throw error;
    }
  }, [loadOrders]);

  const visibleOrders = [...orders.queued, ...orders.preparing, ...orders.ready];
  const filteredOrders = orderFilter === 'all'
    ? visibleOrders
    : visibleOrders.filter((order) => orderFilter === 'new'
      ? ['new', 'accepted'].includes(order.preparationStatus)
      : order.preparationStatus === orderFilter);
  const orderCounts = {
    all: visibleOrders.length,
    new: orders.queued.length,
    preparing: orders.preparing.length,
    ready: orders.ready.length,
  };
  const orderName = (order) => order.orderNumber || order.displayOrderId || `Order ${String(order._id || '').slice(-5)}`;
  const orderTableLabel = (order) => order.table?.displayName || order.table?.tableId || order.tableId || '';
  const orderItems = (order) => (order.items || []).map((item) => `${item.quantity || 1}× ${item.name || item.menuItem?.name || 'Cafe item'}`).join(', ');
  const focusedOrderId = getOrderKey(kitchenFocusOrder);
  const kitchenViewOrder = kitchenFocusOrder
    ? visibleOrders.find((order) => getOrderKey(order) === focusedOrderId) || kitchenFocusOrder
    : null;
  const kitchenViewPhase = kitchenViewOrder?.preparationStatus === 'ready'
    ? 'ready'
    : kitchenViewOrder?.preparationStatus === 'preparing' ? 'cooking' : 'accepted';
  const mainKitchenItem = kitchenViewOrder?.items?.[0] || {};
  const kitchenVisualType = getKitchenVisualType(mainKitchenItem);
  const kitchenFoodImage = mainKitchenItem.image || mainKitchenItem.menuItem?.image;
  const kitchenProgress = kitchenViewPhase === 'cooking'
    ? Math.min(100, Math.max(3, ((now - (Date.parse(kitchenViewOrder?.preparingAt) || now)) / getPreparationTime(kitchenViewOrder)) * 100))
    : kitchenViewPhase === 'ready' ? 100 : 5;
  const selectedTable = tables.find((table) => table.tableId === selectedTableForAction);
  const selectedTableName = selectedTable?.displayName || selectedTable?.tableId || 'Your table';
  const selectedTableIndex = tables.findIndex((table) => table.tableId === selectedTableForAction);
  const selectedTableIsReserved = Boolean(selectedTable && (selectedTableIndex < 3 || selectedTable.status === 'reserved'));
  const focusedTable = tables.find((table) => table.tableId === sceneFocus?.tableId);
  const sceneShowcase = sceneFocus ? SCENE_SHOWCASES[sceneFocus.place] : null;
  const SceneShowcaseIcon = sceneShowcase?.icon || Eye;

  return (
    <main className={'cafe-world-page cafe-world-3d' + (location.state?.fromLandingRide ? ' is-riding-in' : '')}>
      <CafeScene tables={tables} orders={orders} onSelectTable={handleSceneTableClick} onSelectStation={openStationPopup} onSelectSceneFeature={beginSceneShowcase} onSceneFocusStage={handleSceneFocusStage} sceneFocus={sceneFocus} onGuestCompleted={completeGuestOrder} kitchenFocusOrder={kitchenViewOrder} onKitchenCameraStage={handleKitchenCameraStage} />
      {location.state?.fromLandingRide && <div className="cafe-arrival-clouds" aria-hidden="true"><span className="cafe-arrival-cloud cafe-arrival-cloud-left" /><span className="cafe-arrival-cloud cafe-arrival-cloud-right" /></div>}
      {/* Visible shortcuts: the scene is discoverable by clicking, but nobody should have to guess
          how to get out of it or where the staff side lives. */}
      <div className="cafe-quick-actions" role="group" aria-label="Café room shortcuts">
        <Link className="cafe-quick-link" to="/">
          <ArrowLeft size={15} />
          <span>Home</span>
        </Link>
        <button type="button" onClick={() => openStationPopup('kitchen')}>
          <ShoppingBag size={15} />
          <span>Kitchen queue</span>
          {visibleOrders.length > 0 && <b>{visibleOrders.length}</b>}
        </button>
        <button type="button" onClick={() => setHelpOpen(true)}>
          <HelpCircle size={15} />
          <span>How it works</span>
        </button>
        {isAuthenticated ? <>
          <Link className="cafe-quick-link" to={staffHome}>
            <LayoutDashboard size={15} />
            <span>{staffLabel}</span>
          </Link>
          <button type="button" onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </> : <Link className="cafe-quick-link" to="/admin/login">
          <LogIn size={15} />
          <span>Staff sign in</span>
        </Link>}
        <span className="cafe-quick-hint">Click a table to seat or order · keys 1–6</span>
      </div>
      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="How this café room works" maxWidth="max-w-md">
        <ul className="cafe-help-list">
          <li><strong>Seat a guest or take an order.</strong><span>Click any table — or press keys 1–6 — then choose “Watch animation” or “Order food”.</span></li>
          <li><strong>Look around.</strong><span>Click the kitchen, the counter, a table or the garden to watch that part of the café.</span></li>
          <li><strong>Work the queue.</strong><span>New orders ring the bell at the corner. Open “Kitchen queue” to accept, cook and finish them.</span></li>
          <li><strong>Two kinds of visitors.</strong><span>Guests order from their table with no sign-in. Staff sign in for the counter console or the kitchen board.</span></li>
        </ul>
        <p className="cafe-help-foot">Nothing here changes a real order unless you are signed in as staff.</p>
      </Modal>
      {selectedTableForAction && <aside className="cafe-table-choice" role="dialog" aria-label={`${selectedTableName} options`}>
        <button type="button" className="cafe-table-choice-close" aria-label="Close table options" onClick={() => setSelectedTableForAction(null)}><X size={16} /></button>
        <small>{selectedTableIsReserved ? 'RESERVED SEAT' : 'YOUR TABLE'}</small>
        <h2>{selectedTableName}</h2>
        <p>{selectedTableIsReserved ? 'This table is reserved for its seated guests.' : 'What would you like to do?'}</p>
        <div className={`cafe-table-choice-actions ${selectedTableIsReserved ? 'is-reserved' : ''}`}>
          <button type="button" onClick={() => beginSceneShowcase('table', selectedTableForAction)}><Eye size={16} /><span><strong>Watch animation</strong><small>A guest sits and eats</small></span></button>
          {!selectedTableIsReserved && <button type="button" onClick={() => openTable(selectedTableForAction)}><Coffee size={16} /><span><strong>Order food</strong><small>Browse the cafe menu</small></span></button>}
        </div>
      </aside>}
      {sceneFocus && sceneShowcase && <aside className={`cafe-scene-showcase ${sceneFocusStage === 'travelling' ? 'is-travelling' : ''} ${sceneFocus.place === 'table' ? 'is-table-showcase' : ''}`} role="status" aria-live="polite">
        <span className="cafe-scene-showcase-icon"><SceneShowcaseIcon size={18} /></span>
        <div><small>{sceneFocusStage === 'travelling' ? 'Moving through the cafe' : 'Happening in the cafe'}</small><strong>{sceneFocus.place === 'table' ? (focusedTable?.displayName || focusedTable?.tableId || sceneShowcase.title) : sceneShowcase.title}</strong><span>{sceneShowcase.caption}</span>{sceneFocusStage === 'focused' && <i className="cafe-scene-showcase-progress" />}</div>
        <button type="button" aria-label="Close animation" onClick={closeSceneShowcase}><X size={16} /></button>
      </aside>}
      {incomingOrder && <aside className="cafe-order-arrival" role="status" aria-live="assertive">
        <span className="cafe-arrival-bell"><BellRing size={19} /></span>
        <div className="cafe-arrival-copy"><small>New order · just arrived</small><strong>{orderName(incomingOrder)}</strong><span>{orderTableLabel(incomingOrder)} · {orderItems(incomingOrder) || 'New table order'}</span></div>
        <button type="button" className="cafe-arrival-open" onClick={() => { setOrderFilter('new'); setStationPopup('pickup'); setIncomingOrder(null); window.clearTimeout(incomingOrderTimer.current); }}>Open board <ArrowRight size={14} /></button>
        <button type="button" className="cafe-arrival-dismiss" aria-label="Dismiss new order notification" onClick={() => { setIncomingOrder(null); window.clearTimeout(incomingOrderTimer.current); }}><X size={16} /></button>
      </aside>}
      {stationPopup && <div className="cafe-popover-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStationPopup(null); }}>
        <section className={`cafe-station-popover ${stationPopup === 'menu' ? 'menu-popover' : 'service-popover'}`} role="dialog" aria-modal="true" aria-labelledby="station-popup-title">
          <header><span className="station-icon kitchen">{stationPopup === 'kitchen' ? <ChefHat size={17} /> : stationPopup === 'menu' ? <Coffee size={17} /> : stationPopup === 'reservation' ? <CalendarDays size={17} /> : <ShoppingBag size={17} />}</span><div><h2 id="station-popup-title">{stationPopup === 'menu' ? 'Order at your table' : stationPopup === 'reservation' ? 'Reserved table' : 'Kitchen queue'}</h2></div><button type="button" aria-label="Close café window" onClick={() => setStationPopup(null)}><X size={18} /></button></header>
          {stationPopup === 'menu' ? <iframe className="cafe-menu-frame" title="Little Window Café table menu" src={`/table/${menuToken}`} /> : stationPopup === 'reservation' ? <div className="reservation-notice"><span><CalendarDays size={19} /></span><h3>{reservedTable?.displayName || reservedTable?.tableId}</h3><p>This table is reserved for a future visit. Choose another table to order.</p>{reservedTable?.reservation?.startsAt && <small>{new Date(reservedTable.reservation.startsAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>}<button type="button" onClick={() => setStationPopup(null)}>Choose another table</button></div> : <div className="order-panel-content">
            <div className="order-filter-bar" role="tablist" aria-label="Filter orders by status">
              {[['all', 'All'], ['new', 'New'], ['preparing', 'Cooking'], ['ready', 'Ready']].map(([filter, label]) => <button type="button" role="tab" aria-selected={orderFilter === filter} className={orderFilter === filter ? 'is-active' : ''} onClick={() => setOrderFilter(filter)} key={filter}>{label}<span>{orderCounts[filter]}</span></button>)}
            </div>
            {orderActionError && <p className="station-action-error" role="alert">{orderActionError}</p>}
            <div className="station-order-list">
              {filteredOrders.length ? filteredOrders.map((order) => <article className={`station-order-card ${order.preparationStatus === 'preparing' ? 'is-cooking' : ''} ${order.preparationStatus === 'ready' ? 'is-ready' : ''}`} key={order._id}>
                <div className="station-order-meta"><strong>{orderName(order)}{orderTableLabel(order) ? ` · ${orderTableLabel(order)}` : ''}</strong><span>{order.preparationStatus === 'preparing' ? 'Cooking' : order.preparationStatus === 'ready' ? 'Ready' : order.preparationStatus === 'accepted' ? 'Accepted' : 'New'}</span></div>
                <p>{orderItems(order) || 'Freshly prepared café order'}</p>
                {(order.preparationStatus === 'new' || order.preparationStatus === 'accepted') && <button type="button" disabled={updatingOrder === order._id || pendingOrders.includes(order._id)} onClick={() => startPreparation(order)}>{updatingOrder === order._id ? 'Accepting…' : pendingOrders.includes(order._id) ? 'Starting…' : order.preparationStatus === 'accepted' ? 'Start preparing' : 'Accept & prepare'}</button>}
                {order.preparationStatus === 'preparing' && <><small className="guest-pickup-note">{getPreparationAction(order)} · food is being prepared</small><div className="cooking-progress" aria-label="Food preparation in progress"><i style={{ width: `${Math.min(100, Math.max(3, ((now - (Date.parse(order.preparingAt) || now)) / getPreparationTime(order)) * 100))}%` }} /></div></>}
                {order.preparationStatus === 'ready' && <small className="guest-pickup-note">Placed on the counter · {orderTableLabel(order)} will collect it</small>}
              </article>) : <div className="station-empty"><span>✓</span><strong>{orderFilter === 'all' ? 'All caught up' : `No ${orderFilter === 'new' ? 'new' : orderFilter} orders`}</strong><small>New table orders will appear here as they arrive.</small></div>}
            </div>
          </div>}
        </section>
      </div>}
      {kitchenFocusOrder && kitchenCameraMode.startsWith('travelling-') && <aside className={'kitchen-focus-transition ' + (kitchenCameraMode === 'travelling-to-counter' ? 'is-counter-trip' : '')} role="status" aria-live="polite">
        <span className="kitchen-focus-transition-icon"><ChefHat size={18} /></span>
        <div><small>{kitchenCameraMode === 'travelling-to-counter' ? 'Plating complete · moving to the pass' : 'Ticket accepted · kitchen camera moving'}</small><strong>{kitchenCameraMode === 'travelling-to-counter' ? 'Following the dish to pickup.' : 'Heading into the kitchen.'}</strong><span>{orderName(kitchenViewOrder)} · {mainKitchenItem.name || 'Your order'}</span><i className="kitchen-focus-travel-bar" /></div>
        <button type="button" onClick={() => { setKitchenFocusOrder(null); setKitchenCameraMode('returning'); }} aria-label="Cancel kitchen camera view"><X size={16} /></button>
      </aside>}
      {kitchenFocusOrder && (kitchenCameraMode === 'kitchen' || kitchenCameraMode === 'counter') && <aside className={'kitchen-focus-hud ' + (kitchenCameraMode === 'counter' ? 'is-ready' : '')} aria-live="polite">
        <header><span><ChefHat size={16} /></span><div><small>{kitchenCameraMode === 'counter' ? 'PICKUP COUNTER · READY' : 'BACK KITCHEN · LIVE VIEW'}</small><strong>{orderName(kitchenViewOrder)} · {orderTableLabel(kitchenViewOrder)}</strong></div><button type="button" onClick={() => { setKitchenFocusOrder(null); setKitchenCameraMode('returning'); }} aria-label="Return to full café view"><X size={16} /></button></header>
        <div className={'kitchen-focus-food ' + (kitchenFoodImage ? 'has-photo ' : '') + (kitchenCameraMode === 'counter' ? 'is-plated' : 'is-cooking')} style={{ backgroundImage: kitchenFoodImage ? `url("${kitchenFoodImage}")` : undefined, backgroundPosition: kitchenFoodImage ? 'center' : getFoodSheetPosition(mainKitchenItem) }} role="img" aria-label={`${mainKitchenItem.name || 'Ordered dish'} ${kitchenCameraMode === 'counter' ? 'plated and ready' : 'cooking in the back kitchen'}`}>
          {kitchenCameraMode === 'counter' ? <div className="kitchen-focus-ready-plate"><span /><i /><b>READY</b></div> : <div className={'kitchen-pov-action-art is-' + kitchenVisualType} aria-hidden="true"><span className="kitchen-steam"><i /><i /><i /></span><span className="kitchen-pan"><i /><b /><b /><b /></span><span className="kitchen-cup"><i /><b /></span><span className="kitchen-oven-tray"><i /><i /><i /></span><span className="kitchen-flame" /></div>}
          <span className="kitchen-focus-live"><i />{kitchenCameraMode === 'counter' ? 'ON THE COUNTER' : getPreparationAction(kitchenViewOrder)}</span>
        </div>
        <div className="kitchen-focus-details"><div><small>{mainKitchenItem.quantity || 1}× ORDERED DISH</small><strong>{mainKitchenItem.name || 'Fresh café order'}</strong>{(kitchenViewOrder.items || []).length > 1 && <span>+ {(kitchenViewOrder.items || []).length - 1} more items</span>}</div><span className="kitchen-focus-stage-icon">{kitchenCameraMode === 'counter' ? <BellRing size={17} /> : <Flame size={17} />}</span></div>
        <div className="kitchen-focus-progress"><span><i style={{ width: `${kitchenCameraMode === 'counter' ? 100 : kitchenProgress}%` }} /></span><small>{kitchenCameraMode === 'counter' ? `${orderTableLabel(kitchenViewOrder)} can collect from the counter.` : `Cooking fresh · ${Math.round(kitchenProgress)}% complete`}</small></div>
      </aside>}
    </main>
  );
};

export default CafePage;
