import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDown } from '@phosphor-icons/react/dist/csr/ArrowDown';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle';
import '@fontsource/anton/latin-400.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import RippleDistortion from './components/RippleDistortion';
import FolderPreview from './components/FolderPreview';
import StarBorder from './components/StarBorder';
import ShinyText from './components/ShinyText';
import { asset, pointerDirection } from './lib/interaction';
import { createHeroFramePlayer } from './lib/heroFrames';

const directionLabels = { default: 'LOOKING AT YOU', up: 'LOOKING UP', down: 'LOOKING DOWN', left: 'LOOKING LEFT', right: 'LOOKING RIGHT' };
const Lanyard = lazy(() => import('./components/Lanyard'));
const GridScan = lazy(() => import('./components/GridScan').then(module => ({ default: module.GridScan })));
const headingShine = { color: '#f5f2df', shineColor: '#ffffff', shineAccent: '#eac17c', speed: 2, shineWidth: 40, softness: .8, trigger: 'loop', direction: 'right' };

export function App() {
  const heroFrameRef = useRef(null), transitionRef = useRef(null), mediaRef = useRef(null);
  const playerRef = useRef(null), locked = useRef(false), stateRef = useRef({});
  const transitionFrameRef = useRef(null);
  const [scene, setScene] = useState('home');
  const [motion, setMotion] = useState('idle');
  const [transitionReady, setTransitionReady] = useState(false);
  const [direction, setDirection] = useState('default');
  const [folderOpen, setFolderOpen] = useState(false);
  const [trailEnabled, setTrailEnabled] = useState(true);
  const [heroLoad, setHeroLoad] = useState({ decoded: 0, uploaded: 0, total: 125, ready: false });
  const [badgeReady, setBadgeReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const prepared = heroLoad.ready && badgeReady;
  const loadPercent = Math.min(100, Math.round((heroLoad.decoded / heroLoad.total * .55 + heroLoad.uploaded / heroLoad.total * .35 + (badgeReady ? .1 : 0)) * 100));
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  stateRef.current = { scene, motion, folderOpen, reducedMotion, direction, entered };
  const worksVisible = scene === 'works' && motion === 'idle';
  const homeVisible = scene === 'home' && motion !== 'forward';

  useEffect(() => {
    if (!prepared) return;
    const timer = window.setTimeout(() => setEntered(true), reducedMotion ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [prepared, reducedMotion]);

  useEffect(() => {
    if (motion !== 'returning') return;
    const timer = window.setTimeout(() => {
      setMotion('idle'); locked.current = false;
    }, reducedMotion ? 0 : 3000);
    return () => window.clearTimeout(timer);
  }, [motion, reducedMotion]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    mediaRef.current = null; heroFrameRef.current = null;
    playerRef.current = createHeroFramePlayer(frame => {
      heroFrameRef.current = frame;
      mediaRef.current = frame;
    });
    let pointerFrame = 0, latestPointer;
    const applyPointer = () => {
      pointerFrame = 0;
      if (!latestPointer || !stateRef.current.entered || locked.current || stateRef.current.scene !== 'home') return;
      const next = pointerDirection(latestPointer.clientX, latestPointer.clientY, innerWidth, innerHeight);
      if (next === stateRef.current.direction) return;
      setDirection(next);
      playerRef.current.request(next);
    };
    const move = event => {
      const state = stateRef.current;
      if (!state.entered || state.reducedMotion || locked.current || state.folderOpen || state.scene !== 'home' || event.pointerType === 'touch') return;
      latestPointer = event;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(applyPointer);
    };
    const reset = () => { latestPointer = null; if (!locked.current) { setDirection('default'); playerRef.current.request('default'); } };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      playerRef.current.dispose();
      cancelAnimationFrame(pointerFrame);
      transitionFrameRef.current?.();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', reset);
    };
  }, []);

  const finishTravel = target => {
    transitionFrameRef.current?.(); transitionFrameRef.current = null;
    setScene(target); setMotion('idle'); locked.current = false;
    if (target === 'home') {
      setDirection('default'); setTransitionReady(false);
      transitionRef.current.pause(); playerRef.current.reset(); mediaRef.current = heroFrameRef.current;
      if (!stateRef.current.reducedMotion) {
        setMotion('returning'); locked.current = true;
      }
    }
    history.replaceState(null, '', `#${target}`);
  };
  const travel = target => {
    const state = stateRef.current;
    if (!state.entered || locked.current || state.folderOpen || state.scene === target) return;
    locked.current = true;
    if (target === 'home' || state.reducedMotion) { finishTravel(target); return; }
    // Hold the actual pose beneath the video; never queue a return to the front.
    playerRef.current.pause();
    setTransitionReady(false); setMotion('forward');
    const video = transitionRef.current;
    video.currentTime = 0; video.playbackRate = 3.8;
    video.play().catch(() => finishTravel(target));
  };
  const revealTransition = () => {
    if (!locked.current) return;
    const video = transitionRef.current;
    transitionFrameRef.current?.();
    // Keep the frozen canvas visible until a fresh video frame is presented,
    // including repeat visits when the video previously held its last frame.
    if (video.requestVideoFrameCallback) {
      const id = video.requestVideoFrameCallback(() => {
        transitionFrameRef.current = null;
        setTransitionReady(true);
      });
      transitionFrameRef.current = () => video.cancelVideoFrameCallback(id);
    } else setTransitionReady(true);
  };
  const travelRef = useRef(travel); travelRef.current = travel;
  useEffect(() => {
    let wheelDelta = 0, lastWheel = 0, touchY = 0;
    const wheel = event => {
      if (stateRef.current.folderOpen || event.target.closest?.('.lanyard-canvas')?.style.cursor === 'grabbing') return;
      event.preventDefault();
      if (locked.current) return;
      if (performance.now() - lastWheel > 250) wheelDelta = 0;
      lastWheel = performance.now();
      wheelDelta += event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      if (Math.abs(wheelDelta) > 28) { travelRef.current(wheelDelta > 0 ? 'works' : 'home'); wheelDelta = 0; }
    };
    const key = event => {
      if (stateRef.current.folderOpen || event.target.closest?.('.lanyard') || !['ArrowDown','PageDown','ArrowUp','PageUp','Home','End',' '].includes(event.key)) return;
      if (['BUTTON','A','INPUT'].includes(document.activeElement?.tagName)) return;
      event.preventDefault();
      travelRef.current(['ArrowUp','PageUp','Home'].includes(event.key) ? 'home' : 'works');
    };
    const start = event => { touchY = event.target.closest?.('.lanyard') ? null : event.changedTouches[0].clientY; };
    const end = event => {
      if (stateRef.current.folderOpen || touchY === null) return;
      const delta = touchY - event.changedTouches[0].clientY;
      if (Math.abs(delta) > 55) travelRef.current(delta > 0 ? 'works' : 'home');
    };
    window.addEventListener('wheel', wheel, { passive: false }); window.addEventListener('keydown', key);
    window.addEventListener('touchstart', start, { passive: true }); window.addEventListener('touchend', end, { passive: true });
    return () => { window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key); window.removeEventListener('touchstart', start); window.removeEventListener('touchend', end); };
  }, []);
  const navigate = (event, target) => { event.preventDefault(); travel(target); };

  return <main className="scroll-story">
    <div className={`scene-stage ${motion === 'returning' ? 'is-returning' : ''}`} inert={!entered ? true : undefined} style={{ backgroundImage: `url("${asset('images/background.png')}")` }}>
      <div className="character-field" style={{ opacity: scene === 'home' ? 1 : 0 }}>
        <RippleDistortion src={asset('frames/1280/up/01.webp?v=bt709-3')} fallbackSrc={asset(worksVisible ? 'images/workstation.png' : 'images/hero-poster.png')}
          mediaRef={mediaRef} brushSize={80} strength={.055} swirl={2.05} rings={3.75} grayscale={false}
          spread={6.5} fade={.9} spacing={8} dispersion={.5} tintAmount={0} quality="low" portraitFraming
          enabled={entered && trailEnabled && homeVisible && !folderOpen && !reducedMotion} active={homeVisible && !folderOpen} onLoadProgress={setHeroLoad} />
      </div>
      <video className={`scene-video ${!reducedMotion && (transitionReady || worksVisible) ? 'is-visible' : ''}`} ref={transitionRef}
        src={asset('videos/transition.mp4')} poster={asset('images/transition-poster.png')} muted playsInline preload="auto" aria-hidden="true"
        onPlaying={revealTransition} onEnded={() => finishTravel('works')} />
      {reducedMotion && <img className="reduced-scene" src={asset(worksVisible ? 'images/workstation.png' : 'images/hero-poster.png')} alt="" />}
      <div className={`scene-vignette ${homeVisible ? 'is-home' : ''}`} aria-hidden="true" />
      <header className="site-header" inert={folderOpen ? true : undefined}>
        <a href="#home" className="wordmark" onClick={event => navigate(event, 'home')} aria-label="Lark-K 首页">Lark<span>-</span>K</a>
        <nav aria-label="主导航"><a href="#home" className={scene === 'home' ? 'is-active' : ''} aria-current={scene === 'home' ? 'page' : undefined} onClick={event => navigate(event, 'home')}>初次见面</a>
          <a href="#works" className={scene === 'works' ? 'is-active' : ''} aria-current={scene === 'works' ? 'page' : undefined} onClick={event => navigate(event, 'works')}>作品文件夹</a></nav>
        <div className="header-signature"><strong>AI & BACKEND DEVELOPER</strong><span>A curious mind. A world of ideas.</span></div>
      </header>
      <section id="home" className={`hero-content ${homeVisible ? 'is-visible' : ''}`} aria-label="初次见面" aria-hidden={!homeVisible} inert={!homeVisible || motion === 'returning' ? true : undefined}
        onAnimationEnd={event => {
          if (motion === 'returning' && event.target.matches('.scroll-cue') && event.animationName === 'home-layer-reveal') {
            setMotion('idle'); locked.current = false;
          }
        }}>
        <div className="hero-left"><p className="eyebrow">Lark-K / CODE & A LITTLE CURIOSITY</p>
          <h1>{['BUILD.', 'CREATE.', 'EXPLORE.'].map(text => <ShinyText key={text} text={text} {...headingShine}
            active={entered && homeVisible && !folderOpen} disabled={reducedMotion} />)}</h1>
          <div className="hero-intro"><p>嗨，我是梁科。</p><p>把藏不住的好奇，写成触手可及的作品。</p></div>
          <StarBorder as="a" className="pill-link" href="#works" onClick={event => navigate(event, 'works')}
            color="#ffffff" trailColor="#ffffff" duration={6} direction="clockwise" stars={2}
            trailLength={.3} thickness={1} radius={12} glow={.6} hover="lap" sparkle clickPulse theme="dark"
            backgroundColor="#566149" textColor="#f5f2df" borderColor="rgba(245, 242, 223, .4)"
            active={entered && scene === 'home' && !folderOpen} reducedMotion={reducedMotion}>
            走进我的创作世界 <span><ArrowUpRight size={21} weight="bold" /></span>
          </StarBorder>
        </div>
        <aside className="hello"><h2>HELLO, YOU.</h2><p>移动鼠标，我会看向你的位置。</p><span>{directionLabels[direction]}</span></aside>
        <a href="#works" className="scroll-cue" onClick={event => navigate(event, 'works')}><span>SCROLL TO EXPLORE</span><ArrowDown size={24} /></a>
        <p className="hero-footnote">好奇，是一切创造的开始。<br /><span>CODE WITH CURIOSITY. CREATE WITH HEART.</span></p>
      </section>
      <aside className={`hero-lanyard ${homeVisible ? 'is-visible' : ''}`} aria-label="梁科互动名牌，翻面查看个人信息" aria-hidden={!homeVisible} inert={!homeVisible || motion === 'returning' ? true : undefined}>
        <Suspense fallback={<img className="lanyard-placeholder" src={asset('images/lanyard-front.svg')} alt="梁科，后端开发、AI 应用开发" />}>
          <Lanyard key={String(reducedMotion)} frontImage={asset('images/lanyard-front.svg')} backImage={asset('images/lanyard-back.svg')}
            strapImage={asset('images/lanyard-strap.svg')} cardColor="#f5f0da" strapColor="#343e2b"
            size={.52} strapLength={.38} strapWidth={.8} finish="glossy" metal="gold"
            breeze={reducedMotion ? 0 : .7} breezeSpeed={1.6} damping={.65} elasticity={.35} intro={!reducedMotion}
            active={homeVisible} interactive={entered && homeVisible && motion === 'idle'} onReady={() => setBadgeReady(true)} />
        </Suspense>
        <p className="lanyard-hint">拖动玩一玩 · 翻面查看个人信息</p>
      </aside>
      <section id="works" className={`works-content ${worksVisible ? 'is-visible' : ''} ${folderOpen ? 'has-expanded-folder' : ''}`} aria-label="作品文件夹" aria-hidden={!worksVisible} inert={!worksVisible ? true : undefined}>
        <div className="works-sidebar">
          <div className="works-title"><p className="eyebrow"><strong>02</strong> THE PORTFOLIO / 作品文件夹</p><h2><ShinyText text="MY PORTFOLIO." {...headingShine}
            active={entered && worksVisible && !folderOpen} disabled={reducedMotion} /></h2>
            <p className="works-description">把 AI、代码与探索，<br />装进我的作品文件夹。</p></div>
          <div className="folder-position"><FolderPreview onOpenChange={setFolderOpen} reducedMotion={reducedMotion} /></div>
        </div>
        <p className="works-categories">AI PLATFORM · AI AGENT<br />QUANT · SMART ENERGY</p>
        <p className="works-footnote"><ArrowUpRight size={17} /> 小小文件夹，装着大大的好奇。</p>
      </section>
      {!reducedMotion && <button inert={folderOpen ? true : undefined} className={`trail-toggle ${trailEnabled ? 'is-on' : ''}`} aria-label={trailEnabled ? '关闭鼠标水波效果' : '开启鼠标水波效果'} aria-pressed={trailEnabled} onClick={() => setTrailEnabled(value => !value)}><Sparkle size={18} /><span>RIPPLE {trailEnabled ? 'ON' : 'OFF'}</span></button>}
      <div className="page-index" aria-hidden="true"><span>{scene === 'works' ? '02' : '01'}</span><span className="index-line" /><span>02</span></div>
    </div>
    {!entered && <div className={`startup-transition ${prepared ? 'is-ready' : ''}`} role="status" aria-live="polite" aria-label={`首页资源加载中，${loadPercent}%`}>
      <div className="startup-background" aria-hidden="true"><Suspense fallback={null}>
        <GridScan sensitivity={.55} lineThickness={1} linesColor="#2F293A" gridScale={.1}
          scanColor="#FF9FFC" scanOpacity={.4} enablePost bloomIntensity={.6}
          chromaticAberration={.002} noiseIntensity={.01} scanDelay={.3} reducedMotion={reducedMotion} />
      </Suspense></div>
      <div className="startup-mark">Lark<span>-</span>K</div>
      <div className="startup-copy"><span>好奇，即将开始。</span><span aria-hidden="true">{String(loadPercent).padStart(2, '0')}%</span></div>
      <div className="startup-track" aria-hidden="true"><span style={{ transform: `scaleX(${loadPercent / 100})` }} /></div>
    </div>}
  </main>;
}
