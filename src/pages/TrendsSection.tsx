import React from 'react';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const dx = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
  const dy = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
  return dx === 0 || dy === 0 ? 0 : num / (dx * dy);
}

function corrLabel(r: number): { label: string; stars: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.6) return { label: 'TRÈS FORT', stars: '⭐⭐⭐⭐⭐', color: 'var(--accent)' };
  if (abs >= 0.4) return { label: 'FORT', stars: '⭐⭐⭐⭐', color: 'var(--warning)' };
  if (abs >= 0.2) return { label: 'MODÉRÉ', stars: '⭐⭐⭐', color: 'var(--info)' };
  return { label: 'FAIBLE', stars: '⭐⭐', color: 'var(--text-muted)' };
}

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function TrendsSection() {
  const { weights, sleepEntries, hydrationLogs, activities } = useUser();

  const today = new Date();
  const cutoff = new Date(today); cutoff.setDate(today.getDate() - 30);

  // Build 30-day dataset: days with a weight entry AND the night-before sleep
  type DayData = { date: string; weight: number; weightChange: number; sleep: number; water: number; activity: number; dayOfWeek: number };

  const recentWeights = weights
    .filter(w => new Date(w.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));

  const dataset: DayData[] = [];
  for (let i = 1; i < recentWeights.length; i++) {
    const w = recentWeights[i];
    const prev = recentWeights[i - 1];
    const weightChange = w.weight - prev.weight;

    const sleep = sleepEntries.find(s => s.date === w.date)?.duration ?? 0;
    const water = hydrationLogs.filter(h => h.date === w.date).reduce((s, h) => s + h.amount, 0);
    const activity = activities.filter(a => a.date === w.date).reduce((s, a) => s + a.duration, 0);
    const dayOfWeek = new Date(w.date).getDay();

    dataset.push({ date: w.date, weight: w.weight, weightChange, sleep, water, activity, dayOfWeek });
  }

  const hasData = dataset.length >= 3;

  // Correlations
  const sleepCorr = hasData ? pearson(dataset.map(d => d.sleep), dataset.map(d => d.weightChange)) : 0;
  const waterCorr = hasData ? pearson(dataset.map(d => d.water), dataset.map(d => d.weightChange)) : 0;
  const actCorr  = hasData ? pearson(dataset.map(d => d.activity), dataset.map(d => d.weightChange)) : 0;

  // Best day of week
  const byDay: Record<number, number[]> = {};
  dataset.forEach(d => {
    if (!byDay[d.dayOfWeek]) byDay[d.dayOfWeek] = [];
    byDay[d.dayOfWeek].push(d.weightChange);
  });
  const dayAvgs = Object.entries(byDay).map(([day, changes]) => ({
    day: Number(day),
    avg: changes.reduce((a, b) => a + b, 0) / changes.length,
  }));
  const bestDay = dayAvgs.sort((a, b) => a.avg - b.avg)[0];

  // High/low split for sleep
  const sleepHigh = dataset.filter(d => d.sleep >= 7);
  const sleepLow  = dataset.filter(d => d.sleep > 0 && d.sleep < 6);
  const sleepHighAvg = sleepHigh.length > 0 ? sleepHigh.reduce((s, d) => s + d.weightChange, 0) / sleepHigh.length : null;
  const sleepLowAvg  = sleepLow.length  > 0 ? sleepLow.reduce((s, d)  => s + d.weightChange, 0) / sleepLow.length  : null;

  const waterHigh = dataset.filter(d => d.water >= 2000);
  const waterLow  = dataset.filter(d => d.water > 0 && d.water < 1500);
  const waterHighAvg = waterHigh.length > 0 ? waterHigh.reduce((s, d) => s + d.weightChange, 0) / waterHigh.length : null;
  const waterLowAvg  = waterLow.length  > 0 ? waterLow.reduce((s, d)  => s + d.weightChange, 0) / waterLow.length  : null;

  const actHigh = dataset.filter(d => d.activity >= 30);
  const actLow  = dataset.filter(d => d.activity === 0);
  const actHighAvg = actHigh.length > 0 ? actHigh.reduce((s, d) => s + d.weightChange, 0) / actHigh.length : null;
  const actLowAvg  = actLow.length  > 0 ? actLow.reduce((s, d)  => s + d.weightChange, 0) / actLow.length  : null;

  // Main insight
  const corrAbs = [
    { factor: 'sommeil', abs: Math.abs(sleepCorr) },
    { factor: 'eau',     abs: Math.abs(waterCorr) },
    { factor: 'activité',abs: Math.abs(actCorr) },
  ].sort((a, b) => b.abs - a.abs)[0];

  const insightMap: Record<string, string> = {
    sommeil: 'Votre plus grand levier est le sommeil. Priorisez 7h+ pour accélérer vos résultats.',
    eau: 'L\'hydratation influence fortement votre poids. Visez 2L+ par jour.',
    activité: 'L\'activité physique régulière est votre facteur clé. Maintenez 30 min/jour.',
  };

  function fmtChange(v: number | null): string {
    if (v === null) return '–';
    return (v > 0 ? '+' : '') + v.toFixed(3) + ' kg/jour';
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tendances</h1>
        <p className="page-subtitle">30 derniers jours</p>
      </div>

      {!hasData ? (
        <Card padding="md">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Enregistrez au moins 3 pesées sur 30 jours pour voir les tendances.
          </p>
        </Card>
      ) : (
        <>
          {bestDay && (
            <Card padding="md">
              <div className="card-label" style={{ marginBottom: 6 }}>🏆 Meilleur Jour</div>
              <div className="trend-best-day">{DAY_NAMES_FR[bestDay.day]}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Vos {DAY_NAMES_FR[bestDay.day].toLowerCase()}s = {fmtChange(bestDay.avg)} en moyenne
              </p>
            </Card>
          )}

          {/* Sleep correlation */}
          <Card padding="md">
            <div className="corr-header">
              <span className="corr-header__icon">😴</span>
              <span className="corr-header__title">Sommeil ↔ Poids</span>
              <span className="corr-header__impact" style={{ color: corrLabel(sleepCorr).color }}>
                {corrLabel(sleepCorr).label}
              </span>
            </div>
            <div className="corr-stats">
              <div className="corr-stat">
                <span className="corr-stat__label">Nuits 7h+</span>
                <span className="corr-stat__val">{fmtChange(sleepHighAvg)}</span>
              </div>
              <div className="corr-stat">
                <span className="corr-stat__label">Nuits &lt;6h</span>
                <span className="corr-stat__val">{fmtChange(sleepLowAvg)}</span>
              </div>
            </div>
            <div className="corr-stars">{corrLabel(sleepCorr).stars}</div>
          </Card>

          {/* Water correlation */}
          <Card padding="md">
            <div className="corr-header">
              <span className="corr-header__icon">💧</span>
              <span className="corr-header__title">Eau ↔ Poids</span>
              <span className="corr-header__impact" style={{ color: corrLabel(waterCorr).color }}>
                {corrLabel(waterCorr).label}
              </span>
            </div>
            <div className="corr-stats">
              <div className="corr-stat">
                <span className="corr-stat__label">2L+</span>
                <span className="corr-stat__val">{fmtChange(waterHighAvg)}</span>
              </div>
              <div className="corr-stat">
                <span className="corr-stat__label">&lt;1.5L</span>
                <span className="corr-stat__val">{fmtChange(waterLowAvg)}</span>
              </div>
            </div>
            <div className="corr-stars">{corrLabel(waterCorr).stars}</div>
          </Card>

          {/* Activity correlation */}
          <Card padding="md">
            <div className="corr-header">
              <span className="corr-header__icon">💪</span>
              <span className="corr-header__title">Activité ↔ Poids</span>
              <span className="corr-header__impact" style={{ color: corrLabel(actCorr).color }}>
                {corrLabel(actCorr).label}
              </span>
            </div>
            <div className="corr-stats">
              <div className="corr-stat">
                <span className="corr-stat__label">30min+</span>
                <span className="corr-stat__val">{fmtChange(actHighAvg)}</span>
              </div>
              <div className="corr-stat">
                <span className="corr-stat__label">0 min</span>
                <span className="corr-stat__val">{fmtChange(actLowAvg)}</span>
              </div>
            </div>
            <div className="corr-stars">{corrLabel(actCorr).stars}</div>
          </Card>

          {/* Main insight */}
          <Card padding="md">
            <div className="card-label" style={{ marginBottom: 8 }}>💡 Insight Principal</div>
            <p className="trend-insight">
              "{insightMap[corrAbs.factor]}"
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
