import { useEffect, useRef } from 'react';

// Match coverUV in RippleDistortion, including its bounded wall-only reframing.
export default function HeroPoster({ src }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, context = canvas.getContext('2d');
    const image = new Image();
    image.decoding = 'async';
    let disposed = false;
    const paint = () => {
      if (disposed || !image.naturalWidth || !context) return;
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sx = width / image.naturalWidth, sy = height / image.naturalHeight;
      const scale = Math.max(sx, sy), pullback = sx > sy ? Math.min(sx / sy, 1.35) : 1;
      const spanY = height / (image.naturalHeight * scale) * pullback;
      const left = u => {
        const t = Math.max(0, Math.min(1, (Math.abs(u - .5) - .28) / .22));
        const edge = t * t * (3 - 2 * t);
        return (.5 + (u - .5) * width / (image.naturalWidth * scale) * pullback
          - Math.sign(u - .5) * (pullback - 1) * .5 * edge) * image.naturalWidth;
      };
      for (let i = 0; i < 256; i++) {
        const x = left(i / 256), next = left((i + 1) / 256);
        context.drawImage(image, x, (1 - spanY) * image.naturalHeight / 2, next - x, spanY * image.naturalHeight,
          i * width / 256, 0, width / 256, height);
      }
    };
    image.onload = paint; image.src = src;
    const observer = new ResizeObserver(paint); observer.observe(canvas);
    return () => { disposed = true; image.onload = null; observer.disconnect(); };
  }, [src]);
  return <canvas ref={ref} className="ripple-fallback" aria-hidden="true" />;
}
