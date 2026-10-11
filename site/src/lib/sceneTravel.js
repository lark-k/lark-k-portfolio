// Only forward journeys play clips. Each clip starts at its preceding scene.
export function transitionClips(from, to) {
  if (from === to || to === 'home') return [];
  const clips = [];
  if (from === 'home') clips.push('biography');
  if (['works', 'preview', 'possibility'].includes(to) && ['home', 'biography'].includes(from)) clips.push('works');
  if (to === 'possibility' && from !== 'possibility') clips.push('possibility');
  return clips;
}

export const CLIP_SPEED = { biography: 2.4, works: 2.7, possibility: 1 };
