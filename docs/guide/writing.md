# 怎么写这个文档站

这个站点是「文件即页面」：`docs/` 目录下的每个 `.md` 文件都会变成一个 URL。

## 目录约定

```text
docs
├── _nav.json            顶部导航
├── index.md             首页（frontmatter 里 pageType: home）
├── notes/               技术笔记
│   ├── _meta.json       这一栏的侧边栏顺序
│   ├── frontend/
│   │   ├── _meta.json
│   │   └── react-render-patterns.md   ->  /notes/frontend/react-render-patterns
│   └── reverse/
│       ├── _meta.json
│       └── pe-basics.md               ->  /notes/reverse/pe-basics
└── guide/               本指南
```

## 新增一篇笔记

以「前端 → 性能优化」为例：

1. 在 `docs/notes/frontend/` 下新建 `web-vitals.md`；
2. 在第一行写标题 `# Web Vitals 实战`；
3. 把文件名加进同目录的 `_meta.json`：

```json
[
  "react-render-patterns",
  "css-layout-tricks",
  "web-vitals"
]
```

:::tip 侧边栏文字从哪来

`_meta.json` 里写字符串时，侧边栏显示的是文件里的 `# 一级标题`。
想自定义文字就写成对象：`{ "type": "file", "name": "web-vitals", "label": "Web Vitals" }`。

:::

## 新增一个栏目

比如想加「运维」：

1. 建目录 `docs/notes/ops/`，放 `_meta.json` 和内容；
2. 在 `docs/notes/_meta.json` 里加一项：

```json
{ "type": "dir-section-header", "name": "ops", "label": "运维" }
```

## Frontmatter 常用字段

```md
---
title: 自定义页面标题
description: 这句会进搜索索引和页面 meta
sidebar: false        # 不在侧边栏出现
search: false         # 不进搜索索引
---
```

## 本地预览

```bash
pnpm dev
```

改文件即时刷新，不用重启。