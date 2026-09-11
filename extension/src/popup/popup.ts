import { ExtensionStorageManager } from '../storage/extension-storage.js';
import { calculateBunkCapacity, calculateClassesToReachTarget } from '../../../shared/src/attendance-calculator.js';
import { MOCK_LATEST_SNAPSHOT } from '../../../shared/src/mock-data.js';
import { AttendanceStoreData } from '../../../shared/src/types.js';

document.addEventListener('DOMContentLoaded', async () => {
  const erpStatusBadge = document.getElementById('erp-status-badge');
  const erpStatusDot = document.getElementById('erp-status-dot');
  const erpStatusText = document.getElementById('erp-status-text');
  const sessionExpiredBanner = document.getElementById('session-expired-banner');
  const attendanceCard = document.getElementById('attendance-card');
  const emptyState = document.getElementById('empty-state');
  const overallPct = document.getElementById('overall-pct');
  const pctProgressRing = document.getElementById('pct-progress-ring') as SVGCircleElement | null;
  const statTotal = document.getElementById('stat-total');
  const statPresent = document.getElementById('stat-present');
  const statAbsent = document.getElementById('stat-absent');
  const bunkMarginTip = document.getElementById('bunk-margin-tip');
  const lastSyncLabel = document.getElementById('last-sync-label');

  const btnOpenDashboard = document.getElementById('btn-open-dashboard');
  const btnSyncTab = document.getElementById('btn-sync-tab');
  const btnLoadMock = document.getElementById('btn-load-mock');
  const linkOpenErp = document.getElementById('link-open-erp');

  // Load and render current state
  async function refreshUI(): Promise<void> {
    const store: AttendanceStoreData = await ExtensionStorageManager.getStore();

    // Check session expired status
    if (store.erpSessionExpired) {
      if (erpStatusDot) erpStatusDot.className = 'status-dot expired';
      if (erpStatusText) erpStatusText.textContent = 'Session Expired';
      if (sessionExpiredBanner) sessionExpiredBanner.style.display = 'flex';
    } else if (store.erpConnected) {
      if (erpStatusDot) erpStatusDot.className = 'status-dot active';
      if (erpStatusText) erpStatusText.textContent = 'ERP Connected';
      if (sessionExpiredBanner) sessionExpiredBanner.style.display = 'none';
    } else {
      if (erpStatusDot) erpStatusDot.className = 'status-dot';
      if (erpStatusText) erpStatusText.textContent = 'Offline Cached';
      if (sessionExpiredBanner) sessionExpiredBanner.style.display = 'none';
    }

    if (!store.latest) {
      if (attendanceCard) attendanceCard.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (attendanceCard) attendanceCard.style.display = 'flex';

    const { overall, formattedDate } = store.latest;
    if (overallPct) overallPct.textContent = `${overall.percentage}%`;
    if (statTotal) statTotal.textContent = String(overall.totalLectures);
    if (statPresent) statPresent.textContent = String(overall.present);
    if (statAbsent) statAbsent.textContent = String(overall.absent);
    if (lastSyncLabel) lastSyncLabel.textContent = `Last synced: ${formattedDate}`;

    // SVG Circle progress (Circumference = 2 * pi * 42 ~= 263.89)
    if (pctProgressRing) {
      const circumference = 264;
      const progress = Math.min(100, Math.max(0, overall.percentage));
      const offset = circumference - (progress / 100) * circumference;
      pctProgressRing.style.strokeDashoffset = String(offset);

      if (overall.percentage >= 85) {
        pctProgressRing.style.stroke = '#10b981';
      } else if (overall.percentage >= 75) {
        pctProgressRing.style.stroke = '#f59e0b';
      } else {
        pctProgressRing.style.stroke = '#ef4444';
      }
    }

    // Bunk tip calculation
    if (bunkMarginTip) {
      if (overall.percentage >= 75) {
        const bunkable = calculateBunkCapacity(overall.present, overall.totalLectures, 75);
        bunkMarginTip.textContent = `🎯 Safe! You can miss ${bunkable} lecture${bunkable === 1 ? '' : 's'} and stay >= 75%.`;
        bunkMarginTip.style.borderLeftColor = '#10b981';
      } else {
        const needed = calculateClassesToReachTarget(overall.present, overall.totalLectures, 75);
        bunkMarginTip.textContent = `⚠️ Warning! You need to attend ${needed} lecture${needed === 1 ? '' : 's'} to reach 75%.`;
        bunkMarginTip.style.borderLeftColor = '#ef4444';
      }
    }
  }

  // Open full dashboard
  btnOpenDashboard?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      const dashUrl = chrome.runtime.getURL('dashboard/index.html');
      chrome.tabs.create({ url: dashUrl });
    } else {
      window.open('http://localhost:5173', '_blank');
    }
  });

  // Open ERP login page
  linkOpenErp?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://erp.abes.ac.in/' });
    } else {
      window.open('https://erp.abes.ac.in/', '_blank');
    }
  });

  // Sync active ERP tab
  btnSyncTab?.addEventListener('click', async () => {
    if (btnSyncTab) btnSyncTab.innerText = 'Syncing...';

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || !tab.id) {
          alert('No active tab found.');
          if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab';
          return;
        }

        if (!tab.url || !tab.url.includes('abes.ac.in')) {
          alert('Current tab is not ABES ERP. Please open https://erp.abes.ac.in/ and log in.');
          if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab';
          return;
        }

        // Try sending message first
        chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_MANUAL_SYNC' }, (response) => {
          if (!chrome.runtime.lastError && response?.success) {
            if (btnSyncTab) btnSyncTab.innerText = '✓ Synced!';
            setTimeout(() => { if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab'; }, 2000);
            refreshUI();
            return;
          }

          // If content script was not injected yet (tab was open before extension install),
          // programmatically inject dist/content.js now using chrome.scripting
          if (chrome.scripting) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['dist/content.js']
            }, () => {
              if (chrome.runtime.lastError) {
                alert('Please refresh the ABES ERP tab (press F5 on ERP) and try again.');
                if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab';
                return;
              }

              // Give script a moment to initialize then trigger sync
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id!, { type: 'TRIGGER_MANUAL_SYNC' }, () => {
                  if (btnSyncTab) btnSyncTab.innerText = '✓ Synced!';
                  setTimeout(() => { if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab'; }, 2000);
                  refreshUI();
                });
              }, 400);
            });
          } else {
            alert('Please refresh the ABES ERP tab (press F5 on the ERP page) to connect.');
            if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab';
          }
        });
      });
    } else {
      refreshUI();
      if (btnSyncTab) btnSyncTab.innerText = 'Sync Active ERP Tab';
    }
  });

  // Load mock data for quick demonstration
  btnLoadMock?.addEventListener('click', async () => {
    await ExtensionStorageManager.saveSnapshot(MOCK_LATEST_SNAPSHOT);
    await refreshUI();
  });

  await refreshUI();
});
