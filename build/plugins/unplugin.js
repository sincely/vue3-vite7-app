// 自动导入需要的模块
import AutoImport from 'unplugin-auto-import/vite'
// 自动导入 Element Plus 组件和样式，会自动根据代码中使用到的组件，从 Element Plus 中找到对应的组件并导入，然后将其注册为组件
// import ElementPlus from 'unplugin-element-plus/vite'
// 自动根据模板中使用到的图标名称，从已安装的图标集合中找到对应的图标并导入，然后将其注册为组件
import IconsResolver from 'unplugin-icons/resolver'
// 自动导入图标
import Icons from 'unplugin-icons/vite'
// Element Plus 组件解析器，用于解析 Element Plus 组件
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// 自动注册组件，无需手动导入和注册。它可以通过扫描项目中使用到的组件，自动生成相应的全局注册代码，从而实现自动注册的功能
import Components from 'unplugin-vue-components/vite'
export default function createVitePlugins() {
  // https://juejin.cn/post/7296335548772270119?searchId=202503211419052086D342D807A1165DCF
  // https://juejin.cn/post/7264952002706096164?searchId=202503211419052086D342D807A1165DCF
  return [
    Icons({ autoInstall: true, compiler: 'vue3' }),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'],
      include: [/\.[tj]sx?$/, /\.vue$/], // 匹配的文件，也就是哪些后缀的文件需要自动引入
      // 可以选择auto-import.d.ts生成的位置，使用ts建议设置为'src/auto-import.d.ts'
      dts: false, // 会在根目录生成auto-imports.d.ts，里面可以看到自动导入的api
      resolvers: [
        // element-plus主题色配置相关--下面这句importStyle一定要写，不要写个空对象在这儿，否则就会不生效
        ElementPlusResolver({
          // 自动引入修改主题色添加这一行，使用预处理样式，不添加将会导致使用ElMessage，ElNotification等组件时默认的主题色会覆盖自定义的主题色
          importStyle: 'sass'
        })
      ],
      // 根据项目情况配置eslintrc，默认是不开启的
      // 下面两个是其他配置，默认即可
      // 输出一份json文件，默认输出路径为./.eslintrc-auto-import.json
      eslintrc: {
        enabled: false,
        filepath: './.eslintrc-auto-import.json', // @default './.eslintrc-auto-import.json'
        globalsPropValue: true, // @default true 可设置 boolean | 'readonly' | 'readable' | 'writable' | 'writeable'
        dts: false // 配置文件生成位置,会在根目录生成./components.d.ts，里面可以看到自动导入的api
      }
    }),
    Components({
      dirs: ['src/components'], // 指定组件位置，默认是src/components
      // importStyle 指是否需要自动随引入加载对应的组件样式，我这里设置为 false，
      // 因为某些二级组件（比如 DateRangePicker）没办法准确地识别正确路径，他的搜寻路径都是按一级组件来写的，
      // 所以我改成了全量导入 css。resolveIcons 配置是否对 antd 的图标起作用。
      // 'css': 默认选项，按需引入组件的 CSS 样式文件。
      // 'scss': 按需引入组件的 Less 样式文件，这样可以在项目中自定义样式变量。
      //  false: 如果设置为 false，则不会自动引入样式文件，意味着你需要手动管理样式引入。
      // 配置 elementPlus 采用 sass 样式配色系统
      resolvers: [
        // element-plus主题色配置相关--下面这句importStyle一定要写，不要写个空对象在这儿，否则就会不生效
        ElementPlusResolver({ importStyle: 'sass' }),
        IconsResolver()
      ],
      extensions: ['vue'], // 指定扩展名，默认是.vue
      dts: false // 配置文件生成位置,会在根目录生成./components.d.ts，里面可以看到自动导入的api
    })
    //  按需定制主题
    // ElementPlus({
    //   //组件中文配置
    //   defaultLocale: 'zh-cn',
    //   useSource: true
    // })
  ]
}
