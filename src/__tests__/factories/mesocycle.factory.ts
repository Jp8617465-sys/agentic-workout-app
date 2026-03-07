import { faker } from "@faker-js/faker";
import type { Mesocycle, Microcycle, Prescription } from "../../types";

export interface CreateMesocycleOptions {
  id?: string;
  userId?: string;
  name?: string;
  phase?: "hypertrophy" | "strength" | "power" | "deload";
  startDate?: string;
  endDate?: string;
  weekDuration?: number;
  currentWeek?: number;
}

/**
 * Factory for creating test Mesocycle objects
 */
export function createMesocycle(
  options: CreateMesocycleOptions = {}
): Mesocycle {
  const startDate = options.startDate ?? new Date().toISOString().split("T")[0];
  const endDate =
    options.endDate ??
    new Date(new Date(startDate).getTime() + 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    name: options.name ?? `${options.phase ?? "strength"} Mesocycle`,
    phase: options.phase ?? "strength",
    startDate,
    endDate,
    weekDuration: options.weekDuration ?? 4,
    currentWeek: options.currentWeek ?? 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CreateMicrocycleOptions {
  id?: string;
  mesocycleId?: string;
  weekNumber?: number;
  startDate?: string;
  endDate?: string;
  focus?: string;
  volumeProgression?: number;
}

/**
 * Factory for creating test Microcycle objects
 */
export function createMicrocycle(
  options: CreateMicrocycleOptions = {}
): Microcycle {
  const startDate = options.startDate ?? new Date().toISOString().split("T")[0];
  const endDate =
    options.endDate ??
    new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  return {
    id: options.id ?? faker.string.uuid(),
    mesocycleId: options.mesocycleId ?? faker.string.uuid(),
    weekNumber: options.weekNumber ?? 1,
    startDate,
    endDate,
    focus: options.focus ?? "volume",
    volumeProgression: options.volumeProgression ?? 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CreatePrescriptionOptions {
  id?: string;
  microcycleId?: string;
  dayOfWeek?: number;
  exerciseName?: string;
  sets?: number;
  reps?: number;
  rpe?: number;
  restSeconds?: number;
  notes?: string;
}

/**
 * Factory for creating test Prescription objects
 */
export function createPrescription(
  options: CreatePrescriptionOptions = {}
): Prescription {
  return {
    id: options.id ?? faker.string.uuid(),
    microcycleId: options.microcycleId ?? faker.string.uuid(),
    dayOfWeek: options.dayOfWeek ?? 0,
    exerciseName: options.exerciseName ?? "Bench Press",
    sets: options.sets ?? 3,
    reps: options.reps ?? 8,
    rpe: options.rpe ?? 7,
    restSeconds: options.restSeconds ?? 180,
    notes: options.notes ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Builder for creating mesocycle with complete microcycles and prescriptions
 */
export class MesocycleBuilder {
  private mesocycleData: Mesocycle;
  private microcycles: Microcycle[] = [];
  private prescriptions: Prescription[] = [];

  constructor(options: CreateMesocycleOptions = {}) {
    this.mesocycleData = createMesocycle(options);
  }

  withWeek(
    weekNumber: number,
    focus: string = "volume"
  ): MicrocycleWeekBuilder {
    const startDate = new Date(this.mesocycleData.startDate);
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const microcycle = createMicrocycle({
      mesocycleId: this.mesocycleData.id,
      weekNumber,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      focus,
    });

    this.microcycles.push(microcycle);
    return new MicrocycleWeekBuilder(
      this,
      microcycle,
      this.prescriptions
    );
  }

  complete(): {
    mesocycle: Mesocycle;
    microcycles: Microcycle[];
    prescriptions: Prescription[];
  } {
    return {
      mesocycle: this.mesocycleData,
      microcycles: this.microcycles,
      prescriptions: this.prescriptions,
    };
  }
}

/**
 * Helper builder for adding prescriptions to a week
 */
class MicrocycleWeekBuilder {
  constructor(
    private parent: MesocycleBuilder,
    private microcycle: Microcycle,
    private prescriptions: Prescription[]
  ) {}

  withPrescription(
    dayOfWeek: number,
    exerciseName: string,
    options?: Partial<CreatePrescriptionOptions>
  ): this {
    const prescription = createPrescription({
      microcycleId: this.microcycle.id,
      dayOfWeek,
      exerciseName,
      ...options,
    });
    this.prescriptions.push(prescription);
    return this;
  }

  end(): MesocycleBuilder {
    return this.parent;
  }
}

/**
 * Presets for common mesocycle scenarios
 */
export const mesocyclePresets = {
  /**
   * 4-week strength block
   */
  strengthBlock: () =>
    new MesocycleBuilder({
      name: "Strength Block",
      phase: "strength",
      weekDuration: 4,
    })
      .withWeek(1, "volume")
      .withPrescription(0, "Bench Press", { sets: 3, reps: 8, rpe: 7 })
      .withPrescription(1, "Squat", { sets: 3, reps: 8, rpe: 7 })
      .withPrescription(2, "Deadlift", { sets: 3, reps: 5, rpe: 7 })
      .end()
      .withWeek(2, "intensity")
      .withPrescription(0, "Bench Press", { sets: 4, reps: 5, rpe: 8 })
      .withPrescription(1, "Squat", { sets: 4, reps: 5, rpe: 8 })
      .withPrescription(2, "Deadlift", { sets: 2, reps: 3, rpe: 8 })
      .end(),

  /**
   * 4-week hypertrophy block
   */
  hypertrophyBlock: () =>
    new MesocycleBuilder({
      name: "Hypertrophy Block",
      phase: "hypertrophy",
      weekDuration: 4,
    })
      .withWeek(1, "volume")
      .withPrescription(0, "Bench Press", { sets: 4, reps: 10, rpe: 6 })
      .withPrescription(1, "Incline DB Press", { sets: 3, reps: 12, rpe: 6 })
      .end(),

  /**
   * Deload week (reduced volume)
   */
  deloadWeek: () =>
    new MesocycleBuilder({
      name: "Deload",
      phase: "deload",
      weekDuration: 1,
    })
      .withWeek(1, "recovery")
      .withPrescription(0, "Bench Press", { sets: 2, reps: 8, rpe: 5 })
      .withPrescription(1, "Squat", { sets: 2, reps: 8, rpe: 5 })
      .end(),
};
