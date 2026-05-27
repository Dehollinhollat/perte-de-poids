import React from 'react';
import { useUser } from '../context/UserContext';
import Card from './common/Card';
import Button from './common/Button';

interface Props {
  onLogActivity: () => void;
}

interface Suggestion {
  level: 'rest' | 'light' | 'moderate' | 'high';
  emoji: string;
  title: string;
  description: string;
  activities: { name: string; duration: string; calories: number }[];
  tip: string;
}

function getSuggestion(sleep: number): Suggestion {
  if (sleep < 5) {
    return {
      level: 'rest',
      emoji: '🛑',
      title: 'Repos aujourd\'hui',
      description: `Vous avez dormi ${sleep.toFixed(1)}h. Votre corps a besoin de récupération.`,
      activities: [
        { name: 'Étirements doux', duration: '10 min', calories: 25 },
        { name: 'Marche très légère', duration: '15 min max', calories: 45 },
      ],
      tip: 'Priorisez une sieste de 20 min si possible.',
    };
  }
  if (sleep < 6.5) {
    return {
      level: 'light',
      emoji: '🟡',
      title: 'Activité légère',
      description: `${sleep.toFixed(1)}h de sommeil. Activité douce recommandée.`,
      activities: [
        { name: 'Marche rapide', duration: '25-30 min', calories: 120 },
        { name: 'Yoga relaxant', duration: '20 min', calories: 60 },
        { name: 'Vélo tranquille', duration: '20 min', calories: 100 },
      ],
      tip: 'Couchez-vous plus tôt ce soir !',
    };
  }
  if (sleep < 7.5) {
    return {
      level: 'moderate',
      emoji: '🟢',
      title: 'Bonne énergie !',
      description: `${sleep.toFixed(1)}h de sommeil. Vous pouvez y aller !`,
      activities: [
        { name: 'Marche rapide', duration: '40 min', calories: 180 },
        { name: 'Course légère', duration: '25 min', calories: 220 },
        { name: 'Renforcement', duration: '20 min', calories: 150 },
        { name: 'Natation', duration: '30 min', calories: 200 },
      ],
      tip: 'Parfait, continuez sur cette lancée !',
    };
  }
  return {
    level: 'high',
    emoji: '🔥',
    title: 'Énergie maximale !',
    description: `${sleep.toFixed(1)}h de sommeil. Vous êtes en pleine forme !`,
    activities: [
      { name: 'Course', duration: '35-45 min', calories: 350 },
      { name: 'HIIT', duration: '20 min', calories: 250 },
      { name: 'Circuit training', duration: '30 min', calories: 300 },
      { name: 'Sport collectif', duration: '60 min', calories: 400 },
    ],
    tip: 'Vous êtes au top ! Profitez-en !',
  };
}

const LEVEL_COLORS: Record<string, string> = {
  rest: 'var(--danger)',
  light: 'var(--warning)',
  moderate: 'var(--success)',
  high: 'var(--accent)',
};

export default function DailySuggestion({ onLogActivity }: Props) {
  const { sleepEntries } = useUser();
  const lastSleep = sleepEntries[0]?.duration ?? 0;
  const s = getSuggestion(lastSleep);

  return (
    <Card padding="md">
      <div className="card-row card-row--between">
        <span className="card-label">Suggestion du Jour</span>
        <span style={{ fontSize: 20 }}>{s.emoji}</span>
      </div>

      <div className="suggestion-header" style={{ color: LEVEL_COLORS[s.level] }}>
        {s.title}
      </div>
      <p className="suggestion-desc">{s.description}</p>

      <div className="suggestion-activities">
        {s.activities.slice(0, 3).map(a => (
          <div key={a.name} className="suggestion-activity">
            <span className="suggestion-activity__name">{a.name}</span>
            <span className="suggestion-activity__meta">{a.duration} · ~{a.calories} kcal</span>
          </div>
        ))}
      </div>

      <p className="suggestion-tip">💡 {s.tip}</p>

      <div style={{ marginTop: 12 }}>
        <Button variant="primary" size="sm" onClick={onLogActivity}>
          Enregistrer activité
        </Button>
      </div>
    </Card>
  );
}
