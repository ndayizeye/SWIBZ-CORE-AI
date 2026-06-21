import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file.
dotenv.config();

const getResolvedSqlHost = (): string | undefined => {
  const envHost = process.env.SQL_HOST;
  if (!envHost) return undefined;
  if (envHost.startsWith("/")) {
    if (fs.existsSync(envHost)) {
      return envHost;
    }
    const parentDir = path.dirname(envHost);
    if (fs.existsSync(parentDir)) {
      try {
        const subdirs = fs.readdirSync(parentDir);
        const match = subdirs.find(name => name.includes(":"));
        if (match) {
          return path.join(parentDir, match);
        }
      } catch (err) {
        console.error("Error scanning SQL_HOST directory:", err);
      }
    }
  }
  return envHost;
};

const sqlHost = getResolvedSqlHost();
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!sqlHost) {
  throw new Error("SQL_HOST must be set in environment variables.");
}
if (!sqlDbName) {
  throw new Error("SQL_DB_NAME must be set in environment variables.");
}
if (!user) {
  throw new Error("SQL_ADMIN_USER must be set in environment variables.");
}
if (!password) {
  throw new Error("SQL_ADMIN_PASSWORD must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  },
  verbose: true,
});
