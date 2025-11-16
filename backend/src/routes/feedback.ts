import { Router, Request, Response } from 'express';
import basicAuth from 'express-basic-auth';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { db } from '../db/index.js';
import { feedback } from '../db/schema.js';
import { analyzeSentiment } from '../services/sentiment.js';
import { desc, eq, sql } from 'drizzle-orm';

const router = Router();

const MAX_FEEDBACK_LIMIT = 100;

// Rate limiter for feedback submission endpoint
const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per IP per minute
  message: {
    error: 'Too Many Requests',
    message: 'Too many feedback submissions, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Disable rate limiting in test environment
  keyGenerator: (req: Request) => {
    const xff = (req.headers['x-forwarded-for'] as string) || '';
    const ip = xff.split(',')[0]?.trim() || req.ip || 'unknown';
    const normalizedIp = ipKeyGenerator(ip);
    const ua = req.get('user-agent') || '';
    return `${normalizedIp}:${ua}`;
  }
});

// Basic auth middleware for admin endpoints
const adminAuth = basicAuth({
  users: {
    [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'admin123'
  },
  challenge: true,
  realm: 'HappyMeter Admin',
  unauthorizedResponse: () => ({
    error: 'Unauthorized',
    message: 'Authentication required to access admin endpoints'
  })
});

/**
 * @openapi
 * /api/feedback:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Submit customer feedback
 *     description: Submit feedback text (max 1000 characters) and receive automatic sentiment analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Great product! Very satisfied with the quality.
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 text:
 *                   type: string
 *                   example: Great product! Very satisfied with the quality.
 *                 sentiment:
 *                   type: string
 *                   enum: [GOOD, BAD, NEUTRAL]
 *                   example: GOOD
 *                 confidenceScore:
 *                   type: string
 *                   example: "0.8542"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-11-14T12:00:00.000Z
 *       400:
 *         description: Bad request - invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/feedback', feedbackLimiter, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text field is required and must be a string'
      });
      return;
    }

    if (text.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text cannot be empty'
      });
      return;
    }

    if (text.length > 1000) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text must not exceed 1000 characters'
      });
      return;
    }

    const sentimentResult = await analyzeSentiment(text);
    const sentimentEnum = sentimentResult.label;

    // The max probability corresponds to the selected label
    const confidenceScore =
      sentimentResult.probs[
        sentimentEnum === 'GOOD' ? 'positive' : sentimentEnum === 'BAD' ? 'negative' : 'neutral'
      ].toFixed(4);

    const [newFeedback] = await db
      .insert(feedback)
      .values({
        text: text.trim(),
        sentiment: sentimentEnum,
        confidenceScore: confidenceScore
      })
      .returning();

    res.status(201).json({
      id: newFeedback.id,
      text: newFeedback.text,
      sentiment: newFeedback.sentiment,
      confidenceScore: newFeedback.confidenceScore,
      createdAt: newFeedback.createdAt
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit feedback'
    });
  }
});

/**
 * @openapi
 * /api/feedback:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Retrieve all feedback (Admin only)
 *     description: Get all submitted feedback with sentiment analysis results, ordered by most recent first. Requires HTTP Basic Authentication.
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: sentiment
 *         schema:
 *           type: string
 *           enum: [GOOD, BAD, NEUTRAL]
 *         description: Filter by sentiment
 *     responses:
 *       200:
 *         description: List of all feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedback:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       text:
 *                         type: string
 *                         example: Great product!
 *                       sentiment:
 *                         type: string
 *                         enum: [GOOD, BAD, NEUTRAL]
 *                         example: GOOD
 *                       confidenceScore:
 *                         type: string
 *                         example: "0.8542"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-11-14T12:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-11-14T12:00:00.000Z
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 offset:
 *                   type: integer
 *                   example: 0
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/feedback', adminAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(MAX_FEEDBACK_LIMIT, parseInt(req.query.limit as string) || 20));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const sentimentFilter = req.query.sentiment as string | undefined;

    let query = db.select().from(feedback).$dynamic();

    if (sentimentFilter && ['GOOD', 'BAD', 'NEUTRAL'].includes(sentimentFilter)) {
      query = query.where(eq(feedback.sentiment, sentimentFilter as 'GOOD' | 'BAD' | 'NEUTRAL'));
    }

    const [feedbackList, countResult] = await Promise.all([
      query.orderBy(desc(feedback.createdAt)).limit(limit).offset(offset),
      sentimentFilter && ['GOOD', 'BAD', 'NEUTRAL'].includes(sentimentFilter)
        ? db
            .select({ count: sql<number>`count(*)::int` })
            .from(feedback)
            .where(eq(feedback.sentiment, sentimentFilter as 'GOOD' | 'BAD' | 'NEUTRAL'))
        : db.select({ count: sql<number>`count(*)::int` }).from(feedback)
    ]);

    const total = countResult[0]?.count || 0;

    res.json({
      feedback: feedbackList,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Feedback retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve feedback'
    });
  }
});

/**
 * @openapi
 * /api/feedback/stats:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback statistics (Admin only)
 *     description: Get aggregated statistics for all feedback including total counts by sentiment. Requires HTTP Basic Authentication.
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Feedback statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 good:
 *                   type: integer
 *                   example: 80
 *                 bad:
 *                   type: integer
 *                   example: 35
 *                 neutral:
 *                   type: integer
 *                   example: 35
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/feedback/stats', adminAuth, async (_req: Request, res: Response) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        good: sql<number>`count(case when sentiment = 'GOOD' then 1 end)::int`,
        bad: sql<number>`count(case when sentiment = 'BAD' then 1 end)::int`,
        neutral: sql<number>`count(case when sentiment = 'NEUTRAL' then 1 end)::int`
      })
      .from(feedback);

    res.json({
      total: stats.total || 0,
      good: stats.good || 0,
      bad: stats.bad || 0,
      neutral: stats.neutral || 0
    });
  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics'
    });
  }
});

export default router;
