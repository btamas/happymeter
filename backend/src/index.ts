import * as dotenv from 'dotenv';
import { app } from './app.js';
import { warmupSentiment } from './services/sentiment.js';
import { pool } from './db/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);

  // Test database connection on startup
  try {
    await pool.query('SELECT NOW()');
    // eslint-disable-next-line no-console
    console.log('✅ Database connected');
  } catch (error) {
     
    console.error('⚠️  Database connection failed:', error);
  }

  // eslint-disable-next-line no-console
  console.log('Warming up sentiment analysis model...');
  warmupSentiment()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Sentiment model ready');
    })
    .catch(error => {
       
      console.error('⚠️  Failed to warm up sentiment model:', error);
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, closing database connection...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, closing database connection...');
  await pool.end();
  process.exit(0);
});
