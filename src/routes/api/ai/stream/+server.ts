import type { RequestHandler } from './$types'
import { ANTHROPIC_API_KEY } from '$env/static/private'

export const POST: RequestHandler = async ({ request }) => {
  if (!ANTHROPIC_API_KEY) {
    return new Response('AI service not configured', { status: 500 })
  }

  try {
    const body = await request.json()

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15'
      },
      body: JSON.stringify({ ...body, stream: true })
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      console.error('Anthropic streaming error:', err)
      return new Response('AI service error', { status: upstream.status })
    }

    return new Response(upstream.body, {
      headers: { 'Content-Type': 'text/event-stream' }
    })
  } catch (err) {
    console.error('Streaming endpoint error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
