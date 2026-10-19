const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.API_PORT || 5002

// Listen on this machine only, unless API_HOST says otherwise
const HOST = process.env.API_HOST || '127.0.0.1'

// Only these origins may call the proxy. Set ALLOWED_ORIGINS to a comma-separated list to change it.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5001,http://localhost:5003')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

// Log the route, the status and the duration only. Never the request body or the API key.
const logRequest = (route, status, startedAt) => {
  console.log(`${route} ${status} ${Date.now() - startedAt}ms`)
}

// Non-streaming AI endpoint
app.post('/api/ai', async (req, res) => {
  const startedAt = Date.now()
  try {
    const { model, max_tokens, system, messages, apiKey } = req.body

    if (!apiKey) {
      logRequest('/api/ai', 400, startedAt)
      return res.status(400).json({ error: 'API key is required' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model, max_tokens, system, messages })
    })

    if (!response.ok) {
      const error = await response.text()
      logRequest('/api/ai', response.status, startedAt)
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    logRequest('/api/ai', 200, startedAt)
    res.json(data)
  } catch (error) {
    console.error('/api/ai failed:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Streaming AI endpoint
app.post('/api/ai/stream', async (req, res) => {
  const startedAt = Date.now()
  try {
    const { model, max_tokens, system, messages, apiKey } = req.body

    if (!apiKey) {
      logRequest('/api/ai/stream', 400, startedAt)
      return res.status(400).json({ error: 'API key is required' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system,
        messages,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      logRequest('/api/ai/stream', response.status, startedAt)
      return res.status(response.status).json({ error })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Stream the response body to the client
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        res.write(chunk)
      }
      logRequest('/api/ai/stream', 200, startedAt)
      res.end()
    } catch (error) {
      console.error('/api/ai/stream interrupted:', error.message)
      res.end()
    }
  } catch (error) {
    console.error('/api/ai/stream failed:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, HOST, () => {
  console.log(`AI API server running on http://${HOST}:${PORT}`)
})
