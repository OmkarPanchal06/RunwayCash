# RunwayCash — Predictive Expense Tracker

RunwayCash is a mobile-first, offline-capable expense tracker that shifts the focus from looking backward at past spending to looking forward with a predictive **Runway Engine**. Instead of arbitrary budgets, RunwayCash tells you exactly how much is "Safe to Spend Today" based on your upcoming bills and recent spending velocity, visualized as a 30-Day Money Weather strip (☀️ ⛅ 🌧️ ⛈️).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL** (running on `localhost:5432` by default)
- **Redis** (running on `localhost:6379` by default)

### 2. Setup the Monorepo
```bash
# Install all Node dependencies across workspaces
npm install

# Setup Python DNA Service environment
cd services/expense-dna
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
cd ../..
```

### 3. Database Migrations
Make sure your PostgreSQL database is running, then initialize the schema:
```bash
npm run migrate -w @runwaycash/api
```

### 4. Run the Backend Services
We use a unified dev script to start both the Node.js Ledger API (`port 3000`) and the Python Expense DNA service (`port 8000`) simultaneously:
```bash
npm run dev
```

### 5. Run the Mobile App
In a separate terminal, launch the Expo React Native app:
```bash
npm run dev:mobile
```

---

## 🏗️ Architecture Overview

- **`apps/mobile`**: Expo React Native app. Uses WatermelonDB for an offline-first schema, ensuring you can log expenses in a subway and sync later without merge conflicts.
- **`apps/api`**: Fastify Node.js server. Handles the core ledger logic, caching snapshots with Redis, background recompute jobs with BullMQ, and executes the core Runway Engine algorithm and What-If Forks.
- **`services/expense-dna`**: Python FastAPI microservice. Utilizes `pandas` to group raw merchant strings, normalize them using Regex, and calculate statistical variance (days between transactions) to automatically detect recurring bills and predict their frequencies.
- **`packages/shared`**: Shared TypeScript definitions ensuring type safety across the monorepo boundary.
