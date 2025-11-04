const proxyServer = {
  // api地址匹配的字符串，可以使用正则，此处表示以/api为开头的接口地址都会被代理
  '/api': {
    target: 'http://localhost:3000', // 指向，表示上述需要匹配的地址都指向这个域名，注意要用/结尾
    changeOrigin: true, // 是否修改请求头的origin，让服务器认为这个请求来自本域名
    rewrite: (path) => path.replace(/^\/api/, '') // 如果匹配字符不需要了，可以使用重写去掉
  }
  // 字符串简写写法
  // '/foo': 'http://localhost:4567',
  // 选项写法
  // '/api': {
  //   target: 'http://jsonplaceholder.typicode.com',
  //   changeOrigin: true,
  //   rewrite: (path) => path.replace(/^\/api/, '')
  // },
  // 正则表达式写法
  // '^/fallback/.*': {
  //   target: 'http://jsonplaceholder.typicode.com',
  //   changeOrigin: true,
  //   rewrite: (path) => path.replace(/^\/fallback/, '')
  // },
  // 使用 proxy 实例
  // '/api': {
  //   target: 'http://jsonplaceholder.typicode.com',
  //   changeOrigin: true,
  //   configure: (proxy, options) => {
  //     // proxy 是 'http-proxy' 的实例
  //   }
  // },
  // Proxying websockets or socket.io
  // '/socket.io': {
  //   target: 'ws://localhost:3000',
  //   ws: true
  // }
}

export { proxyServer }
