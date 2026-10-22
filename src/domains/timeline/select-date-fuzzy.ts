import dayjs, { Dayjs } from 'dayjs'

import { Interact } from '../../store/interact'
import { Lang } from '../../store/lang'

export const selectFuzzyDate = (startDate: Dayjs, isToday: boolean): Promise<Dayjs> => {
  let ranges: Array<any> = [
    {
      time: 30,
      title: Lang.t('timeline.1-month-back', '1 Month Back'),
      unit: 'day',
    },
    {
      time: 90,
      title: Lang.t('timeline.90-days-back', '90 Days Back'),
      unit: 'day',
    },
    {
      time: 180,
      title: Lang.t('timeline.6-months-back', '6 Months Back'),
      unit: 'day',
    },
    {
      time: 1,
      title: Lang.t('timeline.1-year-back', '1 Year Back'),
      unit: 'year',
    },
    {
      time: 2,
      title: Lang.t('timeline.2-years-back', '2 Years Back'),
      unit: 'year',
    },
    {
      time: -1,
      divider: true,
      title: `${Lang.t('general.select-date', 'Select Date')}...`,
      unit: 'day',
    },
  ]
  return new Promise((resolve) => {
    if (!isToday) {
      ranges.unshift({
        days: 0,
        divider: true,
        title: `${Lang.t('history.go-to-today', 'Go to Today')}`,
      })
    }

    Interact.popmenu({
      id: `select-date-fuzzy`,
      buttons: ranges.map((range) => {
        return {
          title: range.title,
          divider: range.divider ? true : false,
          click: async () => {
            if (range.time == -1) {
              let date = await Interact.selectDate()
              if (date) {
                resolve(dayjs(date))
              }
            } else if (range.time === undefined || range.time === 0) {
              resolve(dayjs(new Date()))
            } else {
              resolve(startDate.subtract(range.time || 0, range.unit || 'day'))
            }
          },
        }
      }),
    })
  })
}
