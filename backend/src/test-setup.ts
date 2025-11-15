import { vi, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

const pglite = new PGlite();
const testDb = drizzle(pglite);

const mockPool = {
  query: vi.fn(async (sql: string) => {
    if (sql === 'SELECT 1') {
      return { rows: [{ '?column?': 1 }] };
    }
    return { rows: [] };
  }),
  end: vi.fn()
};

vi.mock('./db/index.js', () => ({
  pool: mockPool,
  db: testDb
}));

beforeAll(async () => {
  await pglite.exec(`
    CREATE TYPE sentiment_type AS ENUM ('GOOD', 'BAD', 'NEUTRAL');

    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      text VARCHAR(1000) NOT NULL,
      sentiment sentiment_type NOT NULL,
      confidence_score DECIMAL(5, 4),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
});
