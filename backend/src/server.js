const app = require('./app');
const prisma = require('./config/prisma');
const { env } = require('./config/env');

const start = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[db] Connected to the database.');
  } catch (err) {
    console.error('[db] Could not reach the database at startup.');
    console.error(`[db] ${err.name} - check DATABASE_URL and your network access.`);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`[api] VetAlert Zimbabwe API running on http://localhost:${env.PORT}`);
    console.log(`[api] Environment: ${env.NODE_ENV}`);
  });

  const shutdown = (signal) => {
    console.log(`\n[api] ${signal} received - shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[api] Server closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
