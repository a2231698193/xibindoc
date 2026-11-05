# MDX 组件速查

`.md` 文件天然支持 MDX 语法，可以直接用组件把内容排得更清楚。

## 提示容器

```md
:::tip 顺手记
提示类信息
:::

:::warning 注意
需要留神的地方
:::

:::danger 危险操作
会影响线上数据的那种
:::
```

也可以写 GitHub 风格：

```md
> [!NOTE]
> 这是一个 note
```

## Tabs

```mdx
import { Tabs, Tab } from '@rspress/core/theme';

<Tabs>
  <Tab label="npm">npm i foo</Tab>
  <Tab label="pnpm">pnpm add foo</Tab>
</Tabs>
```

## Steps

```mdx
import { Steps } from '@rspress/core/theme';

<Steps>
### 安装依赖
`pnpm i`

### 启动开发服务
`pnpm dev`
</Steps>
```

## 代码块增强

````md
```ts title="utils.ts" {3-4}
// 行高亮：3-4
function add(a: number, b: number) {
  return a + b;
}
```
````

## 链接到其他笔记

同站内用相对路径，Rspress 会做死链检查：

```md
[PE 结构](./pe-basics.md)
[方法论](./methodology.md)
```