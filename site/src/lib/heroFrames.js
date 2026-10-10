import { asset, clamp } from './interaction';
import { advanceHeroMotion, createHeroMotion, HERO_DIRECTIONS } from './heroMotion';

// The pointer animates decoded frames directly; video seeking is never on its path.
export function createHeroFramePlayer(onFrame) {
  const frames = {};
  const controller = new AbortController();
  const width = 1280;
  let disposed = false, ready = false;
  const motion = createHeroMotion();
  let raf = 0, lastTime = 0, paused = false;
  const allBitmaps = [];
  const idle = () => new Promise(resolve => {
    if (window.requestIdleCallback) window.requestIdleCallback(resolve, { timeout: 200 });
    else window.setTimeout(resolve, 16);
  });
  const decode = async (direction, index) => {
    const response = await fetch(asset(`frames/${width}/${direction}/${String(index + 1).padStart(2,'0')}.webp?v=bt709-3`), { signal: controller.signal });
    if (!response.ok) throw new Error('Frame unavailable');
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'flipY' });
    if (disposed) { bitmap.close(); return null; }
    allBitmaps.push(bitmap); return bitmap;
  };
  const load = async () => {
    // Present the shared neutral pose first; do not gate the homepage on 90 MB.
    const neutral = await decode('up', 0);
    if (!neutral || disposed) return;
    for (const direction of HERO_DIRECTIONS) frames[direction] = Array(32).fill(null).map((_, i) => i === 0 ? neutral : null);
    ready = true; render(); wake();
    // Bootstrap all directions, then refine them without disabling pointer input.
    const anchors = [31, 8, 16, 24];
    const jobs = anchors.flatMap(index => HERO_DIRECTIONS.map(direction => ({ direction, index, anchor: true })))
      .concat(HERO_DIRECTIONS.flatMap(direction => Array.from({ length: 31 }, (_, i) => ({ direction, index: i + 1 })).filter(job => !anchors.includes(job.index))));
    const worker = async () => {
      while (jobs.length && !disposed) {
        await idle();
        if (disposed || !jobs.length) return;
        const bootstrapping = jobs.some(job => job.anchor);
        const preferred = jobs.findIndex(job => job.direction === motion.requested && (!bootstrapping || job.anchor));
        const { direction, index } = jobs.splice(preferred < 0 ? 0 : preferred, 1)[0];
        const bitmap = await decode(direction, index);
        if (!bitmap || disposed) return;
        frames[direction][index] = bitmap;
        if (direction === motion.current || direction === motion.requested) { render(); wake(); }
      }
    };
    // A global limit, rather than four workers for each of four tracks.
    await Promise.all(Array.from({ length: 4 }, worker));
    if (!disposed) { frame.ready = true; render(); wake(); }
  };
  load().catch(() => {});
  const frame = { image: null, next: null, mix: 0, bank: allBitmaps, ready: false };
  const render = () => {
    const track = frames[motion.current];
    if (!track) return;
    const position = clamp(motion.pose) * 31;
    let lower = Math.floor(position), upper = Math.ceil(position);
    while (lower > 0 && !track[lower]) lower--;
    while (upper < 31 && !track[upper]) upper++;
    if (!track[upper]) upper = lower;
    frame.image = track[lower]; frame.next = track[upper]; frame.mix = upper === lower ? 0 : (position - lower) / (upper - lower);
    onFrame(frame);
  };
  const tick = now => {
    raf = 0;
    if (disposed || paused || document.hidden || !ready) return;
    const delta = lastTime ? Math.min(.05, (now - lastTime) / 1000) : 0; lastTime = now;
    const moving = advanceHeroMotion(motion, delta);
    render();
    if (moving) raf = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (raf || disposed || paused || !ready || document.hidden) return;
    lastTime = performance.now(); raf = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', wake);
  return {
    request(direction) {
      const requested = HERO_DIRECTIONS.includes(direction) ? direction : 'default';
      if (requested === motion.requested) return;
      motion.requested = requested; wake();
    },
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; },
    reset() { paused = false; Object.assign(motion, createHeroMotion()); if (ready) render(); },
    dispose() { disposed = true; controller.abort(); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', wake); allBitmaps.forEach(bitmap => bitmap.close()); },
  };
}
