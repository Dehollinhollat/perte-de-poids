import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { SleepEntry, WeightEntry } from '../types';
import { calculateSleepWeightInsight } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

function calcDuration(bed: string, wake: string): number {
  const bed2 = new Date(`2000-01-01 ${bed}`);
  let wake2 = new Date(`2000-01-01 ${wake}`);
  if (wake2 < bed2) wake2.setDate(wake2.getDate() + 1);
  return +(( wake2.getTime() - bed2.getTime()) / 3600000).toFixed(1);
}

export function formatDuration(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h${mins.toString().padStart(2, '0')}` : `${hrs}h`;
}

const QUALITY_LABELS: Record<number, string> = { 1: 'Mauvais', 2: 'Passable', 3: 'Moyen', 4: 'Bien', 5: 'Excellent' };
const QUALITY_COLORS: Record<number, string> = { 1: '#EF4444', 2: '#F59E0B', 3: '#FBBF24', 4: '#34D399', 5: '#10B981' };

function SleepBarChart7({ entries }: { entries: SleepEntry[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });
  const W = 280; const H = 80; const PAD = 6; const bW = (W - PAD * 2) / 7; const maxH = 10;
  const refY = PAD + (1 - 7 / maxH) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%">
      <line x1={PAD} y1={refY} x2={W - PAD} y2={refY} stroke="#FCD34D" strokeWidth="1" strokeDasharray="3 3" />
      {days.map((day, i) => {
        const entry = entries.find(e => e.date === day);
        const h = entry?.duration ?? 0;
        const barH = Math.max((h / maxH) * (H - PAD * 2), h > 0 ? 3 : 0);
        const color = h === 0 ? '#E5E7EB' : h < 6 ? '#EF4444' : h < 7 ? '#F59E0B' : '#10B981';
        const label = new Date(day + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'narrow' });
        const x = PAD + i * bW + bW * 0.2; const w = bW * 0.6;
        return (
          <g key={day}>
            <rect x={x} y={H - PAD - barH} width={w} height={Math.max(barH, 1)} fill={color} rx="3" />
            <text x={x + w / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function WeeklyChart({ entries }: { entries: SleepEntry[] }) {
  const weeks = Array.from({ length: 4 }, (_, wi) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - wi) * 7 - weekStart.getDay());
    const days: string[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      days.push(day.toISOString().split('T')[0]);
    }
    const weekEntries = entries.filter(e => days.includes(e.date));
    const avg = weekEntries.length > 0
      ? weekEntries.reduce((s, e) => s + e.duration, 0) / weekEntries.length
      : 0;
    return { label: `S${wi + 1}`, avg };
  });

  const W = 200; const H = 70; const PAD = 8; const bW = (W - PAD * 2) / 4; const maxH = 10;
  const refY = PAD + (1 - 7 / maxH) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%" style={{ maxWidth: '220px' }}>
      <line x1={PAD} y1={refY} x2={W - PAD} y2={refY} stroke="#FCD34D" strokeWidth="1" strokeDasharray="3 3" />
      {weeks.map((w, i) => {
        const barH = Math.max((w.avg / maxH) * (H - PAD * 2), w.avg > 0 ? 2 : 0);
        const color = w.avg === 0 ? '#E5E7EB' : w.avg < 6 ? '#EF4444' : w.avg < 7 ? '#F59E0B' : '#10B981';
        const x = PAD + i * bW + bW * 0.2; const bww = bW * 0.6;
        return (
          <g key={i}>
            <rect x={x} y={H - PAD - barH} width={bww} height={Math.max(barH, 1)} fill={color} rx="3" />
            <text x={x + bww / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF">{w.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DualLineChart({ sleepEntries, weights }: { sleepEntries: SleepEntry[]; weights: WeightEntry[] }) {
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    return d.toISOString().split('T')[0];
  });

  const sleepPts = days30.map(d => sleepEntries.find(e => e.date === d)?.duration ?? null);
  const weightPts = days30.map(d => weights.find(w => w.date === d)?.weight ?? null);

  const sleepVals = sleepPts.filter((v): v is number => v !== null);
  const weightVals = weightPts.filter((v): v is number => v !== null);

  if (sleepVals.length < 3) {
    return <div className="chart-empty">Enregistrez plus de nuits pour voir la correlation.</div>;
  }

  const W = 280; const H = 100; const PAD = 10;
  const minS = Math.min(...sleepVals); const maxS = Math.max(...sleepVals) || minS + 1;
  const minW = Math.min(...weightVals.length > 0 ? weightVals : [0]);
  const maxW = Math.max(...weightVals.length > 0 ? weightVals : [1]) || minW + 1;

  const toX = (i: number) => PAD + (i / 29) * (W - PAD * 2);
  const sleepY = (v: number) => PAD + (1 - (v - minS) / (maxS - minS)) * (H - PAD * 2);
  const weightY = (v: number) => PAD + ((v - minW) / (maxW - minW)) * (H - PAD * 2); // inverted: higher weight = lower on chart

  const sleepPath = sleepPts.reduce((acc: string, v, i) => {
    if (v === null) return acc;
    const cmd = acc === '' ? 'M' : 'L';
    return `${acc} ${cmd} ${toX(i)} ${sleepY(v)}`;
  }, '');

  const weightPath = weightPts.reduce((acc: string, v, i) => {
    if (v === null) return acc;
    const cmd = acc === '' ? 'M' : 'L';
    return `${acc} ${cmd} ${toX(i)} ${weightY(v)}`;
  }, '');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        {sleepPath && (
          <path d={sleepPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        )}
        {weightPath && weightVals.length >= 2 && (
          <path d={weightPath} fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        )}
      </svg>
      <div className="chart-legend">
        <span className="legend-dot" style={{ background: '#3B82F6' }} /> Sommeil (h)
        {weightVals.length >= 2 && (
          <>
            <span className="legend-dot" style={{ background: '#FF6B6B', marginLeft: '10px' }} /> Poids (↓ = meilleur)
          </>
        )}
      </div>
    </div>
  );
}

export default function SleepSection() {
  const { sleepEntries, weights, last7SleepAvg, addSleep, deleteSleep } = useUser();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');

  const duration = bedtime && wakeTime ? calcDuration(bedtime, wakeTime) : 0;
  const lowAlert = last7SleepAvg > 0 && last7SleepAvg < 6;
  const insight = calculateSleepWeightInsight(sleepEntries, weights);

  const weeklyAvg = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const entries = sleepEntries.filter(s => new Date(s.date) >= cutoff);
    return entries.length > 0
      ? entries.reduce((s, e) => s + e.duration, 0) / entries.length
      : 0;
  })();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!bedtime || !wakeTime) return;
    addSleep({
      id: crypto.randomUUID(),
      date, bedtime, wakeTime, duration,
      quality: quality ?? undefined,
      notes: notes || undefined,
    });
    setNotes(''); setQuality(null);
  };

  return (
    <div className="section-stack">
      {lowAlert && (
        <div className="alert alert--warning">
          Votre sommeil moyen est de <strong>{formatDuration(last7SleepAvg)}/nuit</strong> sur 7 jours.
          Un sommeil insuffisant ralentit la perte de poids jusqu'a 3x.
        </div>
      )}

      {sleepEntries.length > 0 && (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-card__val"
              style={{ color: last7SleepAvg < 6 ? '#EF4444' : last7SleepAvg < 7 ? '#F59E0B' : '#10B981' }}>
              {formatDuration(last7SleepAvg)}
            </div>
            <div className="stat-card__label">Moyenne 7j</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__val"
              style={{ color: (sleepEntries[0]?.duration ?? 0) < 6 ? '#EF4444' : (sleepEntries[0]?.duration ?? 0) < 7 ? '#F59E0B' : '#10B981' }}>
              {formatDuration(sleepEntries[0]?.duration ?? 0)}
            </div>
            <div className="stat-card__label">Derniere nuit</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__val">{sleepEntries.length}</div>
            <div className="stat-card__label">Nuits</div>
          </div>
        </div>
      )}

      <Card>
        <h3 className="section-title" style={{ marginBottom: '14px' }}>Enregistrer une nuit</h3>
        <form onSubmit={handleSubmit} className="form-stack">
          <Input label="Date du reveil" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div className="form-row">
            <Input label="Heure de coucher" type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} />
            <Input label="Heure de reveil" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
          </div>
          {duration > 0 && (
            <div className="duration-preview"
              style={{ color: duration < 6 ? '#EF4444' : duration < 7 ? '#F59E0B' : '#10B981' }}>
              Duree : {formatDuration(duration)}
              {duration < 6 ? ' — Insuffisant' : duration < 7 ? ' — Acceptable' : ' — Optimal'}
            </div>
          )}

          <div className="form-group">
            <label className="input-label">Qualite du sommeil (optionnel)</label>
            <div className="quality-row">
              {([1, 2, 3, 4, 5] as const).map(q => (
                <button key={q} type="button"
                  className={`quality-btn${quality === q ? ' quality-btn--active' : ''}`}
                  style={quality === q ? { borderColor: QUALITY_COLORS[q], backgroundColor: QUALITY_COLORS[q] + '20', color: QUALITY_COLORS[q] } : {}}
                  onClick={() => setQuality(prev => prev === q ? null : q)}>
                  {q}
                </button>
              ))}
            </div>
            {quality && <span className="quality-label">{QUALITY_LABELS[quality]}</span>}
          </div>

          <Input label="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Qualite du sommeil, stress..." />
          <Button type="submit" fullWidth disabled={!bedtime || !wakeTime}>Enregistrer</Button>
        </form>
      </Card>

      {sleepEntries.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Card padding="sm" className="flex-1-min">
            <span className="card-label" style={{ display: 'block', marginBottom: '8px' }}>7 derniers jours</span>
            <SleepBarChart7 entries={sleepEntries} />
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: '#10B981' }} /> ≥7h
              <span className="legend-dot" style={{ background: '#F59E0B', marginLeft: '8px' }} /> 6-7h
              <span className="legend-dot" style={{ background: '#EF4444', marginLeft: '8px' }} /> &lt;6h
            </div>
          </Card>
          <Card padding="sm" className="flex-1-min">
            <span className="card-label" style={{ display: 'block', marginBottom: '8px' }}>4 dernieres semaines</span>
            <WeeklyChart entries={sleepEntries} />
          </Card>
        </div>
      )}

      {sleepEntries.length >= 5 && (
        <Card padding="sm">
          <span className="card-label" style={{ display: 'block', marginBottom: '8px' }}>
            Correlation sommeil / poids (30 jours)
          </span>
          <DualLineChart sleepEntries={sleepEntries} weights={weights} />
          {insight.hasEnoughData && (
            <div className="insight-text">
              {insight.goodSleepWeightChange !== null && (
                <span>Semaines 7h+: {insight.goodSleepWeightChange > 0 ? '+' : ''}{insight.goodSleepWeightChange} kg</span>
              )}
              {insight.poorSleepWeightChange !== null && (
                <span style={{ marginLeft: '12px' }}>Semaines &lt;6h: {insight.poorSleepWeightChange > 0 ? '+' : ''}{insight.poorSleepWeightChange} kg</span>
              )}
            </div>
          )}
        </Card>
      )}

      {sleepEntries.length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Historique</h3>
          {sleepEntries.slice(0, 7).map(e => (
            <div key={e.id} className="list-row">
              <div className="list-row__main">
                <span className="list-row__date">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="list-row__notes">
                  {e.bedtime} → {e.wakeTime}
                  {e.quality && <span style={{ color: QUALITY_COLORS[e.quality], marginLeft: '6px' }}>★{e.quality}</span>}
                </span>
              </div>
              <div className="list-row__right">
                <span className="list-row__value"
                  style={{ color: e.duration < 6 ? '#EF4444' : e.duration < 7 ? '#F59E0B' : '#10B981' }}>
                  {formatDuration(e.duration)}
                </span>
                <button className="list-row__delete" onClick={() => deleteSleep(e.id)} type="button">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sleepEntries.length === 0 && (
        <div className="empty-state">Aucune nuit enregistree. Commencez par saisir votre premiere nuit !</div>
      )}
    </div>
  );
}
