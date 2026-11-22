// Bootstrap and frame loop for The Gilded Hour. One job: create the
// world, wire input and audio, run the update/draw loop, and stage
// screenshots when the URL asks (?shot=name&seed=N).
import { VIEW_W, VIEW_H } from './config.js';
import { createWorld, updateWorld, attachWorldMethods, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT, SCREEN_LEVEL_DONE, SCREEN_VICTORY } from './world.js';
import { HeistInput } from './input.js';
import { HeistAudio } from './audio.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const seedText = params.get('seed') || 'gilded-hour';
const shotName = params.get('shot');

const world = createWorld(seedText);
const audio = new HeistAudio();
attachWorldMethods(world, audio);
const input = new HeistInput(canvas);
const statusEl = document.getElementById('status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function menuKey(key) {
  if (key === 'm') {
    audio.ensure();
    const muted = audio.toggleMute();
    world.message = muted ? 'Sound muted.' : 'Sound on.';
    world.messageTimer = 1.5;
    return;
  }
  if (world.screen === SCREEN_TITLE && (key === 'enter' || key === ' ')) {
    audio.ensure();
    audio.click();
    world.startRun();
    setStatus('Heist started. Floor 1, the Marble Hall.');
  } else if (world.screen === SCREEN_PLAY && key === 'p') {
    audio.ensure();
    audio.click();
    world.screen = SCREEN_PAUSED;
    audio.stopAlarmLoop();
  } else if (world.screen === SCREEN_PAUSED && key === 'p') {
    audio.ensure();
    world.screen = SCREEN_PLAY;
  } else if (world.screen === SCREEN_CAUGHT && key === 'r') {
    audio.ensure();
    audio.click();
    world.startRun();
  } else if (world.screen === SCREEN_LEVEL_DONE && key === 'enter') {
    audio.ensure();
    audio.click();
    world.nextLevel();
  } else if (world.screen === SCREEN_VICTORY && key === 'enter') {
    audio.ensure();
    audio.click();
    world.startRun();
  }
}
input.onKey = menuKey;

if (shotName) {
  stageShot(shotName, world);
  // Paint twice so every canvas state settles, then signal readiness.
  drawWorld(ctx, world);
  drawWorld(ctx, world);
  window.__shotReady = true;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (world.screen === SCREEN_TITLE) world.titleBlink += dt;
  updateWorld(world, input, dt, audio);
  drawWorld(ctx, world);
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
