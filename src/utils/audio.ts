/**
 * Glamrock Freddy Audio Engine
 * Supports real MP3 playback for Rockstar Row, Voice Greetings, and Lockdown Announcements,
 * plus Web Audio synthesizers for glitch/action SFX and real-time frequency visualization.
 */

export const AUDIO_ASSETS = {
  greeting: '/assets/aistudio/glamrock_freddy_f8731803.mp3',
  lockdown: '/assets/aistudio/glamrock-freddy_53d55e6e.mp3',
  rockstarRow: '/assets/aistudio/04_Rockstar_Row_849df7a1.mp3'
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public isPlayingMusic: boolean = false;
  public currentTrackName: string | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private synthNodes: { stop: () => void } | null = null;
  private mediaSourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

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

  public getByteFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // Play real audio clips (Voice greeting or Lockdown announcement)
  public playClip(url: string, onEnded?: () => void) {
    this.init();
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }

    const audio = new Audio(url);
    this.currentAudioElement = audio;

    // Connect audio to analyser if context exists
    if (this.ctx && this.analyser) {
      try {
        let source: MediaElementAudioSourceNode;
        if (this.mediaSourceMap.has(audio)) {
          source = this.mediaSourceMap.get(audio)!;
        } else {
          source = this.ctx.createMediaElementSource(audio);
          this.mediaSourceMap.set(audio, source);
        }
        source.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      } catch (e) {
        // Fallback to direct element playback
      }
    }

    audio.play().catch(() => {});
    audio.onended = () => {
      if (this.currentAudioElement === audio) {
        this.currentAudioElement = null;
      }
      onEnded?.();
    };
  }

  public playGreeting() {
    this.playClip(AUDIO_ASSETS.greeting);
  }

  public playLockdown() {
    this.playClip(AUDIO_ASSETS.lockdown);
  }

  // Play soundtrack (Rockstar Row uses authentic high-res MP3; others use synth)
  public playMusic(track: 'rockstar' | 'happy' | 'jam', volume = 0.8) {
    this.init();
    this.stopMusic();

    this.isPlayingMusic = true;

    if (track === 'rockstar') {
      this.currentTrackName = 'Rockstar Row (Original)';
      const audio = new Audio(AUDIO_ASSETS.rockstarRow);
      audio.volume = Math.min(Math.max(volume, 0), 1);
      this.currentAudioElement = audio;

      if (this.ctx && this.analyser) {
        try {
          const source = this.ctx.createMediaElementSource(audio);
          source.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
        } catch {
          // Fallback direct audio
        }
      }

      audio.play().catch(() => {});
      audio.onended = () => {
        this.isPlayingMusic = false;
        this.currentTrackName = null;
      };
      return;
    }

    // Synth tracks for other choices
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.currentTrackName = track === 'happy' ? 'Happy (True) Ending' : 'Pizzaplex Neon Jam';

    let isStopped = false;
    const timers: number[] = [];

    const notes: Record<string, number> = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
      C5: 523.25, D5: 587.33, E5: 659.25
    };

    const playNote = (freq: number, duration: number, type: OscillatorType = 'sawtooth', vol = 0.08) => {
      if (isStopped || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol * volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    };

    if (track === 'happy') {
      const melody = [notes.C4, notes.E4, notes.G4, notes.A4, notes.G4, notes.E4, notes.F4, notes.D4];
      let step = 0;
      const t = window.setInterval(() => {
        if (isStopped) return;
        const m = melody[step % melody.length];
        playNote(m, 0.4, 'sine', 0.14);
        if (step % 4 === 0) playNote(notes.C3, 0.8, 'triangle', 0.15);
        step++;
      }, 260);
      timers.push(t);
    } else {
      const chords = [notes.D4, notes.F4, notes.A4, notes.C5];
      let step = 0;
      const t = window.setInterval(() => {
        if (isStopped) return;
        const n = chords[step % chords.length];
        playNote(n, 0.2, 'square', 0.05);
        if (step % 2 === 0) playNote(notes.D3, 0.25, 'sawtooth', 0.09);
        step++;
      }, 180);
      timers.push(t);
    }

    this.synthNodes = {
      stop: () => {
        isStopped = true;
        timers.forEach((t) => clearInterval(t));
      }
    };
  }

  public setVolume(volPercent: number) {
    const val = Math.min(Math.max(volPercent / 100, 0), 1);
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = val;
    }
  }

  public stopMusic() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if (this.synthNodes) {
      this.synthNodes.stop();
      this.synthNodes = null;
    }
    this.isPlayingMusic = false;
    this.currentTrackName = null;
  }

  // Play sound effects by action name
  public playActionSound(action: string) {
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (action.toLowerCase()) {
      case 'lockdown': {
        this.playLockdown();
        break;
      }

      case 'greeting':
      case 'hello': {
        this.playGreeting();
        break;
      }

      case 'reality glitch': {
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

      case 'hug': {
        // Gentle warm harmonic chime
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + 0.5);
        });
        break;
      }

      case 'system override': {
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

        // Snare
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

        // Crash
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
}

export const soundEngine = new SoundEngine();
