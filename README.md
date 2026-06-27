# Techdou Profile

豆秀禄的个人站点（静态多页），首页为项目展示页，并附简历页。

## 结构

```
techdou-profile/
├── index.html          首页（Projects）
├── resume.html         简历页
├── css/
│   └── common.css      共享 design tokens / reset / 字体加载
├── assets/             站点静态资源
│   ├── domain-bg-*.png   各领域卡片背景图
│   ├── photo.jpg          头像
│   ├── wechat.jpg         微信二维码
│   ├── douxiulu_resume.pdf  简历 PDF（resume 按钮指向 /resume）
└── pet/                桌面宠物模块（首页 iframe 内嵌）
    ├── pet.html
    ├── pet.js
    └── assets/douknow/  宠物精灵图序列帧
```

## 本地预览

纯静态站点，直接用浏览器打开 `index.html` 即可；若需模拟线上路径（例如 `/resume` 解析到 `resume.html`），建议起一个本地服务器：

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## 部署

通过 `pages` remote（`techdou.github.io`）发布到 GitHub Pages。仓库配置：

- `origin` → `techdou/techdou-profile`（源码）
- `pages`  → `techdou.github.io`（站点，生产）

## 备注

- `resume.html` 顶部「Resume」按钮指向 `https://profile.techdou.com/resume`，PDF 文件位于 `assets/douxiulu_resume.pdf`。
- 站点字体由 Google Fonts 提供（Fraunces / Work Sans / Noto Serif SC / Noto Sans SC）。
