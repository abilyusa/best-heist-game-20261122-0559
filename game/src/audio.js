// Synthesized sound for The Gilded Hour. One job: every effect is a
// Web Audio oscillator — no audio files, no network, nothing to load.
export class HeistAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarmLoop();
    return this.muted;
  }

  tone(freq, dur, type, gain, slideTo) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    amp.gain.setValueAtTime(gain || 0.08, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  pickup() {
    this.tone(880, 0.12, 'sine', 0.09);
    setTimeout(() => this.tone(1318, 0.16, 'sine', 0.08), 70);
  }

  vaultChime() {
    this.tone(523, 0.25, 'triangle', 0.1);
    setTimeout(() => this.tone(659, 0.25, 'triangle', 0.1), 120);
    setTimeout(() => this.tone(784, 0.4, 'triangle', 0.1), 240);
  }

  smokePuff() {
    this.tone(220, 0.3, 'sawtooth', 0.05, 90);
  }

  empZap() {
    this.tone(1400, 0.18, 'square', 0.05, 180);
  }

  dashWhoosh() {
    this.tone(300, 0.14, 'sine', 0.06, 700);
  }

  spotted() {
    this.tone(196, 0.22, 'square', 0.09, 392);
    setTimeout(() => this.tone(196, 0.22, 'square', 0.09, 392), 180);
  }

  caughtSting() {
    this.tone(110, 0.7, 'sawtooth', 0.12, 55);
    setTimeout(() => this.tone(165, 0.5, 'square', 0.08, 82), 120);
  }

  winFanfare() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.3, 'triangle', 0.1), i * 130);
    });
  }

  click() {
    this.tone(660, 0.06, 'square', 0.05);
  }

  startAlarmLoop() {
    if (this.muted || !this.ctx || this.alarmNodes) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 620;
    amp.gain.value = 0.0;
    const lfo = this.ctx.createOscillator();
    const lfoAmp = this.ctx.createGain();
    lfo.frequency.value = 1.6;
    lfoAmp.gain.value = 0.035;
    lfo.connect(lfoAmp);
    lfoAmp.connect(amp.gain);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start();
    lfo.start();
    this.alarmNodes = { osc, lfo, amp };
  }

  stopAlarmLoop() {
    if (!this.alarmNodes) return;
    try {
      this.alarmNodes.osc.stop();
      this.alarmNodes.lfo.stop();
    } catch (e) { /* already stopped */ }
    this.alarmNodes = null;
  }
}
