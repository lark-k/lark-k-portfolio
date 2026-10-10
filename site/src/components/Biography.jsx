import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { BIOGRAPHY } from '../lib/biography';
import './Biography.css';

export default function Biography({ visible, index, onSelect, onNext, onPrevious }) {
  const item = BIOGRAPHY[index];
  return <section id="biography" className={`biography-content ${visible ? 'is-visible' : ''}`}
    aria-label="个人履历" aria-hidden={!visible} inert={!visible ? true : undefined}>
    <div className="biography-layout">
      <aside className="biography-identity">
        <p className="eyebrow"><strong>02</strong> BIOGRAPHY / 个人履历</p>
        <h2>{['CODE.', 'LEARN.', 'BUILD.'].map(line => <span key={line}>{line}</span>)}</h2>
        <h3>梁科 <span>/ Lark-K</span></h3>
        <p className="biography-intro">后端开发 · AI 应用开发<br />把好奇写进代码，把想法变成作品。</p>
        <dl className="biography-skills">
          <div><dt>后端开发</dt><dd>Java 21 / Spring Boot / MyBatis</dd></div>
          <div><dt>数据与缓存</dt><dd>MySQL / Redis / Caffeine / Elasticsearch</dd></div>
          <div><dt>微服务</dt><dd>Dubbo / Nacos / RabbitMQ / Redisson</dd></div>
          <div><dt>AI 应用</dt><dd>Spring AI / LangChain4j / LangGraph4j<br />RAG / ReAct Agent / MCP / SSE</dd></div>
          <div><dt>前端与模型</dt><dd>Vue 3 / TypeScript / React / FastAPI</dd></div>
          <div><dt>工程部署</dt><dd>Linux / Docker / Nginx / Git / Maven<br />Prometheus / Grafana</dd></div>
        </dl>
      </aside>
      <div className="biography-detail" key={item.id} aria-live="polite" aria-atomic="true">
        <div className="biography-year" aria-hidden="true">{item.year}</div>
        <p className="biography-category">{item.category}</p>
        <div className="biography-copy">
          <p className="biography-period">{item.period}</p>
          <h3>{item.title}</h3><p className="biography-role">{item.role}</p>
          <p className="biography-summary">{item.summary}</p>
          <ul>{item.highlights.map(text => <li key={text}>{text}</li>)}</ul>
          <p className="biography-tags">{item.tags.join(' / ')}</p>
          {item.href && <a className="biography-source" href={item.href} target="_blank" rel="noreferrer">查看项目代码 <ArrowUpRight size={15} /></a>}
        </div>
      </div>
    </div>
    <div className="biography-timeline">
      <span className="biography-timeline-caption">02 / BIOGRAPHY</span>
      <nav aria-label="履历章节">{BIOGRAPHY.map((entry, i) => <button key={entry.id} aria-current={index === i ? 'step' : undefined}
        aria-label={`第${i + 1}项：${entry.label}`} onClick={() => onSelect(i)} className={index === i ? 'is-active' : ''}>
        <span className="biography-step-number">0{i + 1}</span><span>{entry.label}</span>
      </button>)}</nav>
      <div className="biography-controls"><button aria-label={index === 0 ? '返回初次见面' : '上一项履历'} onClick={onPrevious}><ArrowLeft size={19} /></button>
        <span>{String(index + 1).padStart(2, '0')} / 05</span>
        <button aria-label={index === 4 ? '进入作品文件夹' : '下一项履历'} onClick={onNext}><ArrowRight size={19} /></button></div>
    </div>
  </section>;
}
