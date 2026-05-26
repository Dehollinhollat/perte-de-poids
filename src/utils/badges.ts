import { Badge, UserProfile, WeightEntry, Meal, HydrationLog, SleepEntry, ActivityEntry } from '../types';
import { getHydrationStreak, checkActivityLevel, calculateTargetCalories } from './calculations';

export const BADGE_DEFINITIONS: Omit<Badge, 'unlocked' | 'unlockedDate'>[] = [
  // Poids (7)
  { id: 'first_kilo',  name: 'Premier Kilo',   description: 'Perdre 1 kg',                   icon: '🥇', category: 'weight',    requirement: 'Perdez 1 kg' },
  { id: 'five_kilos',  name: '5 Kilos !',       description: 'Perdre 5 kg',                   icon: '🏅', category: 'weight',    requirement: 'Perdez 5 kg' },
  { id: 'ten_kilos',   name: '10 Kilos !',      description: 'Perdre 10 kg',                  icon: '🏆', category: 'weight',    requirement: 'Perdez 10 kg' },
  { id: 'goal_25',     name: 'Objectif 25%',    description: '25% de l\'objectif atteint',    icon: '🎯', category: 'weight',    requirement: '25% de votre objectif' },
  { id: 'goal_50',     name: 'Objectif 50%',    description: '50% de l\'objectif atteint',    icon: '🎯', category: 'weight',    requirement: '50% de votre objectif' },
  { id: 'goal_75',     name: 'Objectif 75%',    description: '75% de l\'objectif atteint',    icon: '🎯', category: 'weight',    requirement: '75% de votre objectif' },
  { id: 'goal_100',    name: 'Objectif Final',  description: 'Objectif de poids atteint !',   icon: '👑', category: 'weight',    requirement: 'Atteignez votre objectif' },
  // Nutrition (4)
  { id: 'sugar_free_7',    name: 'Sans Sucres 7j',    description: '7 jours dans l\'objectif calorique',  icon: '🍎', category: 'nutrition', requirement: '7 jours dans l\'objectif' },
  { id: 'sugar_free_14',   name: 'Sans Sucres 14j',   description: '14 jours dans l\'objectif calorique', icon: '🍏', category: 'nutrition', requirement: '14 jours dans l\'objectif' },
  { id: 'sugar_free_30',   name: 'Sans Sucres 30j',   description: '30 jours dans l\'objectif calorique', icon: '🥗', category: 'nutrition', requirement: '30 jours dans l\'objectif' },
  { id: 'perfect_deficit', name: 'Deficit Parfait',   description: '7 jours consec. sous objectif',       icon: '🔥', category: 'nutrition', requirement: '7j consecutifs sous objectif' },
  // Hydratation (3)
  { id: 'hydrated_3',  name: 'Bien Hydrate',     description: '3 jours d\'hydratation parfaite',  icon: '💧', category: 'hydration', requirement: '3 jours d\'objectif atteint' },
  { id: 'hydrated_7',  name: 'Expert Hydratation', description: '7 jours d\'hydratation parfaite', icon: '💦', category: 'hydration', requirement: '7 jours d\'objectif atteint' },
  { id: 'hydrated_30', name: 'Maitre de l\'Eau', description: '30 jours d\'hydratation parfaite', icon: '🌊', category: 'hydration', requirement: '30 jours d\'objectif atteint' },
  // Sommeil (3)
  { id: 'good_night',     name: 'Bonne Nuit',       description: 'Dormir 7h+ en une nuit',            icon: '😴', category: 'sleep', requirement: 'Dormez 7h+ en une nuit' },
  { id: 'week_rested',    name: 'Semaine Reposee',  description: '7 nuits ≥7h consecutives',          icon: '🌙', category: 'sleep', requirement: '7 nuits de 7h+' },
  { id: 'sleep_champion', name: 'Dormeur Champion', description: '30 nuits de sommeil ≥7h',           icon: '⭐', category: 'sleep', requirement: '30 nuits de 7h+' },
  // Activite (5)
  { id: 'active_beginner',  name: 'Actif Debutant', description: '3 jours d\'activite enregistres',  icon: '🚶', category: 'activity', requirement: '3 seances enregistrees' },
  { id: 'active_confirmed', name: 'Actif Confirme', description: '7 jours d\'activite enregistres',  icon: '💪', category: 'activity', requirement: '7 seances enregistrees' },
  { id: 'athlete',          name: 'Athlete',        description: '30 jours d\'activite enregistres', icon: '🏃', category: 'activity', requirement: '30 seances enregistrees' },
  { id: 'level_moderate',   name: 'Niveau Modere',  description: 'Debloquer l\'intensite moderee',   icon: '🔓', category: 'activity', requirement: 'Atteindre le niveau modere' },
  { id: 'level_high',       name: 'Niveau Expert',  description: 'Debloquer la haute intensite',     icon: '🔓', category: 'activity', requirement: 'Atteindre le niveau eleve' },
  // Streaks (3)
  { id: 'streak_7',  name: 'Streak 7',     description: '7 jours de tracking consecutifs',  icon: '🔥',       category: 'streak', requirement: '7 jours consecutifs' },
  { id: 'streak_30', name: 'Streak 30',    description: '30 jours de tracking consecutifs', icon: '🔥🔥',     category: 'streak', requirement: '30 jours consecutifs' },
  { id: 'streak_90', name: 'Streak 90',    description: '90 jours de tracking consecutifs', icon: '🔥🔥🔥', category: 'streak', requirement: '90 jours consecutifs' },
];

function countDaysUnderCalorieGoal(meals: Meal[], targetCal: number): number {
  const byDay = new Map<string, number>();
  meals.forEach(m => byDay.set(m.date, (byDay.get(m.date) ?? 0) + m.calories));
  let count = 0;
  byDay.forEach(total => { if (total > 0 && total < targetCal) count++; });
  return count;
}

function countConsecutiveDeficitDays(meals: Meal[], targetCal: number): number {
  const byDay = new Map<string, number>();
  meals.forEach(m => byDay.set(m.date, (byDay.get(m.date) ?? 0) + m.calories));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const total = byDay.get(date) ?? 0;
    if (total > 0 && total < targetCal) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function countTrackingStreak(
  weights: WeightEntry[],
  meals: Meal[],
  hydrationLogs: HydrationLog[],
  sleepEntries: SleepEntry[],
  activities: ActivityEntry[]
): number {
  const days = new Set([
    ...weights.map(w => w.date),
    ...meals.map(m => m.date),
    ...hydrationLogs.map(h => h.date),
    ...sleepEntries.map(s => s.date),
    ...activities.map(a => a.date),
  ]);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    if (days.has(date)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export interface BadgeCheckData {
  profile: UserProfile;
  weights: WeightEntry[];
  meals: Meal[];
  hydrationLogs: HydrationLog[];
  sleepEntries: SleepEntry[];
  activities: ActivityEntry[];
  hydrationGoalMl: number;
}

export function checkBadgeCondition(badgeId: string, data: BadgeCheckData): boolean {
  const { profile, weights, meals, hydrationLogs, sleepEntries, activities, hydrationGoalMl } = data;
  const currentWeight = weights[0]?.weight ?? profile.currentWeight;
  const weightLost = profile.currentWeight - currentWeight;
  const totalToLose = profile.currentWeight - profile.targetWeight;
  const progressPct = totalToLose > 0 ? (weightLost / totalToLose) * 100 : 0;

  const hydrationStreak = getHydrationStreak(hydrationLogs, hydrationGoalMl);
  const actLevel = checkActivityLevel(sleepEntries);
  const uniqueActivityDays = new Set(activities.map(a => a.date)).size;
  const goodSleepCount = sleepEntries.filter(s => s.duration >= 7).length;
  const last7Sleep = sleepEntries.slice(0, 7);
  const consecutive7Good = last7Sleep.length >= 7 && last7Sleep.slice(0, 7).every(s => s.duration >= 7);

  const targetCal = calculateTargetCalories(profile);
  const totalUnderGoal = countDaysUnderCalorieGoal(meals, targetCal);
  const consecDeficit = countConsecutiveDeficitDays(meals, targetCal);
  const trackingStreak = countTrackingStreak(weights, meals, hydrationLogs, sleepEntries, activities);

  switch (badgeId) {
    case 'first_kilo':       return weightLost >= 1;
    case 'five_kilos':       return weightLost >= 5;
    case 'ten_kilos':        return weightLost >= 10;
    case 'goal_25':          return progressPct >= 25 && totalToLose > 0;
    case 'goal_50':          return progressPct >= 50 && totalToLose > 0;
    case 'goal_75':          return progressPct >= 75 && totalToLose > 0;
    case 'goal_100':         return progressPct >= 100 && totalToLose > 0;
    case 'sugar_free_7':     return totalUnderGoal >= 7;
    case 'sugar_free_14':    return totalUnderGoal >= 14;
    case 'sugar_free_30':    return totalUnderGoal >= 30;
    case 'perfect_deficit':  return consecDeficit >= 7;
    case 'hydrated_3':       return hydrationStreak >= 3;
    case 'hydrated_7':       return hydrationStreak >= 7;
    case 'hydrated_30':      return hydrationStreak >= 30;
    case 'good_night':       return sleepEntries.some(s => s.duration >= 7);
    case 'week_rested':      return consecutive7Good;
    case 'sleep_champion':   return goodSleepCount >= 30;
    case 'active_beginner':  return uniqueActivityDays >= 3;
    case 'active_confirmed': return uniqueActivityDays >= 7;
    case 'athlete':          return uniqueActivityDays >= 30;
    case 'level_moderate':   return actLevel.current === 'moderate' || actLevel.current === 'high';
    case 'level_high':       return actLevel.current === 'high';
    case 'streak_7':         return trackingStreak >= 7;
    case 'streak_30':        return trackingStreak >= 30;
    case 'streak_90':        return trackingStreak >= 90;
    default:                 return false;
  }
}

export function computeAllBadges(
  data: BadgeCheckData,
  unlockDates: Record<string, string>
): Badge[] {
  return BADGE_DEFINITIONS.map(def => ({
    ...def,
    unlocked: !!unlockDates[def.id] || checkBadgeCondition(def.id, data),
    unlockedDate: unlockDates[def.id],
  }));
}

// Next badges the user is close to earning (locked but progress > 0)
export function getNextBadgeHints(
  data: BadgeCheckData,
  unlockDates: Record<string, string>
): { badge: Omit<Badge, 'unlocked' | 'unlockedDate'>; hint: string }[] {
  const { profile, weights, hydrationLogs, sleepEntries, activities, hydrationGoalMl } = data;
  const currentWeight = weights[0]?.weight ?? profile.currentWeight;
  const weightLost = profile.currentWeight - currentWeight;
  const hydrationStreak = getHydrationStreak(hydrationLogs, hydrationGoalMl);
  const uniqueActivityDays = new Set(activities.map(a => a.date)).size;
  const trackingStreak = countTrackingStreak(weights, data.meals, hydrationLogs, sleepEntries, activities);
  const goodSleepCount = sleepEntries.filter(s => s.duration >= 7).length;

  const hints: { badge: Omit<Badge, 'unlocked' | 'unlockedDate'>; hint: string }[] = [];

  const check = (badgeId: string, hint: string) => {
    if (!unlockDates[badgeId] && !checkBadgeCondition(badgeId, data)) {
      const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      if (def) hints.push({ badge: def, hint });
    }
  };

  if (weightLost > 0) check('first_kilo', `Plus que ${(1 - weightLost).toFixed(1)} kg`);
  if (weightLost >= 1) check('five_kilos', `Plus que ${(5 - weightLost).toFixed(1)} kg`);
  if (hydrationStreak > 0) check('hydrated_3', `Encore ${3 - hydrationStreak} jour(s)`);
  if (hydrationStreak >= 3) check('hydrated_7', `Encore ${7 - hydrationStreak} jour(s)`);
  if (uniqueActivityDays > 0) check('active_beginner', `Encore ${3 - uniqueActivityDays} seance(s)`);
  if (uniqueActivityDays >= 3) check('active_confirmed', `Encore ${7 - uniqueActivityDays} seance(s)`);
  if (trackingStreak > 0) check('streak_7', `Encore ${7 - trackingStreak} jour(s)`);
  if (trackingStreak >= 7) check('streak_30', `Encore ${30 - trackingStreak} jour(s)`);
  if (goodSleepCount > 0 && !sleepEntries.some(s => s.duration >= 7)) {
    hints.push({ badge: BADGE_DEFINITIONS.find(b => b.id === 'good_night')!, hint: 'Dormez 7h+ ce soir' });
  }

  return hints.slice(0, 3);
}
