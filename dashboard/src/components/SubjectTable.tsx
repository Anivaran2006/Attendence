import React, { useState } from 'react';
import { SubjectAttendance } from '../../../shared/src/types.js';
import { getAttendanceThresholds } from '../../../shared/src/attendance-calculator.js';
import { Search, Calculator, Check, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface SubjectTableProps {
  subjects: SubjectAttendance[];
  onSelectSubjectForSim: (subject: SubjectAttendance) => void;
}

export const SubjectTable: React.FC<SubjectTableProps> = ({ subjects, onSelectSubjectForSim }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'warning' | 'danger'>('all');

  const filtered = subjects.filter((sub) => {
    const matchesSearch =
      sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'good') return sub.percentage >= 85;
    if (statusFilter === 'warning') return sub.percentage >= 75 && sub.percentage < 85;
    if (statusFilter === 'danger') return sub.percentage < 75;
    return true;
  });

  return (
    <div className="glass-panel p-6 sm:p-8 mb-8 border border-white/10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Subject-wise Attendance Breakdown
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Review individual courses, attendance percentages, and bunk allowances.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
            {(['all', 'good', 'warning', 'danger'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize font-bold transition-all ${
                  statusFilter === tab
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 text-[11px] font-black uppercase tracking-wider border-b border-white/10">
              <th className="py-3.5 px-4">Subject Code</th>
              <th className="py-3.5 px-4">Subject Name</th>
              <th className="py-3.5 px-3 text-center">Present</th>
              <th className="py-3.5 px-3 text-center">Total</th>
              <th className="py-3.5 px-3 text-center">Absent</th>
              <th className="py-3.5 px-4 w-44">Attendance %</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4">Buffer / Shortage</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-500 font-medium">
                  No courses matched the search or filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const thresholds = getAttendanceThresholds(sub.present, sub.totalLectures);
                const isGood = sub.percentage >= 85;
                const isWarning = sub.percentage >= 75 && sub.percentage < 85;
                const isDanger = sub.percentage < 75;

                const colorBg = isGood
                  ? 'bg-emerald-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

                const badgeClass = isGood
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isWarning
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

                const statusText = isGood ? 'Good' : isWarning ? 'Warning' : 'Danger';

                return (
                  <tr key={sub.subjectCode} className="hover:bg-slate-800/40 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      {sub.subjectCode}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-200 max-w-xs">
                      {sub.subjectName}
                    </td>

                    {/* Present */}
                    <td className="py-3.5 px-3 text-center font-black text-emerald-400">
                      {sub.present}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-3 text-center font-bold text-white">
                      {sub.totalLectures}
                    </td>

                    {/* Absent */}
                    <td className="py-3.5 px-3 text-center font-black text-rose-400">
                      {sub.absent}
                    </td>

                    {/* Percentage & Bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between text-xs font-black text-white mb-1.5">
                        <span>{sub.percentage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorBg} transition-all duration-500`}
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        />
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeClass}`}>
                        {isGood && <Check className="w-2.5 h-2.5" />}
                        {isWarning && <AlertTriangle className="w-2.5 h-2.5" />}
                        {isDanger && <AlertCircle className="w-2.5 h-2.5" />}
                        {statusText}
                      </span>
                    </td>

                    {/* Buffer / Shortage */}
                    <td className="py-3.5 px-4">
                      {sub.percentage >= 75 ? (
                        <span className="text-emerald-400 font-semibold">
                          Can miss <strong className="font-black text-emerald-300">{thresholds.bunkableFor75}</strong> class{thresholds.bunkableFor75 === 1 ? '' : 'es'}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold">
                          Need <strong className="font-black text-rose-300">{thresholds.classesTo75}</strong> more to reach 75%
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectSubjectForSim(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 font-bold transition-all hover:scale-105"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simulate</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
