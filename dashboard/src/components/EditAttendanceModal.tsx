import React, { useState } from 'react';
import { SubjectAttendance, AttendanceSnapshot } from '../../../shared/src/types.js';
import { aggregateAttendance } from '../../../shared/src/attendance-calculator.js';
import { X, Plus, Trash2, Save, Sparkles, BookOpen } from 'lucide-react';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSnapshot: AttendanceSnapshot;
  onSave: (updatedSnapshot: AttendanceSnapshot) => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  currentSnapshot,
  onSave,
}) => {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([
    ...currentSnapshot.subjects.map((s) => ({ ...s })),
  ]);
  const [semester, setSemester] = useState(currentSnapshot.semester || 'Semester III (2026-27)');
  const [rollNumber, setRollNumber] = useState(currentSnapshot.studentRollNumber || '');

  if (!isOpen) return null;

  const handleUpdateField = (
    index: number,
    field: 'subjectCode' | 'subjectName' | 'present' | 'totalLectures',
    value: string | number
  ) => {
    const updated = [...subjects];
    const item = { ...updated[index] };

    if (field === 'present' || field === 'totalLectures') {
      const numVal = Math.max(0, parseInt(String(value), 10) || 0);
      (item as any)[field] = numVal;
      // Recompute absent & pct
      const total = field === 'totalLectures' ? numVal : item.totalLectures;
      const present = field === 'present' ? numVal : item.present;
      item.absent = Math.max(0, total - present);
      item.percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;
    } else {
      (item as any)[field] = value;
    }

    updated[index] = item;
    setSubjects(updated);
  };

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      {
        subjectCode: `SUB${subjects.length + 1}`,
        subjectName: 'New Subject Course',
        totalLectures: 10,
        present: 9,
        absent: 1,
        percentage: 90.0,
      },
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const overallAgg = aggregateAttendance(subjects);
    const now = Date.now();
    const formattedDate = new Date(now).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newSnapshot: AttendanceSnapshot = {
      id: `snap-${now}`,
      timestamp: now,
      formattedDate,
      semester,
      studentName: currentSnapshot.studentName || 'Student',
      studentRollNumber: rollNumber,
      subjects,
      overall: overallAgg,
      source: 'manual_sync',
    };

    onSave(newSnapshot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel max-w-3xl w-full p-6 sm:p-8 relative max-h-[90vh] flex flex-col border border-white/15 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Edit Your Attendance Records</h2>
              <p className="text-xs text-slate-400 font-medium">
                Update courses, lectures held, and attendance counts directly on this web app.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student metadata fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Semester Name
            </label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. Semester III (2026-27)"
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-700/80 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Roll Number (Optional)
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 2400320100099"
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-700/80 text-white outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Subjects List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-6">
          {subjects.map((sub, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <div className="w-full sm:w-28">
                <input
                  type="text"
                  value={sub.subjectCode}
                  onChange={(e) => handleUpdateField(index, 'subjectCode', e.target.value)}
                  placeholder="Code"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-800 border border-slate-700 text-blue-400 outline-none"
                />
              </div>

              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  value={sub.subjectName}
                  onChange={(e) => handleUpdateField(index, 'subjectName', e.target.value)}
                  placeholder="Subject Course Name"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pres:</span>
                  <input
                    type="number"
                    min={0}
                    value={sub.present}
                    onChange={(e) => handleUpdateField(index, 'present', e.target.value)}
                    className="w-16 px-2 py-1.5 text-xs font-black rounded-lg bg-slate-800 border border-emerald-500/40 text-emerald-400 outline-none text-center"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total:</span>
                  <input
                    type="number"
                    min={1}
                    value={sub.totalLectures}
                    onChange={(e) => handleUpdateField(index, 'totalLectures', e.target.value)}
                    className="w-16 px-2 py-1.5 text-xs font-bold rounded-lg bg-slate-800 border border-blue-500/40 text-white outline-none text-center"
                  />
                </div>

                <div className="w-16 text-right font-black text-xs text-slate-300">
                  {sub.percentage}%
                </div>

                <button
                  onClick={() => handleRemoveSubject(index)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <button
            onClick={handleAddSubject}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Another Course</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-glow-blue hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Recompute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
