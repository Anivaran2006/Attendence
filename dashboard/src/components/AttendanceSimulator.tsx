import React, { useState } from 'react';
import { SubjectAttendance, OverallAttendance } from '../../../shared/src/types.js';
import {
  calculatePercentage,
  calculateClassesToReachTarget,
  calculateBunkCapacity,
  projectAttendance,
} from '../../../shared/src/attendance-calculator.js';
import { Calculator, ArrowRight, CheckCircle2, XCircle, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface AttendanceSimulatorProps {
  overall: OverallAttendance;
  subjects: SubjectAttendance[];
  selectedSubject: SubjectAttendance | null;
  onSelectSubject: (subject: SubjectAttendance | null) => void;
}

export const AttendanceSimulator: React.FC<AttendanceSimulatorProps> = ({
  overall,
  subjects,
  selectedSubject,
  onSelectSubject,
}) => {
  const [deltaClasses, setDeltaClasses] = useState<number>(3);

  // Determine whether simulating overall or individual subject
  const currentPresent = selectedSubject ? selectedSubject.present : overall.present;
  const currentTotal = selectedSubject ? selectedSubject.totalLectures : overall.totalLectures;
  const currentPercentage = calculatePercentage(currentPresent, currentTotal);
  const targetLabel = selectedSubject
    ? `${selectedSubject.subjectCode} - ${selectedSubject.subjectName}`
    : 'Overall Semester Attendance';

  // Math Calculations
  const bunk75 = calculateBunkCapacity(currentPresent, currentTotal, 75);
  const req75 = calculateClassesToReachTarget(currentPresent, currentTotal, 75);
  const req80 = calculateClassesToReachTarget(currentPresent, currentTotal, 80);
  const req85 = calculateClassesToReachTarget(currentPresent, currentTotal, 85);

  const projection = projectAttendance(currentPresent, currentTotal, deltaClasses);
  const gainPct = (projection.projectedAttended - currentPercentage).toFixed(2);
  const dropPct = (currentPercentage - projection.projectedMissed).toFixed(2);

  return (
    <div className="glass-panel p-6 sm:p-8 mb-8 border border-white/10 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-1/3 w-72 h-72 rounded-full blur-3xl opacity-10 bg-indigo-500 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow-purple flex-shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Attendance Simulator &amp; What-If Engine
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Simulate prospective lecture outcomes before attending or skipping.
            </p>
          </div>
        </div>

        {/* Target Subject Selector */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedSubject ? selectedSubject.subjectCode : 'OVERALL'}
            onChange={(e) => {
              if (e.target.value === 'OVERALL') {
                onSelectSubject(null);
              } else {
                const found = subjects.find((s) => s.subjectCode === e.target.value);
                if (found) onSelectSubject(found);
              }
            }}
            className="w-full sm:w-80 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-800/90 border border-slate-700/80 text-white outline-none focus:border-blue-500 cursor-pointer shadow-inner"
          >
            <option value="OVERALL">⚡ Overall Semester Attendance (200 Lectures)</option>
            {subjects.map((sub) => (
              <option key={sub.subjectCode} value={sub.subjectCode}>
                {sub.subjectCode}: {sub.subjectName} ({sub.percentage}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Target Banner */}
      <div className="px-4 py-3 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-800/50 border border-slate-700/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Simulating Target:</span>
          <span className="font-extrabold text-blue-400 text-sm">{targetLabel}</span>
        </div>
        <div className="font-semibold text-slate-300">
          <span>Current Base: </span>
          <span className="font-black text-emerald-400 text-sm">{currentPercentage}%</span>
          <span className="text-slate-500"> ({currentPresent}/{currentTotal} held)</span>
        </div>
      </div>

      {/* Controls & Projection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slider Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                Number of Classes (N)
              </label>
              <span className="text-xl font-black text-blue-400 px-3 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                {deltaClasses}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={25}
              value={deltaClasses}
              onChange={(e) => setDeltaClasses(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer mb-4"
            />

            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {[1, 2, 3, 5, 8, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setDeltaClasses(num)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                    deltaClasses === num
                      ? 'bg-blue-600 text-white shadow-glow-blue scale-105'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-400 leading-relaxed">
            💡 Adjust <strong className="text-slate-200">N</strong> to project how attending or missing the next {deltaClasses} lectures will impact your attendance threshold.
          </div>
        </div>

        {/* Projection Outcome A: If Attended */}
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 relative overflow-hidden hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3 text-emerald-400 font-bold text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> If Attended
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
              Best Case
            </span>
          </div>

          <div className="my-3">
            <div className="text-4xl font-black text-emerald-400 drop-shadow">
              {projection.projectedAttended}%
            </div>
            <div className="text-xs font-bold text-emerald-300/90 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{gainPct}% gain on {deltaClasses} lectures</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-4 pt-3 border-t border-emerald-500/20">
            Attendance will become <strong className="text-white font-black">{currentPresent + deltaClasses}</strong> / <strong className="text-white font-black">{currentTotal + deltaClasses}</strong> total lectures.
          </p>
        </div>

        {/* Projection Outcome B: If Missed */}
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 relative overflow-hidden hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-3 text-rose-400 font-bold text-sm">
            <span className="flex items-center gap-2">
              <XCircle className="w-5 h-5" /> If Missed
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-extrabold uppercase">
              Worst Case
            </span>
          </div>

          <div className="my-3">
            <div className="text-4xl font-black text-rose-400 drop-shadow">
              {projection.projectedMissed}%
            </div>
            <div className="text-xs font-bold text-rose-300/90 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-{dropPct}% drop on {deltaClasses} absences</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-4 pt-3 border-t border-rose-500/20">
            Attendance will become <strong className="text-white font-black">{currentPresent}</strong> / <strong className="text-white font-black">{currentTotal + deltaClasses}</strong> total lectures.
          </p>
        </div>
      </div>

      {/* Target Milestone Grid */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">
          Milestone Targets &amp; Bunk Allowances
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 75% Target */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-center">
            <div className="text-[11px] font-bold text-slate-400">75% Mandatory Cutoff</div>
            <div className="text-base font-black mt-1" style={{ color: req75 === 0 ? '#10b981' : '#ef4444' }}>
              {req75 === 0 ? '✓ Reached' : `Need ${req75} more`}
            </div>
          </div>

          {/* 80% Target */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-center">
            <div className="text-[11px] font-bold text-slate-400">80% Safe Buffer</div>
            <div className="text-base font-black mt-1" style={{ color: req80 === 0 ? '#10b981' : '#f59e0b' }}>
              {req80 === 0 ? '✓ Reached' : `Need ${req80} more`}
            </div>
          </div>

          {/* 85% Target */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-center">
            <div className="text-[11px] font-bold text-slate-400">85% College Honors</div>
            <div className="text-base font-black mt-1" style={{ color: req85 === 0 ? '#10b981' : '#60a5fa' }}>
              {req85 === 0 ? '✓ Reached' : `Need ${req85} more`}
            </div>
          </div>

          {/* Bunk Capacity */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/30 text-center shadow-glow-emerald">
            <div className="text-[11px] font-bold text-emerald-400">Max Bunk for &ge; 75%</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {bunk75} classes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
