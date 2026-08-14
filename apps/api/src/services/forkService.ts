import { query } from '../db';
import { computeRunwayPure, Bill, IncomeEvent, Transaction } from './runwayEngine';

export interface ForkDiff {
  overrides: {
    bills?: Partial<Bill>[]; // Modified or new bills (if id matches existing, it modifies. if no id, it adds)
    deletedBillIds?: string[];
    
    incomes?: Partial<IncomeEvent>[];
    deletedIncomeIds?: string[];
    
    transactions?: Partial<Transaction>[]; // e.g. simulating a massive one-time purchase today
  };
}

export async function computeForkSnapshot(accountId: string, diff: ForkDiff) {
  // 1. Fetch real "Base Ledger" data
  const accountRes = await query('SELECT current_balance_cents, risk_buffer_days FROM accounts WHERE id = $1', [accountId]);
  if (accountRes.rowCount === 0) throw new Error('Account not found');
  
  // Create a mutable copy of the balance (we will adjust it if simulating transactions today)
  let simulatedBalance = parseInt(accountRes.rows[0].current_balance_cents, 10);
  const risk_buffer_days = accountRes.rows[0].risk_buffer_days;

  const billsRes = await query(`SELECT id, amount_cents, next_due_date, frequency FROM bills WHERE account_id = $1 AND active = true`, [accountId]);
  const incomeRes = await query(`SELECT id, amount_cents, next_expected_date, confidence_score FROM income_events WHERE account_id = $1`, [accountId]);
  const txRes = await query(`
    SELECT id, amount_cents, occurred_at, is_discretionary 
    FROM transactions 
    WHERE account_id = $1 AND is_discretionary = true AND occurred_at >= current_date - interval '60 days'
  `, [accountId]);

  let realBills: Bill[] = billsRes.rows;
  let realIncomes: IncomeEvent[] = incomeRes.rows;
  let realTxs: Transaction[] = txRes.rows;

  // 2. Apply Shadow Ledger Diffs (Copy-on-write style)
  
  // Handle Bill overrides (Cancellations or Changes)
  if (diff.overrides.deletedBillIds) {
    realBills = realBills.filter(b => !diff.overrides.deletedBillIds!.includes(b.id));
  }
  if (diff.overrides.bills) {
    for (const b of diff.overrides.bills) {
      if (b.id) {
        // Edit existing
        const index = realBills.findIndex(rb => rb.id === b.id);
        if (index > -1) realBills[index] = { ...realBills[index], ...b } as Bill;
      } else {
        // Add completely new mock bill
        realBills.push(b as Bill);
      }
    }
  }

  // Handle Income overrides
  if (diff.overrides.deletedIncomeIds) {
    realIncomes = realIncomes.filter(i => !diff.overrides.deletedIncomeIds!.includes(i.id));
  }
  if (diff.overrides.incomes) {
    for (const inc of diff.overrides.incomes) {
      if (inc.id) {
        const index = realIncomes.findIndex(ri => ri.id === inc.id);
        if (index > -1) realIncomes[index] = { ...realIncomes[index], ...inc } as IncomeEvent;
      } else {
        realIncomes.push(inc as IncomeEvent);
      }
    }
  }

  // Handle Transactions (like adding a massive one-time expense today)
  if (diff.overrides.transactions) {
    for (const t of diff.overrides.transactions) {
      realTxs.push(t as Transaction);
      // Immediately pull it from the current balance so the forecast starts lower!
      if (t.amount_cents && t.amount_cents < 0) {
        simulatedBalance += t.amount_cents;
      }
    }
  }

  // 3. Re-run the Phase 1 Engine on the mutated context!
  return computeRunwayPure(
    simulatedBalance,
    risk_buffer_days,
    realBills,
    realIncomes,
    realTxs
  );
}
