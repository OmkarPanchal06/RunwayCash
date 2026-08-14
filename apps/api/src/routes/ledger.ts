import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { computeRunwaySnapshot } from '../services/runwayEngine';
import { redis, CACHE_KEYS } from '../cache/redis';

export default async function (fastify: FastifyInstance) {
  
  // --- Accounts ---
  fastify.get('/accounts', async (request, reply) => {
    // Note: Assuming auth middleware sets request.user.id in the future
    const result = await query('SELECT * FROM accounts');
    return result.rows;
  });

  fastify.post('/accounts', async (request: any, reply) => {
    const { user_id, name, current_balance_cents } = request.body;
    const result = await query(
      'INSERT INTO accounts (user_id, name, current_balance_cents, balance_as_of) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [user_id, name, current_balance_cents]
    );
    return result.rows[0];
  });

  // --- Bills ---
  fastify.post('/accounts/:accountId/bills', async (request: any, reply) => {
    const { accountId } = request.params;
    const { name, amount_cents, variability, frequency, next_due_date, category } = request.body;
    const result = await query(
      `INSERT INTO bills (account_id, name, amount_cents, variability, frequency, next_due_date, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [accountId, name, amount_cents, variability, frequency, next_due_date, category]
    );
    
    // Trigger Runway Engine recompute event here (e.g., bullmq job)
    return result.rows[0];
  });

  // --- Transactions ---
  fastify.post('/accounts/:accountId/transactions', async (request: any, reply) => {
    const { accountId } = request.params;
    const { amount_cents, category, merchant, note, occurred_at, is_discretionary, source, idempotency_key } = request.body;
    
    const result = await query(
      `INSERT INTO transactions (account_id, amount_cents, category, merchant, note, occurred_at, is_discretionary, source, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [accountId, amount_cents, category, merchant, note, occurred_at, is_discretionary, source, idempotency_key]
    );

    const transaction = result.rows[0];

    // Compute updated snapshot inline (avoid extra round trip per TRD §4)
    const snapshot = await computeRunwaySnapshot(accountId);
    
    // Cache to Redis
    await redis.set(CACHE_KEYS.runwaySnapshot(accountId), JSON.stringify(snapshot));

    // Return the updated snapshot inline along with the transaction
    return { transaction, snapshot };
  });
}
