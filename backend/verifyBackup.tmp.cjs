/* Verify a custom-format backup WITHOUT touching any live database.
 * Streams `pg_restore --data-only` to stdout and counts COPY rows per table.
 * Prints counts + booleans only. Never prints row data, emails, hashes, tokens.
 * Usage: node backend/verifyBackup.tmp.cjs <backup-file>
 */
const { spawnSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('Usage: node backend/verifyBackup.tmp.cjs <backup-file>'); process.exitCode = 1; }
else {
  const r = spawnSync('pg_restore', ['--data-only', '--file=-', file], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (r.status !== 0) { console.error('RESTORE_STREAM_FAILED'); console.error((r.stderr || '').slice(0, 300)); process.exitCode = 1; }
  else {
    const counts = {};
    let current = null;
    let adminRows = 0;
    for (const rawLine of String(r.stdout || '').split('\n')) {
      const line = rawLine.replace(/\r$/, '');
      const m = /^COPY\s+[\w".]+\."?(\w+)"?\s*\(/.exec(line);
      if (m) { current = m[1]; counts[current] = 0; continue; }
      if (line === '\\.') { current = null; continue; }
      if (current && line.length && !line.startsWith('\\.')) {
        counts[current] += 1;
        if (current === 'User' && line.includes('\tADMIN\t')) adminRows += 1;
      }
    }
    console.log('row_counts:', JSON.stringify(counts));
    console.log('backup_admin_rows_role_ADMIN:', adminRows);
    console.log('VERIFY_OK');
  }
}
