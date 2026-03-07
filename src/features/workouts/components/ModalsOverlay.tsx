import { memo } from "react";
import { RPEModal } from "../../../components/workout/RPEModal";
import { AdaptationAlert } from "../../../components/workout/AdaptationAlert";
import type { AdaptationAction } from "../../../components/workout/AdaptationAlert";
import type { RPEModalState, AdaptationAlertState } from "../hooks/useSetLogger";

interface ModalsOverlayProps {
  rpeModalState: RPEModalState | null;
  adaptationState: AdaptationAlertState | null;
  onRPESubmit: (rpe: number) => Promise<void>;
  onRPEDismiss: () => void;
  onAdaptationAction: (action: AdaptationAction) => void;
}

/**
 * Renders modal overlays for RPE input and load adaptation alerts.
 * Manages visibility and user interactions for post-set actions.
 */
export const ModalsOverlay = memo(function ModalsOverlay({
  rpeModalState,
  adaptationState,
  onRPESubmit,
  onRPEDismiss,
  onAdaptationAction,
}: ModalsOverlayProps) {
  return (
    <>
      {rpeModalState && (
        <RPEModal
          visible={rpeModalState.visible}
          exerciseName={rpeModalState.exerciseName}
          setNumber={rpeModalState.setNumber}
          onSubmit={onRPESubmit}
          onDismiss={onRPEDismiss}
        />
      )}
      {adaptationState && (
        <AdaptationAlert
          visible={adaptationState.visible}
          exerciseName={adaptationState.exerciseName}
          deviationMagnitude={adaptationState.deviationMagnitude}
          adjustment={adaptationState.adjustment}
          onAction={onAdaptationAction}
        />
      )}
    </>
  );
});
