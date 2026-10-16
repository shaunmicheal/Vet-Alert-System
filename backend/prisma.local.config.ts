import "dotenv/config";
import { defineConfig } from "prisma/config";

const localEnv = process.env.DATABASE_URL;

if (!localEnv) {
  throw new Error("DATABASE_URL is missing.");
}

const url = new URL(localEnv);

if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "5432" ||
  url.pathname !== "/vetalert_phase4"
) {
  throw new Error("Safety check failed: Prisma must target the local vetalert_phase4 database.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: localEnv,
  },
});
