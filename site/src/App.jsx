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
import ProjectGallery from './components/ProjectGallery';
import StarBorder from './components/StarBorder';
import ShinyText from './components/ShinyText';
import Biography from './components/Biography';
import { SCENES, nextStoryStep } from './lib/biography';
import { asset, pointerDirection } from './lib/interaction';
import { createHeroFramePlayer } from './lib/heroFrames';

const directionLabels = { default: 'LOOKING AT YOU', up: 'LOOKING UP', down: 'LOOKING DOWN', left: 'LOOKING LEFT', right: 'LOOKING RIGHT' };
const Lanyard = lazy(() => import('./components/Lanyard'));
const GridScan = lazy(() => import('./components/GridScan').then(module => ({ default: module.GridScan })));
const headingShine = { color: '#f5f2df', shineColor: '#ffffff', shineAccent: '#eac17c', speed: 2, shineWidth: 40, softness: .8, trigger: 'loop', direction: 'right' };

export function App() {
  const heroFrameRef = useRef(null), transitionRef = useRef(null), biographyVideoRef = useRef(null), mediaRef = useRef(null);
  const playerRef = useRef(null), locked = useRef(false), stateRef = useRef({});
  const transitionFrameRef = useRef(null);
  const [scene, setScene] = useState(() => {
    const requested = window.location.hash.slice(1);
    return SCENES.includes(requested) ? requested : 'home';
  });
  const [motion, setMotion] = useState('idle');
  const [transitionReady, setTransitionReady] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState('biography');
  const [transitionClip, setTransitionClip] = useState('biography');
  const [biographyIndex, setBiographyIndex] = useState(0);
  const chapterChangedAt = useRef(0);
  const [direction, setDirection] = useState('default');
  const [folderOpen, setFolderOpen] = useState(false);
  const [trailEnabled, setTrailEnabled] = useState(true);
  const [heroLoad, setHeroLoad] = useState({ decoded: 0, uploaded: 0, total: 125, ready: false });
  const [badgeReady, setBadgeReady] = useState(false);
  const [badgeActive, setBadgeActive] = useState(false);
  const [entered, setEntered] = useState(false);
  const prepared = heroLoad.ready && badgeReady;
  const loadPercent = Math.min(100, Math.round((heroLoad.decoded / heroLoad.total * .55 + heroLoad.uploaded / heroLoad.total * .35 + (badgeReady ? .1 : 0)) * 100));
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  stateRef.current = { scene, motion, folderOpen, reducedMotion, direction, entered, biographyIndex, transitionTarget };
  // Content enters when navigation starts. Completing (or chaining) a video
  // must keep the same content scene so its entrance never restarts.
  const contentScene = motion === 'bridging' || motion === 'forward' ? transitionTarget : scene;
  const worksVisible = contentScene === 'works';
  const biographyVisible = contentScene === 'biography';
  const homeVisible = contentScene === 'home';
  const homeBackdropVisible = scene === 'home' && motion !== 'forward';
  const worksSettled = ['works', 'preview'].includes(scene) && motion === 'idle';
  const previewVisible = contentScene === 'preview';

  useEffect(() => {
    if (!entered || !homeVisible) { setBadgeActive(false); return; }
    // Start the physical drop with the badge's slot in the page entrance.
    const timer = window.setTimeout(() => setBadgeActive(true), reducedMotion ? 0 : 680);
    return () => window.clearTimeout(timer);
  }, [entered, homeVisible, reducedMotion]);

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
    chapterChangedAt.current = performance.now();
    if (target === 'home') {
      setDirection('default'); setTransitionReady(false);
      transitionRef.current.pause(); biographyVideoRef.current.pause(); playerRef.current.reset(); mediaRef.current = heroFrameRef.current;
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
    // Each clip starts from its actual preceding scene, including direct home-to-works visits.
    if (target === 'home' || state.reducedMotion || (['works', 'preview'].includes(state.scene) && ['works', 'preview'].includes(target))) {
      transitionRef.current.pause(); biographyVideoRef.current.pause();
      finishTravel(target); return;
    }
    if (state.scene !== 'home' && !['works', 'preview'].includes(target)) {
      transitionRef.current.pause(); biographyVideoRef.current.pause();
      setTransitionReady(false); finishTravel(target); return;
    }
    setDirection('default'); setTransitionTarget(target);
    setTransitionReady(false); setMotion('bridging');
    const run = () => {
      const clip = state.scene === 'home' ? 'biography' : 'works';
      setTransitionClip(clip);
      const video = clip === 'biography' ? biographyVideoRef.current : transitionRef.current;
      video.currentTime = 0; video.playbackRate = clip === 'biography' ? 2.4 : 2.7;
      setMotion('forward');
      video.play().catch(() => { setTransitionReady(false); finishTravel(target); });
    };
    if (state.scene === 'home') playerRef.current.returnToFront(run);
    else { biographyVideoRef.current.pause(); run(); }
  };
  const finishBiographyClip = () => {
    if (!['works', 'preview'].includes(transitionTarget)) { finishTravel('biography'); return; }
    transitionFrameRef.current?.(); transitionFrameRef.current = null;
    // Hold the biography end frame while the following clip presents its first frame.
    setScene('biography'); setTransitionReady(false); setTransitionClip('works');
    const video = transitionRef.current;
    video.currentTime = 0; video.playbackRate = 2.7;
    video.play().catch(() => { setTransitionReady(false); finishTravel(transitionTarget); });
  };
  const revealTransition = video => {
    if (!locked.current) return;
    transitionFrameRef.current?.();
    // Keep the frozen canvas visible until a fresh video frame is presented,
    // including repeat visits when the video previously held its last frame.
    if (video.requestVideoFrameCallback) {
      const id = video.requestVideoFrameCallback(() => {
        transitionFrameRef.current = null;
        if (!locked.current) return;
        setTransitionReady(true);
      });
      transitionFrameRef.current = () => video.cancelVideoFrameCallback(id);
    } else setTransitionReady(true);
  };
  const selectBiography = index => {
    if (locked.current) return;
    setBiographyIndex(index); chapterChangedAt.current = performance.now();
  };
  const stepStory = direction => {
    const state = stateRef.current;
    if (locked.current || state.folderOpen || !state.entered || performance.now() - chapterChangedAt.current < 650) return;
    const next = nextStoryStep(state.scene, state.biographyIndex, direction);
    setBiographyIndex(next.index); chapterChangedAt.current = performance.now();
    if (next.scene !== state.scene) travel(next.scene);
  };
  const stepStoryRef = useRef(stepStory); stepStoryRef.current = stepStory;
  const travelRef = useRef(travel); travelRef.current = travel;
  useEffect(() => {
    let wheelDelta = 0, lastWheel = 0, touchY = 0, gestureUsed = false;
    const wheel = event => {
      if (stateRef.current.folderOpen || event.target.closest?.('.circular-carousel, .project-detail') || event.target.closest?.('.lanyard-canvas')?.style.cursor === 'grabbing') return;
      const panel = event.target.closest?.('.biography-layout');
      if (panel && panel.scrollHeight > panel.clientHeight + 1 &&
        ((event.deltaY > 0 && panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2) || (event.deltaY < 0 && panel.scrollTop > 2))) return;
      event.preventDefault();
      if (performance.now() - lastWheel > 250) { wheelDelta = 0; gestureUsed = false; }
      lastWheel = performance.now();
      if (locked.current || gestureUsed) return;
      wheelDelta += event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      if (Math.abs(wheelDelta) > 28) { gestureUsed = true; stepStoryRef.current(wheelDelta > 0 ? 1 : -1); wheelDelta = 0; }
    };
    const key = event => {
      if (stateRef.current.folderOpen || event.target.closest?.('.lanyard, .project-gallery, .project-detail') || !['ArrowDown','PageDown','ArrowUp','PageUp','ArrowLeft','ArrowRight','Home','End',' '].includes(event.key)) return;
      if (['BUTTON','A','INPUT'].includes(document.activeElement?.tagName)) return;
      event.preventDefault();
      if (event.key === 'Home' || event.key === 'End') travelRef.current(event.key === 'Home' ? 'home' : 'preview');
      else stepStoryRef.current(['ArrowUp','PageUp','ArrowLeft'].includes(event.key) ? -1 : 1);
    };
    const start = event => {
      const panel = event.target.closest?.('.biography-layout');
      touchY = event.target.closest?.('.lanyard, .project-gallery, .project-detail') || (panel && panel.scrollHeight > panel.clientHeight) ? null : event.changedTouches[0].clientY;
    };
    const end = event => {
      if (stateRef.current.folderOpen || touchY === null) return;
      const delta = touchY - event.changedTouches[0].clientY;
      if (Math.abs(delta) > 55) stepStoryRef.current(delta > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', wheel, { passive: false }); window.addEventListener('keydown', key);
    window.addEventListener('touchstart', start, { passive: true }); window.addEventListener('touchend', end, { passive: true });
    return () => { window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key); window.removeEventListener('touchstart', start); window.removeEventListener('touchend', end); };
  }, []);
  const navigate = (event, target) => { event.preventDefault(); if (target === 'biography' && scene !== 'biography') setBiographyIndex(0); travel(target); };

  return <main className="scroll-story">
    <div className={`scene-stage ${entered ? 'is-entered' : ''} ${motion === 'returning' ? 'is-returning' : ''}`} inert={!entered ? true : undefined} style={{ backgroundImage: `url("${asset('images/background.png')}")` }}>
      <div className="character-field" style={{ opacity: scene === 'home' ? 1 : 0 }}>
        <RippleDistortion src={asset('frames/1280/up/01.webp?v=bt709-3')} fallbackSrc={asset(worksVisible ? 'images/workstation.png' : 'images/hero-poster.png')}
          mediaRef={mediaRef} brushSize={80} strength={.055} swirl={2.05} rings={3.75} grayscale={false}
          spread={6.5} fade={.9} spacing={8} dispersion={.5} tintAmount={0} quality="low" portraitFraming
          enabled={entered && trailEnabled && homeVisible && !folderOpen && !reducedMotion} active={!entered || (homeBackdropVisible && !folderOpen)} onLoadProgress={setHeroLoad} />
      </div>
      <img className={`scene-still works-scene ${worksSettled ? 'is-visible' : ''}`} src={asset('images/workstation-right.png')} alt=""
        onError={event => { const image = event.currentTarget; if (!image.src.endsWith('/images/works-end.png')) image.src = asset('images/works-end.png'); }} />
      {/* Reverse visits use the sharp original; forward visits retain the video's
          final frame so its slightly different pose never jumps after playback. */}
      <img className={`scene-still biography-scene ${scene === 'biography' && (motion !== 'forward' || !transitionReady) ? 'is-visible' : ''}`} src={asset('images/biography-welcome.png')} alt="" />
      <video className={`scene-video works-scene ${!reducedMotion && transitionReady && transitionClip === 'works' && (motion === 'forward' || worksSettled) ? 'is-visible' : ''}`} ref={transitionRef}
        src={asset('videos/biography-to-works.mp4')} poster={asset('images/biography-to-works-poster.png')} muted playsInline preload="auto" aria-hidden="true"
        onPlaying={event => revealTransition(event.currentTarget)} onEnded={() => finishTravel(transitionTarget)} />
      <video className={`scene-video biography-video ${!reducedMotion && transitionReady && transitionClip === 'biography' && (motion === 'forward' || (scene === 'biography' && motion === 'idle')) ? 'is-visible' : ''}`} ref={biographyVideoRef}
        src={asset('videos/home-to-biography.mp4')} poster={asset('images/biography-start.png')} muted playsInline preload="auto" aria-hidden="true"
        onPlaying={event => revealTransition(event.currentTarget)} onEnded={finishBiographyClip} />
      {reducedMotion && homeVisible && <img className="reduced-scene" src={asset('images/hero-poster.png')} alt="" />}
      <div className={`scene-vignette ${homeVisible ? 'is-home' : ''}`} aria-hidden="true" />
      {previewVisible && <div className="preview-shade" aria-hidden="true" />}
      <header key={contentScene} className="site-header" inert={folderOpen ? true : undefined}>
        <a href="#home" className="wordmark" onClick={event => navigate(event, 'home')} aria-label="Lark-K 首页">Lark<span>-</span>K</a>
        <nav aria-label="主导航"><a href="#home" className={contentScene === 'home' ? 'is-active' : ''} aria-current={contentScene === 'home' ? 'page' : undefined} onClick={event => navigate(event, 'home')}>初次见面</a>
          <a href="#biography" className={contentScene === 'biography' ? 'is-active' : ''} aria-current={contentScene === 'biography' ? 'page' : undefined} onClick={event => navigate(event, 'biography')}>个人履历</a>
          <a href="#works" className={contentScene === 'works' ? 'is-active' : ''} aria-current={contentScene === 'works' ? 'page' : undefined} onClick={event => navigate(event, 'works')}>作品文件夹</a>
          <a href="#preview" className={previewVisible ? 'is-active' : ''} aria-current={previewVisible ? 'page' : undefined} onClick={event => navigate(event, 'preview')}>作品预览</a></nav>
        <div className="header-signature"><strong>AI & BACKEND DEVELOPER</strong><span>A curious mind. A world of ideas.</span></div>
      </header>
      <section id="home" className={`hero-content ${homeVisible ? 'is-visible' : ''}`} aria-label="初次见面" aria-hidden={!homeVisible} inert={!homeVisible || motion === 'returning' ? true : undefined}
        onAnimationEnd={event => {
          if (motion === 'returning' && event.target.matches('.scroll-cue') && event.animationName === 'scene-layer-reveal') {
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
        <a href="#biography" className="scroll-cue" onClick={event => navigate(event, 'biography')}><span>SCROLL TO EXPLORE</span><ArrowDown size={24} /></a>
        <p className="hero-footnote">好奇，是一切创造的开始。<br /><span>CODE WITH CURIOSITY. CREATE WITH HEART.</span></p>
      </section>
      <aside className={`hero-lanyard ${homeVisible ? 'is-visible' : ''}`} aria-label="梁科互动名牌，翻面查看个人信息" aria-hidden={!homeVisible} inert={!homeVisible || motion === 'returning' ? true : undefined}>
        <Suspense fallback={<img className="lanyard-placeholder" src={asset('images/lanyard-front.svg')} alt="梁科，后端开发、AI 应用开发" />}>
          <Lanyard key={String(reducedMotion)} frontImage={asset('images/lanyard-front.svg')} backImage={asset('images/lanyard-back.svg')}
            strapImage={asset('images/lanyard-strap.svg')} cardColor="#f5f0da" strapColor="#343e2b"
            size={.52} strapLength={.38} strapWidth={.8} finish="glossy" metal="gold"
            breeze={reducedMotion ? 0 : .7} breezeSpeed={1.6} damping={.65} elasticity={.35} intro={!reducedMotion}
            active={badgeActive && entered && homeVisible} interactive={badgeActive && homeVisible && motion === 'idle'} onReady={() => setBadgeReady(true)} />
        </Suspense>
        <p className="lanyard-hint">拖动玩一玩 · 翻面查看个人信息</p>
      </aside>
      <Biography visible={biographyVisible} index={biographyIndex} onSelect={selectBiography}
        onNext={() => { const next = nextStoryStep('biography', biographyIndex, 1); if (next.scene === 'biography') selectBiography(next.index); else travel(next.scene); }}
        onPrevious={() => { const next = nextStoryStep('biography', biographyIndex, -1); if (next.scene === 'biography') selectBiography(next.index); else travel(next.scene); }} />
      <section id="works" className={`works-content ${worksVisible ? 'is-visible' : ''} ${folderOpen ? 'has-expanded-folder' : ''}`} aria-label="作品文件夹" aria-hidden={!worksVisible} inert={!worksVisible || motion !== 'idle' ? true : undefined}>
        <div className="works-sidebar">
          <div className="works-title"><p className="eyebrow"><strong>03</strong> THE PORTFOLIO / 作品文件夹</p><h2><ShinyText text="MY PORTFOLIO." {...headingShine}
            active={entered && worksVisible && !folderOpen} disabled={reducedMotion} /></h2>
            </div>
          <p className="works-description">把 AI、代码与探索，<br />装进我的作品文件夹。</p>
          <div className="folder-position"><FolderPreview onOpenChange={setFolderOpen} reducedMotion={reducedMotion} /></div>
        </div>
        <button className="works-preview-link" onClick={() => travel('preview')}>进入作品预览 <ArrowDown size={17} /></button>
        <p className="works-categories">AI PLATFORM · AI AGENT<br />QUANT · SMART ENERGY</p>
        <p className="works-footnote"><ArrowUpRight size={17} /> 小小文件夹，装着大大的好奇。</p>
      </section>
      {entered && previewVisible && motion === 'idle' && <ProjectGallery reducedMotion={reducedMotion} onBack={() => travel('works')} onOpenChange={setFolderOpen} />}
      {!reducedMotion && homeVisible && <button inert={folderOpen ? true : undefined} className={`trail-toggle ${trailEnabled ? 'is-on' : ''}`} aria-label={trailEnabled ? '关闭鼠标水波效果' : '开启鼠标水波效果'} aria-pressed={trailEnabled} onClick={() => setTrailEnabled(value => !value)}><Sparkle size={18} /><span>RIPPLE {trailEnabled ? 'ON' : 'OFF'}</span></button>}
      <div key={`index-${contentScene}`} className="page-index" aria-hidden="true"><span>{String(SCENES.indexOf(contentScene) + 1).padStart(2, '0')}</span><span className="index-line" /><span>04</span></div>
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
