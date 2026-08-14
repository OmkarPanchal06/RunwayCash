import Fastify from 'fastify';
import ledgerRoutes from './routes/ledger';
import forkRoutes from './routes/forks';

const fastify = Fastify({ logger: true });

fastify.register(ledgerRoutes, { prefix: '/api/v1' });
fastify.register(forkRoutes, { prefix: '/api/v1' });

fastify.get('/', async (request, reply) => {
  return { hello: 'RunwayCash API is live!' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('API running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
