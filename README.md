# Techdou Profile

Techdou 的个人站点（纯静态多页）。首页为项目展示页，附简历页；首页右下角有一只可拖拽的桌面宠物「小豆」。

线上地址：<https://techdou.github.io>

## 功能

- **首页 `index.html`**：项目展示、领域卡片、时间线，配水墨风装饰素材（`assets/motifs/`）。首屏是「小豆滚动镜头剧场」——基于 Three.js 的 3D 角色场景，随滚动沿 CatmullRom 曲线轨道切换机位（CDN 加载 three@0.160，模型与环境贴图本地）。
- **简历页 `resume.html`**：在线简历，顶部按钮可下载 PDF（`assets/douxiulu_resume.pdf`）。
- **桌面宠物**：首页 iframe 内嵌的宠物系统，当前登场角色为 **小豆**（站在书卷上）。支持自由游荡、哲理语录气泡、鼠标靠近逃跑、拖拽抛掷。宠物模块独立，详见 [`pet/`](./pet) 目录。

> 宠物系统是多皮肤框架，皮肤在 `pet/pet.js` 的 `PET_CONFIG.skins` 中定义，用 `enabled` 开关控制是否登场。`科技豆`、`豆懂AI` 两个皮肤当前设为 `enabled: false` 暂时下线，定义保留，删掉该字段即可恢复。

## 目录结构

```
techdou-profile/
├── index.html              首页（Projects）
├── resume.html             简历页
├── css/
│   └── common.css          共享 design tokens / reset / 字体加载
├── assets/                 站点静态资源
│   ├── domain-bg-*.webp      各领域卡片背景图
│   ├── photo.webp            头像
│   ├── wechat.webp           微信二维码
│   ├── douxiulu_resume.pdf   简历 PDF
│   ├── motifs/               首页水墨风装饰素材（梅兰竹菊 / 山水 / 印章）
│   ├── env/                  3D 剧场环境贴图（草地 PBR 三件套 + 天空 HDR）
│   └── model/                3D 剧场角色模型（小豆.glb + 抠图/PNG）
└── pet/                    桌面宠物模块（首页 iframe 内嵌）
    ├── pet.html              iframe 宿主
    ├── pet.js                宠物系统（多皮肤、物理、语录、拖拽桥接）
    └── assets/
        ├── xiaodou/          小豆精灵图（idle 变体 / walk×4 / sleep×2 / wave·happy / 书卷底座）
        ├── techdou/          科技豆精灵图（已下线，保留定义）
        └── douknow/          豆懂AI 精灵图（已下线，保留定义）
```

## 本地预览

纯静态站点，直接用浏览器打开 `index.html` 即可。若需模拟线上路径（例如 `/resume` 解析到 `resume.html`），建议起本地服务器：

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## 宠物模块说明

宠物系统位于 `pet/`，通过 iframe 嵌入首页。iframe 全程 `pointer-events: none` 不拦截页面交互，拖拽靠 `postMessage` 在父页面与 iframe 间传递坐标。

- **皮肤配置**：在 `pet/pet.js` 的 `PET_CONFIG.skins` 数组中定义，每个皮肤含 `frames`（精灵图路径）、`quotes`（语录）、可选的底座尺寸参数（`cloudScaleW/H`、`cloudOffsetY`）、`enabled` 开关。
- **活动范围**：父页面通过 `douknow-pet-surface`（活动区）和 `douknow-pet-exclusions`（禁区矩形）两条消息控制。当前 `#meet-xiaodou` 剧场区和导航条为禁区，小豆只在 `main` / 时间线 / 页脚区域活动。
- **新增皮肤**：把精灵图（透明 webp）放入 `pet/assets/<skin名>/`，在 `skins` 数组追加一项（设 `enabled: true`）即可。
- **更换底座**：修改对应 skin 的 `frames.cloud` 路径，并按素材宽高比调整 `cloudScaleW/H`。

精灵图素材由 AI 图像 API 生成（品红底 + 本地色键抠图），生成脚本与中间产物位于本地 `outputs/`（已 gitignore，不入库）。

## 部署

站点由 GitHub Actions 自动部署，无需手动操作：

- `origin` → `techdou/techdou-profile`（源码仓库，本仓库）
- 推送到 `origin/main` 后，[deploy workflow](.github/workflows/deploy-pages.yml) 通过 SSH deploy key 把站点文件 rsync 同步到 `techdou/techdou.github.io`，即发布到 <https://techdou.github.io>。
- 仅当 `index.html` / `resume.html` / `css/` / `assets/` / `pet/` / `README.md` / workflow 文件有变动时才触发部署，改 `.gitignore` 等开发文件不会空跑。

## 技术栈

- 原生 HTML / CSS / JavaScript，无构建步骤
- Canvas 2D 绘制宠物
- Three.js 0.160（3D 滚动剧场，ESM + importmap 从 CDN 加载）
- Google Fonts（Fraunces / Work Sans / Noto Serif SC / Noto Sans SC）
