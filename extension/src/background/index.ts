import { ExtensionStorageManager } from '../storage/extension-storage.js';
import { ExtensionMessage } from '../../../shared/src/types.js';

console.log('[ABES Attendance Tracker] Background service worker initialized.');

// Update icon badge based on attendance percentage or session status
function updateExtensionBadge(percentage: number | null, isExpired: boolean): void {
  if (typeof chrome === 'undefined' || !chrome.action) return;

  if (isExpired) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' }); // Amber
    chrome.action.setTitle({ title: 'ABES Attendance Tracker: ERP Session Expired' });
    return;
  }

  if (percentage === null) {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'ABES Attendance Tracker: Ready' });
    return;
  }

  const badgeText = `${Math.round(percentage)}%`;
  chrome.action.setBadgeText({ text: badgeText });

  let badgeColor = '#10b981'; // Good (Emerald)
  if (percentage < 75) {
    badgeColor = '#ef4444'; // Danger (Red)
  } else if (percentage < 85) {
    badgeColor = '#f59e0b'; // Warning (Amber)
  }

  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setTitle({ title: `ABES Attendance Tracker: ${percentage}%` });
}

// Handle runtime messages
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'ATTENDANCE_PARSED': {
          const updated = await ExtensionStorageManager.saveSnapshot(message.payload);
          updateExtensionBadge(updated.latest?.overall.percentage ?? null, false);
          sendResponse({ success: true, data: updated });
          break;
        }

        case 'SESSION_EXPIRED': {
          await ExtensionStorageManager.setSessionExpired(message.payload.url);
          updateExtensionBadge(null, true);
          sendResponse({ success: true });
          break;
        }

        case 'GET_ATTENDANCE_STATUS': {
          const store = await ExtensionStorageManager.getStore();
          sendResponse({ success: true, data: store });
          break;
        }

        case 'TOGGLE_KEEP_ALIVE': {
          await ExtensionStorageManager.setKeepAlive(message.payload.enabled);
          sendResponse({ success: true });
          break;
        }

        case 'CLEAR_LOCAL_DATA': {
          await ExtensionStorageManager.clearData();
          updateExtensionBadge(null, false);
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (err: any) {
      console.error('[ABES Attendance Tracker] Background message handler error:', err);
      sendResponse({ success: false, error: err.message || 'Internal error' });
    }
  })();

  return true; // Keep sendResponse channel open for async response
});

// Restore badge on browser startup
chrome.runtime.onStartup?.addListener(async () => {
  const store = await ExtensionStorageManager.getStore();
  if (store.latest) {
    updateExtensionBadge(store.latest.overall.percentage, store.erpSessionExpired);
  }
});
