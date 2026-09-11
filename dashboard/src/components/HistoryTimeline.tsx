import React, { useState } from 'react';
import { AttendanceSnapshot } from '../../../shared/src/types.js';
import { History, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryTimelineProps {
  history: AttendanceSnapshot[];
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ history }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!history || history.length === 0) {
    return null;
  }

  // Sort chronological for chart display (oldest to newest)
  const chronological = [...history].sort((a, b) => a.timestamp - b.timestamp);

  const minPct = Math.max(0, Math.floor(Math.min(...chronological.map((s) => s.overall.percentage)) - 2));
  const maxPct = Math.min(100, Math.ceil(Math.max(...chronological.map((s) => s.overall.percentage)) + 2));
  const pctRange = Math.max(1, maxPct - minPct);

  const chartWidth = 640;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 24;

  const points = chronological.map((snap, idx) => {
    const x =
      chronological.length === 1
        ? chartWidth / 2
        : paddingX + (idx / (chronological.length - 1)) * (chartWidth - 2 * paddingX);
    const y =
      chartHeight -
      paddingY -
      ((snap.overall.percentage - minPct) / pctRange) * (chartHeight - 2 * paddingY);
    return { x, y, snap };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="glass-panel p-6 sm:p-8 mb-8 border border-white/10">
      {/* Title */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-glow-purple flex-shrink-0">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Historical Trajectory &amp; Snapshots
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Automated timeline tracking captured on each legitimate ERP session visit.
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 mb-6 overflow-x-auto shadow-inner">
        <div className="flex items-center justify-between text-xs mb-3 font-bold text-slate-400">
          <span className="flex items-center gap-1.5 text-blue-400">
            <TrendingUp className="w-4 h-4" /> Progression Curve
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Mandatory Cutoff: 75%
          </span>
        </div>

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />

          {/* Area fill */}
          {points.length > 1 && (
            <polygon
              fill="url(#chartGrad)"
              points={`${points[0].x},${chartHeight - paddingY} ${polylineStr} ${points[points.length - 1].x},${chartHeight - paddingY}`}
            />
          )}

          {/* Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />
          )}

          {/* Plot Points */}
          {points.map((p, idx) => (
            <g key={p.snap.id || idx} className="cursor-pointer group">
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="#030712"
                stroke="#3b82f6"
                strokeWidth="3"
                className="group-hover:scale-150 transition-transform"
              />
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="#f8fafc"
              >
                {p.snap.overall.percentage}%
              </text>
              <text
                x={p.x}
                y={chartHeight - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#64748b"
              >
                {p.snap.formattedDate.split(',')[0]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Snapshot Logs List */}
      <div className="space-y-3">
        {history.map((snap, index) => {
          const isExpanded = expandedId === snap.id;
          const prevSnap = history[index + 1];
          const diff = prevSnap
            ? Number((snap.overall.percentage - prevSnap.overall.percentage).toFixed(2))
            : null;

          return (
            <div
              key={snap.id || index}
              className="p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-blue-500/30 transition-all"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : snap.id)}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">
                      {snap.formattedDate}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Total: {snap.overall.totalLectures} &bull; Attended: {snap.overall.present} &bull; Missed: {snap.overall.absent}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-black text-blue-400">
                      {snap.overall.percentage}%
                    </div>
                    {diff !== null && (
                      <div className={`text-xs font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff >= 0 ? `+${diff}%` : `${diff}%`}
                      </div>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Collapsible Subject Breakdown */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {snap.subjects.map((sub) => (
                    <div key={sub.subjectCode} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                      <div className="font-bold text-blue-400 truncate">{sub.subjectCode}: {sub.subjectName}</div>
                      <div className="flex justify-between mt-1 text-[11px] font-medium text-slate-300">
                        <span>{sub.present}/{sub.totalLectures} classes</span>
                        <strong className="text-emerald-400 font-black">{sub.percentage}%</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
