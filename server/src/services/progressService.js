import OrderStatusHistory from '../models/OrderStatusHistory.js';

const MINUTE = 60 * 1000;
const DEFAULT_PREP_MINUTES = 15;

// Each stage owns a slice of the 0-100 band. `accepted` is not a customer step, but it
// is a real state on the order and it anchors the ETA before cooking starts.
const STAGES = [
  { key: 'new', label: 'Awaiting counter', start: 0, end: 6 },
  // Counter confirmation sits between payment and the kitchen picking the ticket up.
  { key: 'confirmed', label: 'Sent to kitchen', start: 6, end: 12 },
  { key: 'accepted', label: 'In the kitchen', start: 12, end: 18 },
  { key: 'preparing', label: 'Cooking', start: 18, end: 90 },
  { key: 'ready', label: 'Ready', start: 90, end: 96 },
  { key: 'completed', label: 'Served', start: 96, end: 100 },
];

const STAGE_BY_KEY = Object.fromEntries(STAGES.map((stage) => [stage.key, stage]));

// Statuses a display may need to name that are not progress stages.
const EXTRA_LABELS = { none: 'Placed', waiting_payment: 'Awaiting payment', cancelled: 'Cancelled' };
const LABELS = { ...EXTRA_LABELS, ...Object.fromEntries(STAGES.map((stage) => [stage.key, stage.label])) };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toMs = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};

// 'served' has always been a synonym for 'completed' in this codebase.
const normalizeStatus = (status) => (status === 'served' ? 'completed' : status || 'waiting_payment');

// How far the order actually got, from its timestamps. Used when it was cancelled.
const reachedStage = (order) => {
  if (toMs(order.completedAt)) return 'completed';
  if (toMs(order.readyAt)) return 'ready';
  if (toMs(order.preparingAt)) return 'preparing';
  if (toMs(order.acceptedAt)) return 'accepted';
  if (toMs(order.confirmedAt)) return 'confirmed';
  return 'new';
};

// Dishes the kitchen has ticked off. Orders placed before the tick existed have none,
// which is why the clock alone can still carry the bar.
const itemStats = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const done = items.filter((item) => item && item.isDone).length;
  return { done, total: items.length, fraction: items.length ? done / items.length : 0 };
};

// Percent is time-interpolated inside the slow stages so it advances smoothly.
const percentFor = (stage, order, now, etaAt, items) => {
  const slice = STAGE_BY_KEY[stage] || STAGE_BY_KEY.new;

  if (stage === 'preparing') {
    const startedAt = toMs(order.preparingAt) ?? toMs(order.acceptedAt) ?? toMs(order.createdAt);
    if (!startedAt) return slice.start;
    const window = Math.max((etaAt ?? startedAt + DEFAULT_PREP_MINUTES * MINUTE) - startedAt, MINUTE);
    // Whichever is further along wins: a dish ticked off shows immediately, and a long
    // cook still creeps forward on the clock. Un-ticking a dish pulls the bar back.
    const byClock = clamp((now - startedAt) / window, 0, 1);
    return Math.round(slice.start + Math.max(byClock, items.fraction) * (slice.end - slice.start));
  }

  if (stage === 'ready') {
    const readyAt = toMs(order.readyAt);
    if (!readyAt) return slice.start;
    // Creep toward the end of the band while it waits on the counter.
    return Math.round(slice.start + clamp((now - readyAt) / (4 * MINUTE), 0, 1) * (slice.end - slice.start));
  }

  return stage === 'completed' ? 100 : slice.start;
};

/**
 * Everything a screen needs to draw progress, derived from fields the order already
 * stores. Same input always produces the same output, for every client.
 */
export const describeProgress = (order = {}, now = Date.now()) => {
  const status = normalizeStatus(order.preparationStatus);
  const items = itemStats(order);
  const placedAt = toMs(order.createdAt);
  const prepMinutes = Number(order.estimatedPrepTime) > 0 ? Number(order.estimatedPrepTime) : DEFAULT_PREP_MINUTES;
  // The ETA counts from when cooking started; before that, from acceptance or placement.
  const anchor = toMs(order.preparingAt) ?? toMs(order.acceptedAt) ?? placedAt;
  const etaAt = anchor ? anchor + prepMinutes * MINUTE : null;

  if (status === 'waiting_payment') {
    return {
      stage: 'waiting_payment',
      label: LABELS.waiting_payment,
      percent: 0,
      etaAt,
      isLate: false,
      lateByMs: 0,
      itemsDone: items.done,
      itemsTotal: items.total,
      stageElapsedMs: placedAt ? Math.max(0, now - placedAt) : 0,
    };
  }

  if (status === 'cancelled') {
    const reached = reachedStage(order);
    return {
      stage: 'cancelled',
      label: LABELS.cancelled,
      // Frozen where the order stopped.
      percent: percentFor(reached, order, toMs(order.cancelledAt) ?? now, etaAt, items),
      etaAt: null,
      isLate: false,
      lateByMs: 0,
      itemsDone: items.done,
      itemsTotal: items.total,
      stageElapsedMs: 0,
    };
  }

  const stage = STAGE_BY_KEY[status] || STAGE_BY_KEY.new;
  const since =
    (status === 'preparing' && (toMs(order.preparingAt) ?? toMs(order.acceptedAt))) ||
    (status === 'ready' && (toMs(order.readyAt) ?? toMs(order.preparingAt))) ||
    (status === 'completed' && (toMs(order.completedAt) ?? toMs(order.readyAt))) ||
    (status === 'accepted' && toMs(order.acceptedAt)) ||
    (status === 'confirmed' && toMs(order.confirmedAt)) ||
    placedAt;

  const isLate = Boolean(etaAt) && now > etaAt && (status === 'preparing' || status === 'ready');

  return {
    stage: status,
    label: stage.label,
    percent: percentFor(status, order, now, etaAt, items),
    etaAt,
    isLate,
    lateByMs: isLate ? now - etaAt : 0,
    itemsDone: items.done,
    itemsTotal: items.total,
    stageElapsedMs: since ? Math.max(0, now - since) : 0,
  };
};

/** Order document -> plain order payload with `progress` attached. */
export const withProgress = (order, now = Date.now()) => {
  if (!order) return order;
  const plain = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  plain.progress = describeProgress(plain, now);
  return plain;
};

export const withProgressList = (orders, now = Date.now()) =>
  (Array.isArray(orders) ? orders : []).map((order) => withProgress(order, now));

/** The recorded status changes, oldest first — the order's audit line. */
export const loadOrderTimeline = async (orderId) => {
  const rows = await OrderStatusHistory.find({ order: orderId })
    .sort({ createdAt: 1 })
    .lean();

  return rows.map((row) => ({
    to: row.toStatus,
    label: LABELS[row.toStatus] || row.toStatus,
    at: row.createdAt,
    note: row.note || '',
  }));
};
