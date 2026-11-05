# Git 日常流程

## 分支命名

```
feat/user-profile      新功能
fix/login-redirect     缺陷修复
docs/readme-update     文档
refactor/api-client    重构
```

## 提交信息

采用 Conventional Commits，方便自动生成 changelog：

```
<type>(<scope>): <subject>

feat(auth): 支持微信扫码登录
fix(cart): 修复数量为 0 时仍可下单
```

| type | 含义 |
| --- | --- |
| feat | 新功能 |
| fix | 修复 |
| refactor | 重构，不改行为 |
| perf | 性能优化 |
| docs | 文档 |
| test | 测试 |
| chore | 杂项 / 构建 |