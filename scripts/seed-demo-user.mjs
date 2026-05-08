/**
 * Seed (or refresh) the unified-flow demo user in Will's Postgres database.
 *
 *   email:    demo@trefolio.test
 *   password: DemoPass2026!
 *   plan:     pro (dailyAgentMessageLimit=200)
 *
 * Idempotent. Mirrors trefolio's and Clara's seed scripts.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const EMAIL = "demo@trefolio.test";
const PASSWORD = "DemoPass2026!";
const NAME = "Demo Trefolio";

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/will?schema=public";
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const user = await db.user.upsert({
      where: { email: EMAIL },
      update: {
        passwordHash,
        name: NAME,
        emailVerified: new Date(),
        isActive: true,
        dailyAgentMessageLimit: 200,
      },
      create: {
        email: EMAIL,
        passwordHash,
        name: NAME,
        emailVerified: new Date(),
        isActive: true,
        dailyAgentMessageLimit: 200,
      },
      select: { id: true, email: true, dailyAgentMessageLimit: true },
    });
    console.log(`OK will user id=${user.id} email=${user.email} limit=${user.dailyAgentMessageLimit}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
