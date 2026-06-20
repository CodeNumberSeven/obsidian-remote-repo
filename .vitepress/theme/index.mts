// .vitepress/theme/index.mts
import DefaultTheme from 'vitepress/theme'
import PNJunction from './components/PNJunction.vue' // 导入你的新组件

export default {
  extends: DefaultTheme, // 继承默认主题
  enhanceApp({ app }) {
    // 核心魔法：将你的组件注册为全局通用
    app.component('PNJunction', PNJunction)
  }
}