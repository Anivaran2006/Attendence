import React from 'react';
import { X, CheckCircle, ShieldCheck, Lock, Globe, RefreshCw } from 'lucide-react';

interface SyncInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncInstructionModal: React.FC<SyncInstructionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              How to Sync with ABES ERP
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Zero-click automatic synchronization with 100% security compliance.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 my-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Log in to ABES ERP Legitimately
              </h4>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Go to <a href="https://erp.abes.ac.in/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">erp.abes.ac.in</a> and enter your username, password, and OTP as usual.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Open Student Attendance
              </h4>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Click on the <strong>Student Attendance</strong> menu to display your subject-wise attendance table.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Automatic Sync in Seconds
              </h4>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                The extension reads the table directly from your screen and displays a green notification pill: <em>"Synced! Overall Attendance: XX%"</em>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-400">
                Enjoy 24/7 Offline Access
              </h4>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                You can now close the ERP tab! Your dashboard retains your latest records, bunk calculations, and subject analytics locally.
              </p>
            </div>
          </div>
        </div>

        {/* Security Guarantee Box */}
        <div className="p-3.5 rounded-xl border bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Zero-Credential Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This application never reads or stores your password, never touches OTPs, and never circumvents authentication. It operates strictly locally on your browser.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn btn-primary text-xs py-2 px-4">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
