import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { orderApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import { formatINR, formatDateTime, formatTimeOnly, formatDuration } from '../utils/formatters';
import { sounds } from '../utils/sound';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  XCircle,
  Store,
  Coffee,
} from 'lucide-react';
import '../styles/customer-order.css';

const STEPS = [
  { key: 'new', label: 'Received', icon: ShoppingBag },
  { key: 'accepted', label: 'Accepted', icon: ClipboardCheck },
  { key: 'preparing', label: 'Cooking', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: BellRing },
  { key: 'served', label: 'Enjoy', icon: CheckCircle2 },
];

const OrderStatusPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('orderId');

  const { socket, joinRoom } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(0);
  const [loadError, setLoadError] = useState('');

  // Cancellation: one confirm dialog for the minutes we allow, one line of text otherwise.
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null);
  const [cancelNotice, setCancelNotice] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Ready-for-pickup alerts. The system-notification permission is only requested when
  // the guest taps the bell, never on load, so a first visit stays quiet.
  const [alertsPermission, setAlertsPermission] = useState(() => (
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  ));
  const [alertsNotice, setAlertsNotice] = useState('');
  const shownNotifications = useRef(new Set());

  // Live second timer for 1-minute countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load orders for this table token
  const fetchOrders = useCallback(async (silent = false, quiet = false) => {
    try {
      if (!silent) setLoading(true);
      else if (!quiet) setRefreshing(true);
      setLoadError('');

      const res = await orderApi.getOrdersByToken(token);
      const ordersList = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.orders || res?.orders || []);
      setOrders(ordersList);
    } catch (error) {
      // A background poll failing must never replace what is already on screen.
      if (!quiet) setLoadError(error.message || 'Order updates are unavailable. Try refreshing.');
    } finally {
      setLoading(false);
      if (!quiet) setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, fetchOrders]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket || !token) return;

    joinRoom(`token:${token}`);

    const handleStatusChanged = (data) => {
      const orderId = data.orderId || data._id;
      const newStatus = data.preparationStatus;

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === orderId) {
            const updated = {
              ...ord,
              preparationStatus: newStatus,
              // The server sends the recalculated progress with the event.
              progress: data.order?.progress || data.progress || ord.progress,
              cancelReason: data.order?.cancelReason || data.cancelReason || ord.cancelReason,
            };
            if (newStatus === 'ready') {
              sounds.playOrderReady();
            }
            return updated;
          }
          return ord;
        })
      );
    };

    const handleOrderPaid = (paidOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === paidOrder._id);
        if (exists) {
          return prev.map((o) => (o._id === paidOrder._id ? paidOrder : o));
        }
        return [paidOrder, ...prev];
      });
    };

    // The server records a notification when the kitchen marks a ticket ready and rings
    // this room. Show it as a system alert if the guest has allowed that.
    const handleNotification = (payload) => {
      if (!payload || payload.type !== 'order_ready') return;
      const key = payload._id || `${payload.orderId}-${payload.createdAt}`;
      if (shownNotifications.current.has(key)) return;
      shownNotifications.current.add(key);

      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      try {
        new Notification(payload.title, {
          body: payload.message,
          tag: `order-${payload.orderId}`,
        });
      } catch {
        // Some browsers refuse constructor notifications without a service worker.
      }
    };

    // A dish came off the line: take the ticket and its progress as the server sent them.
    const handleItemsUpdate = (updatedOrder) => {
      if (!updatedOrder?._id) return;
      setOrders((prev) => prev.map((ord) => (ord._id === updatedOrder._id
        ? { ...ord, items: updatedOrder.items, progress: updatedOrder.progress }
        : ord)));
    };

    socket.on('order:status:changed', handleStatusChanged);
    socket.on('order:statusUpdate', handleStatusChanged);
    socket.on('order:cancelled', handleStatusChanged);
    socket.on('order:items:update', handleItemsUpdate);
    socket.on('order:paid', handleOrderPaid);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('order:status:changed', handleStatusChanged);
      socket.off('order:statusUpdate', handleStatusChanged);
      socket.off('order:cancelled', handleStatusChanged);
      socket.off('order:items:update', handleItemsUpdate);
      socket.off('order:paid', handleOrderPaid);
      socket.off('notification:new', handleNotification);
    };
  }, [socket, token, joinRoom]);

  // Every loaded order gets its own socket room, so the kitchen advancing a ticket
  // reaches this page without a refresh. The server already emits to `order:<id>`.
  const joinedRooms = useRef(new Set());
  useEffect(() => {
    if (!socket) return;
    orders.forEach((order) => {
      if (!order?._id) return;
      const room = `order:${order._id}`;
      if (joinedRooms.current.has(room)) return;
      joinRoom(room);
      joinedRooms.current.add(room);
    });
  }, [orders, socket, joinRoom]);

  // Safety net if the socket drops: a quiet poll that never flashes the UI.
  useEffect(() => {
    if (!token) return undefined;
    const timer = setInterval(() => fetchOrders(true, true), 20000);
    return () => clearInterval(timer);
  }, [token, fetchOrders]);

  // Why a cancellation isn't possible right now — said once, under the order.
  const handleCancelClick = (order) => {
    const elapsedSeconds = Math.floor((now - new Date(order.createdAt).getTime()) / 1000);

    if (order.preparationStatus === 'preparing') {
      setCancelNotice('The kitchen has started cooking, so online cancellation is closed. The counter can still help.');
      return;
    }

    if (order.preparationStatus === 'ready' || order.preparationStatus === 'completed') {
      setCancelNotice('This order is already cooked — please speak to a team member.');
      return;
    }

    if (elapsedSeconds <= 60) {
      setCancelNotice('');
      setConfirmCancelOrder(order);
      return;
    }

    setCancelNotice(`Online cancellation closes one minute after ordering (this one is ${Math.max(1, Math.floor(elapsedSeconds / 60))} min old). The counter can still help.`);
  };

  // Perform Cancel API call
  const handleConfirmCancel = async () => {
    if (!confirmCancelOrder) return;
    try {
      setCancelling(true);
      // The table token proves this order belongs to the guest holding the QR.
      const res = await orderApi.cancelOrder(
        confirmCancelOrder._id,
        'Cancelled by customer within 1-minute window',
        token
      );

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === confirmCancelOrder._id
              ? { ...o, preparationStatus: 'cancelled', cancelReason: 'Customer cancelled within 1-minute window' }
              : o
          )
        );
        setConfirmCancelOrder(null);
      } else {
        setConfirmCancelOrder(null);
        setCancelNotice(res.message || 'That order could not be cancelled — please ask at the counter.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'That order could not be cancelled.';
      setConfirmCancelOrder(null);
      setCancelNotice(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleAlertsClick = async () => {
    if (alertsPermission === 'unsupported') {
      setAlertsNotice('This browser cannot show system alerts — keep this page open and it will chime.');
      return;
    }
    if (alertsPermission === 'granted') {
      setAlertsNotice('Alerts are already on for this device.');
      return;
    }
    if (alertsPermission === 'denied') {
      setAlertsNotice('Alerts are blocked for this site. Allow notifications in your browser settings to turn them on.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setAlertsPermission(permission);
      setAlertsNotice(permission === 'granted'
        ? 'Alerts on — we will ring when your food is ready at the counter.'
        : 'Alerts stay off — keep this page open and it will still chime when your food is ready.');
    } catch {
      setAlertsNotice('Alerts could not be enabled on this device.');
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'waiting_payment':
        return -1;
      case 'new':
      case 'confirmed':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'completed':
      case 'served':
        return 4;
      default:
        return 0;
    }
  };

  const tableLabel = orders[0]?.table?.displayName || orders[0]?.table?.tableId || 'Your table';

  return (
    <div className="customer-order-page order-status-page">
      <header className="order-header">
        <Link to={'/table/' + token} className="order-brand" aria-label="Back to the Little Window menu">
          <span className="order-brand-mark"><Coffee size={19} /></span>
          <span><strong>Little Window</strong><small>Your order</small></span>
        </Link>
        <div className="order-table-chip"><span>Ordering at</span><strong>{tableLabel}</strong></div>
        <div className="order-header-actions">
          <Link to={'/table/' + token} className="order-back-menu"><ArrowLeft size={15} /><span>Menu</span></Link>
          {alertsPermission !== 'unsupported' && (
            <button
              type="button"
              className="order-refresh-button"
              onClick={handleAlertsClick}
              aria-pressed={alertsPermission === 'granted'}
              aria-label="Turn on pickup alerts"
            >
              <BellRing size={15} />
              <span>{alertsPermission === 'granted' ? 'Alerts on' : alertsPermission === 'denied' ? 'Alerts blocked' : 'Enable alerts'}</span>
            </button>
          )}
          <button type="button" className="order-refresh-button" onClick={() => fetchOrders(true)} disabled={refreshing} aria-label="Refresh order status"><RefreshCw size={15} className={refreshing ? 'is-spinning' : ''} /><span>Refresh</span></button>
        </div>
      </header>

      <main className="order-status-main">
        {loadError && <div className="order-load-error" role="alert"><AlertCircle size={16} /><span>{loadError}</span><button type="button" onClick={() => fetchOrders(true)}>Try again</button></div>}
        {alertsNotice && <p className="order-cancel-note" role="status">{alertsNotice}</p>}

        {loading ? (
          <div className="order-state-screen order-inline-state"><LoaderCircle className="order-spinner" /><p>Loading your orders…</p></div>
        ) : orders.length === 0 ? (
          <section className="order-status-empty">
            <span><ShoppingBag size={22} /></span>
            <h2>No orders yet</h2>
            <p>Choose something from the menu and we’ll follow it from kitchen to counter.</p>
            <Link to={'/table/' + token}>Browse the menu <ArrowRight size={15} /></Link>
          </section>
        ) : (
          <section className="order-status-list" aria-label="Your live orders">
            {orders.map((order) => {
              const progress = order.progress || null;
              const percent = Math.max(0, Math.min(100, progress?.percent ?? 0));
              // The rail mirrors the server's stages: received, accepted, cooking, ready, enjoyed.
              const stageIndex = getStepIndex(progress?.stage || order.preparationStatus);
              const awaitingPayment = order.preparationStatus === 'waiting_payment';
              const isReady = order.preparationStatus === 'ready';
              const isCancelled = order.preparationStatus === 'cancelled';
              const isCompleted = order.preparationStatus === 'completed' || order.preparationStatus === 'served';
              const elapsedSeconds = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 1000));
              const remainingCancelSeconds = Math.max(0, 60 - elapsedSeconds);
              const canCancelOnline = !isCancelled && !isCompleted && order.preparationStatus !== 'preparing' && !isReady && remainingCancelSeconds > 0;
              const pillLabel = progress?.label || (isCancelled ? 'Cancelled' : isCompleted ? 'Served' : 'Received');
              const isLate = Boolean(progress?.isLate) && !isCompleted && !isCancelled;
              const stageElapsed = progress?.stageElapsedMs ?? Math.max(0, now - new Date(order.createdAt).getTime());
              const stageText = isCompleted
                ? 'Served — thanks for visiting'
                : `${pillLabel} · ${formatDuration(stageElapsed)}`;
              const etaText = isCompleted
                ? `Completed ${formatTimeOnly(order.completedAt || order.updatedAt || order.createdAt)}`
                : isLate
                  ? 'A few minutes behind — the kitchen knows'
                  : progress?.etaAt
                    ? `Ready around ${formatTimeOnly(progress.etaAt)}`
                    : '';

              return (
                <article className={'order-live-card ' + (isReady ? 'is-ready ' : '') + (isCancelled ? 'is-cancelled ' : '') + (highlightOrderId === order._id ? 'is-highlighted' : '')} key={order._id}>
                  {isReady && <div className="order-ready-banner"><BellRing size={16} /><strong>Ready at the counter</strong><span>Please collect your food{order.readyAt ? ` · ready at ${formatTimeOnly(order.readyAt)}` : ''}</span></div>}
                  {isCancelled && <div className="order-cancelled-banner"><XCircle size={16} /><strong>Order cancelled</strong><span>{order.cancelReason || 'Cancelled by customer'}</span></div>}
                  <div className="order-live-card-head">
                    <div><span className="order-ticket-label">Order</span><h2>{order.orderNumber || ('#' + String(order._id).slice(-5))}</h2><small>Placed {formatDateTime(order.createdAt)}</small></div>
                    <div className="order-live-total"><span className={'order-status-pill ' + (isReady ? 'is-ready' : isCancelled ? 'is-cancelled' : isCompleted ? 'is-done' : '')}>{pillLabel}</span><strong>{formatINR(order.totalAmount)}</strong><small>{order.paymentStatus === 'paid' ? 'Paid online' : order.paymentStatus || 'Payment processing'}</small></div>
                  </div>

                  {!isCancelled && (awaitingPayment ? (
                    <p className="order-progress-waiting">Confirming payment — your ticket reaches the kitchen the moment it clears.</p>
                  ) : (
                    <>
                      <div className="order-progress">
                        {STEPS.map((step, index) => {
                          const Icon = step.icon;
                          const complete = index < stageIndex || isCompleted;
                          const current = index === stageIndex && !isCompleted;
                          return <div className={'order-progress-step ' + (complete ? 'is-complete ' : '') + (current ? 'is-current' : '')} key={step.key}>
                            <span className="order-progress-mark"><Icon size={16} /></span><small>{step.label}</small>
                          </div>;
                        })}
                      </div>
                      <div className="order-progress-meter" aria-hidden="true">
                        <i style={{ width: `${Math.max(3, percent)}%` }} />
                      </div>
                      {!isReady && (
                        <p className={'order-progress-status' + (isLate ? ' is-late' : '')} role="status" aria-live="polite">
                          <span className="order-progress-stage">{stageText}</span>
                          {etaText && <span className="order-progress-eta">{etaText}</span>}
                        </p>
                      )}
                    </>
                  ))}

                  <div className="order-live-details">
                    <div className="order-live-items-head"><h3>Your food</h3>{order.estimatedPrepTime && order.preparationStatus === 'preparing' && <span><Clock3 size={13} />About {order.estimatedPrepTime} min</span>}</div>
                    <div className="order-live-items">
                      {(order.items || []).map((item, index) => <div className="order-live-item" key={item._id || (item.name + '-' + index)}><span><b>{item.quantity || 1}×</b>{item.name}{item.selectedSize?.name && <small>{item.selectedSize.name}</small>}</span><strong>{formatINR(item.itemTotal || item.price || 0)}</strong></div>)}
                    </div>
                    {order.customerNotes && <p className="order-live-note">Kitchen note: “{order.customerNotes}”</p>}
                    {order.preparationStatus === 'preparing' && <div className="order-cooking-note"><span /><p><strong>The kitchen is on it.</strong> {progress?.itemsDone > 0 ? `${progress.itemsDone} of ${progress.itemsTotal} dishes cooked.` : 'Your food is being prepared fresh.'}</p></div>}
                    {isCompleted && <div className="order-complete-note"><CheckCircle2 size={15} />Enjoy your meal. Thanks for visiting.</div>}
                    {!isCancelled && !isCompleted && <div className="order-live-actions">
                      {canCancelOnline ? <button type="button" className="order-cancel-button" onClick={() => handleCancelClick(order)}><XCircle size={14} />Cancel order · {remainingCancelSeconds}s</button> : <button type="button" className="order-cancel-button is-muted" onClick={() => handleCancelClick(order)}><Store size={14} />Need to cancel?</button>}
                      {order.preparationStatus === 'new' && <span>Paid — waiting for the counter to check your order.</span>}
                      {order.preparationStatus === 'confirmed' && <span>Checked at the counter — your ticket is with the kitchen.</span>}
                      {order.preparationStatus === 'accepted' && <span>The kitchen has accepted your order and will start cooking shortly.</span>}
                    </div>}
                    {!isCancelled && !isCompleted && cancelNotice && (
                      <p className="order-cancel-note">{cancelNotice}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {confirmCancelOrder && <div className="order-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmCancelOrder(null); }}>
        <section className="order-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
          <span className="order-dialog-icon is-warning"><XCircle size={20} /></span><h2 id="cancel-dialog-title">Cancel this order?</h2>
          <p>Only orders under a minute old can be cancelled here. Any payment already taken is refunded.</p>
          <div className="order-dialog-actions"><button type="button" onClick={() => setConfirmCancelOrder(null)}>Keep order</button><button type="button" className="is-danger" onClick={handleConfirmCancel} disabled={cancelling}>{cancelling ? 'Cancelling…' : 'Cancel order'}</button></div>
        </section>
      </div>}
    </div>
  );
};

export default OrderStatusPage;
