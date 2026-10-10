import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { asset } from '../lib/interaction';
import './FolderPreview.css';

const cards = [
  ['platform', 'AI 零代码生成平台'],
  ['agent', 'AI 超级智能体'],
  ['quant', '基金量化'],
  ['energy', '智能电网能源辨识与分离'],
];

export default function FolderPreview({ onOpenChange, reducedMotion }) {
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
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
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, reducedMotion]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return <>
    <button className={`folder-trigger ${active ? 'is-expanded' : ''}`} ref={triggerRef}
      aria-label="展开作品文件夹" aria-expanded={active} aria-controls={active ? 'portfolio-spread' : undefined} onClick={begin}>
      <img src={asset('images/folder.png')} alt="橙色黏土作品文件夹" />
      <span className="folder-prompt">点击打开我的作品 <ArrowUpRight size={17} /></span>
    </button>
    {active && createPortal(<div className={`portfolio-spread is-${phase}`} id="portfolio-spread">
      <button className="spread-backdrop" tabIndex={-1} aria-label="点击空白处收起" onClick={close} />
      <div className="spread-stage" aria-label="四个作品项目">
        {cards.map(([id, title], index) => <img className="spread-card" key={id}
          style={{ '--index': index, '--column': index % 2, '--row': Math.floor(index / 2), '--angle': `${(index - 1.5) * 4}deg`, '--launch-x': `${(1.5 - index) * 92}%` }}
          src={asset(`images/card-${id}.png`)} alt={title} draggable="false" />)}
        <button className="spread-folder" onClick={close} tabIndex={-1} aria-label="点击文件夹收起作品">
          <img src={asset('images/folder.png')} alt="Portfolio-Bg 作品文件夹" draggable="false" />
        </button>
      </div>
      <button className="spread-close" ref={closeRef} onClick={close}><X size={15} />收起文件夹 <kbd>ESC</kbd></button>
    </div>, document.body)}
  </>;
}
