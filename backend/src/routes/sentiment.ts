import { Router, Request, Response } from 'express'
import { analyzeSentiment } from '../services/sentiment.js'

const router = Router()

/**
 * POST /api/sentiment
 * Analyze sentiment of provided text
 *
 * Request body:
 * {
 *   "text": "Your feedback text here"
 * }
 *
 * Response:
 * {
 *   "label": "Good" | "Neutral" | "Bad",
 *   "score": number (-10 to 10),
 *   "probs": {
 *     "positive": number,
 *     "neutral": number,
 *     "negative": number
 *   }
 * }
 */
router.post('/sentiment', async (req: Request, res: Response) => {
  try {
    const { text } = req.body

    // Validation
    if (!text || typeof text !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text field is required and must be a string'
      })
      return
    }

    if (text.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text cannot be empty'
      })
      return
    }

    if (text.length > 1000) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text must not exceed 1000 characters'
      })
      return
    }

    // Analyze sentiment
    const result = await analyzeSentiment(text)

    res.json({
      label: result.label,
      score: result.score,
      probs: result.probs
    })
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to analyze sentiment'
    })
  }
})

export default router
