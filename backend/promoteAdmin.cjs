const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.VETALERT_ADMIN_EMAIL?.trim().toLowerCase();

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!databaseUrl || !email) {
    throw new Error("Required environment variables are missing.");
  }

  await prisma.$connect();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("The specified account does not exist.");
  }

  if (user.role === "ADMIN") {
    console.log("This account is already an administrator.");
    return;
  }

  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  if (adminCount > 0) {
    throw new Error("An administrator already exists. No changes were made.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: {
      email: true,
      role: true,
    },
  });

  console.log("Account successfully promoted.");
  console.log(`Email: ${updatedUser.email}`);
  console.log(`Role: ${updatedUser.role}`);
  console.log("Existing farm and health-report records were preserved.");
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error("Admin promotion failed.");

    const safeMessages = [
      "Required environment variables are missing.",
      "The specified account does not exist.",
      "An administrator already exists. No changes were made.",
    ];

    if (safeMessages.includes(error?.message)) {
      console.error("Reason:", error.message);
    } else if (error?.code) {
      console.error("Error code:", error.code);
      console.error("Check the database connection and configuration.");
    } else {
      console.error("Check the database connection and account configuration.");
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  }
}

run();
