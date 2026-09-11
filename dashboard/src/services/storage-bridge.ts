import { AttendanceSnapshot, AttendanceStoreData } from '../../../shared/src/types.js';
import { MOCK_LATEST_SNAPSHOT, MOCK_HISTORY_SNAPSHOTS } from '../../../shared/src/mock-data.js';

const STORAGE_KEY = 'abes_attendance_store_v1';

export class DashboardStorageBridge {
  private static isChromeStorage(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }

  /**
   * Load store data from extension storage or local storage
   */
  public static async loadStore(): Promise<AttendanceStoreData> {
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (res) => {
          if (res && res[STORAGE_KEY] && res[STORAGE_KEY].latest) {
            resolve(res[STORAGE_KEY]);
          } else {
            // Seed with sample data if fresh extension install
            const initial: AttendanceStoreData = {
              latest: MOCK_LATEST_SNAPSHOT,
              history: MOCK_HISTORY_SNAPSHOTS,
              lastSyncTime: MOCK_LATEST_SNAPSHOT.timestamp,
              erpConnected: false,
              erpSessionExpired: false,
              keepAliveEnabled: true,
            };
            chrome.storage.local.set({ [STORAGE_KEY]: initial });
            resolve(initial);
          }
        });
      });
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.latest) return parsed;
        }
      } catch (err) {
        console.warn('LocalStorage read error:', err);
      }

      // Default to real ABES mock dataset
      const defaultStore: AttendanceStoreData = {
        latest: MOCK_LATEST_SNAPSHOT,
        history: MOCK_HISTORY_SNAPSHOTS,
        lastSyncTime: MOCK_LATEST_SNAPSHOT.timestamp,
        erpConnected: false,
        erpSessionExpired: false,
        keepAliveEnabled: true,
      };
      this.saveStore(defaultStore);
      return defaultStore;
    }
  }

  /**
   * Save store data
   */
  public static async saveStore(store: AttendanceStoreData): Promise<void> {
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: store }, () => resolve());
      });
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      } catch (err) {
        console.warn('LocalStorage write error:', err);
      }
    }
  }

  /**
   * Resets data to default ABES college mock dataset
   */
  public static async resetToDemo(): Promise<AttendanceStoreData> {
    const demo: AttendanceStoreData = {
      latest: MOCK_LATEST_SNAPSHOT,
      history: MOCK_HISTORY_SNAPSHOTS,
      lastSyncTime: Date.now(),
      erpConnected: true,
      erpSessionExpired: false,
      keepAliveEnabled: true,
    };
    await this.saveStore(demo);
    return demo;
  }

  /**
   * Export all data to JSON file
   */
  public static exportBackup(store: AttendanceStoreData): void {
    const jsonStr = JSON.stringify(store, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abes_attendance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Subscribe to storage changes
   */
  public static subscribe(callback: (store: AttendanceStoreData) => void): () => void {
    if (this.isChromeStorage()) {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
          callback(changes[STORAGE_KEY].newValue);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    } else {
      const listener = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            callback(JSON.parse(e.newValue));
          } catch {}
        }
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    }
  }
}
