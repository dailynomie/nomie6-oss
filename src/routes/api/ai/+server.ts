import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { ANTHROPIC_API_KEY } from '$env/static/private'

export const POST: RequestHandler = async ({ request }) => {
  if (!ANTHROPIC_API_KEY) {
    return json(
      { error: 'AI service not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return json(
        { error: 'AI service error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return json(data)
  } catch (err) {
    console.error('AI endpoint error:', err)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
