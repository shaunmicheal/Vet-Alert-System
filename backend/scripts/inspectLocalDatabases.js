// Step 1 read-only local inspection: 127.0.0.1:5432 only.
// Safety: never reads backend/.env, never prints credentials or full URLs,
// never reads user/application rows, never writes. Only database names + basic metadata.
// Usage (process-only, no .env edits):
//   $env:PG_INSPECT_URL='postgresql://USER:PASS@127.0.0.1:5432/postgres'; node scripts/inspectLocalDatabases.js
//   (PowerShell example; use an existing safe local credential procedure; do not guess passwords.)
const { Pool } = require('pg');

async function main() {
  const raw = process.env.PG_INSPECT_URL || '';
  if (!raw) {
    console.log(JSON.stringify({
      targetVerifiedAsLocal: false,
      vetalert_phase4_exists: null,
      appearsDedicatedTestDb: null,
      note: 'PG_INSPECT_URL not set. Set a process-only local URL explicitly targeting 127.0.0.1:5432 (never Neon, never backend/.env values). No connection attempted.',
    }, null, 2));
    process.exit(0);
  }

  // Validate target shape WITHOUT printing the URL or credentials.
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    console.log(JSON.stringify({ targetVerifiedAsLocal: false, error: 'PG_INSPECT_URL is unparseable. No connection attempted.' }));
    process.exit(1);
  }
  const host = (parsed.hostname || '').toLowerCase();
  const port = parsed.port || '(default)';
  const rawLower = raw.toLowerCase();
  const isLocal = host === '127.0.0.1' && port === '5432';
  const isNeon = rawLower.includes('neon.tech') || rawLower.includes('neon-') || host.includes('neon');
  if (!isLocal || isNeon) {
    console.log(JSON.stringify({
      targetVerifiedAsLocal: false,
      hostType: isNeon ? 'neon-like (REFUSED)' : 'non-local (REFUSED)',
      portSeen: port === '5432' ? '5432' : 'NOT-5432',
      note: 'Refused: PG_INSPECT_URL must be exactly 127.0.0.1:5432 and never Neon. No connection attempted. Credentials/URL not printed.',
    }, null, 2));
    process.exit(1);
  }

  // Explicit local target; short timeouts; read-only statements only.
  const pool = new Pool({
    connectionString: raw,
    host: '127.0.0.1',
    port: 5432,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
    max: 1,
    // Never allow writes at the driver level intent: we only issue SELECTs below.
  });

  try {
    // 1) Only database names (no row data).
    const dbs = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;');
    const names = dbs.rows.map((r) => r.datname);
    const exists = names.includes('vetalert_phase4');

    // 2) Basic metadata only for the target db (size + owner oid name), no table reads.
    let meta = null;
    if (exists) {
      const m = await pool.query(
        'SELECT d.datname, pg_get_userbyid(d.datdba) AS owner, pg_database_size(d.datname) AS size_bytes FROM pg_database d WHERE d.datname = $1;',
        ['vetalert_phase4']
      );
      meta = m.rows[0]
        ? { database: m.rows[0].datname, ownerPresent: Boolean(m.rows[0].owner), sizeBytes: String(m.rows[0].size_bytes) }
        : null;
    }

    // Isolation cannot be proven by name alone — report conservatively.
    console.log(JSON.stringify({
      targetVerifiedAsLocal: true,
      target: { host: '127.0.0.1', port: 5432 },
      databaseNames: names,
      vetalert_phase4_exists: exists,
      vetalert_phase4_metadata: meta,
      appearsDedicatedTestDb: exists ? 'unknown — name match only; isolation NOT proven (no table/row reads performed by design)' : null,
      safeToUseWithoutAltering: exists ? 'unknown — do not use until isolation + ownership + test cleanup verified in a later step' : 'n/a — database absent',
      filesChanged: false,
      databasesChanged: false,
      credentialsExposed: false,
    }, null, 2));
  } catch (err) {
    console.log(JSON.stringify({
      targetVerifiedAsLocal: true,
      target: { host: '127.0.0.1', port: 5432 },
      vetalert_phase4_exists: null,
      error: `Local inspection failed: ${err.code || err.name || 'ERROR'} (message withheld to avoid leaking details). No writes performed.`,
    }, null, 2));
    process.exit(1);
  } finally {
    try { await pool.end(); } catch { /* ignore */ }
  }
}

main();
