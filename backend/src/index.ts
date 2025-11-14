import express from 'express'
import * as dotenv from 'dotenv'
import sentimentRouter from './routes/sentiment.js'
import { warmupSentiment } from './services/sentiment.js'
import { pool } from './db/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1')
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    })
  }
})

// Sentiment analysis routes
app.use('/api', sentimentRouter)

// Start server and warm up sentiment model
app.listen(PORT, async () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`)

  // Test database connection on startup
  try {
    await pool.query('SELECT NOW()')
    // eslint-disable-next-line no-console
    console.log('✅ Database connected')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Database connection failed:', error)
  }

  // eslint-disable-next-line no-console
  console.log('Warming up sentiment analysis model...')
  warmupSentiment()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Sentiment model ready')
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error('⚠️  Failed to warm up sentiment model:', error)
    })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, closing database connection...')
  await pool.end()
  process.exit(0)
})

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, closing database connection...')
  await pool.end()
  process.exit(0)
})
