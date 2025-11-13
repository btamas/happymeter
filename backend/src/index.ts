import express from 'express'
import sentimentRouter from './routes/sentiment.js'
import { warmupSentiment } from './services/sentiment.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Sentiment analysis routes
app.use('/api', sentimentRouter)

// Start server and warm up sentiment model
app.listen(PORT, async () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`)

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
