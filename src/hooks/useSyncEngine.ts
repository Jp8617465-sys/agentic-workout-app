import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { getSyncEngine, type SyncResult } from "../lib/sync-engine";

export interface UseSyncEngineOptions {
  /**
   * Automatically sync when app comes to foreground
   */
  syncOnResume?: boolean;

  /**
   * Automatically sync on network state change
   */
  syncOnNetworkChange?: boolean;

  /**
   * Callback when sync completes
   */
  onSyncComplete?: (result: SyncResult) => void;

  /**
   * Callback when sync fails
   */
  onSyncError?: (error: Error) => void;
}

/**
 * Hook to manage SyncEngine lifecycle integration with React Native app state.
 * Handles:
 * - Syncing when app resumes from background
 * - Network state monitoring
 * - Cleanup on unmount
 */
export function useSyncEngine(options: UseSyncEngineOptions = {}) {
  const {
    syncOnResume = true,
    syncOnNetworkChange = true,
    onSyncComplete,
    onSyncError,
  } = options;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);

  const syncEngine = getSyncEngine();

  useEffect(() => {
    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Subscribe to sync events
    const unsubscribeSyncListener = syncEngine.subscribeToChanges((result) => {
      setLastSyncResult(result);
      setIsSyncing(false);

      if (onSyncComplete) {
        onSyncComplete(result);
      }
    });

    return () => {
      subscription.remove();
      unsubscribeSyncListener();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const isComingToForeground = appState.match(/inactive|background/) && nextAppState === "active";

    setAppState(nextAppState);

    if (isComingToForeground && syncOnResume) {
      await triggerSync();
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      setLastError(null);
      const result = await syncEngine.syncPending();
      setLastSyncResult(result);

      if (result.failed > 0 && result.errors.length > 0) {
        const error = new Error(
          `Sync completed with errors: ${result.errors[0].error}`
        );
        setLastError(error);
        if (onSyncError) {
          onSyncError(error);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);
      if (onSyncError) {
        onSyncError(err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    lastSyncResult,
    lastError,
    manualSync: triggerSync,
    hasPending: syncEngine.hasPending(),
  };
}
