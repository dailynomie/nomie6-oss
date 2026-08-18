<script lang="ts">
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { Lang } from '../../store/lang'

  export let id: string
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button
          clear
          primary
          on:click={() => {
            closeModal(id)
          }}
        >
          {Lang.t('general.close', 'Close')}
        </Button>
      </div>
      <h2 class="ntitle">🚀 Version Update</h2>
    </ToolbarGrid>
  </header>

  <div class="p-6 text-gray-800 dark:text-gray-200 space-y-5">
    <div class="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 p-4 rounded-lg border-l-4 border-purple-500">
      <p class="text-base font-semibold text-purple-900 dark:text-purple-100 mb-2">✨ Exciting New Features Coming!</p>
      <p class="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
        A new version of the app will soon be deployed with major enhancements and new capabilities!
      </p>
    </div>

    <div class="space-y-2">
      <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">🎯 What's New:</p>
      <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
        <li><strong>🤖 AI Integration</strong> — Intelligent insights powered by Claude</li>
        <li><strong>📋 Complete Template Builder</strong> — Design and share custom templates</li>
        <li><strong>🧩 Blockly Integration</strong> — Visual programming for automations</li>
        <li><strong>📊 Data Management Enhancements</strong> — Better control over your data</li>
        <li><strong>📈 Enhanced Widgets</strong> — Including new 2nd axis support</li>
        <li><strong>🐛 Bug Fixes & Performance</strong> — Many improvements under the hood</li>
      </ul>
    </div>

    <div class="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 rounded text-sm">
      <p class="font-semibold text-blue-900 dark:text-blue-100 mb-2">💾 Before Migration:</p>
      <p class="text-blue-800 dark:text-blue-200 text-xs mb-2">Migration should be seamless, but we urge you to take regular backups:</p>
      <ul class="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside text-xs">
        <li>Export your data before the update</li>
        <li>Keep backups in a safe location</li>
        <li>In case unforeseen issues occur</li>
      </ul>
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
      You'll see this message again in 2 days.
    </p>
  </div>
</BackdropModal>
