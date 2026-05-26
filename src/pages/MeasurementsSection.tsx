import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { BodyMeasurement } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

interface WHRStatus { label: string; color: string }

function getWHRStatus(whr: number, sex: string): WHRStatus {
  if (sex === 'homme') {
    if (whr < 0.90) return { label: 'Risque faible', color: '#10B981' };
    if (whr < 0.95) return { label: 'Risque modere', color: '#F59E0B' };
    return { label: 'Risque eleve', color: '#EF4444' };
  }
  if (whr < 0.80) return { label: 'Risque faible', color: '#10B981' };
  if (whr < 0.85) return { label: 'Risque modere', color: '#F59E0B' };
  return { label: 'Risque eleve', color: '#EF4444' };
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 72; const H = 26; const PAD = 2;
  const min = Math.min(...values); const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));
  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
  }, '');
  const last = pts[pts.length - 1];
  const area = `${path} L ${last.x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <path d={area} fill={color} fillOpacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
}

const ZONES: { key: keyof BodyMeasurement; label: string; color: string }[] = [
  { key: 'waist', label: 'Taille', color: '#4ECDC4' },
  { key: 'hips', label: 'Hanches', color: '#F472B6' },
  { key: 'chest', label: 'Poitrine', color: '#818CF8' },
  { key: 'arms', label: 'Bras', color: '#FB923C' },
  { key: 'thighs', label: 'Cuisses', color: '#34D399' },
];

export default function MeasurementsSection() {
  const { profile, measurements, addMeasurement, deleteMeasurement } = useUser();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState<Record<string, string>>({
    waist: '', hips: '', chest: '', arms: '', thighs: '',
  });

  const latest = measurements[0];
  const previous = measurements[1];
  const first = measurements[measurements.length - 1];

  const whr = latest?.waist && latest?.hips ? +(latest.waist / latest.hips).toFixed(2) : null;
  const whrStatus = whr && profile ? getWHRStatus(whr, profile.sex) : null;

  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const waist = form.waist ? Number(form.waist) : undefined;
    const hips = form.hips ? Number(form.hips) : undefined;
    const entry: BodyMeasurement = {
      id: crypto.randomUUID(),
      date,
      waist,
      hips,
      chest: form.chest ? Number(form.chest) : undefined,
      arms: form.arms ? Number(form.arms) : undefined,
      thighs: form.thighs ? Number(form.thighs) : undefined,
      whr: waist && hips ? +(waist / hips).toFixed(2) : undefined,
    };
    addMeasurement(entry);
    setForm({ waist: '', hips: '', chest: '', arms: '', thighs: '' });
  };

  const hasAny = Object.values(form).some(v => v !== '');

  return (
    <div className="section-stack">
      {/* WHR + latest */}
      {latest && (
        <Card>
          <div className="card-row card-row--between">
            <span className="card-label">Dernieres mesures</span>
            <span className="card-label">
              {new Date(latest.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short',
              })}
            </span>
          </div>

          {whr && whrStatus && (
            <div className="whr-display">
              <div>
                <div className="whr-value">{whr}</div>
                <div className="whr-label">Ratio taille/hanches</div>
              </div>
              <span className="badge"
                style={{ backgroundColor: whrStatus.color + '20', color: whrStatus.color }}>
                {whrStatus.label}
              </span>
            </div>
          )}

          <div className="measurements-grid">
            {ZONES.map(z => {
              const curr = latest[z.key] as number | undefined;
              const prev = previous?.[z.key] as number | undefined;
              if (curr == null) return null;
              const diff = prev != null ? curr - prev : null;
              return (
                <div key={z.key} className="measure-cell">
                  <div className="measure-cell__label">{z.label}</div>
                  <div className="measure-cell__val">{curr} cm</div>
                  {diff != null && Math.abs(diff) >= 0.1 && (
                    <span style={{ fontSize: '11px', color: diff < 0 ? '#10B981' : '#EF4444' }}>
                      {diff < 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* First vs last comparison */}
      {measurements.length >= 2 && first && latest && first.id !== latest.id && (
        <Card>
          <span className="card-label" style={{ display: 'block', marginBottom: '10px' }}>
            Premiere vs Derniere mesure
          </span>
          <div className="comparison-grid">
            <div className="comparison-col">
              <div className="comparison-col__title">Premiere</div>
              <div className="comparison-col__date">
                {new Date(first.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div className="comparison-col comparison-col--last">
              <div className="comparison-col__title">Derniere</div>
              <div className="comparison-col__date">
                {new Date(latest.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {ZONES.map(z => {
              const firstVal = first[z.key] as number | undefined;
              const lastVal = latest[z.key] as number | undefined;
              if (firstVal == null || lastVal == null) return null;
              const delta = lastVal - firstVal;
              return (
                <div key={z.key} className="comparison-row">
                  <span className="comparison-zone" style={{ color: z.color }}>{z.label}</span>
                  <span className="comparison-vals">
                    {firstVal} → {lastVal} cm
                  </span>
                  <span className="comparison-delta" style={{ color: delta < 0 ? '#10B981' : delta > 0 ? '#EF4444' : '#9CA3AF' }}>
                    {delta === 0 ? '=' : `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Per-zone sparklines */}
      {measurements.length >= 2 && (
        <Card>
          <span className="card-label" style={{ display: 'block', marginBottom: '10px' }}>
            Evolution par zone
          </span>
          <div className="zone-sparklines">
            {ZONES.map(z => {
              const vals = sorted
                .map(m => m[z.key] as number | undefined)
                .filter((v): v is number => v != null);
              if (vals.length < 2) return null;
              const latest_val = vals[vals.length - 1];
              const first_val = vals[0];
              const delta = latest_val - first_val;
              return (
                <div key={z.key} className="zone-sparkline-row">
                  <div className="zone-sparkline-row__info">
                    <span className="zone-sparkline-row__label" style={{ color: z.color }}>{z.label}</span>
                    <span className="zone-sparkline-row__val">{latest_val} cm</span>
                    {Math.abs(delta) >= 0.1 && (
                      <span style={{ fontSize: '11px', color: delta < 0 ? '#10B981' : '#EF4444' }}>
                        {delta < 0 ? '↓' : '+'}{Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <Sparkline values={vals} color={z.color} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add form */}
      <Card>
        <h3 className="section-title" style={{ marginBottom: '14px' }}>Nouvelle mesure</h3>
        <form onSubmit={handleSubmit} className="form-stack">
          <Input label="Date" type="date" value={date}
            onChange={e => setDate(e.target.value)} />
          <div className="form-row">
            <Input label="Taille" type="number" value={form.waist}
              onChange={e => setForm(f => ({ ...f, waist: e.target.value }))}
              placeholder="80" suffix="cm" step="0.1" />
            <Input label="Hanches" type="number" value={form.hips}
              onChange={e => setForm(f => ({ ...f, hips: e.target.value }))}
              placeholder="95" suffix="cm" step="0.1" />
          </div>
          <div className="form-row">
            <Input label="Poitrine" type="number" value={form.chest}
              onChange={e => setForm(f => ({ ...f, chest: e.target.value }))}
              placeholder="90" suffix="cm" step="0.1" />
            <Input label="Bras" type="number" value={form.arms}
              onChange={e => setForm(f => ({ ...f, arms: e.target.value }))}
              placeholder="32" suffix="cm" step="0.1" />
          </div>
          <Input label="Cuisses" type="number" value={form.thighs}
            onChange={e => setForm(f => ({ ...f, thighs: e.target.value }))}
            placeholder="55" suffix="cm" step="0.1" />
          <Button type="submit" fullWidth disabled={!hasAny}>
            Enregistrer les mesures
          </Button>
        </form>
      </Card>

      {/* History */}
      {measurements.length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Historique</h3>
          {measurements.slice(0, 5).map(m => (
            <div key={m.id} className="list-row">
              <div className="list-row__main">
                <span className="list-row__date">
                  {new Date(m.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className="list-row__notes">
                  {[
                    m.waist && `T:${m.waist}`,
                    m.hips && `H:${m.hips}`,
                    m.chest && `P:${m.chest}`,
                    m.whr && `WHR:${m.whr}`,
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
              <div className="list-row__right">
                <button className="list-row__delete" onClick={() => deleteMeasurement(m.id)}
                  type="button" aria-label="Supprimer">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {measurements.length === 0 && (
        <div className="empty-state">
          Aucune mesure enregistree. Commencez par saisir vos mensurations !
        </div>
      )}
    </div>
  );
}
