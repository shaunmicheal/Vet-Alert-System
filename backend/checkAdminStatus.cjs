const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const email = process.env.VETALERT_ADMIN_EMAIL?.trim().toLowerCase();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL || !email) {
    throw new Error("Database URL or account email is missing.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      farm: { select: { id: true } },
      veterinaryProfessional: { select: { id: true } },
      healthReports: { select: { id: true } },
      reminders: { select: { id: true } },
      referralsMade: { select: { id: true } },
    },
  });

  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  if (!user) {
    console.log("Account found: false");
  } else {
    console.log("Account found: true");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Has farm:", Boolean(user.farm));
    console.log(
      "Has veterinary profile:",
      Boolean(user.veterinaryProfessional),
    );
    console.log("Health reports:", user.healthReports.length);
    console.log("Reminders:", user.reminders.length);
    console.log("Referrals made:", user.referralsMade.length);
  }

  console.log("Total admin accounts:", adminCount);
}

async function run() {
  try {
    await main();
  } catch {
    console.error(
      "Inspection failed. Check the database configuration and schema.",
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  }
}

run();
