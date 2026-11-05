import { defineConfig } from '@rspress/core';
import { pluginPinyinSearch } from 'rspress-plugin-pinyin-search';

/**
 * 部署到 GitHub Pages 时，仓库名会决定访问路径：
 *   https://<user>.github.io/<repo>/  ->  base 必须是 '/<repo>/'
 * 这里通过环境变量注入，本地开发仍然使用 '/'。
 */
const base = process.env.DOC_BASE ?? '/';

export default defineConfig({
  lang: 'zh',
  base,
  title: 'XiBin Docs',
  description: '技术笔记与文档：前端、后端、工程化、AI',
  icon: '/favicon.svg',
  logo: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
  },
  themeConfig: {
    lastUpdated: true,
    footer: {
      message:
        '<p>用 <a href="https://rspress.rs" target="_blank" rel="noreferrer">Rspress</a> 搭建 · 内容以 Markdown 维护</p>',
    },
    // 有仓库地址后打开，会在页面底部和右侧大纲显示「编辑此页」
    // editLink: {
    //   docRepoBaseUrl: 'https://github.com/<user>/<repo>/tree/main/docs',
    // },
  },
  search: {
    codeBlocks: true,
  },
  plugins: [pluginPinyinSearch()],
});