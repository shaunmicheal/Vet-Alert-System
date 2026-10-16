/* Stage A backup helper (Windows PowerShell safe).
 * Reads DATABASE_URL from backend/.env, never prints it.
 * Passes credentials via PGPASSWORD env (not argv/history) because the
 * Windows libpq build prompts for a password when given the raw URL.
 * Writes a timestamped custom-format dump outside the repo:
 *   <repo>/../vetalert-backups/vetalert-neondb-<timestamp>.dump
 * Verifies: file non-empty + pg_restore --list readable.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BACKEND_DIR = __dirname;
require('dotenv').config({ path: path.join(BACKEND_DIR, '.env'), quiet: true });

function loadDatabaseUrl() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (!url || !url.includes('://')) throw new Error('DATABASE_URL missing or malformed in backend/.env');
  return url;
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function parseDatabaseUrl(url) {
  // Manual parse: password may contain URL-significant chars that break new URL().
  const body = url.replace(/^postgresql:\/\//, '');
  const at = body.lastIndexOf('@');
  const creds = body.slice(0, at);
  const colon = creds.indexOf(':');
  const username = decodeURIComponent(creds.slice(0, colon));
  const password = decodeURIComponent(creds.slice(colon + 1));
  const rest = body.slice(at + 1);
  const qmark = rest.indexOf('?');
  const hostDb = qmark === -1 ? rest : rest.slice(0, qmark);
  const query = qmark === -1 ? '' : rest.slice(qmark + 1);
  const slash = hostDb.indexOf('/');
  const hostPort = hostDb.slice(0, slash);
  const dbname = hostDb.slice(slash + 1);
  const hpColon = hostPort.lastIndexOf(':');
  const host = hpColon === -1 ? hostPort : hostPort.slice(0, hpColon);
  const port = hpColon === -1 ? '5432' : hostPort.slice(hpColon + 1);
  const sslmode = (/sslmode=([^&]+)/.exec(query) || [])[1] || 'require';
  return { username, password, host, port, dbname, sslmode };
}

function main() {
  const databaseUrl = loadDatabaseUrl();
  const u = parseDatabaseUrl(databaseUrl);
  const env = { ...process.env, PGPASSWORD: u.password, PGSSLMODE: u.sslmode };
  const args = [
    '--format=custom',
    '--no-owner',
    '--host=' + u.host,
    '--port=' + u.port,
    '--username=' + u.username,
    '--dbname=' + u.dbname,
  ];
  const repoRoot = path.resolve(BACKEND_DIR, '..');
  const backupDir = path.resolve(repoRoot, '..', 'vetalert-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  // Remove the earlier 0-byte failed attempt if present.
  for (const f of fs.readdirSync(backupDir)) {
    const p = path.join(backupDir, f);
    try {
      if (f.endsWith('.dump') && fs.statSync(p).size === 0) fs.unlinkSync(p);
    } catch { /* ignore */ }
  }
  const backupFile = path.join(backupDir, `vetalert-neondb-${stamp()}.dump`);
  args.push('--file=' + backupFile);

  console.log('backup_dir:', backupDir);
  const dump = spawnSync('pg_dump', args, { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  if (dump.status !== 0) {
    console.error('BACKUP_FAILED');
    console.error(String(dump.stderr || '').split('\n').slice(0, 5).join('\n'));
    process.exitCode = 1;
    return;
  }
  const stat = fs.statSync(backupFile);
  console.log('backup_file:', backupFile);
  console.log('backup_bytes:', stat.size);
  console.log('backup_mtime_utc:', stat.mtime.toISOString());
  if (stat.size <= 0) {
    console.error('BACKUP_EMPTY - aborting');
    process.exitCode = 1;
    return;
  }
  const list = spawnSync('pg_restore', ['--list', backupFile], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  if (list.status !== 0) {
    console.error('BACKUP_VERIFY_FAILED - pg_restore could not read archive');
    process.exitCode = 1;
    return;
  }
  const lines = String(list.stdout || '').split(/\r?\n/).filter(Boolean);
  console.log('pg_restore_list_entries:', lines.length);
  console.log('pg_restore_sample:', lines.slice(0, 3).join(' | ').slice(0, 200));
  console.log('BACKUP_OK');
}

try {
  main();
} catch (err) {
  console.error('BACKUP_ERROR:', err.message);
  process.exitCode = 1;
}
