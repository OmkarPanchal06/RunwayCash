import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { computeForkSnapshot, ForkDiff } from '../services/forkService';

export default async function (fastify: FastifyInstance) {
  fastify.post('/accounts/:accountId/forks', async (request: any, reply) => {
    const { accountId } = request.params;
    // diff_json contains the hypotheticals (e.g. canceling a bill)
    const { name, diff_json } = request.body; 

    // 1. Run the shadow simulation via ForkService!
    const simulatedSnapshot = await computeForkSnapshot(accountId, diff_json);

    // 2. Fetch the latest real snapshot to link as the base state
    const baseSnapshotRes = await query(
      'SELECT id FROM runway_snapshots WHERE account_id = $1 ORDER BY computed_at DESC LIMIT 1', 
      [accountId]
    );
    const baseSnapshotId = baseSnapshotRes.rows[0]?.id;

    if (!baseSnapshotId) {
      reply.status(400).send({ error: "Cannot create fork without a base snapshot." });
      return;
    }

    // 3. Persist the fork
    const result = await query(
      `INSERT INTO forks (account_id, name, base_snapshot_id, diff_json, status)
       VALUES ($1, $2, $3, $4, 'saved') RETURNING *`,
      [accountId, name, baseSnapshotId, JSON.stringify(diff_json)]
    );

    // 4. Return the fork metadata AND the newly simulated timeline
    return { fork: result.rows[0], simulatedSnapshot };
  });

  // Endpoints to Commit or Discard would go here...
}
