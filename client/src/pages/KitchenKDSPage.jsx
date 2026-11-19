import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMinutesElapsed, formatTimeOnly } from '../utils/formatters';
import { sounds } from '../utils/sound';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  BellRing,
  Volume2,
  VolumeX,
  RefreshCw,
  Flame,
  Check,
  ArrowLeft,
  ClipboardList,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react';
import '../styles/kitchen.css';

const COLUMNS = [
  {
    id: 'confirmed',
    title: 'Confirmed',
    hint: 'At the pass · start when ready',
    icon: ClipboardList,
    action: 'Start cooking',
    next: 'preparing',
    empty: 'No tickets waiting',
  },
  {
    id: 'preparing',
    title: 'In preparation',
    hint: 'On the stove',
    icon: Flame,
    action: 'Mark ready',
    next: 'ready',
    empty: 'Nothing on the stove',
  },
  {
    id: 'ready',
    title: 'Ready to serve',
    hint: 'Pick up and run it out',
    icon: BellRing,
    action: 'Mark served',
    next: 'served',
    empty: 'The pass is clear',
  },
];

const KitchenKDSPage = () => {
  const { socket, joinRoom, leaveRoom, isConnected } = useSocket();
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await orderApi.getKitchenOrders();
      const ordersList = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.orders || res?.orders || []);
      setOrders(ordersList);
    } catch {
      // The board keeps the last good list if a refresh fails.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // The clock in the header and the "minutes on ticket" both tick from this.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    joinRoom('kitchen');

    const handleNewOrder = (newOrder) => {
      // A paid ticket reaches the kitchen only after the counter confirms it.
      if (!['confirmed', 'accepted', 'preparing', 'ready'].includes(newOrder?.preparationStatus)) return;
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      if (audioEnabled) sounds.playNewOrder();
    };

    const handleStatusChanged = (data) => {
      const orderId = data.orderId || data._id;
      const status = data.preparationStatus;
      if (!orderId) return;

      setOrders((prev) => {
        if (status === 'completed' || status === 'served' || status === 'cancelled') {
          return prev.filter((ord) => ord._id !== orderId);
        }
        if (status === 'new' || status === 'waiting_payment') {
          return prev.filter((ord) => ord._id !== orderId);
        }
        return prev.map((ord) => (ord._id === orderId ? { ...ord, preparationStatus: status } : ord));
      });
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusChanged);
    socket.on('order:status:changed', handleStatusChanged);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusChanged);
      socket.off('order:status:changed', handleStatusChanged);
    };
  }, [socket, joinRoom, audioEnabled]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setBusyOrderId(orderId);
      setOrders((prev) => {
        if (newStatus === 'served' || newStatus === 'completed') {
          return prev.filter((o) => o._id !== orderId);
        }
        return prev.map((o) => (o._id === orderId ? { ...o, preparationStatus: newStatus } : o));
      });

      await orderApi.updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      loadOrders(true);
    } finally {
      setBusyOrderId(null);
    }
  };

  const laneOrders = (id) => orders.filter((o) => (
    id === 'confirmed'
      ? o.preparationStatus === 'confirmed' || o.preparationStatus === 'accepted'
      : o.preparationStatus === id
  ));

  const counts = {
    confirmed: laneOrders('confirmed').length,
    preparing: laneOrders('preparing').length,
    ready: laneOrders('ready').length,
  };
  const totalActive = counts.confirmed + counts.preparing + counts.ready;

  return (
    <div className="kds-screen">
      <header className="kds-header">
        <div className="kds-brand">
          <span className="kds-brand-mark"><ChefHat aria-hidden="true" /></span>
          <div className="kds-brand-text">
            <strong>Kitchen display</strong>
            <small>
              <i className={'kds-live-dot' + (isConnected ? ' is-online' : '')} aria-hidden="true" />
              {isConnected ? 'Service live' : 'Reconnecting'}
            </small>
          </div>
        </div>

        <div className="kds-stats" aria-label="Live ticket counts">
          <div className={'kds-stat is-coral' + (counts.confirmed ? ' is-alert' : '')}>
            <ClipboardList aria-hidden="true" />
            <b>{counts.confirmed}</b>
            <span>Confirmed</span>
          </div>
          <div className="kds-stat">
            <Flame aria-hidden="true" />
            <b>{counts.preparing}</b>
            <span>Cooking</span>
          </div>
          <div className="kds-stat is-ready">
            <BellRing aria-hidden="true" />
            <b>{counts.ready}</b>
            <span>Ready</span>
          </div>
        </div>

        <div className="kds-clock">
          <Clock aria-hidden="true" />
          <span>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {totalActive} {totalActive === 1 ? 'ticket' : 'tickets'} on the line
          </span>
        </div>

        <div className="kds-actions">
          <button
            type="button"
            className={'kds-btn ' + (audioEnabled ? 'is-live' : 'is-muted')}
            onClick={() => setAudioEnabled((a) => !a)}
            aria-pressed={audioEnabled}
            title={audioEnabled ? 'Mute the new-ticket chime' : 'Unmute the new-ticket chime'}
          >
            {audioEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
            <span>{audioEnabled ? 'Chime on' : 'Muted'}</span>
          </button>

          <button
            type="button"
            className={'kds-btn' + (refreshing ? ' is-busy' : '')}
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            title="Refresh the board"
          >
            <RefreshCw aria-hidden="true" />
            <span>Sync</span>
          </button>

          <Link to="/cafe" className="kds-btn" title="Back to the café room">
            <ArrowLeft aria-hidden="true" />
            <span>Café floor</span>
          </Link>

          {/* Leave the kitchen room first: the socket stays authenticated until the
              session ends, and a signed-out board must not keep live tickets. */}
          <button
            type="button"
            className="kds-btn is-exit"
            onClick={() => {
              leaveRoom('kitchen');
              logout();
            }}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="kds-loading" role="status" aria-live="polite">
          <UtensilsCrossed aria-hidden="true" />
          <span>Setting the pass…</span>
        </div>
      ) : (
        <div className="kds-board">
          {COLUMNS.map((col, colIndex) => {
            const list = laneOrders(col.id);
            const ColumnIcon = col.icon;

            return (
              <section key={col.id} className={`kds-column is-${col.id}`} aria-label={col.title}>
                <div className="kds-column-head">
                  <span className="kds-column-icon"><ColumnIcon aria-hidden="true" /></span>
                  <div>
                    <h2>{col.title}</h2>
                    <p>{col.hint}</p>
                  </div>
                  <span className="kds-count">{list.length}</span>
                </div>

                <div className="kds-column-body">
                  {list.length === 0 ? (
                    <div className="kds-empty">
                      {col.id === 'ready' ? <CheckCircle2 aria-hidden="true" /> : <ColumnIcon aria-hidden="true" />}
                      <strong>{col.empty}</strong>
                      <span>
                        {col.id === 'confirmed' && 'Confirmed tickets land here after the counter checks them.'}
                        {col.id === 'preparing' && 'Start a ticket and it moves onto the stove.'}
                        {col.id === 'ready' && 'Plated tickets wait here for the counter to run them out.'}
                      </span>
                    </div>
                  ) : (
                    list.map((order, index) => {
                      const elapsed = getMinutesElapsed(order.createdAt);
                      const isLate = elapsed >= (order.estimatedPrepTime || 15);
                      const tableName = order.table?.displayName
                        || (order.table?.tableId ? `Table ${order.table.tableId}` : 'Walk-in');
                      const busy = busyOrderId === order._id;

                      return (
                        <article
                          key={order._id}
                          className={'kds-ticket' + (isLate ? ' is-late' : '')}
                          style={{ animationDelay: `${Math.min(index, 4) * 45}ms` }}
                        >
                          <div className="kds-ticket-top">
                            <div>
                              <span className="kds-table">{tableName}</span>
                              <span className="kds-order">
                                {order.orderNumber}
                                <span className="kds-order-dot" aria-hidden="true" />
                                {formatTimeOnly(order.createdAt)}
                                {order.preparationStatus === 'accepted' && (
                                  <>
                                    <span className="kds-order-dot" aria-hidden="true" />
                                    Queued
                                  </>
                                )}
                              </span>
                            </div>
                            <span className={'kds-time' + (isLate ? ' is-late' : '')}>
                              <Clock aria-hidden="true" />
                              {elapsed}m
                            </span>
                          </div>

                          <ul className="kds-items">
                            {order.items?.map((item, itemIndex) => (
                              <li key={`${order._id}-${itemIndex}`}>
                                <span className="kds-qty">{item.quantity}×</span>
                                <span className="kds-item-name">{item.name}</span>
                                {item.selectedSize?.name && (
                                  <span className="kds-item-detail">Portion · {item.selectedSize.name}</span>
                                )}
                                {item.selectedAddons?.length > 0 && (
                                  <span className="kds-item-detail">
                                    + {item.selectedAddons.map((addon) => addon.name).join(', ')}
                                  </span>
                                )}
                                {item.specialInstructions && (
                                  <em className="kds-item-note">Note: {item.specialInstructions}</em>
                                )}
                              </li>
                            ))}
                          </ul>

                          {order.customerNotes && (
                            <p className="kds-table-note">
                              <strong>Table note:</strong> {order.customerNotes}
                            </p>
                          )}

                          <button
                            type="button"
                            className="kds-action"
                            onClick={() => handleUpdateStatus(order._id, col.next)}
                            disabled={busy}
                          >
                            {col.id === 'confirmed' && <Flame aria-hidden="true" />}
                            {col.id === 'preparing' && <BellRing aria-hidden="true" />}
                            {col.id === 'ready' && <Check aria-hidden="true" />}
                            {busy ? 'Updating…' : col.action}
                          </button>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenKDSPage;
