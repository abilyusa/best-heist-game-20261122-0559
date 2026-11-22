// Keyboard and mouse for The Gilded Hour. One job: turn raw browser
// events into the game's own input state (held keys, clicks, mouse tile).
export class HeistInput {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since last consume
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
    this.mouseDown = false;
    this.canvas = canvas;
    this.onKey = null; // set by main.js for menu keys

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(key);
      this.keys.add(key);
      if (this.onKey) this.onKey(key);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this.mouseDown = true;
        this.mouseClicked = true;
        const rect = canvas.getBoundingClientRect();
        this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
        this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      }
    });
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  held(key) {
    return this.keys.has(key);
  }

  // True once per physical press; callers consume it each frame.
  wasPressed(key) {
    return this.pressed.has(key);
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.held('a') || this.held('arrowleft')) x -= 1;
    if (this.held('d') || this.held('arrowright')) x += 1;
    if (this.held('w') || this.held('arrowup')) y -= 1;
    if (this.held('s') || this.held('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
    this.mouseClicked = false;
  }
}
