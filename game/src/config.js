// The Gilded Hour — tuning and palette for a museum heist.
// One file, one job: every number the rest of the game balances against.
export const TILE = 32;
export const COLS = 40;
export const ROWS = 20;
export const HUD_H = 80;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = HUD_H + ROWS * TILE; // 720

// Movement (pixels per second).
export const WALK_SPEED = 150;
export const SNEAK_SPEED = 78;
export const DASH_SPEED = 340;
export const DASH_TIME = 0.16;
export const DASH_COOLDOWN = 1.4;

// Guards.
export const GUARD_SPEED = 62;
export const GUARD_CHASE_SPEED = 128;
export const GUARD_VIEW_RANGE = 215;
export const GUARD_VIEW_HALF_ANGLE = 0.62; // radians, ~35 degrees
export const GUARD_SNEAK_RANGE = 130; // shorter when the thief sneaks
export const SUSPICION_FULL = 100;
export const SUSPICION_RISE = 95; // per second while the thief is seen
export const SUSPICION_FALL = 26;
export const CHASE_MEMORY = 3.0; // seconds a guard hunts after losing sight

// Cameras.
export const CAMERA_RANGE = 250;
export const CAMERA_HALF_ANGLE = 0.5;
export const CAMERA_ALARM_RATE = 9; // alarm points per second while seen
export const EMP_DURATION = 6;

// Alarm meter (0..100). At 100 the museum locks down and the run ends.
export const ALARM_MAX = 100;
export const ALARM_DECAY = 1.1;
export const ALARM_GUARD_SPOT = 26; // per second while a guard is fully alerted
export const ALARM_LASER_TRIP = 18;
export const ALARM_TARGET_GRAB = 22; // grabbing the Hourglass trips the vault alarm

// Tools.
export const SMOKE_DURATION = 4.5;
export const SMOKE_RADIUS = 95;
export const START_SMOKE = 2;
export const START_EMP = 1;

// Scoring.
export const SCORE_LOOT_SMALL = 150;
export const SCORE_LOOT_BIG = 400;
export const SCORE_TARGET = 1500;
export const SCORE_TIME_BONUS_PER_SEC = 12;
export const GHOST_ALARM_LIMIT = 50; // stay under this for the Ghost bonus
export const GHOST_BONUS = 800;

// Lasers (floor 3): beams blink on a cycle; crossing a lit beam trips the alarm.
export const LASER_PERIOD = 2.6;
export const LASER_ON = 1.5;

export const COLORS = {
  floorLight: '#2b2620',
  floorDark: '#241f1a',
  marbleLine: '#3a322a',
  wall: '#17120e',
  wallTop: '#4a3b2c',
  caseWood: '#5a3d1e',
  caseGlass: '#8fd4e8',
  vent: '#3d3a35',
  velvet: '#7a1020',
  gold: '#e8b64c',
  goldDim: '#9a7a2e',
  thief: '#1a1a22',
  thiefTrim: '#e8b64c',
  guard: '#2c4a6b',
  guardTrim: '#d8d8d8',
  coneGuard: 'rgba(90, 160, 255, 0.20)',
  coneGuardEdge: 'rgba(120, 190, 255, 0.55)',
  coneCamera: 'rgba(255, 70, 70, 0.18)',
  coneCameraEdge: 'rgba(255, 110, 110, 0.55)',
  cameraBody: '#3a3f46',
  exit: '#2fae5f',
  exitGlow: 'rgba(47, 174, 95, 0.35)',
  alarmLow: '#2fae5f',
  alarmMid: '#e8b64c',
  alarmHigh: '#e23b3b',
  hudBg: '#120e0a',
  hudText: '#f0e6d2',
  hudDim: '#a89878',
  smoke: 'rgba(200, 200, 210, 0.55)',
  laser: 'rgba(255, 40, 60, 0.85)',
};
