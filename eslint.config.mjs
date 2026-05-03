import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Curly quotes in body copy are fine; this rule is too aggressive for
      // marketing / legal pages and adds noise without helping correctness.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: [
      "src/lib/log.ts",
      "src/app/api/webhooks/**/*.ts",
      "src/app/api/cron/**/*.ts",
      "scripts/**/*.{ts,mjs}",
    ],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
