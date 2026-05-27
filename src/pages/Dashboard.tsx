import React from 'react';
import { useUser } from '../context/UserContext';
import { calculateBMI, calculateTargetCalories, checkActivityLevel } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DailySuggestion from '../components/DailySuggestion';
import { Page } from '../components/BottomNav';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const BMI_SCALE_MIN = 15;
const BMI_SCALE_MAX = 40;

const LEVEL_COLORS: Record<string, string> = {
  rest: '#EF4444', light: '#F59E0B', moderate: '#3B82F6', high: '#10B981',
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const {
    profile, weights, todaysCalories,
    last7SleepAvg, sleepEntries,
    todaysHydration, hydrationGoalMl, addHydration,
    todaysActivityMin, activityGoalMin,
    measurements,
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
              Privilegiez le repos et evitez les exercices intenses.
            </span>
          </div>
        )}

        {/* Daily activity suggestion */}
        <DailySuggestion onLogActivity={() => onNavigate('activity')} />

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
          <div className="mini-card" onClick={() => onNavigate('sante')} role="button" tabIndex={0}>
            <div className="mini-card__title">Activite</div>
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
              <span>Obesite</span>
            </div>
          </div>

          <p className="bmi-interpretation">{bmi.interpretation}</p>
        </Card>

        {/* Weight Progress */}
        <Card>
          <span className="card-label">Progression du poids</span>

          <div className="weight-trio">
            <div className="weight-trio__item">
              <div className="weight-trio__num">{startWeight}</div>
              <div className="weight-trio__sub">depart (kg)</div>
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

          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="progress-meta">
            {lostSoFar > 0 ? (
              <span className="progress-meta__lost">-{lostSoFar.toFixed(1)} kg perdus</span>
            ) : (
              <span>Depart</span>
            )}
            <span>{progressPct.toFixed(0)}% de l'objectif</span>
          </div>

          {remaining > 0 && (
            <div className="remaining-chip">{remaining.toFixed(1)} kg restants</div>
          )}
        </Card>

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
