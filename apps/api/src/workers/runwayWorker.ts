import { Worker } from 'bullmq';
import { redis, CACHE_KEYS } from '../cache/redis';
import { query } from '../db';
import { computeRunwaySnapshot } from '../services/runwayEngine';

export const runwayWorker = new Worker('runway-recalc', async job => {
  if (job.name === 'nightly-recalc-all') {
    console.log('Running nightly batch recalculation for all accounts...');
    
    // In production, batch this with cursor pagination
    const accounts = await query('SELECT id FROM accounts');
    
    for (const acc of accounts.rows) {
      const accountId = acc.id;
      const snapshot = await computeRunwaySnapshot(accountId);
      
      // 1. Cache the new snapshot instantly in Redis for <150ms read latency
      await redis.set(
        CACHE_KEYS.runwaySnapshot(accountId), 
        JSON.stringify(snapshot)
      );

      // 2. Persist audit trail in PostgreSQL
      await query(
        `INSERT INTO runway_snapshots (account_id, safe_to_spend_today_cents, projection_json, input_hash) 
         VALUES ($1, $2, $3, $4)`,
        [accountId, snapshot.safeToSpendTodayCents, JSON.stringify(snapshot.projection), 'nightly-cron-hash']
      );

      // 3. Detect Shortfall days and conditionally queue notifications
      const hasShortfall = snapshot.projection.slice(0, 7).some(day => day.weatherState === 'thunderstorm');
      if (hasShortfall) {
        // Enqueue to notification queue (which will handle the 1/day rate limiter)
        // notificationQueue.add('send-shortfall-alert', { accountId });
      }
    }
  } else if (job.name === 'recalc-single') {
    // Used for bulk imports where we don't want to block the HTTP response
    const { accountId } = job.data;
    const snapshot = await computeRunwaySnapshot(accountId);
    await redis.set(CACHE_KEYS.runwaySnapshot(accountId), JSON.stringify(snapshot));
  }
}, { connection: redis });

runwayWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

runwayWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
