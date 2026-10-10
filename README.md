# Lark-K 个人作品集

基于 React、Vite 和 Three.js 的个人作品集网站，以全屏场景、人物跟随交互和可拖拽徽章呈现创作内容。目前实现首页与作品文件夹场景，教育经历、独立简历页和项目详情页仍待扩展。

## 功能

- **人物跟随**：根据鼠标方向播放上、下、左、右四组动画帧，支持快速改变方向时的连续运动。
- **场景切换**：通过页面导航、滚轮或触摸滑动进入作品场景，使用视频过渡；返回首页时分层显示内容。
- **挂绳徽章**：支持拖拽、翻面和自然摆动，展示个人照片与联系信息。
- **作品文件夹**：点击依次展开四张黏土风格项目卡片，展示项目插画、简要介绍、技术栈和对应 GitHub 仓库入口；点击空白、插画、文件夹或按 Escape 收起。小屏可滚动浏览，键盘焦点保持在展开的作品区内。
- **加载过渡**：使用 GridScan 背景、真实资源加载进度和进度条覆盖首次加载过程。
- **视觉与适配**：包含文字光泽、按钮边框和指针涟漪效果，并适配移动端和系统减少动态效果设置。

## 技术栈

| 用途 | 技术 |
| --- | --- |
| 页面与组件 | React 19 |
| 开发与构建 | Vite 6 |
| 三维徽章与视觉效果 | Three.js、OGL、postprocessing |
| 图标与字体 | Phosphor Icons、Fontsource |
| 自动化测试 | Node.js 内置测试运行器 |
| 媒体预处理 | Python 3、FFmpeg |

依赖版本与安装锁定信息见 `site/package.json` 和 `site/package-lock.json`。

## 本地运行

准备 Node.js 22 或更高版本及 npm。以下命令从仓库根目录开始执行：

```bash
cd site
npm ci
npm run dev
```

在浏览器中访问终端输出的本地地址。网站运行依赖现代浏览器的 WebGL、视频播放和图像解码能力。

仓库已包含运行所需的媒体资源，正常开发和构建无需先安装 Python 或重新生成动画帧。

## 构建与测试

以下命令均在 `site/` 目录执行。

```bash
# 运行交互逻辑测试
npm test

# 构建静态网站
npm run build

# 本地预览构建结果
npm run preview
```

静态构建产物位于 `site/dist/client/`。`preview` 用于本地检查构建结果。

如需生成 Sites 交付包：

```bash
npm run build:sites
npm run test:sites
```

`build:sites` 会先构建页面，再生成以下文件；Sites 测试包含交付文件检查，因此应在此构建完成后运行。

```text
site/dist/
├── client/             # 页面、脚本和静态资源
├── server/index.js     # 静态资源服务与页面路由回退
└── .openai/hosting.json
```

## 目录结构

```text
.
├── assets/                    # 原始图片、视频及创作素材
├── site/
│   ├── src/
│   │   ├── components/        # 徽章、文件夹和视觉效果组件
│   │   ├── lib/               # 人物帧播放器、运动与交互逻辑
│   │   ├── App.jsx            # 首页、作品场景与导航
│   │   └── styles.css         # 全局样式和响应式布局
│   ├── public/assets/
│   │   ├── frames/1280/       # 四个方向、每组 32 张无损 WebP 帧
│   │   ├── images/            # 背景、作品卡片、徽章与预览图
│   │   └── videos/            # 网站视频资源
│   ├── scripts/               # 媒体处理与 Sites 打包脚本
│   ├── tests/                 # 交互与 Sites 服务测试
│   ├── worker/                # Sites 服务入口
│   ├── .openai/hosting.json   # Sites 配置
│   └── vite.config.mjs        # 开发服务器与构建配置
├── .gitignore
└── README.md
```

## 媒体资源维护

`assets/` 保存原始素材，`site/public/assets/` 保存浏览器实际使用的资源。两者均需保留在版本控制中，尤其是首页使用的 128 张动画帧和场景切换视频。

修改原始素材后，可按需重新生成资源。先准备 Python 3，并确保 `ffmpeg` 可通过系统 PATH 调用且支持无损 WebP 编码。从仓库根目录执行：

```bash
# 复制原始媒体、提取预览图，并重新生成首页动画帧
python site/scripts/prepare-media.py

# 若只需更新首页动画帧与首页预览图，可单独执行
python site/scripts/prepare-hero.py
```

首页帧从 `assets/home/videos/home-loop.mp4` 提取，按 BT.709 进行色彩转换，输出为 1280 × 720 的无损 WebP。资源处理脚本会覆盖对应输出文件；作品卡片、徽章图案及反射环境等独立资源需要另外维护。

## 本地生成文件

`.gitignore` 已排除依赖、构建产物、缓存、日志、临时文件和测试截图。`.playwright-cli/`、`output/playwright/`、`site/output/playwright/` 及 `site/qa/` 属于本地调试材料，删除不会影响网站运行。

`output/measure-badge-sway.mjs` 是额外的徽章摆动测量脚本，不参与网站启动或构建。`site/.openai/hosting.json`、资源处理脚本和依赖锁文件则应保留。
