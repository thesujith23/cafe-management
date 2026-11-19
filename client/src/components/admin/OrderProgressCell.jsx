import { formatTimeOnly, formatDuration } from '../../utils/formatters';

// Compact progress readout for the orders table: stage, live clock, thin bar, ETA.
const OrderProgressCell = ({ order }) => {
  const progress = order.progress || {};
  const percent = Math.max(0, Math.min(100, progress.percent ?? 0));
  const isClosed = ['completed', 'served', 'cancelled'].includes(order.preparationStatus);
  const late = Boolean(progress.isLate) && !isClosed;

  const clock = isClosed
    ? ''
    : late
      ? `late ${formatDuration(progress.lateByMs)}`
      : formatDuration(progress.stageElapsedMs);

  const note = isClosed
    ? ''
    : late
      ? 'Overdue'
      : progress.etaAt
        ? order.preparationStatus === 'ready' ? 'On the counter' : `ETA ${formatTimeOnly(progress.etaAt)}`
        : 'Not started';

  return (
    <div className="min-w-[142px]">
      <div className="flex items-center justify-between gap-2">
        <span className={'text-[10px] font-bold uppercase tracking-wide font-aleo ' + (late ? 'text-rose-400' : 'text-space_indigo-100')}>
          {progress.label || 'Received'}
        </span>
        <span className={'text-[10px] font-mono ' + (late ? 'text-rose-400 font-bold' : 'text-thistle-400')}>{clock}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-[#e3d8c4] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(3, percent)}%`,
            background: late
              ? 'linear-gradient(90deg, #fb7185, #fcd34d)'
              : 'linear-gradient(90deg, #41614d, #7fa672)',
          }}
        />
      </div>
      {note && <div className="mt-1 text-[10px] text-thistle-500 font-aleo">{note}</div>}
    </div>
  );
};

export default OrderProgressCell;
