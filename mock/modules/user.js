// mock/modules/user.js
export default [
  {
    url: '/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body
      if (username === 'admin' && password === '123456') {
        return {
          code: 200,
          data: {
            token: 'mock-token-admin'
          },
          message: '登录成功'
        }
      }
      return {
        code: 500,
        message: '用户名或密码错误'
      }
    }
  },
  {
    url: '/user/info',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          username: 'admin',
          roles: ['admin'],
          permissions: ['*:*:*'],
          avatar: 'https://avatars.githubusercontent.com/u/1?v=4'
        },
        message: 'success'
      }
    }
  },
  {
    url: '/logout',
    method: 'post',
    response: () => {
      return {
        code: 200,
        message: '退出成功'
      }
    }
  }
]
