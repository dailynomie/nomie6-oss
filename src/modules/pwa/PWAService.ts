import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'

export interface PWAStatus {
  isSupported: boolean
  isRegistered: boolean
  updateAvailable: boolean
  isOfflineReady: boolean
}

export class PWAService {
  private static instance: PWAService

  private registration: ServiceWorkerRegistration | null = null
  private updateCheckInterval: number = 60 * 60 * 1000 // 60 minutes
  private updateCheckTimer: NodeJS.Timeout | null = null

  // Public stores
  readonly needRefresh: Writable<boolean> = writable(false)
  readonly offlineReady: Writable<boolean> = writable(false)

  private constructor() {}

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  /**
   * Initialize PWA registration
   * Should be called once during app startup
   */
  async initialize(): Promise<void> {
    if (this.registration) {
      return // Already initialized
    }

    // Check if we're in dev mode (vite-plugin-pwa doesn't provide virtual module in dev)
    const isDev = import.meta.env.DEV
    if (isDev) {
      console.log('[PWA] Dev mode detected - PWA features limited (full support in production build)')
      return
    }

    try {
      // Import useRegisterSW at runtime to avoid build issues
      const { useRegisterSW } = await import('virtual:pwa-register/svelte')

      const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
        onRegistered: (registration) => {
          this.registration = registration
          if (registration) {
            console.log('[PWA] Service Worker registered', {
              scope: registration.scope,
              active: !!registration.active,
              installing: !!registration.installing,
              waiting: !!registration.waiting,
            })
          }
        },
        onRegisterError: (error) => {
          console.error('[PWA] Service Worker registration error', error)
        },
      })

      // Subscribe to store changes and update our internal state
      offlineReady.subscribe((value) => {
        this.offlineReady.set(value)
      })

      needRefresh.subscribe((value) => {
        this.needRefresh.set(value)
      })

      // Store the update function for later use
      this._updateServiceWorker = updateServiceWorker

      // Start periodic update checks
      this.startUpdateChecks()
    } catch (error) {
      console.error('[PWA] Failed to initialize PWA', error)
    }
  }

  /**
   * Check for updates now (without waiting for interval)
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      console.warn('[PWA] Service Worker not registered, cannot check for updates')
      return false
    }

    try {
      await this.registration.update()
      // Check if there's a waiting or installing SW
      const hasUpdate = !!this.registration.waiting || !!this.registration.installing
      if (hasUpdate) {
        console.log('[PWA] Update available')
        this.needRefresh.set(true)
      }
      return hasUpdate
    } catch (error) {
      console.error('[PWA] Error checking for updates', error)
      return false
    }
  }

  /**
   * Apply the pending update (reload the page with new version)
   */
  async applyUpdate(): Promise<void> {
    try {
      if (this._updateServiceWorker) {
        await this._updateServiceWorker(true)
      } else {
        console.warn('[PWA] Update function not available, reloading page')
        window.location.reload()
      }
    } catch (error) {
      console.error('[PWA] Error applying update', error)
    }
  }

  /**
   * Dismiss the update notification
   */
  dismissUpdateNotification(): void {
    this.needRefresh.set(false)
  }

  /**
   * Dismiss the offline ready notification
   */
  dismissOfflineNotification(): void {
    this.offlineReady.set(false)
  }

  /**
   * Get current PWA status
   */
  getStatus(): PWAStatus {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      updateAvailable: false, // Would need to check registration state
      isOfflineReady: false, // Would need to check from store
    }
  }

  /**
   * Unregister the service worker (cleanup)
   */
  async unregister(): Promise<void> {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer)
      this.updateCheckTimer = null
    }

    if (this.registration) {
      try {
        await this.registration.unregister()
        this.registration = null
        console.log('[PWA] Service Worker unregistered')
      } catch (error) {
        console.error('[PWA] Error unregistering Service Worker', error)
      }
    }
  }

  // Private methods

  private _updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null

  private startUpdateChecks(): void {
    // Initial check immediately
    this.checkForUpdates()

    // Then check on interval
    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates()
    }, this.updateCheckInterval)

    // Clear interval on page unload
    window.addEventListener('beforeunload', () => {
      if (this.updateCheckTimer) {
        clearInterval(this.updateCheckTimer)
      }
    })
  }
}

// Export singleton instance
export const pwService = PWAService.getInstance()
