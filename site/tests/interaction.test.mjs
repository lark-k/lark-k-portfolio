import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pointerDirection, smoothstep, createVideoSeeker } from '../src/lib/interaction.js';
import { advanceHeroMotion, createHeroMotion, HERO_DIRECTIONS } from '../src/lib/heroMotion.js';
import { BIOGRAPHY, nextStoryStep } from '../src/lib/biography.js';

test('scene end frames, transition poster and right-positioned fallback are available', () => {
  for (const name of ['works-end.png', 'biography-end.png', 'workstation-right.png', 'biography-to-works-poster.png']) {
    const file = readFileSync(new URL(`../public/assets/images/${name}`, import.meta.url));
    assert.equal(file.subarray(1, 4).toString(), 'PNG', `${name} must be a real PNG, not an HTML fallback`);
    assert.ok(file.readUInt32BE(16) >= 1280, `${name} must contain the full-resolution scene`);
    assert.ok(file.readUInt32BE(20) >= 720);
  }
});

test('the five requested resume entries precede works and reverse navigation preserves the last chapter', () => {
  assert.deepEqual(BIOGRAPHY.map(item => item.id), ['internship', 'masters', 'bachelors', 'zero-code', 'super-agent']);
  let position = nextStoryStep('home', 0, 1);
  assert.deepEqual(position, { scene: 'biography', index: 0 });
  for (let index = 1; index < 5; index++) {
    position = nextStoryStep(position.scene, position.index, 1);
    assert.deepEqual(position, { scene: 'biography', index });
  }
  assert.equal(nextStoryStep(position.scene, position.index, 1).scene, 'works');
  assert.deepEqual(nextStoryStep('works', 0, -1), { scene: 'biography', index: 4 });
  for (let index = 3; index >= 0; index--) {
    position = nextStoryStep(position.scene, position.index, -1);
    assert.deepEqual(position, { scene: 'biography', index });
  }
  assert.equal(nextStoryStep('biography', 0, -1).scene, 'home');
  assert.equal(nextStoryStep('home', 0, -1).scene, 'home');
  assert.equal(nextStoryStep('works', 4, 1).scene, 'works');
});

test('rapid direction changes keep position and velocity continuous, then settle on the latest request', () => {
  const motion = createHeroMotion();
  for (const direction of ['left', 'up', 'right', 'down', 'left', 'right']) {
    const before = { ...motion };
    motion.requested = direction;
    assert.equal(motion.pose, before.pose);
    assert.equal(motion.velocity, before.velocity);
    for (let i = 0; i < 8; i++) {
      const previous = { ...motion };
      advanceHeroMotion(motion, 1 / 120);
      assert.ok(Number.isFinite(motion.velocity));
      assert.ok(motion.pose >= 0 && motion.pose <= 1.01);
      if (motion.current !== previous.current) {
        assert.equal(motion.current, direction);
        assert.ok(motion.velocity > 0, 'Crossing the front must preserve motion instead of pausing');
        assert.ok(motion.pose < .15, 'A direction change must cross the frontal pose');
      }
    }
  }
  for (let i = 0; i < 240; i++) advanceHeroMotion(motion, 1 / 120);
  assert.equal(motion.current, 'right');
  assert.equal(motion.pose, 1);
  assert.equal(motion.velocity, 0);
  assert.equal(advanceHeroMotion(motion, 1 / 120), false);
});

test('all four motion tracks return to rest and are consistent at 60 and 120 Hz', () => {
  for (const direction of HERO_DIRECTIONS) {
    const slow = createHeroMotion(), fast = createHeroMotion();
    slow.requested = fast.requested = direction;
    for (let i = 0; i < 30; i++) advanceHeroMotion(slow, 1 / 60);
    for (let i = 0; i < 60; i++) advanceHeroMotion(fast, 1 / 120);
    assert.equal(slow.current, direction);
    assert.ok(Math.abs(slow.pose - fast.pose) < .001);
    fast.requested = 'default';
    for (let i = 0; i < 120; i++) advanceHeroMotion(fast, 1 / 120);
    assert.equal(fast.pose, 0);
    assert.equal(fast.velocity, 0);
    assert.equal(advanceHeroMotion(fast, 1 / 120), false);
  }
});

test('pointer directions use screen coordinates and have a central rest zone', () => {
  assert.equal(pointerDirection(500, 300, 1000, 600), 'default');
  assert.equal(pointerDirection(50, 300, 1000, 600), 'left');
  assert.equal(pointerDirection(950, 300, 1000, 600), 'right');
  assert.equal(pointerDirection(500, 30, 1000, 600), 'up');
  assert.equal(pointerDirection(500, 570, 1000, 600), 'down');
});
test('scroll interpolation clamps both ends', () => {
  assert.equal(smoothstep(-1), 0); assert.equal(smoothstep(2), 1); assert.equal(smoothstep(.5), .5);
});
test('rapid seek requests coalesce and the last desired frame wins', () => {
  const events = new Map();
  const video = { readyState: 1, duration: 6, seeking: false, currentTime: 0,
    addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); } };
  const seeker = createVideoSeeker(video);
  seeker.seek(1); assert.equal(video.currentTime, 1);
  video.seeking = true; seeker.seek(2); seeker.seek(4); assert.equal(video.currentTime, 1);
  video.seeking = false; events.get('seeked')(); assert.equal(video.currentTime, 4);
  seeker.seek(100); assert.ok(video.currentTime < 6);
  seeker.dispose(); assert.equal(events.size, 0);
});
