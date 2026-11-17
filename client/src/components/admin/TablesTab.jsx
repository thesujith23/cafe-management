import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ExternalLink, Plus, Printer } from 'lucide-react';
import { formatTimeOnly } from '../../utils/formatters';

// The floor: each table's QR, who is sitting there, and the seat / free controls.

const TablesTab = ({ tables, onFreeTable, onSeatTable, onShowStandee }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-tenez text-space_indigo-100">Café Dining Tables & QR Standees</h3>
          <p className="text-xs text-thistle-400 font-aleo mt-0.5">
            Real-time occupancy control: seat guests, free tables after dining, or print physical QR table standees
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap font-aleo">
          <Link
            to="/admin/print-tables"
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-space_indigo to-dusty_mauve hover:brightness-110 text-white font-bold text-xs shadow-md shadow-space_indigo/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Table Standees</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              {tables.filter((t) => t.status === 'occupied').length} Occupied
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {tables.filter((t) => t.status === 'available').length} Available
            </span>
          </div>
        </div>
      </div>

      {tables.length === 0 && (
        <div className="p-8 text-center text-xs text-thistle-400 font-aleo bg-white rounded-3xl border border-thistle-700">
          No tables loaded. Tap Refresh above to try again.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const hasCustomer = table.currentCustomer?.name;
          const token = table.currentQrToken?.token || table.token || `demo-token-${table.tableId}`;
          const tableUrl = `${window.location.origin}/table/${token}`;

          return (
            <div
              key={table._id}
              className={`bg-white rounded-3xl border p-5 shadow-2xs transition-all space-y-4 ${
                isOccupied ? 'border-rose-300 ring-2 ring-rose-100' : 'border-thistle-700 hover:border-dusty_mauve'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-thistle-400 uppercase tracking-wider font-aleo">
                    {table.tableId}
                  </span>
                  <h4 className="text-xl font-bold font-tenez text-space_indigo-100 mt-0.5">
                    {table.displayName}
                  </h4>
                  <p className="text-xs text-thistle-400 font-aleo">Capacity: {table.capacity} Guests</p>
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-aleo capitalize inline-block ${
                      isOccupied
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {table.status}
                  </span>

                </div>
              </div>

              {/* Real Scannable Table QR Code Banner */}
              <div className="p-3.5 rounded-2xl bg-lavender_blush-900/60 border border-thistle-700 flex items-center gap-3.5">
                <div className="p-2 bg-white rounded-xl border border-thistle-700 shrink-0 shadow-2xs">
                  <QRCodeSVG
                    value={tableUrl}
                    size={64}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold font-aleo text-space_indigo-100">Table QR</div>
                  <div className="text-[10px] text-thistle-400 font-aleo mt-0.5">Scan to order at this table</div>
                </div>
              </div>

              {/* Customer Seating Info */}
              {hasCustomer ? (
                <div className="p-3.5 rounded-2xl bg-dusty_mauve-900/30 border border-dusty_mauve-600/40 text-xs text-space_indigo-200 space-y-1 font-aleo">
                  <div className="flex items-center justify-between font-bold text-dusty_mauve-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-dusty_mauve animate-pulse"></span>
                      {table.currentCustomer.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-dusty_mauve-800 text-[10px] font-bold text-dusty_mauve-200 font-futura">
                      {table.currentCustomer.guests || 1} {table.currentCustomer.guests === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  {table.currentCustomer.phone && (
                    <div className="text-[11px] text-space_indigo-300">
                      Phone: {table.currentCustomer.phone}
                    </div>
                  )}
                  {table.currentCustomer.checkedInAt && (
                    <div className="text-[10px] text-thistle-400">
                      Seated at {formatTimeOnly(table.currentCustomer.checkedInAt)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-lavender_blush-900/60 border border-thistle-800 text-xs text-thistle-400 flex items-center justify-between font-aleo">
                  <span>No guest seated</span>
                  <span className="text-[10px] font-semibold text-emerald-600">Ready for Seating</span>
                </div>
              )}

              {/* Counter / Admin Control Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-thistle-800 font-aleo">
                {isOccupied ? (
                    <button
                      onClick={() => onFreeTable(table)}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-space_indigo hover:bg-space_indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Mark table available and clear guest info"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Free / Clear Table</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onSeatTable(table)}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-space_indigo to-dusty_mauve hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      title="Manually seat guests at this table"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Mark Occupied</span>
                    </button>
                )}

                <button
                  onClick={() => onShowStandee(table)}
                  className="p-2.5 rounded-2xl bg-thistle-800 hover:bg-thistle-700 border border-thistle-600 text-space_indigo-100 transition-colors cursor-pointer"
                  title="Open printable standee for this table"
                  aria-label={`Open the ${table.displayName} standee`}
                >
                  <Printer className="w-4 h-4" />
                </button>

                <Link
                  to={`/table/${token}`}
                  target="_blank"
                  className="p-2.5 rounded-2xl border border-thistle-700 hover:bg-lavender_blush-900/60 text-space_indigo-100 transition-colors"
                  title="Open this table's menu in a new tab"
                  aria-label={`Open the ${table.displayName} menu`}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>

  );
};

export default TablesTab;
