import { computeRunwaySnapshot } from './runwayEngine';
import { query } from '../db';

jest.mock('../db', () => ({
  query: jest.fn()
}));

const mockQuery = query as jest.Mock;

describe('Runway Engine Algorithm', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    jest.useFakeTimers().setSystemTime(new Date('2026-08-14T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setupMockData = (
    balanceCents: number,
    bills: any[] = [],
    incomes: any[] = [],
    txs: any[] = []
  ) => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM accounts')) {
        return { rowCount: 1, rows: [{ current_balance_cents: balanceCents, risk_buffer_days: 3 }] };
      }
      if (sql.includes('FROM bills')) return { rows: bills };
      if (sql.includes('FROM income_events')) return { rows: incomes };
      if (sql.includes('FROM transactions')) return { rows: txs };
      return { rows: [] };
    });
  };

  test('Zero-history cold start logic (TRD 5.4)', async () => {
    // 0 transactions -> < 14 days history -> 25% of (balance/30) as weighted avg
    // Balance = $3,000 (300000 cents) -> /30 = 10000 -> 25% = 2500 cents daily avg
    setupMockData(300000, [], [], []);

    const result = await computeRunwaySnapshot('acc-1');
    
    // Buffer = 2500 * 3 = 7500
    // No income events -> days_to_next_income fallback is 30
    // safe_to_spend_today = (300000 - 0 - 7500) / 30 = 292500 / 30 = 9750 cents
    expect(result.safeToSpendTodayCents).toBe(9750);
    // Projection should show sunny weather (300000 > 7500*2)
    expect(result.projection[0].weatherState).toBe('sunny');
  });

  test('Negative starting balance clamps safe_to_spend to 0 and classifies as Thunderstorm', async () => {
    setupMockData(-50000, [], [], []); // -$500 balance

    const result = await computeRunwaySnapshot('acc-1');
    
    expect(result.safeToSpendTodayCents).toBe(0);
    expect(result.projection[0].weatherState).toBe('thunderstorm');
  });

  test('Buffer target edge at exactly zero days to next income', async () => {
    // Next income is today (2026-08-14)
    const today = '2026-08-14';
    
    // Mock 30 days of transactions spending $10 (1000 cents) a day
    const txs = Array.from({ length: 30 }).map((_, i) => ({
      amount_cents: -1000,
      occurred_at: `2026-07-${(15 + i).toString().padStart(2, '0')}` // roughly 30 days
    }));

    setupMockData(
      50000, // $500 balance
      [], 
      [{ amount_cents: 100000, next_expected_date: today, confidence_score: 1.0 }], // $1000 income today
      txs
    );

    const result = await computeRunwaySnapshot('acc-1');
    
    // Weighted avg is roughly 1000 cents. Buffer is 3000 cents.
    // Days to next income = 0, but max(0, 1) fallback kicks in to prevent divide by zero.
    // Safe to spend = (50000 - 0 - 3000) / 1 = 47000 cents
    expect(result.safeToSpendTodayCents).toBe(47000);
  });

  test('Multiple incomes per week correctly shifts the timeline', async () => {
    // E.g. Freelancer with multiple payouts
    const txs = Array.from({ length: 30 }).map((_, i) => ({
      amount_cents: -5000, // $50 daily spend
      occurred_at: `2026-07-${(15 + i).toString().padStart(2, '0')}` 
    }));

    setupMockData(
      10000, // $100 starting balance
      [{ amount_cents: 5000, next_due_date: '2026-08-15', frequency: 'weekly' }], // $50 bill tomorrow
      [
        { amount_cents: 15000, next_expected_date: '2026-08-16', confidence_score: 1.0 }, // $150 in 2 days
        { amount_cents: 10000, next_expected_date: '2026-08-20', confidence_score: 1.0 }  // $100 in 6 days
      ], 
      txs
    );

    const result = await computeRunwaySnapshot('acc-1');
    
    // The closest income is 2 days away.
    // Weighted avg is ~5000 cents. Buffer is 15000 cents.
    // Committed outflow before income (tomorrow's bill) = 5000 cents.
    // Safe to spend = (10000 - 5000 - 15000) = -10000 => Clamped to 0.
    expect(result.safeToSpendTodayCents).toBe(0);
    
    // Check projection for 2026-08-16 (index 2) - should include the +15000 income
    // index 0: 10000
    // index 1: 10000 - 5000 (bill) - 5000 (avg) = 0 (Stormy/Thunderstorm)
    // index 2: 0 + 15000 (income) - 5000 (avg) = 10000 (Cloudy)
    expect(result.projection[2].projectedBalanceCents).toBe(10000);
  });

  test('Mid-cycle bill amount change impacts future weather states instantly', async () => {
    // Suppose a massive bill is due in 10 days
    const txs = Array.from({ length: 20 }).map((_, i) => ({
      amount_cents: -2000, // $20 daily spend
      occurred_at: `2026-07-${(15 + i).toString().padStart(2, '0')}` 
    }));

    setupMockData(
      100000, // $1000 balance
      [{ amount_cents: 80000, next_due_date: '2026-08-24', frequency: 'monthly' }], // $800 bill in 10 days
      [{ amount_cents: 200000, next_expected_date: '2026-08-30', confidence_score: 1.0 }], // $2000 income in 16 days
      txs
    );

    const result = await computeRunwaySnapshot('acc-1');

    // Day 10 (index 10) is when the bill hits.
    // Before day 10, balance drops by 2000 a day.
    // Day 0: 100000
    // Day 9: 100000 - (9 * 2000) = 82000
    // Day 10: 82000 - 80000 (bill) - 2000 = 0 (Thunderstorm)
    expect(result.projection[10].projectedBalanceCents).toBe(0);
    expect(result.projection[10].weatherState).toBe('stormy'); 
    // 0 is technically "stormy" based on my logic: `< 0 -> thunderstorm`, `0 <= x < buffer -> stormy`
  });

  test('Irregular income (variance handled by confidence_score multiplier)', async () => {
    // Confidence score 0.6 means we only trust 60% of the stated amount
    setupMockData(
      50000, // $500 balance
      [], 
      [{ amount_cents: 100000, next_expected_date: '2026-08-15', confidence_score: 0.60 }], // Tomorrow
      []
    );

    const result = await computeRunwaySnapshot('acc-1');
    
    // We expect 60000 cents added tomorrow (index 1), not 100000
    // Cold start weighted avg = 25% of 50000 / 30 = 417 cents
    
    // index 0: 50000
    // index 1: 50000 + (100000 * 0.60) - 417 = 109583
    expect(result.projection[1].projectedBalanceCents).toBe(109583);
  });
});
