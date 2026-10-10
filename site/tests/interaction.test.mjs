import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerDirection, smoothstep, createVideoSeeker } from '../src/lib/interaction.js';
import { advanceHeroMotion, createHeroMotion, HERO_DIRECTIONS } from '../src/lib/heroMotion.js';

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
