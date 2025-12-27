import { Injectable } from '@angular/core';

/**
 * Service to manage Wake Lock API and prevent screen from sleeping during game.
 * 
 * The Wake Lock API prevents the screen from dimming or locking when the user
 * is actively playing the quiz, similar to video players like YouTube.
 */
@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  private wakeLock: any = null;
  private isSupported = false;

  constructor() {
    // Check if Wake Lock API is supported
    this.isSupported = 'wakeLock' in navigator;
    
    if (this.isSupported) {
      console.log('✅ Wake Lock API is supported');
    } else {
      console.warn('⚠️ Wake Lock API is not supported on this device');
    }
  }

  /**
   * Request wake lock to keep screen awake
   */
  async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('⚠️ Wake Lock not supported, screen may sleep');
      return false;
    }

    try {
      // Request a screen wake lock
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('🔒 Wake Lock acquired - screen will stay on');

      // Listen for wake lock release
      this.wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake Lock released');
      });

      // Re-acquire wake lock when page becomes visible again
      // (important for when user switches tabs or minimizes)
      document.addEventListener('visibilitychange', async () => {
        if (this.wakeLock !== null && document.visibilityState === 'visible') {
          await this.reacquireWakeLock();
        }
      });

      return true;
    } catch (err: any) {
      console.error(`❌ Failed to acquire Wake Lock: ${err.name}, ${err.message}`);
      return false;
    }
  }

  /**
   * Re-acquire wake lock after page becomes visible again
   */
  private async reacquireWakeLock(): Promise<void> {
    if (!this.isSupported) return;

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('🔒 Wake Lock re-acquired after page visibility change');
    } catch (err: any) {
      console.error(`❌ Failed to re-acquire Wake Lock: ${err.name}, ${err.message}`);
    }
  }

  /**
   * Release wake lock and allow screen to sleep normally
   */
  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock !== null) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('🔓 Wake Lock released manually');
      } catch (err: any) {
        console.error(`❌ Failed to release Wake Lock: ${err.name}, ${err.message}`);
      }
    }
  }

  /**
   * Check if wake lock is currently active
   */
  isActive(): boolean {
    return this.wakeLock !== null;
  }

  /**
   * Check if Wake Lock API is supported on this device
   */
  isWakeLockSupported(): boolean {
    return this.isSupported;
  }
}