// Game state for The Gilded Hour. One job: own the world — load floors,
// run the alarm, cameras and lasers, and decide win, caught and pause.
import {
  TILE, COLS, ROWS, HUD_H, ALARM_MAX, ALARM_DECAY, ALARM_GUARD_SPOT,
  CAMERA_RANGE, CAMERA_HALF_ANGLE, CAMERA_ALARM_RATE, LASER_PERIOD, LASER_ON,
  SCORE_TIME_BONUS_PER_SEC, GHOST_ALARM_LIMIT, GHOST_BONUS,
} from './config.js';
import { LEVELS, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT, SCREEN_LEVEL_DONE, SCREEN_VICTORY } from './levels.js';
import { makeGuard, updateGuard, guardSeesThief } from './guards.js';
import { makePlayer, updatePlayer, lootRemaining } from './player.js';
import { mulberry32, hashSeed } from './random.js';

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT, SCREEN_LEVEL_DONE, SCREEN_VICTORY };

export function tileCenterX(col) {
  return (col + 0.5) * TILE;
}

export function tileCenterY(row) {
  return HUD_H + (row + 0.5) * TILE;
}

export function createWorld(seedText) {
  const rng = mulberry32(hashSeed(seedText || 'gilded-hour'));
  const world = {
    rng,
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: null,
    tiles: [],
    player: null,
    guards: [],
    cameras: [],
    lasers: [],
    loot: [],
    caches: [],
    exit: null,
    exitOpen: false,
    smokeClouds: [],
    empTimer: 0,
    alarm: 0,
    peakAlarm: 0,
    score: 0,
    timeSec: 0,
    levelTimeSec: 0,
    detections: 0,
    laserCooldown: 0,
    laserClock: 0,
    message: '',
    messageTimer: 0,
    flash: 0,
    caughtReason: '',
    floorBonus: 0,
    ghost: true,
    best: 0,
    titleBlink: 0,
  };
  loadLevel(world, 0);
  return world;
}

export function loadLevel(world, index) {
  const def = LEVELS[index];
  world.levelIndex = index;
  world.level = def;
  world.tiles = def.map.map((row) => row.split(''));
  world.guards = [];
  world.cameras = [];
  world.lasers = [];
  world.loot = [];
  world.caches = [];
  world.exit = null;
  world.exitOpen = false;
  world.smokeClouds = [];
  world.empTimer = 0;
  world.laserClock = 0;
  world.laserCooldown = 0;
  world.levelTimeSec = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ch = world.tiles[row][col];
      const x = tileCenterX(col);
      const y = tileCenterY(row);
      if (ch === 'P') {
        world.player = makePlayer(x, y);
        // Keep the tools the thief already carries between floors.
        if (world.carriedTools) {
          world.player.smoke = world.carriedTools.smoke;
          world.player.emp = world.carriedTools.emp;
        }
      } else if (ch === 'L') {
        world.loot.push({ x, y, kind: 'small', taken: false, phase: world.rng() * 6 });
      } else if (ch === 'B') {
        world.loot.push({ x, y, kind: 'big', taken: false, phase: world.rng() * 6 });
      } else if (ch === 'T') {
        world.loot.push({ x, y, kind: 'target', taken: false, phase: 0 });
      } else if (ch === 'K') {
        world.caches.push({ x, y, taken: false });
      } else if (ch === 'E') {
        world.exit = { x, y };
      }
    }
  }
  for (const g of def.guards) world.guards.push(makeGuard(g, world.rng));
  for (const c of def.cameras) {
    world.cameras.push({
      x: tileCenterX(c.col),
      y: tileCenterY(c.row),
      baseAngle: c.baseAngle,
      sweep: c.sweep,
      speed: c.speed,
      angle: c.baseAngle,
      time: world.rng() * 6,
    });
  }
  for (const l of def.lasers) {
    world.lasers.push({
      x1: tileCenterX(l.x1),
      y1: tileCenterY(l.y1),
      x2: tileCenterX(l.x2),
      y2: tileCenterY(l.y2),
      phase: l.phase,
      lit: false,
    });
  }
  if (!world.player) world.player = makePlayer(tileCenterX(1), tileCenterY(1));
  world.message = def.briefing;
  world.messageTimer = 4;
}

// Solid for movement: walls, display cases, velvet ropes. Vents are
// walkable (the thief crawls through them); guards never path through.
export function tileAt(world, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return world.tiles[row][col];
}

export function tileBlocksMovement(ch) {
  return ch === '#' || ch === 'D' || ch === 'R';
}

export function tileBlocksSight(ch) {
  return ch === '#' || ch === 'D' || ch === 'V';
}

export function hitsSolid(world, x, y, radius) {
  const top = Math.floor((y - radius - HUD_H) / TILE);
  const bottom = Math.floor((y + radius - HUD_H) / TILE);
  const left = Math.floor((x - radius) / TILE);
  const right = Math.floor((x + radius) / TILE);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (tileBlocksMovement(tileAt(world, col, row))) {
        const cx = Math.max(col * TILE, Math.min(x, (col + 1) * TILE));
        const cy = Math.max(HUD_H + row * TILE, Math.min(y, HUD_H + (row + 1) * TILE));
        if (Math.hypot(x - cx, y - cy) < radius) return true;
      }
    }
  }
  return false;
}

// Line of sight between two canvas points, stepping along the segment.
export function hasLineOfSight(world, x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(dist / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const col = Math.floor(x / TILE);
    const row = Math.floor((y - HUD_H) / TILE);
    if (tileBlocksSight(tileAt(world, col, row))) return false;
  }
  return true;
}

export function lasersOn(world) {
  return world.lasers.length > 0;
}

export function updateWorld(world, input, dt, audio) {
  if (world.screen !== SCREEN_PLAY) return;
  world.timeSec += dt;
  world.levelTimeSec += dt;
  world.messageTimer = Math.max(0, world.messageTimer - dt);
  world.flash = Math.max(0, world.flash - dt);
  world.laserCooldown = Math.max(0, world.laserCooldown - dt);
  world.empTimer = Math.max(0, world.empTimer - dt);

  // Lasers blink on their shared cycle.
  world.laserClock += dt;
  for (const laser of world.lasers) {
    const phase = (world.laserClock + laser.phase) % LASER_PERIOD;
    laser.lit = phase < LASER_ON;
  }

  // Cameras sweep; a live camera that sees the thief feeds the alarm.
  for (const cam of world.cameras) {
    cam.time += dt;
    cam.angle = cam.baseAngle + Math.sin(cam.time * cam.speed) * cam.sweep;
  }
  if (world.empTimer <= 0) {
    for (const cam of world.cameras) {
      if (cameraSeesThief(cam, world)) {
        world.alarm += CAMERA_ALARM_RATE * dt;
        world.message = 'Camera on you — break its line of sight!';
        world.messageTimer = 1;
      }
    }
  }

  // Smoke fades.
  for (const cloud of world.smokeClouds) cloud.timer -= dt;
  world.smokeClouds = world.smokeClouds.filter((c) => c.timer > 0);

  updatePlayer(world.player, input, dt, world, audio);
  for (const guard of world.guards) updateGuard(guard, dt, world, audio);

  // A fully alerted guard feeds the alarm while the chase is on.
  if (world.guards.some((g) => g.state === 'chase')) {
    world.alarm += ALARM_GUARD_SPOT * dt;
  }

  // The alarm cools when nobody is watching.
  const watched = world.guards.some((g) => g.state === 'chase' || g.suspicion > 0);
  if (!watched && world.empTimer <= 0) {
    world.alarm = Math.max(0, world.alarm - ALARM_DECAY * dt);
  }
  world.alarm = Math.min(ALARM_MAX, world.alarm);
  world.peakAlarm = Math.max(world.peakAlarm, world.alarm);
  if (world.alarm >= GHOST_ALARM_LIMIT) world.ghost = false;

  if (world.alarm >= 60) audio.startAlarmLoop();
  else audio.stopAlarmLoop();

  if (world.alarm >= ALARM_MAX) {
    world.catchThief('The alarm hit 100 — the museum locked down around you.');
    return;
  }

  // The getaway door opens once every piece of loot on the floor is taken.
  if (!world.exitOpen && lootRemaining(world) === 0) {
    world.exitOpen = true;
    world.message = 'All loot lifted — the getaway door is open. RUN!';
    world.messageTimer = 3;
    audio.vaultChime();
  }
}

export function cameraSeesThief(cam, world) {
  const player = world.player;
  const dx = player.x - cam.x;
  const dy = player.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_RANGE) return false;
  if (world.smokeClouds.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.radius)) {
    return false;
  }
  const toPlayer = Math.atan2(dy, dx);
  let diff = toPlayer - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return false;
  return hasLineOfSight(world, cam.x, cam.y, player.x, player.y);
}

// Bound to the world object at creation so guards and the player can end
// the run without importing the whole state machine.
export function attachWorldMethods(world, audio) {
  world.hitsSolid = (x, y, r) => hitsSolid(world, x, y, r);
  world.lasersOn = () => lasersOn(world);
  world.completeLevel = () => {
    world.carriedTools = { smoke: world.player.smoke, emp: world.player.emp };
    const timeBonus = Math.max(0, Math.round((240 - world.levelTimeSec) * SCORE_TIME_BONUS_PER_SEC));
    world.floorBonus = timeBonus;
    world.score += timeBonus;
    audio.winFanfare();
    audio.stopAlarmLoop();
    if (world.levelIndex + 1 >= LEVELS.length) {
      if (world.ghost) {
        world.score += GHOST_BONUS;
        world.message = `Ghost bonus +${GHOST_BONUS} — never tripped the alarm past ${GHOST_ALARM_LIMIT}!`;
      }
      world.best = Math.max(world.best, world.score);
      world.screen = SCREEN_VICTORY;
    } else {
      world.screen = SCREEN_LEVEL_DONE;
    }
  };
  world.catchThief = (reason) => {
    if (world.screen !== SCREEN_PLAY) return;
    world.caughtReason = reason;
    world.detections += 1;
    world.screen = SCREEN_CAUGHT;
    audio.caughtSting();
    audio.stopAlarmLoop();
  };
  world.startRun = () => {
    world.score = 0;
    world.timeSec = 0;
    world.alarm = 0;
    world.peakAlarm = 0;
    world.detections = 0;
    world.ghost = true;
    world.carriedTools = null;
    loadLevel(world, 0);
    world.screen = SCREEN_PLAY;
  };
  world.nextLevel = () => {
    loadLevel(world, world.levelIndex + 1);
    world.screen = SCREEN_PLAY;
  };
}
