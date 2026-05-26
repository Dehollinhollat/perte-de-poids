import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { calculateBMI } from '../utils/calculations';
import { WeightEntry } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const sorted = [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14);

  if (sorted.length < 2) {
    return (
      <div className="chart-empty">
        Ajoutez au moins 2 entrees pour voir le graphique
      </div>
    );
  }

  const W = 320;
  const H = 110;
  const PAD_X = 8;
  const PAD_Y = 12;

  const ws = sorted.map(e => e.weight);
  const minW = Math.min(...ws);
  const maxW = Math.max(...ws);
  const range = maxW - minW || 0.5;

  const pts = sorted.map((e, i) => ({
    x: PAD_X + (i / (sorted.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - (e.weight - minW) / range) * (H - PAD_Y * 2),
    weight: e.weight,
    date: e.date,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 3;
    const cp2x = p.x - (p.x - prev.x) / 3;
    return `${acc} C ${cp1x} ${prev.y} ${cp2x} ${p.y} ${p.x} ${p.y}`;
  }, '');

  const last = pts[pts.length - 1];
  const areaPath = `${linePath} L ${last.x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <div className="weight-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="110" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#wg)" />
        <path
          d={linePath}
          fill="none"
          stroke="#FF6B6B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#FF6B6B" />
        ))}
      </svg>
      <div className="chart-labels">
        <span>{formatDate(sorted[0].date)}</span>
        <span>{formatDate(sorted[sorted.length - 1].date)}</span>
      </div>
    </div>
  );
}

export default function WeightTracker() {
  const { profile, weights, addWeight, deleteWeight } = useUser();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!weight || !profile) return;

    const w = Number(weight);
    if (w <= 0 || w > 500) {
      setError('Entrez un poids valide');
      return;
    }

    const bmi = calculateBMI(w, profile.height);
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      date,
      weight: w,
      bmi: bmi.value,
      notes: notes || undefined,
    };

    addWeight(entry);
    setWeight('');
    setNotes('');
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Suivi du poids</h1>
        {weights[0] && (
          <p className="page-subtitle">
            Dernier enregistrement : {weights[0].weight} kg le {formatDate(weights[0].date)}
          </p>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <Input
              label="Poids"
              type="number"
              value={weight}
              onChange={e => { setWeight(e.target.value); setError(''); }}
              placeholder="75.0"
              suffix="kg"
              step="0.1"
              min="30"
              max="500"
              error={error}
            />
          </div>
          <Input
            label="Notes (optionnel)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Apres le sport, a jeun..."
          />
          <Button type="submit" fullWidth disabled={!weight}>
            Enregistrer
          </Button>
        </form>
      </Card>

      {weights.length >= 2 && (
        <Card padding="sm">
          <span className="card-label" style={{ marginBottom: '8px', display: 'block' }}>
            Courbe de poids
          </span>
          <WeightChart entries={weights} />
        </Card>
      )}

      {weights.length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Historique</h3>
          {weights.slice(0, 10).map(entry => {
            const bmi = calculateBMI(entry.weight, profile?.height ?? 170);
            return (
              <div key={entry.id} className="list-row">
                <div className="list-row__main">
                  <span className="list-row__date">{formatDate(entry.date)}</span>
                  {entry.notes && (
                    <span className="list-row__notes">{entry.notes}</span>
                  )}
                </div>
                <div className="list-row__right">
                  <span className="list-row__value">{entry.weight} kg</span>
                  <span className="list-row__badge" style={{ color: bmi.color }}>
                    IMC {entry.bmi}
                  </span>
                  <button
                    className="list-row__delete"
                    onClick={() => deleteWeight(entry.id)}
                    aria-label="Supprimer"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {weights.length === 0 && (
        <div className="empty-state">
          Aucune entree pour le moment. Enregistrez votre premier poids !
        </div>
      )}
    </div>
  );
}
