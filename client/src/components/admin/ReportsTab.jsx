import { formatINR } from '../../utils/formatters';

// Sales numbers, all read from the data the console already loaded. Nothing hardcoded.
const ReportsTab = ({ stats, orders }) => {
  const paidShare = stats?.totalOrders ? Math.round((stats.paidOrders / stats.totalOrders) * 100) : 0;

  const prepMinutes = orders
    .filter((order) => order.preparingAt && order.readyAt)
    .map((order) => (new Date(order.readyAt) - new Date(order.preparingAt)) / 60000)
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);
  const avgPrepMinutes = prepMinutes.length
    ? Math.round(prepMinutes.reduce((sum, minutes) => sum + minutes, 0) / prepMinutes.length)
    : null;
  const avgPrepLabel = prepMinutes.length
    ? `From ${prepMinutes.length} finished ${prepMinutes.length === 1 ? 'ticket' : 'tickets'}`
    : 'No finished tickets yet';

  const bestSelling = stats?.bestSelling || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-thistle-700 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-thistle-400 uppercase tracking-wider font-aleo">
            Orders paid today
          </span>
          <div className="text-3xl font-black text-emerald-600 font-futura">{paidShare}%</div>
          <p className="text-xs text-thistle-400 font-aleo">
            {stats?.paidOrders || 0} of {stats?.totalOrders || 0} orders paid before the kitchen
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-thistle-700 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-thistle-400 uppercase tracking-wider font-aleo">
            Average Order Value
          </span>
          <div className="text-3xl font-black text-space_indigo-100 font-futura">
            {formatINR(
              orders.length > 0
                ? Math.round(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length)
                : 0
            )}
          </div>
          <p className="text-xs text-thistle-400 font-aleo">Across the {orders.length} orders loaded here</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-thistle-700 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-thistle-400 uppercase tracking-wider font-aleo">
            Average Prep Time
          </span>
          <div className="text-3xl font-black text-space_indigo-100 font-futura">
            {avgPrepMinutes === null ? '—' : `${avgPrepMinutes} min`}
          </div>
          <p className="text-xs text-thistle-400 font-aleo">{avgPrepLabel}</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-thistle-700 shadow-2xs">
        <h3 className="font-bold text-lg font-tenez text-space_indigo-100 mb-4">Best Selling Today</h3>
        <div className="space-y-3 font-futura">
          {bestSelling.length === 0 ? (
            <p className="text-xs text-thistle-400 font-aleo">Nothing sold today yet.</p>
          ) : bestSelling.map((item, idx) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-lavender_blush-900/60 border border-thistle-700 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-dusty_mauve-600 font-mono">#{idx + 1}</span>
                <span className="font-bold text-space_indigo-100 font-aleo">{item._id}</span>
              </div>
              <span className="font-black text-space_indigo-100">{item.totalQuantity} sold</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
