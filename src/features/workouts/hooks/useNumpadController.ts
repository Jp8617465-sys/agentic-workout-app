import { useState, useCallback, useRef } from "react";
import type { WorkoutExercise } from "../types";

export interface ActiveFieldType {
  exerciseIndex: number;
  setIndex: number;
  field: "weight" | "reps" | "rpe";
}

export interface NumpadValue {
  exerciseIndex: number;
  setIndex: number;
  field: "weight" | "reps" | "rpe";
  value: number | null;
}

export interface UseNumpadControllerInput {
  exercises: WorkoutExercise[];
  onValueChange: (change: NumpadValue) => void;
}

export interface UseNumpadControllerOutput {
  activeField: ActiveFieldType | null;
  handleFieldPress: (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe") => void;
  handleNumpadInput: (digit: string) => void;
  handleNumpadBackspace: () => void;
  handleNumpadDecimal: () => void;
  submitValue: () => void;
  getDisplayValue: () => string;
}

/**
 * Manages numpad input state and validation for workout exercise set fields.
 * Maintains an input buffer to capture user keystrokes and validates based on field type.
 *
 * Validation rules:
 * - Weight/RPE: Allow decimals (e.g., "10.5")
 * - Reps: Integers only, no decimals
 * - All fields: Prevent leading zeros and negative numbers
 */
export function useNumpadController(input: UseNumpadControllerInput): UseNumpadControllerOutput {
  const [activeField, setActiveField] = useState<ActiveFieldType | null>(null);
  const inputBuffer = useRef("");

  const getCurrentValue = useCallback(
    (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe"): string => {
      const currentValue = input.exercises[exerciseIndex]?.sets[setIndex]?.[field];
      return currentValue != null ? String(currentValue) : "";
    },
    [input.exercises]
  );

  const handleFieldPress = useCallback(
    (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe") => {
      inputBuffer.current = getCurrentValue(exerciseIndex, setIndex, field);
      setActiveField({ exerciseIndex, setIndex, field });
    },
    [getCurrentValue]
  );

  const handleNumpadInput = useCallback(
    (digit: string) => {
      if (!activeField) return;

      // Validate digit input
      if (!/^\d$/.test(digit)) return;

      // Prevent multiple leading zeros
      if (inputBuffer.current === "0" && digit === "0") return;

      // Clear leading zero when typing non-zero
      if (inputBuffer.current === "0" && digit !== "0") {
        inputBuffer.current = digit;
      } else {
        inputBuffer.current += digit;
      }

      // Validate parsed number
      const numValue = parseFloat(inputBuffer.current);
      if (isNaN(numValue)) {
        inputBuffer.current = inputBuffer.current.slice(0, -1);
        return;
      }

      // Update the exercise state
      input.onValueChange({
        exerciseIndex: activeField.exerciseIndex,
        setIndex: activeField.setIndex,
        field: activeField.field,
        value: numValue,
      });
    },
    [activeField, input]
  );

  const handleNumpadBackspace = useCallback(() => {
    if (!activeField) return;

    inputBuffer.current = inputBuffer.current.slice(0, -1);
    const numValue = inputBuffer.current ? parseFloat(inputBuffer.current) : null;

    input.onValueChange({
      exerciseIndex: activeField.exerciseIndex,
      setIndex: activeField.setIndex,
      field: activeField.field,
      value: isNaN(numValue as number) ? null : numValue,
    });
  }, [activeField, input]);

  const handleNumpadDecimal = useCallback(() => {
    if (!activeField) return;

    // Reps field should not allow decimals
    if (activeField.field === "reps") return;

    // Prevent multiple decimals
    if (inputBuffer.current.includes(".")) return;

    // Prevent decimal as first character
    if (!inputBuffer.current) {
      inputBuffer.current = "0.";
    } else {
      inputBuffer.current += ".";
    }
  }, [activeField]);

  const submitValue = useCallback(() => {
    if (!activeField) return;

    // Parse and validate final value
    const finalValue = inputBuffer.current ? parseFloat(inputBuffer.current) : null;

    if (finalValue === null || isNaN(finalValue)) {
      // Clear the field if no valid input
      input.onValueChange({
        exerciseIndex: activeField.exerciseIndex,
        setIndex: activeField.setIndex,
        field: activeField.field,
        value: null,
      });
    }

    // Close the numpad and clear active field
    setActiveField(null);
    inputBuffer.current = "";
  }, [activeField, input]);

  const getDisplayValue = useCallback((): string => {
    return inputBuffer.current;
  }, []);

  return {
    activeField,
    handleFieldPress,
    handleNumpadInput,
    handleNumpadBackspace,
    handleNumpadDecimal,
    submitValue,
    getDisplayValue,
  };
}
