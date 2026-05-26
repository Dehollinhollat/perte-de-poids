import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { ActivityEntry } from '../types';
import { ACTIVITY_META, calculateCaloriesBurned, checkActivityLevel } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LEVEL_COLORS: Record<string, string> = {
  rest:     '#EF4444',
  light:    '#F59E0B',
  moderate: '#3B82F6',
  high:     '#10B981',
};

const LEVEL_BG: Record<string, string> = {
  rest:     '#FEF2F2',
  light:    '#FFFBEB',
  moderate: '#EFF6FF',
  high:     '#F0FDF4',
};

function ActivityBarChart({ entries, goalMin }: { entries: ActivityEntry[]; goalMin: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });
  const totals = days.map(date => ({
    min: entries.filter(e => e.date === date).reduce((s, e) => s + e.duration, 0),
    label: new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'narrow' }),
  }));

  const W = 280; const H = 80; const PAD = 6; const bW = (W - PAD * 2) / 7;
  const maxMin = Math.max(...totals.map(t => t.min), goalMin, 30);
  const refY = PAD + (1 - goalMin / maxMin) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%">
      <line x1={PAD} y1={refY} x2={W - PAD} y2={refY} stroke="#86EFAC" strokeWidth="1" strokeDasharray="3 3" />
      {totals.map((d, i) => {
        const barH = Math.max((d.min / maxMin) * (H - PAD * 2), d.min > 0 ? 3 : 0);
        const color = d.min === 0 ? '#E5E7EB' : d.min >= goalMin ? '#10B981' : '#60A5FA';
        const x = PAD + i * bW + bW * 0.2; const w = bW * 0.6;
        return (
          <g key={i}>
            <rect x={x} y={H - PAD - barH} width={w} height={Math.max(barH, 1)} fill={color} rx="3" />
            <text x={x + w / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ActivitySection() {
  const { profile, sleepEntries, activities, activityGoalMin, addActivity, deleteActivity } = useUser();
  const [type, setType] = useState<ActivityEntry['type']>('walking');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const actLevel = checkActivityLevel(sleepEntries);
  const calories = profile && duration ? calculateCaloriesBurned(type, Number(duration), profile.currentWeight) : 0;
  const intensity = ACTIVITY_META[type]?.intensity ?? 'light';

  const today = new Date().toISOString().split('T')[0];
  const todaysEntries = activities.filter(a => a.date === today);
  const todayMin = todaysEntries.reduce((s, a) => s + a.duration, 0);
  const todayCal = todaysEntries.reduce((s, a) => s + a.caloriesBurned, 0);

  const weekEntries = activities.filter(a => {
    const d = new Date(a.date); const now = new Date();
    return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  });
  const weekMin = weekEntries.reduce((s, a) => s + a.duration, 0);
  const weekCal = weekEntries.reduce((s, a) => s + a.caloriesBurned, 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!duration || !profile) return;
    addActivity({
      id: crypto.randomUUID(),
      date: today,
      type,
      duration: Number(duration),
      intensity,
      caloriesBurned: calories,
      notes: notes || undefined,
    });
    setDuration(''); setNotes('');
  };

  const progressPct = (actLevel.progressDays / actLevel.progressTarget) * 100;
  const levelColor = LEVEL_COLORS[actLevel.current];
  const levelBg = LEVEL_BG[actLevel.current];

  return (
    <div className="section-stack">
      {/* Level status */}
      <div className="level-card" style={{ backgroundColor: levelBg, borderColor: levelColor + '40' }}>
        <div className="level-card__header">
          <span className="level-badge" style={{ color: levelColor, backgroundColor: levelColor + '15' }}>
            {actLevel.label.toUpperCase()}
          </span>
          {actLevel.current === 'rest' && (
            <span className="level-warning">Exercice intense contre-productif</span>
          )}
        </div>

        {actLevel.canProgress && actLevel.current !== 'high' && (
          <>
            <div className="level-progress-label">
              Pour debloquer {actLevel.current === 'rest' ? 'exercices legers' : 'niveau suivant'} :
              <strong> {actLevel.progressCondition}</strong>
            </div>
            <div className="level-progress-bar">
              <div className="level-progress-fill"
                style={{ width: `${Math.min(progressPct, 100)}%`, backgroundColor: levelColor }} />
            </div>
            <div className="level-progress-count">
              {actLevel.progressDays} / {actLevel.progressTarget} jours
            </div>
          </>
        )}

        {actLevel.current === 'high' && (
          <div className="level-progress-label">Niveau maximum atteint ! Toutes les activites sont disponibles.</div>
        )}
      </div>

      {/* Today stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card__val" style={{ color: todayMin >= activityGoalMin ? '#10B981' : '#FF6B6B' }}>
            {todayMin}
          </div>
          <div className="stat-card__label">Min auj.</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__val">{todayCal}</div>
          <div className="stat-card__label">Kcal auj.</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__val">{weekMin}</div>
          <div className="stat-card__label">Min semaine</div>
        </div>
      </div>

      {/* Available / locked */}
      <Card>
        <div className="activities-list">
          <div className="activities-group">
            <div className="activities-group__title" style={{ color: '#10B981' }}>Autorisees</div>
            {actLevel.unlockedActivities.map(a => (
              <div key={a} className="activity-row activity-row--ok">{a}</div>
            ))}
          </div>
          {actLevel.lockedActivities.length > 0 && (
            <div className="activities-group">
              <div className="activities-group__title" style={{ color: '#9CA3AF' }}>Verrouillee</div>
              {actLevel.lockedActivities.map(a => (
                <div key={a} className="activity-row activity-row--locked">{a}</div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add form */}
      <Card>
        <h3 className="section-title" style={{ marginBottom: '14px' }}>Enregistrer une activite</h3>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="input-label">Type d'activite</label>
            <div className="activity-type-grid">
              {Object.entries(ACTIVITY_META).map(([key, meta]) => (
                <button key={key} type="button"
                  className={`activity-type-btn${type === key ? ' activity-type-btn--active' : ''}`}
                  onClick={() => setType(key as ActivityEntry['type'])}>
                  <span className="activity-type-btn__name">{meta.label}</span>
                  <span className="activity-type-btn__met">MET {meta.met}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <Input label="Duree" type="number" value={duration}
              onChange={e => setDuration(e.target.value)} placeholder="30" suffix="min" min="1" />
            {calories > 0 && (
              <div className="cal-estimate">
                <div className="cal-estimate__val">{calories}</div>
                <div className="cal-estimate__label">kcal estimees</div>
              </div>
            )}
          </div>

          <Input label="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Parc, salle de sport..." />
          <Button type="submit" fullWidth disabled={!duration}>Enregistrer</Button>
        </form>
      </Card>

      {/* 7-day chart */}
      <Card padding="sm">
        <span className="card-label" style={{ display: 'block', marginBottom: '8px' }}>
          Activite 7 jours (objectif : {activityGoalMin} min/j)
        </span>
        <ActivityBarChart entries={activities} goalMin={activityGoalMin} />
      </Card>

      {/* Activity history */}
      {activities.length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Historique</h3>
          {activities.slice(0, 10).map(a => (
            <div key={a.id} className="list-row">
              <div className="list-row__main">
                <span className="list-row__date">
                  {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {' '}{ACTIVITY_META[a.type]?.label ?? a.type}
                </span>
                <span className="list-row__notes">{a.duration} min · {a.caloriesBurned} kcal</span>
              </div>
              <div className="list-row__right">
                <span className="list-row__badge" style={{ color: '#10B981' }}>{a.intensity}</span>
                <button className="list-row__delete" onClick={() => deleteActivity(a.id)} type="button">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activities.length === 0 && (
        <div className="empty-state">Aucune activite enregistree. Commencez par une marche !</div>
      )}
    </div>
  );
}
