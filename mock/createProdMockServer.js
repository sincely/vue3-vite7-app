import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'

import test from './modules/test' // 引入定义的mock模拟接口
const mockModules = [...test]
export function setupProdMockServer() {
  // 这个是用来注册mock的，当在生产中使用mock时，很重要
  createProdMockServer(mockModules)
}
