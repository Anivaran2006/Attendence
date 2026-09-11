import React from 'react';
import { OverallAttendance, AttendanceThresholds } from '../../../shared/src/types.js';
import { getAttendanceThresholds } from '../../../shared/src/attendance-calculator.js';
import { Shield, CheckCircle2, AlertTriangle, Clock, Sparkles } from 'lucide-react';

interface OverallCardProps {
  overall: OverallAttendance;
  formattedDate?: string;
  semester?: string;
  studentName?: string;
  studentRollNumber?: string;
  source?: string;
}

export const OverallCard: React.FC<OverallCardProps> = ({
  overall,
  formattedDate,
  semester,
  studentName,
  studentRollNumber,
  source,
}) => {
  const thresholds: AttendanceThresholds = getAttendanceThresholds(
    overall.present,
    overall.totalLectures
  );

  const isGood = overall.percentage >= 85;
  const isWarning = overall.percentage >= 75 && overall.percentage < 85;
  const isDanger = overall.percentage < 75;

  const strokeColor = isGood ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444';
  const glowClass = isGood ? 'shadow-glow-emerald' : isWarning ? 'shadow-glow-amber' : 'shadow-glow-rose';
  const statusLabel = isGood ? 'Excellent Standing' : isWarning ? 'Warning Zone' : 'Shortage Alert';

  // SVG ring parameters (radius = 64, circumference ~= 402.12)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, Math.max(0, overall.percentage)) / 100) * circumference;

  return (
    <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/10">
      {/* Background ambient lighting */}
      <div
        className="absolute -right-10 -top-10 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background: isGood ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444',
        }}
      />
      <div className="absolute left-1/4 -bottom-10 w-56 h-56 rounded-full blur-3xl opacity-15 bg-blue-600 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Animated Radial Progress + Metrics */}
        <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
          {/* Circular Gauge */}
          <div className={`relative w-40 h-40 flex items-center justify-center flex-shrink-0 rounded-full ${glowClass} transition-all`}>
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#1e293b"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={strokeColor}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Percentage Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black tracking-tight text-white drop-shadow">
                {overall.percentage}%
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">
                Overall
              </span>
            </div>
          </div>

          {/* Heading & Summary Stats */}
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isGood
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isWarning
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {isGood ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{statusLabel}</span>
              </span>

              <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                Cutoff: 75%
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {semester || 'Semester Attendance'}
            </h2>

            {studentRollNumber && (
              <div className="text-xs font-mono font-bold text-blue-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <span>Roll No: {studentRollNumber}</span>
                {studentName && <span className="text-slate-400">&bull; {studentName}</span>}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-semibold">
              <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Present: <span className="font-extrabold text-white text-sm">{overall.present}</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                Absent: <span className="font-extrabold text-white text-sm">{overall.absent}</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Total: <span className="font-extrabold text-white text-sm">{overall.totalLectures}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Bunk Cushion Card */}
        <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3.5">
          <div className="w-full sm:w-96 p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-white/10 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Shield className={`w-4 h-4 ${isGood ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'}`} />
                <span>Attendance Cushion</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400">
                Safe Margin
              </span>
            </div>

            {overall.percentage >= 75 ? (
              <div>
                <div className="text-sm text-slate-200 leading-relaxed font-medium">
                  You can safely bunk <strong className="text-emerald-400 font-black text-xl mx-1">{thresholds.bunkableFor75}</strong> more lecture{thresholds.bunkableFor75 === 1 ? '' : 's'} while keeping your attendance above 75%.
                </div>
                <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Calculated based on 200 held lectures.</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-slate-200 leading-relaxed font-medium">
                  You must attend <strong className="text-rose-400 font-black text-xl mx-1">{thresholds.classesTo75}</strong> consecutive classes to cross the 75% cutoff threshold.
                </div>
                <div className="mt-2.5 text-[11px] text-rose-400/80 font-medium">
                  Attendance shortage warning active.
                </div>
              </div>
            )}
          </div>

          {formattedDate && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last synchronized with ERP: {formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
