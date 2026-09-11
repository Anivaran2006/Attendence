import React from 'react';
import { AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface SessionExpiredAlertProps {
  isExpired: boolean;
  lastSyncTime?: number | null;
}

export const SessionExpiredAlert: React.FC<SessionExpiredAlertProps> = ({ isExpired, lastSyncTime }) => {
  if (!isExpired) return null;

  return (
    <div className="mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
         style={{
           backgroundColor: 'rgba(245, 158, 11, 0.08)',
           borderColor: 'rgba(245, 158, 11, 0.3)',
         }}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg mt-0.5" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-amber-500">
            ERP session expired — please login normally to sync again.
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Your dashboard is continuing to safely display your previously synchronized attendance records. No credentials or OTPs were compromised.
          </p>
        </div>
      </div>

      <a
        href="https://erp.abes.ac.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary text-xs font-semibold py-2 px-3 flex-shrink-0 flex items-center gap-1.5"
        style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
      >
        <span>Open ABES ERP</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
