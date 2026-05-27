import React, { useState } from 'react';
import { Home, Scale, Flame, Activity, MoreHorizontal } from 'lucide-react';

export type Page =
  | 'dashboard' | 'weight' | 'calories' | 'activity'
  | 'sante' | 'badges' | 'settings'
  | 'predictions' | 'weekly_report' | 'report'
  | 'bedtime' | 'challenges' | 'trends'
  | 'meal_planner' | 'mealplanner';

interface Props {
  page: Page;
  onNavigate: (page: Page) => void;
}

const MAIN_TABS: { id: Page | 'more'; label: string; Icon: React.FC }[] = [
  { id: 'dashboard', label: 'Accueil',   Icon: () => <Home size={20} strokeWidth={2} /> },
  { id: 'weight',    label: 'Poids',     Icon: () => <Scale size={20} strokeWidth={2} /> },
  { id: 'calories',  label: 'Calories',  Icon: () => <Flame size={20} strokeWidth={2} /> },
  { id: 'activity',  label: 'Activité',  Icon: () => <Activity size={20} strokeWidth={2} /> },
  { id: 'more',      label: 'Plus',      Icon: () => <MoreHorizontal size={20} strokeWidth={2} /> },
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
