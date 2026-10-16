/* READ-ONLY latency decomposition: DNS -> TCP -> TLS. Prints only
 * timings, counts, and error codes. Never prints host, IP, or creds. */
const path = require('path');
const dns = require('dns');
const net = require('net');
const tls = require('tls');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const raw = String(process.env.DATABASE_URL || '');
const m = raw.match(/^(postgresql:\/\/[^@]+@)([^/:]+)(:\d+)?(\/[^?]+)(\?.*)?$/);
if (!m) { console.log('url_shape: unparseable'); process.exit(1); }
const host = m[2];
const port = Number((m[3] || ':5432').replace(':', '')) || 5432;

const ms = (t) => Date.now() - t;

async function trial(i) {
  // 1. DNS
  const t0 = Date.now();
  let addrs = [];
  try {
    addrs = await dns.promises.lookup(host, { all: true });
    console.log(`t${i} dns_ok_ms=${ms(t0)} n_addrs=${addrs.length}`);
  } catch (e) { console.log(`t${i} dns_failed_ms=${ms(t0)} code=${e.code}`); return; }
  // 2. TCP (first address only)
  const t1 = Date.now();
  let sock;
  try {
    sock = await new Promise((res, rej) => {
      const s = net.connect({ host: addrs[0].address, port, family: addrs[0].family });
      s.setTimeout(25000);
      s.once('connect', () => { s.destroy(); res(s); });
      s.once('timeout', () => { s.destroy(); const e = new Error('tcp timeout'); e.code = 'TCP_TIMEOUT'; rej(e); });
      s.once('error', rej);
    });
    console.log(`t${i} tcp_ok_ms=${ms(t1)}`);
  } catch (e) { console.log(`t${i} tcp_failed_ms=${ms(t1)} code=${e.code}`); return; }
  // 3. TLS handshake
  const t2 = Date.now();
  try {
    await new Promise((res, rej) => {
      const s = tls.connect({ host: addrs[0].address, port, servername: host, rejectUnauthorized: false });
      s.setTimeout(25000);
      s.once('secureConnect', () => { s.destroy(); res(); });
      s.once('timeout', () => { s.destroy(); const e = new Error('tls timeout'); e.code = 'TLS_TIMEOUT'; rej(e); });
      s.once('error', rej);
    });
    console.log(`t${i} tls_ok_ms=${ms(t2)}`);
  } catch (e) { console.log(`t${i} tls_failed_ms=${ms(t2)} code=${e.code}`); }
}

(async () => {
  for (let i = 1; i <= 4; i++) await trial(i);
  console.log('LAYER_DONE');
})().catch((e) => console.log('LAYER_FATAL code=' + e.code));
