import React, { useState } from 'react';
import Card from '../components/common/Card';
import { useUser } from '../context/UserContext';

function parseTime(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function calcBedtime(wakeTime: string, cycles: number): string {
  const wake = parseTime(wakeTime);
  const totalMin = cycles * 90 + 15; // 15 min to fall asleep
  const bed = new Date(wake.getTime() - totalMin * 60000);
  return formatTime(bed);
}

const CYCLE_OPTIONS = [
  { cycles: 6, label: 'Optimal', hours: 9, badge: '🌙', color: 'var(--sleep)' },
  { cycles: 5, label: 'Bon ✓',   hours: 7.5, badge: '✅', color: 'var(--success)' },
  { cycles: 4, label: 'Minimum', hours: 6, badge: '⚠️', color: 'var(--warning)' },
];

export default function BedtimeCalculator() {
  const { bedtimeSettings, saveBedtimeSettings } = useUser();
  const [wakeTime, setWakeTime] = useState(bedtimeSettings.wakeUpTime);
  const [targetCycles, setTargetCycles] = useState(5);

  const handleWakeTimeChange = (t: string) => {
    setWakeTime(t);
    saveBedtimeSettings({ ...bedtimeSettings, wakeUpTime: t });
  };

  const recommended = calcBedtime(wakeTime, targetCycles);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Heure de Coucher</h1>
        <p className="page-subtitle">Calculateur de cycles de sommeil</p>
      </div>

      <Card padding="md">
        <div className="card-label" style={{ marginBottom: 12 }}>Réveil prévu</div>
        <input
          type="time"
          value={wakeTime}
          onChange={e => handleWakeTimeChange(e.target.value)}
          className="bedtime-time-input"
        />
      </Card>

      <Card padding="md">
        <div className="card-label" style={{ marginBottom: 12 }}>Objectif sommeil</div>
        <div className="bedtime-cycle-tabs">
          {CYCLE_OPTIONS.map(opt => (
            <button
              key={opt.cycles}
              type="button"
              className={`bedtime-cycle-tab${targetCycles === opt.cycles ? ' bedtime-cycle-tab--active' : ''}`}
              onClick={() => setTargetCycles(opt.cycles)}
            >
              {opt.hours}h
            </button>
          ))}
        </div>
      </Card>

      {/* Main result */}
      <Card padding="md">
        <div style={{ textAlign: 'center' }}>
          <div className="card-label" style={{ marginBottom: 8 }}>💤 Couchez-vous à</div>
          <div className="bedtime-result">{recommended}</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            (inclut 15 min pour s'endormir — {targetCycles} cycles de 90 min)
          </p>
        </div>
      </Card>

      {/* All options */}
      <Card padding="md">
        <div className="card-label" style={{ marginBottom: 12 }}>Toutes les options</div>
        <div className="bedtime-options">
          {CYCLE_OPTIONS.map(opt => (
            <div key={opt.cycles} className="bedtime-option">
              <span className="bedtime-option__badge">{opt.badge}</span>
              <div className="bedtime-option__info">
                <span className="bedtime-option__time" style={{ color: opt.color }}>
                  {calcBedtime(wakeTime, opt.cycles)}
                </span>
                <span className="bedtime-option__meta">
                  {opt.cycles} cycles ({opt.hours}h) — {opt.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          💡 <strong>Pourquoi 90 minutes ?</strong> Chaque cycle de sommeil dure environ 90 min.
          Se réveiller en fin de cycle évite l'inertie du sommeil et vous laisse plus alerte le matin.
        </p>
      </Card>
    </div>
  );
}
