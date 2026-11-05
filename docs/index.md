---
pageType: home

hero:
  name: XiBin Docs
  text: 把散落的技术笔记，收拢成一个站点
  tagline: 前端 · 后端 · 工程化 · AI —— 用 Markdown 写，用 Rspress 发
  actions:
    - theme: brand
      text: 开始阅读
      link: /notes/
    - theme: alt
      text: 怎么写文档
      link: /guide/
  image:
    src: /favicon.svg
    alt: XiBin Docs

features:
  - title: 毫秒级启动
    details: 基于 Rsbuild / Rspack 的 Rust 工具链，改了 Markdown 立刻看到效果，写文档不打断思路。
    icon: ⚡️
    link: /guide/writing
  - title: 中文全文搜索
    details: 构建时自动生成搜索索引，内置拼音全拼与首字母搜索，中文内容也能搜得准。
    icon: 🔍
    link: /guide/writing
  - title: MDX 组件能力
    details: 在 Markdown 里直接写 Tabs、Steps、Callout 等组件，复杂文档也能排版得干净。
    icon: 🧩
    link: /guide/mdx
  - title: 静态导出
    details: 构建为纯静态 HTML，可部署到 GitHub Pages、Vercel、Netlify，零运维成本。
    icon: 🚀
    link: /guide/deploy
  - title: AI 友好
    details: 自动生成 llms.txt 与 Markdown 版本，方便大模型读取与索引，文档一次写好多处复用。
    icon: 🤖
    link: /guide/deploy
  - title: 深浅色与 i18n
    details: 内置明暗主题、多语言、多版本与大纲导航，后续扩展不用重做一遍。
    icon: 🎨
    link: /guide/writing
---