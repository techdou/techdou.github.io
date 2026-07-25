# Techdou Profile

Techdou 的个人站点（纯静态多页），首页为项目展示页，并附简历页。首页右下角有两只可拖拽的桌面宠物。

## 功能

- **首页 `index.html`**：项目展示、领域卡片、时间线，配水墨风装饰素材（`assets/motifs/`）。首页中部有"小豆滚动镜头剧场"——基于 three.js 的 3D 角色场景，随滚动切换机位（CDN 加载 three@0.160，模型与环境贴图本地）。
- **简历页 `resume.html`**：在线简历，顶部按钮可下载 PDF（`assets/douxiulu_resume.pdf`）。
- **桌面宠物**：首页 iframe 内嵌的双宠物系统——
  - 🟢 **科技豆**（techdou.com，骑筋斗云）
  - 🟠 **豆懂AI**（douknowai，站在水果盘上）
  
  支持自由游荡、随机语录气泡、鼠标靠近逃跑、拖拽抛掷。宠物模块独立，详见 [`pet/`](./pet) 目录。

## 目录结构

```
techdou-profile/
├── index.html              首页（Projects）
├── resume.html             简历页
├── css/
│   └── common.css          共享 design tokens / reset / 字体加载
├── assets/                 站点静态资源
│   ├── domain-bg-*.webp      各领域卡片背景图
│   ├── motifs/               首页水墨风装饰素材
│   ├── env/                  3D 剧场环境贴图（草地 PBR 三件套 + 天空 HDR）
│   ├── model/                3D 剧场角色模型（小豆.glb + 抠图/PNG）
│   ├── photo.webp            头像
│   ├── wechat.webp           微信二维码
│   └── douxiulu_resume.pdf   简历 PDF
└── pet/                    桌面宠物模块（首页 iframe 内嵌）
    ├── pet.html              iframe 宿主
    ├── pet.js                宠物系统（双皮肤、物理、语录、拖拽桥接）
    └── assets/
        ├── techdou/          科技豆精灵图（9 帧：idle/wink/walk×4/sleep/cloud）
        └── douknow/          豆懂AI 精灵图（8 帧 + 水果盘底座 + 咖啡杯备选）
```

## 本地预览

纯静态站点，直接用浏览器打开 `index.html` 即可。若需模拟线上路径（例如 `/resume` 解析到 `resume.html`），建议起本地服务器：

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## 宠物模块说明

宠物系统位于 `pet/`，通过 iframe 嵌入首页，全程 `pointer-events: none` 不拦截页面交互，拖拽靠 `postMessage` 在父页面与 iframe 间传递坐标。

- **皮肤配置**：在 `pet/pet.js` 的 `PET_CONFIG.skins` 数组中定义，每个皮肤含 `frames`（精灵图路径）、`quotes`（语录）、可选的底座尺寸参数（`cloudScaleW/H`、`cloudOffsetY`）。
- **新增皮肤**：把 8 帧精灵图（256×256 透明 webp）放入 `pet/assets/<skin名>/`，在 `skins` 数组追加一项即可。
- **更换底座**：修改对应 skin 的 `frames.cloud` 路径（如把水果盘换成 `coffee-cup.webp`），并按素材宽高比调整 `cloudScaleW/H`。

精灵图素材由 AI 图像 API 生成（品红底 + 本地色键抠图），生成脚本与中间产物位于本地 `outputs/`（已 gitignore，不入库）。

## 部署

- `origin` → `techdou/techdou-profile`（源码仓库）
- `pages`  → `techdou.github.io`（GitHub Pages 生产站点）

推送到 `pages` remote 即发布到线上。

## 技术栈

- 原生 HTML / CSS / JavaScript，无构建步骤
- Canvas 2D 绘制宠物
- Google Fonts（Fraunces / Work Sans / Noto Serif SC / Noto Sans SC）

