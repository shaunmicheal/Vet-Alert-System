const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.VETALERT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.VETALERT_ADMIN_PASSWORD;
  const name = process.env.VETALERT_ADMIN_NAME?.trim();

  if (!databaseUrl || !email || !password || !name) {
    throw new Error("Required environment variables are missing.");
  }

  if (password.length < 12) {
    throw new Error("Use a password of at least 12 characters.");
  }

  console.log("Connecting to the database...");
  await prisma.$connect();
  console.log("Database connection established.");

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("That email already exists. No changes were made.");
  }

  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  if (adminCount > 0) {
    throw new Error("An admin already exists. No changes were made.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: null,
      role: "ADMIN",
    },
    select: {
      email: true,
      role: true,
    },
  });

  console.log("Admin account created successfully.");
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error("Admin creation failed.");

    const safeMessages = [
      "Required environment variables are missing.",
      "Use a password of at least 12 characters.",
      "That email already exists. No changes were made.",
      "An admin already exists. No changes were made.",
    ];

    if (safeMessages.includes(error?.message)) {
      console.error("Reason:", error.message);
    } else if (error?.code) {
      console.error("Error code:", error.code);
      console.error("Check the database connection and Prisma configuration.");
    } else {
      console.error("Check the script configuration and database connection.");
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  }
}

run();
