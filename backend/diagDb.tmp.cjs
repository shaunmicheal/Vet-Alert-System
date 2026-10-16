/* READ-ONLY pooler-vs-direct comparison. Never prints URL/host/creds. */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
function clean(err) {
  return { name: err && err.name, code: err && (err.code || err.cause?.code),
    message: String((err && err.message) || '').replace(/postgresql:\/\/[^\s'"]+/gi, 'postgresql://[REDACTED]').slice(0, 160) };
}
async function probe(label, url) {
  const { PrismaClient } = require('@prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const t0 = Date.now();
  try {
    await prisma.$queryRawUnsafe('SELECT 1 AS ok');
    console.log(label + '_ok_ms=' + (Date.now() - t0));
  } catch (e) { console.log(label + '_failed_ms=' + (Date.now() - t0), JSON.stringify(clean(e))); }
  await prisma.$disconnect().catch(() => {});
}
async function main() {
  const raw = String(process.env.DATABASE_URL || '');
  console.log('url_len:', raw.length);
  const m = raw.match(/^(postgresql:\/\/[^@]+@)([^/:]+)(:\d+)?(\/[^?]+)(\?.*)?$/);
  if (!m) { console.log('url_shape: unparseable'); return; }
  const creds = m[1]; const host = m[2]; const port = m[3] || ''; const db = m[4]; const qs = m[5] || '';
  const isPooler = host.includes('-pooler.');
  const altHost = isPooler ? host.replace('-pooler.', '.') : host.split('.')[0] + '-pooler.' + host.split('.').slice(1).join('.');
  console.log('current_host_kind:', isPooler ? 'pooler' : 'direct');
  await probe('current', raw);
  await probe('current_again', raw);
  await probe('alternate', creds + altHost + port + db + qs);
}
main().then(() => console.log('CMP_DONE')).catch((e) => { console.log('CMP_FATAL', JSON.stringify(clean(e))); process.exitCode = 1; });
