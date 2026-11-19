import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import { sounds } from '../utils/sound';
import {
  Coffee,
  Flame,
  BellRing,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Timer,
  CheckCircle2,
  Hourglass,
  ChefHat,
  Utensils,
} from 'lucide-react';
import ShinyText from '../components/animations/ShinyText';
import TiltedCard from '../components/animations/TiltedCard';

const getMinutesElapsed = (time) => {
  if (!time) return 0;
  const diff = Date.now() - new Date(time).getTime();
  return Math.max(0, Math.floor(diff / 60000));
};

const formatTime = (time) => {
  if (!time) return '';
  try {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

const PublicDisplayPage = () => {
  const { socket, joinRoom } = useSocket();
  const [orders, setOrders] = useState({ queued: [], preparing: [], ready: [] });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital clock update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial display orders
  const loadDisplayOrders = async () => {
    try {
      const res = await orderApi.getDisplayOrders();
      if (res.success && res.data) {
        const queued = Array.isArray(res.data.queued)
          ? res.data.queued
          : (res.data.active?.filter((o) => o.preparationStatus === 'new' || o.preparationStatus === 'accepted') || []);

        const preparing = Array.isArray(res.data.preparing)
          ? res.data.preparing
          : (res.data.active?.filter((o) => o.preparationStatus === 'preparing') || []);

        const ready = Array.isArray(res.data.ready)
          ? res.data.ready
          : (res.data.active?.filter((o) => o.preparationStatus === 'ready') || []);

        setOrders({ queued, preparing, ready });
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadDisplayOrders();
    // Auto-sync every 15 seconds to ensure fresh timers
    const interval = setInterval(loadDisplayOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  // Socket room and listeners
  useEffect(() => {
    if (!socket) return;

    joinRoom('display');

    const handleOrderUpdate = (incoming) => {
      const order = incoming?.order || incoming;
      const orderId = order?._id || order?.orderId;
      const status = order?.preparationStatus;
      if (!orderId) return;

      if (status === 'ready' && audioEnabled) {
        sounds.playOrderReady();
      }

      setOrders((prev) => {
        const cleanQueued = (prev.queued || []).filter((o) => (o._id || o.orderId) !== orderId);
        const cleanPreparing = (prev.preparing || []).filter((o) => (o._id || o.orderId) !== orderId);
        const cleanReady = (prev.ready || []).filter((o) => (o._id || o.orderId) !== orderId);

        if (status === 'new' || status === 'accepted') {
          return {
            ...prev,
            queued: [order, ...cleanQueued],
            preparing: cleanPreparing,
            ready: cleanReady,
          };
        } else if (status === 'preparing') {
          return {
            ...prev,
            queued: cleanQueued,
            preparing: [order, ...cleanPreparing],
            ready: cleanReady,
          };
        } else if (status === 'ready') {
          return {
            ...prev,
            queued: cleanQueued,
            preparing: cleanPreparing,
            ready: [order, ...cleanReady],
          };
        } else {
          // completed / served / cancelled -> remove
          return {
            ...prev,
            queued: cleanQueued,
            preparing: cleanPreparing,
            ready: cleanReady,
          };
        }
      });
    };

    socket.on('order:new', (newOrder) => {
      const order = newOrder?.order || newOrder;
      handleOrderUpdate(order);
    });
    socket.on('order:statusUpdate', handleOrderUpdate);
    socket.on('order:status:changed', handleOrderUpdate);
    socket.on('order:ready', handleOrderUpdate);
    socket.on('order:served', ({ orderId }) =>
      handleOrderUpdate({ _id: orderId, preparationStatus: 'completed' })
    );

    return () => {
      socket.off('order:new');
      socket.off('order:statusUpdate');
      socket.off('order:status:changed');
      socket.off('order:ready');
      socket.off('order:served');
    };
  }, [socket, joinRoom, audioEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Combine queued and preparing for kitchen progress view
  const inKitchenOrders = [
    ...(orders.preparing || []),
    ...(orders.queued || []),
  ];

  return (
    <div className="pixel-screen pixel-display-screen min-h-screen bg-space_indigo-100 text-slate-100 flex flex-col font-futura select-none overflow-x-hidden selection:bg-dusty_mauve selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-space_indigo-200/95 backdrop-blur-md border-b border-space_indigo-400/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-space_indigo to-dusty_mauve flex items-center justify-center text-white shadow-lg shadow-space_indigo/30 hover:scale-105 transition-transform"
          >
            <Coffee className="w-7 h-7 stroke-2" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-tenez tracking-tight text-white m-0">
                <ShinyText text="Little Window Café • Pickup Board" color="#ffffff" shineColor="#ffb29e" speed={3} />
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold font-aleo bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs font-semibold text-thistle-500 font-aleo mt-0.5">
              Individual item prep times, cooking timers & table numbers updated in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Active Orders Summary Chips */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold font-aleo">
            <span className="px-3.5 py-1.5 rounded-xl bg-dusty_mauve/15 border border-dusty_mauve/40 text-dusty_mauve-600 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-dusty_mauve-600 animate-pulse" />
              <span>{inKitchenOrders.length} In Kitchen</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>{orders.ready?.length || 0} Ready to Serve</span>
            </span>
          </div>

          {/* Digital Clock */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider text-dusty_mauve-600">
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </div>
            <div className="text-xs text-thistle-500 font-aleo">
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioEnabled((a) => !a)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-space_indigo-300/80 border-space_indigo-400 text-thistle-500'
            }`}
            title={audioEnabled ? 'Sound alerts ON' : 'Sound alerts muted'}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-space_indigo-300/80 border border-space_indigo-400 text-thistle-300 hover:text-white hover:bg-space_indigo-300 transition-colors shadow-2xs cursor-pointer"
            title="Toggle TV Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Split Screen */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-space_indigo-400/50 p-4 sm:p-6 gap-6">
        {/* Left Column: PREPARING & IN KITCHEN */}
        <div className="flex flex-col bg-space_indigo-200/90 rounded-3xl border border-dusty_mauve/40 p-5 sm:p-6 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-space_indigo-400/50">
            <div className="flex items-center gap-3 text-dusty_mauve-600">
              <div className="w-10 h-10 rounded-2xl bg-dusty_mauve/20 border border-dusty_mauve/40 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-pulse text-dusty_mauve-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-tenez tracking-wide m-0 text-thistle-100 flex items-center gap-2">
                  <span>Preparing in Kitchen</span>
                </h2>
                <span className="text-xs font-semibold text-thistle-500 font-aleo">
                  Freshly cooking • Estimated prep times shown below
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-dusty_mauve/20 border border-dusty_mauve/40 text-dusty_mauve-600 font-bold text-xs font-mono">
                {inKitchenOrders.length} active
              </span>
            </div>
          </div>

          <div className="flex-1 pt-4 overflow-y-auto max-h-[calc(100vh-210px)] space-y-4 pr-1">
            {inKitchenOrders.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-thistle-500 font-medium text-sm space-y-3 font-aleo">
                <div className="w-16 h-16 rounded-2xl bg-space_indigo-300/80 border border-space_indigo-400 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-dusty_mauve-600" />
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-bold text-base m-0 font-tenez">All Caught Up!</p>
                  <p className="text-thistle-500 text-xs mt-1">No orders currently cooking. Place an order to see it live.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {inKitchenOrders.map((order) => {
                  const isCooking = order.preparationStatus === 'preparing';
                  const startTime = order.preparingAt || order.createdAt;
                  const elapsed = getMinutesElapsed(startTime);
                  const estTime = order.estimatedPrepTime || 15;
                  const remaining = Math.max(0, estTime - elapsed);
                  const progress = Math.min(100, Math.round((elapsed / estTime) * 100));
                  const totalItemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || order.items?.length || 1;

                  return (
                    <div
                      key={order._id || order.orderId}
                      className={`display-order-ticket ${isCooking ? 'is-cooking' : 'is-queued'} p-4 sm:p-5 rounded-2xl bg-space_indigo-100/90 border transition-all duration-300 flex flex-col justify-between shadow-xl ${
                        isCooking
                          ? 'border-dusty_mauve/60 ring-1 ring-dusty_mauve/30'
                          : 'border-space_indigo-400/80 bg-space_indigo-200/50 ring-1 ring-space_indigo-400/30'
                      }`}
                    >
                      {/* Top Header: Order Number, Table & Status Badge */}
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold font-futura tracking-tight text-dusty_mauve-600">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] font-mono font-medium text-thistle-500">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-aleo">
                            <span className="px-3 py-1 rounded-lg bg-dusty_mauve/20 border border-dusty_mauve/40 text-thistle-100 font-bold text-xs">
                              {order.table?.displayName || (order.tableId ? `Table ${order.tableId}` : 'Dine-In')}
                            </span>
                            {isCooking ? (
                              <span className="px-2.5 py-1 rounded-lg bg-dusty_mauve/20 border border-dusty_mauve/40 text-dusty_mauve-600 font-bold text-[11px] flex items-center gap-1">
                                <Flame className="w-3 h-3 text-dusty_mauve-600 animate-pulse" />
                                <span>Cooking</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-space_indigo-300/80 border border-space_indigo-400 text-thistle-300 font-bold text-[11px] flex items-center gap-1">
                                <Hourglass className="w-3 h-3 text-thistle-400" />
                                <span>Queued</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Overall Prep Timer, Countdown & Progress Bar */}
                        <div className="mb-3.5 bg-space_indigo-200/90 p-3.5 rounded-xl border border-space_indigo-400/50 font-aleo">
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <div className="flex items-center gap-1.5 text-dusty_mauve-600">
                              <Timer className="w-4 h-4 text-dusty_mauve-600" />
                              <span>Est. Total: ~{estTime} mins</span>
                            </div>
                            <div className="font-mono text-slate-300 text-xs">
                              {remaining > 0 ? (
                                <span className="text-emerald-400 font-bold">~{remaining}m remaining</span>
                              ) : (
                                <span className="text-dusty_mauve-600 animate-pulse font-bold">Finishing up...</span>
                              )}
                            </div>
                          </div>

                          {/* Animated Progress Bar */}
                          <div className="w-full bg-space_indigo-300 h-2.5 rounded-full overflow-hidden p-0.5 border border-space_indigo-400/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-space_indigo via-dusty_mauve to-thistle-400 transition-all duration-700 shadow-sm"
                              style={{ width: `${Math.max(5, progress)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-thistle-500 font-mono mt-1.5">
                            <span>Started: {formatTime(startTime)}</span>
                            <span>Elapsed: {elapsed}m ({progress}%)</span>
                          </div>
                        </div>

                        {/* Food Items with Individual Item Prep Times & Details */}
                        <div className="space-y-2 pt-2 border-t border-space_indigo-400/50">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-thistle-500 font-aleo">
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3 h-3 text-dusty_mauve-600" />
                              <span>Items to Prepare</span>
                            </span>
                            <span className="text-dusty_mauve-600 font-mono">Item Prep Time</span>
                          </div>

                          <div className="space-y-1.5">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-space_indigo-300/50 border border-space_indigo-400/40 hover:border-space_indigo-400 transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  {/* Veg / Non-Veg Indicator */}
                                  <span
                                    className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
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

                                  {/* Quantity Badge */}
                                  <span className="font-extrabold text-dusty_mauve-600 font-mono text-sm shrink-0">
                                    {item.quantity}x
                                  </span>

                                  {/* Item Name & Variations */}
                                  <div className="truncate">
                                    <span className="font-bold text-slate-100 truncate block font-aleo">
                                      {item.name}
                                    </span>
                                    {item.selectedSize?.name && (
                                      <span className="text-[10px] text-thistle-500 font-medium font-aleo">
                                        Portion: {item.selectedSize.name}
                                      </span>
                                    )}
                                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                                      <span className="text-[10px] text-thistle-300 font-medium block font-aleo">
                                        + {item.selectedAddons.map((a) => a.name).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Individual Prep Time Badge */}
                                <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dusty_mauve/20 border border-dusty_mauve/30 text-dusty_mauve-600 font-mono font-bold text-xs shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-dusty_mauve-600" />
                                  <span>{item.prepTime || 15}m</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Cooking Notes */}
                        {order.customerNotes && (
                          <div className="mt-2.5 p-2 rounded-xl bg-dusty_mauve/15 border border-dusty_mauve/30 text-xs text-thistle-200 font-aleo">
                            <span className="font-bold text-dusty_mauve-600">Special Instructions:</span>{' '}
                            {order.customerNotes}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom status footer */}
                      <div className="mt-3 pt-2.5 border-t border-space_indigo-400/50 flex items-center justify-between text-xs text-thistle-500 font-aleo">
                        <span className="flex items-center gap-1.5 text-dusty_mauve-600 font-semibold">
                          <ChefHat className="w-4 h-4 text-dusty_mauve-600" />
                          <span>{isCooking ? 'Active on Grill / Stove' : 'Waiting for Chef'}</span>
                        </span>
                        <span className="font-mono text-slate-300">
                          {totalItemsCount} total items
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: READY FOR PICKUP */}
        <div className="flex flex-col bg-space_indigo-200/90 rounded-3xl border border-emerald-500/40 p-5 sm:p-6 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-space_indigo-400/50">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <BellRing className="w-6 h-6 animate-bounce text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-tenez tracking-wide m-0 text-emerald-400">
                  Ready to Serve
                </h2>
                <span className="text-xs font-semibold text-thistle-500 font-aleo">
                  Collect order at pickup counter • Please show order number
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-mono">
                {orders.ready?.length || 0} ready
              </span>
            </div>
          </div>

          <div className="flex-1 pt-4 overflow-y-auto max-h-[calc(100vh-210px)] space-y-4 pr-1">
            {(!orders.ready || orders.ready.length === 0) ? (
              <div className="h-72 flex flex-col items-center justify-center text-thistle-500 font-medium text-sm space-y-3 font-aleo">
                <div className="w-16 h-16 rounded-2xl bg-space_indigo-300/80 border border-space_indigo-400 flex items-center justify-center">
                  <BellRing className="w-8 h-8 text-emerald-500/50" />
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-bold text-base m-0 font-tenez">No Orders Ready Yet</p>
                  <p className="text-thistle-500 text-xs mt-1">Orders will move here automatically when kitchen finishes cooking.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {orders.ready.map((order) => {
                  const readyElapsed = getMinutesElapsed(order.readyAt || order.updatedAt);

                  return (
                    <div
                      key={order._id || order.orderId}
                      className="pickup-ticket p-5 rounded-2xl bg-emerald-950/25 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-950/50 flex flex-col justify-between animate-pulse transition-all"
                    >
                      <div>
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl sm:text-4xl font-extrabold font-futura tracking-tight text-emerald-300">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400/80">
                              {formatTime(order.readyAt || order.updatedAt)}
                            </span>
                          </div>

                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 font-bold text-xs font-aleo">
                            {order.table?.displayName || (order.tableId ? `Table ${order.tableId}` : 'Dine-In')}
                          </span>
                        </div>

                        {/* Ready Callout Banner */}
                        <div className="flex items-center gap-2 mb-3.5 bg-emerald-900/40 p-3 rounded-xl border border-emerald-500/50 text-emerald-200 text-xs font-bold font-aleo">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>Food Prepared & Ready for Collection at Counter!</span>
                        </div>

                        {/* Cooked items summary */}
                        <div className="space-y-1.5 pt-2 border-t border-emerald-800/60 font-aleo">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1">
                            Completed Items
                          </div>
                          {order.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-space_indigo-100/90 text-slate-200 border border-emerald-900/40"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-extrabold text-emerald-400 font-mono">
                                  {item.quantity}x
                                </span>
                                <span className="font-semibold truncate">{item.name}</span>
                              </div>
                              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                                <span>✓ Cooked</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ready Elapsed Time & Pickup instructions */}
                      <div className="mt-3.5 pt-2.5 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300 font-medium font-aleo">
                        <span className="font-bold flex items-center gap-1.5">
                          <Coffee className="w-4 h-4 text-emerald-400" />
                          <span>Counter Pickup</span>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          Ready {readyElapsed === 0 ? 'just now' : `${readyElapsed}m ago`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Ticker */}
      <footer className="bg-space_indigo-200 border-t border-space_indigo-400/50 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-thistle-500 gap-2 font-aleo">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-300">Live TV Kitchen Board Synchronized</span>
        </div>
        <div className="text-thistle-500 hidden md:block">
          Scan the QR Code on your dining table to browse menu, customize items & pay online
        </div>
        <div className="text-thistle-600 font-mono text-[11px] flex items-center gap-3">
          <span>{audioEnabled ? '🔔 Sound chime active' : '🔕 Audio muted'}</span>
          <span>•</span>
          <span>Refresh rate: 1s</span>
        </div>
      </footer>
    </div>
  );
};

export default PublicDisplayPage;
