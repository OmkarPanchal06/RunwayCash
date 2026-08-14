# Technical Requirements Document (TRD)
## RunwayCash — Predictive Expense Tracker

---

## 1. Architecture Overview

```
┌─────────────────┐      ┌──────────────────────┐      ┌───────────────┐
│  Mobile Client    │◄────►│   API Gateway (REST)  │◄────►│  PostgreSQL    │
│  React Native/Expo│      │   Node.js + TypeScript│      │  (primary DB)  │
└─────────────────┘      └──────────┬───────────┘      └───────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                 ▼
             ┌─────────────┐ ┌──────────────┐  ┌────────────────┐
             │ Redis Cache │ │ BullMQ Queue  │  │ Clustering Svc │
             │ (runway     │ │ (recalc jobs, │  │ (Expense DNA,  │
             │  snapshots) │ │  notifications)│  │  Python/scikit)│
             └─────────────┘ └──────────────┘  └────────────────┘
```

## 2. Stack Choices & Rationale

| Layer | Choice | Rationale |
|---|---|---|
| Mobile | React Native + Expo | Single codebase iOS/Android, fast iteration, good offline storage support (Expo SQLite/WatermelonDB) |
| Backend API | Node.js + TypeScript (Fastify or NestJS) | Type safety shared with client via shared types package; async-friendly for recalculation triggers |
| Database | PostgreSQL | Relational integrity for bills/transactions/forks; window functions well-suited to velocity calculations |
| Cache | Redis | Store precomputed Runway snapshots and Money Weather day-states for instant reads |
| Job Queue | BullMQ (Redis-backed) | Recalculation and notification jobs decoupled from request path |
| Clustering | Python microservice (scikit-learn, K-Means/DBSCAN over transaction feature vectors) or Node equivalent (ml-kmeans) if team wants single-language stack | Expense DNA needs periodic batch clustering — isolate as its own service/worker for independent scaling |
| Auth | JWT + refresh tokens, OAuth (Google/Apple) | Standard, low-friction |
| Offline sync | Local SQLite (WatermelonDB) with sync protocol, conflict resolution = last-write-wins per field with server timestamp authority | Needed for offline-first entry |

## 3. Core Modules

### 3.1 Ledger Service
CRUD for transactions, bills, income events. Emits `ledger.changed` events.

### 3.2 Runway Engine Service
Subscribes to `ledger.changed`. Recomputes and caches Runway + Money Weather. Exposes read endpoint backed by Redis with DB fallback.

### 3.3 Expense DNA Service
Nightly batch job (BullMQ cron) per user: pulls last 90 days transactions, extracts features, clusters, writes pattern summaries to `expense_patterns` table.

### 3.4 Aggregation Service (v1.1, feature-flagged)
Plaid (or regional equivalent) integration for auto-imported transactions. Off by default in v1.

### 3.5 Fork Service
Materializes a "shadow ledger" (copy-on-write diff against real ledger) scoped to a `fork_id`. Runway Engine can run against a fork context without touching real snapshots.

### 3.6 Notification Service
Consumes Runway Engine shortfall-day events, rate-limited per user (max 1 push/day), delivered via Expo push / FCM / APNs.

## 4. API Design Principles

- REST, versioned (`/api/v1/...`).
- All monetary values transmitted as integer minor units (cents) to avoid float rounding errors.
- All mutation endpoints return the updated Runway snapshot inline (avoid extra round trip on client).
- Idempotency keys required on transaction-creation endpoints (safe offline-sync retries).

(Full endpoint list in `05_Backend_Schema.md`.)

## 5. Runway Engine Algorithm (the core IP — implement exactly)

### 5.1 Inputs
- `current_balance`: latest known account balance (manually set or last-synced).
- `committed_bills[]`: recurring bills with `amount`, `due_date`, `frequency`, `variability` (fixed/variable + historical range if variable).
- `income_events[]`: recurring or manually logged income with `amount`, `expected_date`, `confidence` (derived from historical regularity).
- `transaction_history`: last 60 days of discretionary (non-bill) transactions.

### 5.2 Step 1 — Variable Spend Velocity
```
daily_discretionary_avg = sum(discretionary_transactions_last_60_days) / 60
weighted_daily_avg = weighted average, weighting last 14 days 2x
  (captures recent behavior shift faster than a flat 60-day average)
```

### 5.3 Step 2 — Committed Outflow Ladder
For each day `d` in the next 30 days, sum all `committed_bills` due on `d` (expand recurring rules to concrete dates). This produces `committed_outflow[d]`.

### 5.4 Step 3 — Cold-Start Handling
If `transaction_history` < 14 days of data: use a conservative default `weighted_daily_avg` = 25% of `current_balance / 30` until sufficient history accrues. Show an explicit "Estimating — add more transactions for accuracy" badge in UI.

### 5.5 Step 4 — Runway Projection (per day, rolling forward)
```
projected_balance[0] = current_balance
for d in 1..30:
    projected_balance[d] =
        projected_balance[d-1]
        + income_events landing on day d (× confidence weight)
        - committed_outflow[d]
        - weighted_daily_avg   # projected discretionary spend for that day
```

### 5.6 Step 5 — Safe-to-Spend-Today
```
buffer_target = weighted_daily_avg × 3   # 3-day cushion, configurable per user risk setting
days_to_next_income = min(days until next income_event)

safe_to_spend_today =
    max(0,
        (current_balance
         - sum(committed_outflow[0..days_to_next_income])
         - buffer_target)
        / max(days_to_next_income, 1)
    )
```

### 5.7 Step 6 — Money Weather Classification
For each `projected_balance[d]`:
- `projected_balance[d] < 0` → ⛈️ Thunderstorm (shortfall)
- `0 ≤ projected_balance[d] < buffer_target` → 🌧️ Stormy (at-risk)
- `buffer_target ≤ projected_balance[d] < buffer_target × 2` → ⛅ Cloudy (tight)
- `projected_balance[d] ≥ buffer_target × 2` → ☀️ Sunny (surplus)

### 5.8 Recalculation Triggers
- Any ledger mutation (transaction, bill, income CRUD).
- Daily cron at local midnight (day rollover shifts the 30-day window).
- Fork creation (computed in isolated context, never overwrites real snapshot).

### 5.9 Testing Requirements
Unit tests must cover: zero-history cold start, irregular income (variance >30% between cycles), mid-cycle bill amount change, multiple incomes/week, negative starting balance, buffer_target edge at exactly zero days to next income.

## 6. Expense DNA — Clustering Approach

- Feature vector per transaction: `[amount_normalized, hour_of_day, day_of_week, category_embedding, merchant_frequency_score]`.
- Algorithm: start with rule-assisted clustering (hour-of-day + category heuristics for explainability) layered with K-Means (k=4–6) for amount/frequency grouping — pure unsupervised clustering alone often produces labels users can't interpret; hybrid approach keeps output explainable.
- Output: cluster → human-readable label mapping maintained in a labeling service (template strings filled with top category/time-window per cluster).

## 7. Security & Privacy

- Passwords: bcrypt/argon2 hashed.
- Financial data encrypted at rest (Postgres column-level encryption for balance/amount fields) and TLS in transit.
- No third-party analytics SDKs receive raw transaction data.
- Shared Runway (v1.1): row-level security policies in Postgres to enforce per-member visibility rules at the DB layer, not just app layer.

## 8. Performance Targets

- Runway read (cached): p95 < 150ms.
- Runway recompute (on mutation): p95 < 800ms server-side; client shows optimistic local estimate immediately.
- Expense DNA batch job: complete for a user's 90-day window in < 5s.

## 9. Observability

- Structured logs for every Runway recomputation (inputs hash, output snapshot, duration).
- Alert if recomputation error rate > 1% (silent Runway staleness is a critical product-trust failure).
