import { ORDER_STATUS_CONFIG } from '../../utils/formatters';

const StatusBadge = ({ status, size = 'md' }) => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-thistle-800 text-space_indigo border-thistle-600',
    dot: 'bg-space_indigo',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-aleo font-semibold shadow-2xs ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
