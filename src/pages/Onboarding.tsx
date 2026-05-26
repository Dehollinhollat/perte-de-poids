import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { calculateBMI, calculateBMR, calculateTDEE } from '../utils/calculations';
import { UserProfile, WeightEntry } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

interface FormData {
  name: string;
  sex: 'homme' | 'femme' | 'autre';
  age: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  activityLevel: number;
}

const ACTIVITY_OPTIONS = [
  {
    value: 1.2,
    label: 'Sedentaire',
    desc: 'Peu ou pas d\'exercice, travail de bureau',
  },
  {
    value: 1.375,
    label: 'Legerement actif',
    desc: 'Exercice leger 1-3 jours par semaine',
  },
  {
    value: 1.55,
    label: 'Moderement actif',
    desc: 'Exercice modere 3-5 jours par semaine',
  },
  {
    value: 1.725,
    label: 'Tres actif',
    desc: 'Exercice intense 6-7 jours par semaine',
  },
  {
    value: 1.9,
    label: 'Extremement actif',
    desc: 'Travail physique intense quotidien',
  },
] as const;

export default function Onboarding() {
  const { saveProfile, addWeight } = useUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    sex: 'homme',
    age: '',
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: 1.375,
  });

  const update = (field: keyof FormData, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const liveBMI =
    form.height && form.currentWeight && Number(form.height) > 0 && Number(form.currentWeight) > 0
      ? calculateBMI(Number(form.currentWeight), Number(form.height))
      : null;

  const weeksToGoal =
    form.currentWeight && form.targetWeight && Number(form.currentWeight) > 0 && Number(form.targetWeight) > 0
      ? Math.abs(Math.round((Number(form.currentWeight) - Number(form.targetWeight)) / 0.7))
      : null;

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return form.sex !== undefined && Number(form.age) > 0 && Number(form.age) < 120;
      case 2:
        return Number(form.height) > 0 && Number(form.currentWeight) > 0;
      case 3:
        return Number(form.targetWeight) > 0;
      case 4:
        return form.activityLevel > 0;
      default:
        return true;
    }
  };

  const getTargetCalForSummary = (): number => {
    if (!form.age || !form.height || !form.currentWeight) return 0;
    const bmr = calculateBMR(
      Number(form.currentWeight),
      Number(form.height),
      Number(form.age),
      form.sex
    );
    const tdee = calculateTDEE(bmr, form.activityLevel);
    const target = tdee - 700;
    const min = form.sex === 'homme' ? 1500 : 1200;
    return Math.max(target, min);
  };

  const handleComplete = (e: FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: form.name || undefined,
      sex: form.sex,
      age: Number(form.age),
      height: Number(form.height),
      currentWeight: Number(form.currentWeight),
      targetWeight: Number(form.targetWeight),
      activityLevel: form.activityLevel as UserProfile['activityLevel'],
      startDate: new Date().toISOString().split('T')[0],
      initialBMI: liveBMI?.value ?? 0,
      onboardingCompleted: true,
    };

    saveProfile(profile);

    const firstEntry: WeightEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      weight: Number(form.currentWeight),
      bmi: liveBMI?.value ?? 0,
    };
    addWeight(firstEntry);
  };

  const progressPct = ((step - 1) / 4) * 100;

  return (
    <div className="onboarding">
      <div className="onboarding__header">
        <div className="onboarding__progress-bar">
          <div className="onboarding__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="onboarding__step-count">
          {step} / 5
        </div>
      </div>

      <div className="onboarding__body">
        {step === 1 && (
          <div className="step-slide" key="step1">
            <h1 className="step__title">Bienvenue !</h1>
            <p className="step__subtitle">Commençons par faire connaissance.</p>

            <Input
              label="Votre prenom (optionnel)"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Ex : Marie"
              autoComplete="given-name"
            />

            <div className="form-group">
              <label className="input-label">Sexe</label>
              <div className="choice-group">
                {(['homme', 'femme', 'autre'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`choice-btn${form.sex === s ? ' choice-btn--active' : ''}`}
                    onClick={() => update('sex', s)}
                  >
                    {s === 'homme' ? 'Homme' : s === 'femme' ? 'Femme' : 'Autre'}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Age"
              type="number"
              value={form.age}
              onChange={e => update('age', e.target.value)}
              placeholder="25"
              suffix="ans"
              min="10"
              max="120"
            />
          </div>
        )}

        {step === 2 && (
          <div className="step-slide" key="step2">
            <h1 className="step__title">Vos mensurations</h1>
            <p className="step__subtitle">Ces donnees servent a calculer votre IMC avec precision.</p>

            <Input
              label="Taille"
              type="number"
              value={form.height}
              onChange={e => update('height', e.target.value)}
              placeholder="170"
              suffix="cm"
              min="100"
              max="250"
            />

            <Input
              label="Poids actuel"
              type="number"
              value={form.currentWeight}
              onChange={e => update('currentWeight', e.target.value)}
              placeholder="75"
              suffix="kg"
              step="0.1"
              min="30"
              max="300"
            />

            {liveBMI && (
              <div className="bmi-preview" style={{ '--bmi-color': liveBMI.color } as React.CSSProperties}>
                <div className="bmi-preview__value">{liveBMI.value}</div>
                <div className="bmi-preview__meta">
                  <span className="bmi-preview__label">{liveBMI.label}</span>
                  <span className="bmi-preview__interp">{liveBMI.interpretation}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="step-slide" key="step3">
            <h1 className="step__title">Votre objectif</h1>
            <p className="step__subtitle">Quel poids souhaitez-vous atteindre ?</p>

            <div className="info-chip">
              Poids actuel : <strong>{form.currentWeight} kg</strong>
            </div>

            <Input
              label="Poids cible"
              type="number"
              value={form.targetWeight}
              onChange={e => update('targetWeight', e.target.value)}
              placeholder="65"
              suffix="kg"
              step="0.1"
              min="30"
              max="300"
            />

            {weeksToGoal !== null && Number(form.targetWeight) > 0 && (
              <div className="goal-estimate">
                <span className="goal-estimate__num">{weeksToGoal}</span>
                <span className="goal-estimate__text">
                  semaines estimees a raison d'un deficit de 700 kcal/jour
                </span>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="step-slide" key="step4">
            <h1 className="step__title">Niveau d'activite</h1>
            <p className="step__subtitle">Choisissez votre niveau d'activite physique habituel.</p>

            <div className="activity-list">
              {ACTIVITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`activity-item${form.activityLevel === opt.value ? ' activity-item--active' : ''}`}
                  onClick={() => update('activityLevel', opt.value)}
                >
                  <div className="activity-item__dot" />
                  <div>
                    <div className="activity-item__label">{opt.label}</div>
                    <div className="activity-item__desc">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-slide" key="step5">
            <h1 className="step__title">Votre profil</h1>
            <p className="step__subtitle">Tout est pret. Voici votre resume personnalise.</p>

            <div className="summary-grid">
              {liveBMI && (
                <div className="summary-item summary-item--accent" style={{ '--accent': liveBMI.color } as React.CSSProperties}>
                  <div className="summary-item__label">IMC</div>
                  <div className="summary-item__value">{liveBMI.value}</div>
                  <div className="summary-item__sub">{liveBMI.label}</div>
                </div>
              )}

              <div className="summary-item">
                <div className="summary-item__label">Objectif</div>
                <div className="summary-item__value">{form.targetWeight} kg</div>
                <div className="summary-item__sub">depuis {form.currentWeight} kg</div>
              </div>

              <div className="summary-item">
                <div className="summary-item__label">Calories / jour</div>
                <div className="summary-item__value">{getTargetCalForSummary()}</div>
                <div className="summary-item__sub">kcal recommandes</div>
              </div>

              {weeksToGoal !== null && (
                <div className="summary-item">
                  <div className="summary-item__label">Duree estimee</div>
                  <div className="summary-item__value">{weeksToGoal}</div>
                  <div className="summary-item__sub">semaines</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="onboarding__footer">
        {step > 1 && (
          <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
            Retour
          </Button>
        )}
        {step < 5 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            fullWidth={step === 1}
          >
            Continuer
          </Button>
        ) : (
          <Button onClick={handleComplete} fullWidth>
            Demarrer mon parcours
          </Button>
        )}
      </div>
    </div>
  );
}
