# Implementation Plan
## RunwayCash — Predictive Expense Tracker

---

## 1. Guiding Principle

Build the **Runway Engine first**, on real (even if sparse) data, before any polish work. Every phase must end with a demo-able, functional build — not partial screens wired to mock data.

---

## 2. Phase Breakdown

### Phase 0 — Foundations (Week 1–2)
- Repo scaffolding: monorepo (client + server + shared types package).
- CI pipeline: lint, typecheck, unit tests on PR.
- Postgres schema migration tooling set up (per `05_Backend_Schema.md`).
- Auth (signup/login, JWT + refresh) end-to-end.
- Base navigation shell in React Native (bottom nav stub screens).

**Definition of Done**: user can sign up, log in, land on an empty Home screen backed by a real (empty) account record.

---

### Phase 1 — Core Ledger + Runway Engine (Week 3–6)
- Bills, Income, Transactions CRUD (API + DB).
- Runway Engine service: implement algorithm exactly per `03_TRD.md §5`.
- Redis caching of snapshots; recompute triggers wired to ledger mutation events.
- Unit test suite for Runway Engine (cold start, irregular income, negative balance, etc. — full list in TRD §5.9) — **must pass before Phase 2 starts**.
- Home screen: real Safe-to-Spend-Today number, wired live.
- Money Weather 30-day strip (basic version): wired to real projection data.

**Definition of Done**: a manually-entered set of bills/income/transactions produces a correct, tested Safe-to-Spend number and Weather strip, visible end-to-end in the app.

---

### Phase 2 — Manual Entry UX + Offline (Week 7–9)
- Full Add/Edit Transaction flow with category auto-suggestion.
- Add/Edit Bill & Income flows (including variable-amount handling).
- CSV import.
- Offline-first local storage (WatermelonDB) + sync/reconciliation logic.
- Optimistic UI updates for Runway number on entry.

**Definition of Done**: user can fully manage their financial data offline and online with correct sync, no data loss on reconnect.

---

### Phase 3 — Expense DNA (Week 10–11)
- Clustering microservice (or in-process module) implementing hybrid rule+K-Means approach (TRD §6).
- Nightly batch job via BullMQ cron.
- Patterns tab UI: card feed, drill-in, pin/dismiss.

**Definition of Done**: after 14+ days of seeded transaction data, a user sees at least one accurate, labeled pattern card with correct $ impact.

---

### Phase 4 — What-If Forks (Week 12–13)
- Fork data model + shadow-ledger diff computation.
- Fork Service: recompute Runway Engine against fork context (must reuse Phase 1 engine, not a duplicate implementation).
- Forks tab UI: template chooser, fork preview (Simulation-badged), save/discard/commit actions.

**Definition of Done**: creating a fork never mutates real data unless explicitly committed; commit correctly writes back to real bills/transactions/income and triggers a real recompute.

---

### Phase 5 — Notifications & Polish (Week 14–15)
- Shortfall detection + rate-limited push notifications.
- Deep linking from notification to specific Weather day.
- Accessibility pass (contrast, screen reader labels, dynamic type).
- Dark mode.
- Empty/cold-start state polish across all screens.

**Definition of Done**: full MVP scope from `02_PRD.md §5` is functional, accessible, and demo-ready.

---

### Phase 6 — Beta Hardening (Week 16–18)
- Closed beta with real users.
- Instrumentation: track the success metrics defined in `02_PRD.md §4` (Runway check frequency, fork creation rate, shortfall reduction).
- Bug triage and performance tuning against targets in `03_TRD.md §8`.
- Load testing on Runway recompute path (target: handle recompute storms from bulk CSV import without cache stampede — verify Redis + queue backpressure handling).

**Definition of Done**: public v1 launch readiness — all P0/P1 features stable, metrics dashboard live.

---

### Phase 7 (Post-v1) — v1.1 Scope
- Shared Runway / household accounts (schema already reserved in `05_Backend_Schema.md`).
- Bank aggregation integration (Plaid or regional equivalent), feature-flagged rollout.
- Multi-currency support evaluation.

---

## 3. Team & Ownership Suggestion (adapt to actual team size)

| Area | Owner focus |
|---|---|
| Runway Engine + backend services | Backend/algorithms engineer |
| Mobile client + offline sync | Mobile engineer |
| Expense DNA clustering | Backend/data engineer (or contracted data scientist for tuning) |
| UI/UX + design system | Product designer |
| QA / test strategy | Shared, but Runway Engine test suite is non-negotiable gate owned jointly by backend + QA |

## 4. Risk Mitigation Checklist

- [ ] Runway Engine unit tests pass for all edge cases (TRD §5.9) before any UI work depends on it.
- [ ] Cold-start heuristic validated against at least 3 synthetic user profiles (steady salary, irregular gig income, mixed).
- [ ] Offline sync tested against airplane-mode + multi-day-offline scenarios, not just brief disconnects.
- [ ] Notification rate-limiting verified under a scenario with multiple shortfall days in the same week (must still cap at 1/day).
- [ ] Fork commit path tested for correctness against concurrent real-ledger edits (what happens if user edits a bill while a fork referencing it is open?).

## 5. Launch Checklist (pre-v1 public release)

- [ ] All MVP features from PRD §5 functional on real data, no mock/demo data paths reachable in production build.
- [ ] Security review: encryption at rest/in transit, auth flows, rate limiting on public endpoints.
- [ ] Accessibility audit passed (WCAG AA).
- [ ] Privacy policy reflects actual data handling (esp. since no bank linking in v1 — reassure users manual-first is a deliberate privacy choice).
- [ ] App store submission assets (screenshots should show real Weather strip states, not placeholder graphics).
