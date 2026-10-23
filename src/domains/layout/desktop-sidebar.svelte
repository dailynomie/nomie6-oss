<svelte:options runes={true} />

<script lang="ts">
  import EaselOutline from '../../n-icons/EaselOutline.svelte'

  import RibbonOutline from '../../n-icons/RibbonOutline.svelte'
  import FlaskOutline from '../../n-icons/FlaskOutline.svelte'

  import IonIcon from '../../components/icon/ion-icon.svelte'
  import FeatureBadge from '../../components/advanced-badge/feature-badge.svelte'
  import { openUnisearch } from '../../domains/search/UnisearchStore'

  import CalendarOutline from '../../n-icons/CalendarOutline.svelte'
  import { Lang } from '../../store/lang'

  import AppsOutline from '../../n-icons/AppsOutline.svelte'
  import AppsSolid from '../../n-icons/AppsSolid.svelte'
  //import BarChartSolid from '../../n-icons/BarChartSolid.svelte'
  //import BarChartOutline from '../../n-icons/BarChartOutline.svelte'
  import CubeOutline from '../../n-icons/CubeOutline.svelte'
  import CubeSolid from '../../n-icons/CubeSolid.svelte'

  import QRCode from '../../n-icons/QRCode.svelte'
  import QRCodeSolid from '../../n-icons/QRCodeSolid.svelte'
  import EaselSolid from '../../n-icons/EaselSolid.svelte'
  import RibbonSolid from '../../n-icons/RibbonSolid.svelte'
  import CalendarSolid from '../../n-icons/CalendarSolid.svelte'

  import { navigate } from '../../vendor/svelte-navigator'
  import { Device } from '../../store/device-store'
  import SearchIcon from '../../n-icons/SearchIcon.svelte'
  import Dot from '../../components/dot/dot.svelte'
  import { RunningTimers } from '../tracker/TrackerStore'

  import { Prefs } from '../preferences/Preferences'
  import { FeatureVisible, type FeatureId } from '../preferences/features'

  import { GoalScoreStore } from '../goals/GoalStore'

  import LetterTicker from '../../components/letter-ticker/letter-ticker.svelte'
  import MenuOutline from '../../n-icons/MenuOutline.svelte'

  import Badge from '../../components/badge/badge.svelte'
  import CalendarNumberSolid from '../../n-icons/CalendarNumberSolid.svelte'
  import CalendarNumberOutline from './../../n-icons/CalendarNumberOutline.svelte'

  const { loggedIn = false } = $props<{ loggedIn?: boolean }>()

  let goalPercentage: number | undefined = $state(undefined)
  let isDarkMode = $state(false)

  $effect(() => {
    isDarkMode = document.documentElement.classList.contains('mode-dark')

    const observer = new MutationObserver(() => {
      isDarkMode = document.documentElement.classList.contains('mode-dark')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  })

  type NavType = {
    id: string
    path: string
    feature?: FeatureId
    title: string
    icon: any
    activeIcon: any
    right?: {
      props: any
      component: any
    }
  }

  $effect(() => {
    if ($GoalScoreStore[1]) {
      const _goalPercent = Math.round(($GoalScoreStore[0] / $GoalScoreStore[1]) * 100)
      if (!isNaN(_goalPercent)) {
        goalPercentage = _goalPercent
      }
    }
  })

  const navigation: Array<NavType> = [
    {
      id: 'track',
      path: '/track',
      title: Lang.t('tabs.track', 'Track'),
      icon: AppsOutline,
      activeIcon: AppsSolid,
    },
    {
      id: 'timeline',
      path: '/timeline',
      title: Lang.t('tabs.timeline', 'Timeline'),
      icon: CalendarOutline,
      activeIcon: CalendarSolid,
    },
    {
      id: 'history',
      path: '/history',
      title: Lang.t('tabs.on-this-day', 'On This Day'),
      icon: CalendarNumberOutline,
      activeIcon: CalendarNumberSolid,
    },
    {
      id: 'dashboard',
      path: '/dashboard',
      title: Lang.t('tabs.dashboard-full', 'Dashboard'),
      icon: EaselOutline,
      activeIcon: EaselSolid,
    },
    {
      id: 'goals',
      path: '/goals',
      title: Lang.t('tabs.goals', 'Goals'),
      icon: RibbonOutline,
      activeIcon: RibbonSolid,
    },
    {
      id: 'experiments',
      path: '/experiments',
      title: Lang.t('tabs.experiments', 'Experiments'),
      icon: FlaskOutline,
      activeIcon: FlaskOutline,
    },
    {
      id: 'analytics',
      feature: 'analytics',
      path: '/analytics',
      title: Lang.t('tabs.analytics', 'Analytics'),
      icon: CubeOutline,
      activeIcon: CubeSolid,
    },
    // {
    //   id: 'afternomie',
    //   path: '/afternomie',
    //   title: Lang.t('tabs.afternomie', 'AfterNomie'),
    //   icon: QRCode,
    //   activeIcon: QRCodeSolid,
    // },
    {
      id: 'blockly',
      feature: 'blockly',
      path: '/nomie-blockly',
      title: Lang.t('layout.nomie-blockly', 'Nomie Blockly'),
      icon: QRCode,
      activeIcon: QRCodeSolid,
    },
    // {
    //   id: 'awards',
    //   path: '/awards',
    //   title: Lang.t('tabs.awards', 'Awards'),
    //   icon: TrophyOutline,
    //   activeIcon: TrophySolid,
    // },
    {
      id: 'settings',
      path: '/settings',
      title: Lang.t('tabs.more', 'More'),
      icon: MenuOutline,
      activeIcon: MenuOutline,
    },
  ]
</script>

<aside
  class="desktop-sidebar px-4 z-50 not-printable"
  role="menu"
  aria-hidden="false"
  title={Lang.t('layout.nomie-navigation', 'Nomie Navigation')}
>
  <div class="logo-container">
    {#if loggedIn}
      <img
        src={isDarkMode ? '/images/nomie-splash-dark.svg' : '/images/nomie-splash-light.svg'}
        alt="Nomie"
        class="nomie-logo"
      />
      <!-- <Logo size={22} className="-mt-2" /> -->
    {/if}
  </div>

  {#if loggedIn}
    {#each navigation.filter((item) => !item.feature || $FeatureVisible(item.feature)) as item}
      <a
        role="menuitem"
        href={item.path}
        on:click|preventDefault|stopPropagation={() => {
          navigate(item.path)
        }}
        class="nav-item ntitle {window.location.pathname == item.path ? 'current' : ''} {window.location.pathname ==
          '/' && item.id == 'track'
          ? 'current'
          : ''}"
      >
        {#if item.path == '/' && $RunningTimers.length}
          <Dot size={8} className="absolute animate-pulse top-1 bg-ios-tint ml-2" />
        {/if}

        <span class="adv-corner">
          <IonIcon icon={item.icon} className="inactive" />
          <IonIcon icon={item.activeIcon} className="active" />
          <FeatureBadge feature={item.feature} />
        </span>

        <div class="mr-2 link-title">
          {item.title}
        </div>
        {#if item.path == '/goals'}
          {#if goalPercentage}
            <Badge
              className={`${
                /* iOS look: the progress badge is a soft token: good, tint, or danger text on the card fill (4.5:1) */
                goalPercentage > 80
                  ? 'bg-ios-goodsoft text-ios-good'
                  : goalPercentage > 49
                    ? 'bg-ios-tintsoft text-ios-tint'
                    : 'bg-ios-card2 text-ios-danger'
              }`}><LetterTicker text={`${goalPercentage}%`} /></Badge
            >
          {/if}
        {/if}
      </a>
    {/each}
    <div class="filler" />

    {#if Device.isDesktop()}
      <button
        on:click={() => {
          openUnisearch()
        }}
        class="focus:outline-none focus:ring-2 ring-ios-tint py-2 rounded-md flex items-center space-x-2 text-sm leading-tight px-4 text-left text-ios-label2 my-10"
      >
        <IonIcon icon={SearchIcon} />
        <span>{Lang.t('layout.super-search', 'Super Search')}</span>
      </button>
    {/if}
  {:else}
    <div class="text-ios-label2 px-4 h-full text-sm flex flex-col justify-center space-y-4">
      <!-- <p class="font-bold text-ios-label ">Welcome to Nomie 6!</p>
      <p>
        Nomie was created to enable neurodivergent people keep track of and monitor their lives in whichever way they
        like. Nomie doesn't put you in a box; instead, it adapts to your needs while keeping your information private.
      </p> -->
    </div>
  {/if}
</aside>

<style lang="postcss" global>
  @media print {
    .not-printable {
      display: none;
    }
  }
  /* iOS look: the sidebar is a card with a hairline on its right edge, no shadow */
  .desktop-sidebar {
    background: var(--ios-card);
    border-right: 0.5px solid var(--ios-separator);
    box-shadow: none;
  }

  .desktop-sidebar .nav-item {
    @apply px-4 py-2;
    min-height: 44px;
    @apply mb-2;
    @apply flex items-center;
    @apply focus:ring-2 ring-inset ring-ios-tint;
    @apply outline-none;
    @apply rounded-lg;
    @apply duration-200 transition-all transform;
  }

  .desktop-sidebar .nav-item:active {
    @apply scale-95;
  }
  /* The crown badge sticks 6 px out of the icon box, so the label starts after it at any text size */
  .desktop-sidebar .nav-item .adv-corner {
    margin-right: 12px;
  }
  .desktop-sidebar .nav-item .ion-icon {
    /* @apply flex-grow-0 flex-shrink-0 flex items-center justify-center;
    @apply mr-4;
    @apply bg-ios-fill;
    @apply rounded-lg;
    @apply w-9 h-9; */
  }
  .desktop-sidebar .nav-item .ion-icon.inactive {
    @apply flex;
    color: var(--ios-label2);
  }
  .desktop-sidebar .nav-item:hover {
    background: var(--ios-fill);
  }
  .desktop-sidebar .nav-item .ion-icon.active {
    @apply hidden;
  }

  .desktop-sidebar .ion-icon {
    @apply mr-4;
  }

  .desktop-sidebar .nav-item.current {
    background: var(--ios-tint-soft);
    color: var(--ios-tint);
  }

  .desktop-sidebar .link-title {
    @apply text-base;
    @apply font-medium;
  }

  .desktop-sidebar .nav-item.current .ion-icon.inactive {
    @apply hidden;
  }
  .desktop-sidebar .nav-item.current .ion-icon.active {
    color: var(--ios-tint);
    @apply scale-105 transform;
    @apply flex;
  }

  .desktop-sidebar .nav-item svg {
    @apply h-5 w-5;
  }

  .desktop-sidebar {
    @apply w-56;
    @apply fixed top-0;
    @apply flex flex-col;
    @apply h-screen;
  }

  .logo-container {
    @apply mt-2 mb-1;
    /* Responsive height that maintains aspect ratio */
    height: auto;
    min-height: 5.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    /* Ensure logo always has priority and doesn't get crushed */
  }

  .nomie-logo {
    max-width: 100%;
    max-height: 5.25rem;
    height: auto;
    width: auto;
    display: block;
    object-fit: contain;
  }
</style>
