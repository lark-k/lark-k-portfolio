// Content transcribed from the user's V8 resume; order is intentionally not chronological.
export const BIOGRAPHY = [
  {
    id: 'internship', label: '实习经历', year: '2026', category: 'EXPERIENCE / 实习',
    period: '2026.01 - 2026.08', title: '江苏省电力科学研究院', role: '核心开发',
    summary: '参与新型能源智能辨识与分离平台研发，实现台区光伏、能源站及充电桩辨识结果展示与光伏功率分离分析。',
    highlights: ['基于 React、Spring Boot 与 FastAPI 完成前后端及模型服务对接。', '参与时序数据预处理、反馈校正、接口联调与 Docker 容器化部署。'],
    tags: ['React', 'Spring Boot', 'FastAPI', 'Docker'],
  },
  {
    id: 'masters', label: '硕士', year: '2025', category: 'EDUCATION / 硕士',
    period: '2025.09 - 至今', title: '南京信息工程大学', role: '软件工程 · 硕士',
    summary: '在双一流高校攻读软件工程硕士，研究生期间参与导师多项横向科研项目。',
    highlights: ['参与光储充辨识与光伏功率分离平台开发。', '实测能源辨识与光伏分离模型准确率均达到 98% 以上。'],
    tags: ['软件工程', '横向科研', '能源辨识'],
  },
  {
    id: 'bachelors', label: '本科', year: '2021', category: 'EDUCATION / 本科',
    period: '2021.09 - 2025.06', title: '青岛恒星科技学院', role: '软件工程 · 本科',
    summary: '软件工程本科，持续积累 Java 后端开发与软件工程实践能力。',
    highlights: ['熟悉 Java 集合、IO、多线程与 JUC 并发编程。', '掌握 Spring Boot、MySQL、Redis 等后端开发技术。'],
    tags: ['软件工程', 'Java', '后端开发'],
  },
  {
    id: 'zero-code', label: '项目一', year: '2025', category: 'PROJECT 01 / AI 应用',
    period: '2025.09 - 2026.05', title: 'AI 零代码应用生成平台', role: '核心开发',
    summary: '通过自然语言生成 HTML、多文件前端与 Vue 工程，支持多轮迭代、在线预览、可视化编辑与部署下载。',
    highlights: ['使用 LangGraph4j 编排生成、质检与构建，实现自动修复闭环，代码生成错误率降低 35%。', '基于 Reactor Flux + SSE 实时推送生成内容，支持边生成边预览。'],
    tags: ['Java 21', 'LangChain4j', 'LangGraph4j', 'SSE'],
    href: 'https://gitee.com/git_mystore/ai-zero-code-platform',
  },
  {
    id: 'super-agent', label: '项目二', year: '2025', category: 'PROJECT 02 / AI 智能体',
    period: '2025.11 - 2026.03', title: 'AI 超级智能体平台', role: '核心开发',
    summary: '基于 Spring AI 独立开发智能体平台，整合大模型问答、知识库检索与工具调用，支持联网搜索、文件处理和 PDF 生成。',
    highlights: ['实现轻量级 ReAct 执行框架，串联思考、工具调用、结果回填与最终回答。', '搭建 RAG 检索流程，接入 MCP 外部服务并独立开发图片搜索 MCP Server。'],
    tags: ['Spring AI', 'ReAct', 'RAG', 'MCP'],
    href: 'https://gitee.com/git_mystore/ai-super-agent',
  },
];

export const SCENES = ['home', 'biography', 'works', 'preview'];

export function nextStoryStep(scene, index, direction) {
  const forward = direction > 0;
  if (scene === 'biography') {
    const next = index + (forward ? 1 : -1);
    if (next >= 0 && next < BIOGRAPHY.length) return { scene, index: next };
    return { scene: forward ? 'works' : 'home', index };
  }
  if (scene === 'home') return { scene: forward ? 'biography' : 'home', index: 0 };
  if (scene === 'preview') return { scene: forward ? 'preview' : 'works', index };
  return { scene: forward ? 'preview' : 'biography', index: BIOGRAPHY.length - 1 };
}
