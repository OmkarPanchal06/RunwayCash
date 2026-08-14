import { Queue } from 'bullmq';
import { redis } from '../cache/redis';

// Queue for recalculating runway snapshots (e.g. from daily cron or bulk CSV imports)
export const runwayQueue = new Queue('runway-recalc', { connection: redis });

// Queue for scheduling shortfall push notifications
export const notificationQueue = new Queue('notifications', { connection: redis });

export async function scheduleNightlyRecalculations() {
  await runwayQueue.add('nightly-recalc-all', {}, {
    repeat: {
      pattern: '0 0 * * *' // Midnight cron (MVP)
    }
  });
}
