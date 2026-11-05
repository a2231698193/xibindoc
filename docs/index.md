---
pageType: home

hero:
  name: XiBin Docs
  text: 把散落的技术笔记，收拢成一个站点
  tagline: 逆向 · 二进制分析 —— 用 Markdown 写，用 Rspress 发
  actions:
    - theme: brand
      text: 开始阅读
      link: /notes/reverse/
    - theme: alt
      text: 怎么写文档
      link: /guide/
  image:
    src: /favicon.svg
    alt: XiBin Docs

features:
  - title: PE 基础
    details: 从节表、入口点、导入表开始，先搞清楚一个可执行文件到底长什么样。
    icon: 📦
    link: /notes/reverse/pe-basics
  - title: 判断加壳
    details: 节名、熵值、导入表规模、入口点位置——四条线索决定后面走静态还是运行时。
    icon: 🔎
    link: /notes/reverse/packer-detection
  - title: 字符串定位
    details: 不脱壳、不重建导入表，用界面文案反推代码位置的通用套路。
    icon: 🎯
    link: /notes/reverse/runtime-analysis
  - title: 补丁工程
    details: 三种粒度怎么选、特征码怎么取、多副本与指令缓存这些坑怎么避。
    icon: 🔧
    link: /notes/reverse/patching-principles
  - title: 方法论
    details: 先让程序跑起来、先找锚点、先证伪——决定效率的是顺序而不是技巧。
    icon: 🧭
    link: /notes/reverse/methodology
  - title: 边界与合规
    details: 哪些能写、哪些不能发，以及什么情况下分析才是正当的。
    icon: ⚖️
    link: /notes/reverse/scope-and-ethics
---