# Product Requirements Document (PRD)
## RunwayCash — Predictive Expense Tracker

---

## 1. Background & Problem Statement

Existing expense trackers fall into two camps:
- **Passive trackers** (Mint-style): categorize past spending, show pie charts. User still has to do the math on "can I afford this?" themselves.
- **Manual budgeting tools** (YNAB-style): powerful but require constant manual envelope assignment — high discipline cost, steep drop-off.

Neither answers the question users actually ask multiple times a week: **"Can I spend this right now without messing up my month?"**

## 2. Product Vision

RunwayCash answers that question automatically, continuously, and visually — turning budgeting from a monthly chore into a glanceable daily forecast, the way a weather app turns climate data into "bring an umbrella."

## 3. Target Users

| Persona | Description | Core Need |
|---|---|---|
| Gig/irregular-income earner | Freelancer, driver, creator — income arrives unevenly | Needs to know safe-to-spend despite irregular deposits |
| Young professional | Salaried, first time managing own budget | Wants guardrails without spreadsheet discipline |
| Household budgeter | Manages shared bills with partner/roommates | Needs shared visibility without full transaction exposure |

## 4. Goals & Success Metrics

| Goal | Metric | Target (6 months post-launch) |
|---|---|---|
| Replace mental math | % of sessions where user checks Runway number | >70% of sessions |
| Reduce overspend | Avg. number of "shortfall day" occurrences per user per month | Decrease 30% by month 3 of use |
| Drive habitual use | D7 retention | >35% |
| Prove unique value | % of users who create at least 1 What-If Fork | >40% in first month |
| Household adoption | % of accounts with Shared Runway enabled | >15% |

## 5. Scope — MVP (v1)

**In scope:**
- Manual transaction entry (amount, category, date, note)
- CSV import of transactions
- Recurring bill/income setup (frequency, amount, due date, variability flag)
- Runway Engine live calculation
- Money Weather 30-day forecast strip
- Expense DNA (basic clustering: 4–6 behavioral tags)
- What-If Forks (single-fork comparison, non-persistent beyond session unless saved)
- Single-user accounts with auth (email/password + OAuth)
- Push notification on forecasted shortfall day (opt-in)

**Explicitly out of scope for v1:**
- Bank account linking/aggregation (flagged for v1.1, behind feature flag)
- Investment tracking
- Bill negotiation / subscription cancellation automation
- Multi-currency support (v1 = single currency per account)
- Shared Runway / household accounts (v1.1)
- Web app (mobile-first only for v1)

## 6. Feature Requirements

### 6.1 Runway Engine (P0 — core differentiator)
- Recalculates on: new transaction, edited/deleted transaction, bill change, income change, day rollover.
- Must show current "Safe to Spend Today" prominently on Home screen.
- Must show confidence context ("based on your last 60 days of spending").
- Must degrade gracefully with sparse data (cold-start with conservative estimate + prompt to add bills).

### 6.2 Money Weather Forecast (P0)
- 30-day horizontal scrollable strip, one weather icon per day.
- Tapping a day reveals a breakdown: committed bills landing that day + projected variable spend.
- Visual states: Sunny (surplus), Cloudy (tight, <20% buffer), Stormy (at-risk, buffer near zero), Thunderstorm (projected shortfall/negative balance).

### 6.3 Expense DNA (P1)
- Runs nightly batch clustering on last 90 days of transactions.
- Surfaces top 3 behavioral patterns with plain-language labels and $ impact ("Late-night orders: $142 last 30 days").
- User can dismiss or "pin" a pattern to track over time.

### 6.4 What-If Forks (P1)
- User creates a fork from current state ("Cancel gym membership," "Add $500 one-time expense," "Delayed paycheck by 4 days").
- Fork recomputes Runway + Money Weather without altering real ledger.
- User can save, discard, or "commit" a fork (converts hypothetical into real bill/transaction).

### 6.5 Shared Runway (P2 — v1.1)
- Household creation with invite link.
- Each member can mark bills/income as shared or private.
- Combined Runway view; individual transaction line items stay private unless explicitly shared.

### 6.6 Core Table Stakes (required but not differentiating)
- Category management (custom categories)
- Search/filter transactions
- Export to CSV
- Basic monthly summary charts

## 7. Non-Functional Requirements

- Runway recalculation latency: <500ms perceived (client shows optimistic update, reconciles with server).
- Offline entry support with sync-on-reconnect.
- Data encrypted at rest and in transit.
- Accessibility: WCAG AA for color contrast (critical since weather icons carry meaning — must not rely on color alone; use icon + label).

## 8. Risks & Open Questions

- **Cold-start accuracy**: new users have no spending history — Runway Engine needs a documented fallback heuristic (see TRD §5.4).
- **Irregular income edge case**: how many pay cycles needed before engine trusts income pattern? (Proposed: 2 cycles minimum, else treat as unpredictable and widen buffer.)
- **Notification fatigue**: shortfall alerts must be rate-limited (max 1/day) to avoid becoming background noise.
- Bank-linking (v1.1) introduces compliance/security scope (Plaid or similar) — deferred deliberately to keep MVP lean and privacy-first.

## 9. Release Plan (high-level — detail in Implementation Plan)

- **Alpha**: Runway Engine + manual entry + Money Weather, internal testing.
- **Beta**: + Expense DNA + What-If Forks, closed user group.
- **v1 Public Launch**: full MVP scope above.
- **v1.1**: Shared Runway + bank aggregation.
