import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // We deliberately do not use Prisma Migrate yet. Production builds run
  // `prisma db push` (see `prisma:sync` in package.json) which is idempotent
  // and safe to run on every deploy while the schema is still evolving fast.
  // When the schema settles we'll baseline a migration and switch to
  // `prisma migrate deploy`.
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
