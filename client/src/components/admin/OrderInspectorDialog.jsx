import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { CheckCircle2, RefreshCw, Trash2, User } from 'lucide-react';
import { formatINR, formatTimeOnly } from '../../utils/formatters';
import { guestName, orderTableCode, orderTableLabel } from '../../utils/orderDisplay';

// Dishes can be ticked off while the ticket is still on the line.
const TICKABLE_STATUSES = ['new', 'accepted', 'preparing', 'ready'];
const itemsDoneOf = (order) => (order?.items || []).filter((item) => item.isDone).length;

/** The order drawer: table and customer, the recorded timeline, the dish ticks, and the actions. */
const OrderInspectorDialog = ({
  order,
  timeline,
  onClose,
  onAdvanceStatus,
  onToggleItem,
  onCancelOrder,
  onClearOrder,
  onRecall,
}) => {
  if (!order) return null;

  return (
  <Modal
    isOpen={!!order}
    onClose={onClose}
    title={`Order ${order.orderNumber}`}
    maxWidth="max-w-lg"
  >
    <div className="space-y-4 font-futura">
      <div className="flex items-center justify-between pb-3.5 border-b border-thistle-800">
        <div>
          <span className="text-xs font-bold text-thistle-400 font-aleo uppercase tracking-wider">TABLE & CUSTOMER</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-8 h-8 shrink-0 grid place-items-center rounded-xl bg-thistle-900 border border-thistle-700 text-[10px] font-black text-space_indigo-100 font-futura">
              {orderTableCode(order)}
            </span>
            <div>
              <div className="font-bold text-space_indigo-100 text-sm">
                {orderTableLabel(order)}
              </div>
              {guestName(order) ? (
                <div className="flex items-center gap-1 text-xs text-space_indigo-200 mt-0.5 font-aleo">
                  <User className="w-3 h-3 shrink-0" />
                  <span>{guestName(order)}</span>
                  {order.customerPhone && <span className="text-thistle-400">· {order.customerPhone}</span>}
                </div>
              ) : (
                <div className="text-xs text-thistle-400 mt-0.5 font-aleo">Walk-in</div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <StatusBadge status={order.preparationStatus} />
          {order.cancelReason && (
            <div className="text-[11px] text-rose-500 font-semibold mt-1 font-aleo">
              Reason: {order.cancelReason}
            </div>
          )}
        </div>
      </div>

      <div className="pb-3.5 border-b border-thistle-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-thistle-400 font-aleo mb-2">
          Timeline
        </h4>
        {timeline === null ? (
          <p className="text-[11px] text-thistle-500 font-aleo">Loading timeline…</p>
        ) : timeline.length === 0 ? (
          <p className="text-[11px] text-thistle-500 font-aleo">No recorded transitions yet.</p>
        ) : (
          <ol className="space-y-1.5">
            {timeline.map((entry, index) => (
              <li key={index} className="flex items-baseline gap-2 text-[11px] font-aleo">
                <span className="w-1.5 h-1.5 rounded-full bg-dusty_mauve-600 shrink-0 translate-y-[-1px]" />
                <span className="font-bold text-space_indigo-100">{entry.label || entry.to}</span>
                <span className="text-thistle-400">{formatTimeOnly(entry.at)}</span>
                {entry.note && <span className="text-thistle-500 truncate">{entry.note}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-thistle-400 font-aleo">
            Items ({order.items?.length || 0})
          </h4>
          {itemsDoneOf(order) > 0 && (
            <span className="text-[10px] font-bold text-emerald-700 font-aleo">
              {itemsDoneOf(order)} of {order.items?.length || 0} cooked
            </span>
          )}
        </div>
        <div className="divide-y divide-thistle-800/40 border border-thistle-700 rounded-2xl p-3.5 bg-lavender_blush-900/60">
          {order.items?.map((item, idx) => (
            <div key={item._id || idx} className="py-2 flex items-center justify-between gap-2.5 text-xs">
              <button
                type="button"
                role="checkbox"
                aria-checked={Boolean(item.isDone)}
                aria-label={`${item.isDone ? 'Put back' : 'Tick off'} ${item.quantity}x ${item.name}`}
                disabled={!TICKABLE_STATUSES.includes(order.preparationStatus)}
                onClick={() => onToggleItem(order, item)}
                className={
                  'shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer ' +
                  (item.isDone
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-thistle-600 text-transparent hover:border-emerald-500')
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              <div className={'flex-1 ' + (item.isDone ? 'opacity-55' : '')}>
                <span className="font-bold text-dusty_mauve-600 font-mono">{item.quantity}x </span>
                <span className="font-medium text-space_indigo-100 font-aleo">{item.name}</span>
                {item.selectedSize?.name && (
                  <span className="text-[10px] text-thistle-400 block font-aleo">
                    Size: {item.selectedSize.name}
                  </span>
                )}
                {item.selectedAddons?.length > 0 && (
                  <span className="text-[10px] text-thistle-300 block font-aleo">
                    + {item.selectedAddons.map((a) => a.name).join(', ')}
                  </span>
                )}
              </div>
              <span className="font-black text-space_indigo-100">{formatINR(item.itemTotal)}</span>
            </div>
          ))}
        </div>
        {order.preparationStatus === 'preparing' &&
          (order.items?.length || 0) > 0 &&
          itemsDoneOf(order) === order.items.length && (
            <p className="text-[11px] text-emerald-700 font-aleo">
              Every dish is up — mark the order ready once it is on the pass.
            </p>
          )}
      </div>

      <div className="pt-2 border-t border-thistle-800 flex items-center justify-between text-base font-extrabold text-space_indigo-100">
        <span className="font-tenez text-lg">Total Paid</span>
        <span className="text-dusty_mauve-600 text-lg font-black">{formatINR(order.totalAmount)}</span>
      </div>

      {/* Counter Action Controls */}
      <div className="pt-3 border-t border-thistle-800 flex items-center justify-end gap-2 flex-wrap font-aleo">
        {order.preparationStatus === 'ready' && (
          <button
            onClick={() => onRecall(order._id)}
            className="px-4 py-2.5 rounded-2xl border border-thistle-700 text-space_indigo-200 hover:bg-lavender_blush-900/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Send this ticket back to the kitchen"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Back to cooking</span>
          </button>
        )}
        {order.preparationStatus === 'ready' && (
          <button
            onClick={() => {
              onAdvanceStatus(order._id, 'served');
              onClose();
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Handover & Clear Board</span>
          </button>
        )}
        {['new', 'preparing'].includes(order.preparationStatus) && (
          <button
            onClick={() => {
              onCancelOrder(order._id);
              onClose();
            }}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Cancel Order (Staff Override)
          </button>
        )}
        {['completed', 'served', 'cancelled'].includes(order.preparationStatus) && (
          <button
            onClick={() => {
              onClearOrder(order._id);
              onClose();
            }}
            className="px-4 py-2.5 rounded-2xl bg-thistle-800 hover:bg-thistle-700 text-space_indigo-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Dismiss & Clear</span>
          </button>
        )}
        <button
          onClick={() => onClose()}
          className="px-4 py-2.5 rounded-2xl border border-thistle-700 text-space_indigo-200 hover:bg-lavender_blush-900/40 font-bold text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
  );
};

export default OrderInspectorDialog;
