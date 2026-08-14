import { query } from '../db';

export interface Bill {
  id: string;
  amount_cents: number;
  next_due_date: string; // YYYY-MM-DD
  frequency: string;
}

export interface IncomeEvent {
  id: string;
  amount_cents: number;
  next_expected_date: string; // YYYY-MM-DD
  confidence_score: number;
}

export interface Transaction {
  id: string;
  amount_cents: number;
  occurred_at: string; // YYYY-MM-DD
  is_discretionary: boolean;
}

// Pure function to run the algorithm so it can be reused for What-If Forks
export function computeRunwayPure(
  current_balance: number,
  risk_buffer_days: number,
  committed_bills: Bill[],
  income_events: IncomeEvent[],
  transaction_history: Transaction[]
) {
  // Step 1: Variable Spend Velocity
  let weighted_daily_avg = 0;
  
  const daysOfHistory = calculateHistoryDays(transaction_history);
  if (daysOfHistory < 14) {
    weighted_daily_avg = Math.round(0.25 * (current_balance / 30));
  } else {
    weighted_daily_avg = calculateWeightedAverage(transaction_history);
  }

  // Step 2: Committed Outflow Ladder
  const committed_outflow: number[] = new Array(30).fill(0);
  const income_ladder: number[] = new Array(30).fill(0);
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0];

    for (const bill of committed_bills) {
      if (isDueOn(bill, dateStr)) {
        committed_outflow[i] += parseInt(bill.amount_cents.toString(), 10);
      }
    }

    for (const income of income_events) {
      if (isDueOn(income, dateStr)) {
        income_ladder[i] += parseInt(income.amount_cents.toString(), 10) * parseFloat(income.confidence_score.toString());
      }
    }
  }

  // Step 4: Runway Projection
  const projected_balance: number[] = new Array(30).fill(0);
  projected_balance[0] = current_balance;

  const projection = [];
  const buffer_target = weighted_daily_avg * risk_buffer_days;

  for (let d = 0; d < 30; d++) {
    if (d > 0) {
      projected_balance[d] = projected_balance[d-1] 
        + income_ladder[d] 
        - committed_outflow[d] 
        - weighted_daily_avg;
    }

    let weatherState: 'sunny' | 'cloudy' | 'stormy' | 'thunderstorm' = 'sunny';
    if (projected_balance[d] < 0) weatherState = 'thunderstorm';
    else if (projected_balance[d] < buffer_target) weatherState = 'stormy';
    else if (projected_balance[d] < buffer_target * 2) weatherState = 'cloudy';

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + d);

    projection.push({
      date: targetDate.toISOString().split('T')[0],
      projectedBalanceCents: projected_balance[d],
      weatherState
    });
  }

  // Step 5: Safe-to-Spend-Today
  let days_to_next_income = income_events.reduce((min, ev) => {
    const diff = Math.ceil((new Date(ev.next_expected_date).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff < min ? diff : min;
  }, 30); 
  if (days_to_next_income === 0) days_to_next_income = 1;

  let sum_committed_before_income = 0;
  for (let i = 0; i < days_to_next_income && i < 30; i++) {
    sum_committed_before_income += committed_outflow[i];
  }

  const safe_to_spend_today = Math.max(0, 
    Math.round((current_balance - sum_committed_before_income - buffer_target) / Math.max(days_to_next_income, 1))
  );

  return {
    safeToSpendTodayCents: safe_to_spend_today,
    projection
  };
}

export async function computeRunwaySnapshot(accountId: string) {
  const accountRes = await query('SELECT current_balance_cents, risk_buffer_days FROM accounts WHERE id = $1', [accountId]);
  if (accountRes.rowCount === 0) throw new Error('Account not found');
  
  const current_balance = parseInt(accountRes.rows[0].current_balance_cents, 10);
  const risk_buffer_days = accountRes.rows[0].risk_buffer_days;

  const billsRes = await query(`SELECT id, amount_cents, next_due_date, frequency FROM bills WHERE account_id = $1 AND active = true`, [accountId]);
  const incomeRes = await query(`SELECT id, amount_cents, next_expected_date, confidence_score FROM income_events WHERE account_id = $1`, [accountId]);
  const txRes = await query(`
    SELECT id, amount_cents, occurred_at, is_discretionary 
    FROM transactions 
    WHERE account_id = $1 AND is_discretionary = true AND occurred_at >= current_date - interval '60 days'
  `, [accountId]);

  return computeRunwayPure(
    current_balance, 
    risk_buffer_days, 
    billsRes.rows, 
    incomeRes.rows, 
    txRes.rows
  );
}

// Helpers
function calculateHistoryDays(txs: Transaction[]): number {
  if (txs.length === 0) return 0;
  const dates = txs.map(t => new Date(t.occurred_at).getTime());
  return Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 3600 * 24)) + 1;
}

function calculateWeightedAverage(txs: Transaction[]): number {
  let totalWeight = 0;
  let weightedSum = 0;
  const today = new Date().getTime();
  
  for (const tx of txs) {
    const txDate = new Date(tx.occurred_at).getTime();
    const daysAgo = Math.floor((today - txDate) / (1000 * 3600 * 24));
    const weight = daysAgo <= 14 ? 2 : 1;
    weightedSum += Math.abs(tx.amount_cents) * weight;
    totalWeight += weight;
  }
  
  return totalWeight === 0 ? 0 : Math.round(weightedSum / totalWeight);
}

function isDueOn(item: { next_due_date?: string, next_expected_date?: string }, dateStr: string): boolean {
  const target = (item.next_due_date || item.next_expected_date)?.split('T')[0];
  return target === dateStr;
}
