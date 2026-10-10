import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { asset } from '../lib/interaction';
import './FolderPreview.css';

const cards = [
  {
    id: 'platform', title: 'AI 零代码生成平台', category: 'AI APP BUILDER',
    description: '用自然语言生成与迭代前端应用，串联实时预览、一键部署和源码下载，让想法快速变成可用的网站。',
    tags: ['Vue 3', 'Spring Boot', 'LangChain4j'], repo: 'ai-zero-code-platform',
  },
  {
    id: 'agent', title: 'AI 超级智能体', category: 'AUTONOMOUS AGENT',
    description: '融合 RAG 知识库、ReAct 多步推理与 MCP 工具调用，通过流式对话完成问答与复杂任务自动化。',
    tags: ['Vue 3', 'Spring AI', 'MCP'], repo: 'ai-super-agent',
  },
  {
    id: 'quant', title: '基金量化', category: 'QUANT RESEARCH',
    description: '集成基金行情、持仓管理与策略回测，结合 AI 解读、模拟交易和收益复盘，构建完整的量化研究流程。',
    tags: ['Vue 3', 'Spring Boot', 'Python'], repo: 'quant-fund',
  },
  {
    id: 'energy', title: '智能电网', subtitle: '能源辨识与分离', category: 'ENERGY INTELLIGENCE',
    description: '面向配电台区，分离光伏功率、辨识能源站与充电桩状态，贯通数据采集、模型验证与分钟级追溯。',
    tags: ['React', 'Spring Boot', 'FastAPI'], repo: 'powergrid-energy-identification-platform',
  },
];

export default function FolderPreview({ onOpenChange, reducedMotion }) {
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const spreadRef = useRef(null);
  const timer = useRef(null);
  const [phase, setPhase] = useState('closed');
  const active = phase !== 'closed';
  const begin = () => {
    if (active) return;
    setPhase('open');
    onOpenChange(true);
  };
  const close = () => {
    if (phase !== 'open') return;
    setPhase('closing');
    timer.current = window.setTimeout(() => {
      setPhase('closed');
      onOpenChange(false);
      requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
    }, reducedMotion ? 0 : 440);
  };
  useEffect(() => {
    if (!active) return;
    const background = document.querySelector('.scroll-story');
    const previousInert = background?.inert;
    if (background) background.inert = true;
    closeRef.current?.focus({ preventScroll: true });
    return () => { if (background) background.inert = previousInert; };
  }, [active]);
  useEffect(() => {
    if (phase !== 'open') return;
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const controls = [...spreadRef.current.querySelectorAll('a[href], button:not([disabled])')]
        .filter(element => element.tabIndex >= 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, reducedMotion]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!active) return;
    const stage = spreadRef.current.querySelector('.spread-stage');
    const cardRow = spreadRef.current.querySelector('.spread-cards');
    const fitCards = () => {
      const scale = Math.min(1, stage.clientHeight / cardRow.offsetHeight);
      stage.style.setProperty('--card-scale', String(scale));
    };
    const observer = new ResizeObserver(fitCards);
    observer.observe(stage);
    observer.observe(cardRow);
    fitCards();
    return () => observer.disconnect();
  }, [active]);

  return <>
    <button className={`folder-trigger ${active ? 'is-expanded' : ''}`} ref={triggerRef}
      aria-label="展开作品文件夹" aria-expanded={active} aria-controls={active ? 'portfolio-spread' : undefined} onClick={begin}>
      <img src={asset('images/folder.png')} alt="橙色黏土作品文件夹" />
      <span className="folder-prompt">点击打开我的作品 <ArrowUpRight size={17} /></span>
    </button>
    {active && createPortal(<div className={`portfolio-spread is-${phase}`} id="portfolio-spread" ref={spreadRef}
      role="dialog" aria-modal="true" aria-label="作品文件夹：四个精选项目">
      <button className="spread-backdrop" tabIndex={-1} aria-label="点击空白处收起" onClick={close} />
      <div className="spread-stage" inert={phase === 'closing' ? true : undefined}>
        <div className="spread-cards">
          {cards.map(({ id, title, subtitle, category, description, tags, repo }, index) => <article
            className={`spread-card project-${id}`} key={id} onClick={close}
            style={{ '--index': index, '--angle': `${[-4, -1.2, 1.2, 4][index]}deg`, '--launch-x': `${(1.5 - index) * 92}%` }}>
            <img className="project-art" src={asset(`images/project-${id}.webp`)} width="1536" height="1024" alt="" draggable="false" />
            <div className="project-copy">
              <h3 className="project-title">{title}{subtitle && <span>{subtitle}</span>}</h3>
              <p className="project-category">{category}</p>
              <p className="project-description">{description}</p>
              <ul className="project-tags" aria-label="技术栈">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
              <a className="project-link" href={`https://github.com/lark-k/${repo}`} target="_blank" rel="noopener noreferrer"
                aria-label={`在 GitHub 查看${title}${subtitle || ''}（新标签页）`} onClick={event => event.stopPropagation()}>
                查看项目 <ArrowUpRight size={17} weight="bold" />
              </a>
            </div>
          </article>)}
        </div>
        <button className="spread-folder" onClick={close} tabIndex={-1} aria-label="点击文件夹收起作品">
          <img src={asset('images/folder.png')} alt="Portfolio-Bg 作品文件夹" draggable="false" />
        </button>
      </div>
      <button className="spread-close" ref={closeRef} onClick={close} disabled={phase === 'closing'}><X size={15} />收起文件夹 <kbd>ESC</kbd></button>
    </div>, document.body)}
  </>;
}
