import { AttendanceSnapshot, AttendanceStoreData } from '../../../shared/src/types.js';

const STORAGE_KEY = 'abes_attendance_store_v1';
const MAX_HISTORY_ENTRIES = 50;

export class ExtensionStorageManager {
  private static isChromeStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }

  /**
   * Reads current attendance store
   */
  public static async getStore(): Promise<AttendanceStoreData> {
    const defaultData: AttendanceStoreData = {
      latest: null,
      history: [],
      lastSyncTime: null,
      erpConnected: false,
      erpSessionExpired: false,
      keepAliveEnabled: true,
    };

    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (res) => {
          if (res && res[STORAGE_KEY]) {
            resolve(res[STORAGE_KEY]);
          } else {
            resolve(defaultData);
          }
        });
      });
    } else {
      // Fallback for standalone/local web preview
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return defaultData;
    }
  }

  /**
   * Saves or updates a new attendance snapshot into local storage
   */
  public static async saveSnapshot(snapshot: AttendanceSnapshot): Promise<AttendanceStoreData> {
    const current = await this.getStore();

    // Prevent duplicate consecutive snapshots if attendance numbers haven't changed within 10 minutes
    const last = current.latest;
    const isSameNumbers =
      last &&
      last.overall.totalLectures === snapshot.overall.totalLectures &&
      last.overall.present === snapshot.overall.present &&
      last.overall.absent === snapshot.overall.absent;

    let updatedHistory = [...current.history];

    if (!isSameNumbers) {
      updatedHistory.unshift(snapshot);
      if (updatedHistory.length > MAX_HISTORY_ENTRIES) {
        updatedHistory = updatedHistory.slice(0, MAX_HISTORY_ENTRIES);
      }
    } else if (updatedHistory.length > 0) {
      // Update timestamp on latest
      updatedHistory[0] = snapshot;
    } else {
      updatedHistory = [snapshot];
    }

    const updated: AttendanceStoreData = {
      ...current,
      latest: snapshot,
      history: updatedHistory,
      lastSyncTime: snapshot.timestamp,
      erpConnected: true,
      erpSessionExpired: false,
    };

    await this.setStore(updated);
    return updated;
  }

  /**
   * Marks ERP session as expired
   */
  public static async setSessionExpired(url?: string): Promise<void> {
    const current = await this.getStore();
    current.erpConnected = false;
    current.erpSessionExpired = true;
    if (url) current.erpLastCheckedUrl = url;
    await this.setStore(current);
  }

  /**
   * Toggles keep-alive idle ping preference
   */
  public static async setKeepAlive(enabled: boolean): Promise<void> {
    const current = await this.getStore();
    current.keepAliveEnabled = enabled;
    await this.setStore(current);
  }

  /**
   * Clears saved local data
   */
  public static async clearData(): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([STORAGE_KEY], () => resolve());
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private static async setStore(data: AttendanceStoreData): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => resolve());
      });
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }
  }
}
