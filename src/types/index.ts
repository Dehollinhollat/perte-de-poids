export interface UserProfile {
  id: string;
  name?: string;
  sex: 'homme' | 'femme' | 'autre';
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
  startDate: string;
  initialBMI: number;
  onboardingCompleted: boolean;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  bmi: number;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  date: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  containsAddedSugar: boolean;
  notes?: string;
}

export interface BMIResult {
  value: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  label: string;
  color: string;
  interpretation: string;
}

export interface HydrationLog {
  id: string;
  date: string;
  time: string;
  amount: number; // ml
}

export interface SleepEntry {
  id: string;
  date: string; // date of wake-up
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  duration: number; // hours, decimal
  quality?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  waist?: number; // cm
  hips?: number; // cm
  chest?: number; // cm
  arms?: number; // cm
  thighs?: number; // cm
  whr?: number; // waist / hips
}

export interface ActivityEntry {
  id: string;
  date: string;
  type: 'walking' | 'cycling' | 'swimming' | 'yoga' | 'strength_light' | 'running' | 'hiit';
  duration: number; // minutes
  intensity: 'light' | 'moderate' | 'high';
  caloriesBurned: number;
  notes?: string;
}

export interface ActivityLevel {
  current: 'rest' | 'light' | 'moderate' | 'high';
  label: string;
  canProgress: boolean;
  progressCondition: string;
  progressDays: number;
  progressTarget: number;
  unlockedActivities: string[];
  lockedActivities: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'weight' | 'nutrition' | 'hydration' | 'sleep' | 'activity' | 'streak';
  requirement: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface Reminder {
  id: string;
  type: 'weight' | 'water' | 'meal' | 'photo' | 'sleep';
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekly';
  dayOfWeek?: number;
  message: string;
  label: string;
}

export interface BodyCompositionEntry {
  id: string;
  date: string;
  weight: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  waterPct?: number;
  bmr?: number;
  bodyAge?: number;
  bmi?: number;
  source: 'fitdays' | 'manual';
}

export interface FastingSession {
  id: string;
  startTime: string;
  endTime?: string;
  targetHours: number;
  completed: boolean;
}

export interface FastingSettings {
  enabled: boolean;
  targetHours: number;
  windowStart: string;
  windowEnd: string;
}

export interface Challenge {
  id: string;
  type: 'water' | 'sugar' | 'activity' | 'sleep' | 'calories';
  startDate: string; // YYYY-MM-DD
  completed: boolean;
  completedDate?: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  isFavorite: boolean;
  createdAt: string;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  breakfast: string | null; // MealTemplate id
  lunch: string | null;
  dinner: string | null;
  snacks: string[]; // MealTemplate ids
}

export interface BedtimeSettings {
  wakeUpTime: string; // HH:MM
  targetSleepHours: number;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
}
