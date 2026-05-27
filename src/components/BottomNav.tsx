import React, { useState } from 'react';

export type Page =
  | 'dashboard' | 'weight' | 'calories' | 'activity'
  | 'sante' | 'badges' | 'settings'
  | 'predictions' | 'weekly_report' | 'bedtime' | 'challenges' | 'trends' | 'meal_planner';

interface Props {
  page: Page;
  onNavigate: (page: Page) => void;
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18V6"/><path d="M18 18V6"/>
      <path d="M4 7h4"/><path d="M16 7h4"/>
      <path d="M4 17h4"/><path d="M16 17h4"/>
      <path d="M8 12h8"/>
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  );
}

const MAIN_TABS: { id: Page | 'more'; label: string; Icon: () => React.JSX.Element }[] = [
  { id: 'dashboard', label: 'Accueil',   Icon: HomeIcon },
  { id: 'weight',    label: 'Poids',     Icon: ScaleIcon },
  { id: 'calories',  label: 'Calories',  Icon: FlameIcon },
  { id: 'activity',  label: 'Activité',  Icon: ActivityIcon },
  { id: 'more',      label: 'Plus',      Icon: MoreIcon },
];

const MORE_ITEMS: { id: Page; emoji: string; label: string }[] = [
  { id: 'sante',        emoji: '💚', label: 'Santé' },
  { id: 'meal_planner', emoji: '🍽️', label: 'Repas' },
  { id: 'trends',       emoji: '📈', label: 'Tendances' },
  { id: 'challenges',   emoji: '🎮', label: 'Défis' },
  { id: 'predictions',  emoji: '🎯', label: 'Prédictions' },
  { id: 'weekly_report',emoji: '📊', label: 'Rapports' },
  { id: 'bedtime',      emoji: '⏰', label: 'Bedtime' },
  { id: 'badges',       emoji: '🏆', label: 'Badges' },
  { id: 'settings',     emoji: '⚙️', label: 'Paramètres' },
];

const MAIN_PAGE_IDS: (Page | 'more')[] = ['dashboard', 'weight', 'calories', 'activity'];

export default function BottomNav({ page, onNavigate }: Props) {
  const [showDrawer, setShowDrawer] = useState(false);

  const handleTabClick = (id: Page | 'more') => {
    if (id === 'more') {
      setShowDrawer(s => !s);
    } else {
      setShowDrawer(false);
      onNavigate(id as Page);
    }
  };

  const handleDrawerNav = (id: Page) => {
    setShowDrawer(false);
    onNavigate(id);
  };

  const isMoreActive = !MAIN_PAGE_IDS.includes(page);

  return (
    <>
      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)} />
      )}

      {showDrawer && (
        <div className="more-drawer">
          <div className="more-drawer__handle" />
          <p className="more-drawer__title">Plus</p>
          <div className="more-drawer__grid">
            {MORE_ITEMS.map(item => (
              <button
                key={item.id}
                className={`more-drawer__item${page === item.id ? ' more-drawer__item--active' : ''}`}
                onClick={() => handleDrawerNav(item.id)}
                type="button"
              >
                <span className="more-drawer__emoji">{item.emoji}</span>
                <span className="more-drawer__label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        {MAIN_TABS.map(({ id, label, Icon }) => {
          const isActive = id === 'more' ? isMoreActive : page === id;
          return (
            <button
              key={id}
              className={`nav-tab${isActive ? ' nav-tab--active' : ''}`}
              onClick={() => handleTabClick(id)}
              type="button"
            >
              <div className="nav-tab__icon-wrap">
                <Icon />
                {isActive && <span className="nav-tab__dot" />}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
