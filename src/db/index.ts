import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import * as schema from './schema.ts';

// Helper to robustly resolve dynamic Cloud SQL socket directories
export const resolveSqlHost = (): string | undefined => {
  const envHost = process.env.SQL_HOST;
  if (!envHost) return envHost;

  if (envHost.startsWith('/')) {
    if (fs.existsSync(envHost)) {
      return envHost;
    }

    const parentDir = path.dirname(envHost);
    if (fs.existsSync(parentDir)) {
      try {
        const subdirs = fs.readdirSync(parentDir);
        const match = subdirs.find(name => name.includes(':'));
        if (match) {
          const resolvedPath = path.join(parentDir, match);
          console.log(`[Database Connection] Overriding SQL_HOST socket path from "${envHost}" to "${resolvedPath}"`);
          return resolvedPath;
        }
      } catch (err) {
        console.error('Error scanning backup SQL_HOST directory:', err);
      }
    }
  }
  return envHost;
};

// Function to create a new connection pool.
export const createPool = () => {
  const hostPath = resolveSqlHost();
  return new Pool({
    host: hostPath,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };
