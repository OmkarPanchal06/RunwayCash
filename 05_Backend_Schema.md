# Backend Schema
## RunwayCash — Predictive Expense Tracker

---

## 1. Database Schema (PostgreSQL)

### 1.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | text, unique | |
| password_hash | text | nullable if OAuth-only |
| auth_provider | enum('password','google','apple') | |
| currency | text | ISO 4217, default account currency |
| risk_buffer_days | int | default 3 — used in Runway buffer_target calc |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 1.2 `households` (v1.1)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | text | |
| created_by | UUID (FK users) | |
| created_at | timestamptz | |

### 1.3 `household_members` (v1.1)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| household_id | UUID (FK households) | |
| user_id | UUID (FK users) | |
| role | enum('owner','member') | |
| joined_at | timestamptz | |

### 1.4 `accounts`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK users) | |
| name | text | e.g. "Checking" |
| current_balance_cents | bigint | integer minor units |
| balance_as_of | timestamptz | last manual/synced update |
| is_shared | boolean | household visibility flag (v1.1) |

### 1.5 `bills` (recurring committed outflow)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| account_id | UUID (FK accounts) | |
| name | text | |
| amount_cents | bigint | |
| variability | enum('fixed','variable') | |
| variable_range_low_cents | bigint | nullable, used if variable |
| variable_range_high_cents | bigint | nullable |
| frequency | enum('weekly','biweekly','monthly','custom') | |
| custom_rrule | text | nullable, iCal RRULE format for custom frequency |
| next_due_date | date | |
| category | text | |
| is_shared | boolean | household flag (v1.1) |
| active | boolean | soft toggle |
| created_at | timestamptz | |

### 1.6 `income_events`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| account_id | UUID (FK accounts) | |
| name | text | e.g. "Freelance payout," "Paycheck" |
| amount_cents | bigint | |
| frequency | enum('weekly','biweekly','monthly','irregular') | |
| custom_rrule | text | nullable |
| next_expected_date | date | |
| confidence_score | numeric(3,2) | 0.00–1.00, derived from historical regularity |
| is_shared | boolean | household flag (v1.1) |
| created_at | timestamptz | |

### 1.7 `transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| account_id | UUID (FK accounts) | |
| amount_cents | bigint | negative = outflow, positive = inflow |
| category | text | |
| merchant | text | nullable |
| note | text | nullable |
| occurred_at | date | |
| is_discretionary | boolean | false if linked to a bill instance |
| linked_bill_id | UUID (FK bills) | nullable |
| source | enum('manual','csv_import','aggregator') | |
| idempotency_key | text, unique | for safe offline-sync retries |
| created_at | timestamptz | |

### 1.8 `runway_snapshots` (cache/audit table; source of truth also in Redis)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| account_id | UUID (FK accounts) | |
| computed_at | timestamptz | |
| safe_to_spend_today_cents | bigint | |
| projection_json | jsonb | 30-day array of {date, projected_balance_cents, weather_state} |
| input_hash | text | hash of inputs used, for debugging/audit |

### 1.9 `expense_patterns` (Expense DNA output)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| account_id | UUID (FK accounts) | |
| label | text | e.g. "Weekend social spending" |
| cluster_key | text | internal cluster id |
| impact_cents_30d | bigint | |
| transaction_ids | UUID[] | |
| pinned | boolean | |
| dismissed | boolean | |
| computed_at | timestamptz | |

### 1.10 `forks` (What-If)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| account_id | UUID (FK accounts) | |
| name | text | |
| base_snapshot_id | UUID (FK runway_snapshots) | state forked from |
| diff_json | jsonb | array of hypothetical bill/transaction/income overrides |
| status | enum('draft','saved','committed','discarded') | |
| created_at | timestamptz | |

### 1.11 `notifications_log`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK users) | |
| type | enum('shortfall_alert','pattern_insight','fork_reminder') | |
| sent_at | timestamptz | |
| payload_json | jsonb | |

## 2. Indexing Notes

- `transactions(account_id, occurred_at)` — composite index, primary query pattern.
- `bills(account_id, next_due_date)` and `income_events(account_id, next_expected_date)` — for Runway Engine's forward projection.
- `runway_snapshots(account_id, computed_at desc)` — fetch latest snapshot fast.
- Row-level security policies on `is_shared` columns for household queries (v1.1).

## 3. API Endpoints (REST, `/api/v1`)

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`

### Accounts
- `GET /accounts`
- `POST /accounts`
- `PATCH /accounts/:id` (e.g., manual balance update)

### Transactions
- `GET /accounts/:id/transactions?from=&to=&category=`
- `POST /accounts/:id/transactions` (requires `Idempotency-Key` header)
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`
- `POST /accounts/:id/transactions/import` (CSV upload)

### Bills & Income
- `GET /accounts/:id/bills`
- `POST /accounts/:id/bills`
- `PATCH /bills/:id`
- `DELETE /bills/:id`
- `GET /accounts/:id/income`
- `POST /accounts/:id/income`
- `PATCH /income/:id`

### Runway Engine
- `GET /accounts/:id/runway` → returns cached snapshot (safe_to_spend_today + 30-day projection), each mutation above returns an inline updated snapshot too.
- `POST /accounts/:id/runway/recompute` (manual force-recompute, rate-limited)

### Expense DNA
- `GET /accounts/:id/patterns`
- `PATCH /patterns/:id` (pin/dismiss)

### Forks
- `POST /accounts/:id/forks`
- `GET /forks/:id`
- `PATCH /forks/:id` (edit diff)
- `POST /forks/:id/commit`
- `DELETE /forks/:id`

### Households (v1.1)
- `POST /households`
- `POST /households/:id/invite`
- `GET /households/:id/runway` (combined view)

## 4. Data Retention & Privacy Notes

- Soft-delete for transactions/bills (retain 90 days for undo + pattern recalculation continuity), hard purge after retention window on user request (GDPR-style deletion endpoint: `DELETE /users/me` cascades).
- `expense_patterns` and `runway_snapshots` are derived data — safe to fully recompute, so they can be purged/rebuilt without data loss risk.
