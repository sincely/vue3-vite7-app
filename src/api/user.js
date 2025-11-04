import request from '@/utils/request'

// 登录
export const login = (data) => {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

// 退出登录
export const logout = () => {
  return request({
    url: '/logout',
    method: 'post'
  })
}
