import {
  BarChartSolid,
  CalendarOutline,
  ChatboxOutline,
  HighLowIcon,
  MapOutline,
  PieChartOutline,
  PulseOutline,
  SparklesOutline,
  TextOutline,
  ThermometerIcon,
  TagOutline,
} from '../../../components/icon/nicons'
import CheckmarkCircleOutlineSvelte from '../../../n-icons/CheckmarkCircleOutline.svelte'
import type { PluginClass } from '../../plugins/plugin-helpers'
import { getRawPrefs } from '../../preferences/Preferences'
import { isWidgetTypeVisible } from '../../preferences/experience'
import { Lang } from '../../../store/lang'

export type IWidgetTypeUnit = 'timeframe' | 'cond-style' | 'token' | 'tokens' | 'pointer'

export type IWidgetType = {
  id: string
  label: string
  requires: Array<IWidgetTypeUnit>
  optional: Array<IWidgetTypeUnit>
  image?: string
  icon?: any
  emoji?: string
  data?: any
}

export const getWidgetTypes = ($PluginStore: Array<PluginClass>): Array<IWidgetType> => {
  const allWidgetTypes = [...widgetTypes]
  $PluginStore
    .filter((p) => {
      return p.active && p.addToWidgets
    })
    .forEach((plugin: PluginClass) => {
      allWidgetTypes.push({
        id: `plugin`,
        label: plugin.name,
        requires: [],
        optional: [],
        emoji: plugin.emoji,
        data: {
          pluginId: plugin.id,
        },
      })
    })
  // Starter mode only offers the starter widget types. Existing widgets keep working.
  const prefs = getRawPrefs()
  return allWidgetTypes.filter((widgetType) => isWidgetTypeVisible(prefs, widgetType.id))
}

export const widgetTypes: Array<IWidgetType> = [
  {
    label: Lang.t('dashboard.display-value', 'Display Value'),
    id: 'value',
    requires: ['timeframe', 'token'],
    optional: ['cond-style'],
    image: '/images/widget-types/display-value.svg',
    icon: ThermometerIcon,
  },
  {
    label: Lang.t('dashboard.latest-note', 'Latest Note'),
    id: 'note',
    requires: ['timeframe', 'token'],
    optional: [],
    image: '/images/widget-types/latest-note.svg',
    icon: ChatboxOutline,
  },
  {
    label: Lang.t('dashboard.bar-chart', 'Bar Chart'),
    id: 'barchart',
    requires: ['timeframe', 'token'],
    optional: [],
    image: '/images/widget-types/bar-chart.svg',
    icon: BarChartSolid,
  },
  {
    label: Lang.t('dashboard.line-chart', 'Line Chart'),
    id: 'linechart',
    requires: ['timeframe', 'token'],
    optional: [],
    image: '/images/widget-types/line-chart.svg',
    icon: PulseOutline,
  },

  {
    label: Lang.t('dashboard.min-max', 'Min / Max'),
    id: 'min-max',
    requires: ['timeframe', 'token'],
    optional: [],
    image: '/images/widget-types/min-max.svg',
    icon: HighLowIcon,
  },
  {
    label: Lang.t('dashboard.map', 'Map'),
    id: 'map',
    requires: ['timeframe', 'token'],
    optional: [],
    image: '/images/widget-types/map.svg',
    icon: MapOutline,
  },
  {
    label: Lang.t('dashboard.todos', 'Todos'),
    id: 'todos',
    requires: ['timeframe'],
    optional: [],
    image: '/images/widget-types/latest-note.svg',
    icon: CheckmarkCircleOutlineSvelte,
  },
  {
    label: Lang.t('dashboard.habits', 'Habits'),
    id: 'habit',
    requires: ['timeframe', 'token'],
    optional: [],
    image: '/images/widget-types/display-value.svg',
    icon: PieChartOutline,
  },
  {
    label: Lang.t('dashboard.pointers', 'Pointers'),
    id: 'pointer',
    requires: ['timeframe', 'token', 'pointer'],
    optional: [],
    image: '/images/widget-types/display-value.svg',
    icon: TagOutline,
  },
  {
    label: Lang.t('dashboard.mind-body-spirit', 'Mind, Body, Spirit'),
    id: 'focus',
    requires: ['timeframe'],
    optional: [],
    image: '/images/widget-types/bar-chart.svg',
    icon: SparklesOutline,
  },

  // This is not complete
  // {
  //   label: "What Time",
  //   id: "what-time",
  //   requires: ["timeframe", "element"],
  //   optional: [],
  // },
  {
    label: Lang.t('dashboard.positivity-chart', 'Positivity Chart'),
    id: 'positivity',
    requires: ['timeframe'],
    // optional: ['token'],
    optional: [],
    image: '/images/widget-types/positivity-pie.svg',
    icon: BarChartSolid,
  },
  {
    label: Lang.t('dashboard.last-used', 'Last Used'),
    id: 'last-used',
    requires: ['token'],
    optional: ['cond-style'],
    image: '/images/widget-types/last-used.svg',
    icon: CalendarOutline,
  },
  {
    label: Lang.t('dashboard.just-text', 'Just Text'),
    id: 'text',
    requires: [],
    optional: [],
    image: '/images/widget-types/just-text.svg',
    icon: TextOutline,
  },
  {
    label: Lang.t('dashboard.nomie-insights', 'Nomie Insights'),
    id: 'insight',
    requires: ['timeframe'],
    optional: [],
    icon: SparklesOutline,
    emoji: '💡',
  },
  {
    label: Lang.t('dashboard.experiment', 'Experiment'),
    id: 'experiment',
    requires: [],
    optional: [],
    icon: PulseOutline,
    emoji: '🧪',
  },
]
