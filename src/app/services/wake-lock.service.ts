import { Injectable } from '@angular/core';

/**
 * Service to manage Wake Lock API and prevent screen from sleeping during game.
 * 
 * Uses two strategies:
 * 1. Wake Lock API (Chrome, Edge, Safari 16.4+)
 * 2. Hidden video fallback (Safari < 16.4, Firefox)
 */
@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  private wakeLock: any = null;
  private isWakeLockSupported = false;
  private videoElement: HTMLVideoElement | null = null;
  private videoInitialized = false;

  constructor() {
    // Check if Wake Lock API is supported
    this.isWakeLockSupported = 'wakeLock' in navigator;
    
    console.log('=== WAKE LOCK SERVICE INITIALIZED ===');
    console.log('Wake Lock API supported:', this.isWakeLockSupported);
    console.log('Browser:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
  }

  /**
   * Request wake lock to keep screen awake
   * Uses Wake Lock API if available, otherwise falls back to video method
   */
  async requestWakeLock(): Promise<boolean> {
    console.log('\n🔒 REQUESTING WAKE LOCK...');
    
    // Try Wake Lock API first
    if (this.isWakeLockSupported) {
      const success = await this.requestNativeWakeLock();
      if (success) {
        console.log('✅ Wake Lock acquired successfully!');
        return true;
      }
      console.warn('⚠️ Wake Lock API failed, trying video fallback...');
    }

    // Fallback to video method
    return this.requestVideoWakeLock();
  }

  /**
   * Try to acquire wake lock using native API
   */
  private async requestNativeWakeLock(): Promise<boolean> {
    try {
      console.log('📱 Trying native Wake Lock API...');
      
      // Request a screen wake lock
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      
      console.log('🎉 Native Wake Lock ACQUIRED!');
      console.log('Wake Lock object:', this.wakeLock);

      // Listen for wake lock release
      this.wakeLock.addEventListener('release', () => {
        console.log('🔓 Native Wake Lock was released');
        this.wakeLock = null;
      });

      // Handle visibility change
      this.setupVisibilityHandler();

      return true;
    } catch (err: any) {
      console.error('❌ Native Wake Lock FAILED:');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      return false;
    }
  }

  /**
   * Fallback method using hidden video element
   * Works on Safari < 16.4 and Firefox
   */
  private requestVideoWakeLock(): boolean {
    try {
      console.log('🎥 Trying video fallback method...');

      if (!this.videoInitialized) {
        // Create invisible video element
        this.videoElement = document.createElement('video');
        
        // Set video attributes
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('muted', '');
        this.videoElement.muted = true;
        this.videoElement.loop = true;
        
        // Make it invisible but still playing
        this.videoElement.style.position = 'fixed';
        this.videoElement.style.top = '-1px';
        this.videoElement.style.left = '-1px';
        this.videoElement.style.width = '1px';
        this.videoElement.style.height = '1px';
        this.videoElement.style.opacity = '0.01';
        this.videoElement.style.pointerEvents = 'none';

        // Create a 1-second blank video (base64 encoded)
        // This is a minimal WebM video that's essentially blank
        const videoData = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb29tZUaJx4+BAUKfgQFC';
        
        this.videoElement.src = videoData;
        
        // Add to DOM
        document.body.appendChild(this.videoElement);
        
        this.videoInitialized = true;
        console.log('🎥 Video element created and added to DOM');
      }

      // Play the video
      const playPromise = this.videoElement!.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Video fallback ACTIVE - screen should stay awake');
          })
          .catch((err) => {
            console.error('❌ Video playback failed:', err);
          });
      }

      return true;
    } catch (err: any) {
      console.error('❌ Video fallback FAILED:', err);
      return false;
    }
  }

  /**
   * Setup handler for page visibility changes
   */
  private setupVisibilityHandler(): void {
    const handler = async () => {
      console.log('👁️ Visibility changed:', document.visibilityState);
      
      if (document.visibilityState === 'visible' && this.wakeLock === null) {
        console.log('🔄 Page visible again, re-acquiring wake lock...');
        await this.requestNativeWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handler);
  }

  /**
   * Release wake lock and allow screen to sleep normally
   */
  async releaseWakeLock(): Promise<void> {
    console.log('\n🔓 RELEASING WAKE LOCK...');

    // Release native wake lock
    if (this.wakeLock !== null) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('✅ Native Wake Lock released');
      } catch (err: any) {
        console.error('❌ Failed to release native Wake Lock:', err);
      }
    }

    // Stop video fallback
    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.src = '';
        if (this.videoElement.parentNode) {
          this.videoElement.parentNode.removeChild(this.videoElement);
        }
        this.videoElement = null;
        this.videoInitialized = false;
        console.log('✅ Video fallback stopped and removed');
      } catch (err: any) {
        console.error('❌ Failed to stop video fallback:', err);
      }
    }

    console.log('✅ All wake locks released');
  }

  /**
   * Check if any wake lock is currently active
   */
  isActive(): boolean {
    return this.wakeLock !== null || (this.videoElement !== null && !this.videoElement.paused);
  }

  /**
   * Check if Wake Lock API is supported on this device
   */
  isWakeLockSupported(): boolean {
    return this.isWakeLockSupported;
  }

  /**
   * Get current wake lock status for debugging
   */
  getStatus(): string {
    const status = [];
    
    if (this.wakeLock !== null) {
      status.push('Native Wake Lock: ACTIVE');
    }
    
    if (this.videoElement && !this.videoElement.paused) {
      status.push('Video Fallback: ACTIVE');
    }
    
    if (status.length === 0) {
      return 'No wake lock active';
    }
    
    return status.join(', ');
  }
}