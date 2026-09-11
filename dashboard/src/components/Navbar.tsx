import React from 'react';
import { ShieldCheck, RefreshCw, Sun, Moon, Download, HelpCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { AttendanceStoreData } from '../../../shared/src/types.js';

interface NavbarProps {
  store: AttendanceStoreData;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onResetDemo: () => void;
  onOpenSyncHelp: () => void;
  onExportBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  store,
  theme,
  onToggleTheme,
  onResetDemo,
  onOpenSyncHelp,
  onExportBackup,
}) => {
  const latest = store.latest;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 transition-colors"
            style={{ background: theme === 'dark' ? 'rgba(6, 9, 19, 0.85)' : 'rgba(241, 245, 249, 0.85)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-glow-blue tracking-tight">
            A
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-100 flex items-center gap-1.5">
                ABES Attendance
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-black">
                  Tracker
                </span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-2.5 h-2.5" /> PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span>ABES Engineering College</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-500 font-mono text-[11px]">erp.abes.ac.in</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Data Source Tag */}
          {latest?.source === 'auto_sync' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE ERP DATA</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>DEMO MODE</span>
            </div>
          )}

          {/* ERP Connection Status Pill */}
          {store.erpSessionExpired ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-glow-amber">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Session Expired</span>
            </div>
          ) : store.erpConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Offline Cached</span>
            </div>
          )}

          {/* Student Info Tag */}
          {latest?.semester && (
            <div className="hidden sm:inline-flex items-center text-xs px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 font-semibold text-slate-300">
              {latest.semester}
            </div>
          )}

          {/* Action Buttons with glowing hover */}
          <button
            onClick={onOpenSyncHelp}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all hover:scale-105"
            title="How to Sync with ERP"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onExportBackup}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all hover:scale-105"
            title="Export JSON Backup"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 hover:text-blue-300 text-xs font-bold transition-all hover:scale-105 shadow-glow-blue"
            title="Reset to Official ABES Sample Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ABES Demo</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all hover:scale-105"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
