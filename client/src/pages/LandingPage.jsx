import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import QRScannerModal from '../components/common/QRScannerModal';
import { tableApi } from '../api/apiServices';
import { useSocket } from '../context/SocketContext';
import AmbientBackground from '../components/animations/AmbientBackground';
import CreativeButton from '../components/animations/CreativeButton';
import ShinyText from '../components/animations/ShinyText';
import CountUp from '../components/animations/CountUp';
import TiltedCard from '../components/animations/TiltedCard';
import {
  Coffee,
  QrCode,
  ChefHat,
  Tv,
  LayoutDashboard,
  ArrowRight,
  Users,
  Camera,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TABLE_LOCATIONS = {
  'TBL-001': 'Salon Main',
  'TBL-002': 'Window Bay',
  'TBL-003': 'Terrace View',
  'TBL-004': 'Espresso Bar',
  'TBL-005': 'Private Booth',
  'TBL-006': 'Garden Alcove',
};

const LandingPage = () => {
  const { socket } = useSocket();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const res = await tableApi.getTables();
        const tablesList = Array.isArray(res?.data)
          ? res.data
          : (res?.data?.tables || res?.tables || []);
        if (tablesList.length > 0) {
          setTables(tablesList);
        } else {
          setTables([
            { tableId: 'TBL-001', displayName: 'Table 1', capacity: 4, status: 'available' },
            { tableId: 'TBL-002', displayName: 'Table 2', capacity: 4, status: 'available' },
            { tableId: 'TBL-003', displayName: 'Table 3', capacity: 6, status: 'available' },
            { tableId: 'TBL-004', displayName: 'Table 4', capacity: 2, status: 'available' },
            { tableId: 'TBL-005', displayName: 'Table 5', capacity: 8, status: 'available' },
            { tableId: 'TBL-006', displayName: 'Table 6', capacity: 4, status: 'available' },
          ]);
        }
      } catch {
        setTables([
          { tableId: 'TBL-001', displayName: 'Table 1', capacity: 4, status: 'available' },
          { tableId: 'TBL-002', displayName: 'Table 2', capacity: 4, status: 'available' },
          { tableId: 'TBL-003', displayName: 'Table 3', capacity: 6, status: 'available' },
          { tableId: 'TBL-004', displayName: 'Table 4', capacity: 2, status: 'available' },
          { tableId: 'TBL-005', displayName: 'Table 5', capacity: 8, status: 'available' },
          { tableId: 'TBL-006', displayName: 'Table 6', capacity: 4, status: 'available' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleTableUpdate = (updatedTable) => {
      setTables((prev) =>
        prev.map((t) => (t._id === updatedTable._id || t.tableId === updatedTable.tableId ? { ...t, ...updatedTable } : t))
      );
    };
    socket.on('table:statusUpdate', handleTableUpdate);
    return () => socket.off('table:statusUpdate', handleTableUpdate);
  }, [socket]);

  return (
    <div className="min-h-screen bg-lavender_blush-900 text-space_indigo font-futura selection:bg-dusty_mauve selection:text-white relative overflow-x-hidden">
      <Navbar />

      {/* Hero Section: Minimalist, Airy & Atmospheric */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-thistle-700/40">
        {/* Understated Ambient Particle Atmosphere */}
        <AmbientBackground density={24} interactive={true} />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Subtle Monospace Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/70 backdrop-blur-md border border-thistle-700/60 shadow-2xs text-[11px] font-mono tracking-widest text-space_indigo/70 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-dusty_mauve animate-pulse" />
            <span>01 / Contactless Café Atelier</span>
          </div>

          {/* Minimalist Editorial Headline in Tenez */}
          <h1 className="font-tenez text-5xl sm:text-7xl font-normal tracking-tight text-space_indigo m-0 leading-[1.08]">
            Where Artisanal Craft <br />
            <span className="italic font-light text-dusty_mauve">Meets Frictionless Dining.</span>
          </h1>

          {/* Poetic & Clear Aleo Subhead */}
          <p className="font-aleo text-base sm:text-lg text-space_indigo-400 max-w-xl mx-auto leading-relaxed font-normal">
            Elevating hospitality through tamper-proof QR table tokens, live biometric-ready checkout,
            and real-time kitchen orchestration.
          </p>

          {/* Tactile Action Suite */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <CreativeButton
              onClick={() => setIsScannerOpen(true)}
              variant="primary"
              size="lg"
              magnetic={true}
              spark={true}
              sparkColor="#967aa1"
              icon={Camera}
              iconPosition="left"
              className="rounded-full shadow-lg shadow-space_indigo/15 px-8"
            >
              Scan Table Standee
            </CreativeButton>

            <a href="#tables-section">
              <CreativeButton
                variant="outline"
                size="lg"
                magnetic={true}
                spark={true}
                sparkColor="#aaa1c8"
                icon={QrCode}
                iconPosition="left"
                className="rounded-full border-space_indigo/20 text-space_indigo hover:bg-space_indigo/5 px-8"
              >
                Browse 6 Tables
              </CreativeButton>
            </a>

            <Link to="/kitchen">
              <CreativeButton
                variant="ghost"
                size="lg"
                magnetic={true}
                spark={true}
                sparkColor="#bf5e6b"
                icon={ChefHat}
                iconPosition="left"
                className="rounded-full text-space_indigo/70 hover:text-space_indigo"
              >
                Kitchen KDS
              </CreativeButton>
            </Link>

            <Link to="/display">
              <CreativeButton
                variant="ghost"
                size="lg"
                magnetic={true}
                spark={true}
                sparkColor="#d5c6e0"
                icon={Tv}
                iconPosition="left"
                className="rounded-full text-space_indigo/70 hover:text-space_indigo"
              >
                TV Board
              </CreativeButton>
            </Link>
          </div>
        </div>
      </section>

      {/* The Performance Ledger: Minimalist Metrics Bar */}
      <section className="border-b border-thistle-700/40 bg-white/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-thistle-700/50">
            <div className="text-center px-4 pt-4 md:pt-0">
              <div className="font-tenez text-4xl sm:text-5xl font-normal text-space_indigo">
                <CountUp to={6} duration={1.2} />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-space_indigo-400 font-futura mt-1">
                Dining Tables Synced
              </div>
            </div>

            <div className="text-center px-4 pt-4 md:pt-0">
              <div className="font-tenez text-4xl sm:text-5xl font-normal text-space_indigo">
                <CountUp to={99.4} decimals={1} suffix="%" duration={1.5} />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-space_indigo-400 font-futura mt-1">
                Order Precision
              </div>
            </div>

            <div className="text-center px-4 pt-4 md:pt-0">
              <div className="font-tenez text-4xl sm:text-5xl font-normal text-space_indigo">
                <CountUp to={8} prefix="<" suffix="m" duration={1.2} />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-space_indigo-400 font-futura mt-1">
                Avg. Prep Turnaround
              </div>
            </div>

            <div className="text-center px-4 pt-4 md:pt-0">
              <div className="font-tenez text-4xl sm:text-5xl font-normal text-space_indigo">
                <CountUp to={100} suffix="%" duration={1.2} />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-space_indigo-400 font-futura mt-1">
                Contactless Checkout
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Table Directory: Architectural 6-Table Floor Grid */}
      <section id="tables-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-dusty_mauve block mb-1">
              [ 02 / Floor Directory ]
            </span>
            <h2 className="font-tenez text-3xl sm:text-4xl font-normal text-space_indigo m-0 tracking-tight">
              Curated Dining Tables
            </h2>
            <p className="font-aleo text-xs sm:text-sm text-space_indigo-400 mt-1 max-w-md">
              Point your smartphone at any table QR standee below to occupy the seat and unlock table-side service.
            </p>
          </div>

          <Link to="/admin/print-tables" className="self-start sm:self-auto">
            <CreativeButton
              variant="outline"
              size="sm"
              magnetic={true}
              spark={true}
              sparkColor="#d5c6e0"
              icon={Printer}
              iconPosition="left"
              className="rounded-full text-xs font-semibold"
            >
              Print Tent Standees →
            </CreativeButton>
          </Link>
        </div>

        {/* 6 Minimalist Table Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table, index) => {
            const token = table.currentQrToken?.token || `demo-token-${table.tableId}`;
            const tableUrl = `${window.location.origin}/table/${token}`;
            const isOccupied = table.status === 'occupied';
            const locationName = TABLE_LOCATIONS[table.tableId] || 'Dining Salon';
            const tableNumber = String(index + 1).padStart(2, '0');

            return (
              <TiltedCard
                key={table._id || index}
                maxRotation={5}
                scale={1.015}
                glare={true}
                spotlightColor="rgba(213, 198, 224, 0.35)"
              >
                <div className="bg-white rounded-3xl border border-thistle-700/60 p-6 shadow-xs hover:shadow-xl hover:border-dusty_mauve/60 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden group">
                  {/* Subtle Background Watermark Number */}
                  <span className="absolute -bottom-6 -right-3 font-tenez text-8xl font-black text-thistle-800/40 select-none pointer-events-none transition-transform group-hover:scale-105 duration-300">
                    {tableNumber}
                  </span>

                  <div>
                    {/* Top Row: Station Code & Live Status Dot */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono tracking-wider text-space_indigo-400 uppercase">
                        Station {tableNumber}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                          isOccupied
                            ? 'bg-amber-500/10 text-amber-900 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{isOccupied ? 'Occupied' : 'Available'}</span>
                      </span>
                    </div>

                    {/* Table Name & Location Tag */}
                    <h3 className="font-tenez text-2xl font-normal text-space_indigo tracking-tight">
                      {table.displayName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-space_indigo-400 mt-1 mb-5 font-futura">
                      <span className="text-dusty_mauve font-semibold">{locationName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {table.capacity} Guests
                      </span>
                    </div>

                    {/* Scannable QR Code Tile */}
                    <div className="p-3.5 rounded-2xl bg-lavender_blush-900/90 border border-thistle-700/60 flex items-center gap-4 mb-5">
                      <div className="p-2 bg-white rounded-xl border border-thistle-700/70 shrink-0 shadow-2xs">
                        <QRCodeSVG
                          value={tableUrl}
                          size={76}
                          level="H"
                          includeMargin={false}
                          bgColor="#ffffff"
                          fgColor="#192a51"
                        />
                      </div>
                      <div className="min-w-0 font-futura">
                        <div className="text-xs font-bold text-space_indigo flex items-center gap-1">
                          <span>Physical Standee</span>
                        </div>
                        <div className="text-[10px] font-mono text-space_indigo-400 truncate max-w-40 mt-0.5">
                          /table/{token.substring(0, 14)}...
                        </div>
                        <div className="text-[11px] text-dusty_mauve font-semibold mt-1.5">
                          Instant Camera Scan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Action */}
                  <div className="pt-2 relative z-10">
                    <Link to={`/table/${token}`} className="w-full block">
                      <CreativeButton
                        variant="secondary"
                        size="md"
                        magnetic={true}
                        spark={true}
                        sparkColor="#967aa1"
                        icon={ArrowRight}
                        iconPosition="right"
                        className="w-full text-center rounded-2xl bg-thistle-900/80 hover:bg-space_indigo hover:text-white transition-colors duration-200"
                      >
                        Occupy & Order Table {tableNumber}
                      </CreativeButton>
                    </Link>
                  </div>
                </div>
              </TiltedCard>
            );
          })}
        </div>
      </section>

      {/* The 3 Operational Hubs: Minimalist Dock */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="border-t border-thistle-700/40 pt-16">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-dusty_mauve block mb-1">
              [ 03 / Operational Modules ]
            </span>
            <h3 className="font-tenez text-2xl sm:text-3xl font-normal text-space_indigo m-0">
              Synchronized Service Hubs
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kitchen Station */}
            <TiltedCard maxRotation={5} scale={1.015} glare={true}>
              <Link
                to="/kitchen"
                className="block p-6 rounded-3xl bg-white border border-thistle-700/60 shadow-xs hover:border-dusty_mauve transition-all duration-300 h-full group"
              >
                <div className="w-10 h-10 rounded-xl bg-thistle-900 text-dusty_mauve flex items-center justify-center mb-4 border border-thistle-700/70">
                  <ChefHat className="w-5 h-5" />
                </div>
                <h4 className="font-tenez text-xl font-normal text-space_indigo">Kitchen Display (KDS)</h4>
                <p className="font-aleo text-xs text-space_indigo-400 mt-1 leading-relaxed">
                  Real-time 3-stage preparation board with incoming audio chimes and urgent cooking countdowns.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-dusty_mauve">
                  <span>Enter Kitchen Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </TiltedCard>

            {/* Public TV Board */}
            <TiltedCard maxRotation={5} scale={1.015} glare={true}>
              <Link
                to="/display"
                className="block p-6 rounded-3xl bg-white border border-thistle-700/60 shadow-xs hover:border-lilac_ash transition-all duration-300 h-full group"
              >
                <div className="w-10 h-10 rounded-xl bg-thistle-900 text-lilac_ash flex items-center justify-center mb-4 border border-thistle-700/70">
                  <Tv className="w-5 h-5" />
                </div>
                <h4 className="font-tenez text-xl font-normal text-space_indigo">Public Dining Display</h4>
                <p className="font-aleo text-xs text-space_indigo-400 mt-1 leading-relaxed">
                  Full-screen dark mode display board with digital clock, item prep timers, and pickup announcements.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-space_indigo-600">
                  <span>Open Fullscreen TV</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </TiltedCard>

            {/* Management & Admin */}
            <TiltedCard maxRotation={5} scale={1.015} glare={true}>
              <Link
                to="/admin"
                className="block p-6 rounded-3xl bg-white border border-thistle-700/60 shadow-xs hover:border-space_indigo transition-all duration-300 h-full group"
              >
                <div className="w-10 h-10 rounded-xl bg-thistle-900 text-space_indigo flex items-center justify-center mb-4 border border-thistle-700/70">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <h4 className="font-tenez text-xl font-normal text-space_indigo">Operations & Admin</h4>
                <p className="font-aleo text-xs text-space_indigo-400 mt-1 leading-relaxed">
                  Master table occupancy control, order clearing, menu item catalog, and daily revenue statistics.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-space_indigo">
                  <span>Access Console</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </TiltedCard>
          </div>
        </div>
      </section>

      {/* Minimalist Editorial Footer */}
      <footer className="border-t border-thistle-700/50 bg-white/60 py-12 px-4 sm:px-6 lg:px-8 text-xs font-futura">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-tenez text-lg font-bold text-space_indigo">Smart Café</span>
            <span className="text-space_indigo-400">• Contactless Dining Atelier</span>
          </div>

          <div className="flex items-center gap-3 text-space_indigo-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-space_indigo" title="Space Indigo" />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-dusty_mauve" title="Dusty Mauve" />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-lilac_ash" title="Lilac Ash" />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-thistle" title="Thistle" />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-lavender_blush" title="Lavender Blush" />
          </div>

          <div className="text-space_indigo-400 text-[11px] font-mono">
            Tenez • Futura • Aleo Design System
          </div>
        </div>
      </footer>

      {/* Live Camera QR Scanner Modal */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};

export default LandingPage;
