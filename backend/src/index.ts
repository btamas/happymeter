import express from 'express'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`)
})
