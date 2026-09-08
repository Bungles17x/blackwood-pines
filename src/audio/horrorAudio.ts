/**
 * Pure Web Audio API Realistic Horror Audio Engine
 * Zero funky sounds: all synth sweeps, musical arpeggios, laser scrapes,
 * square-wave arcade bleeps, and whistling filters have been completely removed.
 * Sound design is strictly naturalistic, subtle, and grounded.
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tunnelFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Ultra-subtle low realistic room presence (no oscillators, no synth drone)
  private roomToneSource: AudioBufferSourceNode | null = null;

  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

      this.tunnelFilter = this.ctx.createBiquadFilter();
      this.tunnelFilter.type = 'lowpass';
      this.tunnelFilter.frequency.setValueAtTime(18000, this.ctx.currentTime);

      this.masterGain.connect(this.tunnelFilter);
      this.tunnelFilter.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Clean, quiet room presence: no funky oscillators or detuned synths
      this.startCleanRoomTone();

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  // Realistic, whisper-quiet low-end room tone (pure filtered pink noise below 55Hz)
  // Completely removes the funky sawtooth/sine detuned oscillators and LFO sweeps
  private startCleanRoomTone() {
    if (!this.ctx || !this.ambientGain) return;

    try {
      const bufferSize = 3 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // 3-pole pinking filter for soft natural atmospheric presence
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.04;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(55, this.ctx.currentTime);

      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      noiseSource.connect(lowpass);
      lowpass.connect(toneGain);
      toneGain.connect(this.ambientGain);

      noiseSource.start();
      this.roomToneSource = noiseSource;
    } catch (e) {
      console.warn('Error starting room tone:', e);
    }
  }

  // Cardiovascular heartbeat timer
  private lastHeartbeatTime: number = 0;
  private dieselEngineSource: AudioBufferSourceNode | null = null;
  private dieselGain: GainNode | null = null;

  // Realistic EMF walkie-talkie audio clicks / crackles based on creature proximity
  public updateRadioStatic(distanceToMonster: number) {
    if (!this.ctx || !this.sfxGain || distanceToMonster > 18) return;
    const now = this.ctx.currentTime;
    // Periodic random subtle geiger/radio clicks when creature is close
    const clickProbability = Math.max(0.02, Math.min(0.25, (1 - distanceToMonster / 18) * 0.25));
    if (Math.random() < clickProbability) {
      this.createDampedClick(now, 1800 + Math.random() * 800, 0.05);
    }
  }

  // Realistic Cardiovascular Heartbeat & Panic system
  // As the creature draws near (< 22m), an authentic deep sub-bass dual-pulse ("lub-dub") begins.
  // Rate dynamically accelerates from 65 BPM at 22m to 140 BPM when being stalked or chased.
  public updateFearLevel(fear: number, distanceToMonster: number) {
    if (!this.ctx || !this.sfxGain) return;
    if (distanceToMonster > 24) return;

    const now = this.ctx.currentTime;
    // Map distance to BPM: 24m -> 65 BPM, 5m -> 140 BPM
    const proximity = Math.max(0, Math.min(1, 1 - (distanceToMonster - 5) / 19));
    const targetBpm = 65 + proximity * 75; // 65 to 140 BPM
    const beatInterval = 60 / targetBpm;

    if (now - this.lastHeartbeatTime >= beatInterval) {
      this.lastHeartbeatTime = now;
      this.playHeartbeatThump(proximity);
    }
  }

  // Authentic "lub-dub" cardiac thump (pure low sub sine + damped chest impact)
  private playHeartbeatThump(intensity: number) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const baseVol = 0.12 + intensity * 0.35;

    // 1. "Lub" - First ventricular contraction
    this.createCardiacPulse(t, 58, baseVol, 0.12);

    // 2. "Dub" - Second pulmonary valve closure (~110ms later)
    this.createCardiacPulse(t + 0.11, 48, baseVol * 0.75, 0.10);
  }

  private createCardiacPulse(startTime: number, freq: number, vol: number, duration: number) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(32, startTime + duration);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {}
  }

  // Realistic Diesel Engine Starter Crank & Sustained Idle
  public playDieselEngineStart() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Starter pull-cord mechanical yank
    this.createDampedClick(t, 320, 0.35);
    this.createDampedClick(t + 0.05, 540, 0.28);

    // 2. Three heavy compression strokes / chugs before catching
    const chugTimes = [0.15, 0.35, 0.52];
    chugTimes.forEach((ct, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(45 + idx * 8, t + ct);
      osc.frequency.exponentialRampToValueAtTime(25, t + ct + 0.12);

      gain.gain.setValueAtTime(0.35, t + ct);
      gain.gain.exponentialRampToValueAtTime(0.001, t + ct + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + ct);
      osc.stop(t + ct + 0.16);
    });

    // 3. Engine catches and runs with deep mechanical diesel idle
    setTimeout(() => {
      this.startContinuousDieselIdle();
    }, 700);
  }

  private startContinuousDieselIdle() {
    if (!this.ctx || !this.sfxGain) return;
    if (this.dieselEngineSource) return;

    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Procedural 4-stroke diesel piston cycle
      for (let i = 0; i < bufferSize; i++) {
        const time = i / this.ctx.sampleRate;
        // 22Hz primary cylinder combustion rate
        const pulse = Math.sin(2 * Math.PI * 22 * time) > 0.85 ? 1.0 : 0.0;
        const sub = Math.sin(2 * Math.PI * 11 * time) * 0.4;
        const noise = (Math.random() * 2 - 1) * 0.15;
        data[i] = (pulse * 0.6 + sub + noise) * 0.35;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.dieselGain = this.ctx.createGain();
      this.dieselGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.dieselGain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 1.2);

      source.connect(filter);
      filter.connect(this.dieselGain);
      this.dieselGain.connect(this.sfxGain);

      source.start();
      this.dieselEngineSource = source;
    } catch (e) {
      console.warn('Could not start diesel engine audio:', e);
    }
  }

  // Liquid fuel pouring into metal tank
  public playFuelPouring() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Liquid glugging stream
    for (let g = 0; g < 4; g++) {
      const glugTime = t + g * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + Math.random() * 60, glugTime);
      osc.frequency.exponentialRampToValueAtTime(290, glugTime + 0.12);

      gain.gain.setValueAtTime(0.18, glugTime);
      gain.gain.exponentialRampToValueAtTime(0.001, glugTime + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(glugTime);
      osc.stop(glugTime + 0.16);
    }
  }

  // Vacuum radio tube bayonet socket installation
  public playRadioTubeInstall() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Delicate glass pin insertion
    this.createDampedClick(t, 1400, 0.22);
    this.createDampedClick(t + 0.08, 1950, 0.28);
  }

  // Realistic Emergency Radio Broadcast
  // Crackling shortwave radio burst with squelch, dispatcher tone, and atmospheric radio transmission
  public playRadioDistressBroadcast() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Radio squelch burst (static open)
    const bufSize = Math.floor(0.12 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.22;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // 2. Emergency 1000Hz dispatcher chirp
    const chirp = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirp.type = 'sine';
    chirp.frequency.setValueAtTime(1050, t + 0.14);
    chirpGain.gain.setValueAtTime(0.18, t + 0.14);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    chirp.connect(chirpGain);
    chirpGain.connect(this.sfxGain);
    chirp.start(t + 0.14);
    chirp.stop(t + 0.35);

    // 3. Simulated speech formant radio audio (eerie ranger distress modulation)
    const formantPitches = [165, 185, 140, 195, 150, 130, 175, 160, 145, 120];
    formantPitches.forEach((pitch, idx) => {
      const wordTime = t + 0.38 + idx * 0.22;
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, wordTime);

      const f1 = this.ctx!.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(750 + (idx % 3) * 200, wordTime);
      f1.Q.setValueAtTime(3.5, wordTime);

      oscGain.gain.setValueAtTime(0.12, wordTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, wordTime + 0.18);

      osc.connect(f1);
      f1.connect(oscGain);
      oscGain.connect(this.sfxGain!);

      osc.start(wordTime);
      osc.stop(wordTime + 0.2);
    });

    // 4. Radio squelch close
    setTimeout(() => {
      if (this.ctx && this.sfxGain) {
        this.createDampedClick(this.ctx.currentTime, 1200, 0.25);
      }
    }, 2800);
  }

  // Terrifying Bloodcurdling Monster Enrage Scream (Triggers when Generator turns on)
  public playMonsterEnrageRoar() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Sub rumble that shakes the chest
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(55, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 2.5);

    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 3.0);

    // Unearthly guttural throat shriek
    const shriekOsc = this.ctx.createOscillator();
    const shriekGain = this.ctx.createGain();
    shriekOsc.type = 'sawtooth';
    shriekOsc.frequency.setValueAtTime(220, t + 0.2);
    shriekOsc.frequency.linearRampToValueAtTime(380, t + 0.8);
    shriekOsc.frequency.exponentialRampToValueAtTime(95, t + 2.4);

    const shriekFilter = this.ctx.createBiquadFilter();
    shriekFilter.type = 'bandpass';
    shriekFilter.frequency.setValueAtTime(550, t + 0.2);
    shriekFilter.Q.setValueAtTime(4.0, t + 0.2);

    shriekGain.gain.setValueAtTime(0.001, t + 0.2);
    shriekGain.gain.linearRampToValueAtTime(0.4, t + 0.6);
    shriekGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);

    shriekOsc.connect(shriekFilter);
    shriekFilter.connect(shriekGain);
    shriekGain.connect(this.sfxGain);

    shriekOsc.start(t + 0.2);
    shriekOsc.stop(t + 2.7);
  }

  // Flashlight click: realistic mechanical tactile micro-switch (no square waves or arcade bleeps)
  public playFlashlightClick(_stateOn: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufferSize = Math.floor(0.012 * this.ctx.sampleRate);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const clickSource = this.ctx.createBufferSource();
    clickSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

    clickSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    clickSource.start(t);
  }

  // Flashlight flicker: subtle realistic switch rattle (no sawtooth sweeps)
  public playFlashlightFlicker() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufferSize = Math.floor(0.015 * this.ctx.sampleRate);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.Q.setValueAtTime(1.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Flashlight physical barrel whack: strike casing to reseat loose battery contact
  public playFlashlightTap() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Hand impact thud
    const bufferSize = Math.floor(0.035 * this.ctx.sampleRate);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // 2. Metallic cylindrical ring & internal spring vibration
    const ringOsc = this.ctx.createOscillator();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(580, t);
    ringOsc.frequency.exponentialRampToValueAtTime(390, t + 0.07);

    const ringGain = this.ctx.createGain();
    ringGain.gain.setValueAtTime(0.16, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    ringOsc.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ringOsc.start(t);
    ringOsc.stop(t + 0.075);
  }

  // Industrial diesel generator manual recoil starter cord pull
  public playRecoilCordPull(success: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Nylon cord friction zip against starter housing
    const cordBufSize = Math.floor(0.32 * this.ctx.sampleRate);
    const cordBuf = this.ctx.createBuffer(1, cordBufSize, this.ctx.sampleRate);
    const cordData = cordBuf.getChannelData(0);
    for (let i = 0; i < cordBufSize; i++) {
      const env = Math.sin((i / cordBufSize) * Math.PI);
      cordData[i] = (Math.random() * 2 - 1) * env * 0.35;
    }
    const cordSource = this.ctx.createBufferSource();
    cordSource.buffer = cordBuf;
    const cordFilter = this.ctx.createBiquadFilter();
    cordFilter.type = 'bandpass';
    cordFilter.frequency.setValueAtTime(1200, t);
    cordFilter.frequency.linearRampToValueAtTime(2400, t + 0.28);

    const cordGain = this.ctx.createGain();
    cordGain.gain.setValueAtTime(0.38, t);
    cordGain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

    cordSource.connect(cordFilter);
    cordFilter.connect(cordGain);
    cordGain.connect(this.sfxGain);
    cordSource.start(t);

    // 2. Ratchet pawl engagement clicks
    const clicks = 5;
    for (let c = 0; c < clicks; c++) {
      const ct = t + 0.05 + c * 0.045;
      const clickOsc = this.ctx.createOscillator();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(920 - c * 60, ct);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.16, ct);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ct + 0.02);

      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(ct);
      clickOsc.stop(ct + 0.022);
    }

    // 3. Cylinder compression gasp / sputter if not caught yet
    if (!success) {
      const chugT = t + 0.26;
      const chugOsc = this.ctx.createOscillator();
      chugOsc.type = 'sine';
      chugOsc.frequency.setValueAtTime(70, chugT);
      chugOsc.frequency.exponentialRampToValueAtTime(35, chugT + 0.35);

      const chugGain = this.ctx.createGain();
      chugGain.gain.setValueAtTime(0.32, chugT);
      chugGain.gain.exponentialRampToValueAtTime(0.001, chugT + 0.35);

      chugOsc.connect(chugGain);
      chugGain.connect(this.sfxGain);
      chugOsc.start(chugT);
      chugOsc.stop(chugT + 0.36);
    }
  }

  // Involuntary hypothermic shivering teeth chattering
  public playShiveringTeethChatter() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const clicks = 5;
    for (let i = 0; i < clicks; i++) {
      const ct = t + i * 0.05 + (Math.random() - 0.5) * 0.01;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1700 + Math.random() * 250, ct);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.07, ct);
      g.gain.exponentialRampToValueAtTime(0.001, ct + 0.016);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(ct);
      osc.stop(ct + 0.018);
    }
  }

  // Physiological auditory exclusion (tunnel hearing) under adrenaline panic
  public setAdrenalineMuffle(ratio: number) {
    if (!this.ctx || !this.tunnelFilter) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    // High panic drops master cutoff to 720Hz, muffling ambient world sounds
    const targetFreq = 18000 + (720 - 18000) * clamped;
    this.tunnelFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.12);
  }

  // Realistic surface-aware footstep: acoustic sole contact for wood, gravel, and damp earth
  public playFootstep(
    isSprinting = false,
    isCrouching = false,
    surface: 'dirt' | 'wood' | 'gravel' = 'dirt'
  ) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const baseVol = isCrouching ? 0.04 : isSprinting ? 0.28 : 0.14;
    let filterFreq = isCrouching ? 220 : isSprinting ? 480 : 340;

    // Wood floor plank acoustic resonance
    if (surface === 'wood') {
      filterFreq = isCrouching ? 280 : isSprinting ? 620 : 420;
      try {
        const plankOsc = this.ctx.createOscillator();
        plankOsc.type = 'triangle';
        plankOsc.frequency.setValueAtTime(160 + Math.random() * 40, t);
        plankOsc.frequency.exponentialRampToValueAtTime(75, t + 0.08);

        const plankGain = this.ctx.createGain();
        plankGain.gain.setValueAtTime(baseVol * 0.45, t);
        plankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

        plankOsc.connect(plankGain);
        plankGain.connect(this.sfxGain);
        plankOsc.start(t);
        plankOsc.stop(t + 0.09);
      } catch {}
    }

    const bufferSize = Math.floor((surface === 'gravel' ? 0.08 : 0.06) * this.ctx.sampleRate);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const decayFactor = surface === 'gravel' ? 0.4 : 0.3;
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * decayFactor));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = surface === 'gravel' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(surface === 'gravel' ? 850 : filterFreq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(baseVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (surface === 'gravel' ? 0.075 : 0.055));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Short human exertion sound layered onto occasional active strides.
  public playPlayerEffort(isSprinting = false) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const duration = isSprinting ? 0.24 : 0.16;
    const bufferSize = Math.floor(duration * this.ctx.sampleRate);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const attack = Math.min(1, progress * 12);
      const release = Math.max(0, 1 - progress);
      const breathPulse = Math.sin(progress * Math.PI);
      data[i] = (Math.random() * 2 - 1) * attack * release * (isSprinting ? 0.2 : 0.09) * breathPulse;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isSprinting ? 720 : 560, t);
    filter.Q.setValueAtTime(1.2, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isSprinting ? 0.18 : 0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(t);
  }

  // Realistic cold air exhalation breath with dual-filtered throat warmth
  public playColdExhale(heavy = false) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    try {
      const duration = heavy ? 0.85 : 0.65;
      const bufSize = Math.floor(duration * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);

      // Pinkish noise with organic breathing velocity contour
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufSize; i++) {
        const progress = i / bufSize;
        // Natural exhalation envelope: rises rapidly in first 25%, then slowly diffuses
        const envelope =
          progress < 0.25
            ? Math.sin((progress / 0.25) * (Math.PI / 2))
            : Math.cos(((progress - 0.25) / 0.75) * (Math.PI / 2));

        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = (b0 + b1 + b2 + white * 0.5362) * 0.11;

        data[i] = pink * envelope * (heavy ? 0.38 : 0.22);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      // Dual formants for realistic human throat & nasal cavity
      const throatFilter = this.ctx.createBiquadFilter();
      throatFilter.type = 'bandpass';
      throatFilter.frequency.setValueAtTime(heavy ? 680 : 540, t);
      throatFilter.frequency.exponentialRampToValueAtTime(heavy ? 480 : 420, t + duration);
      throatFilter.Q.setValueAtTime(2.2, t);

      const airFilter = this.ctx.createBiquadFilter();
      airFilter.type = 'lowpass';
      airFilter.frequency.setValueAtTime(heavy ? 2200 : 1600, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.22 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(throatFilter);
      throatFilter.connect(airFilter);
      airFilter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    } catch {}
  }

  // Realistic subtle cold air inhalation
  public playColdInhale(heavy = false) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    try {
      const duration = heavy ? 0.55 : 0.4;
      const bufSize = Math.floor(duration * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);

      for (let i = 0; i < bufSize; i++) {
        const progress = i / bufSize;
        const env = Math.sin(progress * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * (heavy ? 0.18 : 0.08);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(heavy ? 720 : 600, t);
      filter.Q.setValueAtTime(1.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.14 : 0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    } catch {}
  }

  // Sharp gasp of air when breaking breath hold or surviving jump fright
  public playGaspRecovery() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    try {
      this.playColdInhale(true);
      setTimeout(() => this.playColdExhale(true), 400);
    } catch {}
  }

  // Distant nocturnal owl call in the misty mountain forest
  public playNocturnalOwl() {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;
    try {
      // Two-tone soft owl hoot (480Hz -> 430Hz)
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.35);
      osc.frequency.setValueAtTime(480, t + 0.48);
      osc.frequency.exponentialRampToValueAtTime(390, t + 0.95);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.38);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.52);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(t);
      osc.stop(t + 1.15);
    } catch {}
  }

  // Realistic Jumpscare: deep muffled impact & low shockwave (no 6-oscillator organ chords)
  public playJumpScare() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Low sub impact boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.6);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 0.75);

    // Sudden damped noise rush
    const bufSize = Math.floor(0.4 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
  }

  // ==========================================
  // MONSTER AUDIO: ORGANIC & NATURALISTIC SOUND DESIGN
  // Zero arcade synths, sweeps, or laser chirps.
  // Deep throat rumbles, guttural growls, heavy ragged breaths, and twig snaps.
  // ==========================================

  // Rasping, ragged wet breathing in darkness
  public playMonsterHeavyBreathing(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 18) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.02, Math.min(0.28, (1 - distance / 18) * 0.28));

    try {
      const bufSize = Math.floor(0.7 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(360, t);
      filter.Q.setValueAtTime(2.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.005, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.68);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {
      console.warn('Error playing monster breathing:', e);
    }
  }

  // Sharp twig snap when the creature treads on dry pine branches in the dark
  public playTwigSnap(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 25) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.03, Math.min(0.35, (1 - distance / 25) * 0.35));

    try {
      const bufSize = Math.floor(0.04 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {
      console.warn('Error playing twig snap:', e);
    }
  }

  // Human Jump Exertion Groan: realistic breath and vocal cord compression
  public playJumpGroan() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    try {
      // Breath push / throat exhalation noise instead of an artificial pitched tone.
      this.playColdExhale(true);
      const bufSize = Math.floor(0.18 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(750, t);
      noiseFilter.Q.setValueAtTime(1.4, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {
      console.warn('Error playing jump groan:', e);
    }
  }

  // Human Heavy Landing Groan / Impact breath knocked out
  public playLandGroan(impact: number = 5.0, surface: 'dirt' | 'wood' | 'gravel' = 'dirt') {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const intensity = Math.min(1.0, Math.max(0.2, impact / 7.0));

    try {
      // Chest-compression breath instead of an artificial pitched groan.
      this.playColdExhale(true);
      const bufSize = Math.floor(0.25 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(480, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2 * intensity, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);

      // Surface-aware landing contact with a short, weighted impact.
      this.playFootstep(false, false, surface);
    } catch (e) {
      console.warn('Error playing land groan:', e);
    }
  }

  // Terrifying Demonic Monster Roar when stalking or charging
  public playMonsterRoar(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 36) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.08, Math.min(0.75, (1 - distance / 36) * 0.75));

    try {
      // 1. Sub-bass chest rumble
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 1.2);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(vol * 0.7, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 1.25);

      // 2. Guttural vocal larynx fry with harsh AM modulation
      const throatOsc = this.ctx.createOscillator();
      throatOsc.type = 'sawtooth';
      throatOsc.frequency.setValueAtTime(82, t);
      throatOsc.frequency.exponentialRampToValueAtTime(38, t + 1.1);

      // Harsh 38Hz amplitude flutter (vocal cord gravel)
      const amOsc = this.ctx.createOscillator();
      amOsc.frequency.setValueAtTime(38, t);
      const amGain = this.ctx.createGain();
      amGain.gain.setValueAtTime(0.5, t);
      amOsc.connect(amGain.gain);

      // Formant mouth filter
      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(380, t);
      formant1.frequency.exponentialRampToValueAtTime(190, t + 1.1);
      formant1.Q.setValueAtTime(2.8, t);

      const roarGain = this.ctx.createGain();
      roarGain.gain.setValueAtTime(0.01, t);
      roarGain.gain.linearRampToValueAtTime(vol, t + 0.12);
      roarGain.gain.exponentialRampToValueAtTime(0.001, t + 1.15);

      throatOsc.connect(formant1);
      formant1.connect(roarGain);
      roarGain.connect(this.sfxGain);

      throatOsc.start(t);
      throatOsc.stop(t + 1.2);
      amOsc.start(t);
      amOsc.stop(t + 1.2);

      // 3. Turbulent wet lung blast & saliva roar
      const bufSize = Math.floor(1.1 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.45));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(650, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(240, t + 1.0);
      noiseFilter.Q.setValueAtTime(1.8, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(vol * 0.65, t + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {
      console.warn('Error playing monster roar:', e);
    }
  }

  // Low Menacing Predator Throat Growl
  public playMonsterGrowl(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 26) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.04, Math.min(0.55, (1 - distance / 26) * 0.55));

    try {
      // Sub rumbling oscillation
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(62, t);
      osc.frequency.linearRampToValueAtTime(42, t + 0.9);

      // Throat rattle LFO
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(22, t); // 22 Hz guttural flutter
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.4, t);
      lfo.connect(lfoGain.gain);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 1.0);
      lfo.start(t);
      lfo.stop(t + 1.0);
    } catch (e) {
      console.warn('Error playing monster growl:', e);
    }
  }

  // Blood-Curdling Monster Shriek / Wail
  public playMonsterShriek(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 32) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.06, Math.min(0.65, (1 - distance / 32) * 0.65));

    try {
      // Discordant dual screaming tones
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(840, t);
      osc1.frequency.exponentialRampToValueAtTime(320, t + 0.85);

      osc2.frequency.setValueAtTime(895, t); // dissonant beating
      osc2.frequency.exponentialRampToValueAtTime(340, t + 0.85);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, t);
      filter.frequency.exponentialRampToValueAtTime(450, t + 0.8);
      filter.Q.setValueAtTime(4.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc1.stop(t + 0.95);
      osc2.start(t);
      osc2.stop(t + 0.95);
    } catch (e) {
      console.warn('Error playing monster shriek:', e);
    }
  }

  // Chilling Predatory Bone Clicks / Mandible Chittering (Echolocation)
  public playMonsterClicks(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 24) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.04, Math.min(0.45, (1 - distance / 24) * 0.45));

    try {
      // Rapid sequence of 5 sharp clicks
      for (let i = 0; i < 5; i++) {
        const clickTime = t + i * 0.065 + (Math.random() * 0.015);
        const bufSize = Math.floor(0.02 * this.ctx.sampleRate);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < bufSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.2));
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2800 + i * 150, clickTime);
        filter.Q.setValueAtTime(4.5, clickTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * (0.8 + Math.random() * 0.4), clickTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.02);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        src.start(clickTime);
      }
    } catch (e) {
      console.warn('Error playing monster clicks:', e);
    }
  }

  // Vicious Close-Range Snarl with Fangs
  public playMonsterSnarl(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 20) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.05, Math.min(0.5, (1 - distance / 20) * 0.5));

    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(70, t + 0.5);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(480, t);
      filter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.6);
    } catch (e) {
      console.warn('Error playing monster snarl:', e);
    }
  }

  // Eerie Distorted Whispers drifting through the pines
  public playDistortedWhispers(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 22) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.02, Math.min(0.28, (1 - distance / 22) * 0.28));

    try {
      const bufSize = Math.floor(0.9 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.linearRampToValueAtTime(1400, t + 0.45);
      filter.frequency.linearRampToValueAtTime(700, t + 0.9);
      filter.Q.setValueAtTime(3.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {
      console.warn('Error playing distorted whispers:', e);
    }
  }

  // Bone Claw Scrape on Timber / Stone
  public playMonsterClawScrape(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 20) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.04, Math.min(0.4, (1 - distance / 20) * 0.4));

    try {
      const bufSize = Math.floor(0.4 * this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.5));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + 0.38);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {
      console.warn('Error playing claw scrape:', e);
    }
  }

  // Monster footstep: heavy physical thud on soil and pine needles
  public playMonsterStep(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 18) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.03, Math.min(0.35, (1 - distance / 18) * 0.35));

    // 1. Low sub soil impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(52, t);
    osc.frequency.exponentialRampToValueAtTime(22, t + 0.13);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);

    // 2. Soft crunch of forest loam
    const bufSize = Math.floor(0.05 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    const crunchGain = this.ctx.createGain();
    crunchGain.gain.setValueAtTime(vol * 0.5, t);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(filter);
    filter.connect(crunchGain);
    crunchGain.connect(this.sfxGain);
    noise.start(t);
  }

  // Realistic glass bottle impact (natural high noise burst, no musical tones)
  public playGlassShatter() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufSize = Math.floor(0.18 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Flare ignition: natural friction strike and hiss
  public playFlareIgnite() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufSize = Math.floor(0.25 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(1.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Locker Door: realistic metallic hollow latch
  public playLockerDoor(_isHiding: boolean) {
    this.playDoorUnlocked();
  }

  // Item pickup: realistic subtle physical tap (NO C-E-G major chord arcade jingle!)
  public playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufSize = Math.floor(0.02 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(1.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Paper note rustle: soft realistic paper handling
  public playPaperRustle() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufferSize = Math.floor(0.18 * this.ctx.sampleRate);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(1.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    src.start(t);
  }

  // Mechanical door unlock: realistic dual tumbler clack (no sawtooth slide)
  public playDoorUnlocked() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // First click
    this.createDampedClick(t, 900, 0.18);
    // Second tumbler latch click
    this.createDampedClick(t + 0.07, 650, 0.22);
  }

  // Fuse installed: solid industrial relay socket snap (no 320->880Hz arcade synth slide)
  public playFuseInstalled() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    this.createDampedClick(t, 800, 0.25);
    this.createDampedClick(t + 0.05, 450, 0.3);
  }

  // Emergency power restored: heavy electrical cabinet breaker slam (no synth pitch slide)
  public playEmergencyPowerRestored() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Heavy mechanical breaker latch
    this.createDampedClick(t, 350, 0.4);

    // Deep muffled cabinet resonance
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    subGain.gain.setValueAtTime(0.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 0.5);
  }

  // Realistic Distant Mountain Thunder (rumbling sub-bass reverberation)
  public playDistantThunder(intensity = 0.8) {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.1, Math.min(1.0, intensity));

    // 1. Initial distant lightning crack / impulse
    const crackSize = Math.floor(0.12 * this.ctx.sampleRate);
    const crackBuf = this.ctx.createBuffer(1, crackSize, this.ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackSize; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackSize * 0.2));
    }
    const crackSrc = this.ctx.createBufferSource();
    crackSrc.buffer = crackBuf;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'lowpass';
    crackFilter.frequency.setValueAtTime(160, t);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(vol * 0.45, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    crackSrc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.ambientGain);
    crackSrc.start(t);

    // 2. Rolling sub-bass thunder rumble over 3.5 seconds
    const rumbleSize = Math.floor(3.5 * this.ctx.sampleRate);
    const rumbleBuf = this.ctx.createBuffer(1, rumbleSize, this.ctx.sampleRate);
    const rumbleData = rumbleBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < rumbleSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // Brown noise for deep mountain thunder
      const envelope = Math.sin((i / rumbleSize) * Math.PI) * Math.exp(-i / (rumbleSize * 0.6));
      rumbleData[i] = last * envelope * 2.5;
    }

    const rumbleSrc = this.ctx.createBufferSource();
    rumbleSrc.buffer = rumbleBuf;

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(75, t);
    rumbleFilter.frequency.linearRampToValueAtTime(45, t + 3.2);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.01, t);
    rumbleGain.gain.linearRampToValueAtTime(vol * 0.55, t + 0.3);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 3.4);

    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.ambientGain);
    rumbleSrc.start(t + 0.05);

    // 3. Sub harmonic physical chest thump
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(48, t);
    sub.frequency.exponentialRampToValueAtTime(26, t + 2.5);

    sGain.gain.setValueAtTime(vol * 0.3, t + 0.1);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);

    sub.connect(sGain);
    sGain.connect(this.ambientGain);
    sub.start(t + 0.1);
    sub.stop(t + 3.0);
  }

  // Realistic Predator Recoil Hiss (triggered when high-beam flashlight hits monster's eyes)
  public playPredatorHiss(distance: number) {
    if (!this.ctx || !this.sfxGain || distance > 24) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(0.05, Math.min(0.4, (1 - distance / 24) * 0.4));

    const dur = 0.65;
    const bufSize = Math.floor(dur * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + dur);
    filter.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    src.start(t);
  }

  // Creaking pine wood stress (tall trees swaying in heavy gusts)
  public playWoodTreeCreak() {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.25);
    osc.frequency.linearRampToValueAtTime(140, t + 0.55);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, t);
    filter.Q.setValueAtTime(6.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  // Exhausted human breath / ragged panting (stamina depleted / terror)
  public playPlayerExhaustedGasp() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const dur = 0.45;
    const bufSize = Math.floor(dur * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, t);
    filter.frequency.linearRampToValueAtTime(700, t + dur);
    filter.Q.setValueAtTime(1.8, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    src.start(t);
  }

  // Mountain cold wind gust
  public playWindGust() {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;

    const dur = 2.8;
    const bufSize = Math.floor(dur * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b = (b + 0.04 * w) / 1.04;
      data[i] = b * Math.sin((i / bufSize) * Math.PI);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.linearRampToValueAtTime(420, t + 1.2);
    filter.frequency.linearRampToValueAtTime(200, t + dur);
    filter.Q.setValueAtTime(1.4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    src.start(t);
  }

  private createDampedClick(startTime: number, freq: number, volume: number) {
    if (!this.ctx || !this.sfxGain) return;

    const bufSize = Math.floor(0.03 * this.ctx.sampleRate);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, startTime);
    filter.Q.setValueAtTime(2.0, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(startTime);
  }

  // Realistic UI Navigation Tonal Feedback
  public playMenuHover() {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.035);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }

  public playMenuSelect() {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {}
  }

  public stopHeartbeat() {
    this.lastHeartbeatTime = 0;
  }

  public stopRadioStatic() {
    // Silence any lingering static
  }

  public stopDieselEngine() {
    if (this.dieselEngineSource) {
      try {
        this.dieselEngineSource.stop();
        this.dieselEngineSource = null;
      } catch (e) {
        console.warn('Error stopping diesel engine:', e);
      }
    }
    if (this.dieselGain) {
      try {
        const targetTime = this.ctx ? this.ctx.currentTime + 0.5 : 0;
        this.dieselGain.gain.linearRampToValueAtTime(0, targetTime);
      } catch (e) {
        console.warn('Error fading diesel engine:', e);
      }
    }
  }

  public dispose() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const horrorAudio = new HorrorAudioEngine();
