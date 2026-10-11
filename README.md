# Lark-K 个人作品集

基于 React、Vite 和 Three.js 的个人作品集网站，以全屏场景、人物跟随交互和可拖拽徽章呈现创作内容。页面顺序为初次见面、个人履历、作品文件夹、作品预览、无限可能。

## 功能

- **人物跟随**：根据鼠标方向播放上、下、左、右四组动画帧，支持快速改变方向时的连续运动。
- **场景切换**：首页进入履历使用新转场视频；履历最后一项进入作品页使用新的履历到作品页视频，人物自然落在右下方。作品页静态背景使用视频结束帧，加载失败时回退到原人物图片；返回首页不播放反向视频。
- **个人履历**：按实习、硕士、本科、两个项目的顺序展示简历内容，支持滚轮、章节按钮与方向按钮切换，左侧展示六组核心技术栈。
- **无限可能**：从作品预览向下滚动时，滚轮距离直接推进跌落视频；滚得越快，画面推进越快，停止滚动后停在当前进度。标题、文案与按钮按视频进度依次入场，最后一个元素与尾帧同步完成。过渡中向上滚动可回退，回到开头恢复作品预览。仅这一段采用滚轮控制，其他页面切换保持原有行为；顶部导航、按钮和键盘仍可播放完整六秒过渡。直接访问 `#possibility`、刷新和减少动态效果模式使用高清原始尾帧 PNG，实际视频播放结束后保留视频尾帧。原始视频保存于 `assets/possibility/videos/transition-original.mp4`；浏览器版本使用短关键帧间隔、无音轨和前置索引，保留原始分辨率与帧率。
- **挂绳徽章**：支持拖拽、翻面和自然摆动，展示个人照片与联系信息。
- **作品文件夹**：点击在页面左侧依次展开四张黏土风格项目卡片，背景轻度模糊，文件夹保持原位和尺寸；展示项目插画、简要介绍、技术栈和对应 GitHub 仓库入口。点击空白、插画、文件夹或按 Escape 收起。卡片自动适配可用高度，不出现横向或纵向滚动条；小屏使用双列布局，键盘焦点保持在展开的作品区内。
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

## Netlify 部署

正式网站：<https://lark-k-portfolio.netlify.app>。

仓库根目录的 `netlify.toml` 使用 Node.js 22，在 `site/` 中运行 `npm run build`，发布 `site/dist/client/` 静态产物。

首次关联站点并登录后，可从仓库根目录更新正式网站：

```bash
npm --prefix site run build
npx netlify-cli deploy --prod --no-build --dir site/dist/client
```

本地站点关联记录位于 `.netlify/state.json`，已加入 `.gitignore`。

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

# 只更新无限可能的视频、首帧和实际尾帧
python site/scripts/prepare-possibility.py
```

首页帧从 `assets/home/videos/home-loop.mp4` 提取，按 BT.709 进行色彩转换，输出为 1280 × 720 的无损 WebP。资源处理脚本会覆盖对应输出文件；作品卡片、徽章图案及反射环境等独立资源需要另外维护。

## 本地生成文件

`.gitignore` 已排除依赖、构建产物、缓存、日志、临时文件和测试截图。`.playwright-cli/`、`output/playwright/`、`site/output/playwright/` 及 `site/qa/` 属于本地调试材料，删除不会影响网站运行。

`output/measure-badge-sway.mjs` 是额外的徽章摆动测量脚本，不参与网站启动或构建。`site/.openai/hosting.json`、资源处理脚本和依赖锁文件则应保留。
