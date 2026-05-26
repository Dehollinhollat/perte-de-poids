import React from 'react';
import { useUser } from '../context/UserContext';
import { HydrationLog } from '../types';
import { getHydrationStreak } from '../utils/calculations';
import Card from '../components/common/Card';

const GOAL = 2000; // fallback, overridden by context

function WaterRing({ ml, goal }: { ml: number; goal: number }) {
  const pct = Math.min(1, ml / goal);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = pct >= 1 ? '#10B981' : pct >= 0.6 ? '#3B82F6' : '#60A5FA';

  return (
    <div className="water-ring-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#DBEAFE" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s ease' }}
        />
      </svg>
      <div className="water-ring-inner">
        <span className="water-ring-ml">{ml < 1000 ? ml : (ml / 1000).toFixed(1) + 'L'}</span>
        <span className="water-ring-unit">{ml < 1000 ? 'ml' : ''}</span>
      </div>
    </div>
  );
}

function SevenDayChart({ logs, goal }: { logs: HydrationLog[]; goal: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });
  const totals = days.map(date => ({
    total: logs.filter(l => l.date === date).reduce((s, l) => s + l.amount, 0),
    label: new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'narrow' }),
  }));

  const W = 280; const H = 80; const PAD = 6;
  const bW = (W - PAD * 2) / 7;

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%">
      <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="#BFDBFE" strokeWidth="1" strokeDasharray="3 3" />
      {totals.map((d, i) => {
        const pct = Math.min(1, d.total / goal);
        const barH = Math.max(pct * (H - PAD * 2), d.total > 0 ? 3 : 0);
        const color = d.total >= goal ? '#10B981' : d.total > 0 ? '#60A5FA' : '#E5E7EB';
        const x = PAD + i * bW + bW * 0.2;
        const w = bW * 0.6;
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

export default function HydrationSection() {
  const { hydrationLogs, todaysHydration, hydrationGoalMl, addHydration, deleteHydration } = useUser();
  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = hydrationLogs.filter(h => h.date === today);
  const pct = Math.round((todaysHydration / hydrationGoalMl) * 100);
  const streak = getHydrationStreak(hydrationLogs, hydrationGoalMl);

  const add = (amount: number) => {
    addHydration({
      id: crypto.randomUUID(),
      date: today,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      amount,
    });
  };

  return (
    <div className="section-stack">
      <Card>
        <div className="card-row card-row--between">
          <span className="card-label">Hydratation aujourd'hui</span>
          <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            {pct}% de l'objectif
          </span>
        </div>

        <div className="hydration-hero">
          <WaterRing ml={todaysHydration} goal={hydrationGoalMl} />
          <div className="hydration-meta">
            <div className="hydration-goal">
              Objectif : {hydrationGoalMl >= 1000
                ? (hydrationGoalMl / 1000).toFixed(1) + ' L'
                : hydrationGoalMl + ' ml'}
            </div>
            <div className="hydration-remaining">
              {todaysHydration >= hydrationGoalMl
                ? 'Objectif atteint !'
                : `${hydrationGoalMl - todaysHydration} ml restants`}
            </div>
            {streak > 0 && (
              <div className="streak-badge">
                {streak} jour{streak > 1 ? 's' : ''} de suite
              </div>
            )}
          </div>
        </div>

        <div className="quick-add-row">
          {[250, 500, 1000].map(ml => (
            <button key={ml} className="quick-add-btn" onClick={() => add(ml)} type="button">
              +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="sm">
        <span className="card-label" style={{ display: 'block', marginBottom: '8px' }}>
          7 derniers jours
        </span>
        <SevenDayChart logs={hydrationLogs} goal={hydrationGoalMl} />
        <div className="chart-legend">
          <span className="legend-dot" style={{ background: '#10B981' }} /> Objectif atteint
          <span className="legend-dot" style={{ background: '#60A5FA', marginLeft: '10px' }} /> Partiel
        </div>
      </Card>

      {todaysLogs.length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Aujourd'hui</h3>
          {todaysLogs.map(log => (
            <div key={log.id} className="list-row">
              <div className="list-row__main">
                <span className="list-row__date">{log.time}</span>
              </div>
              <div className="list-row__right">
                <span className="list-row__value" style={{ color: '#3B82F6' }}>{log.amount} ml</span>
                <button className="list-row__delete" onClick={() => deleteHydration(log.id)}
                  type="button" aria-label="Supprimer">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {todaysLogs.length === 0 && (
        <div className="empty-state">Utilisez les boutons ci-dessus pour enregistrer votre hydratation !</div>
      )}
    </div>
  );
}
