import React from 'react';
import { useUser } from '../context/UserContext';
import { calculateTargetCalories } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Challenge } from '../types';

const CHALLENGE_DEFS: Record<Challenge['type'], { title: string; emoji: string; desc: string; unit: string; target: number }> = {
  water:    { title: 'Semaine Hydratation', emoji: '💧', desc: 'Buvez 2L+ chaque jour pendant 7 jours',              unit: 'ml',   target: 2000 },
  sugar:    { title: 'Zéro Sucre Ajouté',   emoji: '🍎', desc: '7 jours sans sucre ajouté dans vos repas',           unit: 'g',    target: 0 },
  activity: { title: 'Marcheur Assidu',     emoji: '🚶', desc: '30 min d\'activité par jour pendant 7 jours',        unit: 'min',  target: 30 },
  sleep:    { title: 'Dormeur Étoile',      emoji: '🌙', desc: 'Dormez 7h+ chaque nuit pendant 7 jours',             unit: 'h',    target: 7 },
  calories: { title: 'Calorie Master',      emoji: '🔥', desc: 'Restez sous votre objectif calorique 7 jours de suite', unit: 'kcal', target: 0 },
};

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function ChallengesSection() {
  const { profile, challenges, startChallenge, deleteChallenge,
          hydrationLogs, meals, sleepEntries, activities, weights } = useUser();

  if (!profile) return null;

  const targetCal = calculateTargetCalories({ ...profile, currentWeight: weights[0]?.weight ?? profile.currentWeight });

  const active = challenges.find(c => !c.completed) ?? null;

  function getDayProgress(challenge: Challenge, dayIndex: number): boolean {
    const date = dateStr(addDays(new Date(challenge.startDate), dayIndex));
    const def = CHALLENGE_DEFS[challenge.type];

    switch (challenge.type) {
      case 'water':
        return hydrationLogs.filter(h => h.date === date).reduce((s, h) => s + h.amount, 0) >= def.target;
      case 'sugar':
        return !meals.filter(m => m.date === date).some(m => m.containsAddedSugar);
      case 'activity':
        return activities.filter(a => a.date === date).reduce((s, a) => s + a.duration, 0) >= def.target;
      case 'sleep':
        return (sleepEntries.find(s => s.date === date)?.duration ?? 0) >= def.target;
      case 'calories': {
        const dayMeals = meals.filter(m => m.date === date);
        return dayMeals.length > 0 && dayMeals.reduce((s, m) => s + m.calories, 0) <= targetCal;
      }
    }
  }

  const today = new Date();
  const progress = active
    ? Array.from({ length: 7 }, (_, i) => {
        const dayDate = addDays(new Date(active.startDate), i);
        if (dayDate > today) return null; // future
        return getDayProgress(active, i);
      })
    : [];

  const daysSucceeded = progress.filter(Boolean).length;
  const pct = Math.round((daysSucceeded / 7) * 100);

  const available = (Object.keys(CHALLENGE_DEFS) as Challenge['type'][]).filter(
    t => !active || active.type !== t
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Défis</h1>
        <p className="page-subtitle">Relevez un défi hebdomadaire</p>
      </div>

      {active ? (
        <Card padding="md">
          <div className="card-row card-row--between">
            <div>
              <div className="challenge-title">
                {CHALLENGE_DEFS[active.type].emoji} {CHALLENGE_DEFS[active.type].title}
              </div>
              <p className="challenge-desc">{CHALLENGE_DEFS[active.type].desc}</p>
            </div>
          </div>

          {/* Day dots */}
          <div className="challenge-days">
            {Array.from({ length: 7 }, (_, i) => {
              const dayDate = addDays(new Date(active.startDate), i);
              const isFuture = dayDate > today;
              const result = progress[i];
              return (
                <div key={i} className="challenge-day">
                  <div className={`challenge-day__dot ${isFuture ? 'future' : result ? 'ok' : 'fail'}`}>
                    {isFuture ? '⬜' : result ? '✅' : '❌'}
                  </div>
                  <span className="challenge-day__label">{DAY_LABELS[i]}</span>
                </div>
              );
            })}
          </div>

          <div className="challenge-progress-info">
            <span>{daysSucceeded}/7 jours</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 6 }}>
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="challenge-reward">
            🏆 Récompense : Badge exclusif en cas de succès !
          </div>

          <div style={{ marginTop: 12 }}>
            <Button variant="ghost" size="sm" onClick={() => deleteChallenge(active.id)}>
              Abandonner le défi
            </Button>
          </div>
        </Card>
      ) : (
        <Card padding="md">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Aucun défi actif. Choisissez un défi ci-dessous !
          </p>
        </Card>
      )}

      {/* Available challenges */}
      <Card padding="md">
        <div className="card-label" style={{ marginBottom: 12 }}>
          {active ? 'Prochains défis disponibles' : 'Choisir un défi'}
        </div>
        <div className="challenge-grid">
          {available.map(type => {
            const def = CHALLENGE_DEFS[type];
            return (
              <button
                key={type}
                type="button"
                className="challenge-card"
                onClick={() => !active && startChallenge(type)}
                disabled={!!active}
              >
                <span className="challenge-card__emoji">{def.emoji}</span>
                <span className="challenge-card__title">{def.title}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Past challenges */}
      {challenges.filter(c => c.completed).length > 0 && (
        <Card padding="md">
          <div className="card-label" style={{ marginBottom: 12 }}>Défis complétés</div>
          {challenges.filter(c => c.completed).map(c => (
            <div key={c.id} className="past-challenge">
              <span>{CHALLENGE_DEFS[c.type].emoji}</span>
              <span>{CHALLENGE_DEFS[c.type].title}</span>
              <span style={{ color: 'var(--success)', fontSize: 12 }}>
                ✅ {c.completedDate ?? ''}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
