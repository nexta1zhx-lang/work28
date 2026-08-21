module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/essential', 'eslint:recommended'],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false
  },
  rules: {
    'no-unused-vars': 'off',
    // 关闭多单词组件名规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'off',
    // 允许存在无法执行到的代码（取消报错）
    'no-unreachable': 'off',
    // 行首 `;[` 的 ASI 防御分号不再报错（no-extra-semi 会把它标为多余分号）
    'no-extra-semi': 'off'
    // 或者设置为警告而不是报错
    // 'vue/multi-word-component-names': 'warn',

    // 或者忽略特定组件名
    // 'vue/multi-word-component-names': ['error', {
    //   ignores: ['Dashboard', 'Login', 'Settings']
    // }]
  }
}
