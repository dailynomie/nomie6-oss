<svelte:options runes={true} />

<script lang="ts">
  import { Router, Route } from '../vendor/svelte-navigator'
  // import DynamicPage from '../DynamicPage.svelte'
  // import Messages from './Messages.svelte'

  // import Goals from './Goals.svelte'
  // import Track from './track.svelte'
  import { Prefs } from '../domains/preferences/Preferences'
  import RouteControl from './RouteControl.svelte'
  import LazyPage from './lazy-page.svelte'
  import FeatureGate from '../domains/preferences/feature-gate.svelte'
  import Track from './track.svelte'
  import Timeline from './Timeline.svelte'
</script>

<Router>
  <RouteControl />
  <Route path="/">
    {#if $Prefs.startPage === 'track'}
      <!-- <Track /> -->
      <Track />
    {:else if $Prefs.startPage === 'dashboard'}
      <LazyPage load={() => import('./dashboard.svelte')} />
    {:else if $Prefs.startPage === 'timeline'}
      <Timeline />
    {:else if $Prefs.startPage === 'history'}
      <Timeline />
    {:else if $Prefs.startPage === 'goals'}
      <LazyPage load={() => import('./Goals.svelte')} />
    {:else}
      <!-- <Track /> -->
      <Track />
    {/if}
  </Route>
  <Route path="/track">
    <!-- <Track /> -->
    <Track />
  </Route>
  <Route path="/analytics">
    <FeatureGate feature="analytics">
      <LazyPage load={() => import('./Analytics.svelte')} />
    </FeatureGate>
  </Route>
  <Route path="/afternomie">
    <FeatureGate feature="afternomie">
      <LazyPage load={() => import('./AfterNomie.svelte')} />
    </FeatureGate>
  </Route>
  <Route path="/nomie-blockly">
    <FeatureGate feature="blockly">
      <LazyPage load={() => import('./nomie-blockly.svelte')} />
    </FeatureGate>
  </Route>
  <Route path="/timeline">
    <Timeline />
  </Route>
  <Route path="/goals">
    <LazyPage load={() => import('./Goals.svelte')} />
  </Route>
  <Route path="/experiments">
    <LazyPage load={() => import('./Experiments.svelte')} />
  </Route>
  {#if import.meta.env.DEV}
    <Route path="/test">
      <LazyPage load={() => import('./tests/tests.svelte')} />
    </Route>
  {/if}

  <Route path="/uoms">
    <FeatureGate feature="uoms">
      <LazyPage load={() => import('./Uoms.svelte')} />
    </FeatureGate>
  </Route>
  <Route path="/awards">
    <LazyPage load={() => import('./Awards.svelte')} />
  </Route>

  <!-- Translation helpers: the Nomie language editor, reached at /lang -->
  <Route path="/lang">
    <LazyPage load={() => import('./tests/language.svelte')} />
  </Route>
  <Route path="/dashboard">
    <LazyPage load={() => import('./dashboard.svelte')} />
  </Route>
  <Route path="/faq">
    <LazyPage load={() => import('./faq.svelte')} />
  </Route>
  <Route path="/history">
    <LazyPage load={() => import('./history.svelte')} />
  </Route>
  <Route path="/history/:date">
    <LazyPage load={() => import('./history.svelte')} />
  </Route>

  <Route path="/settings">
    <LazyPage load={() => import('./settings.svelte')} />
  </Route>
  <Route path="/settings/export">
    <LazyPage load={() => import('./export.svelte')} />
  </Route>
  <Route path="/settings/export/csv">
    <FeatureGate feature="csv">
      <LazyPage load={() => import('./export/csv.svelte')} />
    </FeatureGate>
  </Route>
  <Route path="/files">
    <FeatureGate feature="files">
      <LazyPage load={() => import('../domains/storage/file-browser/file-browser.svelte')} />
    </FeatureGate>
  </Route>

  <Route path="/files/*path" let:params>
    <FeatureGate feature="files">
      <FileBrowser path={params.path} />
    </FeatureGate>
  </Route>
  <Route path="/setup">
    <LazyPage load={() => import('./setup.svelte')} />
  </Route>
  {#if import.meta.env.DEV}
    <Route path="/test-ai">
      <LazyPage load={() => import('./test-ai.svelte')} />
    </Route>
  {/if}
</Router>
