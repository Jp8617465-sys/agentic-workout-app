import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { colors } from "../constants/colors";

export interface SyncStatusBadgeProps {
  /**
   * Whether sync is currently in progress
   */
  isSyncing?: boolean;

  /**
   * Whether there are pending items to sync
   */
  hasPending?: boolean;

  /**
   * Whether the last sync had errors
   */
  hasError?: boolean;

  /**
   * Show/hide the badge
   */
  visible?: boolean;
}

/**
 * Displays sync status badge showing:
 * - Syncing in progress (spinner)
 * - Pending items (offline icon)
 * - Last sync error (error icon)
 */
export function SyncStatusBadge({
  isSyncing = false,
  hasPending = false,
  hasError = false,
  visible = true,
}: SyncStatusBadgeProps) {
  if (!visible || (!isSyncing && !hasPending && !hasError)) {
    return null;
  }

  if (isSyncing) {
    return (
      <View className="flex-row items-center gap-2 rounded-full bg-blue-500 px-3 py-1">
        <ActivityIndicator size="small" color="white" />
        <Text className="text-sm font-medium text-white">Syncing...</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View className="flex-row items-center gap-2 rounded-full bg-red-500 px-3 py-1">
        <Text className="text-lg text-white">⚠️</Text>
        <Text className="text-sm font-medium text-white">Sync Error</Text>
      </View>
    );
  }

  if (hasPending) {
    return (
      <View className="flex-row items-center gap-2 rounded-full bg-orange-500 px-3 py-1">
        <Text className="text-lg text-white">📱</Text>
        <Text className="text-sm font-medium text-white">Offline</Text>
      </View>
    );
  }

  return null;
}
