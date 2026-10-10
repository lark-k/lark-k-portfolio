'use client';

// Adapted from the user-supplied React Bits JavaScript + CSS component.
// The optional mediaRef allows the same shader to distort paused video frames.
import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } from 'ogl';
import './RippleDistortion.css';
import HeroPoster from './HeroPoster';

const MAX_WAVES = 64;
// Four 32-frame tracks: keep a complete cycle resident to avoid re-uploading
// the same full-resolution images every time the pointer changes direction.
const MAX_FRAME_TEXTURES = 128;
const QUALITY_SCALE = { low: .4, medium: .7, high: 1 };
const START_SCALE = 1.5;
const LIFE_CONSTANT = Math.log(500);

const waveVertex = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;
varying vec2 vUv;
varying float vOpacity;
void main() {
  vUv = uv; vOpacity = iOpacity;
  gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
}`;
const waveFragment = `
precision highp float;
varying vec2 vUv;
varying float vOpacity;
uniform float uRings;
const float PI = 3.141592653589793;
const float EDGE = 0.006737947;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;
  float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);
  brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);
  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}`;
const screenVertex = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;
const compositeFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uTextureNext;
uniform float uFrameMix;
uniform sampler2D uDisplacement;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform float uPortraitFraming;
uniform vec2 uTexel;
uniform vec3 uTint;
uniform vec3 uHighlight;
uniform float uStrength;
uniform float uSwirl;
uniform float uDispersion;
uniform float uGlint;
uniform float uTintAmount;
uniform float uGrayscale;
const float TAU = 6.283185307179586;
vec3 sampleImage(vec2 uv) {
  vec3 primary = texture2D(uTexture, uv).rgb;
  if (uFrameMix < .001) {
    // A small, bounded detail correction counters linear upscale softness at
    // rest. Moving frames keep the cheaper continuous two-frame interpolation.
    if (max(uResolution.x / uTextureSize.x, uResolution.y / uTextureSize.y) > 1.05) {
      vec2 texel = 1.0 / uTextureSize;
      vec3 left = texture2D(uTexture, uv - vec2(texel.x, 0.0)).rgb;
      vec3 right = texture2D(uTexture, uv + vec2(texel.x, 0.0)).rgb;
      vec3 up = texture2D(uTexture, uv + vec2(0.0, texel.y)).rgb;
      vec3 down = texture2D(uTexture, uv - vec2(0.0, texel.y)).rgb;
      vec3 detail = primary + (primary - (left + right + up + down) * .25) * .3;
      return clamp(detail, min(primary, min(min(left, right), min(up, down))), max(primary, max(max(left, right), max(up, down))));
    }
    return primary;
  }
  return mix(primary, texture2D(uTextureNext, uv).rgb, uFrameMix);
}
vec2 coverUV(vec2 uv) {
  vec2 safe = max(uTextureSize, vec2(1.0));
  vec2 s = uResolution / safe;
  vec2 scaledSize = safe * max(s.x, s.y);
  vec2 offset = (uResolution - scaledSize) * .5;
  vec2 covered = (uv * uResolution - offset) / scaledSize;
  if (uPortraitFraming > .5 && s.x > s.y) {
    // Keep the central portrait proportional and farther back on wide screens.
    // Ease only the empty outer wall into the screen edges in this one image;
    // the works scene and its native transition video remain untouched.
    float pullback = min(s.x / s.y, 1.35);
    vec2 centered = (covered - .5) * pullback + .5;
    float edge = smoothstep(.28, .5, abs(uv.x - .5));
    centered.x -= sign(uv.x - .5) * (pullback - 1.0) * .5 * edge;
    return centered;
  }
  return covered;
}
void main() {
  float amount = texture2D(uDisplacement, vUv).r;
  vec2 base = coverUV(vUv);
  float theta = amount * uSwirl * TAU;
  vec2 dir = vec2(sin(theta), cos(theta));
  vec2 push = dir * amount * uStrength;
  vec3 color;
  if (uDispersion > .001 && amount > .0001) {
    float split = uDispersion * .25;
    color.r = sampleImage(base + push * (1.0 + split)).r;
    color.g = sampleImage(base + push).g;
    color.b = sampleImage(base + push * (1.0 - split)).b;
  } else { color = sampleImage(base + push); }
  if (uGrayscale > .001) {
    color = mix(color, vec3(dot(color, vec3(.2126, .7152, .0722))), uGrayscale);
  }
  if (uTintAmount > .001) {
    color = mix(color, color * uTint * 1.9, clamp(amount * 1.6, 0.0, 1.0) * uTintAmount);
  }
  if (uGlint > .001) {
    float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
    float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
    vec3 normal = normalize(vec3(-ex * 26.0, -ey * 26.0, 1.0));
    vec3 light = normalize(vec3(-.35, .55, 1.0));
    float raw = pow(max(dot(normal, light), 0.0), 22.0);
    float flatSpec = pow(max(light.z, 0.0), 22.0);
    color += uHighlight * clamp((raw - flatSpec) / max(1.0 - flatSpec, .0001), 0.0, 1.0) * uGlint;
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const hexToRGB = hex => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? [1, 1, 1] : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export default function RippleDistortion({ src, mediaRef, brushSize = 150, strength = .2, swirl = 1,
  rings = 4, spread = 5, fade = 3, spacing = 15, dispersion = 0, glint = 0,
  tint = '#a855f7', tintAmount = .1, grayscale = true, highlightColor = '#ffffff',
  trigger = 'hover', clickStrength = 2, quality = 'low', enabled = true, active = true,
  className = '', style, fallbackSrc, portraitFraming = false, onLoadProgress, }) {
  const mountRef = useRef(null);
  const configRef = useRef({});
  const uniformsRef = useRef(null);
  const [ready, setReady] = useState(false);
  configRef.current = { brushSize, spread, fade, spacing, clickStrength, trigger, enabled, active, onLoadProgress };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer;
    try { renderer = new Renderer({ alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance', dpr: Math.min(window.devicePixelRatio || 1, 1.5) }); }
    catch { return; }
    const gl = renderer.gl;
    if (!gl) return;
    gl.clearColor(0, 0, 0, 1);
    const canvas = gl.canvas;
    mount.appendChild(canvas);
    let disposed = false;
    let loaded = false;
    let dirty = true;
    const imageTexture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR,
      magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    const nextTexture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR,
      magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    const frameTextures = new Map();
    const getFrameTexture = bitmap => {
      let texture = frameTextures.get(bitmap);
      if (texture) return texture;
      else {
        texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR,
          magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
        texture.image = bitmap;
      }
      frameTextures.set(bitmap, texture);
      if (frameTextures.size > MAX_FRAME_TEXTURES) {
        const oldest = frameTextures.keys().next().value;
        gl.deleteTexture(frameTextures.get(oldest).texture);
        frameTextures.delete(oldest);
      }
      return texture;
    };
    const offsets = new Float32Array(MAX_WAVES * 2);
    const scales = new Float32Array(MAX_WAVES * 2);
    const opacities = new Float32Array(MAX_WAVES);
    const waves = Array.from({ length: MAX_WAVES }, () => ({ x: 0, y: 0, scale: START_SCALE,
      target: START_SCALE, size: 1, opacity: 0 }));
    let current = 0;
    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]) },
      uv: { size: 2, data: new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]) },
      iOffset: { instanced: 1, size: 2, data: offsets },
      iScale: { instanced: 1, size: 2, data: scales },
      iOpacity: { instanced: 1, size: 1, data: opacities },
    });
    const waveUniforms = { uRings: { value: rings } };
    const waveProgram = new Program(gl, { vertex: waveVertex, fragment: waveFragment,
      uniforms: waveUniforms, transparent: true, depthTest: false, depthWrite: false, cullFace: false });
    waveProgram.setBlendFunc(gl.ONE, gl.ONE);
    const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false });
    const displacementTarget = new RenderTarget(gl, { width: 2, height: 2, depth: false,
      minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    const compositeUniforms = {
      uTexture: { value: imageTexture }, uTextureNext: { value: nextTexture }, uFrameMix: { value: 0 }, uDisplacement: { value: displacementTarget.texture },
      uResolution: { value: [1,1] }, uTextureSize: { value: [1,1] }, uTexel: { value: [1,1] },
      uPortraitFraming: { value: portraitFraming ? 1 : 0 },
      uTint: { value: hexToRGB(tint) }, uHighlight: { value: hexToRGB(highlightColor) },
      uStrength: { value: strength }, uSwirl: { value: swirl }, uDispersion: { value: dispersion },
      uGlint: { value: glint }, uTintAmount: { value: tintAmount }, uGrayscale: { value: grayscale ? 1 : 0 },
    };
    const compositeProgram = new Program(gl, { vertex: screenVertex, fragment: compositeFragment,
      uniforms: compositeUniforms, depthTest: false, depthWrite: false });
    const triangle = new Triangle(gl);
    const compositeMesh = new Mesh(gl, { geometry: triangle, program: compositeProgram });
    uniformsRef.current = { wave: waveUniforms, composite: compositeUniforms };
    const image = new Image();
    image.crossOrigin = 'anonymous'; image.decoding = 'async';
    image.onload = () => {
      if (disposed) return;
      imageTexture.image = image;
      nextTexture.image = image;
      compositeUniforms.uTextureSize.value = [image.naturalWidth, image.naturalHeight];
      loaded = true;
      dirty = true;
    };
    image.src = src;
    let width = 1, height = 1, bounds, fieldDirty = true;
    const resize = () => {
      width = Math.max(1, mount.clientWidth); height = Math.max(1, mount.clientHeight);
      bounds = mount.getBoundingClientRect();
      renderer.setSize(width, height);
      compositeUniforms.uResolution.value = [width, height];
      const scale = QUALITY_SCALE[quality] || QUALITY_SCALE.low;
      const fieldW = Math.max(2, Math.round(width * scale)), fieldH = Math.max(2, Math.round(height * scale));
      displacementTarget.setSize(fieldW, fieldH);
      fieldDirty = true;
      compositeUniforms.uTexel.value = [1 / fieldW, 1 / fieldH];
      dirty = true;
    };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();
    const setNewWave = (x, y, power) => {
      const cfg = configRef.current, wave = waves[current]; current = (current + 1) % MAX_WAVES;
      Object.assign(wave, { x, y, scale: START_SCALE * power,
        target: START_SCALE * Math.max(1, cfg.spread) * power, size: Math.max(1, cfg.brushSize), opacity: 1 });
    };
    const localPoint = event => {
      const rect = bounds;
      if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null;
      return [event.clientX - rect.left, rect.height - (event.clientY - rect.top)];
    };
    let previousX = 0, previousY = 0, pendingPointer = null, lastPointerAt = 0;
    const onMove = event => {
      const cfg = configRef.current;
      if (!cfg.enabled || !cfg.active || reduceMotion || cfg.trigger === 'click' || event.pointerType === 'touch') return;
      pendingPointer = event;
      lastPointerAt = performance.now();
    };
    const onDown = event => {
      const cfg = configRef.current;
      if (!cfg.enabled || !cfg.active || reduceMotion || cfg.trigger === 'hover') return;
      const p = localPoint(event); if (p) setNewWave(p[0], p[1], Math.max(1, cfg.clickStrength));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    const onLost = event => { event.preventDefault(); setReady(false); };
    canvas.addEventListener('webglcontextlost', onLost);
    let raf = 0, previousTime = 0, notified = false, lastSource = null, lastVideoTime = -1;
    let lastFrame = null, lastNextFrame = null, lastMix = -1, rendered = 0, measureStart = performance.now();
    let warmIndex = 0, warmIdle = 0, warmAnimationFrame = false;
    let reportedProgress = '';
    const warmFrames = source => {
      if (!source?.bank || warmIdle || warmIndex >= source.bank.length || !window.requestIdleCallback) return;
      warmAnimationFrame = Boolean(source.ready && configRef.current.onLoadProgress);
      const schedule = warmAnimationFrame ? requestAnimationFrame : requestIdleCallback;
      warmIdle = schedule(deadline => {
        warmIdle = 0;
        if (disposed || document.hidden || !configRef.current.active || gl.isContextLost() ||
            performance.now() - lastPointerAt < 120 || (!warmAnimationFrame && deadline.timeRemaining() < 6)) return;
        // One upload per idle slot: no synchronous bulk upload on first hover.
        while (warmIndex < source.bank.length) {
          const bitmap = source.bank[warmIndex++];
          if (frameTextures.has(bitmap)) continue;
          getFrameTexture(bitmap).update();
          break;
        }
      });
    };
    const loop = now => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || !configRef.current.active || !loaded || gl.isContextLost()) return;
      const delta = previousTime ? Math.min(.05, (now - previousTime) / 1000) : 0; previousTime = now;
      const source = mediaRef?.current;
      warmFrames(source);
      if (source?.bank) {
        const progressKey = `${source.bank.length}:${frameTextures.size}:${source.ready}`;
        if (progressKey !== reportedProgress) {
          reportedProgress = progressKey;
          configRef.current.onLoadProgress?.({ decoded: source.bank.length, uploaded: frameTextures.size,
            total: 125, ready: source.ready && frameTextures.size === source.bank.length });
        }
      }
      if (source?.image) {
        dirty ||= lastFrame !== source.image || lastNextFrame !== source.next || Math.abs(lastMix - source.mix) > .0001;
        if (lastFrame !== source.image) compositeUniforms.uTexture.value = getFrameTexture(source.image);
        if (lastNextFrame !== source.next) compositeUniforms.uTextureNext.value = getFrameTexture(source.next);
        compositeUniforms.uFrameMix.value = source.mix || 0;
        compositeUniforms.uTextureSize.value[0] = source.image.width;
        compositeUniforms.uTextureSize.value[1] = source.image.height;
        lastFrame = source.image; lastNextFrame = source.next; lastMix = source.mix;
        lastSource = null;
      }
      if (source && source.readyState >= 2 && (source !== lastSource || source.currentTime !== lastVideoTime)) {
        imageTexture.image = source; imageTexture.needsUpdate = true;
        compositeUniforms.uTexture.value = imageTexture;
        dirty = true;
        compositeUniforms.uFrameMix.value = 0;
        compositeUniforms.uTextureSize.value = [source.videoWidth || 1, source.videoHeight || 1];
        lastSource = source; lastVideoTime = source.currentTime;
      }
      const cfg = configRef.current;
      if (pendingPointer) {
        const p = localPoint(pendingPointer);
        if (p && cfg.enabled && Math.hypot(p[0] - previousX, p[1] - previousY) > Math.max(1, cfg.spacing)) {
          setNewWave(p[0], p[1], 1); [previousX, previousY] = p;
        }
        pendingPointer = null;
      }
      const growth = reduceMotion ? 0 : 1 - Math.exp(-delta * 1.09);
      const decay = reduceMotion ? 1 : Math.exp(-delta * LIFE_CONSTANT / Math.max(.15, cfg.fade));
      let wavesChanged = false;
      for (let i = 0; i < MAX_WAVES; i++) {
        const wave = waves[i];
        if (wave.opacity <= 0) { opacities[i] = 0; scales[i*2] = scales[i*2+1] = 0; continue; }
        wavesChanged = true;
        wave.opacity *= decay; wave.scale += (wave.target - wave.scale) * growth;
        if (wave.opacity < .002) { wave.opacity = 0; opacities[i] = 0; scales[i*2] = scales[i*2+1] = 0; continue; }
        const half = wave.scale * wave.size / 2;
        offsets[i*2] = wave.x / width * 2 - 1; offsets[i*2+1] = wave.y / height * 2 - 1;
        scales[i*2] = half / width * 2; scales[i*2+1] = half / height * 2; opacities[i] = wave.opacity;
      }
      if (now - measureStart > 1000) {
        canvas.dataset.renderFps = String(Math.round(rendered * 1000 / (now - measureStart)));
        rendered = 0; measureStart = now;
      }
      if (!dirty && !wavesChanged && notified) return;
      if (wavesChanged) geometry.attributes.iOffset.needsUpdate = geometry.attributes.iScale.needsUpdate = geometry.attributes.iOpacity.needsUpdate = true;
      if (wavesChanged || fieldDirty) {
        renderer.render({ scene: waveMesh, target: displacementTarget, clear: true, update: false, sort: false, frustumCull: false });
        fieldDirty = false;
      }
      renderer.render({ scene: compositeMesh, clear: false, update: false, sort: false, frustumCull: false });
      dirty = false; rendered++;
      if (!notified) { notified = true; setReady(true); }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); image.onload = null;
      if (warmIdle) { if (warmAnimationFrame) cancelAnimationFrame(warmIdle); else cancelIdleCallback(warmIdle); }
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('webglcontextlost', onLost); uniformsRef.current = null;
      geometry.remove(); triangle.remove(); waveProgram.remove(); compositeProgram.remove();
      gl.deleteTexture(imageTexture.texture); gl.deleteTexture(nextTexture.texture); gl.deleteTexture(displacementTarget.texture.texture);
      frameTextures.forEach(texture => gl.deleteTexture(texture.texture)); frameTextures.clear();
      gl.deleteFramebuffer(displacementTarget.buffer);
      if (canvas.parentNode === mount) mount.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // Shader values update below without recreating the GL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, quality, mediaRef]);

  useEffect(() => {
    const u = uniformsRef.current; if (!u) return;
    u.wave.uRings.value = rings;
    Object.assign(u.composite.uStrength, { value: strength });
    u.composite.uSwirl.value = swirl; u.composite.uDispersion.value = dispersion;
    u.composite.uGlint.value = glint; u.composite.uTintAmount.value = tintAmount;
    u.composite.uGrayscale.value = grayscale ? 1 : 0;
    u.composite.uPortraitFraming.value = portraitFraming ? 1 : 0;
    u.composite.uHighlight.value = hexToRGB(highlightColor); u.composite.uTint.value = hexToRGB(tint);
  }, [rings, strength, swirl, dispersion, glint, tintAmount, grayscale, highlightColor, tint, portraitFraming]);

  return <div className={`ripple-distortion ${ready ? 'is-ready' : ''} ${className}`.trim()} style={style}>
    {portraitFraming ? <HeroPoster src={src} /> : <img className="ripple-fallback" src={fallbackSrc || src} alt="" />}
    <div className="ripple-canvas" ref={mountRef} aria-hidden="true" />
  </div>;
}
