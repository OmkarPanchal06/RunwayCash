# App Flow
## RunwayCash — Predictive Expense Tracker

---

## 1. First-Run / Onboarding Flow

```
Splash
  → Sign up / Log in (email+password or OAuth)
  → Welcome: "RunwayCash tells you what's safe to spend, every day"
  → Create Account (name your account, e.g. "Checking")
  → Set current balance
  → Prompt: "Add your recurring bills" (skip allowed, but nudged)
      → Add Bill form (repeatable, "Add another")
  → Prompt: "Add your income" (skip allowed, but nudged)
      → Add Income form (repeatable)
  → Home screen shown with:
      - If bills/income added: real (or lightly-estimated) Runway number
      - If skipped: clearly labeled "Estimated" Runway using cold-start heuristic (TRD §5.4)
      - First-run tooltip pointing at Money Weather strip
```

**Edge case**: user skips both bills and income → Home still renders using cold-start default; a persistent (dismissible) banner invites setup: "Add a bill or income source for a more accurate forecast."

## 2. Core Loop — Daily Use

```
Open App
  → Home ("Today") loads cached Runway snapshot instantly (optimistic/local-first)
  → Background: client requests fresh snapshot from server, reconciles if different
  → User glances at Safe-to-Spend-Today + next few Weather days
  → [Optional] User taps + to log a transaction
      → Quick-add sheet → amount, category (auto-suggested), date, note
      → On submit: optimistic local Runway update animates immediately
      → Server confirms → snapshot reconciled (silent unless meaningfully different)
  → [Optional] User swipes Money Weather strip to browse further days
      → Tap a day → bottom sheet breakdown (bills + projected spend for that day)
```

## 3. Add/Edit Bill or Income Flow

```
Bills & Income tab
  → List (grouped by next due date)
  → Tap "+ Add Bill" or "+ Add Income"
      → Form: name, amount, frequency, due date, fixed/variable toggle
      → [If variable] prompt for historical range OR "let RunwayCash learn from transactions" (auto-linking)
  → Save
      → Runway Engine recompute triggered (async job)
      → Home/Weather screens reflect update within ~1s (optimistic) / confirmed within ~1s (server)
```

## 4. Expense DNA Flow

```
Patterns tab
  → Feed of pattern cards (server-computed nightly, cached)
  → Tap a card → drill-in list of underlying transactions
  → Actions per card:
      - Pin → stays at top, tracked over time with trend sparkline
      - Dismiss → hidden from feed (does not affect Runway Engine, purely informational)
  → Empty state (insufficient data): "Add more transactions to unlock spending patterns" (needs ~14+ days of data)
```

## 5. What-If Fork Flow

```
Forks tab
  → "+ New Fork"
      → Template chooser: Cancel a Bill | Add One-Time Expense | Delay Income | Blank/Custom
      → [If template] pre-fills diff (e.g., select which bill to cancel)
      → [If blank] user manually adds hypothetical bill/transaction/income overrides
  → Fork preview screen (mirrors Home layout, "Simulation" badge, dashed border treatment)
      → Shows recomputed Safe-to-Spend + Weather strip for the fork context only
  → Actions:
      - Discard → fork deleted, no trace
      - Save → fork persists in list for later reference, real ledger untouched
      - Commit → diff applied to real ledger (creates/edits actual bill/transaction/income records);
                 fork status → 'committed'; real Runway Engine recomputes
```

**Edge case**: user has multiple unsaved forks open — only one active fork context per session to avoid confusion; switching forks prompts save/discard on the previous one.

## 6. Shared Runway Flow (v1.1)

```
Home → Household switcher (if user is in a household)
  → "My View" (default): private discretionary spend visible, shared bills/income included in Runway
  → "Household View": combined Runway using only shared bills/income + each member's shared-only transactions
  → Invite flow: Owner generates invite link → invitee signs up/logs in → accepts →
      joins household → prompted to mark which of their existing bills/income are shared
```

## 7. Shortfall Notification Flow

```
Nightly cron / on-recompute
  → Runway Engine detects a Thunderstorm (shortfall) day within next 7 days
  → Rate limiter checks: has user received a shortfall alert today? If yes, suppress.
  → Push notification sent: "Heads up — [Day] looks tight based on your bills and spending"
  → Tap notification → deep link to that specific day in Money Weather view
```

## 8. Offline Flow

```
User adds transaction while offline
  → Stored locally (WatermelonDB/SQLite) with idempotency key
  → Local Runway recalculation runs client-side using last-synced data (approximate)
  → UI shows "Offline — estimates may update once synced" badge
  → On reconnect:
      → Queued transactions synced to server (idempotency key prevents duplicates)
      → Server recomputes authoritative Runway snapshot
      → Client reconciles, badge clears
```

## 9. Account/Data Deletion Flow

```
Settings → Delete Account
  → Confirmation modal (explicit typed confirmation)
  → Soft-delete immediately (account inaccessible)
  → Hard purge job runs after retention window (or immediately if user requests under data-rights request)
  → Household membership (if any) auto-removed, shared bills/income references cleaned up
```
