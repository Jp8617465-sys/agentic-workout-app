import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../../../stores/settingsStore";
import type { MobilityDrill } from "../services/mobility-routines";

interface ActiveHold {
  drillIndex: number;
  side: 1 | 2;
  endAt: number;
}

export interface HoldTimerState {
  drillIndex: number;
  side: 1 | 2;
  remainingSeconds: number;
}

/**
 * Counts down a hold drill, switching sides automatically. Uses an end timestamp
 * rather than tick counting so the timer stays accurate if the app is backgrounded.
 */
export function useHoldTimer(
  drills: readonly MobilityDrill[],
  onComplete: (drillIndex: number) => void,
) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const [active, setActive] = useState<ActiveHold | null>(null);
  const [now, setNow] = useState(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const buzz = useCallback(
    (type: Haptics.NotificationFeedbackType) => {
      if (hapticsEnabled) void Haptics.notificationAsync(type);
    },
    [hapticsEnabled],
  );

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active || now < active.endAt) return;
    const drill = drills[active.drillIndex];
    if (drill.perSide && active.side === 1) {
      buzz(Haptics.NotificationFeedbackType.Warning);
      setActive({
        ...active,
        side: 2,
        endAt: Date.now() + drill.amount * 1000,
      });
      return;
    }
    buzz(Haptics.NotificationFeedbackType.Success);
    setActive(null);
    onCompleteRef.current(active.drillIndex);
  }, [now, active, drills, buzz]);

  const start = useCallback(
    (drillIndex: number) => {
      const drill = drills[drillIndex];
      setNow(Date.now());
      setActive({
        drillIndex,
        side: 1,
        endAt: Date.now() + drill.amount * 1000,
      });
    },
    [drills],
  );

  const cancel = useCallback(() => setActive(null), []);

  const state: HoldTimerState | null = active
    ? {
        drillIndex: active.drillIndex,
        side: active.side,
        remainingSeconds: Math.max(0, Math.ceil((active.endAt - now) / 1000)),
      }
    : null;

  return { timer: state, start, cancel };
}
