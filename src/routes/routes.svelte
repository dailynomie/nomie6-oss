<svelte:options runes={true} />

<script lang="ts">
  import { Router, Route } from '../vendor/svelte-navigator'
  import FileBrowser from '../domains/storage/file-browser/file-browser.svelte'
  // import DynamicPage from '../DynamicPage.svelte'
  // import Messages from './Messages.svelte'
  import Csv from './export/csv.svelte'

  // import Goals from './Goals.svelte'
  // import Track from './track.svelte'
  import { Prefs } from '../domains/preferences/Preferences'
  import RouteControl from './RouteControl.svelte'
  import FeatureGate from '../domains/preferences/feature-gate.svelte'
  import Dashboard from './dashboard.svelte'
  import Track from './track.svelte'
  import Timeline from './Timeline.svelte'
  import Goals from './Goals.svelte'
  import Experiments from './Experiments.svelte'
  import Analytics from './Analytics.svelte'
  import AfterNomie from './AfterNomie.svelte'
  import Tests from './tests/tests.svelte'
  import Uoms from './Uoms.svelte'
  import Awards from './Awards.svelte'
  import Language from './tests/language.svelte'
  import Faq from './faq.svelte'
  import History from './history.svelte'
  import Settings from './settings.svelte'
  import Export from './export.svelte'
  import Setup from './setup.svelte'
  import TestAi from './test-ai.svelte'
  import NomieBlockly from './nomie-blockly.svelte'
</script>

<Router>
  <RouteControl />
  <Route path="/">
    {#if $Prefs.startPage === 'track'}
      <!-- <Track /> -->
      <Track />
    {:else if $Prefs.startPage === 'dashboard'}
      <Dashboard />
    {:else if $Prefs.startPage === 'timeline'}
      <Timeline />
    {:else if $Prefs.startPage === 'history'}
      <Timeline />
    {:else if $Prefs.startPage === 'goals'}
      <Goals />
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
      <Analytics />
    </FeatureGate>
  </Route>
  <Route path="/afternomie">
    <FeatureGate feature="afternomie">
      <AfterNomie />
    </FeatureGate>
  </Route>
  <Route path="/nomie-blockly">
    <FeatureGate feature="blockly">
      <NomieBlockly />
    </FeatureGate>
  </Route>
  <Route path="/timeline">
    <Timeline />
  </Route>
  <Route path="/goals">
    <Goals />
  </Route>
  <Route path="/experiments">
    <Experiments />
  </Route>
  {#if import.meta.env.DEV}
    <Route path="/test">
      <Tests />
    </Route>
  {/if}

  <Route path="/uoms">
    <FeatureGate feature="uoms">
      <Uoms />
    </FeatureGate>
  </Route>
  <Route path="/awards">
    <Awards />
  </Route>

  <!-- Translation helpers: the Nomie language editor, reached at /lang -->
  <Route path="/lang">
    <Language />
  </Route>
  <Route path="/dashboard">
    <Dashboard />
  </Route>
  <Route path="/faq">
    <Faq />
  </Route>
  <Route path="/history">
    <History />
  </Route>
  <Route path="/history/:date">
    <History />
  </Route>

  <Route path="/settings">
    <Settings />
  </Route>
  <Route path="/settings/export">
    <Export />
  </Route>
  <Route path="/settings/export/csv">
    <FeatureGate feature="csv">
      <Csv />
    </FeatureGate>
  </Route>
  <Route path="/files">
    <FeatureGate feature="files">
      <FileBrowser />
    </FeatureGate>
  </Route>

  <Route path="/files/*path" let:params>
    <FeatureGate feature="files">
      <FileBrowser path={params.path} />
    </FeatureGate>
  </Route>
  <Route path="/setup">
    <Setup />
  </Route>
  {#if import.meta.env.DEV}
    <Route path="/test-ai">
      <TestAi />
    </Route>
  {/if}
</Router>
