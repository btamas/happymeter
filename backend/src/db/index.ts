import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://happymeter:happymeter@localhost:5432/happymeter',
  // Connection pool configuration
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum pool size
  min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum pool size
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10), // 5 seconds
  // Ensure connections are kept alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

export const db = drizzle(pool);

export { pool };
