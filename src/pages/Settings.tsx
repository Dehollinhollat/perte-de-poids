import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { UserProfile, Reminder } from '../types';
import { calculateBMI } from '../utils/calculations';
import { getReminderIcon } from '../utils/reminders';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ACTIVITY_OPTIONS = [
  { value: 1.2,   label: 'Sedentaire' },
  { value: 1.375, label: 'Legerement actif' },
  { value: 1.55,  label: 'Moderement actif' },
  { value: 1.725, label: 'Tres actif' },
  { value: 1.9,   label: 'Extremement actif' },
] as const;

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`toggle${value ? ' toggle--on' : ''}`} onClick={() => onChange(!value)}>
      <span className="toggle__thumb" />
    </button>
  );
}

export default function Settings() {
  const {
    profile, weights, meals, hydrationLogs, sleepEntries, measurements, activities,
    saveProfile, hydrationGoalMl, activityGoalMin, updateHydrationGoal, updateActivityGoal,
    theme, toggleTheme,
    reminders, saveReminders,
    fastingSettings, saveFastingSettings,
  } = useUser();

  const [saved, setSaved] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const [form, setForm] = useState({
    name: profile?.name ?? '',
    sex: profile?.sex ?? 'homme' as UserProfile['sex'],
    age: String(profile?.age ?? ''),
    height: String(profile?.height ?? ''),
    currentWeight: String(profile?.currentWeight ?? ''),
    targetWeight: String(profile?.targetWeight ?? ''),
    activityLevel: profile?.activityLevel ?? 1.375,
  });

  const [hydGoal, setHydGoal] = useState(String(hydrationGoalMl));
  const [actGoal, setActGoal] = useState(String(activityGoalMin));
  const [fastStart, setFastStart] = useState(fastingSettings.windowStart);
  const [fastEnd, setFastEnd] = useState(fastingSettings.windowEnd);
  const [fastHours, setFastHours] = useState(String(fastingSettings.targetHours));

  const update = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const w = Number(form.currentWeight); const h = Number(form.height);
    saveProfile({
      ...profile,
      name: form.name || undefined,
      sex: form.sex,
      age: Number(form.age),
      height: h,
      currentWeight: w,
      targetWeight: Number(form.targetWeight),
      activityLevel: form.activityLevel as UserProfile['activityLevel'],
      initialBMI: profile.initialBMI || calculateBMI(w, h).value,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleGoalsSave = (e: FormEvent) => {
    e.preventDefault();
    const hml = Number(hydGoal); const amin = Number(actGoal);
    if (hml >= 500 && hml <= 5000) updateHydrationGoal(hml);
    if (amin >= 5 && amin <= 300) updateActivityGoal(amin);
    setGoalsSaved(true);
    setTimeout(() => setGoalsSaved(false), 2500);
  };

  const handleFastingSave = () => {
    saveFastingSettings({
      enabled: fastingSettings.enabled,
      targetHours: Number(fastHours),
      windowStart: fastStart,
      windowEnd: fastEnd,
    });
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const toggleReminder = (id: string) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateReminderTime = (id: string, time: string) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, time } : r));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({
      exportDate: new Date().toISOString(),
      profile, weights, meals, hydrationLogs, sleepEntries, measurements, activities,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wlt-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRedoOnboarding = () => {
    if (!profile) return;
    saveProfile({ ...profile, onboardingCompleted: false });
    window.location.reload();
  };

  const totalEntries = weights.length + meals.length + hydrationLogs.length +
    sleepEntries.length + measurements.length + activities.length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Parametres</h1>
      </div>

      <div className="dashboard-stack">
        {/* Profile */}
        <Card>
          <h3 className="section-title" style={{ marginBottom: '16px' }}>Mon Profil</h3>
          <form onSubmit={handleSave} className="form-stack">
            <Input label="Prenom (optionnel)" value={form.name}
              onChange={e => update('name', e.target.value)} placeholder="Marie" />
            <div className="form-group">
              <label className="input-label">Sexe</label>
              <div className="choice-group">
                {(['homme', 'femme', 'autre'] as const).map(s => (
                  <button key={s} type="button"
                    className={`choice-btn${form.sex === s ? ' choice-btn--active' : ''}`}
                    onClick={() => update('sex', s)}>
                    {s === 'homme' ? 'Homme' : s === 'femme' ? 'Femme' : 'Autre'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <Input label="Age" type="number" value={form.age}
                onChange={e => update('age', e.target.value)} suffix="ans" min="10" max="120" />
              <Input label="Taille" type="number" value={form.height}
                onChange={e => update('height', e.target.value)} suffix="cm" />
            </div>
            <div className="form-row">
              <Input label="Poids actuel" type="number" value={form.currentWeight}
                onChange={e => update('currentWeight', e.target.value)} suffix="kg" step="0.1" />
              <Input label="Poids cible" type="number" value={form.targetWeight}
                onChange={e => update('targetWeight', e.target.value)} suffix="kg" step="0.1" />
            </div>
            <div className="form-group">
              <label className="input-label">Niveau d'activite</label>
              <select className="select-input" value={form.activityLevel}
                onChange={e => update('activityLevel', Number(e.target.value))}>
                {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Button type="submit" fullWidth variant={saved ? 'secondary' : 'primary'}>
              {saved ? 'Profil sauvegarde !' : 'Sauvegarder le profil'}
            </Button>
          </form>
        </Card>

        {/* Objectifs */}
        <Card>
          <h3 className="section-title" style={{ marginBottom: '16px' }}>Objectifs quotidiens</h3>
          <form onSubmit={handleGoalsSave} className="form-stack">
            <Input label="Objectif d'hydratation" type="number" value={hydGoal}
              onChange={e => setHydGoal(e.target.value)} suffix="ml" min="500" max="5000" step="50" />
            <Input label="Objectif d'activite" type="number" value={actGoal}
              onChange={e => setActGoal(e.target.value)} suffix="min/j" min="5" max="300" step="5" />
            <Button type="submit" fullWidth variant={goalsSaved ? 'secondary' : 'primary'}>
              {goalsSaved ? 'Objectifs sauvegardes !' : 'Sauvegarder les objectifs'}
            </Button>
          </form>
        </Card>

        {/* Apparence */}
        <Card>
          <h3 className="section-title" style={{ marginBottom: '14px' }}>Apparence</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">{theme === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair'}</span>
              <span className="settings-row__sub">Suivre le systeme ou choisir manuellement</span>
            </div>
            <Toggle value={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </Card>

        {/* Rappels */}
        <Card>
          <h3 className="section-title" style={{ marginBottom: '14px' }}>Rappels</h3>

          {notifPermission !== 'granted' && (
            <Button onClick={requestNotifPermission} variant="secondary" fullWidth style={{ marginBottom: '12px' }}>
              🔔 Autoriser les notifications
            </Button>
          )}
          {notifPermission === 'granted' && (
            <p className="settings-note" style={{ marginBottom: '10px', color: '#10B981' }}>✓ Notifications autorisees</p>
          )}

          <div className="reminder-list">
            {reminders.map(r => (
              <div key={r.id} className="reminder-row">
                <span className="reminder-row__icon">{getReminderIcon(r.type)}</span>
                <div className="reminder-row__info">
                  <span className="reminder-row__label">{r.label}</span>
                  <input type="time" className="reminder-time-input" value={r.time}
                    onChange={e => updateReminderTime(r.id, e.target.value)} />
                </div>
                <Toggle value={r.enabled} onChange={() => toggleReminder(r.id)} />
              </div>
            ))}
          </div>
        </Card>

        {/* Jeune intermittent */}
        <Card>
          <div className="settings-row" style={{ marginBottom: fastingSettings.enabled ? '14px' : '0' }}>
            <div className="settings-row__info">
              <span className="settings-row__label">🌙 Jeune intermittent</span>
              <span className="settings-row__sub">Active le tracker de jeune dans Sante</span>
            </div>
            <Toggle
              value={fastingSettings.enabled}
              onChange={v => saveFastingSettings({ ...fastingSettings, enabled: v })}
            />
          </div>
          {fastingSettings.enabled && (
            <div className="form-stack">
              <div className="form-row">
                <Input label="Debut du jeune" type="time" value={fastStart}
                  onChange={e => setFastStart(e.target.value)} />
                <Input label="Fin du jeune" type="time" value={fastEnd}
                  onChange={e => setFastEnd(e.target.value)} />
              </div>
              <Input label="Duree cible" type="number" value={fastHours}
                onChange={e => setFastHours(e.target.value)} suffix="heures" min="8" max="24" step="1" />
              <Button fullWidth onClick={handleFastingSave} variant="secondary">
                Sauvegarder le jeune
              </Button>
            </div>
          )}
        </Card>

        {/* Donnees */}
        <Card>
          <h3 className="section-title" style={{ marginBottom: '12px' }}>Mes Donnees</h3>
          <div className="data-stats">
            <div className="data-stat"><strong>{weights.length}</strong> pesees</div>
            <div className="data-stat"><strong>{meals.length}</strong> repas</div>
            <div className="data-stat"><strong>{hydrationLogs.length}</strong> hydratations</div>
            <div className="data-stat"><strong>{sleepEntries.length}</strong> nuits</div>
            <div className="data-stat"><strong>{measurements.length}</strong> mesures</div>
            <div className="data-stat"><strong>{activities.length}</strong> activites</div>
          </div>
          <Button onClick={exportData} variant="secondary" fullWidth>
            Exporter toutes mes donnees (JSON)
          </Button>
          <p className="settings-note">
            Toutes vos donnees ({totalEntries} entrees) sont stockees localement sur votre appareil.
          </p>
        </Card>

        {/* A propos */}
        <Card>
          <h3 className="section-title" style={{ marginBottom: '12px' }}>A propos</h3>
          <div className="version-info">
            <div className="version-row"><span>Version</span><span className="version-val">3.0.0</span></div>
            <div className="version-row">
              <span>Fonctionnalites</span>
              <span className="version-val">Poids · Calories · Hydratation · Sommeil · Mesures · Activite · Badges · Jeune</span>
            </div>
          </div>
          <Button onClick={handleRedoOnboarding} variant="ghost" fullWidth style={{ marginTop: '12px' }}>
            Refaire l'introduction
          </Button>
        </Card>

        {/* Danger */}
        <Card>
          <h3 className="section-title" style={{ color: '#EF4444', marginBottom: '12px' }}>Zone dangereuse</h3>
          {!showReset ? (
            <Button onClick={() => setShowReset(true)} variant="danger" fullWidth>Reinitialiser l'application</Button>
          ) : (
            <div className="reset-confirm">
              <p className="reset-confirm__text">
                Cette action supprimera definitivement toutes vos donnees. Cette operation est irreversible.
              </p>
              <div className="action-row">
                <Button onClick={() => setShowReset(false)} variant="ghost" fullWidth>Annuler</Button>
                <Button onClick={() => { localStorage.clear(); window.location.reload(); }} variant="danger" fullWidth>
                  Confirmer la suppression
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
