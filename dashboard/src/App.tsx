import React, { useEffect, useState } from 'react';
import { AttendanceStoreData, SubjectAttendance } from '../../shared/src/types.js';
import { DashboardStorageBridge } from './services/storage-bridge.js';
import { Navbar } from './components/Navbar.js';
import { SessionExpiredAlert } from './components/SessionExpiredAlert.js';
import { OverallCard } from './components/OverallCard.js';
import { MetricCards } from './components/MetricCards.js';
import { SubjectTable } from './components/SubjectTable.js';
import { AttendanceSimulator } from './components/AttendanceSimulator.js';
import { HistoryTimeline } from './components/HistoryTimeline.js';
import { SyncInstructionModal } from './components/SyncInstructionModal.js';
import { EditAttendanceModal } from './components/EditAttendanceModal.js';

export const App: React.FC = () => {
  const [store, setStore] = useState<AttendanceStoreData | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedSubjectForSim, setSelectedSubjectForSim] = useState<SubjectAttendance | null>(null);
  const [isSyncHelpOpen, setIsSyncHelpOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    // Initial load
    DashboardStorageBridge.loadStore().then((data) => setStore(data));

    // Listen to real-time storage changes
    const unsubscribe = DashboardStorageBridge.subscribe((updated) => {
      setStore(updated);
    });

    return () => unsubscribe();
  }, []);

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleResetDemo = async () => {
    const updated = await DashboardStorageBridge.resetToDemo();
    setStore(updated);
    setSelectedSubjectForSim(null);
  };

  const handleExportBackup = () => {
    if (store) {
      DashboardStorageBridge.exportBackup(store);
    }
  };

  const handleSaveEditedAttendance = async (newSnapshot: any) => {
    if (!store) return;
    const updatedHistory = [newSnapshot, ...store.history.slice(0, 49)];
    const updatedStore: AttendanceStoreData = {
      ...store,
      latest: newSnapshot,
      history: updatedHistory,
      lastSyncTime: newSnapshot.timestamp,
    };
    await DashboardStorageBridge.saveStore(updatedStore);
    setStore(updatedStore);
    setSelectedSubjectForSim(null);
  };

  if (!store || !store.latest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-mesh-gradient">
        <div className="glass-panel max-w-md p-8 text-center border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-glow-blue">
            A
          </div>
          <h2 className="text-xl font-extrabold mb-2 text-white">ABES Attendance Tracker</h2>
          <p className="text-xs mb-6 text-slate-400 leading-relaxed">
            No local attendance records detected. Click below to load the official ABES sample dataset or log in to the ERP portal to synchronize.
          </p>
          <button
            onClick={handleResetDemo}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-glow-blue hover:opacity-90 transition-opacity"
          >
            ⚡ Load ABES Sample Dataset
          </button>
        </div>
      </div>
    );
  }

  const latest = store.latest;

  return (
    <div className="min-h-screen flex flex-col bg-mesh-gradient text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Navbar */}
      <Navbar
        store={store}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onResetDemo={handleResetDemo}
        onOpenSyncHelp={() => setIsSyncHelpOpen(true)}
        onExportBackup={handleExportBackup}
        onOpenEditModal={() => setIsEditModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1 w-full">
        {/* Session Expired Banner if active */}
        <SessionExpiredAlert
          isExpired={store.erpSessionExpired}
          lastSyncTime={store.lastSyncTime}
        />

        {/* Hero Card */}
        <div className="mb-8">
          <OverallCard
            overall={latest.overall}
            formattedDate={latest.formattedDate}
            semester={latest.semester}
            studentName={latest.studentName}
            studentRollNumber={latest.studentRollNumber}
            source={latest.source}
          />
        </div>

        {/* 4 Metric Summary Cards */}
        <MetricCards overall={latest.overall} />

        {/* Interactive Simulator */}
        <AttendanceSimulator
          overall={latest.overall}
          subjects={latest.subjects}
          selectedSubject={selectedSubjectForSim}
          onSelectSubject={setSelectedSubjectForSim}
        />

        {/* Subject Breakdown Table */}
        <SubjectTable
          subjects={latest.subjects}
          onSelectSubjectForSim={(sub) => {
            setSelectedSubjectForSim(sub);
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
        />

        {/* Historical Snapshots Timeline */}
        <HistoryTimeline history={store.history} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-400">
            ABES Attendance Tracker &bull; Student Companion for ABES Engineering College (erp.abes.ac.in)
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Local-First Privacy &bull; Zero Credential Access &bull; Offline Analytics Engine
          </p>
        </div>
      </footer>

      {/* Sync Instructions Modal */}
      <SyncInstructionModal
        isOpen={isSyncHelpOpen}
        onClose={() => setIsSyncHelpOpen(false)}
      />

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentSnapshot={latest}
        onSave={handleSaveEditedAttendance}
      />
    </div>
  );
};
