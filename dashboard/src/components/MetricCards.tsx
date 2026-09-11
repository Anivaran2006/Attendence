import React from 'react';
import { OverallAttendance } from '../../../shared/src/types.js';
import { calculateClassesToReachTarget, calculateBunkCapacity } from '../../../shared/src/attendance-calculator.js';
import { BookOpen, CheckCircle, XCircle, Target, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  overall: OverallAttendance;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ overall }) => {
  const req80 = calculateClassesToReachTarget(overall.present, overall.totalLectures, 80);
  const req85 = calculateClassesToReachTarget(overall.present, overall.totalLectures, 85);
  const bunk75 = calculateBunkCapacity(overall.present, overall.totalLectures, 75);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Lectures */}
      <div className="glass-panel p-5 relative overflow-hidden group hover:border-blue-500/40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Total Lectures
            </span>
            <div className="text-3xl font-black text-white mt-1 group-hover:text-blue-400 transition-colors">
              {overall.totalLectures}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Conducted by ABES ERP
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-blue-500/15 text-blue-400 border border-blue-500/25 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Present Lectures */}
      <div className="glass-panel p-5 relative overflow-hidden group hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
              Present
            </span>
            <div className="text-3xl font-black text-emerald-400 mt-1 drop-shadow-sm">
              {overall.present}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Classes attended (88%)
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Absent Lectures */}
      <div className="glass-panel p-5 relative overflow-hidden group hover:border-rose-500/40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400">
              Absent
            </span>
            <div className="text-3xl font-black text-rose-400 mt-1 drop-shadow-sm">
              {overall.absent}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Classes missed (12%)
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-rose-500/15 text-rose-400 border border-rose-500/25 group-hover:scale-110 transition-transform">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Target Cushion */}
      <div className="glass-panel p-5 relative overflow-hidden group hover:border-purple-500/40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400">
              Milestone Target
            </span>
            <div className="text-lg font-extrabold text-white mt-1">
              {overall.percentage >= 85 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> &ge; 85% Honors
                </span>
              ) : (
                <span className="text-amber-400">{req85} to reach 85%</span>
              )}
            </div>
            <span className="text-xs text-slate-400 mt-1 block font-medium">
              {bunk75} skippable safely
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-purple-500/15 text-purple-400 border border-purple-500/25 group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
