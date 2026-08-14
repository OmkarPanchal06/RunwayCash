# UI/UX Brief
## RunwayCash — Predictive Expense Tracker

---

## 1. Design Principles

1. **Forecast first, history second.** Home screen leads with "what's ahead," not a transaction list.
2. **One glanceable number.** Safe-to-Spend-Today must be readable in under 1 second, no scrolling.
3. **Weather metaphor, consistently applied.** Icons, color, and copy tone all reinforce the forecast mental model (never mix in unrelated iconography for financial health).
4. **Never rely on color alone.** Every Money Weather state pairs an icon + text label (accessibility).
5. **Calm, not alarming.** Even shortfall states should read as "heads up" rather than red-alert panic — reduce anxiety-driven app abandonment.

## 2. Visual Design System

- **Palette**: Neutral base (warm off-white / near-black dark mode) with a 4-step "weather" accent scale:
  - Sunny → soft gold
  - Cloudy → muted blue-grey
  - Stormy → amber
  - Thunderstorm → deep slate-red (not pure red — avoid alarm-fatigue red)
- **Typography**: Large tabular numerals for the Safe-to-Spend figure (a distinct display font weight), standard humanist sans for body text.
- **Iconography**: Custom weather icon set (not literal clip-art weather) — minimal line-style, matches app's financial-calm tone.
- **Motion**: Runway number animates (count up/down) on change rather than snapping — reinforces "this is live" feeling.

## 3. Core Screens

### 3.1 Home — "Today"
- Top: Safe-to-Spend-Today, large, with a one-line context string ("after Rent + Netflix, before Friday's paycheck").
- Below: 30-day Money Weather horizontal scroll strip (7 days visible, swipeable).
- Quick-add transaction floating action button.
- Bottom nav: Today | Weather | Patterns (Expense DNA) | Forks | More

### 3.2 Money Weather (full 30-day view)
- Full calendar-strip view, tap any day → bottom sheet with breakdown (bills landing, projected discretionary spend, resulting balance).
- Legend always visible (icon + label + one-line meaning).

### 3.3 Add Transaction
- Minimal-friction single screen: amount (numeric keypad first), category (smart-suggested from merchant/note text), date (defaults today), optional note.
- Real-time preview: "This will move Thursday from ☀️ to ⛅" — direct causal feedback tying the entry to forecast impact.

### 3.4 Bills & Income Setup
- List view grouped by upcoming due date.
- Add/edit form: amount, frequency (weekly/biweekly/monthly/custom), due date, fixed vs. variable toggle (variable prompts for historical range or lets engine learn over time).

### 3.5 Expense DNA (Patterns)
- Card-based feed, one card per detected pattern: label, $ impact last 30 days, small sparkline, "Pin" / "Dismiss" actions.
- Tapping a card drills into the underlying transactions.

### 3.6 What-If Forks
- "+ New Fork" → template chooser (Cancel a bill / Add one-time expense / Delay income / Custom) or blank fork.
- Fork view mirrors Home + Weather layout but with a distinct visual treatment (dashed border / "Simulation" badge) so it's never confused with real data.
- Actions: Discard, Save (keep as reference), Commit (apply to real ledger).

### 3.7 Shared Runway (v1.1)
- Household switcher at top of Home.
- Combined weather strip shows shared bills/income only; toggle to "My view" for private discretionary spend.

## 4. Key Interaction Patterns

- **Optimistic updates**: any add/edit instantly nudges the Runway number and nearest Weather days before server confirmation; reconciles silently if the server value differs.
- **Explainability on tap, not by default**: every forecasted number has a tap-to-expand breakdown — keeps the primary view clean while never feeling like a black box.
- **Empty/cold-start states**: first-run experience guides user to add at least one bill and one income source before showing a (clearly labeled "estimated") Runway number, rather than showing $0 or an error.

## 5. Tone of Voice

- Plain language over financial jargon ("Safe to spend today" not "Discretionary liquidity index").
- Supportive, non-judgmental copy on shortfall days ("Tight day ahead — here's what's landing" not "Warning: overspending risk").
- Pattern labels in Expense DNA should feel observational, not shaming ("Weekend social spending" not "Impulse spending problem").

## 6. Accessibility Requirements

- WCAG AA contrast minimum across all weather states in both light/dark mode.
- All icons have text alternatives for screen readers.
- Numeric keypad entry supports assistive input methods.
- Dynamic type support (text scales with system settings without breaking layout).

## 7. Platform Notes

- Mobile-first (iOS + Android via React Native/Expo).
- Design for one-handed thumb reach on primary actions (quick-add FAB, bottom nav).
- Dark mode is a first-class variant, not an afterthought — designed alongside light mode from the start.
