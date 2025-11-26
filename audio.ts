

// Audio Engine for Sleigh Ride 2: Brave New World

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Phase Loop
  private phaseOsc: OscillatorNode | null = null;
  private phaseGain: GainNode | null = null;

  // Engine Loop
  private engineOsc: OscillatorNode | null = null;
  private engineMod: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  // Music
  private endingAudio: HTMLAudioElement | null = null;
  private musicFadeInterval: number | null = null;
  private bgmTracks: Map<string, HTMLAudioElement> = new Map();
  private currentBgm: HTMLAudioElement | null = null;

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.endingAudio = new Audio('./ending.mp3');
      this.endingAudio.volume = 0;
      this.endingAudio.preload = 'auto';

      const tracks = [
          { id: 'sector_1', src: './wonderland.mp3' }, 
          { id: 'sector_2', src: './gray_world.mp3' },
          { id: 'sector_3', src: './ocean_of_silence.mp3' },
          { id: 'sector_4', src: './great_blizzard.mp3' }
      ];

      tracks.forEach(t => {
          const audio = new Audio(t.src);
          audio.loop = true;
          audio.volume = 0;
          audio.playbackRate = 0.9; 
          audio.preload = 'auto';
          this.bgmTracks.set(t.id, audio);
      });
    }
  }

  init() {
    if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
    }
    
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    this.startEngineLoop();
    this.startPhaseLoop(); // Initialize phase sound (muted initially)
    
    if (this.endingAudio) this.endingAudio.load();
    this.bgmTracks.forEach(track => track.load());
  }

  reset() {
    this.stopEndingMusic();
    this.stopBgm();
  }

  // --- BGM Logic ---

  playLevelBgm(levelIndex: number) {
      let trackKey: string | null = null;
      if (levelIndex === 0) trackKey = 'sector_1';
      else if (levelIndex === 1) trackKey = 'sector_2';
      else if (levelIndex === 2) trackKey = 'sector_3';
      else if (levelIndex === 3) trackKey = 'sector_4';
      
      this.transitionBgm(trackKey);
  }

  stopBgm() {
      this.transitionBgm(null);
  }

  private transitionBgm(trackKey: string | null) {
      const newTrack = trackKey ? this.bgmTracks.get(trackKey) : null;
      if (this.currentBgm === newTrack) return;

      if (this.currentBgm) {
          const oldTrack = this.currentBgm;
          this.fadeVolume(oldTrack, 0, 2000, () => {
              oldTrack.pause();
              oldTrack.currentTime = 0;
          });
      }

      if (newTrack) {
          newTrack.volume = 0;
          newTrack.play().catch(e => console.warn("BGM play failed", e));
          this.fadeVolume(newTrack, 0.4, 2000);
          this.currentBgm = newTrack;
      } else {
          this.currentBgm = null;
      }
  }

  private fadeVolume(audio: HTMLAudioElement, target: number, duration: number, onComplete?: () => void) {
      const stepTime = 50;
      const steps = duration / stepTime;
      const diff = target - audio.volume;
      const stepVol = diff / steps;
      
      const interval = setInterval(() => {
          let newVol = audio.volume + stepVol;
          newVol = Math.max(0, Math.min(1, newVol));
          audio.volume = newVol;
          if ((stepVol >= 0 && newVol >= target) || (stepVol < 0 && newVol <= target)) {
              audio.volume = target;
              clearInterval(interval);
              if (onComplete) onComplete();
          }
      }, stepTime);
  }

  // --- SFX ---

  playPhaseActivate() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + 0.2);
  }

  playScanSuccess() {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(t + 0.1);
  }

  playDamage() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    
    carrier.frequency.value = 100;
    modulator.frequency.value = 50; 
    modGain.gain.setValueAtTime(500, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + 0.3);
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    const outGain = this.ctx.createGain();
    outGain.gain.setValueAtTime(0.4, t);
    outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    carrier.connect(outGain);
    outGain.connect(this.sfxGain);
    
    carrier.start(); modulator.start();
    carrier.stop(t + 0.3); modulator.stop(t + 0.3);
  }

  playCollectData() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(1800, t + 0.05);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(); osc.stop(t + 0.1);
  }

  playLowEnergy() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 150;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(); osc.stop(t + 0.1);
  }

  // --- Engine & Phase Loops ---
  private startEngineLoop() {
    if (!this.ctx || !this.sfxGain) return;
    
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 50; 

    this.engineMod = this.ctx.createOscillator();
    this.engineMod.frequency.value = 10; 
    
    const modGain = this.ctx.createGain();
    modGain.gain.value = 10;
    
    this.engineMod.connect(modGain);
    modGain.connect(this.engineOsc.frequency);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0; 

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineMod.start();
  }

  private startPhaseLoop() {
      if (!this.ctx || !this.sfxGain) return;
      
      this.phaseOsc = this.ctx.createOscillator();
      this.phaseOsc.type = 'sine';
      this.phaseOsc.frequency.value = 100;

      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 15; // Fast vibrato
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 50;
      lfo.connect(lfoGain);
      lfoGain.connect(this.phaseOsc.frequency);
      lfo.start();

      this.phaseGain = this.ctx.createGain();
      this.phaseGain.gain.value = 0;

      this.phaseOsc.connect(this.phaseGain);
      this.phaseGain.connect(this.sfxGain);
      this.phaseOsc.start();
  }

  setEnginePitch(intensity: number) {
    if (this.ctx && this.engineOsc && this.engineGain && this.engineMod) {
      const pitch = 50 + (intensity * 100); 
      const rumble = 10 + (intensity * 20); 
      const vol = 0.1 + (intensity * 0.15);

      const t = this.ctx.currentTime;
      this.engineOsc.frequency.setTargetAtTime(pitch, t, 0.1);
      this.engineMod.frequency.setTargetAtTime(rumble, t, 0.1);
      this.engineGain.gain.setTargetAtTime(vol, t, 0.1);
    }
  }

  setPhaseVolume(isActive: boolean) {
      if (this.ctx && this.phaseGain) {
          const t = this.ctx.currentTime;
          this.phaseGain.gain.setTargetAtTime(isActive ? 0.3 : 0, t, 0.1);
      }
  }

  playEndingMusic(startOffsetSeconds: number = 0, fadeDurationSeconds: number = 10) {
    if (!this.endingAudio) return;
    this.stopBgm();
    
    this.endingAudio.pause();
    this.endingAudio.currentTime = startOffsetSeconds;
    this.endingAudio.volume = 0;
    
    this.endingAudio.play().then(() => {
        let vol = 0;
        const step = 1 / (fadeDurationSeconds * 10);
        if (this.musicFadeInterval) clearInterval(this.musicFadeInterval);
        this.musicFadeInterval = window.setInterval(() => {
            if (!this.endingAudio) return;
            vol = Math.min(1, vol + step);
            this.endingAudio.volume = vol;
            if (vol >= 1 && this.musicFadeInterval) clearInterval(this.musicFadeInterval);
        }, 100);
    });
  }

  stopEndingMusic() {
    if (this.endingAudio) {
        this.endingAudio.pause();
        this.endingAudio.currentTime = 0;
    }
    if (this.musicFadeInterval) clearInterval(this.musicFadeInterval);
  }
}

export const soundManager = new SoundManager();
