/* Read-only audit for VetAlert Zimbabwe reset planning.
 * SELECT-only: never DELETE/TRUNCATE/DROP/migrate/seed.
 * Prints counts + role info only. Never prints connection strings or hashes.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const ADMIN_EMAIL = 'shaunjeranyama@gmail.com';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing in backend/.env');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await prisma.$connect();
    console.log('connection: OK');
    const models = {
      user: prisma.user,
      farm: prisma.farm,
      animal: prisma.animal,
      healthReport: prisma.healthReport,
      symptom: prisma.symptom,
      reportSymptom: prisma.reportSymptom,
      veterinaryProfessional: prisma.veterinaryProfessional,
      referral: prisma.referral,
      reminder: prisma.reminder,
      alert: prisma.alert,
    };
    for (const [name, m] of Object.entries(models)) {
      try {
        console.log(`count.${name}:`, await m.count());
      } catch (e) {
        console.log(`count.${name}: ERROR ${e.code || e.message}`);
      }
    }
    const byRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
    console.log('users_by_role:', JSON.stringify(byRole.map((r) => ({ role: r.role, n: r._count._all }))));
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { email: true, role: true, createdAt: true },
    });
    console.log('target_admin_found:', Boolean(admin));
    if (admin) console.log('target_admin_role:', admin.role);
    console.log('total_admins:', await prisma.user.count({ where: { role: 'ADMIN' } }));
    // Reference-data markers (never prints secrets)
    console.log('demo_vet_directory_example_com:', await prisma.veterinaryProfessional.count({ where: { email: { endsWith: '@example.com' } } }));
    console.log('linked_vet_profiles_userId_not_null:', await prisma.veterinaryProfessional.count({ where: { userId: { not: null } } }));
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((e) => { console.error('AUDIT_FAILED', e.code || e.message); process.exitCode = 1; });
