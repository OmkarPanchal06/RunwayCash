# RunwayCash API Documentation (v1)

This document serves as the handoff API contract for the RunwayCash Backend (Node.js/Fastify + Python FastAPI).

---

## 1. Core Ledger & Runway API (Node.js)
Base URL: `http://localhost:3000/api/v1`

### 1.1 `GET /accounts/:accountId/runway`
Returns the cached 30-day "Money Weather" projection for the account.

**Response (200 OK):**
```json
{
  "safeToSpendTodayCents": 47500,
  "projection": [
    {
      "date": "2026-08-14",
      "projectedBalanceCents": 120000,
      "weatherState": "sunny" 
    },
    // ... 29 more days
  ]
}
```

### 1.2 `POST /accounts/:accountId/transactions`
Creates a new transaction. **Per TRD §4, this endpoint computes the Runway Snapshot inline, updates the Redis cache, and returns the new forecast immediately.**

**Request Body:**
```json
{
  "amount_cents": -8000,
  "category": "Food",
  "merchant": "Uber Eats",
  "note": "Lunch",
  "occurred_at": "2026-08-14T12:00:00Z",
  "is_discretionary": true,
  "source": "manual",
  "idempotency_key": "abc-123-xyz"
}
```

**Response (201 Created):**
```json
{
  "transaction": {
    "id": "uuid-...",
    "amount_cents": -8000
    // ...
  },
  "snapshot": {
    "safeToSpendTodayCents": 39500,
    "projection": [ ... ]
  }
}
```

---

## 2. What-If Forks API (Node.js)
Base URL: `http://localhost:3000/api/v1`

### 2.1 `POST /accounts/:accountId/forks`
Simulates a hypothetical scenario (Shadow Ledger) without altering real data.

**Request Body:**
```json
{
  "name": "Buy New Laptop",
  "diff_json": {
    "overrides": {
      "transactions": [
        {
          "amount_cents": -200000,
          "occurred_at": "2026-08-14T00:00:00Z",
          "is_discretionary": true
        }
      ],
      "deletedBillIds": ["bill-uuid-to-cancel"]
    }
  }
}
```

**Response (200 OK):**
Returns the persisted fork metadata alongside the newly calculated, hypothetical `simulatedSnapshot`.

---

## 3. Expense DNA Service (Python)
Base URL: `http://localhost:8000/api/v1`

### 3.1 `POST /analyze/recurring`
Analyzes a batch of raw transactions, normalizes the merchant names, and uses statistical variance to predict recurring bills.

**Request Body:**
```json
{
  "transactions": [
    {
      "id": "tx-1",
      "amount_cents": -1500,
      "date": "2026-07-14",
      "raw_merchant": "UBER *EATS 123"
    }
    // ... bulk transactions
  ]
}
```

**Response (200 OK):**
```json
{
  "patterns": [
    {
      "merchant": "UBER EATS",
      "amount_cents": -1500,
      "frequency": "monthly",
      "next_expected_date": "2026-08-14",
      "confidence_score": 0.95
    }
  ]
}
```
