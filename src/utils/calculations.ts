import { BMIResult, UserProfile, SleepEntry, ActivityLevel, HydrationLog } from '../types';

export function calculateBMI(weight: number, height: number): BMIResult {
  const bmi = weight / Math.pow(height / 100, 2);
  const value = Number(bmi.toFixed(1));

  let category: BMIResult['category'];
  let label: string;
  let color: string;
  let interpretation: string;

  if (value < 18.5) {
    category = 'underweight';
    label = 'Sous-poids';
    color = '#3B82F6';
    interpretation = 'IMC inferieur a la normale.';
  } else if (value < 25) {
    category = 'normal';
    label = 'Normal';
    color = '#10B981';
    interpretation = 'IMC dans la fourchette normale.';
  } else if (value < 30) {
    category = 'overweight';
    label = 'Surpoids';
    color = '#F59E0B';
    interpretation = 'IMC indique un surpoids.';
  } else {
    category = 'obese';
    label = 'Obesite';
    color = '#EF4444';
    interpretation = 'Consultez un medecin.';
  }

  return { value, category, label, color, interpretation };
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  sex: 'homme' | 'femme' | 'autre'
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'homme' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: number): number {
  return Math.round(bmr * activityLevel);
}

export function calculateTargetCalories(profile: UserProfile): number {
  const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.sex);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const target = tdee - 700;
  const min = profile.sex === 'homme' ? 1500 : 1200;
  return Math.max(target, min);
}

// ─── Hydration ───────────────────────────────────────────────────────────────

export function defaultHydrationGoal(weightKg: number): number {
  return Math.round(weightKg * 35);
}

export function getHydrationStreak(logs: HydrationLog[], goalMl: number): number {
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;

  for (let i = 1; i <= 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = logs
      .filter(l => l.date === dateStr)
      .reduce((s, l) => s + l.amount, 0);
    if (dayTotal >= goalMl) {
      streak++;
    } else {
      break;
    }
  }

  const todayTotal = logs
    .filter(l => l.date === today)
    .reduce((s, l) => s + l.amount, 0);
  if (todayTotal >= goalMl) streak++;

  return streak;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export const ACTIVITY_META: Record<string, { label: string; met: number; intensity: 'light' | 'moderate' | 'high' }> = {
  walking:        { label: 'Marche',              met: 3.5,  intensity: 'light' },
  yoga:           { label: 'Yoga',                met: 2.5,  intensity: 'light' },
  cycling:        { label: 'Velo',                met: 6.0,  intensity: 'moderate' },
  swimming:       { label: 'Natation',            met: 5.5,  intensity: 'moderate' },
  strength_light: { label: 'Musculation legere',  met: 3.0,  intensity: 'moderate' },
  running:        { label: 'Course',              met: 9.0,  intensity: 'high' },
  hiit:           { label: 'HIIT',                met: 12.0, intensity: 'high' },
};

export function calculateCaloriesBurned(
  type: string,
  durationMin: number,
  weightKg: number
): number {
  const met = ACTIVITY_META[type]?.met ?? 3.0;
  return Math.round(met * weightKg * (durationMin / 60));
}

function getDaysAbove(sleepHistory: SleepEntry[], threshold: number, window: number): number {
  let count = 0;
  for (let i = 0; i < window; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = sleepHistory.find(s => s.date === dateStr);
    if (entry && entry.duration >= threshold) count++;
  }
  return count;
}

export function checkActivityLevel(sleepHistory: SleepEntry[]): ActivityLevel {
  const last7 = sleepHistory.slice(0, 7);
  const avg7 = last7.length > 0
    ? last7.reduce((s, e) => s + e.duration, 0) / last7.length
    : 0;

  const last30 = sleepHistory.slice(0, 30);
  const avg30 = last30.length > 0
    ? last30.reduce((s, e) => s + e.duration, 0) / last30.length
    : 0;

  if (avg7 < 6) {
    const progressDays = getDaysAbove(sleepHistory, 6, 7);
    return {
      current: 'rest',
      label: 'Repos Obligatoire',
      canProgress: true,
      progressCondition: 'Dormez 6h+ pendant 7 jours',
      progressDays,
      progressTarget: 7,
      unlockedActivities: ['Marche legere (15-20 min)', 'Etirements (10 min)'],
      lockedActivities: ['Marche rapide', 'Velo', 'Natation', 'Yoga', 'Course', 'Musculation', 'HIIT'],
    };
  }

  if (avg7 < 7) {
    const progressDays = getDaysAbove(sleepHistory, 7, 7);
    return {
      current: 'light',
      label: 'Leger',
      canProgress: true,
      progressCondition: 'Dormez 7h+ pendant 7 jours',
      progressDays,
      progressTarget: 7,
      unlockedActivities: ['Marche rapide (45 min)', 'Velo tranquille (30 min)', 'Natation legere', 'Yoga', 'Squats poids du corps', 'Pompes adaptees'],
      lockedActivities: ['Course legere', 'HIIT', 'Musculation intense'],
    };
  }

  if (avg30 < 7) {
    const progressDays = getDaysAbove(sleepHistory, 7, 30);
    return {
      current: 'moderate',
      label: 'Modere',
      canProgress: true,
      progressCondition: 'Dormez 7h+ pendant 30 jours',
      progressDays,
      progressTarget: 30,
      unlockedActivities: ['Toutes activites legeres', 'Course legere (30 min)', 'Velo intensif', 'Musculation legere', 'Circuit training'],
      lockedActivities: ['HIIT 20 min', 'Musculation intense', 'Course longue'],
    };
  }

  return {
    current: 'high',
    label: 'Eleve',
    canProgress: false,
    progressCondition: 'Maximum atteint !',
    progressDays: 30,
    progressTarget: 30,
    unlockedActivities: ['Toutes activites', 'HIIT 20 min', 'Course longue', 'Musculation intense'],
    lockedActivities: [],
  };
}

// ─── Sleep insight ────────────────────────────────────────────────────────────

export interface SleepInsight {
  goodSleepWeightChange: number | null; // kg/week with 7h+ sleep
  poorSleepWeightChange: number | null; // kg/week with <6h sleep
  hasEnoughData: boolean;
}

export function calculateSleepWeightInsight(
  sleepEntries: SleepEntry[],
  weightEntries: { date: string; weight: number }[]
): SleepInsight {
  if (sleepEntries.length < 7 || weightEntries.length < 4) {
    return { goodSleepWeightChange: null, poorSleepWeightChange: null, hasEnoughData: false };
  }

  // Group by ISO week number
  const weekMap = new Map<string, { sleepHours: number[]; weights: number[] }>();

  sleepEntries.forEach(s => {
    const d = new Date(s.date + 'T00:00:00');
    const week = `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, '0')}`;
    if (!weekMap.has(week)) weekMap.set(week, { sleepHours: [], weights: [] });
    weekMap.get(week)!.sleepHours.push(s.duration);
  });

  weightEntries.forEach(w => {
    const d = new Date(w.date + 'T00:00:00');
    const week = `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, '0')}`;
    if (weekMap.has(week)) weekMap.get(week)!.weights.push(w.weight);
  });

  const goodChanges: number[] = [];
  const poorChanges: number[] = [];

  const weeks = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 1; i < weeks.length; i++) {
    const prev = weeks[i - 1][1];
    const curr = weeks[i][1];
    if (prev.weights.length === 0 || curr.weights.length === 0) continue;
    const avgSleep = prev.sleepHours.reduce((s, h) => s + h, 0) / prev.sleepHours.length;
    const weightChange = (curr.weights[0] - prev.weights[prev.weights.length - 1]);
    if (avgSleep >= 7) goodChanges.push(weightChange);
    else if (avgSleep < 6) poorChanges.push(weightChange);
  }

  return {
    goodSleepWeightChange: goodChanges.length > 0
      ? +(goodChanges.reduce((s, c) => s + c, 0) / goodChanges.length).toFixed(2)
      : null,
    poorSleepWeightChange: poorChanges.length > 0
      ? +(poorChanges.reduce((s, c) => s + c, 0) / poorChanges.length).toFixed(2)
      : null,
    hasEnoughData: goodChanges.length > 0 || poorChanges.length > 0,
  };
}
