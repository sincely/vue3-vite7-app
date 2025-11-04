import Mock from 'mockjs'

import { ResultEnum } from '@/enums/httpEnum'

export function resultSuccess(result, { message = 'ok' } = {}) {
  return Mock.mock({
    code: ResultEnum.SUCCESS,
    result,
    message,
    type: 'success'
  })
}

export function resultPageSuccess(page, pageSize, list, { message = 'ok' } = {}) {
  const pageData = pagination(page, pageSize, list)

  return {
    ...resultSuccess({
      page,
      pageSize,
      pageCount: list.length,
      list: pageData
    }),
    message
  }
}

export function resultError(message = 'Request failed', { code = ResultEnum.ERROR, result = null } = {}) {
  return {
    code,
    result,
    message,
    type: 'error'
  }
}

export function pagination(pageNo, pageSize, array) {
  const offset = (pageNo - 1) * Number(pageSize)
  const ret =
    offset + Number(pageSize) >= array.length
      ? array.slice(offset, array.length)
      : array.slice(offset, offset + Number(pageSize))
  return ret
}

/**
 * @param {number} times 回调函数需要执行的次数
 * @param {Function} callback 回调函数
 */
export function doCustomTimes(times, callback) {
  let i = -1
  while (++i < times) {
    callback(i)
  }
}

/**
 * @description 本函数用于从request数据中获取token，请根据项目的实际情况修改
 *
 */
export function getRequestToken({ headers }) {
  return headers?.authorization
}
