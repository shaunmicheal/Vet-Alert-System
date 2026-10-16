/* READ-ONLY: per-address TLS handshake timing. Prints only index/family/
 * timing/error-code. Never prints IP addresses, hostname, or creds. */
const path = require('path');
const dns = require('dns');
const tls = require('tls');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const raw = String(process.env.DATABASE_URL || '');
const m = raw.match(/^(postgresql:\/\/[^@]+@)([^/:]+)(:\d+)?(\/[^?]+)(\?.*)?$/);
if (!m) { console.log('url_shape: unparseable'); process.exit(1); }
const host = m[2];
const port = Number((m[3] || ':5432').replace(':', '')) || 5432;

(async () => {
  const addrs = await dns.promises.lookup(host, { all: true });
  console.log('n_addrs=' + addrs.length);
  for (let round = 1; round <= 3; round++) {
    for (let i = 0; i < addrs.length; i++) {
      const a = addrs[i];
      const t0 = Date.now();
      try {
        await new Promise((res, rej) => {
          const s = tls.connect({ host: a.address, port, servername: host, rejectUnauthorized: false });
          s.setTimeout(25000);
          s.once('secureConnect', () => { s.destroy(); res(); });
          s.once('timeout', () => { s.destroy(); const e = new Error('t'); e.code = 'TLS_TIMEOUT'; rej(e); });
          s.once('error', rej);
        });
        console.log(`r${round} ip${i} family=${a.family} tls_ok_ms=${Date.now() - t0}`);
      } catch (e) { console.log(`r${round} ip${i} family=${a.family} tls_failed_ms=${Date.now() - t0} code=${e.code}`); }
    }
  }
  console.log('PERIP_DONE');
})().catch((e) => console.log('PERIP_FATAL code=' + e.code));