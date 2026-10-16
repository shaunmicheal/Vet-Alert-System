/* READ-ONLY: mimics server.js startup check 3x. No writes. */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
function clean(err) {
  return { name: err && err.name, code: err && (err.code || err.cause?.code),
    message: String((err && err.message) || '').replace(/postgresql:\/\/[^\s'"]+/gi, 'postgresql://[REDACTED]').slice(0, 200) };
}
(async () => {
  const { PrismaClient } = require('@prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  for (let i = 1; i <= 3; i++) {
    const t0 = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`startup_check_${i}_ok_ms=${Date.now() - t0}`);
    } catch (e) { console.log(`startup_check_${i}_failed_ms=${Date.now() - t0}`, JSON.stringify(clean(e))); }
  }
  await prisma.$disconnect().catch(() => {});
  console.log('STARTUP_MIMIC_DONE');
})().catch((e) => console.log('MIMIC_FATAL', JSON.stringify(clean(e))));