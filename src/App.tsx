import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './context/UserContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import WeightTracker from './pages/WeightTracker';
import CalorieTracker from './pages/CalorieTracker';
import Sante from './pages/Sante';
import BadgesSection from './pages/BadgesSection';
import Settings from './pages/Settings';
import BadgeToast from './components/BadgeToast';

type Page = 'dashboard' | 'weight' | 'calories' | 'sante' | 'badges' | 'settings';

function HomeIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>; }
function ChartIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>; }
function FlameIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>; }
function HeartIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>; }
function TrophyIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21" /><line x1="12" y1="17" x2="12" y2="11" /><path d="M7 4H17v4a5 5 0 0 1-10 0V4z" /><path d="M7 4H4l1 5" /><path d="M17 4h3l-1 5" /></svg>; }
function GearIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }

const NAV_TABS: { key: Page; label: string; Icon: () => React.JSX.Element }[] = [
  { key: 'dashboard', label: 'Accueil',  Icon: HomeIcon },
  { key: 'weight',    label: 'Poids',    Icon: ChartIcon },
  { key: 'calories',  label: 'Calories', Icon: FlameIcon },
  { key: 'sante',     label: 'Sante',    Icon: HeartIcon },
  { key: 'badges',    label: 'Badges',   Icon: TrophyIcon },
  { key: 'settings',  label: 'Config',   Icon: GearIcon },
];

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

      <main className="app__main">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'weight'    && <WeightTracker />}
        {page === 'calories'  && <CalorieTracker />}
        {page === 'sante'     && <Sante />}
        {page === 'badges'    && <BadgesSection />}
        {page === 'settings'  && <Settings />}
      </main>

      <nav className="bottom-nav">
        {NAV_TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`nav-tab${page === key ? ' nav-tab--active' : ''}`}
            onClick={() => setPage(key)} type="button">
            <Icon />
            <span>{label}</span>
            {key === 'badges' && toastQueue.length === 0 && false && null}
          </button>
        ))}
      </nav>

      {toastQueue.length > 0 && (
        <BadgeToast badge={toastQueue[0]} onClose={dismissToast} />
      )}
    </div>
  );
}
