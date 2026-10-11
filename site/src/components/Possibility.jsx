import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import './Possibility.css';

export default function Possibility({ visible, scrollLinked, progress = 1, onRestart }) {
  return <section id="possibility" className={`possibility-content ${visible ? 'is-visible' : ''} ${scrollLinked ? 'is-scroll-linked' : ''}`} style={{ '--ending-progress': progress }} aria-label="无限可能" aria-hidden={!visible} inert={!visible ? true : undefined}>
    <div className="possibility-heading">
      <p className="possibility-eyebrow"><strong>05</strong><span>THE POSSIBILITY / 无限可能</span></p>
      <h2>BEYOND THE ORDINARY.</h2>
    </div>
    <footer className="possibility-footer">
      <div className="possibility-manifesto"><h3>LET IDEAS TAKE OFF.</h3><p>让想象挣脱边界，把好奇变成下一个作品。</p></div>
      <div className="possibility-return"><p>AI · 代码 · 创意 · 新工具<br />保持好奇，持续创造。</p><button disabled={scrollLinked && progress < 1} onClick={onRestart}>再走一遍，换个角度<span><ArrowUpRight size={21} weight="bold" /></span></button></div>
    </footer>
  </section>;
}
