/**
 * Optional lightweight keep-alive heartbeat
 * Prevents premature ERP session timeouts while the student has the ERP tab open.
 */
export class SessionKeepAlive {
  private intervalId: number | null = null;
  private readonly intervalMs: number;

  constructor(intervalMinutes = 4) {
    this.intervalMs = intervalMinutes * 60 * 1000;
  }

  public start(): void {
    if (this.intervalId) return;

    // Ping periodically while the tab is alive
    this.intervalId = window.setInterval(() => {
      this.pingServer();
    }, this.intervalMs);

    // Initial ping
    this.pingServer();
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async pingServer(): Promise<void> {
    try {
      // Send a lightweight GET request with credentials included to touch the session
      await fetch(window.location.href, {
        method: 'HEAD',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      console.log('[ABES Attendance Tracker] Keep-alive ping sent successfully');
    } catch (err) {
      console.warn('[ABES Attendance Tracker] Keep-alive ping failed (network/CORS):', err);
    }
  }
}
