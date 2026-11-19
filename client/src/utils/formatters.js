// Format number to INR currency string
export const formatINR = (amount = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format full date & time
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Format time only (e.g., 10:45 AM)
export const formatTimeOnly = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Compact elapsed time, e.g. "48s", "3m 20s", "1h 4m"
export const formatDuration = (ms) => {
  if (!ms || ms < 1000) return 'just now';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return `${totalSeconds}s`;
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

// Return minutes elapsed from timestamp
export const getMinutesElapsed = (timestamp) => {
  if (!timestamp) return 0;
  const diff = Date.now() - new Date(timestamp).getTime();
  return Math.max(0, Math.floor(diff / 60000));
};

// Human friendly status configurations tailored to the luxury palette
export const ORDER_STATUS_CONFIG = {
  waiting_payment: {
    label: 'Awaiting Payment',
    color: 'dusty_mauve',
    bg: 'bg-thistle-800 text-thistle-100 border-thistle-600/70',
    dot: 'bg-dusty_mauve',
  },
  new: {
    label: 'Awaiting Counter',
    color: 'space_indigo',
    bg: 'bg-space_indigo-900 text-space_indigo-300 border-space_indigo-700/50',
    dot: 'bg-space_indigo',
  },
  confirmed: {
    label: 'With the Kitchen',
    color: 'space_indigo',
    bg: 'bg-space_indigo-900 text-space_indigo-200 border-space_indigo-700/60',
    dot: 'bg-space_indigo',
  },
  accepted: {
    label: 'Accepted by Kitchen',
    color: 'space_indigo',
    bg: 'bg-space_indigo-900 text-space_indigo-200 border-space_indigo-700/60',
    dot: 'bg-space_indigo',
  },
  preparing: {
    label: 'Preparing in Kitchen',
    color: 'dusty_mauve',
    bg: 'bg-dusty_mauve-900 text-dusty_mauve-200 border-dusty_mauve-600/50',
    dot: 'bg-dusty_mauve',
  },
  ready: {
    label: 'Ready for Pickup / Serving',
    color: 'emerald',
    bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  served: {
    label: 'Served & Completed',
    color: 'lilac_ash',
    bg: 'bg-lilac_ash-900 text-space_indigo-300 border-lilac_ash-700/60',
    dot: 'bg-lilac_ash',
  },
  completed: {
    label: 'Served & Completed',
    color: 'lilac_ash',
    bg: 'bg-lilac_ash-900 text-space_indigo-300 border-lilac_ash-700/60',
    dot: 'bg-lilac_ash',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'rose',
    bg: 'bg-rose-50 text-rose-900 border-rose-300',
    dot: 'bg-rose-500',
  },
};
