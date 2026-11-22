// Staged screenshot poses for The Gilded Hour. One job: put the real
// game into a photogenic play state (?shot=title|play|tense|win&seed=N),
// paint it twice, and set window.__shotReady. Every pose is the game's
// own state — real guards, cones, cameras, loot and alarm — never a mock-up.
import { TILE, HUD_H, SUSPICION_FULL } from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_VICTORY, loadLevel, tileCenterX, tileCenterY,
} from './world.js';

export function stageShot(name, world) {
  if (name === 'title') {
    loadLevel(world, 0);
    world.screen = SCREEN_TITLE;
    world.titleBlink = 0;
    return { screen: SCREEN_TITLE };
  }
  if (name === 'win') {
    loadLevel(world, 2);
    world.screen = SCREEN_PLAY;
    // The getaway: Hourglass taken, alarm screaming, thief at the open door.
    const target = world.loot.find((l) => l.kind === 'target');
    if (target) target.taken = true;
    world.loot.forEach((l) => { l.taken = true; });
    world.player.loot = world.loot.length;
    world.player.lootValue = 2650;
    world.score = 2650;
    world.alarm = 78;
    world.peakAlarm = 78;
    world.ghost = false;
    world.timeSec = 214;
    world.exitOpen = true;
    world.player.x = tileCenterX(36);
    world.player.y = tileCenterY(18);
    world.player.angle = Math.PI;
    world.screen = SCREEN_VICTORY;
    world.best = 2650;
    world.messageTimer = 0;
    return { screen: SCREEN_VICTORY };
  }
  if (name === 'tense') {
    // Floor 3, mid-chase: a guard has spotted Vesper beside a laser,
    // the alarm is high and the Hourglass glints two rooms away.
    loadLevel(world, 2);
    world.screen = SCREEN_PLAY;
    world.player.x = tileCenterX(9);
    world.player.y = tileCenterY(10);
    world.player.sneaking = true;
    world.player.angle = 0;
    world.player.smoke = 1;
    world.player.emp = 0;
    const guard = world.guards[0];
    guard.x = tileCenterX(13);
    guard.y = tileCenterY(10);
    guard.angle = Math.PI;
    guard.state = 'chase';
    guard.suspicion = SUSPICION_FULL;
    guard.lastSeenX = world.player.x;
    guard.lastSeenY = world.player.y;
    guard.memoryTimer = 3;
    world.guards[1].state = 'suspicious';
    world.guards[1].suspicion = 62;
    world.alarm = 71;
    world.peakAlarm = 71;
    world.score = 950;
    world.timeSec = 148;
    world.message = 'SPOTTED! Break line of sight!';
    world.messageTimer = 5;
    world.flash = 0.25;
    world.smokeClouds.push({ x: tileCenterX(7), y: tileCenterY(10), radius: 95, timer: 3 });
    return { screen: SCREEN_PLAY };
  }
  // Default: 'play' — Floor 1, the cover shot. Vesper crouched behind a
  // display case, a guard's cone sweeping past, a camera above, loot and
  // the alarm meter all in one frame.
  loadLevel(world, 0);
  world.screen = SCREEN_PLAY;
  world.player.x = tileCenterX(4);
  world.player.y = tileCenterY(10);
  world.player.sneaking = true;
  world.player.angle = 0;
  const guard = world.guards[0];
  guard.x = tileCenterX(12);
  guard.y = tileCenterY(5);
  guard.angle = Math.PI / 2;
  guard.state = 'patrol';
  const guard2 = world.guards[2];
  guard2.x = tileCenterX(20);
  guard2.y = tileCenterY(12);
  guard2.angle = -Math.PI / 2;
  world.loot[0].taken = true;
  world.player.loot = 1;
  world.player.lootValue = 150;
  world.score = 150;
  world.alarm = 12;
  world.timeSec = 41;
  world.message = 'Stay out of the blue cones. The cameras see in red.';
  world.messageTimer = 5;
  return { screen: SCREEN_PLAY };
}
