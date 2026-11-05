# XiBin Docs

基于 [Rspress 2](https://rspress.rs) 的个人技术文档站。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 http://localhost:5173 ，改 Markdown 会即时刷新。

## 目录结构

```text
.
├── docs/                 文档内容（每个 .md 就是一个页面）
│   ├── _nav.json         顶部导航
│   ├── index.md          首页
│   ├── notes/            技术笔记
│   ├── guide/            本站使用说明
│   └── public/           logo、favicon 等静态资源
├── theme/
│   ├── index.tsx         主题入口（目前只引样式）
│   └── index.css         品牌色、首页光晕、正文排版
├── rspress.config.ts     站点配置
└── .github/workflows/deploy.yml   GitHub Pages 自动部署
```

## 写一篇新笔记

1. 在对应目录（如 `docs/notes/frontend/`）新建 `xxx.md`，首行写 `# 标题`；
2. 把文件名加进同目录的 `_meta.json`（决定侧边栏顺序和是否显示）；
3. 保存即可。

详细说明见站点里的「写作指南」。

## 常用配置

| 想改什么 | 改哪里 |
| --- | --- |
| 站点标题 / 描述 / 图标 | `rspress.config.ts` |
| 品牌色、首页光晕、正文行距 | `theme/index.css` |
| 顶部导航 | `docs/_nav.json` |
| 某一栏的侧边栏 | 对应目录下的 `_meta.json` |
| 「编辑此页」链接 | `rspress.config.ts` 里取消 `editLink` 注释 |

## 构建与部署

```bash
pnpm build      # 产物在 doc_build/
pnpm preview    # 本地预览构建结果
```

推送到 `main` 后 GitHub Actions 自动部署到 Pages。仓库 Settings → Pages → Source 选 **GitHub Actions**。

部署在 `https://<user>.github.io/<repo>/` 时，工作流会自动注入 `DOC_BASE=/<repo>/`；本地开发不受影响。若绑定自定义域名（部署在根路径），删掉工作流里的 `DOC_BASE` 环境变量即可。

## 搜索

构建时自动生成索引，支持中文分词、全拼（`suoyin` → 索引）和首字母（`bs` → 部署），由 `rspress-plugin-pinyin-search` 提供。
