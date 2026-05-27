import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { calculateTargetCalories } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { MealTemplate, DayPlan } from '../types';

function dateStr(d: Date): string { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function dayLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const MEAL_EMOJIS = ['🍳','🥗','🍗','🍝','🥩','🐟','🥙','🥘','🍜','🥣','🍱','🧆','🥞','🍛','🫕'];

interface TemplateFormProps {
  initial?: MealTemplate;
  onSave: (t: MealTemplate) => void;
  onCancel: () => void;
}

function TemplateForm({ initial, onSave, onCancel }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🍳');
  const [calories, setCalories] = useState(String(initial?.calories ?? ''));
  const [protein, setProtein] = useState(String(initial?.protein ?? ''));
  const [carbs, setCarbs] = useState(String(initial?.carbs ?? ''));
  const [fat, setFat] = useState(String(initial?.fat ?? ''));
  const [sugar, setSugar] = useState(String(initial?.sugar ?? ''));

  const handleSave = () => {
    if (!name || !calories) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name,
      emoji,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      sugar: Number(sugar) || 0,
      isFavorite: initial?.isFavorite ?? false,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="template-form">
      <div className="template-form__row">
        <select
          className="emoji-select"
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
        >
          {MEAL_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input className="input" placeholder="Nom du repas *" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="template-form__macros">
        <div className="input-group">
          <label className="input-label">Calories *</label>
          <div className="input-wrapper"><input className="input" type="number" value={calories} onChange={e => setCalories(e.target.value)} /><span className="input-addon">kcal</span></div>
        </div>
        <div className="input-group">
          <label className="input-label">Protéines</label>
          <div className="input-wrapper"><input className="input" type="number" value={protein} onChange={e => setProtein(e.target.value)} /><span className="input-addon">g</span></div>
        </div>
        <div className="input-group">
          <label className="input-label">Glucides</label>
          <div className="input-wrapper"><input className="input" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} /><span className="input-addon">g</span></div>
        </div>
        <div className="input-group">
          <label className="input-label">Lipides</label>
          <div className="input-wrapper"><input className="input" type="number" value={fat} onChange={e => setFat(e.target.value)} /><span className="input-addon">g</span></div>
        </div>
        <div className="input-group">
          <label className="input-label">Sucres ajoutés</label>
          <div className="input-wrapper"><input className="input" type="number" value={sugar} onChange={e => setSugar(e.target.value)} /><span className="input-addon">g</span></div>
        </div>
      </div>
      <div className="action-row">
        <Button variant="primary" size="sm" onClick={handleSave}>Sauvegarder</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

type SlotKey = 'breakfast' | 'lunch' | 'dinner';

const SLOT_LABELS: Record<SlotKey, { icon: string; label: string }> = {
  breakfast: { icon: '🌅', label: 'Petit-déjeuner' },
  lunch:     { icon: '🌞', label: 'Déjeuner' },
  dinner:    { icon: '🌙', label: 'Dîner' },
};

export default function MealPlanner() {
  const { profile, weights, mealTemplates, dayPlans, saveMealTemplate, deleteMealTemplate, saveDayPlan, getDayPlan } = useUser();
  const [dayOffset, setDayOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | undefined>();
  const [pickingSlot, setPickingSlot] = useState<SlotKey | 'snack' | null>(null);

  if (!profile) return null;

  const targetCal = calculateTargetCalories({ ...profile, currentWeight: weights[0]?.weight ?? profile.currentWeight });
  const currentDate = addDays(new Date(), dayOffset);
  const currentDateStr = dateStr(currentDate);

  const plan: DayPlan = getDayPlan(currentDateStr) ?? {
    date: currentDateStr, breakfast: null, lunch: null, dinner: null, snacks: [],
  };

  const getTemplate = (id: string | null): MealTemplate | null => id ? mealTemplates.find(t => t.id === id) ?? null : null;

  const slotMeals: (MealTemplate | null)[] = [
    getTemplate(plan.breakfast),
    getTemplate(plan.lunch),
    getTemplate(plan.dinner),
    ...plan.snacks.map(id => getTemplate(id)),
  ];

  const totalCal = slotMeals.reduce((s, t) => s + (t?.calories ?? 0), 0);
  const remaining = targetCal - totalCal;
  const pct = Math.min(100, Math.round((totalCal / targetCal) * 100));

  const setSlot = (slot: SlotKey | 'snack', templateId: string | null) => {
    const updated: DayPlan = { ...plan };
    if (slot === 'snack' && templateId) {
      updated.snacks = [...plan.snacks, templateId];
    } else if (slot !== 'snack') {
      updated[slot] = templateId;
    }
    saveDayPlan(updated);
    setPickingSlot(null);
  };

  const removeSnack = (idx: number) => {
    saveDayPlan({ ...plan, snacks: plan.snacks.filter((_, i) => i !== idx) });
  };

  const favorites = mealTemplates.filter(t => t.isFavorite);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Planificateur</h1>
        <p className="page-subtitle">{dayLabel(currentDate)}</p>
      </div>

      {/* Day nav */}
      <div className="report-nav">
        <button className="btn btn--ghost btn--sm" onClick={() => setDayOffset(o => o - 1)} type="button">← Hier</button>
        {dayOffset < 0 && <button className="btn btn--ghost btn--sm" onClick={() => setDayOffset(o => o + 1)} type="button">Demain →</button>}
        {dayOffset !== 0 && <button className="btn btn--ghost btn--sm" onClick={() => setDayOffset(0)} type="button">Aujourd'hui</button>}
      </div>

      {/* Budget bar */}
      <Card padding="md">
        <div className="planner-budget">
          <span>Budget : <strong>{targetCal} kcal</strong></span>
          <span style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
            {remaining >= 0 ? `Restant : ${remaining}` : `Dépassé de ${Math.abs(remaining)}`} kcal
          </span>
        </div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div className="progress-bar__fill" style={{ width: `${pct}%`, background: remaining < 0 ? 'var(--danger)' : undefined }} />
        </div>
        <div className="planner-macros">
          <span>P: {slotMeals.reduce((s, t) => s + (t?.protein ?? 0), 0)}g</span>
          <span>G: {slotMeals.reduce((s, t) => s + (t?.carbs ?? 0), 0)}g</span>
          <span>L: {slotMeals.reduce((s, t) => s + (t?.fat ?? 0), 0)}g</span>
          <span>
            Sucres: {slotMeals.reduce((s, t) => s + (t?.sugar ?? 0), 0)}g
            {slotMeals.reduce((s, t) => s + (t?.sugar ?? 0), 0) === 0 && ' ✅'}
          </span>
        </div>
      </Card>

      {/* Meal slots */}
      {(Object.keys(SLOT_LABELS) as SlotKey[]).map(slot => {
        const tmpl = getTemplate(plan[slot]);
        return (
          <Card key={slot} padding="md">
            <div className="planner-slot-header">
              <span>{SLOT_LABELS[slot].icon} <strong>{SLOT_LABELS[slot].label}</strong></span>
              {tmpl && <span style={{ fontSize: 13, color: 'var(--accent)' }}>{tmpl.calories} kcal</span>}
            </div>
            {tmpl ? (
              <div className="planner-meal-row">
                <span>{tmpl.emoji} {tmpl.name}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="text-btn" onClick={() => setSlot(slot, null)} type="button">Supprimer</button>
                  <button className="text-btn" onClick={() => setPickingSlot(slot)} type="button">Changer</button>
                </div>
              </div>
            ) : (
              <div className="planner-empty-slot">
                <button className="btn btn--ghost btn--sm" onClick={() => setPickingSlot(slot)} type="button">+ Ajouter</button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Snacks */}
      <Card padding="md">
        <div className="planner-slot-header">
          <span>🍏 <strong>Snacks</strong></span>
          <button className="text-btn" onClick={() => setPickingSlot('snack')} type="button">+ Ajouter</button>
        </div>
        {plan.snacks.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun snack planifié</p>
        ) : (
          plan.snacks.map((id, i) => {
            const t = getTemplate(id);
            return t ? (
              <div key={i} className="planner-meal-row">
                <span>{t.emoji} {t.name} — {t.calories} kcal</span>
                <button className="text-btn" onClick={() => removeSnack(i)} type="button">✕</button>
              </div>
            ) : null;
          })
        )}
      </Card>

      {/* Template picker modal */}
      {pickingSlot && (
        <div className="scanner-overlay" onClick={() => setPickingSlot(null)}>
          <div className="scanner-modal" onClick={e => e.stopPropagation()}>
            <div className="scanner-modal__header">
              <span className="scanner-modal__title">Choisir un repas</span>
              <button className="scanner-modal__close" onClick={() => setPickingSlot(null)} type="button">×</button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mealTemplates.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Aucun repas sauvegardé. Créez-en un ci-dessous.
                </p>
              ) : (
                mealTemplates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className="planner-picker-row"
                    onClick={() => setSlot(pickingSlot, t.id)}
                  >
                    <span>{t.emoji} {t.name}</span>
                    <span style={{ color: 'var(--accent)', fontSize: 13 }}>{t.calories} kcal</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <Card padding="md">
          <div className="card-label" style={{ marginBottom: 8 }}>⭐ Favoris</div>
          <div className="planner-favorites">
            {favorites.map(t => (
              <span key={t.id} className="planner-fav-chip">{t.emoji} {t.name}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Template library */}
      <Card padding="md">
        <div className="card-row card-row--between" style={{ marginBottom: 12 }}>
          <div className="card-label">Bibliothèque de Repas</div>
          <button className="text-btn" onClick={() => { setEditingTemplate(undefined); setShowForm(true); }} type="button">
            + Nouveau
          </button>
        </div>

        {showForm && (
          <TemplateForm
            initial={editingTemplate}
            onSave={t => { saveMealTemplate(t); setShowForm(false); setEditingTemplate(undefined); }}
            onCancel={() => { setShowForm(false); setEditingTemplate(undefined); }}
          />
        )}

        {mealTemplates.length === 0 && !showForm ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun repas créé pour l'instant.</p>
        ) : (
          mealTemplates.map(t => (
            <div key={t.id} className="template-row">
              <span>{t.emoji}</span>
              <div className="template-row__info">
                <span className="template-row__name">{t.name}</span>
                <span className="template-row__cal">{t.calories} kcal · P{t.protein}g · G{t.carbs}g · L{t.fat}g</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="text-btn"
                  type="button"
                  onClick={() => saveMealTemplate({ ...t, isFavorite: !t.isFavorite })}
                >
                  {t.isFavorite ? '⭐' : '☆'}
                </button>
                <button className="text-btn" type="button" onClick={() => { setEditingTemplate(t); setShowForm(true); }}>✏️</button>
                <button className="text-btn" type="button" onClick={() => deleteMealTemplate(t.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
