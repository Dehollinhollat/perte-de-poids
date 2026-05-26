import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Badge } from '../types';
import { getNextBadgeHints } from '../utils/badges';

const CATEGORY_LABELS: Record<Badge['category'], string> = {
  weight: 'Poids',
  nutrition: 'Nutrition',
  hydration: 'Hydratation',
  sleep: 'Sommeil',
  activity: 'Activite',
  streak: 'Streaks',
};

const CATEGORY_COLORS: Record<Badge['category'], string> = {
  weight:    '#FF6B6B',
  nutrition: '#10B981',
  hydration: '#3B82F6',
  sleep:     '#8B5CF6',
  activity:  '#F59E0B',
  streak:    '#EF4444',
};

function BadgeCard({ badge }: { badge: Badge }) {
  const color = CATEGORY_COLORS[badge.category];
  return (
    <div className={`badge-card${badge.unlocked ? ' badge-card--unlocked' : ' badge-card--locked'}`}
      style={badge.unlocked ? { borderColor: color + '40', background: color + '08' } : {}}>
      <div className="badge-card__icon" style={{ opacity: badge.unlocked ? 1 : 0.3 }}>
        {badge.icon}
      </div>
      <div className="badge-card__body">
        <div className="badge-card__name" style={{ color: badge.unlocked ? color : undefined }}>
          {badge.name}
        </div>
        <div className="badge-card__desc">{badge.description}</div>
        {badge.unlocked && badge.unlockedDate && (
          <div className="badge-card__date">
            {new Date(badge.unlockedDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
        {!badge.unlocked && (
          <div className="badge-card__req">{badge.requirement}</div>
        )}
      </div>
      {badge.unlocked && (
        <div className="badge-card__check" style={{ color }}>✓</div>
      )}
    </div>
  );
}

export default function BadgesSection() {
  const {
    allBadges, profile, weights, meals, hydrationLogs, sleepEntries,
    activities, hydrationGoalMl, badgeUnlockDates,
  } = useUser();

  const [filter, setFilter] = useState<Badge['category'] | 'all'>('all');

  const unlockedCount = allBadges.filter(b => b.unlocked).length;
  const totalCount = allBadges.length;
  const pct = Math.round((unlockedCount / totalCount) * 100);

  const filtered = filter === 'all' ? allBadges : allBadges.filter(b => b.category === filter);
  const unlocked = filtered.filter(b => b.unlocked).sort((a, b) =>
    (b.unlockedDate ?? '').localeCompare(a.unlockedDate ?? '')
  );
  const locked = filtered.filter(b => !b.unlocked);

  const hints = profile ? getNextBadgeHints(
    { profile, weights, meals, hydrationLogs, sleepEntries, activities, hydrationGoalMl },
    badgeUnlockDates
  ) : [];

  const categories: (Badge['category'] | 'all')[] = ['all', 'weight', 'nutrition', 'hydration', 'sleep', 'activity', 'streak'];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Recompenses</h1>
        <p className="page-subtitle">{unlockedCount}/{totalCount} badges debloques</p>
      </div>

      <div className="dashboard-stack">
        {/* Progress */}
        <div className="badges-progress-card">
          <div className="badges-progress-card__row">
            <span className="badges-progress-card__label">{unlockedCount} / {totalCount}</span>
            <span className="badges-progress-card__pct">{pct}%</span>
          </div>
          <div className="badges-progress-bar">
            <div className="badges-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Next badges hints */}
        {hints.length > 0 && (
          <div className="next-badges-card">
            <div className="next-badges-card__title">Prochains badges</div>
            {hints.map(({ badge, hint }) => (
              <div key={badge.id} className="next-badge-row">
                <span className="next-badge-row__icon">{badge.icon}</span>
                <div className="next-badge-row__info">
                  <span className="next-badge-row__name">{badge.name}</span>
                  <span className="next-badge-row__hint">{hint}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category filter */}
        <div className="badge-filter-bar">
          {categories.map(cat => (
            <button key={cat} type="button"
              className={`badge-filter-btn${filter === cat ? ' badge-filter-btn--active' : ''}`}
              onClick={() => setFilter(cat)}
              style={filter === cat && cat !== 'all' ? { background: CATEGORY_COLORS[cat as Badge['category']] + '20', color: CATEGORY_COLORS[cat as Badge['category']] } : {}}>
              {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat as Badge['category']]}
            </button>
          ))}
        </div>

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <div>
            <div className="badges-section-title">
              Debloques ({unlocked.length})
            </div>
            <div className="badge-list">
              {unlocked.map(b => <BadgeCard key={b.id} badge={b} />)}
            </div>
          </div>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <div>
            <div className="badges-section-title" style={{ color: 'var(--gray-light)' }}>
              Verrouillee ({locked.length})
            </div>
            <div className="badge-list">
              {locked.map(b => <BadgeCard key={b.id} badge={b} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="empty-state">Aucun badge dans cette categorie.</div>
        )}
      </div>
    </div>
  );
}
