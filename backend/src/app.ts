import express from 'express';
import swaggerUi from 'swagger-ui-express';
import feedbackRouter from './routes/feedback.js';
import { pool } from './db/index.js';
import { swaggerSpec } from './swagger.js';

export const app = express();

app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api', feedbackRouter);
