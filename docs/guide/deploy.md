# 部署

构建产物在 `doc_build/`，是一堆静态文件，扔到哪里都能跑。

## 本地构建与预览

```bash
pnpm build
pnpm preview
```

## GitHub Pages

仓库 Settings → Pages → Source 选 **GitHub Actions**，然后推 main 就会自动部署。
工作流已经写好在 `.github/workflows/deploy.yml`。

:::warning 仓库名会影响路径

如果站点地址是 `https://<user>.github.io/<repo>/`，构建时必须告诉 Rspress 这个子路径。
工作流里已经用 `DOC_BASE=/${repo}/` 自动注入，本地开发仍是 `/`。

:::

## Vercel / Netlify

不用改任何配置，直接连仓库：

| 平台 | Build Command | Output Directory |
| --- | --- | --- |
| Vercel | `pnpm build` | `doc_build` |
| Netlify | `pnpm build` | `doc_build` |

这两个平台部署在根路径，`DOC_BASE` 不用设。

## 生成的文件

| 产物 | 用途 |
| --- | --- |
| `doc_build/*.html` | 每页的静态 HTML，SEO 友好 |
| `doc_build/llms.txt` | 给大模型读的文档索引 |
| `doc_build/static/` | JS / CSS / 搜索索引 |