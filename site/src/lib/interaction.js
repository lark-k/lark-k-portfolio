export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const smoothstep = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const HERO_TIMES = { default: 0, up: 1.7, down: 4.2, left: 6.7, right: 9.3 };

export const HERO_SEGMENTS = {
  up: { start: 0, hold: 1.12, end: 2.5 },
  down: { start: 2.5, hold: 3.6, end: 5.5 },
  left: { start: 5.5, hold: 6.75, end: 8.5 },
  right: { start: 8.5, hold: 9.5, end: 11.7 },
};

// Play each real motion continuously. Only seek between matching frontal poses.
// Rapid pointer changes replace the pending direction instead of interrupting a frame.
export function createHeroPlayer(video) {
  let requested = 'default', current = 'default', phase = 'idle';
  let frame = 0, disposed = false, neutralCallback = null;
  const play = () => video.play().catch(() => {});
  const begin = direction => {
    const segment = HERO_SEGMENTS[direction];
    if (!segment || video.readyState < 2 || disposed) return;
    current = direction; phase = 'out';
    video.pause(); video.currentTime = segment.start;
    video.playbackRate = 2.1;
    play();
  };
  const returnFront = () => { phase = 'return'; video.playbackRate = 2.6; play(); };
  const tick = () => {
    if (disposed) return;
    if (phase === 'idle' && requested !== 'default') begin(requested);
    if (phase === 'hold' && requested !== current) returnFront();
    if (phase === 'out' && requested !== current) returnFront();
    const segment = HERO_SEGMENTS[current];
    if (segment && phase === 'out' && video.currentTime >= segment.hold) { video.pause(); phase = 'hold'; }
    if (segment && phase === 'return' && video.currentTime >= segment.end) {
      video.pause(); phase = 'idle'; current = 'default';
      if (requested !== 'default') begin(requested);
      else if (neutralCallback) { const callback = neutralCallback; neutralCallback = null; callback(); }
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return {
    request(direction) { requested = HERO_SEGMENTS[direction] ? direction : 'default'; },
    returnToFront(callback) {
      requested = 'default';
      if (phase === 'idle') callback();
      else { neutralCallback = callback; returnFront(); }
    },
    reset() { requested = current = 'default'; phase = 'idle'; video.pause(); video.currentTime = 0; },
    dispose() { disposed = true; cancelAnimationFrame(frame); video.pause(); neutralCallback = null; },
  };
}

export function pointerDirection(x, y, width, height) {
  const dx = (x / width - .5) * 2;
  const dy = (y / height - .5) * 2;
  if (Math.hypot(dx, dy) < .25) return 'default';
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}

// Video seeks are serialized; intermediate scroll events never build a queue.
export function createVideoSeeker(video) {
  let desired = 0;
  let disposed = false;
  const apply = () => {
    if (disposed || video.readyState < 1 || video.seeking) return;
    const target = clamp(desired, 0, Math.max(0, (video.duration || 0) - .035));
    if (Math.abs(video.currentTime - target) > .025) video.currentTime = target;
  };
  video.addEventListener('loadedmetadata', apply);
  video.addEventListener('seeked', apply);
  return {
    seek(time) { desired = Math.max(0, time); apply(); },
    dispose() { disposed = true; video.removeEventListener('loadedmetadata', apply); video.removeEventListener('seeked', apply); },
  };
}

export const asset = path => `${import.meta.env.BASE_URL}assets/${path}`;
