import nid from '../../../modules/nid/nid'
import { WidgetDate } from './widget-date-class'
import type { WidgetDateConfig } from './widget-date-class'
import { Lang } from '../../../store/lang'
import { getDateFormats } from '../../preferences/Preferences'

export type WidgetTimeFrameConfig = {
  id?: TimeFramesType
  label?: string
  start?: WidgetDateConfig
  end?: WidgetDateConfig
  dayCount?: number
}

export class WidgetTimeFrame {
  id?: string
  label?: string
  start: WidgetDate
  end: WidgetDate

  constructor(payload: WidgetTimeFrameConfig = {}) {
    this.label = payload.label
    this.start = new WidgetDate(payload.start)
    this.end = new WidgetDate(payload.end)
    this.id = payload.id || nid()
  }

  /**
   * Get Time Frame Label
   * @returns
   */
  public getLabel(): string {
    let defaultDate = this.start.date
      ? `${this.start.date.format(getDateFormats().shortDate)} to ${this.end.date.format(getDateFormats().shortDate)}`
      : Lang.t('dashboard.unknown', 'Unknown')
    return this.label || defaultDate
  }
}

/**
 * Time Frames Types
 * These are the timeframes that are available for a widget
 */
export type TimeFramesType =
  | 'today'
  | 'yesterday'
  | 'last-7'
  | 'last-30'
  | 'last-90'
  | 'last-365'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'this-year'
  | 'last-month'
  | string

/**
 * Actual Time Frames
 * This allows you to create diffferent time frames by using dayjs
 * properties.
 */
export const timeFrames: Array<WidgetTimeFrameConfig> = [
  {
    id: 'today',
    dayCount: 0,
    label: Lang.t('dashboard.today', 'Today'),
    start: {
      startOf: 'day',
    },
    end: {
      endOf: 'day',
    },
  },
  {
    id: 'yesterday',
    dayCount: 1,
    label: Lang.t('dashboard.yesterday', 'Yesterday'),
    start: {
      subtract: [1, 'day'],
      startOf: 'day',
    },
    end: {
      subtract: [1, 'day'],
      endOf: 'day',
    },
  },
  {
    id: 'last-7',
    label: Lang.t('dashboard.last-7-days', 'Last 7 days'),
    dayCount: 7,
    start: {
      subtract: [6, 'day'],
      startOf: 'day',
    },
    end: {
      endOf: 'day',
    },
  },
  {
    id: 'last-30',
    label: Lang.t('dashboard.last-30-days', 'Last 30 days'),
    dayCount: 30,
    start: {
      subtract: [29, 'day'],
      startOf: 'day',
    },
    end: {
      endOf: 'day',
    },
  },
  {
    id: 'last-90',
    label: Lang.t('dashboard.last-90-days', 'Last 90 days'),
    dayCount: 90,
    start: {
      subtract: [89, 'day'],
      startOf: 'day',
    },
    end: {
      endOf: 'day',
    },
  },
  {
    id: 'last-365',
    label: Lang.t('dashboard.last-365-days', 'Last 365 days'),
    dayCount: 365,
    start: {
      subtract: [365, 'day'],
      startOf: 'day',
    },
    end: {
      endOf: 'day',
    },
  },
  {
    id: 'this-week',
    dayCount: 7,
    label: Lang.t('dashboard.this-week', 'This Week'),
    start: {
      startOf: 'week',
    },
    end: {
      endOf: 'week',
    },
  },
  {
    id: 'last-week',
    dayCount: 7,
    label: Lang.t('dashboard.last-week', 'Last Week'),
    start: {
      subtract: [1, 'week'],
      startOf: 'week',
    },
    end: {
      subtract: [1, 'week'],
      endOf: 'week',
    },
  },
  {
    id: 'this-month',
    dayCount: 30,
    label: Lang.t('dashboard.this-month', 'This Month'),
    start: {
      startOf: 'month',
    },
    end: {
      endOf: 'month',
    },
  },
  {
    id: 'this-year',
    dayCount: 365,
    label: Lang.t('dashboard.this-year', 'This Year'),
    start: {
      startOf: 'year',
    },
    end: {
      endOf: 'year',
    },
  },
  {
    id: 'last-month',
    dayCount: 30,
    label: Lang.t('dashboard.last-month', 'Last Month'),
    start: {
      subtract: [1, 'month'],
      startOf: 'month',
    },
    end: {
      subtract: [1, 'month'],
      endOf: 'month',
    },
  },
]
