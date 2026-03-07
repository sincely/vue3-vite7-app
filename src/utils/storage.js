const storage = {
  /**
   * set 存储方法
   * @ param {String} key键
   * @ param {String} value值，
   * @ param {String} expired 过期时间，以毫秒为单位，非必须
   */
  set(key, val, expired) {
    const obj = {
      data: val,
      time: Date.now(),
      expired
    }
    localStorage.setItem(key, JSON.stringify(obj))
  },

  /**
   * set 获取方法
   * @ param {String} key键
   */
  get(key) {
    let val = localStorage.getItem(key)
    if (!val) {
      return val
    }
    val = JSON.parse(val)
    if (Date.now() - val.time > val.expired) {
      localStorage.removeItem(key)
      return null
    }

    return val.data
  },

  /**
   * remove 刪除方法
   * @ param {String} key键
   */
  remove(key) {
    localStorage.removeItem(key)
  },

  /**
   * remove 清除所有缓存
   * @ param {String} key键
   */
  removeAll() {
    localStorage.clear()
  }
}
export default storage
