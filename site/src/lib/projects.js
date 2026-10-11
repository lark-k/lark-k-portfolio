import { asset } from './interaction';

// Six profile-pinned repositories plus energy-storage-software; verified 2026-10-11.
export const PROJECTS = [
  {
    id: 'platform', title: 'AI 零代码生成平台', subtitle: '从一句想法，到一个应用。', category: 'AI APP BUILDER',
    repo: 'ai-zero-code-platform', tags: ['Vue 3', 'Spring Boot', 'LangChain4j', 'LangGraph4j'],
    description: '用自然语言描述需求，在对话中生成和迭代前端应用，把创意、代码与在线预览连成一个完整的创作过程。',
    features: [
      ['对话式生成', '支持 HTML、多文件前端与 Vue 工程，保留上下文，持续迭代。'],
      ['生成到交付', '流式输出、在线预览、应用部署与源码下载贯通完整流程。'],
      ['工程化编排', 'LangGraph4j 编排生成与质检，异步构建，并提供单体与微服务实现。'],
    ],
    alt: '深橄榄绿创作工作台上，对话气泡连接笔记本与层叠应用窗口',
  },
  {
    id: 'agent', title: 'AI 超级智能体', subtitle: '让思考，走向行动。', category: 'AUTONOMOUS AGENT',
    repo: 'ai-super-agent', tags: ['Vue 3', 'Spring AI', 'ReAct', 'RAG', 'MCP'],
    description: '围绕知识检索与复杂任务构建智能体，将多步推理、工具调用和流式对话结合，让 AI 从回答问题走向执行任务。',
    features: [
      ['多步任务推理', '自定义 ReAct 执行链，循环思考、调用工具并回填结果，分别展示过程与答案。'],
      ['知识增强对话', '情感咨询场景接入百炼知识库 RAG，支持会话记忆与 SSE 流式回复。'],
      ['连接外部能力', '统一接入本地工具与 MCP 服务，覆盖搜索、文件处理、PDF 生成和图片检索。'],
    ],
    alt: '暖色台灯下，陶瓷智能体通过书本、放大镜与工具协作处理任务',
  },
  {
    id: 'quant', title: '基金量化研究平台', subtitle: '让每一次判断，都有依据。', category: 'QUANT RESEARCH',
    repo: 'quant-fund', tags: ['Vue 3', 'Spring Boot', 'Python', 'FastAPI'],
    description: '把分散的基金行情、账户持仓和策略分析放在同一个研究工作台，用可解释的规则与历史验证连接判断和复盘。',
    features: [
      ['数据与持仓', '统一基金净值、多账户持仓、模拟交易、定投与收益复盘。'],
      ['可验证的策略', 'Python 引擎生成多因子信号，历史回测对照同仓位基准，分析收益与回撤。'],
      ['有边界的 AI 解读', '规则引擎决定动作与风险项，AI 提供结构化解读，辅助理解策略依据。'],
    ],
    alt: '深绿色量化研究桌面上的数据曲线、配置圆盘与分析笔记',
  },
  {
    id: 'energy', title: '新型能源智能辨识', subtitle: '从复杂波形，读懂能源。', category: 'ENERGY INTELLIGENCE',
    repo: 'powergrid-energy-identification-platform', tags: ['React', 'Spring Boot', 'FastAPI', 'Docker'],
    description: '面向配电台区的能源监测分析平台，连接数据采集、模型训练验证与应用管理，呈现能源状态和光伏功率变化。',
    features: [
      ['辨识与分离', '对光伏进行数值功率分离，对能源站与充电桩输出辨识概率和状态。'],
      ['模型全生命周期', '从数据采集、模型训练、验证到应用管理，衔接前端、业务后台与模型服务。'],
      ['反馈与追溯', '支持反馈校正、实时事件与分钟级追溯，定位监测结果的变化过程。'],
    ],
    alt: '暮色中的微型配电台区，光伏、能源站与充电桩上方呈现分离波形',
  },
  {
    id: 'inspection', title: '低空空地协同巡检', subtitle: '从空中视角，发现细微之处。', category: 'AIR–GROUND INSPECTION',
    repo: 'low-altitude-air-ground-inspection-platform', tags: ['React', 'TypeScript', 'Vite'],
    description: '面向电力设施巡检的可视化原型，以预录制场景视频与演示数据串联空地协同巡检，呈现任务进度、飞行指标与缺陷信息。',
    features: [
      ['场景与视角演示', '通过视频片段切换展示电力设施、无人机与部件，支持暂停、重播和全屏查看。'],
      ['飞行任务总览', '集中呈现飞行距离、时长与任务进度，结合轨迹地图、航点和缩放浏览任务。'],
      ['缺陷分类检索', '按分类与关键词查找缺陷，查看示例图片及元数据，演示数字化巡检管理流程。'],
    ],
    alt: '深橄榄绿微缩地形上，无人机沿铜色航线巡查输电塔与电力部件',
  },
  {
    id: 'gallery', title: '拾光 · 手势粒子相册', subtitle: '让回忆，在指尖流动。', category: 'STILLSPACE / INTERACTIVE ART',
    repo: 'gesture-particle-gallery', tags: ['React', 'Three.js', 'MediaPipe', 'Express', 'SQLite'],
    description: '把照片放入自然场景中的沉浸式 3D 画廊，用手势旋转、指向和查看影像，让完整照片与流动粒子之间的变化成为回忆的一部分。',
    features: [
      ['自然场景与粒子', '提供林光秘境、镜湖回廊与旷野流光三种环境，支持照片粒子分解与重新聚合。'],
      ['手势交互', '张掌控制环形画廊旋转，食指停留选择照片；同时提供鼠标、触摸与按钮操作。'],
      ['多用户相册', '支持登录、创建相册、上传照片与封面编辑，通过 SQLite 和私有 OSS 保存与管理内容。'],
    ],
    alt: '幽绿微缩森林中，手势引导悬浮照片化为暖色粒子，映在静谧水面上',
  },
  {
    id: 'storage', title: '储能负荷分析软件', subtitle: '从负荷曲线，寻找储能线索。', category: 'STORAGE INSIGHT / DESKTOP',
    repo: 'energy-storage-software', tags: ['Python', 'PySide6', 'PyTorch', 'Matplotlib'],
    description: '面向用户侧储能辨识的 Windows 中文桌面软件，将负荷曲线导入、本地模型推理、结果核实与报告导出组织为可复查的分析流程。',
    features: [
      ['批量负荷分析', '导入 96 点负荷曲线，调用已有学生模型进行推理，并按户汇总分析结果。'],
      ['核实与解释', '逐项核实辨识结果的正确与错误，查看关键时段解释，对照曲线检查模型判断。'],
      ['本地处理与导出', '负荷数据与模型推理均在本地处理，可导出 Excel 与曲线图片，支持打包安装使用。'],
    ],
    alt: '暗绿色储能分析工作台上，电池柜与显示负荷曲线的屏幕、核实报告相连',
  },
].map(project => ({ ...project, src: asset(`images/preview-${project.id}-v2.png`), href: `https://github.com/lark-k/${project.repo}` }));
