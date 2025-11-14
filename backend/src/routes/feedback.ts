import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { feedback } from '../db/schema.js';
import { analyzeSentiment } from '../services/sentiment.js';
import { desc, eq, sql } from 'drizzle-orm';

const router = Router();

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
router.post('/feedback', async (req: Request, res: Response) => {
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
    const sentimentEnum = sentimentResult.label.toUpperCase() as 'GOOD' | 'NEUTRAL' | 'BAD';

    const confidenceScore = Math.max(
      sentimentResult.probs.positive || 0,
      sentimentResult.probs.neutral || 0,
      sentimentResult.probs.negative || 0
    ).toFixed(4);

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
 *     summary: Retrieve all feedback
 *     description: Get all submitted feedback with sentiment analysis results, ordered by most recent first
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
 *       500:
 *         description: Internal server error
 */
router.get('/feedback', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const sentimentFilter = req.query.sentiment as string | undefined;

    let query = db.select().from(feedback).$dynamic();

    if (sentimentFilter && ['GOOD', 'BAD', 'NEUTRAL'].includes(sentimentFilter)) {
      query = query.where(eq(feedback.sentiment, sentimentFilter as 'GOOD' | 'BAD' | 'NEUTRAL'));
    }

    const [feedbackList, countResult] = await Promise.all([
      query.orderBy(desc(feedback.createdAt)).limit(limit).offset(offset),
      sentimentFilter && ['GOOD', 'BAD', 'NEUTRAL'].includes(sentimentFilter)
        ? db.select({ count: sql<number>`count(*)::int` }).from(feedback).where(eq(feedback.sentiment, sentimentFilter as 'GOOD' | 'BAD' | 'NEUTRAL'))
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

export default router;
