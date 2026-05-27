import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useUser } from '../context/UserContext';
import { calculateBMI, calculateTargetCalories, checkActivityLevel } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DailySuggestion from '../components/DailySuggestion';
import { Page } from '../components/BottomNav';
import type { Challenge } from '../types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const BMI_SCALE_MIN = 15;
const BMI_SCALE_MAX = 40;

const CHALLENGE_LABELS: Record<Challenge['type'], { label: string; emoji: string }> = {
  water:    { label: 'Hydratation 7j', emoji: '💧' },
  sugar:    { label: 'Sans sucre 7j',  emoji: '🚫' },
  activity: { label: 'Activité 7j',    emoji: '🏃' },
  sleep:    { label: 'Sommeil 7j',     emoji: '😴' },
  calories: { label: 'Calories 7j',    emoji: '🥗' },
};

const LEVEL_COLORS: Record<string, string> = {
  rest: '#EF4444', light: '#F59E0B', moderate: '#3B82F6', high: '#10B981',
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const {
    profile, weights, meals, todaysCalories,
    last7SleepAvg, sleepEntries,
    todaysHydration, hydrationGoalMl, addHydration,
    todaysActivityMin, activityGoalMin,
    measurements, activities, hydrationLogs, challenges,
  } = useUser();

  if (!profile) return null;

  const currentWeight = weights[0]?.weight ?? profile.currentWeight;
  const bmi = calculateBMI(currentWeight, profile.height);
  const targetCal = calculateTargetCalories({ ...profile, currentWeight });

  const startWeight = profile.currentWeight;
  const totalDelta = startWeight - profile.targetWeight;
  const lostSoFar = startWeight - currentWeight;
  const progressPct = totalDelta !== 0 ? Math.max(0, Math.min(100, (lostSoFar / totalDelta) * 100)) : 0;
  const remaining = currentWeight - profile.targetWeight;

  const calPct = Math.min(100, (todaysCalories / targetCal) * 100);
  const calRemaining = targetCal - todaysCalories;

  const bmiPct = ((bmi.value - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100;
  const bmiMarkerLeft = Math.max(2, Math.min(98, bmiPct));

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const actLevel = checkActivityLevel(sleepEntries);
  const latestMeasurement = measurements[0];
  const hydrationPct = Math.min(100, (todaysHydration / hydrationGoalMl) * 100);

  const addQuickHydration = (ml: number) => {
    addHydration({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      amount: ml,
    });
  };

  // Weight sparkline — last 7 entries, chronological order
  const sparkData = weights.slice(0, 7).reverse().map((w, i) => ({ i, weight: w.weight }));

  // Mini-prediction: avg weekly loss → weeks to goal
  const avgLossPerWeek = (() => {
    if (weights.length < 2) return 0;
    const sorted = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const weeks = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 24 * 3600 * 1000);
    if (weeks < 0.5) return 0;
    return (first.weight - last.weight) / weeks;
  })();
  const weeksToGoal = avgLossPerWeek > 0.01 && remaining > 0 ? Math.ceil(remaining / avgLossPerWeek) : null;

  // Active challenge
  const activeChallenge = challenges.find(c => !c.completed);
  const challengeDaysSince = activeChallenge
    ? Math.min(7, Math.max(1, Math.floor((Date.now() - new Date(activeChallenge.startDate).getTime()) / 86400000) + 1))
    : 0;

  // Weekly score
  const weekScore = (() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const ws = weekStart.toISOString().split('T')[0];
    let score = 0;
    if (weights.some(w => w.date >= ws)) score += 20;
    if (meals.some(m => m.date >= ws)) score += 20;
    if (activities.filter(a => a.date >= ws).length >= 3) score += 20;
    const weekSleep = sleepEntries.filter(s => s.date >= ws);
    if (weekSleep.length > 0 && weekSleep.reduce((s, e) => s + e.duration, 0) / weekSleep.length >= 7) score += 20;
    if (hydrationLogs.some(h => h.date >= ws)) score += 20;
    return score;
  })();

  const scoreColor = weekScore >= 80 ? '#22C55E' : weekScore >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          Bonjour{profile.name ? `, ${profile.name}` : ''}&nbsp;!
        </h1>
        <p className="page-subtitle">{todayLabel}</p>
      </div>

      <div className="dashboard-stack">
        {/* Sleep alert */}
        {last7SleepAvg > 0 && last7SleepAvg < 6 && (
          <div className="sleep-alert">
            <span className="sleep-alert__icon">⚠</span>
            <span className="sleep-alert__text">
              Sommeil insuffisant : {last7SleepAvg.toFixed(1)}h/nuit en moyenne.
              Privilégiez le repos et évitez les exercices intenses.
            </span>
          </div>
        )}

        {/* Daily activity suggestion */}
        <DailySuggestion onLogActivity={() => onNavigate('activity')} />

        {/* Weight card with sparkline */}
        <Card>
          <div className="card-row card-row--between" style={{ marginBottom: 8 }}>
            <span className="card-label">Progression du poids</span>
            <button
              className="text-btn"
              type="button"
              onClick={() => onNavigate('weight')}
              style={{ fontSize: 12 }}
            >
              Voir tout →
            </button>
          </div>

          <div className="weight-trio">
            <div className="weight-trio__item">
              <div className="weight-trio__num">{startWeight}</div>
              <div className="weight-trio__sub">départ (kg)</div>
            </div>
            <div className="weight-trio__arrow">→</div>
            <div className="weight-trio__item weight-trio__item--current">
              <div className="weight-trio__num">{currentWeight}</div>
              <div className="weight-trio__sub">actuel (kg)</div>
            </div>
            <div className="weight-trio__arrow">→</div>
            <div className="weight-trio__item">
              <div className="weight-trio__num weight-trio__num--target">{profile.targetWeight}</div>
              <div className="weight-trio__sub">objectif (kg)</div>
            </div>
          </div>

          {sparkData.length >= 2 && (
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <ResponsiveContainer width="100%" height={52}>
                <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--accent)"
                    fill="url(#weightGrad)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="progress-meta">
            {lostSoFar > 0 ? (
              <span className="progress-meta__lost">-{lostSoFar.toFixed(1)} kg perdus</span>
            ) : (
              <span>Départ</span>
            )}
            <span>{progressPct.toFixed(0)}% de l'objectif</span>
          </div>

          {remaining > 0 && (
            <div className="remaining-chip">{remaining.toFixed(1)} kg restants</div>
          )}
        </Card>

        {/* Mini-prediction card */}
        <Card>
          <div className="card-row card-row--between">
            <span className="card-label">🎯 Mini prédiction</span>
            <button className="text-btn" type="button" onClick={() => onNavigate('predictions')} style={{ fontSize: 12 }}>
              Détails →
            </button>
          </div>
          {weeksToGoal !== null ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{weeksToGoal}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>semaines pour atteindre l'objectif</span>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              {weights.length < 2 ? 'Enregistrez au moins 2 pesées pour une prédiction.' : 'Votre poids est stable — objectif proche !'}
            </p>
          )}
          {avgLossPerWeek > 0.01 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Rythme moyen : -{avgLossPerWeek.toFixed(2)} kg/semaine
            </p>
          )}
        </Card>

        {/* Mini-cards 2×2 grid */}
        <div className="mini-grid">
          {/* Hydration */}
          <div className="mini-card" onClick={() => onNavigate('sante')} role="button" tabIndex={0}>
            <div className="mini-card__title">Hydratation</div>
            <div className="mini-card__val" style={{ color: hydrationPct >= 100 ? '#10B981' : '#3B82F6' }}>
              {todaysHydration >= 1000
                ? (todaysHydration / 1000).toFixed(1) + 'L'
                : todaysHydration + 'ml'}
            </div>
            <div className="mini-progress">
              <div className="mini-progress__fill"
                style={{ width: `${hydrationPct}%`, background: hydrationPct >= 100 ? '#10B981' : '#3B82F6' }} />
            </div>
            <div className="mini-card__quick">
              {[250, 500].map(ml => (
                <button key={ml} className="mini-quick-btn" type="button"
                  onClick={e => { e.stopPropagation(); addQuickHydration(ml); }}>
                  +{ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Sleep */}
          <div className="mini-card" onClick={() => onNavigate('sante')} role="button" tabIndex={0}>
            <div className="mini-card__title">Sommeil</div>
            <div className="mini-card__val" style={{
              color: last7SleepAvg >= 7 ? '#10B981' : last7SleepAvg >= 6 ? '#F59E0B' : '#EF4444',
            }}>
              {last7SleepAvg > 0 ? last7SleepAvg.toFixed(1) + 'h' : '--'}
            </div>
            <div className="mini-card__sub">moy. 7 jours</div>
            <div className="mini-card__sub" style={{ fontSize: '10px', marginTop: '4px' }}>
              {last7SleepAvg >= 7 ? 'Excellent' : last7SleepAvg >= 6 ? 'Correct' : last7SleepAvg > 0 ? 'Insuffisant' : ''}
            </div>
          </div>

          {/* Measurements */}
          <div className="mini-card" onClick={() => onNavigate('sante')} role="button" tabIndex={0}>
            <div className="mini-card__title">Mesures</div>
            {latestMeasurement ? (
              <>
                <div className="mini-card__val" style={{ color: '#4ECDC4' }}>
                  {latestMeasurement.waist != null ? latestMeasurement.waist + 'cm' : '--'}
                </div>
                <div className="mini-card__sub">tour de taille</div>
                {latestMeasurement.whr && (
                  <div className="mini-card__sub" style={{ fontSize: '10px', marginTop: '4px' }}>
                    WHR {latestMeasurement.whr}
                  </div>
                )}
              </>
            ) : (
              <div className="mini-card__sub" style={{ marginTop: '8px' }}>Aucune mesure</div>
            )}
          </div>

          {/* Activity */}
          <div className="mini-card" onClick={() => onNavigate('activity')} role="button" tabIndex={0}>
            <div className="mini-card__title">Activité</div>
            <div className="mini-card__val" style={{ color: LEVEL_COLORS[actLevel.current] }}>
              {todaysActivityMin}
              <span style={{ fontSize: '12px', fontWeight: 500 }}>min</span>
            </div>
            <div className="mini-card__sub">aujourd'hui</div>
            <div className="mini-progress" style={{ marginTop: '6px' }}>
              <div className="mini-progress__fill"
                style={{
                  width: `${Math.min(100, (todaysActivityMin / activityGoalMin) * 100)}%`,
                  background: LEVEL_COLORS[actLevel.current],
                }} />
            </div>
          </div>
        </div>

        {/* Calories */}
        <Card>
          <div className="card-row card-row--between">
            <span className="card-label">Calories aujourd'hui</span>
            <span className={`cal-status${calRemaining < 0 ? ' cal-status--over' : ''}`}>
              {calRemaining < 0
                ? `+${Math.abs(calRemaining)} kcal en trop`
                : `${calRemaining} kcal restantes`}
            </span>
          </div>

          <div className="cal-numbers">
            <span className="cal-current">{todaysCalories}</span>
            <span className="cal-divider"> / </span>
            <span className="cal-target">{targetCal}</span>
            <span className="cal-unit"> kcal</span>
          </div>

          <div className="progress-bar">
            <div
              className={`progress-bar__fill${calRemaining < 0 ? ' progress-bar__fill--over' : ''}`}
              style={{ width: `${Math.min(calPct, 100)}%` }}
            />
          </div>
        </Card>

        {/* Active challenge card */}
        {activeChallenge && (
          <Card>
            <div className="card-row card-row--between">
              <span className="card-label">
                {CHALLENGE_LABELS[activeChallenge.type].emoji} Défi actif
              </span>
              <button className="text-btn" type="button" onClick={() => onNavigate('challenges')} style={{ fontSize: 12 }}>
                Voir →
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {CHALLENGE_LABELS[activeChallenge.type].label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i < challengeDaysSince ? 'var(--accent)' : 'var(--bg-secondary)',
                      border: '2px solid',
                      borderColor: i < challengeDaysSince ? 'var(--accent)' : 'var(--border, #e5e7eb)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: i < challengeDaysSince ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {i < challengeDaysSince ? '✓' : i + 1}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Jour {challengeDaysSince} / 7
              </p>
            </div>
          </Card>
        )}

        {/* Weekly score card */}
        <Card>
          <div className="card-row card-row--between">
            <span className="card-label">📊 Score de la semaine</span>
            <button className="text-btn" type="button" onClick={() => onNavigate('weekly_report')} style={{ fontSize: 12 }}>
              Rapport →
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor }}>{weekScore}</div>
            <div style={{ flex: 1 }}>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${weekScore}%`, background: scoreColor }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {weekScore >= 80 ? 'Excellente semaine !' : weekScore >= 50 ? 'Bonne progression' : 'Continuez vos efforts !'}
              </p>
            </div>
          </div>
        </Card>

        {/* BMI Card */}
        <Card>
          <div className="card-row card-row--between">
            <span className="card-label">Indice de Masse Corporelle</span>
            <span className="badge" style={{ backgroundColor: bmi.color + '20', color: bmi.color }}>
              {bmi.label}
            </span>
          </div>

          <div className="bmi-value" style={{ color: bmi.color }}>{bmi.value}</div>

          <div className="bmi-scale">
            <div className="bmi-scale__track">
              <div className="bmi-scale__marker" style={{ left: `${bmiMarkerLeft}%` }} />
            </div>
            <div className="bmi-scale__zones">
              <span>Sous-poids</span>
              <span>Normal</span>
              <span>Surpoids</span>
              <span>Obésité</span>
            </div>
          </div>

          <p className="bmi-interpretation">{bmi.interpretation}</p>
        </Card>

        {/* Quick actions */}
        <div className="action-row">
          <Button variant="secondary" fullWidth onClick={() => onNavigate('weight')}>
            Enregistrer mon poids
          </Button>
          <Button variant="primary" fullWidth onClick={() => onNavigate('calories')}>
            Ajouter un repas
          </Button>
        </div>
      </div>
    </div>
  );
}
