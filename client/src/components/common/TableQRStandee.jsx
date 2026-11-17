import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, ExternalLink, Sparkles, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicBaseUrl } from '../../utils/publicUrl';

/**
 * TableQRStandee Component
 * Renders a premium, scannable table tent card for physical cafe tables.
 */
const TableQRStandee = ({
  table,
  hostBaseUrl,
  compact = false,
  showActions = true,
  onPrint = null,
}) => {
  const cardRef = useRef(null);
  // A phone cannot resolve "localhost", so the server supplies the address it should open.
  const [serverBaseUrl, setServerBaseUrl] = useState(null);
  useEffect(() => {
    if (hostBaseUrl) return undefined;
    let alive = true;
    getPublicBaseUrl().then((url) => { if (alive && url) setServerBaseUrl(url); });
    return () => { alive = false; };
  }, [hostBaseUrl]);

  const token = table.currentQrToken?.token || table.token || `demo-token-${table.tableId}`;
  const origin = hostBaseUrl
    || serverBaseUrl
    || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  const targetUrl = `${origin}/table/${token}`;

  const handleDownload = () => {
    try {
      const svg = cardRef.current?.querySelector('svg');
      if (!svg) {
        toast.error('Could not find QR code element');
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 80;
        canvas.height = img.height + 80;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40);

        const a = document.createElement('a');
        a.download = `SmartCafe-QR-${table.tableId || 'Table'}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        toast.success(`Downloaded QR for ${table.displayName || table.tableId}`);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to download QR image');
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint(table);
    } else {
      window.print();
    }
  };

  if (compact) {
    return (
      <div ref={cardRef} className="flex flex-col items-center p-3 rounded-2xl bg-white border border-thistle-700 shadow-2xs font-futura">
        <div className="p-2 rounded-xl bg-white border border-thistle-800 shadow-xs mb-2">
          <QRCodeSVG
            value={targetUrl}
            size={110}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#192a51"
          />
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-space_indigo font-tenez">{table.displayName}</div>
          <div className="text-[10px] text-space_indigo-400 font-mono">{table.tableId}</div>
          <div className="text-[10px] text-dusty_mauve font-bold mt-0.5">📱 Scan with Phone</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="table-standee-card bg-white rounded-3xl border-2 border-thistle-700 p-6 shadow-xl max-w-sm mx-auto text-space_indigo relative overflow-hidden font-futura"
      style={{ minWidth: '280px' }}
    >
      {/* Decorative Top Accent Banner with the 5 theme colors */}
      <div className="h-2.5 w-full bg-gradient-to-r from-space_indigo via-dusty_mauve to-lilac_ash absolute top-0 left-0" />

      {/* Brand Header */}
      <div className="text-center pt-2 pb-3 border-b border-thistle-800">
        <div className="flex items-center justify-center gap-1.5 text-dusty_mauve mb-1">
          <Sparkles className="w-4 h-4 fill-dusty_mauve text-dusty_mauve" />
          <span className="font-tenez text-base font-bold uppercase tracking-widest text-space_indigo">
            Smart Café
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-space_indigo-400 font-futura">
          Contactless Dine-In Ordering
        </span>
      </div>

      {/* Table Prominent Name */}
      <div className="text-center my-4">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-thistle-900 text-space_indigo border border-thistle-700 uppercase tracking-wider font-mono">
          {table.tableId || 'TBL-001'}
        </span>
        <h3 className="font-tenez text-3xl font-bold text-space_indigo mt-2 mb-0.5 tracking-tight">
          {table.displayName || 'Dining Table'}
        </h3>
        <p className="font-aleo text-xs text-space_indigo-400 font-medium">
          Capacity: {table.capacity || 4} Guests • Placed at your table
        </p>
      </div>

      {/* The Actual Scannable 2D QR Barcode */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className="p-4 rounded-2xl bg-white border-2 border-space_indigo-200 shadow-md inline-block relative group">
          <QRCodeSVG
            value={targetUrl}
            size={190}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#192a51"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-dusty_mauve mt-3 animate-pulse">
          <span>📷 POINT PHONE CAMERA TO SCAN</span>
        </div>
        <p className="mt-2 px-2 text-center font-mono text-[10px] leading-snug text-space_indigo-400 break-all">
          {targetUrl}
        </p>
      </div>

      {/* Customer Step Instructions */}
      <div className="p-3.5 rounded-2xl bg-lavender_blush-900 border border-thistle-700 text-space_indigo text-xs space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <span className="w-4 h-4 rounded-full bg-space_indigo text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
            1
          </span>
          <span className="leading-tight font-aleo">Point your smartphone camera at this QR code</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-4 h-4 rounded-full bg-space_indigo text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
            2
          </span>
          <span className="leading-tight font-aleo">Tap the link to check in & browse café menu</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-4 h-4 rounded-full bg-space_indigo text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
            3
          </span>
          <span className="leading-tight font-aleo">Order & pay • Hot food served straight to this table!</span>
        </div>
      </div>

      {/* Wi-Fi & Support Footer */}
      <div className="pt-3 border-t border-thistle-800 flex items-center justify-between text-[10px] text-space_indigo-400">
        <div className="flex items-center gap-1 text-space_indigo font-semibold">
          <Wifi className="w-3.5 h-3.5 text-dusty_mauve" />
          <span>Free Café Wi-Fi</span>
        </div>
        <span className="font-mono text-space_indigo-400">No App Required</span>
      </div>

      {/* Actions (Hidden during print) */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-thistle-800 flex items-center gap-2 print:hidden font-futura">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 px-3 rounded-xl bg-thistle-900 hover:bg-thistle-800 text-space_indigo font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-thistle-700 cursor-pointer"
            title="Download QR code PNG for printing"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-xl bg-space_indigo hover:bg-space_indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Print Table Tent Standee Card"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Standee</span>
          </button>

          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl border border-thistle-700 hover:bg-thistle-900 text-space_indigo"
            title="Open Direct Link in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};

export default TableQRStandee;
