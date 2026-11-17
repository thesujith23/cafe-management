import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { orderApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import { getMinutesElapsed, formatTimeOnly } from '../utils/formatters';
import { sounds } from '../utils/sound';
import {
  ChefHat,
  Clock,
  ArrowLeft,
  CheckCircle2,
  BellRing,
  Volume2,
  VolumeX,
  RefreshCw,
  Flame,
  Check,
  RotateCcw,
} from 'lucide-react';
import ShinyText from '../components/animations/ShinyText';
import CreativeButton from '../components/animations/CreativeButton';
import TiltedCard from '../components/animations/TiltedCard';

const COLUMNS = [
  {
    id: 'new',
    title: 'New & Accepted',
    color: 'border-space_indigo-400 bg-space_indigo/10 text-space_indigo-700',
    headerBg: 'bg-gradient-to-r from-space_indigo to-space_indigo-600',
    badge: 'bg-space_indigo-100/60 text-space_indigo-800 border border-space_indigo-400',
  },
  {
    id: 'preparing',
    title: 'In Preparation',
    color: 'border-dusty_mauve-400 bg-dusty_mauve/10 text-dusty_mauve-700',
    headerBg: 'bg-gradient-to-r from-dusty_mauve to-dusty_mauve-600',
    badge: 'bg-dusty_mauve-100/60 text-dusty_mauve-800 border border-dusty_mauve-400',
  },
  {
    id: 'ready',
    title: 'Ready for Pickup',
    color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100',
    headerBg: 'bg-gradient-to-r from-emerald-700 to-teal-800',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
];

const KitchenKDSPage = () => {
  const navigate = useNavigate();
  const { socket, joinRoom } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch kitchen orders
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
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Socket room and listeners
  useEffect(() => {
    if (!socket) return;

    joinRoom('kitchen');

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      if (audioEnabled) {
        sounds.playNewOrder();
      }
    };

    const handleStatusChanged = (data) => {
      const orderId = data.orderId || data._id;
      const status = data.preparationStatus;
      if (!orderId) return;

      setOrders((prev) => {
        // If completed or cancelled, remove from active kitchen board
        if (status === 'completed' || status === 'served' || status === 'cancelled') {
          return prev.filter((ord) => ord._id !== orderId);
        }
        return prev.map((ord) => {
          if (ord._id === orderId) {
            return {
              ...ord,
              preparationStatus: status,
            };
          }
          return ord;
        });
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

  // Update order status action
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // Optimistic update
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
    }
  };

  return (
    <div className="pixel-screen pixel-kitchen-screen min-h-screen bg-space_indigo-100 text-slate-100 flex flex-col font-futura selection:bg-dusty_mauve selection:text-white">
      <Navbar />

      {/* KDS Control Header */}
      <div className="bg-space_indigo-200/95 border-b border-space_indigo-400/50 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-space_indigo to-dusty_mauve flex items-center justify-center text-white shadow-lg shadow-space_indigo/30">
            <ChefHat className="w-6 h-6 stroke-2" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-tenez text-white tracking-tight m-0">
              <ShinyText text="Kitchen Display Station (KDS)" color="#f5e6e8" shineColor="#d5c6e0" speed={3} />
            </h1>
            <p className="text-xs text-thistle-500 font-aleo mt-0.5">
              Live Cooking Station • Instant sync with TV Display & Dining Tables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioEnabled((a) => !a)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-aleo border transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-xs'
                : 'bg-space_indigo-300/80 border-space_indigo-400 text-thistle-400'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? 'Sound Active' : 'Sound Muted'}</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-space_indigo-300/80 hover:bg-space_indigo-300 border border-space_indigo-400 text-xs font-semibold font-aleo text-thistle-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-dusty_mauve-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => navigate('/cafe')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-space_indigo-300/80 hover:bg-space_indigo-300 border border-space_indigo-400 text-xs font-semibold font-aleo text-thistle-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Café room</span>
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">
        {COLUMNS.map((col) => {
          // 'accepted' lives in the same lane as brand-new tickets; without this it fell
          // between the columns and the ticket disappeared from the board.
          const colOrders = orders.filter((o) =>
            col.id === 'new'
              ? o.preparationStatus === 'new' || o.preparationStatus === 'accepted'
              : o.preparationStatus === col.id
          );

          return (
            <div
              key={col.id}
              className="flex flex-col bg-space_indigo-200/90 rounded-3xl border border-space_indigo-400 overflow-hidden shadow-xl"
            >
              {/* Column Header */}
              <div
                className={`p-4 ${col.headerBg} text-white flex items-center justify-between font-bold text-sm shadow-xs`}
              >
                <span className="font-tenez text-base tracking-wide">{col.title}</span>
                <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs text-xs flex items-center justify-center font-extrabold font-futura">
                  {colOrders.length}
                </span>
              </div>

              {/* Column Orders List */}
              <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-210px)]">
                {colOrders.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-xs text-thistle-500 italic font-aleo">
                    <span>No orders in this stage</span>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const elapsed = getMinutesElapsed(order.createdAt);
                    const isUrgent = elapsed >= (order.estimatedPrepTime || 15);

                    return (
                      <TiltedCard
                        key={order._id}
                        maxRotation={5}
                        scale={1.01}
                        glare={true}
                        spotlightColor="rgba(213, 198, 224, 0.25)"
                      >
                        <div
                          className={`kitchen-ticket ${col.id === 'preparing' ? 'is-cooking' : col.id === 'ready' ? 'is-ready-ticket' : 'is-new-ticket'} bg-space_indigo-100/90 rounded-2xl border p-4 transition-all shadow-md ${
                            isUrgent
                              ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                              : 'border-space_indigo-400 hover:border-dusty_mauve'
                          }`}
                        >
                        {/* Top meta */}
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-space_indigo-400/50">
                          <div>
                            <span className="text-sm font-extrabold text-white font-futura tracking-tight">
                              {order.orderNumber}
                            </span>
                            <div className="text-xs font-bold font-aleo text-dusty_mauve-600 mt-0.5">
                              {order.table?.displayName || `Table ${order.tableId}`}
                            </div>
                          </div>

                          <div className="text-right">
                            <div
                              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg font-futura ${
                                isUrgent
                                  ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30'
                                  : 'bg-space_indigo-300 text-thistle-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{elapsed}m ago</span>
                            </div>
                            <span className="text-[10px] text-thistle-500 font-aleo block mt-0.5">
                              {formatTimeOnly(order.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="py-3 space-y-2.5">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="text-xs bg-space_indigo-200/80 p-2.5 rounded-xl border border-space_indigo-400/50">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {/* Veg / Non-Veg Indicator */}
                                  <span
                                    className={`w-3.5 h-3.5 mt-0.5 rounded-xs border flex items-center justify-center shrink-0 ${
                                      item.isVeg !== false
                                        ? 'border-emerald-500 bg-emerald-950/40'
                                        : 'border-rose-500 bg-rose-950/40'
                                    }`}
                                    title={item.isVeg !== false ? 'Vegetarian' : 'Non-Vegetarian'}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        item.isVeg !== false ? 'bg-emerald-400' : 'bg-rose-500'
                                      }`}
                                    />
                                  </span>

                                  <span className="font-extrabold text-dusty_mauve-600 font-mono text-sm shrink-0">
                                    {item.quantity}x
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-slate-100 font-aleo block truncate">{item.name}</span>
                                    {item.selectedSize?.name && (
                                      <span className="text-[10px] text-thistle-500 font-aleo block mt-0.5">
                                        Portion: {item.selectedSize.name}
                                      </span>
                                    )}
                                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                                      <span className="text-[10px] text-thistle-300 font-aleo block mt-0.5">
                                        + {item.selectedAddons.map((a) => a.name).join(', ')}
                                      </span>
                                    )}
                                    {item.specialInstructions && (
                                      <span className="text-[11px] text-dusty_mauve-600 font-semibold block italic mt-0.5 bg-dusty_mauve/15 px-1.5 py-0.5 rounded border border-dusty_mauve/30">
                                        Note: {item.specialInstructions}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Individual Prep Time */}
                                <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-dusty_mauve/20 text-dusty_mauve-600 border border-dusty_mauve/30">
                                  ⏱️ {item.prepTime || 15}m
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Customer Notes */}
                        {order.customerNotes && (
                          <div className="p-2.5 mb-3 rounded-xl bg-dusty_mauve/15 border border-dusty_mauve/30 text-[11px] text-thistle-200 font-aleo">
                            <strong className="text-white">Table Note:</strong> {order.customerNotes}
                          </div>
                        )}

                        {/* Action buttons with CreativeButton */}
                        <div className="pt-2 border-t border-space_indigo-400/50 flex items-center gap-2">
                          {col.id === 'new' && (
                            <CreativeButton
                              onClick={() => handleUpdateStatus(order._id, 'preparing')}
                              variant="primary"
                              size="md"
                              magnetic={true}
                              spark={true}
                              sparkColor="#967aa1"
                              icon={Flame}
                              iconPosition="left"
                              className="w-full shadow-md shadow-space_indigo/30"
                            >
                              Start Cooking
                            </CreativeButton>
                          )}

                          {col.id === 'preparing' && (
                            <CreativeButton
                              onClick={() => handleUpdateStatus(order._id, 'ready')}
                              variant="success"
                              size="md"
                              magnetic={true}
                              spark={true}
                              sparkColor="#10b981"
                              icon={BellRing}
                              iconPosition="left"
                              className="w-full shadow-md shadow-emerald-600/30"
                            >
                              Mark as Ready
                            </CreativeButton>
                          )}

                          {col.id === 'ready' && (
                            <CreativeButton
                              onClick={() => handleUpdateStatus(order._id, 'served')}
                              variant="secondary"
                              size="md"
                              magnetic={true}
                              spark={true}
                              sparkColor="#d5c6e0"
                              icon={Check}
                              iconPosition="left"
                              className="w-full bg-space_indigo-300 hover:bg-space_indigo-400 text-white border-space_indigo-400"
                            >
                              Mark Served
                            </CreativeButton>
                          )}
                        </div>
                      </div>
                    </TiltedCard>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KitchenKDSPage;
