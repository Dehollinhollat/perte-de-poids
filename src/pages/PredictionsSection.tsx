import React from 'react';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function PredictionsSection() {
  const { profile, weights, sleepEntries } = useUser();
  if (!profile) return null;

  const currentWeight = weights[0]?.weight ?? profile.currentWeight;
  const startWeight = profile.currentWeight;
  const goalWeight = profile.targetWeight;

  const startDate = new Date(profile.startDate);
  const today = new Date();
  const daysActive = Math.max(1, Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const weightLost = startWeight - currentWeight;
  const avgLossPerWeek = weightLost > 0 ? (weightLost / daysActive) * 7 : 0;

  const remaining = currentWeight - goalWeight;
  const weeksLeft = avgLossPerWeek > 0 ? Math.ceil(remaining / avgLossPerWeek) : null;
  const goalDate = weeksLeft ? addDays(today, weeksLeft * 7) : null;

  // Milestones: every kg from current (rounded down) to goal
  const currentFloor = Math.floor(currentWeight);
  const milestones: { kg: number; date: Date | null; reached: boolean; reachedDate?: string }[] = [];

  // Past milestones from weight history
  for (let kg = Math.floor(startWeight); kg >= Math.ceil(goalWeight); kg--) {
    const reachedEntry = weights.find(w => w.weight <= kg);
    if (reachedEntry) {
      milestones.push({ kg, date: new Date(reachedEntry.date), reached: true, reachedDate: reachedEntry.date });
    } else if (kg <= currentFloor && avgLossPerWeek > 0) {
      const kgToGo = currentWeight - kg;
      const weeksToGo = kgToGo / avgLossPerWeek;
      milestones.push({ kg, date: addDays(today, weeksToGo * 7), reached: false });
    }
  }

  // Limit to 6 milestones around current position
  const nextIdx = milestones.findIndex(m => !m.reached);
  const displayMilestones = milestones.slice(Math.max(0, nextIdx - 2), nextIdx + 5);

  // Avg sleep last 7 days
  const cutoff = addDays(today, -7);
  const recentSleep = sleepEntries.filter(s => new Date(s.date) >= cutoff);
  const avgSleep = recentSleep.length > 0 ? recentSleep.reduce((s, e) => s + e.duration, 0) / recentSleep.length : 7;

  // Scenarios
  function scenarioWeeks(sleepBonus: number, activityBonus: number): number | null {
    if (avgLossPerWeek <= 0) return null;
    const mult = 1 + sleepBonus * 0.15 + activityBonus * 0.1;
    const rate = avgLossPerWeek * mult;
    return rate > 0 ? Math.ceil(remaining / rate) : null;
  }

  const scenarios = [
    { emoji: '😴', label: 'Sommeil 7h+', weeks: avgSleep >= 7 ? weeksLeft : scenarioWeeks(1, 0) },
    { emoji: '🚶', label: '+Marche 30min', weeks: scenarioWeeks(0, 1) },
    { emoji: '💧', label: '+500ml eau', weeks: weeksLeft ? Math.max(1, Math.ceil(weeksLeft * 0.95)) : null },
    { emoji: '⚡', label: 'Tout combiné', weeks: scenarioWeeks(1, 1) },
  ];

  const noData = weights.length < 2 || avgLossPerWeek <= 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Prédictions</h1>
        <p className="page-subtitle">Objectif : {goalWeight} kg</p>
      </div>

      <Card padding="md">
        <div className="card-label" style={{ marginBottom: 8 }}>Tendance actuelle</div>
        {noData ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Enregistrez au moins 2 pesées pour calculer une prédiction.
          </p>
        ) : (
          <>
            <div className="pred-stat-row">
              <div className="pred-stat">
                <span className="pred-stat__val">{avgLossPerWeek > 0 ? `-${avgLossPerWeek.toFixed(2)}` : '–'}</span>
                <span className="pred-stat__label">kg/semaine</span>
              </div>
              <div className="pred-stat">
                <span className="pred-stat__val">{remaining.toFixed(1)}</span>
                <span className="pred-stat__label">kg restants</span>
              </div>
              <div className="pred-stat">
                <span className="pred-stat__val" style={{ color: 'var(--accent)' }}>{weeksLeft ?? '–'}</span>
                <span className="pred-stat__label">semaines</span>
              </div>
            </div>

            {goalDate && (
              <div className="pred-goal-date">
                🎯 Date estimée : <strong>{formatDate(goalDate)}</strong>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Milestones */}
      {!noData && displayMilestones.length > 0 && (
        <Card padding="md">
          <div className="card-label" style={{ marginBottom: 12 }}>Jalons</div>
          <div className="milestone-list">
            {displayMilestones.map(m => (
              <div key={m.kg} className={`milestone-row${m.reached ? ' milestone-row--done' : ''}`}>
                <span className="milestone-row__icon">
                  {m.reached ? '✅' : m.kg === displayMilestones.find(x => !x.reached)?.kg ? '🔵' : '⬜'}
                </span>
                <span className="milestone-row__kg">{m.kg} kg</span>
                <span className="milestone-row__date">
                  {m.reached && m.reachedDate
                    ? `atteint le ${formatShortDate(new Date(m.reachedDate))}`
                    : m.date ? `estimé ${formatShortDate(m.date)}` : '–'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scenarios */}
      {!noData && (
        <Card padding="md">
          <div className="card-label" style={{ marginBottom: 12 }}>Scénarios</div>
          <div className="scenario-list">
            {scenarios.map(sc => (
              <div key={sc.label} className="scenario-row">
                <span className="scenario-row__emoji">{sc.emoji}</span>
                <span className="scenario-row__label">{sc.label}</span>
                <span className="scenario-row__result">
                  {sc.weeks
                    ? `${formatShortDate(addDays(today, sc.weeks * 7))} (${sc.weeks} sem.)`
                    : '–'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
