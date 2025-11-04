import pluginJs from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginVue from 'eslint-plugin-vue'
import fs from 'fs'
import globals from 'globals'
import * as parserVue from 'vue-eslint-parser'
const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)))
const autoImports = loadJSON('./.eslintrc-auto-import.json')

export default [
  {
    ...pluginJs.configs.recommended,
    // 忽略特定文件和目录
    ignores: ['**/.*', 'dist/**/*', '*.d.ts', 'public/*', 'src/assets/**'],
    // 定义全局变量
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImports.globals
      }
    },
    // 插件配置
    plugins: {
      prettier: pluginPrettier,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      ...configPrettier.rules,
      ...pluginPrettier.configs.recommended.rules
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    },
    plugins: {
      vue: pluginVue
    },
    processor: pluginVue.processors['.vue'],
    rules: {
      /**
       *  eslint-config-prettier: 禁用所有与代码格式化相关的 ESLint 规则，避免 ESLint 和 Prettier 的规则冲突
       *  @description
       *  包含 "eslint-config-prettier" 的规则
       *  将 Prettier 的格式化规则集成到 ESLint 中，使得 Prettier 的格式化问题可以通过 ESLint 报告并修复。
       *  它会在 ESLint 运行时调用 Prettier 来检查代码格式，并将不符合 Prettier 规则的地方标记为 ESLint 错误或警告。
       */
      ...pluginVue.configs.base.rules,
      ...pluginVue.configs['vue3-essential'].rules,
      ...pluginVue.configs['vue3-recommended'].rules,
      // 要求组件名称总是多个单词
      'vue/multi-word-component-names': 0,
      // 强制每个组件应该在它自己的文件中
      'vue/one-component-per-file': 0
    }
  },
  // 自定义rules规则
  {
    rules: {
      // 要求使用 let 或 const 而不是 var
      'no-var': 'error',
      // 禁止使用 new 以避免产生副作用
      'no-new': 1,
      // 禁止变量声明与外层作用域的变量同名
      'no-shadow': 0,
      // 禁用 console
      'no-console': 0,
      // 禁止标识符中有悬空下划线
      'no-underscore-dangle': 0,
      // 禁止在可能与比较操作符相混淆的地方使用箭头函数
      'no-confusing-arrow': 0,
      // 禁用一元操作符 ++ 和 --
      'no-plusplus': 0,
      // 禁止对 function 的参数进行重新赋值
      'no-param-reassign': 0,
      // 禁用特定的语法
      'no-restricted-syntax': 0,
      // 禁止在变量定义之前使用它们
      'no-use-before-define': 0,
      // 禁止直接调用 Object.prototypes 的内置属性
      'no-prototype-builtins': 0,
      // 禁止可以在有更简单的可替代的表达式时使用三元操作符
      'no-unneeded-ternary': 'error',
      // 禁止重复模块导入
      'no-duplicate-imports': 'error',
      // 禁止在对象中使用不必要的计算属性
      'no-useless-computed-key': 'error',
      // 禁止不必要的转义字符
      'no-useless-escape': 0,
      // 禁用 continue 语句
      'no-continue': 0,
      // 强制使用一致的缩进
      indent: ['error', 2, { SwitchCase: 1 }],
      // 强制使用骆驼拼写法命名约定
      camelcase: 0,
      // 强制类方法使用 this
      'class-methods-use-this': 0,
      // 要求构造函数首字母大写
      'new-cap': 0,
      // 强制一致地使用 function 声明或表达式
      'func-style': 0,
      // 强制一行的最大长度
      'max-len': 0,
      // 强制在注释中使用一致的空格
      'spaced-comment': 'warn',
      // 要求 return 语句要么总是指定返回的值，要么不指定
      'consistent-return': 0,
      // 强制switch要有default分支
      'default-case': 2,
      // 强制剩余和扩展运算符及其表达式之间有空格
      'rest-spread-spacing': 'error',
      // 要求使用 const 声明那些声明后不再被修改的变量
      'prefer-const': 'error',
      // 强制箭头函数的箭头前后使用一致的空格
      'arrow-spacing': 'error',
      // 只强制对象解构，不强制数组解构
      'prefer-destructuring': ['error', { object: true, array: false }]
    }
  },
  // 忽略文件
  {
    ignores: [
      '**/dist',
      './src/main.ts',
      '.vscode',
      '.idea',
      '.d.ts',
      '*.sh',
      '**/node_modules',
      '*.md',
      '*.woff',
      '*.woff',
      '*.ttf',
      'yarn.lock',
      'package-lock.json',
      'pnpm-lock.yaml',
      '.local',
      '/public',
      '/docs',
      '**/output',
      '.husky',
      '.local',
      '/bin',
      '/src/assets',
      '/src/icons',
      'Dockerfile'
    ]
  }
]
