import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { calculateTargetCalories } from '../utils/calculations';
import Card from '../components/common/Card';

function getWeekBounds(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stars(score: number): string {
  const n = Math.round(score / 20);
  return '⭐'.repeat(Math.max(0, Math.min(5, n)));
}

export default function WeeklyReport() {
  const { profile, weights, meals, hydrationLogs, sleepEntries, activities } = useUser();
  const [weekOffset, setWeekOffset] = useState(0);

  if (!profile) return null;

  const { start, end } = getWeekBounds(weekOffset);
  const targetCal = calculateTargetCalories({ ...profile, currentWeight: weights[0]?.weight ?? profile.currentWeight });

  // Days in week
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(dateStr(new Date(d)));
  }

  // Weight
  const weekWeights = weights.filter(w => days.includes(w.date)).map(w => w.weight);
  const weightChange = weekWeights.length >= 2
    ? weekWeights[weekWeights.length - 1] - weekWeights[0]
    : null;

  // Calories
  const calByDay = days.map(d => meals.filter(m => m.date === d).reduce((s, m) => s + m.calories, 0));
  const avgCal = avg(calByDay.filter(c => c > 0));
  const calGoalDays = calByDay.filter((c, i) => c > 0 && c <= targetCal).length;
  const calTrackedDays = calByDay.filter(c => c > 0).length;

  // Hydration
  const waterByDay = days.map(d => hydrationLogs.filter(h => h.date === d).reduce((s, h) => s + h.amount, 0));
  const avgWater = avg(waterByDay.filter(w => w > 0));
  const waterGoalDays = waterByDay.filter(w => w >= 2000).length;

  // Sleep
  const sleepByDay = days.map(d => sleepEntries.find(s => s.date === d)?.duration ?? 0);
  const avgSleep = avg(sleepByDay.filter(s => s > 0));
  const sleepGoalDays = sleepByDay.filter(s => s >= 7).length;

  // Activity
  const actByDay = days.map(d => activities.filter(a => a.date === d).reduce((s, a) => s + a.duration, 0));
  const totalActivity = actByDay.reduce((s, a) => s + a, 0);
  const activeDays = actByDay.filter(a => a > 0).length;

  // Score (0–100)
  const weightScore = weightChange !== null && weightChange < 0 ? 20 : 0;
  const calScore = calTrackedDays > 0 ? (calGoalDays / calTrackedDays) * 20 : 0;
  const waterScore = (waterGoalDays / 7) * 20;
  const sleepScore = (sleepGoalDays / 7) * 20;
  const actScore = (Math.min(activeDays, 5) / 5) * 20;
  const weekScore = Math.round(weightScore + calScore + waterScore + sleepScore + actScore);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (calScore >= 16) strengths.push(`Calories sous objectif ${calGoalDays}/${calTrackedDays || 7} jours`);
  else if (calScore < 8 && calTrackedDays > 0) improvements.push('Calories au-dessus de l\'objectif');

  if (waterGoalDays >= 5) strengths.push(`Hydratation atteinte ${waterGoalDays}/7 jours`);
  else if (waterGoalDays < 3) improvements.push('Hydratation insuffisante');

  if (sleepGoalDays >= 5) strengths.push(`Sommeil 7h+ atteint ${sleepGoalDays}/7 nuits`);
  else if (sleepGoalDays < 3) improvements.push('Sommeil toujours insuffisant (< 7h)');

  if (activeDays >= 4) strengths.push(`${activeDays} jours d'activité physique`);
  else if (activeDays < 2) improvements.push('Peu d\'activité physique cette semaine');

  const tip = improvements.includes('Hydratation insuffisante')
    ? '"Augmentez votre eau de 500ml — cela aide le sommeil et la perte de poids."'
    : improvements.includes('Sommeil toujours insuffisant (< 7h)')
    ? '"Le sommeil est votre levier numéro 1. Couchez-vous 30 min plus tôt."'
    : weekScore >= 80
    ? '"Excellente semaine ! Maintenez ce rythme, vous êtes sur la bonne voie."'
    : '"Chaque petite amélioration compte. Restez régulier !"';

  const weekLabel = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Rapport Hebdo</h1>
        <p className="page-subtitle">{weekLabel}</p>
      </div>

      {/* Score card */}
      <Card padding="md">
        <div style={{ textAlign: 'center' }}>
          <div className="report-score">{weekScore}<span style={{ fontSize: 18 }}>/100</span></div>
          <div style={{ fontSize: 20, margin: '4px 0' }}>{stars(weekScore)}</div>
          {weekOffset < 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Score semaine précédente</div>
          )}
        </div>
      </Card>

      {/* Metrics */}
      <Card padding="md">
        <div className="report-metrics">
          <div className="report-metric">
            <span className="report-metric__icon">⚖️</span>
            <span className="report-metric__label">Poids</span>
            <span className="report-metric__val">
              {weightChange !== null
                ? (weightChange > 0 ? '+' : '') + weightChange.toFixed(1) + ' kg'
                : 'Pas de pesée'}
            </span>
            <span className={`report-metric__status ${weightChange !== null && weightChange < 0 ? 'ok' : 'warn'}`}>
              {weightChange !== null && weightChange < 0 ? '✓' : '–'}
            </span>
          </div>
          <div className="report-metric">
            <span className="report-metric__icon">🔥</span>
            <span className="report-metric__label">Calories</span>
            <span className="report-metric__val">{avgCal > 0 ? Math.round(avgCal) + '/jour' : '–'}</span>
            <span className={`report-metric__status ${calScore >= 12 ? 'ok' : 'warn'}`}>
              {calTrackedDays > 0 ? (calScore >= 12 ? '✓' : '✗') : '–'}
            </span>
          </div>
          <div className="report-metric">
            <span className="report-metric__icon">💧</span>
            <span className="report-metric__label">Eau</span>
            <span className="report-metric__val">{avgWater > 0 ? (avgWater / 1000).toFixed(1) + 'L/jour' : '–'}</span>
            <span className={`report-metric__status ${waterGoalDays >= 5 ? 'ok' : 'warn'}`}>
              {waterGoalDays >= 5 ? '✓' : '✗'}
            </span>
          </div>
          <div className="report-metric">
            <span className="report-metric__icon">😴</span>
            <span className="report-metric__label">Sommeil</span>
            <span className="report-metric__val">{avgSleep > 0 ? avgSleep.toFixed(1) + 'h/nuit' : '–'}</span>
            <span className={`report-metric__status ${avgSleep >= 7 ? 'ok' : 'warn'}`}>
              {avgSleep > 0 ? (avgSleep >= 7 ? '✓' : '⚠️') : '–'}
            </span>
          </div>
          <div className="report-metric">
            <span className="report-metric__icon">💪</span>
            <span className="report-metric__label">Activité</span>
            <span className="report-metric__val">{totalActivity} min ({activeDays}/7 jours)</span>
            <span className={`report-metric__status ${activeDays >= 4 ? 'ok' : 'warn'}`}>
              {activeDays >= 4 ? '✓' : '–'}
            </span>
          </div>
        </div>
      </Card>

      {/* Strengths / Improvements */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <Card padding="md">
          {strengths.length > 0 && (
            <>
              <div className="card-label" style={{ color: 'var(--success)', marginBottom: 8 }}>✅ Points forts</div>
              {strengths.map(s => <p key={s} className="report-bullet report-bullet--ok">• {s}</p>)}
            </>
          )}
          {improvements.length > 0 && (
            <>
              <div className="card-label" style={{ color: 'var(--warning)', marginBottom: 8, marginTop: strengths.length > 0 ? 12 : 0 }}>⚠️ À améliorer</div>
              {improvements.map(s => <p key={s} className="report-bullet report-bullet--warn">• {s}</p>)}
            </>
          )}
          <div className="report-tip">{tip}</div>
        </Card>
      )}

      {/* Week navigation */}
      <div className="report-nav">
        <button className="btn btn--ghost btn--sm" onClick={() => setWeekOffset(o => o - 1)} type="button">
          ← Semaine précédente
        </button>
        {weekOffset < 0 && (
          <button className="btn btn--ghost btn--sm" onClick={() => setWeekOffset(o => o + 1)} type="button">
            Suivante →
          </button>
        )}
      </div>
    </div>
  );
}
