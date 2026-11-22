// The three gallery floors of The Gilded Hour. One job: the maps, the
// patrols, the cameras and the lasers of each floor.
// Legend: # wall · . floor · D display case (solid, blocks sight)
//          V vent (walkable, blocks sight) · R velvet rope (solid, see-through)
//          L small loot · B big loot · T the Gilded Hourglass (floor 3)
//          E getaway door · P thief start · K tool cache
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL_DONE = 'leveldone';
export const SCREEN_VICTORY = 'victory';

export const LEVELS = [
  {
    name: 'Floor 1 — The Marble Hall',
    briefing: 'Lift the jade idol and the sapphire brooch, then slip out the service door.',
    map: [
      '########################################',
      '#P....D.......D.........D......L.......#',
      '#.....D.......D..........D.............#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D.......DD........D......D...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D.......DD........D......D...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D...D....DD....D......D......#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D.......DD........D......D...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D...D....DD.......D......D...#',
      '#..K..D.......D.........D......D...B...#',
      '#..V..V..V...V....V.....V...V..V...V..E#',
      '########################################',
    ],
    guards: [
      { path: [[8, 5], [30, 5]], pause: 1.2 },
      { path: [[30, 13], [10, 13]], pause: 1.2 },
      { path: [[20, 3], [20, 16]], pause: 0.8 },
    ],
    cameras: [
      { col: 14, row: 0, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.5 },
      { col: 33, row: 0, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.4 },
    ],
    lasers: [],
  },
  {
    name: 'Floor 2 — The Gilded Gallery',
    briefing: 'Three canvases, one crown jewel. The ropes are low — guards see over them.',
    map: [
      '########################################',
      '#P.....R......R......R.......R.....L...#',
      '#......R......R.......R.......R........#',
      '#..D...R..D...R...D...R...D...R...D....#',
      '#..D......D.......D.......D.......D....#',
      '#..L...R......R.......R.......R.....D..#',
      '#......R......R.......R.......R....D...#',
      '#..D...R..D...R...D...R...D...R...D....#',
      '#..D......D.......D.......D.......D....#',
      '#......R......R.......R.......R........#',
      '#..D...R..D...R...D...R...D...R...D....#',
      '#..D......D.......D.......D.......D....#',
      '#..L...R......R.......R.......R.....D..#',
      '#......R......R.......R.......R....D...#',
      '#..D...R..D...R...D...R...D...R...D....#',
      '#..D......D.......D.......D.......D....#',
      '#......R......R.......R.......R........#',
      '#..K...R..D...R...B...R...D...R...D..L.#',
      '#..V...V..V...V...V...V...V...V...V..E.#',
      '########################################',
    ],
    guards: [
      { path: [[6, 4], [33, 4]], pause: 1.0 },
      { path: [[33, 10], [6, 10]], pause: 1.0 },
      { path: [[12, 16], [12, 2]], pause: 0.9 },
      { path: [[27, 2], [27, 16]], pause: 0.9 },
    ],
    cameras: [
      { col: 10, row: 0, baseAngle: Math.PI / 2, sweep: 1.1, speed: 0.6 },
      { col: 20, row: 0, baseAngle: Math.PI / 2, sweep: 1.1, speed: 0.5 },
      { col: 30, row: 0, baseAngle: Math.PI / 2, sweep: 1.1, speed: 0.55 },
      { col: 38, row: 9, baseAngle: Math.PI, sweep: 0.8, speed: 0.45 },
    ],
    lasers: [],
  },
  {
    name: 'Floor 3 — The Vault of Hours',
    briefing: 'The Gilded Hourglass waits behind the lasers. Take it — the vault alarm will scream.',
    map: [
      '########################################',
      '#P....D.......D.........D......D.......#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D.......DD........D......D...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D.......DD........D......D...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D.....D...D....DD....D......D...T...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D.......DD........D......D...#',
      '#.....D.......D.........D......D.......#',
      '#..D..D...D...D....DD....D...D.....D...#',
      '#..D......D...D....DD.......D......D...#',
      '#..K..D......D....B.....D......D...B...#',
      '#..V..V..V...V....V.....V...V..V...V..E#',
      '########################################',
    ],
    guards: [
      { path: [[8, 5], [31, 5]], pause: 0.8 },
      { path: [[31, 14], [8, 14]], pause: 0.8 },
      { path: [[15, 2], [15, 17]], pause: 0.7 },
      { path: [[24, 17], [24, 2]], pause: 0.7 },
      { path: [[35, 10], [35, 3]], pause: 0.7 },
    ],
    cameras: [
      { col: 12, row: 0, baseAngle: Math.PI / 2, sweep: 1.2, speed: 0.7 },
      { col: 22, row: 0, baseAngle: Math.PI / 2, sweep: 1.2, speed: 0.6 },
      { col: 32, row: 0, baseAngle: Math.PI / 2, sweep: 1.2, speed: 0.65 },
      { col: 1, row: 10, baseAngle: 0, sweep: 0.9, speed: 0.5 },
      { col: 38, row: 10, baseAngle: Math.PI, sweep: 0.9, speed: 0.5 },
    ],
    // Lasers guard the middle corridors; they blink on a shared cycle.
    lasers: [
      { x1: 10, y1: 9, x2: 10, y2: 17, phase: 0 },
      { x1: 19, y1: 2, x2: 19, y2: 8, phase: 0.9 },
      { x1: 28, y1: 11, x2: 28, y2: 17, phase: 1.7 },
    ],
  },
];
