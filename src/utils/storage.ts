export const KEYS = {
  PROFILE: 'wl_profile',
  WEIGHTS: 'wl_weights',
  MEALS: 'wl_meals',
  HYDRATION: 'wl_hydration',
  SLEEP: 'wl_sleep',
  MEASUREMENTS: 'wl_measurements',
  ACTIVITIES: 'wl_activities',
  HYDRATION_GOAL: 'wl_hydration_goal',
  ACTIVITY_GOAL: 'wl_activity_goal',
  BADGES: 'wl_badges',
  REMINDERS: 'wl_reminders',
  BODY_COMPOSITION: 'wl_body_comp',
  FASTING_SESSIONS: 'wl_fasting_sessions',
  FASTING_SETTINGS: 'wl_fasting_settings',
  THEME: 'wl_theme',
  CHALLENGES: 'wl_challenges',
  MEAL_TEMPLATES: 'wl_meal_templates',
  DAY_PLANS: 'wl_day_plans',
};

export function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function load<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T) : null;
}
