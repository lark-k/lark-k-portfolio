import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../site/node_modules/three/build/three.module.js';

const source = fs.readFileSync('site/src/components/Lanyard.jsx', 'utf8');
const helpers = source.slice(0, source.indexOf('const Lanyard =')).replace(/^import .*;\r?$/gm, '');
const physicsSource = source.match(/const physics = \(\) => \{([\s\S]*?)\n    \};/)[1].replace('const s = settingsRef.current;', 'const reducedMotion = false;');
function measure(code, breeze, speed = 1) {
  const context = vm.createContext({ THREE });
  vm.runInContext(code + '\nconst buildPhysics = s => {' + physicsSource + '};\nglobalThis.api = { createSimulation, cardLayout, configureSimulation, placeHanging, stepSimulation, buildPhysics };', context);
  const api = context.api;
  const sim = api.createSimulation();
  const layout = api.cardLayout('portrait', .3);
  api.configureSimulation(sim, layout, 1.32);
  sim.anchor.set(0, 2.36, 0);
  api.placeHanging(sim, layout, false);
  const physics = api.buildPhysics({ gravity: 1, elasticity: .35, damping: .65, breeze, breezeSpeed: speed });
  const samples = [];
  for (let i = 0; i < 2400; i++) {
    api.stepSimulation(sim, 1 / 60, physics, i / 60);
    if (!Number.isFinite(sim.body.position.x + sim.body.quaternion.w)) throw new Error('Unstable sway');
    if (i > 600) samples.push({ t: i / 60, x: sim.body.position.x });
  }
  const xs = samples.map(sample => sample.x);
  const mean = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const crossing = samples.filter((sample, i) => i > 0 && samples[i - 1].x < mean && sample.x >= mean);
  const period = crossing.slice(1).reduce((sum, sample, i) => sum + sample.t - crossing[i].t, 0) / (crossing.length - 1);
  return { spanPxAt200pxCard: +((Math.max(...xs) - Math.min(...xs)) * 200 / layout.width).toFixed(1), periodSeconds: +period.toFixed(2) };
}
const baseline = helpers.replace('const windTime = time * physics.breezeSpeed;', 'const windTime = time;').replace(/(const windX =[^\n]+) \* 6;/, '$1 * 3;');
console.log('Baseline', measure(baseline, .3));
console.log('Current', measure(helpers, .7, 1.6));
