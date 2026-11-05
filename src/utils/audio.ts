/**
 * Glamrock Freddy Web Audio Synthesizer
 * Generates authentic 80s Pizzaplex arcade sound effects, robotic jumpscares, and synth soundtracks
 * without external audio dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentTrackNodes: { stop: () => void } | null = null;
  public analyser: AnalyserNode | null = null;
  public isPlayingMusic: boolean = false;
  public currentTrackName: string | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Visualizer frequency data
  public getByteFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // Play sound effects by action name
  public playActionSound(action: string) {
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (action.toLowerCase()) {
      case 'reality glitch': {
        // Frequency sweep with digital noise
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        osc.frequency.setValueAtTime(300, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'teleport': {
        // High frequency warp sweep into sub bass
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case 'solver shield': {
        // Harmonic protective resonant chime
        [330, 440, 660, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.15, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

          osc.connect(gain);
          if (this.analyser) gain.connect(this.analyser);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.05);
          osc.stop(now + 0.7);
        });
        break;
      }

      case 'system override': {
        // 3 urgent warning diagnostic pulses
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now + i * 0.12);

          gain.gain.setValueAtTime(0.2, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.09);

          osc.connect(gain);
          if (this.analyser) gain.connect(this.analyser);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.09);
        }
        break;
      }

      case 'solver jumpscare':
      case 'jumpscare': {
        // Dramatic shockwave roar & static burst
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(280, now);
        osc2.frequency.exponentialRampToValueAtTime(90, now + 0.6);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

        osc.connect(gain);
        osc2.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.65);
        osc2.stop(now + 0.65);
        break;
      }

      case 'roar': {
        // Deep robotic bear animatronic growl
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.2);
        osc.frequency.linearRampToValueAtTime(70, now + 0.7);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

        osc.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);
        break;
      }

      case 'joke': {
        // Classic "ba-dum tss" drum rimshot
        // Kick
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.frequency.setValueAtTime(150, now);
        kick.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        kickGain.gain.setValueAtTime(0.4, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        kick.connect(kickGain);
        kickGain.connect(ctx.destination);
        kick.start(now);
        kick.stop(now + 0.1);

        // Snare at 0.15s
        const snare = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snare.type = 'triangle';
        snare.frequency.setValueAtTime(220, now + 0.15);
        snareGain.gain.setValueAtTime(0.3, now + 0.15);
        snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        snare.connect(snareGain);
        snareGain.connect(ctx.destination);
        snare.start(now + 0.15);
        snare.stop(now + 0.25);

        // Crash cymbal at 0.3s
        const cymbal = ctx.createOscillator();
        const cymbalGain = ctx.createGain();
        cymbal.type = 'sawtooth';
        cymbal.frequency.setValueAtTime(1200, now + 0.3);
        cymbalGain.gain.setValueAtTime(0.2, now + 0.3);
        cymbalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        cymbal.connect(cymbalGain);
        cymbalGain.connect(ctx.destination);
        cymbal.start(now + 0.3);
        cymbal.stop(now + 0.6);
        break;
      }

      default: {
        // Gentle beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    }
  }

  // 80s Synth Music Tracks
  public playMusic(track: 'rockstar' | 'happy' | 'jam') {
    this.init();
    this.stopMusic();
    if (!this.ctx) return;

    const ctx = this.ctx;
    this.isPlayingMusic = true;
    this.currentTrackName = track === 'rockstar' ? 'Rockstar Row' : track === 'happy' ? 'Happy (True) Ending' : 'Pizzaplex Neon Jam';

    let isStopped = false;
    const intervalTimer: number[] = [];

    // Scale notes in Hz
    const notes: Record<string, number> = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25
    };

    const playNote = (freq: number, duration: number, type: OscillatorType = 'sawtooth', volume = 0.08) => {
      if (isStopped || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    };

    if (track === 'rockstar') {
      // Fast, driving 80s glam rock arpeggios
      const bassline = [notes.A3, notes.A3, notes.C4, notes.D4, notes.E4, notes.D4, notes.C4, notes.G3];
      const lead = [notes.E4, notes.A4, notes.C5, notes.B4, notes.A4, notes.E4, notes.G4, notes.A4];
      let step = 0;

      const timer = window.setInterval(() => {
        if (isStopped) return;
        const b = bassline[step % bassline.length];
        const l = lead[step % lead.length];
        playNote(b, 0.22, 'triangle', 0.12);
        if (step % 2 === 0) {
          playNote(l, 0.35, 'sawtooth', 0.07);
        }
        step++;
      }, 160);
      intervalTimer.push(timer);
    } else if (track === 'happy') {
      // Warm, melodic synth anthem
      const melody = [notes.C4, notes.E4, notes.G4, notes.A4, notes.G4, notes.E4, notes.F4, notes.D4];
      let step = 0;
      const timer = window.setInterval(() => {
        if (isStopped) return;
        const m = melody[step % melody.length];
        playNote(m, 0.38, 'sine', 0.14);
        if (step % 4 === 0) {
          playNote(notes.C3, 0.8, 'triangle', 0.15);
        }
        step++;
      }, 260);
      intervalTimer.push(timer);
    } else {
      // Funk Pizzaplex Jam
      const chords = [notes.D4, notes.F4, notes.A4, notes.C5];
      let step = 0;
      const timer = window.setInterval(() => {
        if (isStopped) return;
        const n = chords[step % chords.length];
        playNote(n, 0.18, 'square', 0.05);
        if (step % 2 === 0) playNote(notes.D3, 0.25, 'sawtooth', 0.09);
        step++;
      }, 180);
      intervalTimer.push(timer);
    }

    this.currentTrackNodes = {
      stop: () => {
        isStopped = true;
        intervalTimer.forEach((t) => clearInterval(t));
      }
    };
  }

  public stopMusic() {
    if (this.currentTrackNodes) {
      this.currentTrackNodes.stop();
      this.currentTrackNodes = null;
    }
    this.isPlayingMusic = false;
    this.currentTrackName = null;
  }
}

export const soundEngine = new SoundEngine();
