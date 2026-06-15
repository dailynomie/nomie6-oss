<svelte:options runes={true} />

<script lang="ts">
  import { streamQuery, aiState } from './engine.svelte'
  import type { AIResponse } from './profiles/types'
  import dayjs from 'dayjs'

  interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    loading?: boolean
  }

  let messages = $state<ChatMessage[]>([])
  let inputText = $state('')
  let scrollContainer: HTMLElement | null = null

  function scrollToBottom() {
    if (scrollContainer) {
      // Multiple timing attempts to ensure scroll happens
      scrollContainer.scrollTop = scrollContainer.scrollHeight

      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })

      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }, 50)
    }
  }

  $effect(() => {
    // Trigger on messages length change
    messages.length
    scrollToBottom()
  })

  async function sendMessage() {
    if (!inputText.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date()
    }

    messages.push(userMessage)
    inputText = ''

    const assistantMessageId = `msg-${Date.now() + 1}`
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    }

    messages.push(assistantMessage)

    try {
      let fullResponse = ''
      const messageIndex = messages.length - 1

      // Build conversation history from previous messages (excluding the current loading message)
      const conversationHistory = messages.slice(0, -1).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

      await streamQuery(
        {
          profile: 'chat',
          prompt: userMessage.content
        },
        (chunk) => {
          fullResponse += chunk
          // Update the message in the array directly and reassign to trigger reactivity
          messages[messageIndex].content = fullResponse
          messages[messageIndex].loading = false
          messages = messages
        },
        conversationHistory
      )
    } catch (err) {
      const messageIndex = messages.length - 1
      messages[messageIndex].content = `Error: ${(err as Error).message}`
      messages[messageIndex].loading = false
      messages = messages
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
</script>

<div class="flex flex-col h-full">
  <!-- Messages Container -->
  <div bind:this={scrollContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
    {#if messages.length === 0}
      <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
        <div>
          <p class="text-2xl mb-2">💬</p>
          <p class="font-semibold">Start a conversation</p>
          <p class="text-sm">Ask Claude about your tracking data, goals, and insights</p>
        </div>
      </div>
    {/if}

    {#each messages as message (message.id)}
      <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
          class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
            message.role === 'user'
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          {#if message.loading}
            <div class="flex items-center gap-2">
              <span class="animate-pulse">●●●</span>
            </div>
          {:else}
            <p class="text-sm leading-relaxed">{message.content}</p>
          {/if}
          <p class={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {dayjs(message.timestamp).format('HH:mm')}
          </p>
        </div>
      </div>
    {/each}
  </div>

  <!-- Input Container -->
  <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
    <div class="flex gap-2 items-end">
      <textarea
        bind:value={inputText}
        on:keydown={handleKeydown}
        placeholder="Ask about your tracking data..."
        disabled={aiState.loading}
        class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        rows={1}
      />
      <button
        on:click={sendMessage}
        disabled={!inputText.trim() || aiState.loading}
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        {aiState.loading ? '⏳' : '📤'}
      </button>
    </div>
    {#if aiState.error}
      <p class="text-red-500 dark:text-red-400 text-xs mt-2">{aiState.error}</p>
    {/if}
  </div>
</div>

<style>
  textarea {
    max-height: 120px;
  }
</style>
