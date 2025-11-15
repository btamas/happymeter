import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Check the health status of the API and database connection
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-11-15T12:00:00.000Z
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 database:
 *                   type: string
 *                   example: disconnected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-11-15T12:00:00.000Z
 */
router.get('/health', async (_req: Request, res: Response) => {
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

export default router;
