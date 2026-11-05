# CSS 布局小抄

## 水平垂直居中

```css
/* 最稳的写法 */
.center {
  display: grid;
  place-items: center;
}
```

## 两栏布局：左固定、右自适应

```css
.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
}
```

`minmax(0, 1fr)` 很关键：默认的 `1fr` 最小值是 `auto`，内容过长会把右栏撑破。

## 文本截断

```css
/* 单行 */
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 多行 */
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## 响应式断点建议

| 断点 | 宽度 | 说明 |
| --- | --- | --- |
| sm | 640px | 大屏手机 |
| md | 768px | 平板竖屏 |
| lg | 1024px | 平板横屏 / 小笔记本 |
| xl | 1280px | 桌面 |