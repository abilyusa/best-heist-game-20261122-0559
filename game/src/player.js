// The thief — Vesper — for The Gilded Hour. One job: move, sneak, dash,
// throw smoke, fire the EMP, and pick up loot, all through world rules.
import {
  TILE, WALK_SPEED, SNEAK_SPEED, DASH_SPEED, DASH_TIME, DASH_COOLDOWN,
  SMOKE_DURATION, SMOKE_RADIUS, EMP_DURATION, SCORE_LOOT_SMALL, SCORE_LOOT_BIG,
  SCORE_TARGET, ALARM_TARGET_GRAB, START_SMOKE, START_EMP,
} from './config.js';

export function makePlayer(x, y) {
  return {
    x, y,
    angle: 0,
    sneaking: false,
    moving: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 1,
    dashDirY: 0,
    walkPhase: 0,
    smoke: START_SMOKE,
    emp: START_EMP,
    loot: 0,
    lootValue: 0,
  };
}

export function updatePlayer(player, input, dt, world, audio) {
  const vec = input.moveVector();
  player.moving = vec.x !== 0 || vec.y !== 0;
  player.sneaking = input.held('shift');
  if (player.moving) {
    player.angle = Math.atan2(vec.y, vec.x);
    player.walkPhase += dt * (player.sneaking ? 6 : 11);
  }

  // Dash on Space: a short burst, then a cooldown.
  player.dashCooldown -= dt;
  if (input.wasPressed(' ') && player.dashCooldown <= 0 && player.moving) {
    player.dashTimer = DASH_TIME;
    player.dashCooldown = DASH_COOLDOWN;
    player.dashDirX = vec.x;
    player.dashDirY = vec.y;
    audio.dashWhoosh();
  }

  let speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  let mx = vec.x;
  let my = vec.y;
  if (player.dashTimer > 0) {
    player.dashTimer -= dt;
    speed = DASH_SPEED;
    mx = player.dashDirX;
    my = player.dashDirY;
  }
  const nx = player.x + mx * speed * dt;
  const ny = player.y + my * speed * dt;
  if (!world.hitsSolid(nx, player.y, 13)) player.x = nx;
  if (!world.hitsSolid(player.x, ny, 13)) player.y = ny;

  // Tools. 1: smoke pellet at the mouse (click does the same).
  if ((input.wasPressed('1') || input.mouseClicked) && player.smoke > 0) {
    throwSmoke(player, input, world, audio);
  }
  // 2: EMP — all cameras go dark for a while.
  if (input.wasPressed('2') && player.emp > 0) {
    player.emp -= 1;
    world.empTimer = EMP_DURATION;
    world.message = 'EMP fired — cameras dark for 6 seconds.';
    world.messageTimer = 2;
    audio.empZap();
  }

  collectLoot(player, world, audio);
  checkLaserTrip(player, world);
  checkExit(player, world);
}

function throwSmoke(player, input, world, audio) {
  // Throw at the mouse position, clamped to a sensible range.
  const tx = input.mouseX;
  const ty = input.mouseY - 0; // mouse is already in canvas space
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  const maxThrow = 260;
  const scale = dist > maxThrow ? maxThrow / dist : 1;
  player.smoke -= 1;
  world.smokeClouds.push({
    x: player.x + dx * scale,
    y: player.y + dy * scale,
    radius: SMOKE_RADIUS,
    timer: SMOKE_DURATION,
  });
  audio.smokePuff();
}

function collectLoot(player, world, audio) {
  for (const loot of world.loot) {
    if (loot.taken) continue;
    if (Math.hypot(player.x - loot.x, player.y - loot.y) < 26) {
      loot.taken = true;
      player.loot += 1;
      if (loot.kind === 'target') {
        player.lootValue += SCORE_TARGET;
        world.score += SCORE_TARGET;
        world.alarm += ALARM_TARGET_GRAB;
        world.message = 'THE GILDED HOURGLASS IS YOURS — the vault alarm is screaming. RUN!';
        world.messageTimer = 4;
        world.flash = 0.5;
        audio.vaultChime();
        // Every guard on the floor converges on the vault.
        for (const g of world.guards) {
          g.state = 'chase';
          g.lastSeenX = player.x;
          g.lastSeenY = player.y;
          g.memoryTimer = 5;
          g.suspicion = 100;
        }
      } else {
        const value = loot.kind === 'big' ? SCORE_LOOT_BIG : SCORE_LOOT_SMALL;
        player.lootValue += value;
        world.score += value;
        audio.pickup();
      }
    }
  }
  for (const cache of world.caches) {
    if (cache.taken) continue;
    if (Math.hypot(player.x - cache.x, player.y - cache.y) < 26) {
      cache.taken = true;
      player.smoke += 1;
      player.emp += 1;
      world.message = 'Tool cache: +1 smoke pellet, +1 EMP.';
      world.messageTimer = 2.5;
      audio.pickup();
    }
  }
}

function checkLaserTrip(player, world) {
  if (!world.lasersOn()) return;
  for (const laser of world.lasers) {
    if (!laser.lit) continue;
    // Distance from the thief to the laser segment.
    const d = distanceToSegment(player.x, player.y, laser.x1, laser.y1, laser.x2, laser.y2);
    if (d < 14 && world.laserCooldown <= 0) {
      world.alarm += 18;
      world.laserCooldown = 1.2;
      world.message = 'Laser tripped! The alarm jumps.';
      world.messageTimer = 2;
      world.flash = 0.35;
    }
  }
}

function checkExit(player, world) {
  if (!world.exitOpen) return;
  if (Math.hypot(player.x - world.exit.x, player.y - world.exit.y) < 30) {
    world.completeLevel();
  }
}

export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function lootRemaining(world) {
  return world.loot.filter((l) => !l.taken).length;
}

export { TILE };
