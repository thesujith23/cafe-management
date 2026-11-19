import { useState } from 'react';
import { CheckCircle2, Eye, Search, User, X } from 'lucide-react';
import OrderProgressCell from './OrderProgressCell';
import { formatINR } from '../../utils/formatters';
import { guestName, itemWord, orderItemCount, orderTableCode, orderTableLabel } from '../../utils/orderDisplay';

// Every status lands in one of these four views; Active is the working default.
const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All orders' },
  { id: 'served', label: 'Served' },
  { id: 'cancelled', label: 'Cancelled' },
];

// The statuses this table has no direct action for, and where they go next.
const NEXT_STAGE = { waiting_payment: 'new', accepted: 'preparing' };

const OrdersTab = ({ orders, filter, onFilterChange, onAdvanceStatus, onInspect }) => {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visibleOrders = needle
    ? orders.filter((order) => `${order.orderNumber} ${order.table?.displayName || ''} ${order.tableId || ''} ${order.customerName || ''}`.toLowerCase().includes(needle))
    : orders;

  return (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2 pb-1">
      <div className="flex items-center gap-2 overflow-x-auto">
      {FILTERS.map((option) => (
        <button
          key={option.id}
          onClick={() => onFilterChange(option.id)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-aleo transition-all whitespace-nowrap cursor-pointer ${
            filter === option.id
              ? 'bg-space_indigo text-white shadow-xs'
              : 'bg-white border border-thistle-700 text-space_indigo-200 hover:bg-lavender_blush-900/40'
          }`}
        >
          {option.label}
        </button>
      ))}
      </div>

      <label className="relative flex-1 min-w-[180px] sm:max-w-xs">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-thistle-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find an order, table or guest"
          aria-label="Search orders"
          className="w-full pl-9 pr-8 py-1.5 rounded-full border border-thistle-700 bg-white text-xs text-space_indigo font-aleo outline-none focus:border-dusty_mauve"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-thistle-400 hover:text-space_indigo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </label>
    </div>

    <div className="bg-white rounded-3xl border border-thistle-700 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-lavender_blush-900/60 text-thistle-400 font-bold uppercase tracking-wider font-aleo border-b border-thistle-800">
            <tr>
              <th className="p-4">Order #</th>
              <th className="p-4">Table & Customer</th>
              <th className="p-4 hidden lg:table-cell">Items</th>
              <th className="p-4 hidden sm:table-cell">Total</th>
              <th className="p-4 hidden xl:table-cell">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Counter Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-thistle-800/40 font-futura">
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-thistle-400 font-aleo">
                  {needle ? `No order matches “${query}”.` : 'No orders matching this filter'}
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => (
                <tr key={order._id} className="hover:bg-lavender_blush-900/40 transition-colors">
                  <td className="p-4 font-bold text-space_indigo-100 font-futura whitespace-nowrap">{order.orderNumber}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-9 h-9 shrink-0 grid place-items-center rounded-xl bg-thistle-900 border border-thistle-700 text-[11px] font-black text-space_indigo-100 font-futura"
                        title={orderTableLabel(order)}
                      >
                        {orderTableCode(order)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-space_indigo-100 font-aleo whitespace-nowrap">
                          {orderTableLabel(order)}
                        </div>
                        {guestName(order) ? (
                          <div className="flex items-center gap-1 text-[11px] text-thistle-400 font-normal font-aleo mt-0.5">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]" title={guestName(order)}>{guestName(order)}</span>
                            {order.customerPhone && <span className="text-thistle-500 shrink-0">· {order.customerPhone}</span>}
                          </div>
                        ) : (
                          <div className="text-[11px] text-thistle-500 font-normal font-aleo mt-0.5">Walk-in</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-space_indigo-200 font-aleo hidden lg:table-cell">
                    <div
                      className="truncate max-w-[190px]"
                      title={(order.items || []).map((item) => `${item.quantity || 1}× ${item.name}`).join(', ')}
                    >
                      {order.items?.length
                        ? `${order.items[0].quantity || 1}× ${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}`
                        : 'No dishes'}
                    </div>
                    <div className="text-[10px] text-thistle-400 mt-0.5">
                      {orderItemCount(order)} {itemWord(orderItemCount(order))}
                    </div>
                  </td>
                  <td className="p-4 font-black text-space_indigo-100 font-futura hidden sm:table-cell whitespace-nowrap">
                    {formatINR(order.totalAmount)}
                  </td>
                  <td className="p-4 hidden xl:table-cell">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase font-aleo border ${order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                        : 'bg-amber-50 text-amber-800 border-amber-200/80'}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <OrderProgressCell order={order} />
                    {order.cancelReason && (
                      <div className="text-[10px] text-rose-500 mt-1 max-w-[140px] truncate font-aleo" title={order.cancelReason}>
                        {order.cancelReason}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap font-aleo">
                      {order.preparationStatus === 'new' && (
                        <button
                          onClick={() => onAdvanceStatus(order._id, 'confirmed')}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-space_indigo to-dusty_mauve text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          title="Confirm the table and dishes — sends the ticket to the kitchen"
                        >
                          Confirm
                        </button>
                      )}
                      {order.preparationStatus === 'confirmed' && (
                        <button
                          onClick={() => onAdvanceStatus(order._id, 'preparing')}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-space_indigo to-dusty_mauve text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          title="Start cooking this confirmed ticket"
                        >
                          Cook
                        </button>
                      )}
                      {order.preparationStatus === 'preparing' && (
                        <button
                          onClick={() => onAdvanceStatus(order._id, 'ready')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          title="Mark order ready for customer"
                        >
                          Ready
                        </button>
                      )}
                      {order.preparationStatus === 'ready' && (
                        <button
                          onClick={() => onAdvanceStatus(order._id, 'served')}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Customer picked up order • Handover and clear from TV display board"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Handover & Clear</span>
                        </button>
                      )}
                      {NEXT_STAGE[order.preparationStatus] && (
                        <button
                          onClick={() => onAdvanceStatus(order._id, NEXT_STAGE[order.preparationStatus])}
                          className="px-2.5 py-1 rounded-xl bg-dusty_mauve-900 hover:bg-dusty_mauve-800 text-dusty_mauve-200 font-bold text-[11px] border border-dusty_mauve-600/60 transition-colors cursor-pointer"
                        >
                          {order.preparationStatus === 'accepted' ? 'Start cooking' : 'Send to kitchen'}
                        </button>
                      )}
                      <button
                        onClick={() => onInspect(order)}
                        className="p-1.5 text-thistle-400 hover:text-space_indigo-100 hover:bg-thistle-800 rounded-xl transition-colors cursor-pointer"
                        title="Inspect details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

export default OrdersTab;
