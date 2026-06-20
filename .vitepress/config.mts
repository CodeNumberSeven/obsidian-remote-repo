import { defineConfig } from 'vitepress'
import { BiDirectionalLinks } from '@nolebase/markdown-it-bi-directional-links'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "my repo",
  description: "notebooks",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  },
  
  markdown: {
    config: (md) => {
      // 启用专门适配 Obsidian 的纯 JS 双链插件
      md.use(BiDirectionalLinks({
        dir: process.cwd(), // 指向你当前的笔记库根目录
      }))
    }
  }
})



  
