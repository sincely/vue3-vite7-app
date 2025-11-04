import legacy from '@vitejs/plugin-legacy'
// https://juejin.cn/post/7447106198498312218
export default function legacyPlugin() {
  return legacy({
    // targets: 指定需要支持的目标浏览器。支持Browserslist 配置语法
    // modernPolyfills: 可以手动指定要包括的 modernPolyfills。默认值：true
    // additionalLegacyPolyfills: 额外需要的 polyfills,例如，在上述配置中，我们添加了 regenerator-runtime/runtime，用于支持异步函式（async/await）。默认值：null
    // renderLegacyChunks: 决定是否生成单独的传统（Legacy）代码块。 如果设定为 true，插件将为每个输入文档额外生成一个兼容旧版浏览器的代码块。
    // polyfills: 自动注入需要的polyfills。默认值：true
    targets: ['chrome 52', 'Android > 39', 'iOS >= 10.3', 'iOS >= 10.3'], // 需要兼容的目标列表，可以设置多个
    modernPolyfills: true,
    additionalLegacyPolyfills: ['regenerator-runtime/runtime'] // 面向IE11时需要此插件
  })
}
