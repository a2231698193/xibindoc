# React 渲染模式速查

同一份数据，不同的渲染位置，代价完全不同。这张表是选型时的第一道筛子。

| 模式 | 首屏 | SEO | 服务端压力 | 适用场景 |
| --- | --- | --- | --- | --- |
| CSR | 慢 | 差 | 无 | 后台系统、内网工具 |
| SSR | 快 | 好 | 中 | 内容型站点、电商列表 |
| SSG | 最快 | 最好 | 无 | 文档、博客、营销页 |
| ISR / 增量 | 快 | 好 | 低 | 内容多但更新不频繁 |

## 一个容易踩的坑

在 SSR 下，任何依赖 `window` / `localStorage` 的代码都会在服务端渲染时炸掉。三种处理方式：

:::tip 处理方式

1. 移到 `useEffect` 里；
2. 用 `typeof window !== 'undefined'` 守卫；
3. 组件用 `dynamic import` 并关闭 SSR。

:::

```tsx
// ❌ 服务端渲染时直接报错
const theme = localStorage.getItem('theme');

// ✅ 放到副作用里
useEffect(() => {
  setTheme(localStorage.getItem('theme') ?? 'light');
}, []);
```

## 水合不匹配（Hydration Mismatch）

服务端和客户端首帧输出不一致时，React 会报错。最常见的来源是**时间**和**随机数**：

```tsx
// ❌ 服务端与客户端的时间不同
<span>{new Date().toLocaleString()}</span>

// ✅ 挂载后再渲染
const [now, setNow] = useState<string>();
useEffect(() => setNow(new Date().toLocaleString()), []);
```

> 记住一句话：**首帧必须是纯函数**，任何有副作用的读取都往后放。
