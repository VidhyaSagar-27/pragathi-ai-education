'use client';

import { useEffect, useCallback } from 'react';

const SYNC_CHANNEL_NAME = 'pragathi_db_sync';
const SYNC_STORAGE_KEY = 'pragathi_db_sync_timestamp';
const SYNC_CUSTOM_EVENT = 'pragathi_db_sync_event';

export type SyncPayload = {
  entity?: string;
  action?: string;
  timestamp: number;
};

/**
 * Broadcast a real-time data change event to all components in the current tab
 * and across all other open browser tabs/windows.
 */
export function broadcastDataChange(entity: string = 'students', action: string = 'update') {
  if (typeof window === 'undefined') return;

  const payload: SyncPayload = {
    entity,
    action,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel (Modern cross-tab communication)
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch (err) {
    // Ignore BroadcastChannel errors in restrictive environments
  }

  // 2. LocalStorage event (Fallback cross-tab communication)
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Ignore localStorage errors
  }

  // 3. CustomEvent (Immediate in-window / in-tab communication)
  try {
    window.dispatchEvent(new CustomEvent(SYNC_CUSTOM_EVENT, { detail: payload }));
  } catch (err) {
    // Ignore CustomEvent errors
  }
}

/**
 * React Hook to subscribe to automatic real-time data changes across tabs,
 * in-window events, window focus, and optional background interval polling.
 */
export function useDataSync(
  onDataChange: () => void,
  options: {
    entity?: string;
    pollIntervalMs?: number;
    enabled?: boolean;
  } = {}
) {
  const { entity, pollIntervalMs = 10000, enabled = true } = options;

  const stableCallback = useCallback(() => {
    if (!enabled) return;
    onDataChange();
  }, [onDataChange, enabled]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (!entity || event.data?.entity === entity || event.data?.entity === 'all') {
            stableCallback();
          }
        };
      }
    } catch {}

    // 2. Storage event listener (other tabs)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SYNC_STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (!entity || data?.entity === entity || data?.entity === 'all') {
            stableCallback();
          }
        } catch {
          stableCallback();
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. In-tab CustomEvent listener
    const handleCustomEvent = (event: Event) => {
      const customEvt = event as CustomEvent<SyncPayload>;
      if (!entity || customEvt.detail?.entity === entity || customEvt.detail?.entity === 'all') {
        stableCallback();
      }
    };
    window.addEventListener(SYNC_CUSTOM_EVENT, handleCustomEvent);

    // 4. Window focus listener (re-fetch when user returns to this tab)
    const handleFocus = () => {
      stableCallback();
    };
    window.addEventListener('focus', handleFocus);

    // 5. Background interval polling (periodic sync while tab is active)
    let intervalId: any = null;
    if (pollIntervalMs && pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          stableCallback();
        }
      }, pollIntervalMs);
    }

    return () => {
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SYNC_CUSTOM_EVENT, handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
      if (intervalId) clearInterval(intervalId);
    };
  }, [stableCallback, entity, pollIntervalMs, enabled]);
}
