/**
 * OpenRouter.ai Service
 * Unified API for accessing multiple LLMs through OpenRouter
 */

interface OpenRouterMessage {
  role: 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
  }
}

export async function queryOpenRouter(
  apiKey: string,
  messages: OpenRouterMessage[],
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<string> {
  const {
    model = 'openai/gpt-3.5-turbo', // Default to GPT-3.5 Turbo for cost efficiency
    maxTokens = 1024,
    temperature = 0.7
  } = options

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nomie.dailynomie.com',
        'X-Title': 'Nomie - Personal Analytics'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData?.error?.message || 'Unknown error from OpenRouter'
      throw new Error(`OpenRouter API error (${response.status}): ${errorMessage}`)
    }

    const data: OpenRouterResponse = await response.json()

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenRouter API')
    }

    return data.choices[0].message.content
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('OpenRouter API call failed:', message)
    throw new Error(`Failed to query OpenRouter: ${message}`)
  }
}

export async function streamOpenRouter(
  apiKey: string,
  messages: OpenRouterMessage[],
  onChunk: (text: string) => void,
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<void> {
  const {
    model = 'openai/gpt-3.5-turbo',
    maxTokens = 1024,
    temperature = 0.7
  } = options

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nomie.dailynomie.com',
        'X-Title': 'Nomie - Personal Analytics'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData?.error?.message || 'Unknown error from OpenRouter'
      throw new Error(`OpenRouter API error (${response.status}): ${errorMessage}`)
    }

    if (!response.body) {
      throw new Error('No response body from OpenRouter')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6))
            const chunk = json.choices?.[0]?.delta?.content
            if (chunk) {
              onChunk(chunk)
            }
          } catch (e) {
            // Ignore JSON parse errors in streaming
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
      try {
        const json = JSON.parse(buffer.trim().slice(6))
        const chunk = json.choices?.[0]?.delta?.content
        if (chunk) {
          onChunk(chunk)
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('OpenRouter streaming failed:', message)
    throw new Error(`Failed to stream from OpenRouter: ${message}`)
  }
}
