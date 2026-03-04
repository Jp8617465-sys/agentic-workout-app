// Banister Impulse-Response Model
// fitness(t)  = K1 * Σ [ TL(i) * exp(-(t-i)/tau_fitness) ]
// fatigue(t)  = K2 * Σ [ TL(i) * exp(-(t-i)/tau_fatigue) ]
// performance = fitness - fatigue

const TAU_FITNESS = 45; // days — long-term fitness adaptation
const TAU_FATIGUE = 15; // days — short-term fatigue accumulation
const K1 = 1.0; // fitness gain coefficient
const K2 = 2.0; // fatigue gain coefficient (fatigue builds ~2× faster)

export interface TrainingLoadEntry {
  date: string; // "YYYY-MM-DD"
  totalVolume: number; // kg × reps across session
  averageRpe: number; // 1–10 scale
}

export interface FitnessFatigueResult {
  fitness: number;
  fatigue: number;
  performanceScore: number; // fitness - fatigue; positive = ready to perform
  trainingLoad: number; // today's acute training load contribution
}

function daysBetween(dateA: string, dateB: string): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.abs(msB - msA) / (1000 * 60 * 60 * 24);
}

// Training load scales volume by RPE intensity (0.5–1.0 factor)
function computeTrainingLoad(totalVolume: number, averageRpe: number): number {
  const rpeFactor = 0.5 + (averageRpe / 10) * 0.5;
  return totalVolume * rpeFactor;
}

export function computeFitnessFatigue(
  history: TrainingLoadEntry[],
  targetDate: string,
): FitnessFatigueResult {
  let fitness = 0;
  let fatigue = 0;
  let todayTL = 0;

  for (const entry of history) {
    const daysDiff = daysBetween(entry.date, targetDate);

    // Skip negligible contributions (>3 time constants away)
    if (daysDiff > TAU_FITNESS * 3) continue;

    const tl = computeTrainingLoad(entry.totalVolume, entry.averageRpe);

    if (entry.date === targetDate) {
      todayTL = tl;
    }

    fitness += K1 * tl * Math.exp(-daysDiff / TAU_FITNESS);
    fatigue += K2 * tl * Math.exp(-daysDiff / TAU_FATIGUE);
  }

  return {
    fitness,
    fatigue,
    performanceScore: fitness - fatigue,
    trainingLoad: todayTL,
  };
}
