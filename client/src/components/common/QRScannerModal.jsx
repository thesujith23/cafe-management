import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  Upload,
  QrCode,
  AlertCircle,
  Sparkles,
  Utensils,
  CheckCircle2,
} from 'lucide-react';

const TABLES = [
  { id: 1, name: 'Table 1', token: 'demo-token-TBL-001', capacity: 4 },
  { id: 2, name: 'Table 2', token: 'demo-token-TBL-002', capacity: 4 },
  { id: 3, name: 'Table 3', token: 'demo-token-TBL-003', capacity: 6 },
  { id: 4, name: 'Table 4', token: 'demo-token-TBL-004', capacity: 2 },
  { id: 5, name: 'Table 5', token: 'demo-token-TBL-005', capacity: 8 },
  { id: 6, name: 'Table 6', token: 'demo-token-TBL-006', capacity: 4 },
];

const QRScannerModal = ({ isOpen, onClose, onSelectToken }) => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload' | 'simulate'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState('');
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Parse token from scanned text (URL or raw token)
  const handleDecodedText = (decodedText) => {
    let token = decodedText.trim();
    if (token.includes('/table/')) {
      token = token.split('/table/')[1]?.split('?')[0];
    } else if (token.includes('/order/')) {
      token = token.split('/order/')[1]?.split('?')[0];
    } else if (token.includes('/menu/')) {
      token = token.split('/menu/')[1]?.split('?')[0];
    }

    if (token) {
      setScannedResult(token);
      stopScanner();
      setTimeout(() => {
        onClose();
        if (onSelectToken) onSelectToken(token);
        else navigate(`/table/${token}`);
      }, 700);
    }
  };

  const startScanner = async () => {
    setCameraError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-region');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Frame error (no QR detected in frame), normal ignored
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Camera permission was denied or camera is not available. You can upload a QR image or select your table below.'
      );
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeMode]);

  // Handle image file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err) {
      setCameraError('Could not find a valid QR code in this image. Please try another image.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space_indigo-100/85 backdrop-blur-md animate-in fade-in font-futura selection:bg-dusty_mauve selection:text-white">
      <div className="relative w-full max-w-lg bg-space_indigo-200/95 border border-space_indigo-400 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="p-5 border-b border-space_indigo-400/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-space_indigo to-dusty_mauve flex items-center justify-center shadow-lg shadow-space_indigo/30">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold font-tenez text-lg text-white m-0">Scan Table QR Code</h3>
              <p className="text-xs text-thistle-600 font-aleo mt-0.5">Point camera at the tent standee on your dining table</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-thistle-400 hover:text-white hover:bg-space_indigo-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-space_indigo-400/50 bg-space_indigo-100/50 p-2 gap-2 text-xs font-bold font-aleo">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'camera'
                ? 'bg-dusty_mauve text-white shadow-xs'
                : 'text-thistle-500 hover:text-white hover:bg-space_indigo-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => {
              stopScanner();
              setActiveMode('upload');
            }}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-dusty_mauve text-white shadow-xs'
                : 'text-thistle-500 hover:text-white hover:bg-space_indigo-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => {
              stopScanner();
              setActiveMode('simulate');
            }}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'simulate'
                ? 'bg-dusty_mauve text-white shadow-xs'
                : 'text-thistle-500 hover:text-white hover:bg-space_indigo-300'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Select Table</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
          {scannedResult ? (
            <div className="text-center py-8 space-y-3 font-aleo">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold font-tenez text-white">QR Code Verified!</h4>
              <p className="text-xs text-thistle-500 font-mono">Redirecting to dining table...</p>
            </div>
          ) : activeMode === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              {/* QR Reader Viewport */}
              <div className="w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-black border-2 border-dusty_mauve/50 relative shadow-inner">
                <div id="qr-reader-region" className="w-full h-full" />
                {/* Target overlay guide */}
                <div className="absolute inset-4 border-2 border-dashed border-dusty_mauve/60 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold font-aleo text-dusty_mauve-600 bg-space_indigo-100/90 px-2.5 py-1 rounded-lg">
                    Align QR Code Inside Frame
                  </span>
                </div>
              </div>

              {cameraError && (
                <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2 font-aleo">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          ) : activeMode === 'upload' ? (
            <div className="w-full text-center py-6 font-aleo">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-space_indigo-400 hover:border-dusty_mauve rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-space_indigo-300/40"
              >
                <Upload className="w-10 h-10 text-dusty_mauve mb-3" />
                <h4 className="font-bold text-sm text-white mb-1 font-tenez text-base">Click to Upload QR Code Image</h4>
                <p className="text-xs text-thistle-600">PNG, JPG, or photo of dining table standee</p>
              </div>
              <div id="qr-reader-file" className="hidden" />

              {cameraError && (
                <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 font-aleo">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full space-y-3 font-futura">
              <div className="text-center mb-4">
                <h4 className="font-bold text-base font-tenez text-white">Select a Table to Simulate QR Scan</h4>
                <p className="text-xs text-thistle-600 font-aleo">Instantly opens the table menu with signed token</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TABLES.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => {
                      onClose();
                      navigate(`/table/${table.token}`);
                    }}
                    className="p-3.5 rounded-2xl bg-space_indigo-300/60 hover:bg-space_indigo border border-space_indigo-400 hover:border-dusty_mauve text-center transition-all group shadow-2xs cursor-pointer"
                  >
                    <div className="font-extrabold text-white group-hover:scale-105 transition-transform text-sm font-futura">
                      {table.name}
                    </div>
                    <div className="text-[11px] text-thistle-500 group-hover:text-thistle-900 font-aleo mt-0.5">
                      {table.capacity} Guests
                    </div>
                    <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-space_indigo-100/80 text-dusty_mauve-600 group-hover:bg-white/20 group-hover:text-white font-aleo">
                      Scan Table →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-space_indigo-100/90 border-t border-space_indigo-400/50 flex items-center justify-between text-xs text-thistle-600 font-aleo">
          <span>Smart Café • Digital Table Dining</span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-thistle-400 hover:text-white font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
