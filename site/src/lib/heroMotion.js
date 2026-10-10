export const HERO_DIRECTIONS = ['up', 'down', 'left', 'right'];

export const createHeroMotion = () => ({ current: 'up', requested: 'default', pose: 0, velocity: 0 });

// All four tracks share the frontal pose. Reflect position and velocity at
// that junction, instead of restarting a tween or queueing an old direction.
export function advanceHeroMotion(state, elapsed) {
  const delta = Math.max(0, Math.min(.05, elapsed));
  const steps = Math.max(1, Math.ceil(delta * 120));
  const step = delta / steps;
  for (let i = 0; i < steps; i++) {
    const goal = state.requested === 'default' ? 0 : state.requested === state.current ? 1 : -1;
    state.velocity += ((goal - state.pose) * 400 - state.velocity * 40) * step;
    state.pose += state.velocity * step;
    if (state.pose < 0 && state.requested !== 'default' && state.requested !== state.current) {
      state.pose = -state.pose;
      state.velocity = -state.velocity;
      state.current = state.requested;
    }
    if (Math.abs(goal - state.pose) < .003 && Math.abs(state.velocity) < .05) {
      state.pose = goal; state.velocity = 0;
    }
  }
  if (state.pose < .008 && state.requested === 'default') { state.pose = 0; state.velocity = 0; }
  return state.velocity !== 0 || state.pose !== (state.requested === 'default' ? 0 : 1) ||
    (state.requested !== 'default' && state.current !== state.requested);
}
