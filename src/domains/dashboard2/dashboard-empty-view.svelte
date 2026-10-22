<svelte:options runes={true} />

<script lang="ts">
  import Empty from '../../components/empty/empty.svelte'

  import { Lang } from '../../store/lang'
  import { createNewWidget } from './widget/widget-editor/useWidgetEditorModal'
</script>

<Empty
  className="mt-6"
  title={Lang.t('dashboard.empty-dashboard', 'Empty Dashboard')}
  description={Lang.t(
    'dashboard.starter-message',
    'Mix and match charts, notes, and other widgets to create your own custom views of your life.'
  )}
/>
<!-- Phase 7: 'Add Widget' is the row below this message, so the message has no second button -->
