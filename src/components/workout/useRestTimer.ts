import { useState, useEffect, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { workoutSession$ } from "../../stores/activeWorkoutStore";
import { workoutRepository } from "../../features/workouts/workout-repository";
import { useSettingsStore } from "../../stores/settingsStore";

interface RestTimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
}

export function useRestTimer() {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const [state, setState] = useState<RestTimerState>({
    isRunning: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateTimer = useCallback(() => {
    const restTimer = workoutSession$.restTimer.peek();
    if (!restTimer.isRunning || !restTimer.endTimestamp) {
      setState({
        isRunning: false,
        remainingSeconds: 0,
        totalSeconds: 0,
        progress: 0,
      });
      return;
    }

    const remaining = Math.max(0, restTimer.endTimestamp - Date.now()) / 1000;
    const total = restTimer.totalSeconds;
    const progress = total > 0 ? 1 - remaining / total : 0;

    if (remaining <= 0) {
      // Timer complete
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      workoutSession$.restTimer.set({
        isRunning: false,
        endTimestamp: null,
        totalSeconds: 0,
        notificationId: null,
      });
      setState({
        isRunning: false,
        remainingSeconds: 0,
        totalSeconds: total,
        progress: 1,
      });
      return;
    }

    setState({
      isRunning: true,
      remainingSeconds: remaining,
      totalSeconds: total,
      progress,
    });
  }, [hapticsEnabled]);

  useEffect(() => {
    // Check on mount if there's an active timer
    updateTimer();

    timerRef.current = setInterval(updateTimer, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [updateTimer]);

  const start = useCallback(
    async (seconds: number) => {
      const endTimestamp = Date.now() + seconds * 1000;
      const workoutId = workoutSession$.id.peek();

      workoutSession$.restTimer.set({
        isRunning: true,
        endTimestamp,
        totalSeconds: seconds,
        notificationId: null,
      });

      if (workoutId) {
        await workoutRepository.updateRestTimer(workoutId, endTimestamp);
      }

      // Schedule notification
      try {
        const notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Rest Complete",
            body: "Ready for next set",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
          },
        });
        workoutSession$.restTimer.notificationId.set(notifId);
      } catch {
        // Notifications may not be available
      }
    },
    [],
  );

  const addTime = useCallback((seconds: number) => {
    const restTimer = workoutSession$.restTimer.peek();
    if (!restTimer.isRunning || !restTimer.endTimestamp) return;

    const newEnd = restTimer.endTimestamp + seconds * 1000;
    const newTotal = restTimer.totalSeconds + seconds;
    workoutSession$.restTimer.endTimestamp.set(newEnd);
    workoutSession$.restTimer.totalSeconds.set(newTotal);
  }, []);

  const skip = useCallback(async () => {
    const notifId = workoutSession$.restTimer.notificationId.peek();
    if (notifId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notifId);
      } catch {
        // ignore
      }
    }
    workoutSession$.restTimer.set({
      isRunning: false,
      endTimestamp: null,
      totalSeconds: 0,
      notificationId: null,
    });

    const workoutId = workoutSession$.id.peek();
    if (workoutId) {
      await workoutRepository.updateRestTimer(workoutId, null);
    }
  }, []);

  return { ...state, start, addTime, skip };
}
