import 'dayjs/locale/zh-cn'

import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import relativeTime from 'dayjs/plugin/relativeTime'
import weekday from 'dayjs/plugin/weekday'

// 设置语言
dayjs.locale('zh-cn')

// 加载插件
dayjs.extend(relativeTime)
dayjs.extend(weekday)
dayjs.extend(localeData)

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(date).format(format)
}

/**
 * 相对时间
 * @param date 日期
 * @param withoutSuffix 是否不带后缀
 */
export function fromNow(date, withoutSuffix = false) {
  return dayjs(date).fromNow(withoutSuffix)
}

/**
 * 两个日期之间的差异
 * @param date1 日期1
 * @param date2 日期2
 * @param unit 单位
 */
export function diff(date1, date2, unit = 'day') {
  return dayjs(date1).diff(dayjs(date2), unit)
}

/**
 * 获取一天的开始时间
 * @param date 日期
 */
export function startOfDay(date) {
  return dayjs(date).startOf('day').toDate()
}

/**
 * 获取一天的结束时间
 * @param date 日期
 */
export function endOfDay(date) {
  return dayjs(date).endOf('day').toDate()
}

export default dayjs
