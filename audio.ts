
// Audio Engine for Sleigh Ride 2: Brave New World (Tech/Sci-Fi Overhaul)

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Dynamic Engine Loop
  private engineOsc: OscillatorNode | null = null;
  private engineMod: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  // Ending Music
  private endingAudio: HTMLAudioElement | null = null;
  private musicFadeInterval: number | null = null;

  // Biome Music (Ambience)
  private bgmTracks: Map<string, HTMLAudioElement> = new Map();
  private currentBgm: HTMLAudioElement | null = null;

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.endingAudio = new Audio('./ending.mp3');
      this.endingAudio.volume = 0;
      this.endingAudio.preload = 'auto';

      const tracks = [
          { id: 'sector_1', src: './wonderland.mp3' }, // Placeholder for ambience
          { id: 'sector_2', src: './gray_world.mp3' },
          { id: 'sector_3', src: './ocean_of_silence.mp3' },
          { id: 'sector_4', src: './great_blizzard.mp3' }
      ];

      tracks.forEach(t => {
          const audio = new Audio(t.src);
          audio.loop = true;
          audio.volume = 0;
          audio.playbackRate = 0.8; // Slow down for "ancient/ruined" feel
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
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);

    this.startEngineLoop();
    
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

  // --- Sci-Fi SFX Generators ---

  // 1. Thruster Sound (White Noise Burst)
  playThruster() {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start();
  }

  // 2. EMP Blast (Low Frequency Sweep + Static)
  playEMP() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Bass Drop
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    // High Pitch Zap
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2000, t);
    osc2.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.1, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc2.connect(gain2); gain2.connect(this.sfxGain);
    
    osc.start(); osc.stop(t + 0.5);
    osc2.start(); osc2.stop(t + 0.3);
  }

  // 3. Hull Damage (Metallic Crunch)
  playDamage() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // FM Synthesis for "Metallic" sound
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    
    carrier.frequency.value = 100;
    modulator.frequency.value = 250; // Ratio 2.5:1 for dissonance
    modGain.gain.setValueAtTime(500, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + 0.4);
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    const outGain = this.ctx.createGain();
    outGain.gain.setValueAtTime(0.4, t);
    outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    
    carrier.connect(outGain);
    outGain.connect(this.sfxGain);
    
    carrier.start(); modulator.start();
    carrier.stop(t + 0.4); modulator.stop(t + 0.4);
  }

  // 4. Data Collection (Digital Chime)
  playCollectData() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    
    // Arpeggio
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1760, t + 0.05);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(); osc.stop(t + 0.15);
  }

  // 5. Low Warning
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

  // --- Engine Loop (Shepard-like Tone) ---
  private startEngineLoop() {
    if (!this.ctx || !this.sfxGain) return;
    
    // Carrier
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 50; 

    // LFO for "Thrum"
    this.engineMod = this.ctx.createOscillator();
    this.engineMod.frequency.value = 10; // 10Hz rumble
    
    const modGain = this.ctx.createGain();
    modGain.gain.value = 10;
    
    this.engineMod.connect(modGain);
    modGain.connect(this.engineOsc.frequency);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0; // Start silent

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineMod.start();
  }

  setEnginePitch(intensity: number) {
    if (this.ctx && this.engineOsc && this.engineGain && this.engineMod) {
      // Intensity 0 to 1
      const pitch = 50 + (intensity * 100); // 50Hz to 150Hz
      const rumble = 10 + (intensity * 20); // Faster rumble
      const vol = 0.1 + (intensity * 0.15);

      const t = this.ctx.currentTime;
      this.engineOsc.frequency.setTargetAtTime(pitch, t, 0.1);
      this.engineMod.frequency.setTargetAtTime(rumble, t, 0.1);
      this.engineGain.gain.setTargetAtTime(vol, t, 0.1);
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
