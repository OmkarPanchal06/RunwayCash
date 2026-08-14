-- Enums
CREATE TYPE auth_provider AS ENUM ('password', 'google', 'apple');
CREATE TYPE household_role AS ENUM ('owner', 'member');
CREATE TYPE variability_type AS ENUM ('fixed', 'variable');
CREATE TYPE frequency_type AS ENUM ('weekly', 'biweekly', 'monthly', 'custom', 'irregular');
CREATE TYPE transaction_source AS ENUM ('manual', 'csv_import', 'aggregator');
CREATE TYPE fork_status AS ENUM ('draft', 'saved', 'committed', 'discarded');
CREATE TYPE notification_type AS ENUM ('shortfall_alert', 'pattern_insight', 'fork_reminder');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    auth_provider auth_provider NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    risk_buffer_days INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Households (v1.1)
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Household Members (v1.1)
CREATE TABLE household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role household_role NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    current_balance_cents BIGINT NOT NULL,
    balance_as_of TIMESTAMPTZ NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT false
);

-- Bills
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount_cents BIGINT NOT NULL,
    variability variability_type NOT NULL,
    variable_range_low_cents BIGINT,
    variable_range_high_cents BIGINT,
    frequency frequency_type NOT NULL,
    custom_rrule TEXT,
    next_due_date DATE NOT NULL,
    category TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Income Events
CREATE TABLE income_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount_cents BIGINT NOT NULL,
    frequency frequency_type NOT NULL,
    custom_rrule TEXT,
    next_expected_date DATE NOT NULL,
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    is_shared BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL,
    category TEXT NOT NULL,
    merchant TEXT,
    note TEXT,
    occurred_at DATE NOT NULL,
    is_discretionary BOOLEAN NOT NULL DEFAULT true,
    linked_bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    source transaction_source NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runway Snapshots
CREATE TABLE runway_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    safe_to_spend_today_cents BIGINT NOT NULL,
    projection_json JSONB NOT NULL,
    input_hash TEXT NOT NULL
);

-- Expense Patterns
CREATE TABLE expense_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    cluster_key TEXT NOT NULL,
    impact_cents_30d BIGINT NOT NULL,
    transaction_ids UUID[] NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT false,
    dismissed BOOLEAN NOT NULL DEFAULT false,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forks (What-If)
CREATE TABLE forks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_snapshot_id UUID NOT NULL REFERENCES runway_snapshots(id) ON DELETE CASCADE,
    diff_json JSONB NOT NULL,
    status fork_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Log
CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload_json JSONB NOT NULL
);

-- Indexes
CREATE INDEX idx_transactions_account_date ON transactions(account_id, occurred_at);
CREATE INDEX idx_bills_account_next_due ON bills(account_id, next_due_date);
CREATE INDEX idx_income_events_account_next_exp ON income_events(account_id, next_expected_date);
CREATE INDEX idx_runway_snapshots_account_computed ON runway_snapshots(account_id, computed_at DESC);
