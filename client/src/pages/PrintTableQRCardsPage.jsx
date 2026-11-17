import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import TableQRStandee from '../components/common/TableQRStandee';
import { tableApi } from '../api/apiServices';
import { getPublicBaseUrl } from '../utils/publicUrl';
import { Printer, ArrowLeft, Wifi, Globe, Smartphone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const PrintTableQRCardsPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // The Wi-Fi address comes from the server (its LAN IP), not a value typed in by hand.
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const [wifiDefaultOrigin, setWifiDefaultOrigin] = useState('');

  const [hostMode, setHostMode] = useState('wifi'); // 'wifi', 'current', 'custom'
  const [customHost, setCustomHost] = useState('');

  useEffect(() => {
    getPublicBaseUrl().then((url) => {
      if (!url) return;
      setWifiDefaultOrigin(url);
      setCustomHost((current) => current || url);
    });
  }, []);

  const activeBaseUrl =
    hostMode === 'wifi'
      ? (wifiDefaultOrigin || currentOrigin)
      : hostMode === 'current'
      ? currentOrigin
      : customHost;

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await tableApi.getTables();
      if (res.success && res.data) {
        setTables(Array.isArray(res.data) ? res.data : (res.data.tables || []));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="pixel-screen pixel-qr-screen min-h-screen bg-lavender_blush-900 flex flex-col text-space_indigo font-futura print:bg-white print:p-0">
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Control Bar (Hidden when printing) */}
      <div className="bg-white border-b border-thistle-700 px-4 sm:px-6 lg:px-8 py-4 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2.5 rounded-xl border border-thistle-700 hover:bg-thistle-900 text-space_indigo transition-colors"
              title="Return to Admin Console"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-tenez text-2xl font-bold text-space_indigo m-0">
                Print Table QR Standees (Tent Cards)
              </h1>
              <p className="font-aleo text-xs text-space_indigo-400 m-0">
                Place these physical QR standee cards on your café dining tables for customer scanning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Host Target Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-lavender_blush-800 rounded-xl text-xs font-bold border border-thistle-700">
              <button
                onClick={() => setHostMode('wifi')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  hostMode === 'wifi'
                    ? 'bg-space_indigo text-white shadow-xs'
                    : 'text-space_indigo-400 hover:text-space_indigo'
                }`}
                title="Best for real smartphone scanning over café Wi-Fi"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Wi-Fi IP (192.168.29.61)</span>
              </button>

              <button
                onClick={() => setHostMode('current')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  hostMode === 'current'
                    ? 'bg-space_indigo text-white shadow-xs'
                    : 'text-space_indigo-400 hover:text-space_indigo'
                }`}
                title="Current browser origin"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Localhost</span>
              </button>
            </div>

            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-space_indigo hover:bg-space_indigo-400 text-white font-bold text-xs shadow-md shadow-space_indigo/20 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print All 6 Standees</span>
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="max-w-7xl mx-auto mt-4 p-3.5 rounded-2xl bg-thistle-900/60 border border-thistle-700 flex items-center justify-between text-xs text-space_indigo font-futura">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-dusty_mauve shrink-0" />
            <span>
              <strong>How physical dining works:</strong> Print these standee cards, fold them into tabletop tents, and place one on each table. Customers sit down, point their phone camera at the QR code, and their browser opens the menu for that exact table.
            </span>
          </div>
          <span className="text-[11px] font-mono text-space_indigo-400 hidden sm:inline">
            Active Target: {activeBaseUrl}/table/...
          </span>
        </div>
      </div>

      {/* Standees Display Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none">
        {loading ? (
          <div className="py-20 text-center text-space_indigo-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-dusty_mauve" />
            <p className="text-sm font-bold font-aleo text-space_indigo">Loading table QR cards...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4 print:p-2">
            {tables.map((table) => (
              <div key={table._id || table.tableId} className="print:break-inside-avoid print:mb-6">
                <TableQRStandee
                  table={table}
                  hostBaseUrl={activeBaseUrl}
                  compact={false}
                  showActions={true}
                  onPrint={() => window.print()}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .table-standee-card {
            box-shadow: none !important;
            border: 2px dashed #5e6472 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 2rem !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintTableQRCardsPage;
