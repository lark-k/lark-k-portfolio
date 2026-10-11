import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CircularCarousel from './CircularCarousel';
import { PROJECTS } from '../lib/projects';
import './ProjectGallery.css';

function ProjectDetail({ project, origin, reducedMotion, onClose }) {
  const dialog = useRef(null), cover = useRef(null), closeButton = useRef(null);
  const animation = useRef(null), closing = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    if (reducedMotion || !animation.current) { onClose(); return; }
    animation.current.reverse();
    animation.current.finished.then(onClose).catch(() => {});
  };
  useLayoutEffect(() => {
    const rect = cover.current.getBoundingClientRect();
    if (!reducedMotion) {
      animation.current = cover.current.animate([
        { transform: `translate(${origin.left - rect.left}px, ${origin.top - rect.top}px) scale(${origin.width / rect.width}, ${origin.height / rect.height})`, borderRadius: '12px' },
        { transform: 'translate(0, 0) scale(1, 1)', borderRadius: '18px' },
      ], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
    }
    return () => animation.current?.cancel();
  }, [origin, reducedMotion]);
  useEffect(() => {
    const background = document.querySelector('.scroll-story');
    const previousInert = background.inert;
    background.inert = true;
    closeButton.current.focus({ preventScroll: true });
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.current.querySelectorAll('button, a[href]')].filter(element => element.tabIndex >= 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { background.inert = previousInert; window.removeEventListener('keydown', key); };
  }, []);
  return createPortal(<div className={`project-detail ${leaving ? 'is-leaving' : ''}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="project-detail-title">
    <button className="detail-backdrop" aria-label="关闭项目详情" tabIndex={-1} onClick={close} />
    <button className="detail-close" ref={closeButton} onClick={close}>返回作品 <span aria-hidden="true">↗</span><kbd>ESC</kbd></button>
    <div className="detail-layout">
      <figure className="detail-visual"><img ref={cover} className="detail-cover" src={project.src} alt={project.alt} /><figcaption>PROJECT CONCEPT / 项目概念视觉</figcaption></figure>
      <article className="detail-copy">
        <p className="gallery-kicker">{project.category}</p>
        <h2 id="project-detail-title">{project.title}</h2>
        <p className="detail-subtitle">{project.subtitle}</p>
        <p className="detail-description">{project.description}</p>
        <ol className="detail-features">{project.features.map(([title, text], i) => <li key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
        <ul className="detail-tags" aria-label="项目技术栈">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        <a className="detail-repo" href={project.href} target="_blank" rel="noopener noreferrer">在 GitHub 查看项目 <span aria-hidden="true">↗</span></a>
        <p className="detail-source">lark-k / {project.repo}</p>
      </article>
    </div>
  </div>, document.body);
}

export default function ProjectGallery({ reducedMotion, onBack, onNext, onOpenChange }) {
  const controls = useRef(null), gallery = useRef(null), previousFocus = useRef(null);
  const [active, setActive] = useState(0), [paused, setPaused] = useState(false), [selected, setSelected] = useState(null);
  const open = (project, index) => {
    previousFocus.current = document.activeElement;
    const frames = [...gallery.current.querySelectorAll(`[data-cc-index="${index}"] .circular-carousel__frame`)];
    const bounds = frames.map(frame => frame.getBoundingClientRect());
    const left = Math.min(...bounds.map(rect => rect.left)), top = Math.min(...bounds.map(rect => rect.top));
    const width = Math.max(...bounds.map(rect => rect.right)) - left, height = Math.max(...bounds.map(rect => rect.bottom)) - top;
    setSelected({ project, origin: { left, top, width, height } });
    onOpenChange(true);
  };
  const close = () => {
    setSelected(null); onOpenChange(false);
    requestAnimationFrame(() => (previousFocus.current?.matches('button') ? previousFocus.current : gallery.current?.querySelector('.circular-carousel'))?.focus({ preventScroll: true }));
  };
  return <section id="preview" className="project-gallery" aria-label="作品预览" ref={gallery}>
    <div className="gallery-heading"><div><p className="gallery-kicker">04 / SELECTED WORKS</p><h2>作品预览<span>Ideas, brought to life.</span></h2></div><p>在想法之间漫游。<br />点击一张作品，走进它的故事。</p></div>
    <div className="gallery-ring">
      <CircularCarousel items={PROJECTS} preset="orbit" intro="rise" cardWidth={300} aspectRatio={.75} gap={38}
        speed={9} direction="right" tilt={-12} perspective={1800} captions={false} parallax={.12} cornerRadius={12}
        autoplay={paused || selected ? 'off' : 'drift'} focusOnClick={false} depthFade={.28} fadeColor="#20271e"
        onChange={setActive} onItemClick={open} controlsRef={controls} />
    </div>
    <div className="gallery-caption"><p>{PROJECTS[active].category}</p><button onClick={() => open(PROJECTS[active], active)}>{PROJECTS[active].title}<span aria-hidden="true">↗</span></button><span>{String(active + 1).padStart(2, '0')} <i>/ {String(PROJECTS.length).padStart(2, '0')}</i></span></div>
    <footer className="gallery-footer"><button className="gallery-back" onClick={onBack}>← 返回作品文件夹</button><div className="gallery-controls"><button aria-label="上一个作品" onClick={() => controls.current?.stepBy(-1)}>←</button>{!reducedMotion && <button className="gallery-pause" onClick={() => setPaused(value => !value)} aria-label={paused ? '播放环形轮播' : '暂停环形轮播'} aria-pressed={paused}>{paused ? '播放' : '暂停'}</button>}<button aria-label="下一个作品" onClick={() => controls.current?.stepBy(1)}>→</button></div><button className="gallery-next" onClick={onNext}>无限可能 <span aria-hidden="true">↗</span></button></footer>
    {selected && <ProjectDetail {...selected} reducedMotion={reducedMotion} onClose={close} />}
  </section>;
}
