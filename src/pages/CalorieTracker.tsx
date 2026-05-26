import React, { useState, FormEvent } from 'react';
import { useUser } from '../context/UserContext';
import { calculateTargetCalories } from '../utils/calculations';
import { Meal } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import BarcodeScanner from '../components/BarcodeScanner';

interface MealForm {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  containsAddedSugar: boolean;
  notes: string;
}

const EMPTY_FORM: MealForm = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  containsAddedSugar: false,
  notes: '',
};

export default function CalorieTracker() {
  const { profile, todaysMeals, todaysCalories, addMeal, deleteMeal } = useUser();
  const [form, setForm] = useState<MealForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const targetCal = profile ? calculateTargetCalories(profile) : 2000;
  const calPct = Math.min(100, (todaysCalories / targetCal) * 100);
  const remaining = targetCal - todaysCalories;

  const totalProtein = todaysMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = todaysMeals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = todaysMeals.reduce((s, m) => s + m.fat, 0);

  const update = (field: keyof MealForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.calories) return;

    const meal: Meal = {
      id: crypto.randomUUID(),
      name: form.name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      containsAddedSugar: form.containsAddedSugar,
      notes: form.notes || undefined,
    };

    addMeal(meal);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calories du jour</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Daily summary */}
      <Card>
        <div className="card-row card-row--between">
          <span className="card-label">Aujourd'hui</span>
          <span className={`cal-status${remaining < 0 ? ' cal-status--over' : ''}`}>
            {remaining < 0
              ? `+${Math.abs(remaining)} kcal en trop`
              : `${remaining} kcal restantes`}
          </span>
        </div>

        <div className="cal-numbers">
          <span className="cal-current">{todaysCalories}</span>
          <span className="cal-divider"> / </span>
          <span className="cal-target">{targetCal}</span>
          <span className="cal-unit"> kcal</span>
        </div>

        <div className="progress-bar" style={{ marginBottom: '12px' }}>
          <div
            className={`progress-bar__fill${remaining < 0 ? ' progress-bar__fill--over' : ''}`}
            style={{ width: `${Math.min(calPct, 100)}%` }}
          />
        </div>

        {(totalProtein > 0 || totalCarbs > 0 || totalFat > 0) && (
          <div className="macro-row">
            <div className="macro-pill macro-pill--protein">
              <span className="macro-pill__val">{totalProtein}g</span>
              <span className="macro-pill__label">Proteines</span>
            </div>
            <div className="macro-pill macro-pill--carbs">
              <span className="macro-pill__val">{totalCarbs}g</span>
              <span className="macro-pill__label">Glucides</span>
            </div>
            <div className="macro-pill macro-pill--fat">
              <span className="macro-pill__val">{totalFat}g</span>
              <span className="macro-pill__label">Lipides</span>
            </div>
          </div>
        )}
      </Card>

      {/* Add meal */}
      {!showForm ? (
        <div className="action-row">
          <Button onClick={() => setShowForm(true)} fullWidth variant="primary">
            + Ajouter un repas
          </Button>
          <Button onClick={() => setShowScanner(true)} fullWidth variant="secondary">
            📷 Scanner
          </Button>
        </div>
      ) : (
        <Card>
          <div className="card-row card-row--between" style={{ marginBottom: '16px' }}>
            <h3 className="section-title">Nouveau repas</h3>
            <button
              className="text-btn"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              type="button"
            >
              Annuler
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            <Input
              label="Nom du repas"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Ex : Dejeuner, Collation..."
              required
            />

            <div className="form-row">
              <Input
                label="Calories"
                type="number"
                value={form.calories}
                onChange={e => update('calories', e.target.value)}
                placeholder="0"
                suffix="kcal"
                min="0"
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="Proteines"
                type="number"
                value={form.protein}
                onChange={e => update('protein', e.target.value)}
                placeholder="0"
                suffix="g"
                min="0"
              />
              <Input
                label="Glucides"
                type="number"
                value={form.carbs}
                onChange={e => update('carbs', e.target.value)}
                placeholder="0"
                suffix="g"
                min="0"
              />
              <Input
                label="Lipides"
                type="number"
                value={form.fat}
                onChange={e => update('fat', e.target.value)}
                placeholder="0"
                suffix="g"
                min="0"
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox"
                checked={form.containsAddedSugar}
                onChange={e => update('containsAddedSugar', e.target.checked)}
              />
              <span>Contient des sucres ajoutes</span>
            </label>

            <Input
              label="Notes (optionnel)"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Restaurant, maison..."
            />

            <Button type="submit" fullWidth disabled={!form.name || !form.calories}>
              Ajouter le repas
            </Button>
          </form>
        </Card>
      )}

      {/* Meal list */}
      {todaysMeals.length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Repas du jour</h3>
          {todaysMeals.map(meal => (
            <div key={meal.id} className="meal-row">
              <div className="meal-row__info">
                <span className="meal-row__name">{meal.name}</span>
                <span className="meal-row__time">{meal.time}</span>
                {meal.containsAddedSugar && (
                  <span className="sugar-tag">sucres ajoutes</span>
                )}
              </div>
              <div className="meal-row__right">
                <span className="meal-row__cal">{meal.calories} kcal</span>
                {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                  <span className="meal-row__macros">
                    P{meal.protein} G{meal.carbs} L{meal.fat}
                  </span>
                )}
                <button
                  className="list-row__delete"
                  onClick={() => deleteMeal(meal.id)}
                  aria-label="Supprimer"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onResult={p => {
            setForm({
              name: p.name,
              calories: String(p.calories),
              protein: String(p.protein),
              carbs: String(p.carbs),
              fat: String(p.fat),
              containsAddedSugar: p.sugars > 5,
              notes: '',
            });
            setShowScanner(false);
            setShowForm(true);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {todaysMeals.length === 0 && !showForm && (
        <div className="empty-state">
          Aucun repas enregistre aujourd'hui. Ajoutez votre premier repas !
        </div>
      )}
    </div>
  );
}
