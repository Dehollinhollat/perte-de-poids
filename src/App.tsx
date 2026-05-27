import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './context/UserContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import WeightTracker from './pages/WeightTracker';
import CalorieTracker from './pages/CalorieTracker';
import Sante from './pages/Sante';
import BadgesSection from './pages/BadgesSection';
import Settings from './pages/Settings';
import ActivitySection from './pages/ActivitySection';
import PredictionsSection from './pages/PredictionsSection';
import WeeklyReport from './pages/WeeklyReport';
import BedtimeCalculator from './pages/BedtimeCalculator';
import ChallengesSection from './pages/ChallengesSection';
import TrendsSection from './pages/TrendsSection';
import MealPlanner from './pages/MealPlanner';
import BadgeToast from './components/BadgeToast';
import BottomNav, { Page } from './components/BottomNav';
import InstallBanner from './components/InstallBanner';

function ReminderScheduler() {
  const { reminders } = useUser();
  const lastFiredRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const check = () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];

      reminders.forEach(r => {
        if (!r.enabled || r.time !== currentTime) return;
        if (r.frequency === 'weekly' && r.dayOfWeek !== now.getDay()) return;
        const key = `${r.id}_${today}`;
        if (lastFiredRef.current[key]) return;
        lastFiredRef.current[key] = '1';
        try { new Notification(r.label, { body: r.message, icon: '/icon.svg' }); } catch { /* ignore */ }
      });
    };

    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  return null;
}

export default function App() {
  const { profile, newlyUnlockedBadges, clearNewBadges } = useUser();
  const [page, setPage] = useState<Page>('dashboard');
  const [toastQueue, setToastQueue] = useState<typeof newlyUnlockedBadges>([]);

  useEffect(() => {
    if (newlyUnlockedBadges.length > 0) {
      setToastQueue(prev => [...prev, ...newlyUnlockedBadges]);
      clearNewBadges();
    }
  }, [newlyUnlockedBadges, clearNewBadges]);

  const dismissToast = () => setToastQueue(prev => prev.slice(1));

  if (!profile?.onboardingCompleted) return <Onboarding />;

  return (
    <div className="app">
      <ReminderScheduler />
      <InstallBanner />

      <main className="app__main">
        {page === 'dashboard'    && <Dashboard onNavigate={setPage} />}
        {page === 'weight'       && <WeightTracker />}
        {page === 'calories'     && <CalorieTracker />}
        {page === 'activity'     && <ActivitySection />}
        {page === 'sante'        && <Sante />}
        {page === 'badges'       && <BadgesSection />}
        {page === 'settings'     && <Settings />}
        {page === 'predictions'  && <PredictionsSection />}
        {page === 'weekly_report'&& <WeeklyReport />}
        {page === 'bedtime'      && <BedtimeCalculator />}
        {page === 'challenges'   && <ChallengesSection />}
        {page === 'trends'       && <TrendsSection />}
        {page === 'meal_planner' && <MealPlanner />}
      </main>

      <BottomNav page={page} onNavigate={setPage} />

      {toastQueue.length > 0 && (
        <BadgeToast badge={toastQueue[0]} onClose={dismissToast} />
      )}
    </div>
  );
}
