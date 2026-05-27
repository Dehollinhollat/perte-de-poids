# Weight Loss Tracker — Redesign + 7 Features

**Date:** 2026-05-27  
**Status:** Approved

---

## Scope

Complete visual redesign (Part A) plus 7 new feature pages (Part B) for the existing React/TypeScript/Vite PWA.

---

## Part A — Design Overhaul

### Typography
- Replace `Fraunces` (display) → `Plus Jakarta Sans` (700–800 for titles)
- Keep `DM Sans` for body (400–500)
- Stats/numbers: `Plus Jakarta Sans` semibold 600
- Update `index.html` font link

### CSS Variables (`index.css`)
Full replacement of existing `:root` variables with the new design system:

```
--bg-primary, --bg-secondary, --bg-card
--text-primary, --text-secondary, --text-muted
--accent (#FF6B6B), --accent-light, --accent-gradient
--success/warning/danger/info/sleep/water (+ *-light variants)
--shadow-sm/md/lg/card
--radius-sm/md/lg/xl/full
```

Dark mode via `[data-theme="dark"]` — same selector, updated values.

All existing component class names that reference old variables (`--primary`, `--dark`, `--surface`, `--bg`, `--gray`, etc.) are updated throughout all `.tsx` and `.css` files.

### Bottom Navigation
- Keep existing 5-tab bottom nav structure in `App.tsx`
- Tabs: Accueil, Poids, Calories, Activité, Plus
- "Plus" tab opens a bottom-sheet drawer listing all sub-pages:
  Hydratation, Sommeil, Mesures, Composition, Badges, Planificateur Repas, Tendances, Défis, Prédictions, Rapports, Paramètres
- Active tab: colored accent icon + small dot indicator
- Drawer: slides up from bottom, backdrop closes it
- New component: `src/components/BottomNav.tsx`
- `App.tsx` Page type extended with all new page keys

### Dashboard Card Redesign
- All cards: `border-radius: 16px`, `var(--shadow-card)`, `padding: 20px`
- Icon in pastel circle background
- Hover: `translateY(-2px)` + stronger shadow
- Staggered card appearance animation (CSS `animation-delay`)

### Animations & Transitions
- Page fade-in: 200ms
- Count-up numbers on dashboard mount
- Progress bars animate on mount
- Button press: `scale(0.97)` active state

### PWA Install Banner
- New component: `src/components/InstallBanner.tsx`
- Detects `beforeinstallprompt`, hides if already installed or dismissed < 7 days ago
- Gradient accent background, dismissible, stores dismissal in `localStorage`
- Rendered at top of `App.tsx` main content area

---

## Part B — 7 New Features

### Feature 1 — Predictions (`src/pages/PredictionsSection.tsx`)
- Calculates avg weight loss per week from historical data
- Projects goal date based on current trend
- Milestones: every kg from current to goal, each with estimated date
- 4 scenarios: current trend / better sleep / +exercise / optimal
- Uses existing `weights` array from `UserContext`
- No new storage needed (derived data only)

### Feature 2 — Weekly Report (`src/pages/WeeklyReport.tsx`)
- Aggregates one week of: weight, calories, water, sleep, activity
- Computes week score 0–100
- Identifies strengths + improvements
- Week navigation (prev/next)
- Reads from existing context data; no new storage

### Feature 3 — Bedtime Calculator (`src/pages/BedtimeCalculator.tsx`)
- Input: wake-up time + target sleep hours
- Outputs: bedtime + 3 alternatives (4/5/6 cycles × 90 min)
- Optional reminder toggle (uses existing reminders system)
- Pure calculation, no persistent storage needed

### Feature 4 — Daily Suggestion (`src/components/DailySuggestion.tsx`)
- Dashboard card component (not a full page)
- Reads `lastNightSleep` from `sleepEntries[0]`
- Returns activity level + 2–4 suggested activities + a tip
- "Enregistrer activité" button navigates to ActivitySection

### Feature 5 — Weekly Challenges (`src/pages/ChallengesSection.tsx`)
- Data model: `Challenge` interface with id, type, target, 7-day progress array
- Available pool: 5 challenge types (water, sugar, activity, sleep, calories)
- Max 1 active challenge at a time
- Progress auto-populated from existing daily data
- Storage: `challenges` array added to `localStorage` via `storage.ts`
- Context: `challenges`, `activeChallengeId`, `startChallenge()` added to `UserContext`
- Completing a challenge unlocks a badge (extends existing badge system)

### Feature 6 — Trends Analysis (`src/pages/TrendsSection.tsx`)
- Analyzes last 30 days of combined data
- Pearson correlation: sleep↔weight, water↔weight, activity↔weight
- Best day of week for weight loss
- Main insight text (sleep/water/activity based on strongest correlation)
- Pure derived data, no new storage

### Feature 7 — Meal Planner (`src/pages/MealPlanner.tsx`)
- Data models: `MealTemplate`, `DayPlan` interfaces
- Features: meal library, favorites, 10 recent meals, day view with 3 meals + snacks
- Total calories/macros auto-calculated
- Alert if plan exceeds calorie target
- Day navigation (prev/next)
- Storage: `mealTemplates`, `dayPlans` added to `localStorage` via `storage.ts`
- Context: corresponding state + actions added to `UserContext`

---

## Architecture Decisions

| Decision | Choice |
|----------|--------|
| Navigation state | `page` string in `App.tsx` (existing pattern) |
| New page routing | Extend `Page` union type in `App.tsx` |
| New data persistence | Extend existing `storage.ts` + `UserContext.tsx` |
| Drawer component | Inline in `BottomNav.tsx`, state lifted to `App.tsx` |
| New font | `index.html` link updated |
| Old CSS vars | Replaced everywhere; no aliases |

---

## Files Created
- `src/components/BottomNav.tsx`
- `src/components/InstallBanner.tsx`
- `src/components/DailySuggestion.tsx`
- `src/pages/PredictionsSection.tsx`
- `src/pages/WeeklyReport.tsx`
- `src/pages/BedtimeCalculator.tsx`
- `src/pages/ChallengesSection.tsx`
- `src/pages/TrendsSection.tsx`
- `src/pages/MealPlanner.tsx`

## Files Modified
- `index.html` (font link)
- `src/index.css` (full variable + typography overhaul)
- `src/App.tsx` (Page type, BottomNav, new page renders, InstallBanner)
- `src/types/index.ts` (Challenge, MealTemplate, DayPlan interfaces)
- `src/utils/storage.ts` (challenges, mealTemplates, dayPlans)
- `src/context/UserContext.tsx` (new state + actions)
- `src/pages/Dashboard.tsx` (DailySuggestion card, updated styles)
