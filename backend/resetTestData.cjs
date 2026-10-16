const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const ADMIN_EMAIL = 'shaunjeranyama@gmail.com';
const EXPECTED_DB = 'neondb';
const EXECUTE = process.argv.includes('--execute');
const CONFIRM = (process.argv.find((a) => a.startsWith('--confirm=')) || '').split('=')[1];

const BACKUP_FLAG = (process.argv.find((a) => a.startsWith('--backup=')) || '').slice('--backup='.length);

function resolveBackupDir() {
  return path.resolve(__dirname, '..', '..', 'vetalert-backups');
}

function expectedBackupFile() {
  const dir = resolveBackupDir();
  if (BACKUP_FLAG) {
    const p = path.resolve(BACKUP_FLAG);
    if (!p.startsWith(dir)) throw new Error('Backup must live in the vetalert-backups folder. Aborting.');
    return p;
  }
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.dump')).sort();
  if (files.length === 0) return null;
  if (files.length > 1) {
    throw new Error(
      'Multiple backups found (' + files.length + '). Re-run with explicit --backup=<full path to the verified .dump>. Aborting.',
    );
  }
  return path.join(dir, files[0]);
}

async function snapshot(prisma) {
  const [users, farms, animals, reports, referrals] = await Promise.all([
    prisma.user.count(), prisma.farm.count(), prisma.animal.count(),
    prisma.healthReport.count(), prisma.referral.count(),
  ]);
  const [reminders, alerts, symptoms, links, vets] = await Promise.all([
    prisma.reminder.count(), prisma.alert.count(), prisma.symptom.count(),
    prisma.reportSymptom.count(), prisma.veterinaryProfessional.count(),
  ]);
  const byRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  return { users, farms, animals, reports, referrals, reminders, alerts, symptoms, links, vets,
    byRole: byRole.map((r) => ({ role: r.role, n: r._count._all })) };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing in backend/.env');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await prisma.$connect();
    const rows = await prisma.$queryRaw`SELECT current_database() AS db`;
    const dbName = rows.map((r) => r.db)[0];
    if (dbName !== EXPECTED_DB) throw new Error('Unexpected database target. Aborting.');
    if (!EXECUTE || CONFIRM !== EXPECTED_DB) console.log('DRY-RUN (add --execute --confirm=neondb to delete). Target db verified: ' + dbName);
    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true, email: true, role: true } });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Admin missing or not ADMIN. Aborting.');
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount !== 1) throw new Error('Expected exactly 1 ADMIN, found ' + adminCount + '. Aborting.');
    const backupFile = expectedBackupFile();
    if (!backupFile || !fs.existsSync(backupFile) || fs.statSync(backupFile).size <= 0) throw new Error('Backup missing/empty. Aborting.');
    console.log('backup_verified: ' + backupFile + ' ' + fs.statSync(backupFile).size + ' bytes');
    const victims = await prisma.user.findMany({ where: { email: { not: ADMIN_EMAIL } }, select: { id: true, role: true } });
    const victimIds = victims.map((v) => v.id);
    const before = await snapshot(prisma);
    // ADMIN-ONLY SCOPE: every farm/animal/report/alert/reminder/referral/link
    // and all symptoms go, regardless of owner. Directory rows are NOT in scope
    // (no FK to User; 12 unlinked rows must remain).
    const allFarms = await prisma.farm.findMany({ select: { id: true } });
    const allFarmIds = allFarms.map((f) => f.id);
    const allReports = await prisma.healthReport.findMany({ select: { id: true } });
    const allReportIds = allReports.map((r) => r.id);
    const allAnimals = await prisma.animal.findMany({ select: { id: true } });
    const allAnimalIds = allAnimals.map((a) => a.id);
    const totalAlerts = before.alerts;
    console.log('would_remove_users: ' + victims.length);
    console.log('counts_before: ' + JSON.stringify(before));
    console.log('would_remove: farms=' + allFarmIds.length + ' animals=' + allAnimalIds.length + ' reports=' + allReportIds.length + ' alerts=' + totalAlerts + ' referrals=' + before.referrals + ' reminders=' + before.reminders + ' links=' + before.links + ' symptoms=' + before.symptoms);
    console.log('would_remain: users=1 (ADMIN ' + ADMIN_EMAIL + '), directory_rows=' + before.vets);
    if (!EXECUTE || CONFIRM !== EXPECTED_DB) {
      console.log('DRY-RUN complete. No records deleted.');
      console.log('On --execute: all farms/animals/reports/alerts/referrals/reminders/links/symptoms removed; admin user + 12 directory rows preserved.');
      return;
    }
    await prisma.$transaction(async (tx) => {
      // 1. Alerts first (reportId SetNull: must delete explicitly, else orphans).
      await tx.alert.deleteMany({});
      // 2. Referrals + links bound to reports.
      await tx.referral.deleteMany({});
      await tx.reportSymptom.deleteMany({});
      // 3. Reports (Cascade would handle referrals/links, already cleared).
      await tx.healthReport.deleteMany({});
      // 4. Animals (clear any report.animalId SetNull links first for safety).
      if (allAnimalIds.length) {
        await tx.healthReport.updateMany({ where: { animalId: { in: allAnimalIds } }, data: { animalId: null } });
      }
      await tx.animal.deleteMany({});
      // 5. Farms.
      await tx.farm.deleteMany({});
      // 6. Reminders (Cascade from user, explicit for determinism).
      await tx.reminder.deleteMany({});
      // 7. Unlink any vet profiles from doomed users (SetNull), then users.
      if (victimIds.length) {
        await tx.veterinaryProfessional.updateMany({ where: { userId: { in: victimIds } }, data: { userId: null } });
        await tx.user.deleteMany({ where: { id: { in: victimIds } } });
      }
      // 8. Symptoms: PHASE* test masters plus any others (audit shows 0 live rows).
      await tx.reportSymptom.deleteMany({});
      await tx.symptom.deleteMany({});
    });
    const after = await snapshot(prisma);
    console.log('counts_after: ' + JSON.stringify(after));
    const adminAfter = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { role: true } });
    if (!adminAfter || adminAfter.role !== 'ADMIN') throw new Error('Post-reset admin verification failed.');
    if (after.users !== 1) throw new Error('Expected exactly 1 user, found ' + after.users + '.');
    const empties = { farms: after.farms, animals: after.animals, reports: after.reports, alerts: after.alerts, referrals: after.referrals, reminders: after.reminders, links: after.links, symptoms: after.symptoms };
    for (const [k, v] of Object.entries(empties)) {
      if (v !== 0) throw new Error('Post-reset check failed: ' + k + ' = ' + v + ', expected 0.');
    }
    if (after.vets !== 12) throw new Error('Post-reset check failed: directory rows = ' + after.vets + ', expected 12.');
    console.log('RESET_OK: only ADMIN remains; all test-data tables empty; 12 directory rows preserved.');
  } finally {
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  }
}

main().catch((e) => { console.error('RESET_ABORTED:', e.message); process.exitCode = 1; });
