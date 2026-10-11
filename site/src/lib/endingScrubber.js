export const endingScrollSpan = height => Math.max(1000, height * 2.2);

// Keep native decoding serialized: a fast wheel gesture replaces the desired
// frame instead of queuing every intermediate seek.
export function createEndingScrubber(video, { onReady, onProgress, onComplete }, clock = {
  request: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id),
}) {
  let desired = 0, frame = null, previousTime = null;
  let disposed = false, ready = false, completed = false;
  video.pause();
  video.currentTime = 0;
  const wake = () => {
    if (!disposed && !completed && frame === null) frame = clock.request(tick);
  };
  const tick = time => {
    frame = null;
    if (disposed || completed) return;
    const dt = previousTime === null ? 1 / 60 : Math.min(.05, (time - previousTime) / 1000);
    previousTime = time;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || video.readyState < 2 || video.seeking) {
      wake(); return;
    }
    if (!ready) { ready = true; onReady(); }
    onProgress(Math.min(1, video.currentTime / duration));
    // Do not reveal copy until the requested final frame has actually decoded.
    if (desired === 1 && video.currentTime >= duration - .025) {
      completed = true; video.pause(); onProgress(1); onComplete(); return;
    }
    const target = desired * Math.max(0, duration - .005);
    const gap = target - video.currentTime;
    if (Math.abs(gap) > .006) {
      video.currentTime = Math.abs(gap) < .03 ? target : video.currentTime + gap * (1 - Math.exp(-28 * dt));
      wake();
    } else previousTime = null;
  };
  video.addEventListener('loadeddata', wake);
  video.addEventListener('seeked', wake);
  wake();
  return {
    setProgress(value) { desired = Math.max(0, Math.min(1, value)); wake(); },
    dispose() {
      disposed = true;
      if (frame !== null) clock.cancel(frame);
      video.removeEventListener('loadeddata', wake);
      video.removeEventListener('seeked', wake);
      video.pause();
    },
  };
}
