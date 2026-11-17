import { Link } from 'react-router-dom';
import { Clock, Eye, QrCode, ShoppingBag, User } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import CountUp from '../animations/CountUp';
import TiltedCard from '../animations/TiltedCard';
import { formatINR, formatTimeOnly } from '../../utils/formatters';
import { guestName, itemWord, orderItemCount, orderTableCode, orderTableLabel } from '../../utils/orderDisplay';

// Dashboard home: the four numbers, the shortcuts, and the last five orders — in that order.

const OverviewTab = ({ stats, orders, tables, onOpenTab, onInspectTable, onInspectOrder }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* The four numbers lead: they are the first thing anyone checks on opening the console. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TiltedCard maxRotation={6} scale={1.02} glare={true} spotlightColor="rgba(213, 198, 224, 0.4)">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-thistle-700 shadow-md hover:border-dusty_mauve transition-all h-full">
            <div className="flex items-center justify-between text-space_indigo-400 text-xs font-bold uppercase tracking-wider font-aleo mb-2">
              <span>Today's Revenue</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-futura font-black">₹</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-space_indigo font-futura tracking-tight">
              <CountUp
                to={stats?.totalSales || 0}
                prefix="₹"
                duration={1.5}
              />
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 font-aleo">
              Paid online today
            </div>
          </div>
        </TiltedCard>

        <TiltedCard maxRotation={6} scale={1.02} glare={true} spotlightColor="rgba(150, 122, 161, 0.3)">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-thistle-700 shadow-md hover:border-dusty_mauve transition-all h-full">
            <div className="flex items-center justify-between text-space_indigo-400 text-xs font-bold uppercase tracking-wider font-aleo mb-2">
              <span>Total Orders Placed</span>
              <ShoppingBag className="w-4 h-4 text-dusty_mauve" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-space_indigo font-futura tracking-tight">
              <CountUp
                to={stats?.orderCount || orders.length}
                duration={1.5}
              />
            </div>
            <div className="text-[11px] text-space_indigo-400 mt-1 font-aleo">All orders today</div>
          </div>
        </TiltedCard>

        <TiltedCard maxRotation={6} scale={1.02} glare={true} spotlightColor="rgba(170, 161, 200, 0.3)">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-thistle-700 shadow-md hover:border-dusty_mauve transition-all h-full">
            <div className="flex items-center justify-between text-space_indigo-400 text-xs font-bold uppercase tracking-wider font-aleo mb-2">
              <span>Active in Kitchen</span>
              <Clock className="w-4 h-4 text-dusty_mauve" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-space_indigo font-futura tracking-tight">
              <CountUp
                to={orders.filter((o) => ['new', 'preparing'].includes(o.preparationStatus)).length}
                duration={1.2}
              />
            </div>
            <div className="text-[11px] text-space_indigo-400 mt-1 font-aleo">
              Waiting or cooking
            </div>
          </div>
        </TiltedCard>

        <TiltedCard maxRotation={6} scale={1.02} glare={true} spotlightColor="rgba(25, 42, 81, 0.25)">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-thistle-700 shadow-md hover:border-dusty_mauve transition-all h-full">
            <div className="flex items-center justify-between text-space_indigo-400 text-xs font-bold uppercase tracking-wider font-aleo mb-2">
              <span>Table Occupancy</span>
              <QrCode className="w-4 h-4 text-dusty_mauve-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-space_indigo font-futura tracking-tight">
              <CountUp
                to={tables.filter((t) => t.status === 'occupied').length}
                duration={1.2}
              />
              <span className="text-space_indigo-400 text-lg font-normal"> / 6</span>
            </div>
            <div className="text-[11px] text-dusty_mauve-600 font-semibold mt-1 font-aleo">
              {Math.max(0, 6 - tables.filter((t) => t.status === 'occupied').length)} free right now
            </div>
          </div>
        </TiltedCard>
      </div>

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-space_indigo via-space_indigo to-space_indigo-600 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl font-tenez text-white">Live Operations Hub</h3>
          </div>
          <p className="text-xs text-thistle-500 font-aleo">
            The board and the kitchen station, in one room.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/cafe"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-space_indigo to-dusty_mauve hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-space_indigo/30"
            >
              Open the café room →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-thistle-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl font-tenez text-space_indigo-100">6 Unique Dining Tables</h3>
            <button
              onClick={() => onOpenTab('tables')}
              className="text-xs font-bold font-aleo text-dusty_mauve-600 hover:underline cursor-pointer"
            >
              Manage Tables & Tokens →
            </button>
          </div>
          <p className="text-xs text-thistle-400 font-aleo">
            Each table has its own QR. Tap a table to open its standee card.
          </p>
          <div className="grid grid-cols-6 gap-2 pt-1">
            {tables.map((t) => (
              <div
                key={t._id}
                onClick={() => {
                  onInspectTable(t);
                }}
                className="p-2.5 rounded-2xl border border-thistle-700 hover:border-dusty_mauve text-center cursor-pointer transition-all hover:shadow-2xs bg-lavender_blush-900/60"
              >
                <div className="text-xs font-black text-space_indigo-100 font-futura">
                  {t.displayName?.replace('Table ', 'T') || t.tableId}
                </div>
                <div className="text-[10px] text-thistle-400 font-aleo capitalize mt-0.5">{t.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white rounded-3xl border border-thistle-700 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-thistle-800 flex items-center justify-between bg-lavender_blush-900/60">
          <div>
            <h3 className="font-bold text-lg font-tenez text-space_indigo-100">Recent Customer Orders</h3>
            <p className="text-xs text-thistle-400 font-aleo">Live order stream updated in real time</p>
          </div>
          <button
            onClick={() => onOpenTab('orders')}
            className="text-xs font-bold font-aleo text-dusty_mauve-600 hover:text-dusty_mauve-700 cursor-pointer"
          >
            View All ({orders.length}) →
          </button>
        </div>

        <div className="divide-y divide-thistle-800/40 overflow-x-auto">
          {orders.length === 0 && (
            <div className="p-8 text-center text-xs text-thistle-400 font-aleo">
              No orders yet. New table orders will appear here as they arrive.
            </div>
          )}
          {orders.slice(0, 5).map((order) => (
            <div
              key={order._id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-lavender_blush-900/40 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className="w-11 h-11 shrink-0 grid place-items-center rounded-2xl bg-dusty_mauve-900/40 border border-dusty_mauve-600/40 font-black text-dusty_mauve-300 text-[13px] font-futura whitespace-nowrap"
                  title={orderTableLabel(order)}
                >
                  {orderTableCode(order)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-space_indigo-100 text-sm font-futura whitespace-nowrap">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.preparationStatus} size="sm" />
                  </div>
                  <span className="text-[11px] text-thistle-400 font-aleo flex items-center gap-1.5 flex-wrap">
                    <span>{orderItemCount(order)} {itemWord(orderItemCount(order))}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatTimeOnly(order.createdAt)}</span>
                    {guestName(order) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{guestName(order)}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-extrabold text-sm text-space_indigo-100 font-futura">
                    {formatINR(order.totalAmount)}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase font-aleo ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>

                <button
                  onClick={() => onInspectOrder(order)}
                  className="p-2 rounded-xl text-thistle-400 hover:text-space_indigo-100 hover:bg-thistle-800 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
};

export default OverviewTab;
