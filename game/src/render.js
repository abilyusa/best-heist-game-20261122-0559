// Canvas drawing for The Gilded Hour. One job: paint the museum, the
// cones, the thief, the guards and every screen, from the world state.
import {
  TILE, COLS, ROWS, HUD_H, VIEW_W, VIEW_H, COLORS, GUARD_VIEW_RANGE,
  GUARD_VIEW_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE, ALARM_MAX,
} from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT,
  SCREEN_LEVEL_DONE, SCREEN_VICTORY, tileCenterX, tileCenterY,
} from './world.js';
import { lootRemaining } from './player.js';

export function drawWorld(ctx, world) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, world);
  drawCones(ctx, world);
  drawWallsAndCover(ctx, world);
  drawLootAndExit(ctx, world);
  drawLasers(ctx, world);
  drawSmoke(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawPlayer(ctx, world);
  drawHud(ctx, world);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(226, 59, 59, ${Math.min(0.35, world.flash)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_PAUSED) drawPaused(ctx, world);
  if (world.screen === SCREEN_CAUGHT) drawCaught(ctx, world);
  if (world.screen === SCREEN_LEVEL_DONE) drawLevelDone(ctx, world);
  if (world.screen === SCREEN_VICTORY) drawVictory(ctx, world);
}

function drawFloor(ctx, world) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ch = world.tiles[row][col];
      const x = col * TILE;
      const y = HUD_H + row * TILE;
      if (ch === '#') continue;
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorLight : COLORS.floorDark;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = COLORS.marbleLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (ch === 'V') {
        // Vent grate: the thief crawls through, guards cannot see through.
        ctx.fillStyle = COLORS.vent;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#141210';
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 4, y + i * 8);
          ctx.lineTo(x + TILE - 4, y + i * 8);
          ctx.stroke();
        }
      }
    }
  }
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCones(ctx, world) {
  for (const cam of world.cameras) {
    if (world.empTimer > 0) continue;
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE,
      COLORS.coneCamera, COLORS.coneCameraEdge);
  }
  for (const guard of world.guards) {
    const chasing = guard.state === 'chase';
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE,
      chasing ? 'rgba(255, 70, 70, 0.22)' : COLORS.coneGuard,
      chasing ? 'rgba(255, 110, 110, 0.6)' : COLORS.coneGuardEdge);
  }
}

function drawWallsAndCover(ctx, world) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ch = world.tiles[row][col];
      const x = col * TILE;
      const y = HUD_H + row * TILE;
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 4);
      } else if (ch === 'D') {
        // Display case: wooden plinth, glass top, a glinting exhibit.
        ctx.fillStyle = COLORS.caseWood;
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = COLORS.caseGlass;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + TILE - 8);
        ctx.lineTo(x + TILE - 10, y + 8);
        ctx.stroke();
      } else if (ch === 'R') {
        // Velvet rope: two brass posts and a red sagging rope.
        ctx.fillStyle = COLORS.goldDim;
        ctx.beginPath();
        ctx.arc(x + 5, y + TILE / 2, 3, 0, Math.PI * 2);
        ctx.arc(x + TILE - 5, y + TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.velvet;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + TILE / 2);
        ctx.quadraticCurveTo(x + TILE / 2, y + TILE / 2 + 8, x + TILE - 5, y + TILE / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }
}

function drawLootAndExit(ctx, world) {
  const t = world.timeSec;
  for (const loot of world.loot) {
    if (loot.taken) continue;
    const bob = Math.sin(t * 3 + loot.phase) * 2;
    if (loot.kind === 'target') {
      // The Gilded Hourglass: a golden hourglass in a glowing ring.
      ctx.save();
      ctx.translate(loot.x, loot.y + bob);
      ctx.fillStyle = 'rgba(232, 182, 76, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(-9, -12);
      ctx.lineTo(9, -12);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.moveTo(-9, 12);
      ctx.lineTo(9, 12);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (loot.kind === 'big') {
      drawGem(ctx, loot.x, loot.y + bob, 13, '#7fd4ff');
    } else {
      drawGem(ctx, loot.x, loot.y + bob, 9, COLORS.gold);
    }
  }
  for (const cache of world.caches) {
    if (cache.taken) continue;
    ctx.fillStyle = '#8a6d2f';
    ctx.fillRect(cache.x - 11, cache.y - 8, 22, 16);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(cache.x - 11, cache.y - 2, 22, 3);
  }
  // Getaway door.
  const exit = world.exit;
  if (exit) {
    ctx.save();
    if (world.exitOpen) {
      ctx.fillStyle = COLORS.exitGlow;
      ctx.beginPath();
      ctx.arc(exit.x, exit.y, 30 + Math.sin(t * 4) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = world.exitOpen ? COLORS.exit : '#3a5a44';
    ctx.fillRect(exit.x - 13, exit.y - 15, 26, 30);
    ctx.fillStyle = '#0e1a12';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8f5ec';
    ctx.fillText(world.exitOpen ? 'EXIT' : 'LOCK', exit.x, exit.y);
    ctx.restore();
  }
}

function drawGem(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.8, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.35, -r * 0.2);
  ctx.lineTo(0, r * 0.25);
  ctx.lineTo(-r * 0.35, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLasers(ctx, world) {
  for (const laser of world.lasers) {
    ctx.save();
    if (laser.lit) {
      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(255, 40, 60, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
    }
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Emitters on both ends.
    ctx.fillStyle = '#555';
    ctx.fillRect(laser.x1 - 4, laser.y1 - 4, 8, 8);
    ctx.fillRect(laser.x2 - 4, laser.y2 - 4, 8, 8);
    ctx.restore();
  }
}

function drawSmoke(ctx, world) {
  for (const cloud of world.smokeClouds) {
    const alpha = Math.min(0.6, cloud.timer / 2);
    ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cloud.x - 30, cloud.y + 12, cloud.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cloud.x + 28, cloud.y - 14, cloud.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    const dark = world.empTimer > 0;
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = dark ? '#222' : COLORS.cameraBody;
    ctx.fillRect(-4, -6, 16, 12);
    ctx.fillStyle = dark ? '#333' : '#e23b3b';
    ctx.beginPath();
    ctx.arc(13, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Wall mount.
    ctx.fillStyle = '#2a2d33';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 5, 0, Math.PI * 2);
    ctx.fill();
    if (dark) {
      ctx.fillStyle = COLORS.hudText;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', cam.x, cam.y - 14);
    }
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const bob = Math.sin(guard.walkPhase) * 1.5;
    ctx.save();
    ctx.translate(guard.x, guard.y + bob);
    // Body: navy uniform, white helmet band, facing nose.
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.guardTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.arc(Math.cos(guard.angle) * 6, Math.sin(guard.angle) * 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.arc(Math.cos(guard.angle) * 9, Math.sin(guard.angle) * 9, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion arc above the head.
    if (guard.suspicion > 1) {
      const frac = guard.suspicion / 100;
      ctx.strokeStyle = guard.state === 'chase' ? '#e23b3b' : '#e8b64c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 19, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
    if (guard.state === 'chase') {
      ctx.fillStyle = '#e23b3b';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -24);
    } else if (guard.state === 'search') {
      ctx.fillStyle = '#e8b64c';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, -24);
    }
    ctx.restore();
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const bob = p.moving ? Math.sin(p.walkPhase) * 1.5 : 0;
  const r = p.sneaking ? 11 : 13;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded thief: black cloak, gold mask slit, facing nose.
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.thiefTrim;
  ctx.beginPath();
  ctx.arc(Math.cos(p.angle) * 6, Math.sin(p.angle) * 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Dash cooldown tick.
  if (p.dashCooldown > 0) {
    ctx.fillStyle = 'rgba(232, 182, 76, 0.7)';
    ctx.fillRect(p.x - 10, p.y - 22, 20 * (1 - p.dashCooldown / 1.4), 3);
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.goldDim;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE GILDED HOUR', 16, 30);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px sans-serif';
  ctx.fillText(world.level.name, 16, 52);

  // Alarm meter — the heart of the HUD.
  const meterX = 330;
  const meterW = 260;
  const frac = world.alarm / ALARM_MAX;
  const alarmColor = frac < 0.4 ? COLORS.alarmLow : frac < 0.75 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 24);
  ctx.fillStyle = '#241d16';
  ctx.fillRect(meterX, 32, meterW, 16);
  ctx.fillStyle = alarmColor;
  ctx.fillRect(meterX, 32, meterW * frac, 16);
  ctx.strokeStyle = '#6b5a3e';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, 32.5, meterW, 16);
  ctx.fillStyle = frac >= 0.75 ? '#ff6b6b' : COLORS.hudDim;
  ctx.font = '12px sans-serif';
  ctx.fillText(`${Math.round(world.alarm)} / 100`, meterX + meterW + 10, 45);

  // Score, loot, tools, time.
  const lootLeft = lootRemaining(world);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${world.score}`, 720, 30);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px sans-serif';
  ctx.fillText(`LOOT ${world.player.loot} taken · ${lootLeft} left`, 720, 52);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px sans-serif';
  ctx.fillText(`SMOKE ×${world.player.smoke}  [1]`, 900, 30);
  ctx.fillText(`EMP ×${world.player.emp}  [2]`, 900, 52);
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`TIME ${formatTime(world.timeSec)}`, 1080, 30);
  ctx.fillText(world.exitOpen ? 'EXIT OPEN — RUN!' : 'Exit locked: clear the loot', 1080, 52);

  if (world.messageTimer > 0 && world.screen === SCREEN_PLAY) {
    ctx.fillStyle = 'rgba(240,230,210,0.95)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW_W / 2, HUD_H + 18);
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(10, 8, 6, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, title, lines, footer) {
  dimScreen(ctx);
  const w = 640;
  const h = 130 + lines.length * 30 + (footer ? 46 : 0);
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#1d1712';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.goldDim;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, y + 52);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, y + 92 + i * 30);
  });
  if (footer) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(footer, VIEW_W / 2, y + h - 22);
  }
}

function drawTitle(ctx, world) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('THE GILDED HOUR', VIEW_W / 2, 190);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '19px Georgia, serif';
  ctx.fillText('A museum heist in three galleries — midnight, one thief, no second chances.', VIEW_W / 2, 232);
  ctx.font = '16px sans-serif';
  ctx.fillText('You are Vesper. Lift every treasure, dodge the guards’ vision cones,', VIEW_W / 2, 300);
  ctx.fillText('blind the cameras with smoke and EMP, and reach the getaway door', VIEW_W / 2, 326);
  ctx.fillText('before the alarm meter hits 100.', VIEW_W / 2, 352);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD / arrows — move      Shift — sneak      Space — dash', VIEW_W / 2, 410);
  ctx.fillText('Click or 1 — throw smoke      2 — EMP      P — pause      M — mute', VIEW_W / 2, 436);
  ctx.fillText('Grab the Gilded Hourglass on Floor 3 — it trips the vault alarm.', VIEW_W / 2, 462);
  if (Math.floor(world.titleBlink * 2) % 2 === 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('— Press ENTER to begin the heist —', VIEW_W / 2, 540);
  }
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px sans-serif';
  ctx.fillText('An original game: no borrowed art, music or names.', VIEW_W / 2, 640);
}

function drawPaused(ctx, world) {
  panel(ctx, 'PAUSED', [
    `${world.level.name}`,
    `Score ${world.score} · Alarm ${Math.round(world.alarm)} · Loot ${world.player.loot} taken`,
  ], 'Press P to keep sneaking');
}

function drawCaught(ctx, world) {
  panel(ctx, 'CAUGHT', [
    world.caughtReason,
    `Score ${world.score} · Loot ${world.player.loot} taken · Alarm peaked at ${Math.round(world.peakAlarm)}`,
    `${world.level.name}`,
  ], 'Press R to try this floor again');
}

function drawLevelDone(ctx, world) {
  panel(ctx, 'FLOOR CLEAR', [
    `${world.level.name} — every treasure lifted.`,
    `Time bonus +${world.floorBonus} · Score ${world.score}`,
    `Alarm peaked at ${Math.round(world.peakAlarm)} · Detections ${world.detections}`,
  ], 'Press ENTER for the next floor');
}

function drawVictory(ctx, world) {
  const ghostLine = world.ghost
    ? `Ghost bonus +${800} — the alarm never passed 50.`
    : `Alarm peaked at ${Math.round(world.peakAlarm)} — the Ghost bonus slipped away.`;
  panel(ctx, 'THE GETAWAY', [
    'The Gilded Hourglass is yours. Vesper vanishes into the night.',
    `Final score ${world.score} · Time ${formatTime(world.timeSec)} · Loot ${world.player.loot} pieces`,
    ghostLine,
  ], 'Press ENTER to run it again');
}

export { tileCenterX, tileCenterY };
