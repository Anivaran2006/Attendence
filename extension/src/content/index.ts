import { ABESAttendanceParser, ParseResult } from '../parser/attendance-parser.js';
import { SessionKeepAlive } from './keep-alive.js';
import { ExtensionMessage } from '../../../shared/src/types.js';

class ABESContentController {
  private parser: ABESAttendanceParser;
  private keepAlive: SessionKeepAlive;
  private hasSynced = false;
  private observer: MutationObserver | null = null;

  constructor() {
    this.parser = new ABESAttendanceParser();
    this.keepAlive = new SessionKeepAlive(4);
    this.init();
  }

  private init(): void {
    console.log('[ABES Attendance Tracker] Content script initialized on', window.location.href);

    // Initial check
    this.checkAndParse();

    // Listen for DOM changes (ASP.NET UpdatePanels or client navigation)
    this.setupMutationObserver();

    // Listen for extension messages
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
        if (message.type === 'TRIGGER_MANUAL_SYNC') {
          const result = this.checkAndParse(true);
          sendResponse({ success: true, result });
        }
        return true;
      });
    }
  }

  private checkAndParse(forceNotify = false): ParseResult {
    const result = this.parser.parseAttendance(document, window.location.href);

    if (result.status === 'session_expired') {
      this.keepAlive.stop();
      this.notifySessionExpired(result.reason);
      this.showFloatingPill('ERP session expired. Login normally to sync new attendance.', 'warning', false);
      return result;
    }

    if (result.status === 'success') {
      const data = result.data;
      if (!this.hasSynced || forceNotify) {
        this.hasSynced = true;
        this.sendAttendanceToBackground(data);
        this.showFloatingPill(
          `Synced! Overall Attendance: ${data.overall.percentage}% (${data.overall.present}/${data.overall.totalLectures})`,
          'success',
          true
        );
        this.keepAlive.start();
      }
      return result;
    }

    if (forceNotify && result.status === 'not_attendance_page') {
      this.showFloatingPill('Not on Attendance page. Navigate to Student Attendance in ERP.', 'warning', false);
    }

    return result;
  }

  private setupMutationObserver(): void {
    let timeoutId: number | null = null;
    this.observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (!this.hasSynced) {
          this.checkAndParse();
        }
      }, 600);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private sendAttendanceToBackground(payload: any): void {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'ATTENDANCE_PARSED',
        payload,
      });
    }
  }

  private notifySessionExpired(reason: string): void {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'SESSION_EXPIRED',
        payload: { url: window.location.href, timestamp: Date.now() },
      });
    }
  }

  private showFloatingPill(message: string, status: 'success' | 'warning' | 'danger', showDashboardBtn: boolean): void {
    let container = document.getElementById('abes-tracker-pill-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'abes-tracker-pill-container';
      document.body.appendChild(container);
    }

    const iconSvg = status === 'success'
      ? `<svg class="abes-tracker-icon" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
      : `<svg class="abes-tracker-icon" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;

    const dashboardBtn = showDashboardBtn
      ? `<button id="abes-btn-open-dash" class="abes-tracker-btn">Open Dashboard</button>`
      : '';

    container.innerHTML = `
      <div class="abes-tracker-pill status-${status}">
        ${iconSvg}
        <span class="abes-tracker-text">${message}</span>
        ${dashboardBtn}
        <button id="abes-btn-pill-close" class="abes-tracker-close" title="Dismiss">&times;</button>
      </div>
    `;

    // Attach click events
    const closeBtn = container.querySelector('#abes-btn-pill-close');
    closeBtn?.addEventListener('click', () => {
      container?.remove();
    });

    const openBtn = container.querySelector('#abes-btn-open-dash');
    openBtn?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        window.open(chrome.runtime.getURL('dashboard/index.html'), '_blank');
      } else {
        window.open('http://localhost:5173', '_blank');
      }
    });

    // Auto dismiss after 8 seconds
    window.setTimeout(() => {
      if (container && document.body.contains(container)) {
        container.style.opacity = '0';
        window.setTimeout(() => container?.remove(), 400);
      }
    }, 8000);
  }
}

// Instantiate on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ABESContentController());
} else {
  new ABESContentController();
}
