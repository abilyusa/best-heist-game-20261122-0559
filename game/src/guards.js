// Guard patrols, vision and pursuit for The Gilded Hour. One job: decide
// what each guard does — patrol, grow suspicious, chase, or give up —
// and whether the thief is inside a guard's vision cone.
import {
  TILE, GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
  GUARD_SNEAK_RANGE, SUSPICION_FULL, SUSPICION_RISE, SUSPICION_FALL, CHASE_MEMORY,
} from './config.js';
import { hasLineOfSight } from './world.js';

export function makeGuard(def, rng) {
  const start = def.path[0];
  return {
    x: (start[0] + 0.5) * TILE,
    y: (start[1] + 0.5) * TILE,
    path: def.path.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE })),
    waypoint: 1 % def.path.length,
    pause: def.pause || 1,
    pauseTimer: 0,
    angle: 0,
    speed: GUARD_SPEED,
    state: 'patrol', // patrol | suspicious | chase | search
    suspicion: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    memoryTimer: 0,
    scanTimer: 0,
    scanDir: 1,
    walkPhase: rng() * Math.PI * 2,
  };
}

// Is the thief visible to this guard right now? Range, cone angle and a
// clear line of sight (walls, cases and vents block it; ropes do not).
export function guardSeesThief(guard, player, world) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneaking ? GUARD_SNEAK_RANGE : GUARD_VIEW_RANGE;
  if (dist > range) return false;
  if (world.smokeClouds.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.radius)) {
    return false; // the thief is hidden inside smoke
  }
  const toPlayer = Math.atan2(dy, dx);
  let diff = toPlayer - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD_VIEW_HALF_ANGLE) return false;
  return hasLineOfSight(world, guard.x, guard.y, player.x, player.y);
}

export function updateGuard(guard, dt, world, audio) {
  const player = world.player;
  const seen = guardSeesThief(guard, player, world);

  if (seen) {
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.memoryTimer = CHASE_MEMORY;
    guard.suspicion += SUSPICION_RISE * dt;
    if (guard.suspicion >= SUSPICION_FULL) {
      guard.suspicion = SUSPICION_FULL;
      if (guard.state !== 'chase') {
        guard.state = 'chase';
        audio.spotted();
        world.message = 'SPOTTED! Break line of sight!';
        world.messageTimer = 2.5;
        world.flash = 0.3;
      }
    } else if (guard.state === 'patrol') {
      guard.state = 'suspicious';
    }
  } else {
    guard.suspicion -= SUSPICION_FALL * dt;
    if (guard.suspicion < 0) guard.suspicion = 0;
    guard.memoryTimer -= dt;
    if (guard.state === 'chase' && guard.memoryTimer <= 0) {
      guard.state = 'search';
      guard.scanTimer = 2.5;
    }
    if (guard.state === 'suspicious' && guard.suspicion <= 0) guard.state = 'patrol';
  }

  if (guard.state === 'chase') {
    moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD_CHASE_SPEED, dt, world);
    guard.angle = Math.atan2(guard.lastSeenY - guard.y, guard.lastSeenX - guard.x);
    // Caught: a chasing guard who touches the thief ends the run.
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < 26) {
      world.catchThief('A guard grabbed you in the gallery.');
    }
  } else if (guard.state === 'search') {
    guard.scanTimer -= dt;
    guard.angle += guard.scanDir * 1.6 * dt;
    if (guard.scanTimer <= 0) {
      guard.state = 'patrol';
      guard.waypoint = nearestWaypoint(guard);
    }
  } else {
    // Patrol: walk the waypoints, pausing at each to look around.
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
      guard.angle += Math.sin(guard.scanTimer * 2) * 0.4 * dt;
      guard.scanTimer += dt;
    } else {
      const target = guard.path[guard.waypoint];
      const arrived = moveToward(guard, target.x, target.y, guard.speed, dt, world);
      guard.angle = Math.atan2(target.y - guard.y, target.x - guard.x);
      if (arrived) {
        guard.waypoint = (guard.waypoint + 1) % guard.path.length;
        guard.pauseTimer = guard.pause;
        guard.scanTimer = 0;
      }
    }
  }
  guard.walkPhase += dt * (guard.state === 'chase' ? 14 : 8);
}

function nearestWaypoint(guard) {
  let best = 0;
  let bestDist = Infinity;
  guard.path.forEach((p, i) => {
    const d = Math.hypot(p.x - guard.x, p.y - guard.y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

// Step toward a point, sliding along walls. Returns true when arrived.
export function moveToward(entity, tx, ty, speed, dt, world) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(speed * dt, dist);
  const nx = entity.x + (dx / dist) * step;
  const ny = entity.y + (dy / dist) * step;
  if (!world.hitsSolid(nx, entity.y, 12)) entity.x = nx;
  if (!world.hitsSolid(entity.x, ny, 12)) entity.y = ny;
  return Math.hypot(tx - entity.x, ty - entity.y) < 4;
}
