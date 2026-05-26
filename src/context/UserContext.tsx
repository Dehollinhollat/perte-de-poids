import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile, WeightEntry, Meal, HydrationLog, SleepEntry,
  BodyMeasurement, ActivityEntry, Badge, Reminder,
  BodyCompositionEntry, FastingSession, FastingSettings,
} from '../types';
import { save, load, KEYS } from '../utils/storage';
import { defaultHydrationGoal } from '../utils/calculations';
import { BADGE_DEFINITIONS, checkBadgeCondition, BadgeCheckData } from '../utils/badges';
import { DEFAULT_REMINDERS } from '../utils/reminders';

interface UserContextType {
  profile: UserProfile | null;
  weights: WeightEntry[];
  meals: Meal[];
  hydrationLogs: HydrationLog[];
  sleepEntries: SleepEntry[];
  measurements: BodyMeasurement[];
  activities: ActivityEntry[];
  bodyComposition: BodyCompositionEntry[];
  fastingSessions: FastingSession[];
  fastingSettings: FastingSettings;

  hydrationGoalMl: number;
  activityGoalMin: number;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  badgeUnlockDates: Record<string, string>;
  allBadges: Badge[];
  newlyUnlockedBadges: Badge[];
  clearNewBadges: () => void;

  reminders: Reminder[];
  saveReminders: (r: Reminder[]) => void;

  saveProfile: (p: UserProfile) => void;
  updateHydrationGoal: (ml: number) => void;
  updateActivityGoal: (min: number) => void;
  saveFastingSettings: (s: FastingSettings) => void;

  addWeight: (entry: WeightEntry) => void;
  deleteWeight: (id: string) => void;
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: string) => void;
  addHydration: (log: HydrationLog) => void;
  deleteHydration: (id: string) => void;
  addSleep: (entry: SleepEntry) => void;
  deleteSleep: (id: string) => void;
  addMeasurement: (m: BodyMeasurement) => void;
  deleteMeasurement: (id: string) => void;
  addActivity: (entry: ActivityEntry) => void;
  deleteActivity: (id: string) => void;
  addBodyComp: (entry: BodyCompositionEntry) => void;
  deleteBodyComp: (id: string) => void;
  addFastingSession: (session: FastingSession) => void;
  updateFastingSession: (id: string, updates: Partial<FastingSession>) => void;
  deleteFastingSession: (id: string) => void;

  todaysMeals: Meal[];
  todaysCalories: number;
  todaysHydration: number;
  todaysActivityMin: number;
  todaysActivityCal: number;
  last7SleepAvg: number;
}

const DEFAULT_FASTING: FastingSettings = {
  enabled: false,
  targetHours: 16,
  windowStart: '20:00',
  windowEnd: '12:00',
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => load<UserProfile>(KEYS.PROFILE));
  const [weights, setWeights] = useState<WeightEntry[]>(() => load<WeightEntry[]>(KEYS.WEIGHTS) ?? []);
  const [meals, setMeals] = useState<Meal[]>(() => load<Meal[]>(KEYS.MEALS) ?? []);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(() => load<HydrationLog[]>(KEYS.HYDRATION) ?? []);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>(() => load<SleepEntry[]>(KEYS.SLEEP) ?? []);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() => load<BodyMeasurement[]>(KEYS.MEASUREMENTS) ?? []);
  const [activities, setActivities] = useState<ActivityEntry[]>(() => load<ActivityEntry[]>(KEYS.ACTIVITIES) ?? []);
  const [bodyComposition, setBodyComposition] = useState<BodyCompositionEntry[]>(() => load<BodyCompositionEntry[]>(KEYS.BODY_COMPOSITION) ?? []);
  const [fastingSessions, setFastingSessions] = useState<FastingSession[]>(() => load<FastingSession[]>(KEYS.FASTING_SESSIONS) ?? []);
  const [fastingSettings, setFastingSettings] = useState<FastingSettings>(() => load<FastingSettings>(KEYS.FASTING_SETTINGS) ?? DEFAULT_FASTING);

  const [hydrationGoalMl, setHydrationGoalMl] = useState<number>(() => {
    const custom = load<number>(KEYS.HYDRATION_GOAL);
    if (custom != null) return custom;
    const p = load<UserProfile>(KEYS.PROFILE);
    return p ? defaultHydrationGoal(p.currentWeight) : 2000;
  });
  const [activityGoalMin, setActivityGoalMin] = useState<number>(() => load<number>(KEYS.ACTIVITY_GOAL) ?? 30);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => load<'light' | 'dark'>(KEYS.THEME) ?? 'light');
  const [badgeUnlockDates, setBadgeUnlockDates] = useState<Record<string, string>>(() => load<Record<string, string>>(KEYS.BADGES) ?? {});
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<Badge[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>(() => load<Reminder[]>(KEYS.REMINDERS) ?? DEFAULT_REMINDERS);

  // Apply theme on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Badge checking effect — runs when any tracked data changes
  useEffect(() => {
    if (!profile) return;
    const data: BadgeCheckData = { profile, weights, meals, hydrationLogs, sleepEntries, activities, hydrationGoalMl };
    const today = new Date().toISOString().split('T')[0];
    const newDates: Record<string, string> = {};
    const newlyUnlocked: Badge[] = [];

    BADGE_DEFINITIONS.forEach(def => {
      if (badgeUnlockDates[def.id]) return;
      if (checkBadgeCondition(def.id, data)) {
        newDates[def.id] = today;
        newlyUnlocked.push({ ...def, unlocked: true, unlockedDate: today });
      }
    });

    if (newlyUnlocked.length > 0) {
      const updatedDates = { ...badgeUnlockDates, ...newDates };
      setBadgeUnlockDates(updatedDates);
      save(KEYS.BADGES, updatedDates);
      setNewlyUnlockedBadges(prev => [...prev, ...newlyUnlocked]);
    }
  // intentionally exclude badgeUnlockDates to avoid infinite loop — stale closure is safe here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, weights, meals, hydrationLogs, sleepEntries, activities]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    save(KEYS.THEME, next);
  };

  const clearNewBadges = () => setNewlyUnlockedBadges([]);
  const saveReminders = (r: Reminder[]) => { setReminders(r); save(KEYS.REMINDERS, r); };

  const saveProfile = (p: UserProfile) => { setProfile(p); save(KEYS.PROFILE, p); };
  const updateHydrationGoal = (ml: number) => { setHydrationGoalMl(ml); save(KEYS.HYDRATION_GOAL, ml); };
  const updateActivityGoal = (min: number) => { setActivityGoalMin(min); save(KEYS.ACTIVITY_GOAL, min); };
  const saveFastingSettings = (s: FastingSettings) => { setFastingSettings(s); save(KEYS.FASTING_SETTINGS, s); };

  const addWeight = (entry: WeightEntry) => {
    const updated = [entry, ...weights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setWeights(updated); save(KEYS.WEIGHTS, updated);
  };
  const deleteWeight = (id: string) => { const u = weights.filter(w => w.id !== id); setWeights(u); save(KEYS.WEIGHTS, u); };

  const addMeal = (meal: Meal) => { const u = [meal, ...meals]; setMeals(u); save(KEYS.MEALS, u); };
  const deleteMeal = (id: string) => { const u = meals.filter(m => m.id !== id); setMeals(u); save(KEYS.MEALS, u); };

  const addHydration = (log: HydrationLog) => { const u = [log, ...hydrationLogs]; setHydrationLogs(u); save(KEYS.HYDRATION, u); };
  const deleteHydration = (id: string) => { const u = hydrationLogs.filter(h => h.id !== id); setHydrationLogs(u); save(KEYS.HYDRATION, u); };

  const addSleep = (entry: SleepEntry) => {
    const updated = [entry, ...sleepEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSleepEntries(updated); save(KEYS.SLEEP, updated);
  };
  const deleteSleep = (id: string) => { const u = sleepEntries.filter(s => s.id !== id); setSleepEntries(u); save(KEYS.SLEEP, u); };

  const addMeasurement = (m: BodyMeasurement) => {
    const updated = [m, ...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMeasurements(updated); save(KEYS.MEASUREMENTS, updated);
  };
  const deleteMeasurement = (id: string) => { const u = measurements.filter(m => m.id !== id); setMeasurements(u); save(KEYS.MEASUREMENTS, u); };

  const addActivity = (entry: ActivityEntry) => {
    const updated = [entry, ...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActivities(updated); save(KEYS.ACTIVITIES, updated);
  };
  const deleteActivity = (id: string) => { const u = activities.filter(a => a.id !== id); setActivities(u); save(KEYS.ACTIVITIES, u); };

  const addBodyComp = (entry: BodyCompositionEntry) => {
    const updated = [entry, ...bodyComposition].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBodyComposition(updated); save(KEYS.BODY_COMPOSITION, updated);
  };
  const deleteBodyComp = (id: string) => { const u = bodyComposition.filter(e => e.id !== id); setBodyComposition(u); save(KEYS.BODY_COMPOSITION, u); };

  const addFastingSession = (session: FastingSession) => {
    const u = [session, ...fastingSessions]; setFastingSessions(u); save(KEYS.FASTING_SESSIONS, u);
  };
  const updateFastingSession = (id: string, updates: Partial<FastingSession>) => {
    const u = fastingSessions.map(s => s.id === id ? { ...s, ...updates } : s);
    setFastingSessions(u); save(KEYS.FASTING_SESSIONS, u);
  };
  const deleteFastingSession = (id: string) => {
    const u = fastingSessions.filter(s => s.id !== id); setFastingSessions(u); save(KEYS.FASTING_SESSIONS, u);
  };

  // Computed values
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter(m => m.date === today);
  const todaysCalories = todaysMeals.reduce((s, m) => s + m.calories, 0);
  const todaysHydration = hydrationLogs.filter(h => h.date === today).reduce((s, h) => s + h.amount, 0);
  const todaysActivities = activities.filter(a => a.date === today);
  const todaysActivityMin = todaysActivities.reduce((s, a) => s + a.duration, 0);
  const todaysActivityCal = todaysActivities.reduce((s, a) => s + a.caloriesBurned, 0);

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const last7Sleep = sleepEntries.filter(s => new Date(s.date) >= cutoff);
  const last7SleepAvg = last7Sleep.length > 0 ? last7Sleep.reduce((s, e) => s + e.duration, 0) / last7Sleep.length : 0;

  // Compute all badges for the badges page
  const allBadges: Badge[] = BADGE_DEFINITIONS.map(def => ({
    ...def,
    unlocked: !!badgeUnlockDates[def.id],
    unlockedDate: badgeUnlockDates[def.id],
  }));

  return (
    <UserContext.Provider value={{
      profile, weights, meals, hydrationLogs, sleepEntries, measurements, activities,
      bodyComposition, fastingSessions, fastingSettings,
      hydrationGoalMl, activityGoalMin,
      theme, toggleTheme,
      badgeUnlockDates, allBadges, newlyUnlockedBadges, clearNewBadges,
      reminders, saveReminders,
      saveProfile, updateHydrationGoal, updateActivityGoal, saveFastingSettings,
      addWeight, deleteWeight,
      addMeal, deleteMeal,
      addHydration, deleteHydration,
      addSleep, deleteSleep,
      addMeasurement, deleteMeasurement,
      addActivity, deleteActivity,
      addBodyComp, deleteBodyComp,
      addFastingSession, updateFastingSession, deleteFastingSession,
      todaysMeals, todaysCalories, todaysHydration,
      todaysActivityMin, todaysActivityCal, last7SleepAvg,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
