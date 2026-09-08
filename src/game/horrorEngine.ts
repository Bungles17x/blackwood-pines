import * as THREE from 'three';
import { CreatureEntity } from './creatureEntity';
import {
  getFacilityLayout,
  WallBox,
  InteractableItem,
  LORE_NOTES,
  DYNAMIC_WALL_CABIN_DOOR,
  DYNAMIC_WALL_EXIT_GATE,
} from './facilityMap';
import {
  createForestGroundTexture,
  createCabinWoodTexture,
  createBarkTexture,
  createBarkBumpMap,
  createGateTexture,
  createGeneratorTexture,
  createBatteryTexture,
  createSparkPlugTexture,
  createRangerKeyTexture,
  createFieldNoteTexture,
  createCabinShingleTexture,
  createStoneChimneyTexture,
  createWoodPlankFloorTexture,
  createWindowGlassTexture,
  createOrionFlareTexture,
  createTopographicMapTexture,
  createVintageBottleLabelTexture,
  createTruckDashboardTexture,
  createOccultRuneTexture,
  createPineFoliageTexture,
  createPineFoliageBumpMap,
  createDirtTrailTexture,
  createRockBoulderTexture,
  createBreathVaporTexture,
  createDustMoteTexture,
} from './proceduralTextures';
import { horrorAudio } from '../audio/horrorAudio';
import { Inventory, FlashlightState, LoreNote, GameSettings, SurvivalVitals } from '../types';

export class HorrorEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvasContainer: HTMLElement;

  // Player & Movement state
  public playerPosition = new THREE.Vector3(-1, 1.65, -20);
  private playerVelocity = new THREE.Vector3();
  private pitch = 0;
  private yaw = Math.PI; // Face south towards the forest trails and campsite
  private isPointerLocked = false;
  public isDying = false;
  private deathTimer = 0;
  public isMonsterAwakened = false;
  private monsterAwakenTimer = 0;
  public bannerMessage: string | null = null;
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private isSprinting = false;
  private heldKeys = new Set<string>();
  private wasRunningBeforeModal = false;
  private isCrouching = false;
  private stamina = 100;
  private headBobTimer = 0;
  private footstepTimer = 0;
  private controlCanvas: HTMLCanvasElement | null = null;
  private hoodControlMesh: THREE.Mesh | null = null;
  private touchLookId: number | null = null;
  private lastTouchLookX = 0;
  private lastTouchLookY = 0;
  private handleCanvasClick = () => {
    if (!this.controlCanvas || this.isModalOpen) return;
    if (!this.isPointerLocked && this.isRunning) {
      try {
        this.controlCanvas.requestPointerLock();
      } catch {}
    }
  };
  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.controlCanvas;
    if (!this.isPointerLocked) this.clearInputState();
  };
  private handleWindowBlur = () => this.clearInputState();
  private handleVisibilityChange = () => {
    if (document.hidden) this.clearInputState();
  };
  private handleMouseMove = (e: MouseEvent) => {
    if (this.isModalOpen || !this.isPointerLocked) return;
    const sens = 0.0022 * this.settings.mouseSensitivity;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
  };
  private handleTouchStart = (e: TouchEvent) => {
    if (this.isModalOpen || !this.isRunning || this.touchLookId !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    this.touchLookId = touch.identifier;
    this.lastTouchLookX = touch.clientX;
    this.lastTouchLookY = touch.clientY;
    e.preventDefault();
  };
  private handleTouchMove = (e: TouchEvent) => {
    if (this.isModalOpen || this.touchLookId === null) return;
    const touch = Array.from(e.changedTouches).find(({ identifier }) => identifier === this.touchLookId);
    if (!touch) return;
    const sens = 0.004 * this.settings.mouseSensitivity;
    this.yaw -= (touch.clientX - this.lastTouchLookX) * sens;
    this.pitch -= (touch.clientY - this.lastTouchLookY) * sens;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    this.lastTouchLookX = touch.clientX;
    this.lastTouchLookY = touch.clientY;
    e.preventDefault();
  };
  private handleTouchEnd = (e: TouchEvent) => {
    if (Array.from(e.changedTouches).some(({ identifier }) => identifier === this.touchLookId)) {
      this.touchLookId = null;
    }
  };
  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isModalOpen || this.isDying) return;
    this.heldKeys.add(e.code);
    const browserControlKeys = new Set([
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ShiftLeft',
      'ShiftRight',
      'ControlLeft',
      'ControlRight',
      'AltLeft',
      'AltRight',
    ]);
    if (browserControlKeys.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': if (this.isPlayerHiding) this.exitLocker(); this.moveForward = true; break;
      case 'KeyS': case 'ArrowDown': if (this.isPlayerHiding) this.exitLocker(); this.moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': if (this.isPlayerHiding) this.exitLocker(); this.moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': if (this.isPlayerHiding) this.exitLocker(); this.moveRight = true; break;
      case 'Space': if (this.isPlayerHiding) this.exitLocker(); this.jump(); break;
      case 'ShiftLeft': case 'ShiftRight': this.setSprinting(true); break;
      case 'KeyC': case 'ControlLeft': case 'ControlRight': this.toggleCrouch(); break;
      case 'KeyF': this.flashlightState.enabled && (this.flashlightState.isFlickering || this.flashlightState.battery < 25) ? this.tapFlashlight() : this.toggleFlashlight(); break;
      case 'KeyT': this.toggleUVMode(); break;
      case 'KeyR': this.useBattery(); break;
      case 'KeyG': this.throwBottle(); break;
      case 'KeyX': this.useFlare(); break;
      case 'KeyM': this.openMap(); break;
      case 'KeyQ': this.activeLean = 'left'; this.onLeanChange?.('left'); break;
      case 'KeyE': if (this.isPlayerHiding) this.exitLocker(); else if (this.activePrompt) this.interact(); else { this.activeLean = 'right'; this.onLeanChange?.('right'); } break;
      case 'AltLeft': case 'AltRight': case 'KeyH': this.setHoldingBreath(true); break;
    }
  };
  private handleKeyUp = (e: KeyboardEvent) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'].includes(e.code)) {
      e.preventDefault();
    }
    this.heldKeys.delete(e.code);
    this.moveForward = this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp');
    this.moveBackward = this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown');
    this.moveLeft = this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft');
    this.moveRight = this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight');
    switch (e.code) {
      case 'ShiftLeft': case 'ShiftRight': this.setSprinting(this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight')); break;
      case 'KeyQ': if (this.activeLean === 'left') { this.activeLean = null; this.onLeanChange?.(null); } break;
      case 'KeyE': if (this.activeLean === 'right') { this.activeLean = null; this.onLeanChange?.(null); } break;
      case 'AltLeft': case 'AltRight': case 'KeyH':
        this.setHoldingBreath(this.heldKeys.has('AltLeft') || this.heldKeys.has('AltRight') || this.heldKeys.has('KeyH'));
        break;
    }
  };

  private clearInputState() {
    const wasHoldingBreath = this.isHoldingBreath;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.heldKeys.clear();
    this.footstepTimer = 0;
    this.activeLean = null;
    this.onLeanChange?.(null);
    this.isHoldingBreath = false;
    if (wasHoldingBreath) this.onBreathHoldChange?.(false, this.breathHoldTime / this.maxBreathHoldTime);
  }

  // Jumping & vertical physics
  private isGrounded = true;
  private verticalVelocity = 0;
  private jumpHeightOffset = 0;
  private jumpCooldownTimer = 0;
  private landingCameraDip = 0;
  private branchSnapCooldown = 0;
  private escapeTriggered = false;

  // Corner Leaning / Peeking ([Q] left, [E] right)
  public activeLean: 'left' | 'right' | null = null;
  private leanOffset = 0; // -1 to +1
  private leanRoll = 0;

  // Hiding inside Locker state
  public isPlayerHiding = false;
  private currentLockerPos: THREE.Vector3 | null = null;

  // Flashlight & UV Blacklight
  public flashlightState: FlashlightState = {
    enabled: true,
    battery: 100,
    isFlickering: false,
    isUVMode: false,
  };
  private flashlight: THREE.SpotLight;
  private flashlightSpill: THREE.PointLight | null = null;
  private flashlightTarget: THREE.Object3D;
  private uvClueMeshes: THREE.Mesh[] = [];

  // Active Flare state
  private activeFlare: {
    mesh: THREE.Group;
    light: THREE.PointLight;
    position: THREE.Vector3;
    timer: number;
  } | null = null;

  // Facility environment
  private staticObstacles: WallBox[] = [];
  public walls: WallBox[] = [];
  private items: InteractableItem[] = [];
  private itemMeshes = new Map<string, THREE.Object3D>();
  private fuseBoxMesh: THREE.Mesh | null = null;
  private substationDoorHinge: THREE.Group | null = null;
  private substationDoorMesh: THREE.Mesh | null = null;
  private exitDoorMesh: THREE.Mesh | null = null;
  private pickupHoodHinge: THREE.Group | null = null;
  private isPickupHoodOpen = false;
  private flickeringLights: { light: THREE.PointLight; base: number; timer: number; speed: number }[] = [];

  // Entity & AI
  public creature: CreatureEntity;

  // Inventory & Game State
  public inventory: Inventory = {
    fuses: 0,
    maxFuses: 3,
    hasKeycard: false,
    hasRadioTube: false,
    isRadioRepaired: false,
    hasFuelCan: false,
    isGeneratorFueled: false,
    batteries: 2,
    bottles: 1,
    flares: 1,
    hasMap: false,
    notesRead: [],
  };
  public isPowerRestored = false;
  public isSubstationUnlocked = false;
  private activePrompt: string | null = null;
  private promptCheckTimer = 0;
  private staminaNotifyTimer = 0;
  private flashlightNotifyTimer = 0;
  private sensorNotifyTimer = 0;
  private vitalsNotifyTimer = 0;

  // Weather, Atmosphere and Environmental Effects
  private moonLight: THREE.DirectionalLight;
  private lightningTimer: number = 38.0;
  private lightningFlashesRemaining: number = 0;
  private flashSubTimer: number = 0;
  private windGustTimer: number = 18.0;
  private treeCreakTimer: number = 24.0;
  private owlTimer: number = 26.0;
  private horrorEventTimer: number = 22.0;
  private watcherTimer: number = 0;
  private watcher: THREE.Group | null = null;
  private watcherMaterials: THREE.MeshBasicMaterial[] = [];

  // Ultra-Realistic Cold Air Breath Vapor Simulation
  public isHoldingBreath: boolean = false;
  private breathHoldTime: number = 5.0;
  private readonly maxBreathHoldTime: number = 5.0;
  private breathTimer: number = 2.4;
  private breathPuffs: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    initialScale: number;
    targetScale: number;
    rotationZ: number;
    spinRate: number;
    baseOpacity: number;
    isHeavy: boolean;
  }[] = [];
  private exhalePlumeQueue: {
    delay: number;
    heavy: boolean;
  }[] = [];
  private breathTexture: THREE.CanvasTexture | null = null;
  private breathGeometry: THREE.PlaneGeometry | null = null;

  // Volumetric Flashlight Floating Atmospheric Dust / Frost Motes
  private dustMotes: THREE.Points | null = null;
  private dustMotePositions: Float32Array | null = null;
  private dustMoteVelocities: Float32Array | null = null;
  private rainPoints: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainVelocities: Float32Array | null = null;
  private groundMaterial: THREE.MeshStandardMaterial | null = null;

  private exhaustTimer: number = 0;
  private fogPlanes: THREE.Mesh[] = [];
  private swayingTrees: {
    group: THREE.Group;
    initialRotZ: number;
    initialRotX: number;
    phase: number;
    freq: number;
    amp: number;
  }[] = [];
  public onCrouchChange?: (isCrouching: boolean) => void;
  public onBreathHoldChange?: (isHolding: boolean, ratio: number) => void;
  public onVitalsChange?: (vitals: SurvivalVitals) => void;
  public onFlashlightTappable?: (tappable: boolean) => void;

  // Realistic Survival Physics & Ambient Environment
  public survivalVitals: SurvivalVitals = {
    bodyTemp: 100,
    isShivering: false,
    windHeading: 'NW',
    windSpeedMph: 14,
    recoilPulls: 0,
    isPupilDilated: false,
  };
  public windVector = new THREE.Vector3(0.707, 0, -0.707); // NW mountain gale
  private flickerSuppressTimer: number = 0;
  private pupilDilation: number = 0.0;
  private shiveringTeethTimer: number = 0;
  private ambientLight!: THREE.AmbientLight;

  // Chemical Magnesium Flare Sparks & Dense Drifting Smoke
  private flareSparks: {
    mesh: THREE.Mesh;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];
  private flareSmokePuffs: {
    mesh: THREE.Mesh;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    rot: number;
    rotSpeed: number;
  }[] = [];
  private sparkGeometry: THREE.BufferGeometry | null = null;
  private sparkMaterial: THREE.MeshBasicMaterial | null = null;

  // Callbacks to React
  public onPromptChange?: (prompt: string | null) => void;
  public onInventoryChange?: (inv: Inventory) => void;
  public onFlashlightChange?: (state: FlashlightState) => void;
  public onStaminaChange?: (stamina: number) => void;
  public onSprintingChange?: (isSprinting: boolean) => void;
  public onJump?: () => void;
  public onFearChange?: (fear: number, distance: number) => void;
  public onHearingChange?: (hearingLevel: number) => void;
  public onHearingColorChange?: (hearingColor: 'red' | 'yellow' | 'green') => void;
  public onHidingChange?: (isHiding: boolean) => void;
  public onLeanChange?: (lean: 'left' | 'right' | null) => void;
  public onNoteOpen?: (note: LoreNote) => void;
  public onCctvOpen?: () => void;
  public onMapOpen?: () => void;
  public onGameOver?: () => void;
  public onVictory?: () => void;
  public onBannerMessage?: (message: string | null) => void;
  public onDeathStart?: () => void;

  // Runtime control
  private isRunning = false;
  public isModalOpen = false;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();
  public settings: GameSettings = {
    mouseSensitivity: 1.0,
    soundVolume: 0.8,
    ambientVolume: 0.7,
    difficulty: 'normal',
    headBobbing: true,
    filmGrain: true,
  };

  public setModalOpen(isOpen: boolean) {
    if (this.isModalOpen === isOpen) return;
    this.isModalOpen = isOpen;
    if (isOpen) {
      this.wasRunningBeforeModal = this.isRunning;
      this.clearInputState();
      this.pause();
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch {}
      }
    } else if (this.wasRunningBeforeModal && !this.isDying) {
      this.wasRunningBeforeModal = false;
      this.start();
    }
  }

  constructor(container: HTMLElement) {
    this.canvasContainer = container;

    // Scene & Fog - Dark Foggy Outside Forest (0.019 allows seeing much further into the pines)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04070e);
    this.scene.fog = new THREE.FogExp2(0x04070e, 0.019);

    // Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 160);
    this.camera.position.copy(this.playerPosition);

    // WebGL Renderer
    const isMobileViewport = window.innerWidth <= 900;
    this.renderer = new THREE.WebGLRenderer({ antialias: !isMobileViewport, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileViewport ? 1.25 : 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.scene.add(this.camera);

    // High-Power Long-Range Tactical Flashlight (allows player to see much further into dark woods)
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfff7ed, 10.5, 145, Math.PI / 4.7, 0.38, 1.05);
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = true;
    const shadowMapSize = isMobileViewport ? 512 : 1024;
    this.flashlight.shadow.mapSize.width = shadowMapSize;
    this.flashlight.shadow.mapSize.height = shadowMapSize;
    this.flashlight.shadow.bias = -0.0005;
    this.scene.add(this.flashlight);

    // Realistic ambient peripheral spill for flashlight (illuminates hands & ground)
    this.flashlightSpill = new THREE.PointLight(0xfff7ed, 1.15, 16);
    this.flashlightSpill.position.copy(this.camera.position);
    this.scene.add(this.flashlightSpill);

    // Celestial Silver Moon
    const moonGeo = new THREE.SphereGeometry(3.2, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xebf4ff });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(30, 44, -45);
    this.scene.add(moonMesh);

    // Cold Mountain Air Breath Vapor Materials (Photorealistic Soft Cloud Alpha)
    this.breathGeometry = new THREE.PlaneGeometry(1, 1);
    this.breathTexture = createBreathVaporTexture();

    // Volumetric Flashlight Floating Atmospheric Dust & Frost Motes
    const moteCount = isMobileViewport ? 120 : 300;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    const moteVel = new Float32Array(moteCount * 3);
    const moteColors = new Float32Array(moteCount * 3);

    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 22;
      motePos[i * 3 + 1] = Math.random() * 5.0;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 22;

      moteVel[i * 3] = (Math.random() - 0.5) * 0.12;
      moteVel[i * 3 + 1] = -0.04 - Math.random() * 0.07;
      moteVel[i * 3 + 2] = (Math.random() - 0.5) * 0.12;

      moteColors[i * 3] = 0.2;
      moteColors[i * 3 + 1] = 0.24;
      moteColors[i * 3 + 2] = 0.3;
    }

    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    moteGeo.setAttribute('color', new THREE.BufferAttribute(moteColors, 3));

    const moteMat = new THREE.PointsMaterial({
      size: 0.085,
      map: createDustMoteTexture(),
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dustMotes = new THREE.Points(moteGeo, moteMat);
    this.dustMotePositions = motePos;
    this.dustMoteVelocities = moteVel;
    this.scene.add(this.dustMotes);

    // Fine precipitation gives the flashlight a readable beam and makes the forest feel exposed.
    const rainCount = isMobileViewport ? 650 : 1800;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    const rainVelocities = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 34;
      rainPositions[i * 3 + 1] = 1 + Math.random() * 15;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 34;
      rainVelocities[i * 3] = 0.05 + Math.random() * 0.08;
      rainVelocities[i * 3 + 1] = -7.5 - Math.random() * 4.5;
      rainVelocities[i * 3 + 2] = 0.02 + Math.random() * 0.06;
    }
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMaterial = new THREE.PointsMaterial({
      color: 0x9ebdca,
      size: 0.055,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.rainPoints = new THREE.Points(rainGeometry, rainMaterial);
    this.rainPositions = rainPositions;
    this.rainVelocities = rainVelocities;
    this.scene.add(this.rainPoints);

    // Directional Moonlight
    this.moonLight = new THREE.DirectionalLight(0x7ea8c9, 0.5);
    this.moonLight.position.set(30, 44, -45);
    this.moonLight.target.position.set(0, 0, 0);
    this.scene.add(this.moonLight.target);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 130;
    this.moonLight.shadow.camera.left = -45;
    this.moonLight.shadow.camera.right = 45;
    this.moonLight.shadow.camera.top = 45;
    this.moonLight.shadow.camera.bottom = -45;
    this.moonLight.shadow.bias = -0.001;
    this.scene.add(this.moonLight);

    // Distant Stars in the Night Sky
    const starGeo = new THREE.BufferGeometry();
    const starCount = isMobileViewport ? 220 : 500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 120;
      starPositions[i + 1] = 25 + Math.random() * 35;
      starPositions[i + 2] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcfd8dc, size: 0.6, transparent: true, opacity: 0.85 });
    const starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(starPoints);

    // Natural realistic hemisphere bounce fill (cool sky to dark earth)
    const hemiLight = new THREE.HemisphereLight(0x2a3b50, 0x111612, 0.45);
    this.scene.add(hemiLight);

    // Low ambient light for natural tree silhouettes
    this.ambientLight = new THREE.AmbientLight(0x0a141f, 0.35);
    this.scene.add(this.ambientLight);

    // Build the 3D outdoor forest environment
    this.buildFacility();

    // Spawn the Creature Entity (Starts dormant far away, appears later)
    this.creature = new CreatureEntity(new THREE.Vector3(0, -100, 20), true);
    this.scene.add(this.creature.group);

    // Bind event listeners
    this.setupControls();
    window.addEventListener('resize', this.handleResize);
  }

  private setupControls() {
    this.controlCanvas = this.renderer.domElement;
    this.controlCanvas.addEventListener('click', this.handleCanvasClick);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.controlCanvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.controlCanvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.controlCanvas.addEventListener('touchend', this.handleTouchEnd);
    this.controlCanvas.addEventListener('touchcancel', this.handleTouchEnd);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public setVirtualMove(forward: boolean, backward: boolean, left: boolean, right: boolean) {
    if (!this.isRunning || this.isModalOpen || this.isDying) return;
    if (this.isPlayerHiding && (forward || backward || left || right)) this.exitLocker();
    this.moveForward = forward;
    this.moveBackward = backward;
    this.moveLeft = left;
    this.moveRight = right;
  }

  // Player Hold Breath Mechanic: Suppresses vapor clouds & sound detection
  public setHoldingBreath(hold: boolean) {
    if (this.isDying) return;
    if (hold) {
      if (!this.isHoldingBreath && this.breathHoldTime > 0.8) {
        this.isHoldingBreath = true;
        horrorAudio.playColdInhale(false);
        this.onBreathHoldChange?.(true, this.breathHoldTime / this.maxBreathHoldTime);
      }
    } else {
      if (this.isHoldingBreath) {
        this.isHoldingBreath = false;
        horrorAudio.playColdExhale(false);
        this.triggerExhaleBurst(false, 3);
        this.onBreathHoldChange?.(false, this.breathHoldTime / this.maxBreathHoldTime);
      }
    }
  }

  public setSprinting(sprinting: boolean) {
    if (this.isDying || this.isCrouching || this.isPlayerHiding) {
      this.isSprinting = false;
      this.onSprintingChange?.(false);
      return;
    }
    this.isSprinting = sprinting;
    this.onSprintingChange?.(sprinting);
  }

  // Player Jumping Mechanics (Fixed: realistic grounded human hop, clears obstacles without floating)
  public jump() {
    if (this.isPlayerHiding || this.isDying || this.isCrouching) return;
    if (this.jumpCooldownTimer > 0) return;
    if (this.isGrounded && this.stamina >= 10) {
      this.isGrounded = false;
      this.verticalVelocity = 3.6; // Weighted hop with enough lift to clear small terrain lips.
      this.jumpCooldownTimer = 0.55; // Recovery delay prevents bunny-hopping.
      this.stamina = Math.max(0, this.stamina - 10);
      this.onStaminaChange?.(this.stamina);
      this.onJump?.();
      horrorAudio.playJumpGroan();

      // Vocal exertion and foot leap can alert creature if close
      if (this.creature && this.creature.state !== 'CHASE') {
        const dist = this.playerPosition.distanceTo(this.creature.position);
        if (dist < 14) {
          this.creature.state = 'INVESTIGATE';
        }
      }
    }
  }

  // Toggle Stealth Crouch
  public toggleCrouch() {
    if (this.isPlayerHiding || this.isDying) return;
    this.isCrouching = !this.isCrouching;
    this.onCrouchChange?.(this.isCrouching);
  }

  // Toggle Flashlight ON/OFF
  public toggleFlashlight() {
    if (this.flashlightState.battery <= 0) {
      horrorAudio.playFlashlightFlicker();
      return;
    }
    this.flashlightState.enabled = !this.flashlightState.enabled;
    this.flashlight.visible = this.flashlightState.enabled;
    if (this.flashlightSpill) {
      this.flashlightSpill.visible = this.flashlightState.enabled;
    }
    horrorAudio.playFlashlightClick(this.flashlightState.enabled);
    this.onFlashlightChange?.({ ...this.flashlightState });
  }

  // Strike flashlight casing to reseat loose battery contact
  public tapFlashlight() {
    if (!this.flashlightState.enabled) return;
    this.flickerSuppressTimer = 16.0;
    this.flashlightState.isFlickering = false;
    this.flashlight.intensity = this.flashlightState.isUVMode ? 5.5 : 10.5;
    horrorAudio.playFlashlightTap();
    // Tactile camera thud from striking the metal casing
    this.camera.position.y -= 0.02;
    this.camera.rotation.z += 0.015;
    this.onFlashlightChange?.({ ...this.flashlightState });
    this.onFlashlightTappable?.(false);
  }

  // Toggle UV Blacklight Mode
  public toggleUVMode() {
    this.flashlightState.isUVMode = !this.flashlightState.isUVMode;
    if (this.flashlightState.isUVMode) {
      // Purple ultraviolet beam
      this.flashlight.color.setHex(0x9333ea);
      this.flashlight.intensity = 5.5;
      horrorAudio.playFlashlightFlicker();
    } else {
      // High-power warm tungsten beam
      this.flashlight.color.setHex(0xfff7ed);
      this.flashlight.intensity = 10.5;
      horrorAudio.playFlashlightClick(true);
    }
    // Update UV hidden clue mesh visibility
    this.uvClueMeshes.forEach((mesh) => {
      mesh.visible = this.flashlightState.isUVMode && this.flashlightState.enabled;
    });
    this.onFlashlightChange?.({ ...this.flashlightState });
  }

  // Reload flashlight battery
  public useBattery() {
    if (this.inventory.batteries > 0 && this.flashlightState.battery < 95) {
      this.inventory.batteries -= 1;
      this.flashlightState.battery = Math.min(100, this.flashlightState.battery + 50);
      this.flashlightState.enabled = true;
      this.flashlight.visible = true;
      horrorAudio.playFuseInstalled();
      this.onInventoryChange?.({ ...this.inventory });
      this.onFlashlightChange?.({ ...this.flashlightState });
    }
  }

  // Throw Sound Distraction Bottle
  public throwBottle() {
    if (this.inventory.bottles <= 0 || this.isPlayerHiding) return;
    this.inventory.bottles -= 1;
    this.onInventoryChange?.({ ...this.inventory });

    // Project forward from camera view
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const targetDist = 9.0;
    const impactPos = this.camera.position.clone().add(forward.multiplyScalar(targetDist));
    impactPos.y = 0.2; // ground level

    horrorAudio.playGlassShatter();
    // Lure creature AI directly to impact
    this.creature.distractToLocation(impactPos);
  }

  // Use Emergency Magnesium Flare
  public useFlare() {
    if (this.inventory.flares <= 0 || this.isPlayerHiding) return;
    this.inventory.flares -= 1;
    this.onInventoryChange?.({ ...this.inventory });

    horrorAudio.playFlareIgnite();

    // Create burning flare mesh and light at player's feet
    const flareGroup = new THREE.Group();
    const flareMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4500 })
    );
    flareGroup.add(flareMesh);

    const flareLight = new THREE.PointLight(0xff3300, 3.5, 18, 1.2);
    flareLight.castShadow = true;
    flareGroup.add(flareLight);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const flarePos = this.playerPosition.clone().add(forward.multiplyScalar(2.0));
    flarePos.y = 0.15;
    flareGroup.position.copy(flarePos);

    this.scene.add(flareGroup);
    this.activeFlare = {
      mesh: flareGroup,
      light: flareLight,
      position: flarePos,
      timer: 16.0, // burns with incandescent magnesium for 16 seconds
    };
  }

  // Realistic magnesium spark particle generation
  private spawnFlareSpark(origin: THREE.Vector3) {
    if (this.flareSparks.length > 40) return;
    if (!this.sparkGeometry) {
      this.sparkGeometry = new THREE.BoxGeometry(0.025, 0.025, 0.025);
    }
    const mat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const mesh = new THREE.Mesh(this.sparkGeometry, mat);
    const startPos = origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.25, (Math.random() - 0.5) * 0.1));
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const vx = (Math.random() - 0.5) * 2.8;
    const vy = 1.6 + Math.random() * 2.2;
    const vz = (Math.random() - 0.5) * 2.8;
    const maxLife = 0.5 + Math.random() * 0.6;

    this.flareSparks.push({
      mesh,
      pos: startPos,
      vel: new THREE.Vector3(vx, vy, vz),
      life: maxLife,
      maxLife,
    });
  }

  // Chemical red smoke billows drifting with mountain wind
  private spawnFlareSmoke(origin: THREE.Vector3) {
    if (this.flareSmokePuffs.length > 25) return;
    const geo = new THREE.PlaneGeometry(0.5, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x991b1b,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    if (this.breathTexture) {
      mat.map = this.breathTexture;
      mat.needsUpdate = true;
    }
    const mesh = new THREE.Mesh(geo, mat);
    const startPos = origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.3, (Math.random() - 0.5) * 0.2));
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const maxLife = 2.0 + Math.random() * 1.5;
    this.flareSmokePuffs.push({
      mesh,
      pos: startPos,
      vel: new THREE.Vector3(
        this.windVector.x * (0.8 + Math.random() * 0.4),
        0.55 + Math.random() * 0.35,
        this.windVector.z * (0.8 + Math.random() * 0.4)
      ),
      life: maxLife,
      maxLife,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.8,
    });
  }

  // Update physical spark trajectories and drifting chemical smoke
  private updateFlareParticles(delta: number) {
    // Update sparks
    for (let i = this.flareSparks.length - 1; i >= 0; i--) {
      const s = this.flareSparks[i];
      s.life -= delta;
      s.vel.y -= 9.8 * delta; // Earth gravity
      s.pos.addScaledVector(s.vel, delta);

      // Bounce on terrain
      if (s.pos.y <= 0.02) {
        s.pos.y = 0.02;
        s.vel.y = -s.vel.y * 0.35;
        s.vel.x *= 0.6;
        s.vel.z *= 0.6;
      }

      s.mesh.position.copy(s.pos);
      // Incandescent cooling color shift
      const progress = 1 - s.life / s.maxLife;
      const mat = s.mesh.material as THREE.MeshBasicMaterial;
      if (progress < 0.4) {
        mat.color.setHex(0xfffbeb); // incandescent white
      } else if (progress < 0.75) {
        mat.color.setHex(0xf59e0b); // glowing gold
      } else {
        mat.color.setHex(0xef4444); // dark ember
      }

      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.flareSparks.splice(i, 1);
      }
    }

    // Update smoke billows
    for (let i = this.flareSmokePuffs.length - 1; i >= 0; i--) {
      const p = this.flareSmokePuffs[i];
      p.life -= delta;
      p.pos.addScaledVector(p.vel, delta);
      p.rot += p.rotSpeed * delta;

      p.mesh.position.copy(p.pos);
      p.mesh.quaternion.copy(this.camera.quaternion);
      p.mesh.rotateZ(p.rot);

      const progress = 1 - p.life / p.maxLife;
      const scale = 0.5 + progress * 2.2;
      p.mesh.scale.set(scale, scale, 1);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin((p.life / p.maxLife) * Math.PI) * 0.3;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.flareSmokePuffs.splice(i, 1);
      }
    }
  }

  // Open Facility Map
  public openMap() {
    this.onMapOpen?.();
  }

  // Enter or exit hiding locker
  public toggleHiding(lockerPos: THREE.Vector3) {
    if (this.isPlayerHiding) {
      this.exitLocker();
    } else {
      this.enterLocker(lockerPos);
    }
  }

  public enterLocker(lockerPos: THREE.Vector3) {
    this.isPlayerHiding = true;
    this.currentLockerPos = lockerPos.clone();
    this.playerPosition.x = lockerPos.x;
    this.playerPosition.z = lockerPos.z;
    this.flashlightState.enabled = false;
    this.flashlight.visible = false;
    horrorAudio.playLockerDoor(true);
    this.onHidingChange?.(true);
    this.onFlashlightChange?.({ ...this.flashlightState });
  }

  public exitLocker() {
    if (!this.isPlayerHiding) return;
    this.isPlayerHiding = false;
    this.isCrouching = false;
    if (this.currentLockerPos) {
      // Step slightly forward outside locker
      this.playerPosition.z += 1.2;
    }
    this.currentLockerPos = null;
    horrorAudio.playLockerDoor(false);
    this.onHidingChange?.(false);
  }

  // Interaction with objects
  public interact() {
    if (this.isPlayerHiding) {
      this.exitLocker();
      return;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = 3.2;

    const candidateMeshes: THREE.Object3D[] = [];
    this.itemMeshes.forEach((mesh) => candidateMeshes.push(mesh));
    if (this.fuseBoxMesh) candidateMeshes.push(this.fuseBoxMesh);
    if (this.substationDoorMesh) candidateMeshes.push(this.substationDoorMesh);
    if (this.exitDoorMesh) candidateMeshes.push(this.exitDoorMesh);

    const intersects = raycaster.intersectObjects(candidateMeshes, true);
    if (intersects.length > 0) {
      let rootObj: THREE.Object3D | null = intersects[0].object;
      while (rootObj && !rootObj.userData.itemId && rootObj.parent) {
        rootObj = rootObj.parent;
      }

      const itemId = rootObj?.userData.itemId;
      if (!itemId) return;

      const item = this.items.find((it) => it.id === itemId);
      if (!item) return;

      this.processInteraction(item);
    }
  }

  private processInteraction(item: InteractableItem) {
    switch (item.type) {
      case 'fuse': {
        item.collected = true;
        this.inventory.fuses += 1;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        break;
      }
      case 'battery': {
        item.collected = true;
        this.inventory.batteries += 1;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        break;
      }
      case 'bottle': {
        item.collected = true;
        this.inventory.bottles += 1;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        break;
      }
      case 'flare': {
        item.collected = true;
        this.inventory.flares += 1;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        break;
      }
      case 'map': {
        item.collected = true;
        this.inventory.hasMap = true;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPaperRustle();
        this.onInventoryChange?.({ ...this.inventory });
        this.onMapOpen?.();
        break;
      }
      case 'locker': {
        this.toggleHiding(item.position);
        break;
      }
      case 'cctv': {
        this.onCctvOpen?.();
        break;
      }
      case 'keycard': {
        item.collected = true;
        this.inventory.hasKeycard = true;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        break;
      }
      case 'truck_hood': {
        if (!this.isPickupHoodOpen) {
          this.isPickupHoodOpen = true;
          if (this.pickupHoodHinge) {
            this.pickupHoodHinge.rotation.x = -Math.PI * 0.42;
          }
          const keyMesh = this.itemMeshes.get('item_keycard');
          if (keyMesh) keyMesh.visible = true;
          horrorAudio.playDoorUnlocked();
          const msg = 'The hood groans open. The Ranger Cabin Key is inside the engine bay.';
          this.bannerMessage = msg;
          this.onBannerMessage?.(msg);
          setTimeout(() => {
            if (this.bannerMessage === msg) {
              this.bannerMessage = null;
              this.onBannerMessage?.(null);
            }
          }, 3500);
        }
        break;
      }
      case 'note': {
        if (item.loreNote) {
          horrorAudio.playPaperRustle();
          if (!this.inventory.notesRead.includes(item.id)) {
            this.inventory.notesRead.push(item.id);
            this.onInventoryChange?.({ ...this.inventory });
          }
          this.onNoteOpen?.(item.loreNote);
        }
        break;
      }
      case 'radio_tube': {
        item.collected = true;
        this.inventory.hasRadioTube = true;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        const msg = "Acquired 6L6 Amplifier Vacuum Tube! Slot it into the Ham Radio Transceiver to contact Forestry Dispatch.";
        this.bannerMessage = msg;
        this.onBannerMessage?.(msg);
        setTimeout(() => {
          if (this.bannerMessage === msg) {
            this.bannerMessage = null;
            this.onBannerMessage?.(null);
          }
        }, 5000);
        break;
      }
      case 'fuel_can': {
        item.collected = true;
        this.inventory.hasFuelCan = true;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);
        horrorAudio.playPickup();
        this.onInventoryChange?.({ ...this.inventory });
        const msg = "Retrieved 5-Gallon Heavy Diesel Fuel Canister! Required to fuel the East Woods Generator.";
        this.bannerMessage = msg;
        this.onBannerMessage?.(msg);
        setTimeout(() => {
          if (this.bannerMessage === msg) {
            this.bannerMessage = null;
            this.onBannerMessage?.(null);
          }
        }, 5000);
        break;
      }
      case 'radio': {
        if (this.inventory.hasRadioTube) {
          if (!this.inventory.isRadioRepaired) {
            this.inventory.isRadioRepaired = true;
            this.onInventoryChange?.({ ...this.inventory });
            horrorAudio.playRadioTubeInstall();
          }
          horrorAudio.playRadioDistressBroadcast();
          const msg = "EMERGENCY DISPATCH BROADCAST: 'Mayday... Gate is unpowered... Fuel canister at Logging Shed, plugs in campsite & monoliths... IT HEARS SPRINTING!'";
          this.bannerMessage = msg;
          this.onBannerMessage?.(msg);
          setTimeout(() => {
            if (this.bannerMessage === msg) {
              this.bannerMessage = null;
              this.onBannerMessage?.(null);
            }
          }, 8500);
        } else {
          horrorAudio.playFlashlightFlicker();
          const msg = "Transceiver dead. Needs 6L6 vacuum amplifier tube (check cabin desk drawer).";
          this.bannerMessage = msg;
          this.onBannerMessage?.(msg);
          setTimeout(() => {
            if (this.bannerMessage === msg) {
              this.bannerMessage = null;
              this.onBannerMessage?.(null);
            }
          }, 4500);
        }
        break;
      }
      case 'substation_door': {
        if (this.isSubstationUnlocked) return;
        if (this.inventory.hasKeycard) {
          this.isSubstationUnlocked = true;
          horrorAudio.playDoorUnlocked();
          if (this.substationDoorHinge) {
            this.substationDoorHinge.rotation.y = -Math.PI * 0.52;
          }
          this.updateActiveWalls();
        } else {
          horrorAudio.playFlashlightFlicker();
        }
        break;
      }
      case 'fusebox': {
        if (this.isPowerRestored) return;
        if (this.inventory.fuses >= 3 && this.inventory.hasFuelCan) {
          if (this.survivalVitals.recoilPulls < 3) {
            this.survivalVitals.recoilPulls += 1;
            this.onVitalsChange?.({ ...this.survivalVitals });

            if (this.survivalVitals.recoilPulls === 1) {
              horrorAudio.playRecoilCordPull(false);
              this.camera.position.y -= 0.04;
              this.camera.rotation.z -= 0.04;
              const msg = "RECOIL STARTER: PULL 1/3 — Flywheel spins with heavy compression wheeze! Pull cord again!";
              this.bannerMessage = msg;
              this.onBannerMessage?.(msg);
              if (this.creature && this.creature.state === 'PATROL') {
                this.creature.distractToLocation(this.playerPosition);
              }
              setTimeout(() => {
                if (this.bannerMessage === msg) {
                  this.bannerMessage = null;
                  this.onBannerMessage?.(null);
                }
              }, 4500);
            } else if (this.survivalVitals.recoilPulls === 2) {
              horrorAudio.playRecoilCordPull(false);
              this.camera.position.y -= 0.05;
              this.camera.rotation.z -= 0.05;
              const msg = "RECOIL STARTER: PULL 2/3 — Spark plug ignition coughs! Choke sputtering! ONE MORE FIRM CRANK!";
              this.bannerMessage = msg;
              this.onBannerMessage?.(msg);
              if (this.creature) {
                this.creature.distractToLocation(this.playerPosition);
              }
              setTimeout(() => {
                if (this.bannerMessage === msg) {
                  this.bannerMessage = null;
                  this.onBannerMessage?.(null);
                }
              }, 4500);
            } else if (this.survivalVitals.recoilPulls === 3) {
              this.isPowerRestored = true;
              this.inventory.isGeneratorFueled = true;
              this.onInventoryChange?.({ ...this.inventory });
              horrorAudio.playRecoilCordPull(true);
              horrorAudio.playFuelPouring();
              horrorAudio.playEmergencyPowerRestored();
              horrorAudio.playDieselEngineStart();

              setTimeout(() => {
                horrorAudio.playMonsterEnrageRoar();
              }, 1400);

              if (this.fuseBoxMesh) {
                const mat = this.fuseBoxMesh.material as THREE.MeshStandardMaterial;
                mat.map = createGeneratorTexture(3);
                mat.needsUpdate = true;
              }
              if (this.exitDoorMesh) {
                this.exitDoorMesh.position.y += 3.8;
              }
              this.updateActiveWalls();

              // Enrage monster - the loud diesel combustion alerts the creature!
              this.creature.enrage(this.playerPosition);
              const alertMsg = "DIESEL GENERATOR ONLINE! 4-STROKE ENGINE ROARS! THE BEAST IS ENRAGED—RUN TO SOUTH HIGHWAY GATE!";
              this.bannerMessage = alertMsg;
              this.onBannerMessage?.(alertMsg);
              setTimeout(() => {
                if (this.bannerMessage === alertMsg) {
                  this.bannerMessage = null;
                  this.onBannerMessage?.(null);
                }
              }, 8500);
            }
            return;
          }
        } else if (this.inventory.fuses >= 3 && !this.inventory.hasFuelCan) {
          horrorAudio.playFlashlightFlicker();
          const msg = "All 3 spark plugs installed! But the fuel tank is empty—retrieve the 5-Gal Diesel Canister from the Old Logging Camp!";
          this.bannerMessage = msg;
          this.onBannerMessage?.(msg);
          setTimeout(() => {
            if (this.bannerMessage === msg) {
              this.bannerMessage = null;
              this.onBannerMessage?.(null);
            }
          }, 5000);
        } else if (this.inventory.hasFuelCan && this.inventory.fuses < 3) {
          horrorAudio.playFlashlightFlicker();
          const msg = `Diesel fuel primed! Still missing generator spark plugs (${this.inventory.fuses}/3 found).`;
          this.bannerMessage = msg;
          this.onBannerMessage?.(msg);
          setTimeout(() => {
            if (this.bannerMessage === msg) {
              this.bannerMessage = null;
              this.onBannerMessage?.(null);
            }
          }, 5000);
        } else {
          horrorAudio.playFlashlightFlicker();
          const msg = `Generator offline. Requires 3 Spark Plugs (${this.inventory.fuses}/3) AND a 5-Gallon Diesel Canister.`;
          this.bannerMessage = msg;
          this.onBannerMessage?.(msg);
          setTimeout(() => {
            if (this.bannerMessage === msg) {
              this.bannerMessage = null;
              this.onBannerMessage?.(null);
            }
          }, 5000);
        }
        break;
      }
      case 'exit_door': {
        if (this.isPowerRestored) {
          this.onVictory?.();
        } else {
          horrorAudio.playFlashlightFlicker();
        }
        break;
      }
    }
  }

  public updateActiveWalls() {
    this.walls = [
      ...this.staticObstacles,
      ...(!this.isSubstationUnlocked ? [DYNAMIC_WALL_CABIN_DOOR] : []),
      ...(!this.isPowerRestored ? [DYNAMIC_WALL_EXIT_GATE] : []),
    ];
  }

  private buildFacility() {
    const { collisionWalls, items } = getFacilityLayout();
    this.staticObstacles = [...collisionWalls];
    this.items = items;
    this.updateActiveWalls();

    // 1. Forest Ground Floor (Massive explorable territory across Blackwood State Park)
    const floorTex = createForestGroundTexture();
    floorTex.repeat.set(48, 48);
    const floorGeo = new THREE.PlaneGeometry(240, 240, 8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.72,
      metalness: 0.05,
    });
    this.groundMaterial = floorMat;
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 1.5. Layered Creeping Ground Fog (Volumetric low mist billows floating across forest floor)
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = 128;
    fogCanvas.height = 128;
    const fogCtx = fogCanvas.getContext('2d');
    if (fogCtx) {
      const grad = fogCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
      grad.addColorStop(0, 'rgba(180, 200, 220, 0.22)');
      grad.addColorStop(0.5, 'rgba(140, 165, 190, 0.09)');
      grad.addColorStop(1, 'rgba(140, 165, 190, 0)');
      fogCtx.fillStyle = grad;
      fogCtx.fillRect(0, 0, 128, 128);
    }
    const fogTexture = new THREE.CanvasTexture(fogCanvas);
    const fogGeo = new THREE.PlaneGeometry(24, 24);
    const fogMat = new THREE.MeshBasicMaterial({
      map: fogTexture,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    // Distribute 40 low-altitude mist patches across trails and forest clearings
    const fogPositions = [
      [-1, -24], [4, -18], [-12, -28], [-22, -30], [-26, -4],
      [-18, 8], [-28, 22], [-22, 28], [-8, 12], [0, 4],
      [8, -6], [16, -18], [24, -22], [28, -8], [34, -4],
      [18, 12], [24, 18], [28, 24], [8, 30], [-2, 38],
      [0, 46], [-10, 42], [12, 42], [-14, -14], [14, 2],
      [-32, -18], [32, 12], [-5, -8], [10, 22], [-20, 16],
      [22, -12], [-30, 4], [6, 14], [-12, 34], [20, 36],
      [-36, 26], [36, -20], [-4, -36], [18, -34], [4, 48],
    ];

    fogPositions.forEach(([fx, fz], idx) => {
      const fogMesh = new THREE.Mesh(fogGeo, fogMat);
      fogMesh.rotation.x = -Math.PI / 2;
      fogMesh.position.set(fx + (Math.random() - 0.5) * 4, 0.35 + (idx % 4) * 0.25, fz + (Math.random() - 0.5) * 4);
      fogMesh.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(fogMesh);
      this.fogPlanes.push(fogMesh);
    });

    // 2. Winding Dirt Trail overlay paths connecting all explorable landmarks
    const trailSegments = [
      // North Trailhead to Central Crossroads
      { start: new THREE.Vector3(-1, 0.02, -26), end: new THREE.Vector3(0, 0.02, 0), width: 3.4 },
      // North Trailhead branch to Ancient Monolith Circle
      { start: new THREE.Vector3(-1, 0.02, -26), end: new THREE.Vector3(-24, 0.02, -32), width: 2.8 },
      // Central Crossroads to Campsite
      { start: new THREE.Vector3(0, 0.02, 0), end: new THREE.Vector3(-27, 0.02, -4), width: 2.8 },
      // Campsite to Monoliths
      { start: new THREE.Vector3(-27, 0.02, -4), end: new THREE.Vector3(-24, 0.02, -30), width: 2.4 },
      // Central Crossroads to Ranger Station Cabin
      { start: new THREE.Vector3(0, 0.02, -10), end: new THREE.Vector3(14, 0.02, -19.5), width: 3.0 },
      // Central Crossroads to Lookout Bluff Watchtower
      { start: new THREE.Vector3(0, 0.02, 0), end: new THREE.Vector3(36, 0.02, -4), width: 2.6 },
      // Central Crossroads to Diesel Generator Power Grid
      { start: new THREE.Vector3(0, 0.02, 0), end: new THREE.Vector3(26, 0.02, 20), width: 2.8 },
      // Central Crossroads to Old Logging Camp
      { start: new THREE.Vector3(0, 0.02, 0), end: new THREE.Vector3(-28, 0.02, 24), width: 2.8 },
      // Central Crossroads south to Highway Escape Gate
      { start: new THREE.Vector3(0, 0.02, 0), end: new THREE.Vector3(0, 0.02, 48.5), width: 3.8 },
      // East connector between Ranger Station and Generator
      { start: new THREE.Vector3(22, 0.02, -12), end: new THREE.Vector3(26, 0.02, 18), width: 2.4 },
      // West connector between Campsite and Logging Camp
      { start: new THREE.Vector3(-27, 0.02, 0), end: new THREE.Vector3(-28, 0.02, 20), width: 2.4 },
    ];

    const trailTex = createDirtTrailTexture();
    trailTex.repeat.set(1, 4);
    const trailMat = new THREE.MeshStandardMaterial({
      map: trailTex,
      roughness: 0.92,
      metalness: 0.02,
    });

    trailSegments.forEach((seg) => {
      const length = seg.start.distanceTo(seg.end);
      const trailGeo = new THREE.PlaneGeometry(seg.width, length);
      const trailMesh = new THREE.Mesh(trailGeo, trailMat);
      trailMesh.rotation.x = -Math.PI / 2;
      const mid = seg.start.clone().add(seg.end).multiplyScalar(0.5);
      trailMesh.position.set(mid.x, 0.02, mid.z);
      const angle = Math.atan2(seg.end.x - seg.start.x, seg.end.z - seg.start.z);
      trailMesh.rotation.z = -angle;
      trailMesh.receiveShadow = true;
      this.scene.add(trailMesh);
    });

    // 3. Cabin Wood and Perimeter Fence Textures
    const woodTex = createCabinWoodTexture();
    woodTex.repeat.set(2, 1);
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    const barkTex = createBarkTexture();
    const postMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.9,
    });

    // Build Structural Walls & Fences (cabin, logging shack, generator shed, fences, gate pillars)
    collisionWalls.forEach((box) => {
      const isStructural =
        box.id?.startsWith('fence_') ||
        (box.id?.startsWith('cabin_') && box.id !== 'cabin_desk') ||
        (box.id?.startsWith('shack_') && box.id !== 'shack_bench') ||
        (box.id?.startsWith('shed_') && box.id !== 'generator_console') ||
        box.id?.startsWith('pillar_');

      if (!isStructural) return;

      const w = box.maxX - box.minX;
      const d = box.maxZ - box.minZ;
      const h = box.height;

      const isCabinWall =
        (box.minX >= 13 && box.maxX <= 31 && box.minZ >= -29 && box.maxZ <= -11) ||
        (box.minX >= -36 && box.maxX <= -19 && box.minZ >= 17 && box.maxZ <= 33);

      const wallGeo = new THREE.BoxGeometry(w, h, d);
      const wallMesh = new THREE.Mesh(wallGeo, isCabinWall ? woodMat : postMat);
      wallMesh.position.set(box.minX + w / 2, h / 2, box.minZ + d / 2);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.scene.add(wallMesh);
    });

    // --- REAL-LIFE DETAILED ARCHITECTURAL BUILDINGS ---
    const floorPlankTex = createWoodPlankFloorTexture();
    floorPlankTex.repeat.set(4, 4);
    const cabinFloorMat = new THREE.MeshStandardMaterial({ map: floorPlankTex, roughness: 0.8 });

    const shingleTex = createCabinShingleTexture();
    shingleTex.repeat.set(3, 2);
    const shingleMat = new THREE.MeshStandardMaterial({ map: shingleTex, roughness: 0.9 });

    const chimneyTex = createStoneChimneyTexture();
    chimneyTex.repeat.set(1, 3);
    const chimneyMat = new THREE.MeshStandardMaterial({ map: chimneyTex, roughness: 0.95 });

    const windowGlassTex = createWindowGlassTexture();
    const glassMat = new THREE.MeshStandardMaterial({
      map: windowGlassTex,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
    });

    // 1. RANGER STATION CABIN REALISM
    // A. Interior Weathered Wood Plank Flooring
    const cabinFloorGeo = new THREE.BoxGeometry(16.2, 0.16, 16.2);
    const cabinFloorMesh = new THREE.Mesh(cabinFloorGeo, cabinFloorMat);
    cabinFloorMesh.position.set(22, 0.08, -20);
    cabinFloorMesh.receiveShadow = true;
    this.scene.add(cabinFloorMesh);

    // B. Front Covered Wooden Porch
    const porchDeckGeo = new THREE.BoxGeometry(4.8, 0.16, 5.4);
    const porchDeck = new THREE.Mesh(porchDeckGeo, cabinFloorMat);
    porchDeck.position.set(11.5, 0.08, -19.5);
    porchDeck.receiveShadow = true;
    this.scene.add(porchDeck);

    // Porch Steps down to the dirt trail
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 3.2), cabinFloorMat);
    step1.position.set(8.8, 0.04, -19.5);
    step1.receiveShadow = true;
    this.scene.add(step1);

    // Porch Timber Log Columns
    for (let pz of [-21.8, -17.2]) {
      const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.3, 8);
      const postMesh = new THREE.Mesh(postGeo, postMat);
      postMesh.position.set(9.3, 1.65, pz);
      postMesh.castShadow = true;
      this.scene.add(postMesh);
    }

    // Porch Awning Roof (angled cedar shingles)
    const awningGeo = new THREE.BoxGeometry(5.2, 0.12, 5.8);
    const awning = new THREE.Mesh(awningGeo, shingleMat);
    awning.position.set(11.5, 3.4, -19.5);
    awning.rotation.z = -0.15; // gentle slope down towards path
    awning.castShadow = true;
    this.scene.add(awning);

    // Porch Hanging Lantern
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(9.8, 3.0, -19.5);
    const lanternHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.28, 6),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6, metalness: 0.7 })
    );
    lanternGroup.add(lanternHousing);
    const porchLight = new THREE.PointLight(0xf59e0b, 1.4, 9);
    porchLight.position.set(0, -0.05, 0);
    porchLight.castShadow = true;
    lanternGroup.add(porchLight);
    this.scene.add(lanternGroup);
    this.flickeringLights.push({ light: porchLight, base: 1.4, timer: 0, speed: 2.5 });

    // C. Gabled Pitched Shingle Cabin Roof
    // West slope
    const roofWestGeo = new THREE.BoxGeometry(9.8, 0.18, 18.2);
    const roofWest = new THREE.Mesh(roofWestGeo, shingleMat);
    roofWest.position.set(17.8, 4.75, -20);
    roofWest.rotation.z = 0.38;
    roofWest.castShadow = true;
    roofWest.receiveShadow = true;
    this.scene.add(roofWest);

    // East slope
    const roofEastGeo = new THREE.BoxGeometry(9.8, 0.18, 18.2);
    const roofEast = new THREE.Mesh(roofEastGeo, shingleMat);
    roofEast.position.set(26.2, 4.75, -20);
    roofEast.rotation.z = -0.38;
    roofEast.castShadow = true;
    roofEast.receiveShadow = true;
    this.scene.add(roofEast);

    // North & South Attic Gables (timber triangles)
    for (let gz of [-28.1, -11.9]) {
      const gableGeo = new THREE.ConeGeometry(8.5, 1.8, 4);
      const gable = new THREE.Mesh(gableGeo, woodMat);
      gable.position.set(22, 4.7, gz);
      gable.rotation.y = Math.PI / 4;
      this.scene.add(gable);
    }

    // Exposed Interior Timber Ceiling Rafters
    for (let rz = -27; rz <= -13; rz += 2.8) {
      const rafterGeo = new THREE.BoxGeometry(16.0, 0.16, 0.16);
      const rafter = new THREE.Mesh(rafterGeo, postMat);
      rafter.position.set(22, 3.65, rz);
      this.scene.add(rafter);
    }

    // D. Rustic River Rock Fireplace & Tall Stone Chimney
    const fireplaceGeo = new THREE.BoxGeometry(1.2, 2.6, 3.2);
    const fireplace = new THREE.Mesh(fireplaceGeo, chimneyMat);
    fireplace.position.set(29.4, 1.3, -20);
    fireplace.castShadow = true;
    this.scene.add(fireplace);

    // Stone Chimney Stack rising through roof
    const chimneyGeo = new THREE.BoxGeometry(1.4, 4.2, 1.6);
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(29.2, 4.6, -20);
    chimney.castShadow = true;
    this.scene.add(chimney);

    // Firebox hearth recess with glowing embers
    const fireGrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.4, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.9 })
    );
    fireGrate.position.set(28.8, 0.25, -20);
    this.scene.add(fireGrate);

    const emberLight = new THREE.PointLight(0xef4444, 1.1, 5);
    emberLight.position.set(28.7, 0.4, -20);
    this.scene.add(emberLight);
    this.flickeringLights.push({ light: emberLight, base: 1.1, timer: 1.2, speed: 4.0 });

    // E. Windows with Mullions and Grimy Glass
    // South Window
    const winS = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.08), glassMat);
    winS.position.set(22, 1.8, -12);
    this.scene.add(winS);
    const winSFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.14), postMat);
    winSFrame.position.set(22, 1.8, -12);
    this.scene.add(winSFrame);

    // North Window
    const winN = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.08), glassMat);
    winN.position.set(22, 1.8, -28);
    this.scene.add(winN);
    const winNFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.14), postMat);
    winNFrame.position.set(22, 1.8, -28);
    this.scene.add(winNFrame);

    // F. Authentic Interior Furnishings
    // Ranger Cot Bunk Bed (corner x: 27, z: -25.5)
    const cotFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x2e1f16, roughness: 0.85 })
    );
    cotFrame.position.set(27.2, 0.2, -25.5);
    this.scene.add(cotFrame);

    const cotMattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x223326, roughness: 0.9 })
    );
    cotMattress.position.set(27.2, 0.45, -25.5);
    this.scene.add(cotMattress);

    // Wooden Bookshelf & Field Supplies Cabinet
    const shelfGeo = new THREE.BoxGeometry(0.5, 2.2, 1.8);
    const shelf = new THREE.Mesh(shelfGeo, woodMat);
    shelf.position.set(28.8, 1.2, -15.0);
    shelf.castShadow = true;
    this.scene.add(shelf);

    // Wall-Mounted State Park Topographical Map
    const mapBoardGeo = new THREE.BoxGeometry(0.04, 1.2, 1.8);
    const mapBoardMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.6 });
    const mapBoard = new THREE.Mesh(mapBoardGeo, mapBoardMat);
    mapBoard.position.set(21.5, 2.0, -27.9);
    this.scene.add(mapBoard);

    // Corner Interlocking Log Ends on all 4 exterior corners
    const logEndGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.7, 8);
    const corners = [
      { x: 13.7, z: -28.2 },
      { x: 30.2, z: -28.2 },
      { x: 13.7, z: -11.8 },
      { x: 30.2, z: -11.8 },
    ];
    corners.forEach((c) => {
      for (let ly = 0.4; ly < 3.6; ly += 0.42) {
        const log = new THREE.Mesh(logEndGeo, postMat);
        log.position.set(c.x, ly, c.z);
        log.rotation.x = Math.PI / 2;
        log.castShadow = true;
        this.scene.add(log);
      }
    });

    // 2. LOGGING SHACK OPEN TIMBER SHELTER REALISM
    // Raised heavy timber plank floor
    const shackFloorGeo = new THREE.BoxGeometry(15.5, 0.2, 13.5);
    const shackFloor = new THREE.Mesh(shackFloorGeo, cabinFloorMat);
    shackFloor.position.set(-28, 0.1, 25);
    shackFloor.receiveShadow = true;
    this.scene.add(shackFloor);

    // Slanted heavy timber & corrugated tin roof
    const shackRoofGeo = new THREE.BoxGeometry(16.5, 0.25, 14.5);
    const shackRoof = new THREE.Mesh(shackRoofGeo, shingleMat);
    shackRoof.position.set(-28, 4.1, 25);
    shackRoof.rotation.x = 0.12; // slants backward for water runoff
    shackRoof.castShadow = true;
    this.scene.add(shackRoof);

    // Cords of neatly stacked split firewood along back windbreak wall
    for (let fz = 21.0; fz <= 29.0; fz += 0.85) {
      for (let fy = 0.3; fy <= 1.5; fy += 0.3) {
        const woodLog = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), postMat);
        woodLog.position.set(-34.2, fy, fz);
        woodLog.rotation.z = Math.PI / 2;
        this.scene.add(woodLog);
      }
    }

    // Heavy carpenter sawhorse workbench with metal hand tools
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 1.8), woodMat);
    benchTop.position.set(-27.5, 0.95, 25);
    benchTop.castShadow = true;
    this.scene.add(benchTop);

    // Rusted steel 55-gallon oil drums
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.6 });
    for (let d = 0; d < 3; d++) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12), drumMat);
      drum.position.set(-23.5 - d * 0.95, 0.65, 30.2);
      drum.castShadow = true;
      this.scene.add(drum);
    }

    // 3. LOOKOUT BLUFF FIRE WATCHTOWER REALISM (x: 34 to 42, z: -8 to 0)
    // Observation deck platform at y: 5.8
    const towerPlatformGeo = new THREE.BoxGeometry(8.8, 0.28, 8.8);
    const towerDeck = new THREE.Mesh(towerPlatformGeo, cabinFloorMat);
    towerDeck.position.set(38, 5.8, -4);
    towerDeck.castShadow = true;
    towerDeck.receiveShadow = true;
    this.scene.add(towerDeck);

    // Diagonal Heavy Timber X-Truss Braces between the 4 stilt legs
    const trussMat = postMat;
    const addXBrace = (p1: THREE.Vector3, p2: THREE.Vector3) => {
      const length = p1.distanceTo(p2);
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.14, length, 0.14), trussMat);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      brace.position.copy(mid);
      brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      brace.castShadow = true;
      this.scene.add(brace);
    };

    // 4 Faces of Diagonal X-Trusses
    addXBrace(new THREE.Vector3(35, 0.5, -7), new THREE.Vector3(41, 5.6, -7));
    addXBrace(new THREE.Vector3(41, 0.5, -7), new THREE.Vector3(35, 5.6, -7));
    addXBrace(new THREE.Vector3(35, 0.5, -1), new THREE.Vector3(41, 5.6, -1));
    addXBrace(new THREE.Vector3(41, 0.5, -1), new THREE.Vector3(35, 5.6, -1));
    addXBrace(new THREE.Vector3(41, 0.5, -7), new THREE.Vector3(41, 5.6, -1));
    addXBrace(new THREE.Vector3(41, 0.5, -1), new THREE.Vector3(41, 5.6, -7));

    // Sturdy Wooden Switchback Staircase with Handrails leading up to the tower!
    for (let step = 0; step < 24; step++) {
      const progress = step / 24;
      const sy = 0.2 + progress * 5.6;
      // Stretches along the west face of the tower (x: 33.6, z from -7 to -1)
      const sz = -7.2 + progress * 6.2;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.45), cabinFloorMat);
      stepMesh.position.set(33.6, sy, sz);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      this.scene.add(stepMesh);
    }

    // Wooden Guardrail along the staircase
    const stairRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.8, 6), postMat);
    stairRail.position.set(33.0, 3.6, -4.1);
    stairRail.rotation.x = -Math.PI / 4.2;
    this.scene.add(stairRail);

    // Perimeter Observation Guardrails around top deck
    for (let rx of [33.8, 42.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 8.6), postMat);
      rail.position.set(rx, 6.45, -4);
      this.scene.add(rail);
    }
    const backRail = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.1, 0.12), postMat);
    backRail.position.set(38, 6.45, -8.2);
    this.scene.add(backRail);

    // Observation Cab Pyramid Hip Roof
    const towerRoofGeo = new THREE.ConeGeometry(7.0, 2.6, 4);
    const towerRoof = new THREE.Mesh(towerRoofGeo, shingleMat);
    towerRoof.position.set(38, 8.8, -4);
    towerRoof.rotation.y = Math.PI / 4;
    towerRoof.castShadow = true;
    this.scene.add(towerRoof);

    // Central Fire Lookout Spotting Table
    const spotTable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
    );
    spotTable.position.set(38, 6.3, -4);
    spotTable.castShadow = true;
    this.scene.add(spotTable);

    // Vintage Brass Swivel Spotlight on the observation tower
    const spotLightHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.8 })
    );
    spotLightHousing.position.set(38, 7.0, -7.8);
    spotLightHousing.rotation.x = Math.PI / 6;
    this.scene.add(spotLightHousing);

    // 4. DIESEL GENERATOR POWER STATION REALISM
    // Heavy concrete foundation pad
    const padGeo = new THREE.BoxGeometry(8.5, 0.25, 8.5);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(26, 0.12, 22);
    pad.receiveShadow = true;
    this.scene.add(pad);

    // Large Industrial Diesel Generator with Radiator Fan Grill & Exhaust Pipe
    const fuseBoxGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const fuseBoxTex = createGeneratorTexture(0);
    const fuseBoxMat = new THREE.MeshStandardMaterial({ map: fuseBoxTex, roughness: 0.5, metalness: 0.4 });
    this.fuseBoxMesh = new THREE.Mesh(fuseBoxGeo, fuseBoxMat);
    this.fuseBoxMesh.position.set(26, 1.25, 22);
    this.fuseBoxMesh.castShadow = true;
    this.fuseBoxMesh.userData = { itemId: 'station_fusebox' };
    this.scene.add(this.fuseBoxMesh);

    // Generator Heavy Exhaust Pipe & Muffler
    const exhaustPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0.8 })
    );
    exhaustPipe.position.set(27.4, 2.8, 22.8);
    this.scene.add(exhaustPipe);

    // Generator Status Light
    const genLight = new THREE.PointLight(0x10b981, 0.4, 6);
    genLight.position.set(26, 2.4, 21);
    this.scene.add(genLight);
    this.flickeringLights.push({ light: genLight, base: 0.4, timer: 0.5, speed: 1.5 });

    // 5. DOORS & GATES
    // Authentic Ranger Station Cabin Timber Door (with precision hinge group)
    this.substationDoorHinge = new THREE.Group();
    this.substationDoorHinge.position.set(14.0, 1.9, -21.0);

    const subDoorGeo = new THREE.BoxGeometry(0.12, 3.8, 3.0);
    const subDoorTex = createCabinWoodTexture();
    const subDoorMat = new THREE.MeshStandardMaterial({ map: subDoorTex, roughness: 0.7 });
    this.substationDoorMesh = new THREE.Mesh(subDoorGeo, subDoorMat);
    this.substationDoorMesh.position.set(0, 0, 1.5); // pivot on edge hinge
    this.substationDoorMesh.castShadow = true;
    this.substationDoorMesh.userData = { itemId: 'door_substation' };
    this.substationDoorHinge.add(this.substationDoorMesh);
    this.scene.add(this.substationDoorHinge);

    // South Highway Emergency Forestry Gate
    const exitDoorGeo = new THREE.BoxGeometry(12.0, 3.8, 0.3);
    const exitDoorTex = createGateTexture('BLACKWOOD HIGHWAY 9');
    const exitDoorMat = new THREE.MeshStandardMaterial({ map: exitDoorTex, roughness: 0.5, metalness: 0.4 });
    this.exitDoorMesh = new THREE.Mesh(exitDoorGeo, exitDoorMat);
    this.exitDoorMesh.position.set(0, 1.9, 48.5);
    this.exitDoorMesh.castShadow = true;
    this.exitDoorMesh.userData = { itemId: 'door_exit' };
    this.scene.add(this.exitDoorMesh);

    // 6. Build Outdoor Props, Trees, Campsite, Monoliths
    this.buildProps();

    // 7. Interactive Items (Spark Plugs, Keys, Batteries, Notes)
    this.buildInteractiveItems();

    // 8. Forest & Structure Lights
    this.buildFlickeringLights();

    // 9. UV Hidden Trail Runes
    this.buildUVClues();
  }

  private buildProps() {
    const barkTex = createBarkTexture();
    const barkBump = createBarkBumpMap();
    const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, bumpMap: barkBump, bumpScale: 0.14, roughness: 0.92 });

    // Photorealistic Pine Foliage & Needle Bump Materials
    const needleTex = createPineFoliageTexture();
    needleTex.repeat.set(2, 2);
    const needleBump = createPineFoliageBumpMap();
    needleBump.repeat.set(2, 2);

    const needleMat = new THREE.MeshStandardMaterial({
      map: needleTex,
      bumpMap: needleBump,
      bumpScale: 0.08,
      roughness: 0.82,
      metalness: 0.04,
    });

    const deadMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      color: 0x221c17,
      roughness: 0.95,
    });

    const rockTex = createRockBoulderTexture();
    const rockMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.88,
      metalness: 0.05,
    });

    // Helper: Build Procedural Pine Tree
    const spawnPineTree = (x: number, z: number, scale = 1.0) => {
      const treeGroup = new THREE.Group();

      // Flared Root Base
      const rootGeo = new THREE.CylinderGeometry(0.36 * scale, 0.62 * scale, 0.8 * scale, 8);
      const roots = new THREE.Mesh(rootGeo, trunkMat);
      roots.position.y = 0.4 * scale;
      roots.receiveShadow = true;
      treeGroup.add(roots);

      // Main Tapered Pine Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.22 * scale, 0.44 * scale, 10.5 * scale, 8);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 5.25 * scale;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Dead lower branch stubs (natural understory canopy shedding)
      for (let s = 0; s < 5; s++) {
        const stubAngle = (s * 1.35) + Math.PI;
        const stubGeo = new THREE.CylinderGeometry(0.04 * scale, 0.07 * scale, 1.1 * scale, 5);
        const stub = new THREE.Mesh(stubGeo, deadMat);
        stub.position.set(Math.cos(stubAngle) * 0.38 * scale, (2.2 + s * 0.55) * scale, Math.sin(stubAngle) * 0.38 * scale);
        stub.rotation.z = Math.PI / 2.4;
        stub.rotation.y = stubAngle;
        stub.castShadow = true;
        treeGroup.add(stub);
      }

      // 5 Rich Conical Foliage Tiers with radial drooping branch sprays
      const tiers = [
        { r: 3.2 * scale, h: 3.2 * scale, y: 4.8 * scale, subBoughs: 6 },
        { r: 2.7 * scale, h: 2.9 * scale, y: 6.6 * scale, subBoughs: 5 },
        { r: 2.1 * scale, h: 2.6 * scale, y: 8.2 * scale, subBoughs: 4 },
        { r: 1.5 * scale, h: 2.3 * scale, y: 9.6 * scale, subBoughs: 3 },
        { r: 0.9 * scale, h: 2.0 * scale, y: 10.8 * scale, subBoughs: 0 },
      ];

      tiers.forEach((t, idx) => {
        const coneGeo = new THREE.ConeGeometry(t.r, t.h, 8);
        const cone = new THREE.Mesh(coneGeo, needleMat);
        cone.position.y = t.y;
        cone.rotation.y = idx * 0.7;
        cone.castShadow = true;
        cone.receiveShadow = true;
        treeGroup.add(cone);

        // Radial drooping branch sprays
        for (let b = 0; b < t.subBoughs; b++) {
          const bAngle = (b / t.subBoughs) * Math.PI * 2 + (idx * 0.5);
          const bLen = t.r * 0.85;
          const bGeo = new THREE.ConeGeometry(t.r * 0.35, bLen * 0.8, 6);
          const bMesh = new THREE.Mesh(bGeo, needleMat);
          const bx = Math.cos(bAngle) * (t.r * 0.52);
          const bz = Math.sin(bAngle) * (t.r * 0.52);
          bMesh.position.set(bx, t.y - (t.h * 0.28), bz);
          bMesh.rotation.z = Math.PI / 2.35;
          bMesh.rotation.y = -bAngle;
          bMesh.castShadow = true;
          treeGroup.add(bMesh);
        }
      });

      treeGroup.position.set(x, 0, z);
      treeGroup.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(treeGroup);

      // Register for organic wind swaying
      this.swayingTrees.push({
        group: treeGroup,
        initialRotZ: 0,
        initialRotX: 0,
        phase: Math.random() * Math.PI * 2,
        freq: 0.75 + Math.random() * 0.35,
        amp: 0.022 + (scale > 1.0 ? 0.012 : 0.006),
      });

      // Physical Trunk Collision
      this.staticObstacles.push({
        id: `tree_pine_${Math.round(x)}_${Math.round(z)}`,
        minX: x - 0.45 * scale,
        maxX: x + 0.45 * scale,
        minZ: z - 0.45 * scale,
        maxZ: z + 0.45 * scale,
        height: 11,
      });
    };

    // Helper: Build Dead Barren Gnarled Tree
    const spawnDeadTree = (x: number, z: number, scale = 1.0) => {
      const deadGroup = new THREE.Group();
      const trunkGeo = new THREE.CylinderGeometry(0.22 * scale, 0.4 * scale, 8.5 * scale, 7);
      const trunk = new THREE.Mesh(trunkGeo, deadMat);
      trunk.position.y = 4.25 * scale;
      trunk.castShadow = true;
      deadGroup.add(trunk);

      // Twisted bare weathered gnarled branches
      for (let i = 0; i < 6; i++) {
        const branchGeo = new THREE.CylinderGeometry(0.05 * scale, 0.14 * scale, (2.4 + (i % 3) * 0.5) * scale, 5);
        const branch = new THREE.Mesh(branchGeo, deadMat);
        branch.position.set(0, (4.2 + i * 0.7) * scale, 0);
        branch.rotation.z = (0.55 + (i % 2) * 0.25) * (i % 2 === 0 ? 1 : -1);
        branch.rotation.y = (i * Math.PI) / 3;
        branch.castShadow = true;
        deadGroup.add(branch);
      }

      deadGroup.position.set(x, 0, z);
      this.scene.add(deadGroup);

      this.swayingTrees.push({
        group: deadGroup,
        initialRotZ: 0,
        initialRotX: 0,
        phase: Math.random() * Math.PI * 2,
        freq: 0.85 + Math.random() * 0.3,
        amp: 0.016,
      });

      this.staticObstacles.push({
        id: `tree_dead_${Math.round(x)}_${Math.round(z)}`,
        minX: x - 0.4 * scale,
        maxX: x + 0.4 * scale,
        minZ: z - 0.4 * scale,
        maxZ: z + 0.4 * scale,
        height: 8,
      });
    };

    const spawnFallenBranch = (x: number, z: number, length: number, angle: number, scale = 1.0) => {
      const branchRadius = 0.11 * scale;
      const addStickSegment = (start: THREE.Vector3, end: THREE.Vector3, startRadius: number, endRadius: number) => {
        const direction = new THREE.Vector3().subVectors(end, start);
        const segment = new THREE.Mesh(
          new THREE.CylinderGeometry(endRadius, startRadius, direction.length(), 6),
          deadMat
        );
        segment.position.copy(start).add(end).multiplyScalar(0.5);
        segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        segment.castShadow = true;
        this.scene.add(segment);
      };

      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const start = new THREE.Vector3(x, 0.62 * scale, z).addScaledVector(direction, -length * scale * 0.5);
      const end = new THREE.Vector3(x, 0.62 * scale, z).addScaledVector(direction, length * scale * 0.5);
      addStickSegment(start, end, branchRadius, branchRadius * 0.48);

      // Short forked twigs make each obstacle read as a branch instead of a log.
      const forkOrigin = start.clone().lerp(end, 0.38);
      const forkDirection = new THREE.Vector3(-direction.z, 0, direction.x);
      addStickSegment(
        forkOrigin,
        forkOrigin.clone().addScaledVector(direction, length * scale * 0.16).addScaledVector(forkDirection, length * scale * 0.25),
        branchRadius * 0.6,
        branchRadius * 0.12
      );
      const secondForkOrigin = start.clone().lerp(end, 0.7);
      addStickSegment(
        secondForkOrigin,
        secondForkOrigin.clone().addScaledVector(direction, -length * scale * 0.1).addScaledVector(forkDirection, -length * scale * 0.2),
        branchRadius * 0.5,
        branchRadius * 0.1
      );

      const knot = new THREE.Mesh(new THREE.SphereGeometry(branchRadius * 1.25, 6, 5), deadMat);
      knot.position.copy(forkOrigin);
      knot.castShadow = true;
      this.scene.add(knot);

      const halfWidth = Math.abs(Math.cos(angle) * length * scale * 0.5) + branchRadius;
      const halfDepth = Math.abs(Math.sin(angle) * length * scale * 0.5) + branchRadius;
      this.staticObstacles.push({
        id: `fallen_branch_${Math.round(x * 10)}_${Math.round(z * 10)}`,
        minX: x - halfWidth,
        maxX: x + halfWidth,
        minZ: z - halfDepth,
        maxZ: z + halfDepth,
        height: 0.35 * scale,
      });
    };

    // Pine Trees distributed naturally across the whole 160m park
    const pineCoords = [
      // Central Trail Corridor
      [-6, -24, 1.1], [4, -25, 0.9], [-10, -22, 1.2], [7, -21, 1.0],
      [-8, -16, 1.0], [3, -15, 1.1], [-6, -11, 0.9], [5, -9, 1.2],
      [-12, -7, 1.1], [6, -4, 1.0], [-10, -2, 1.0], [7, 0, 1.2],
      [-7, 5, 1.1], [4, 6, 0.9], [-8, 12, 1.0], [6, 15, 1.1],
      [-5, 20, 1.2], [5, 22, 1.0], [-7, 26, 1.1], [6, 26, 0.9],
      // Deep Woods Northwest (near campsite and monoliths)
      [-42, -45, 1.2], [-36, -38, 1.1], [-18, -42, 1.2], [-32, -46, 1.0],
      [-48, -25, 1.2], [-42, -18, 1.0], [-45, -8, 1.1], [-38, -14, 1.2],
      [-16, -24, 1.0], [-35, -2, 1.1], [-46, 6, 1.2], [-38, 8, 1.0],
      // Deep Woods Northeast (behind ranger station and cliffs)
      [36, -42, 1.1], [45, -36, 1.2], [48, -24, 1.1], [34, -32, 1.0],
      [44, -16, 1.2], [48, -4, 1.0], [42, 6, 1.2], [46, 14, 1.1],
      [32, -18, 1.0], [32, -26, 1.1], [22, -34, 1.2], [10, -32, 1.0],
      // Deep Woods Southwest (near logging camp)
      [-48, 20, 1.1], [-45, 32, 1.2], [-42, 44, 1.1], [-38, 40, 1.0],
      [-26, 36, 1.1], [-22, 44, 1.2], [-14, 38, 1.0], [-14, 46, 1.1],
      [-32, 16, 1.1], [-18, 26, 1.0], [-48, 48, 1.2], [-36, 52, 1.0],
      // Deep Woods Southeast (near generator and highway road)
      [36, 24, 1.1], [42, 28, 1.2], [46, 38, 1.1], [38, 44, 1.0],
      [22, 34, 1.0], [28, 42, 1.2], [14, 42, 1.1], [18, 50, 1.0],
      [34, 12, 1.1], [44, 46, 1.2], [28, 52, 1.1], [12, 54, 1.0],
    ];

    pineCoords.forEach(([x, z, s]) => spawnPineTree(x, z, s));

    // Dead twisted trees
    const deadCoords = [
      [-14, -20, 1.1], [-22, -16, 1.2], [-14, -13, 0.9], [-22, -10, 1.0],
      [14, 6, 1.1], [10, 15, 1.0], [-10, 17, 1.0], [10, 24, 1.2],
      [-32, -22, 1.2], [28, -2, 1.1], [-24, 12, 1.0], [20, 28, 1.1],
    ];
    deadCoords.forEach(([x, z, s]) => spawnDeadTree(x, z, s));

    // Fallen understory branches make the open trails harder to cross quietly.
    [
      [-4, -19, 3.8, 0.35, 1.0],
      [5, -13, 3.2, -0.7, 0.9],
      [-5, -6, 4.4, 0.15, 1.05],
      [3, -1, 3.6, 1.0, 0.85],
      [-4, 8, 4.6, -0.45, 1.0],
      [4, 13, 3.4, 0.65, 0.9],
      [-3, 18, 4.0, -0.2, 1.0],
      [2, 25, 4.8, 0.5, 1.1],
      [-30, -15, 3.8, 0.8, 1.0],
      [18, -7, 4.2, -0.35, 1.0],
      [-18, 20, 4.5, 0.25, 1.05],
      [18, 31, 3.6, -0.8, 0.9],
    ].forEach(([x, z, length, angle, scale]) => spawnFallenBranch(x, z, length, angle, scale));

    // Forest Boulders
    const boulderCoords = [
      [-14, -10, 1.4], [-20, -7, 1.8], [-12, -4, 1.2], [10, -5, 1.6],
      [-10, 8, 1.5], [10, 4, 1.4], [-8, 23, 1.7], [8, 21, 1.5],
      [-40, 5, 2.0], [39, 19, 1.8],
    ];
    boulderCoords.forEach(([bx, bz, bs]) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(bs * 0.8, 1), rockMat);
      rock.position.set(bx, bs * 0.4, bz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    });

    // Instanced meadow grass adds grounded detail without creating hundreds of draw calls.
    const grassCount = 7200;
    const grassGeometry = new THREE.ConeGeometry(0.045, 0.42, 3);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x587d43,
      emissive: 0x10240d,
      emissiveIntensity: 0.22,
      roughness: 0.94,
      metalness: 0,
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);
    const grassMatrix = new THREE.Matrix4();
    const grassPosition = new THREE.Vector3();
    const grassScale = new THREE.Vector3();
    const grassQuaternion = new THREE.Quaternion();
    let placedGrass = 0;
    let attempts = 0;
    while (placedGrass < grassCount && attempts < grassCount * 10) {
      attempts++;
      const x = (Math.random() - 0.5) * 104;
      const z = (Math.random() - 0.5) * 104;
      const overlapsWoodOrObstacle = this.staticObstacles.some((obstacle) =>
        x > obstacle.minX - 0.18 &&
        x < obstacle.maxX + 0.18 &&
        z > obstacle.minZ - 0.18 &&
        z < obstacle.maxZ + 0.18
      );
      if (overlapsWoodOrObstacle) continue;

      const height = 0.14 + Math.random() * 0.3;
      grassPosition.set(x, height * 0.5, z);
      grassQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
      grassScale.set(0.8 + Math.random() * 0.8, height / 0.42, 0.8 + Math.random() * 0.8);
      grassMatrix.compose(grassPosition, grassQuaternion, grassScale);
      grass.setMatrixAt(placedGrass, grassMatrix);
      grass.setColorAt(placedGrass, new THREE.Color().setHSL(0.22 + Math.random() * 0.05, 0.25 + Math.random() * 0.25, 0.12 + Math.random() * 0.1));
      placedGrass++;
    }
    grass.count = placedGrass;
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    grass.receiveShadow = true;
    this.scene.add(grass);

    // 1. Abandoned 1980s 4x4 Pickup Truck at North Trailhead (matches facilityMap at -1, -26)
    const truckGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x24323d, roughness: 0.55, metalness: 0.65 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.88 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.95 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.92 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65,
    });
    const dashMat = new THREE.MeshStandardMaterial({
      map: createTruckDashboardTexture(),
      roughness: 0.5,
    });

    // Steel Chassis Frame Rails
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 4.8), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
    chassis.position.y = 0.45;
    truckGroup.add(chassis);

    // Pickup Truck Cab Body
    const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.8, 2.1), bodyMat);
    cabLower.position.set(0, 0.95, -0.6);
    cabLower.castShadow = true;
    truckGroup.add(cabLower);

    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 1.6), rustMat);
    cabRoof.position.set(0, 1.62, -0.7);
    cabRoof.castShadow = true;
    truckGroup.add(cabRoof);

    // Front Windshield (slanted glass plane)
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.68), glassMat);
    windshield.position.set(0, 1.58, -1.52);
    windshield.rotation.x = -0.32;
    truckGroup.add(windshield);

    // Rear Cab Window
    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), glassMat);
    rearWindow.position.set(0, 1.6, 0.12);
    truckGroup.add(rearWindow);

    // Interior Dashboard & Steering Wheel
    const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 0.3), dashMat);
    dashboard.position.set(0, 1.25, -1.4);
    truckGroup.add(dashboard);

    const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 8, 16), rubberMat);
    steerWheel.position.set(-0.5, 1.35, -1.2);
    steerWheel.rotation.x = -0.4;
    truckGroup.add(steerWheel);

    // Front Hood & Engine Compartment
    this.pickupHoodHinge = new THREE.Group();
    this.pickupHoodHinge.position.set(0, 1.05, -1.0);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 1.7), bodyMat);
    hood.position.set(0, 0, -0.8);
    hood.castShadow = true;
    this.pickupHoodHinge.add(hood);
    truckGroup.add(this.pickupHoodHinge);

    // Front Steel Grille & Round Sealed-Beam Headlights
    const grille = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.42, 0.08), chromeMat);
    grille.position.set(0, 0.9, -2.66);
    truckGroup.add(grille);

    for (let hx of [-0.78, 0.78]) {
      const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), glassMat);
      headlight.rotation.x = Math.PI / 2;
      headlight.position.set(hx, 0.92, -2.69);
      truckGroup.add(headlight);

      // Amber turn signal
      const signal = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.08, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      signal.position.set(hx * 1.15, 0.92, -2.68);
      truckGroup.add(signal);
    }

    // Heavy Off-Road Winch Bumper & Tow Shackles
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.28), rustMat);
    bumper.position.set(0, 0.55, -2.75);
    bumper.castShadow = true;
    truckGroup.add(bumper);

    // Cargo Bed with Ribbed Side Panels & Tailgate
    const bedSides = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.65, 2.3), bodyMat);
    bedSides.position.set(0, 0.88, 1.6);
    bedSides.castShadow = true;
    truckGroup.add(bedSides);

    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.08), rustMat);
    tailgate.position.set(0, 0.88, 2.76);
    tailgate.castShadow = true;
    truckGroup.add(tailgate);

    // 4 Heavy-Duty All-Terrain Knobby Wheels & Steel Hubs
    for (let wx of [-1.15, 1.15]) {
      for (let wz of [-1.55, 1.75]) {
        const wheelGroup = new THREE.Group();
        // Thick rubber tire
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 16), rubberMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        // Steel wheel rim & 5 lug nuts
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.33, 16), chromeMat);
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
          const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), rustMat);
          lug.rotation.z = Math.PI / 2;
          lug.position.set(0, Math.cos(a) * 0.14, Math.sin(a) * 0.14);
          wheelGroup.add(lug);
        }

        wheelGroup.position.set(wx, 0.44, wz);
        truckGroup.add(wheelGroup);
      }
    }

    truckGroup.position.set(-1, 0, -26);
    this.scene.add(truckGroup);

    // 2. Abandoned Campsite (Expedition Tent, Charred Campfire, Embers, Log Benches at -27, -4)
    const tentGroup = new THREE.Group();
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2b, roughness: 0.85, side: THREE.DoubleSide });
    const tarpMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, side: THREE.DoubleSide });
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.8 });

    // Ground moisture tarp
    const groundTarp = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.2), tarpMat);
    groundTarp.position.set(0, 0.02, 0);
    groundTarp.rotation.x = -Math.PI / 2;
    tentGroup.add(groundTarp);

    // A-frame tent ridge
    const tentWall1 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), tentMat);
    tentWall1.position.set(-0.9, 1.0, 0);
    tentWall1.rotation.y = Math.PI / 2;
    tentWall1.rotation.x = Math.PI / 4;
    tentWall1.castShadow = true;
    tentGroup.add(tentWall1);

    const tentWall2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), tentMat);
    tentWall2.position.set(0.9, 1.0, 0);
    tentWall2.rotation.y = -Math.PI / 2;
    tentWall2.rotation.x = Math.PI / 4;
    tentWall2.castShadow = true;
    tentGroup.add(tentWall2);

    // Support ridge poles
    for (let pz of [-1.55, 1.55]) {
      const vPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), poleMat);
      vPole1.position.set(-0.55, 0.85, pz);
      vPole1.rotation.z = -0.42;
      tentGroup.add(vPole1);

      const vPole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), poleMat);
      vPole2.position.set(0.55, 0.85, pz);
      vPole2.rotation.z = 0.42;
      tentGroup.add(vPole2);
    }

    // Rolled sleeping bag inside
    const sleepBag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.85 })
    );
    sleepBag.position.set(0.3, 0.18, -0.4);
    sleepBag.rotation.z = Math.PI / 2;
    tentGroup.add(sleepBag);

    tentGroup.position.set(-27, 0, -4);
    this.scene.add(tentGroup);

    // Campfire ring of 10 weathered river stones
    const fireGroup = new THREE.Group();
    for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 10) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 + Math.sin(a * 3) * 0.04, 1), rockMat);
      stone.position.set(Math.cos(a) * 0.95, 0.14, Math.sin(a) * 0.95);
      fireGroup.add(stone);
    }

    // Charred Wood & Glowing Embers
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
    const emberMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.12, 10), emberMat);
    emberMesh.position.y = 0.06;
    fireGroup.add(emberMesh);

    // Realistic Charred Teepee Logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x18120e, roughness: 0.95 });
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const charredLog = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 1.1, 8), logMat);
      charredLog.position.set(Math.cos(ang) * 0.28, 0.35, Math.sin(ang) * 0.28);
      charredLog.rotation.x = 0.55;
      charredLog.rotation.y = -ang;
      fireGroup.add(charredLog);
    }

    // Cast-iron kettle on campfire edge
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8, metalness: 0.6 })
    );
    kettle.position.set(0.55, 0.16, 0.4);
    fireGroup.add(kettle);

    fireGroup.position.set(-25, 0, -7);
    this.scene.add(fireGroup);

    // 3. Ancient Megalithic Standing Stones (Occult Menhirs at -24, -32)
    const monolithGroup = new THREE.Group();
    const runeTex = createOccultRuneTexture();
    const monolithMat = new THREE.MeshStandardMaterial({
      map: runeTex,
      roughness: 0.92,
      metalness: 0.1,
    });
    const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let i = 0; i < 5; i++) {
      const ang = (i * Math.PI * 2) / 5;
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.4, 0.55), monolithMat);
      stone.position.set(Math.cos(ang) * 4.4, 2.2, Math.sin(ang) * 4.4);
      stone.rotation.y = -ang + (i % 2 === 0 ? 0.08 : -0.08);
      stone.castShadow = true;
      monolithGroup.add(stone);
    }

    // Central Sacrificial Altar Slab
    const altar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 1.4), monolithMat);
    altar.position.set(0, 0.32, 0);
    altar.castShadow = true;
    monolithGroup.add(altar);

    // Ritual Tallow Candles on the altar with tiny flame wicks
    for (let c = 0; c < 3; c++) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.14, 8), candleWaxMat);
      candle.position.set(-0.6 + c * 0.6, 0.72, (c % 2 === 0 ? 0.2 : -0.2));
      monolithGroup.add(candle);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 6), flameMat);
      flame.position.set(-0.6 + c * 0.6, 0.81, (c % 2 === 0 ? 0.2 : -0.2));
      monolithGroup.add(flame);
    }

    monolithGroup.position.set(-24, 0, -32);
    this.scene.add(monolithGroup);

    // 4. Ranger Cabin Desk & Trail Cam Monitor (inside cabin at x: 20, z: -24)
    const deskMat = new THREE.MeshStandardMaterial({
      map: createCabinWoodTexture(),
      roughness: 0.75,
    });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.2), deskMat);
    desk.position.set(20, 0.4, -24);
    desk.castShadow = true;
    this.scene.add(desk);

    // Realistic CRT Surveillance Terminal Monitor with Bezel
    const monitorGroup = new THREE.Group();
    const casingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.35), casingMat);
    casing.castShadow = true;
    monitorGroup.add(casing);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), screenMat);
    screen.position.set(0, 0.02, 0.18);
    monitorGroup.add(screen);

    // Ham Radio Station Transceiver with Rotary Knobs
    const radio = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.22, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 })
    );
    radio.position.set(0.72, -0.15, 0.05);
    monitorGroup.add(radio);

    monitorGroup.position.set(20, 1.1, -24);
    monitorGroup.userData = { itemId: 'terminal_cctv' };
    this.scene.add(monitorGroup);

    // Weathered perimeter fence: it encloses the playable forest but leaves the highway gate opening.
    const fencePostMat = new THREE.MeshStandardMaterial({ color: 0x241b16, roughness: 0.95 });
    const fenceRailMat = new THREE.MeshStandardMaterial({ color: 0x34251d, roughness: 0.92 });
    const addFenceRun = (start: THREE.Vector3, end: THREE.Vector3) => {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const postCount = Math.floor(length / 6) + 1;

      for (let i = 0; i <= postCount; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.0, 0.24), fencePostMat);
        post.position.copy(start).lerp(end, Math.min(1, i / postCount));
        post.position.y = 2.0;
        post.rotation.y = (i % 2) * 0.035;
        post.castShadow = true;
        this.scene.add(post);
      }

      const railLength = length + 0.2;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.16, 0.16), fenceRailMat);
      rail.position.copy(start).add(end).multiplyScalar(0.5);
      rail.position.y = 1.25;
      rail.rotation.y = Math.atan2(direction.z, direction.x);
      rail.castShadow = true;
      this.scene.add(rail);

      const upperRail = rail.clone();
      upperRail.position.y = 2.7;
      this.scene.add(upperRail);
    };

    addFenceRun(new THREE.Vector3(-60, 0, -59), new THREE.Vector3(60, 0, -59));
    addFenceRun(new THREE.Vector3(-59, 0, -60), new THREE.Vector3(-59, 0, 60));
    addFenceRun(new THREE.Vector3(59, 0, -60), new THREE.Vector3(59, 0, 60));
    addFenceRun(new THREE.Vector3(-60, 0, 48.5), new THREE.Vector3(-6.5, 0, 48.5));
    addFenceRun(new THREE.Vector3(6.5, 0, 48.5), new THREE.Vector3(60, 0, 48.5));

    // Synchronize all static obstacles into active walls
    this.updateActiveWalls();
  }

  // UV Invisible Trail Runes (Glowing neon violet when UV blacklight is toggled)
  private buildUVClues() {
    const clues = [
      { text: '→ STAY ON TRAILS // IT HEARS SPRINTING ←', pos: new THREE.Vector3(-3.2, 1.8, -24), rotY: Math.PI / 2 },
      { text: 'MAGNESIUM FLARES BLIND IT', pos: new THREE.Vector3(-25, 1.4, -4), rotY: 0 },
      { text: '3 SPARK PLUGS POWER HIGHWAY GATE', pos: new THREE.Vector3(16, 1.8, -14.2), rotY: 0 },
      { text: 'WOODEN BLINDS MUTE YOUR BREATH', pos: new THREE.Vector3(-26, 1.8, 22), rotY: 0 },
    ];

    clues.forEach((c) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = '#d8b4fe';
      ctx.fillText(c.text, 15, 70);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9 });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.75), mat);
      plane.position.copy(c.pos);
      plane.rotation.y = c.rotY;
      plane.visible = false; // hidden until UV light is on!

      this.scene.add(plane);
      this.uvClueMeshes.push(plane);
    });
  }

  private buildInteractiveItems() {
    this.items.forEach((item) => {
      let mesh: THREE.Object3D;

      switch (item.type) {
        case 'fuse': {
          // Photorealistic Automotive Spark Plug
          const plugGroup = new THREE.Group();
          const steelMat = new THREE.MeshStandardMaterial({ color: 0xc0c5ce, roughness: 0.25, metalness: 0.9 });
          const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.12 });
          const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.85 });

          // 1. Threaded steel barrel
          const threadBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.1, 12), steelMat);
          threadBarrel.position.y = 0.05;
          threadBarrel.castShadow = true;
          plugGroup.add(threadBarrel);

          // 2. Center electrode pin & bent nickel ground electrode hook
          const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.025, 8), steelMat);
          centerPin.position.y = -0.01;
          plugGroup.add(centerPin);

          const groundHook = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.024, 0.018), steelMat);
          groundHook.position.set(0.02, -0.008, 0);
          plugGroup.add(groundHook);

          // 3. Hexagonal wrench nut collar
          const hexNut = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.045, 6), steelMat);
          hexNut.position.y = 0.12;
          hexNut.castShadow = true;
          plugGroup.add(hexNut);

          // 4. Glazed ceramic insulator neck with 3 compression rib rings
          const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.15, 12), ceramicMat);
          insulator.position.y = 0.215;
          insulator.castShadow = true;
          plugGroup.add(insulator);

          for (let r = 0; r < 3; r++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.005, 6, 12), ceramicMat);
            ring.position.y = 0.17 + r * 0.035;
            ring.rotation.x = Math.PI / 2;
            plugGroup.add(ring);
          }

          // 5. Top threaded brass terminal stud
          const brassTip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.035, 8), brassMat);
          brassTip.position.y = 0.305;
          plugGroup.add(brassTip);

          // Subtle electrical field ion glow
          const glow = new THREE.PointLight(0x38bdf8, 0.45, 2.0);
          glow.position.y = 0.15;
          plugGroup.add(glow);

          plugGroup.rotation.z = Math.PI / 2.3;
          mesh = plugGroup;
          break;
        }

        case 'battery': {
          // Realistic Industrial D-Cell Alkaline Battery
          const batGroup = new THREE.Group();
          const bodyMat = new THREE.MeshStandardMaterial({
            map: createBatteryTexture(),
            roughness: 0.4,
            metalness: 0.35,
          });
          const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3, metalness: 0.85 });
          const nickelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });

          // Cylindrical battery jacket
          const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.14, 16), bodyMat);
          jacket.position.y = 0.07;
          jacket.castShadow = true;
          batGroup.add(jacket);

          // Top copper collar
          const copperTop = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.048, 0.015, 16), copperMat);
          copperTop.position.y = 0.145;
          batGroup.add(copperTop);

          // Positive center terminal button/nipple
          const posNipple = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.016, 12), nickelMat);
          posNipple.position.y = 0.158;
          batGroup.add(posNipple);

          // Negative bottom steel contact plate
          const negPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 16), nickelMat);
          negPlate.position.y = 0.004;
          batGroup.add(negPlate);

          batGroup.rotation.x = Math.PI / 2;
          mesh = batGroup;
          break;
        }

        case 'bottle': {
          // Realistic Amber Glass Whiskey Bottle with Cork Stopper & Vintage Label
          const botGroup = new THREE.Group();
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0x78350f,
            roughness: 0.08,
            metalness: 0.15,
            transparent: true,
            opacity: 0.88,
          });
          const corkMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
          const labelMat = new THREE.MeshStandardMaterial({
            map: createVintageBottleLabelTexture(),
            roughness: 0.7,
            side: THREE.DoubleSide,
          });

          // Main cylindrical glass body
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.16, 14), glassMat);
          body.position.y = 0.08;
          body.castShadow = true;
          botGroup.add(body);

          // Tapered shoulder dome
          const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.052, 0.05, 14), glassMat);
          shoulder.position.y = 0.185;
          botGroup.add(shoulder);

          // Slender glass neck
          const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 12), glassMat);
          neck.position.y = 0.245;
          botGroup.add(neck);

          // Flared glass pouring lip
          const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.015, 12), glassMat);
          lip.position.y = 0.285;
          botGroup.add(lip);

          // Natural cork stopper
          const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.026, 10), corkMat);
          cork.position.y = 0.298;
          botGroup.add(cork);

          // Vintage paper label wrapped on body
          const label = new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.053, 0.09, 14, 1, true, -Math.PI / 3, Math.PI * 0.7), labelMat);
          label.position.y = 0.08;
          botGroup.add(label);

          botGroup.rotation.z = Math.PI / 2; // resting on its side on the ground/table
          mesh = botGroup;
          break;
        }

        case 'flare': {
          // Realistic Orion Magnesium Emergency Signal Flare
          const flareGroup = new THREE.Group();
          const flareTubeMat = new THREE.MeshStandardMaterial({
            map: createOrionFlareTexture(),
            roughness: 0.45,
            metalness: 0.2,
          });
          const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
          const coreMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });

          // Red chevron tube
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12), flareTubeMat);
          tube.position.y = 0.14;
          tube.castShadow = true;
          flareGroup.add(tube);

          // Black ribbed striker friction cap on top
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12), capMat);
          cap.position.y = 0.29;
          flareGroup.add(cap);

          // Magnesium ignition compound tip at base
          const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 10), coreMat);
          tip.position.y = 0.005;
          flareGroup.add(tip);

          flareGroup.rotation.z = Math.PI / 3;
          mesh = flareGroup;
          break;
        }

        case 'map': {
          // Realistic Folded Topographical Quad Survey Map with Pocket Compass
          const mapGroup = new THREE.Group();
          const mapMat = new THREE.MeshStandardMaterial({
            map: createTopographicMapTexture(),
            roughness: 0.75,
            side: THREE.DoubleSide,
          });
          const compassBrassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 });

          // Two slightly creased paper planes (3D paper quad-fold V-angle)
          const leftHalf = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.38), mapMat);
          leftHalf.position.set(-0.118, 0.006, 0);
          leftHalf.rotation.x = -Math.PI / 2;
          leftHalf.rotation.y = 0.03;
          mapGroup.add(leftHalf);

          const rightHalf = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.38), mapMat);
          rightHalf.position.set(0.118, 0.006, 0);
          rightHalf.rotation.x = -Math.PI / 2;
          rightHalf.rotation.y = -0.03;
          mapGroup.add(rightHalf);

          // Vintage brass pocket compass resting on map corner
          const compassCase = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 16), compassBrassMat);
          compassCase.position.set(0.14, 0.014, 0.12);
          mapGroup.add(compassCase);

          const compassGlass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.028, 0.004, 16),
            new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.6, roughness: 0.1 })
          );
          compassGlass.position.set(0.14, 0.02, 0.12);
          mapGroup.add(compassGlass);

          mesh = mapGroup;
          break;
        }

        case 'locker': {
          // Realistic Weathered Wooden Hunting Blind / Hiding Bunker
          const blindGroup = new THREE.Group();
          const timberMat = new THREE.MeshStandardMaterial({
            map: createCabinWoodTexture(),
            roughness: 0.85,
          });
          const roofMat = new THREE.MeshStandardMaterial({
            map: createCabinShingleTexture(),
            roughness: 0.75,
          });
          const ironMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6, metalness: 0.8 });

          // 4 Corner 4x4 Posts
          for (let px of [-0.75, 0.75]) {
            for (let pz of [-0.75, 0.75]) {
              const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.7, 0.14), timberMat);
              post.position.set(px, 1.35, pz);
              post.castShadow = true;
              blindGroup.add(post);
            }
          }

          // Exterior walls (Back, Left, Right)
          const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.08), timberMat);
          backWall.position.set(0, 1.3, -0.75);
          backWall.castShadow = true;
          blindGroup.add(backWall);

          const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 1.6), timberMat);
          leftWall.position.set(-0.75, 1.3, 0);
          leftWall.castShadow = true;
          blindGroup.add(leftWall);

          const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 1.6), timberMat);
          rightWall.position.set(0.75, 1.3, 0);
          rightWall.castShadow = true;
          blindGroup.add(rightWall);

          // Front Wall with door opening and narrow viewing slot
          const frontLower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.08), timberMat);
          frontLower.position.set(0, 0.55, 0.75);
          frontLower.castShadow = true;
          blindGroup.add(frontLower);

          const frontUpper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 0.08), timberMat);
          frontUpper.position.set(0, 2.05, 0.75);
          frontUpper.castShadow = true;
          blindGroup.add(frontUpper);

          // Horizontal viewing slot window opening (between y: 1.1 and 1.4)
          const windowSill = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 0.22), timberMat);
          windowSill.position.set(0, 1.12, 0.78);
          blindGroup.add(windowSill);

          // Iron door hinges and latch hardware
          for (let hy of [0.6, 1.9]) {
            const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.02), ironMat);
            hinge.position.set(-0.6, hy, 0.8);
            blindGroup.add(hinge);
          }
          const latch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.03), ironMat);
          latch.position.set(0.5, 1.25, 0.81);
          blindGroup.add(latch);

          // Sloped Corrugated Weather Roof
          const roof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 1.85), roofMat);
          roof.position.set(0, 2.75, 0);
          roof.rotation.x = 0.08;
          roof.castShadow = true;
          blindGroup.add(roof);

          mesh = blindGroup;
          break;
        }

        case 'keycard': {
          // Realistic Solid Brass Mortise Key with Cut Bitting & Stamped Leather Fob
          const keyGroup = new THREE.Group();
          const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28, metalness: 0.9 });
          const steelRingMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.95 });
          const fobMat = new THREE.MeshStandardMaterial({
            map: createRangerKeyTexture(),
            roughness: 0.65,
          });

          // Brass Key Blade with grooved warding
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.038, 0.16), brassMat);
          blade.position.set(0, 0.015, 0.08);
          blade.castShadow = true;
          keyGroup.add(blade);

          // 5 Cut Bitting Teeth notches along the bottom of the blade
          const toothPositions = [0.03, 0.06, 0.09, 0.12, 0.14];
          const toothDepths = [0.012, 0.018, 0.008, 0.022, 0.015];
          toothPositions.forEach((tp, i) => {
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.014, toothDepths[i], 0.018), brassMat);
            tooth.position.set(0, -0.008, tp);
            keyGroup.add(tooth);
          });

          // Round bow head with center ring hole
          const bowHead = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 8, 18), brassMat);
          bowHead.position.set(0, 0.015, -0.02);
          bowHead.rotation.y = Math.PI / 2;
          bowHead.castShadow = true;
          keyGroup.add(bowHead);

          // Split steel keyring
          const splitRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 18), steelRingMat);
          splitRing.position.set(0, 0.015, -0.06);
          keyGroup.add(splitRing);

          // Stamped leather keychain fob
          const fob = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.016, 0.24), fobMat);
          fob.position.set(0, 0.012, -0.2);
          fob.castShadow = true;
          keyGroup.add(fob);

          // Gentle ambient brass gleam
          const keyGlow = new THREE.PointLight(0xf59e0b, 0.45, 1.8);
          keyGlow.position.y = 0.08;
          keyGroup.add(keyGlow);

          mesh = keyGroup;
          break;
        }

        case 'note': {
          // Hardwood Officer Clipboard with Steel Spring Clamp & Aged Field Document
          const noteGroup = new THREE.Group();
          const boardMat = new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.8 });
          const clampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.9 });
          const paperMat = new THREE.MeshStandardMaterial({
            map: createFieldNoteTexture(item.loreNote?.title || 'Field Log'),
            roughness: 0.9,
            side: THREE.DoubleSide,
          });

          // Wood clipboard backing
          const board = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.34), boardMat);
          board.position.y = 0.007;
          board.castShadow = true;
          noteGroup.add(board);

          // Stamped steel clamp mechanism
          const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.04), clampMat);
          clamp.position.set(0, 0.022, -0.13);
          noteGroup.add(clamp);

          // Weathered paper document pinned to the board
          const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), paperMat);
          sheet.position.set(0, 0.015, 0.01);
          sheet.rotation.x = -Math.PI / 2;
          noteGroup.add(sheet);

          mesh = noteGroup;
          break;
        }

        case 'radio_tube': {
          // Photorealistic 6L6 Glass Vacuum Tube
          const tubeGroup = new THREE.Group();
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.45,
          });
          const bakeliteMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
          const pinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 });
          const anodeMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.8 });

          // Octal base
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 16), bakeliteMat);
          base.position.y = 0.015;
          tubeGroup.add(base);

          // 8 Brass connection pins
          for (let p = 0; p < 8; p++) {
            const angle = (p / 8) * Math.PI * 2;
            const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.015, 6), pinMat);
            pin.position.set(Math.cos(angle) * 0.016, -0.005, Math.sin(angle) * 0.016);
            tubeGroup.add(pin);
          }

          // Glass vacuum envelope
          const envelope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.08, 16), glassMat);
          envelope.position.y = 0.07;
          tubeGroup.add(envelope);

          const dome = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
          dome.position.y = 0.11;
          tubeGroup.add(dome);

          // Internal metal anode plate & glowing heater filament
          const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 12), anodeMat);
          plate.position.y = 0.07;
          tubeGroup.add(plate);

          const filament = new THREE.Mesh(
            new THREE.CylinderGeometry(0.003, 0.003, 0.03, 6),
            new THREE.MeshBasicMaterial({ color: 0xf97316 })
          );
          filament.position.y = 0.07;
          tubeGroup.add(filament);

          const filamentGlow = new THREE.PointLight(0xf97316, 0.35, 1.4);
          filamentGlow.position.y = 0.07;
          tubeGroup.add(filamentGlow);

          mesh = tubeGroup;
          break;
        }

        case 'fuel_can': {
          // Photorealistic 5-Gallon Heavy Steel Diesel Jerrycan
          const canGroup = new THREE.Group();
          const yellowCanMat = new THREE.MeshStandardMaterial({
            color: 0xca8a04, // Weathered industrial diesel yellow
            roughness: 0.55,
            metalness: 0.35,
          });
          const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.85 });

          // Main Jerrycan stamped container body
          const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.18), yellowCanMat);
          body.position.y = 0.22;
          body.castShadow = true;
          canGroup.add(body);

          // Embossed cross stiffening ribs on sides
          for (let side of [-0.091, 0.091]) {
            const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.01), darkSteelMat);
            rib1.position.set(0, 0.22, side);
            rib1.rotation.z = 0.55;
            canGroup.add(rib1);

            const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.01), darkSteelMat);
            rib2.position.set(0, 0.22, side);
            rib2.rotation.z = -0.55;
            canGroup.add(rib2);
          }

          // Triple-bar carry handle across top
          const handleTop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.025), darkSteelMat);
          handleTop.position.set(0, 0.48, 0);
          canGroup.add(handleTop);

          for (let hx of [-0.09, 0.09]) {
            const handlePost = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.025), darkSteelMat);
            handlePost.position.set(hx, 0.45, 0);
            canGroup.add(handlePost);
          }

          // Angled filler neck & breather cap
          const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.06, 12), darkSteelMat);
          neck.position.set(-0.1, 0.46, 0.04);
          neck.rotation.z = 0.35;
          canGroup.add(neck);

          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 12), darkSteelMat);
          cap.position.set(-0.115, 0.485, 0.04);
          cap.rotation.z = 0.35;
          canGroup.add(cap);

          // "DIESEL" stencil label
          const tag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.18, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 })
          );
          tag.position.set(0, 0.25, 0.092);
          canGroup.add(tag);

          // Subtle fuel warning beacon light
          const fuelLight = new THREE.PointLight(0xeab308, 0.35, 1.8);
          fuelLight.position.set(0, 0.25, 0.15);
          canGroup.add(fuelLight);

          mesh = canGroup;
          break;
        }

        case 'radio': {
          // Photorealistic Military/Forestry Ham Radio Transceiver Station
          const radioGroup = new THREE.Group();
          const caseMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.5,
            metalness: 0.6,
          });
          const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.85 });

          // Chassis Box
          const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.28), caseMat);
          chassis.position.y = 0.12;
          chassis.castShadow = true;
          radioGroup.add(chassis);

          // Front Face Panel
          const frontPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.2), metalMat);
          frontPanel.position.set(0, 0.12, 0.141);
          radioGroup.add(frontPanel);

          // Illuminated Frequency Dial
          const freqMeter = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, 0.07),
            new THREE.MeshBasicMaterial({ color: 0x22c55e })
          );
          freqMeter.position.set(-0.1, 0.15, 0.142);
          radioGroup.add(freqMeter);

          // Tuning Knobs
          for (let k = 0; k < 3; k++) {
            const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12), metalMat);
            knob.position.set(0.05 + k * 0.055, 0.14, 0.145);
            knob.rotation.x = Math.PI / 2;
            radioGroup.add(knob);
          }

          // Top whip antenna
          const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.65, 8), metalMat);
          antenna.position.set(-0.2, 0.55, -0.08);
          radioGroup.add(antenna);

          mesh = radioGroup;
          break;
        }

        case 'truck_hood': {
          const hoodControl = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.18, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xfbbf24,
              emissive: 0x9a5b00,
              emissiveIntensity: 1.8,
              roughness: 0.28,
              metalness: 0.45,
            })
          );
          hoodControl.add(new THREE.PointLight(0xf59e0b, 0.45, 2.2));
          this.hoodControlMesh = hoodControl;
          mesh = hoodControl;
          break;
        }

        default:
          return;
      }

      // Keep original position for proper item placement
      mesh.position.copy(item.position);
      mesh.visible = item.id !== 'item_keycard' || this.isPickupHoodOpen;
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      mesh.userData = { itemId: item.id };
      this.scene.add(mesh);
      this.itemMeshes.set(item.id, mesh);
    });
  }

  private buildFlickeringLights() {
    const lightConfigs = [
      // 1. Smoldering Campfire at Campsite
      { pos: new THREE.Vector3(-25, 0.5, -7), color: 0xf97316, base: 1.4, speed: 6, dist: 14 },
      // 2. Ranger Station Porch Kerosene Lantern
      { pos: new THREE.Vector3(14, 2.8, -18), color: 0xf59e0b, base: 1.3, speed: 4, dist: 14 },
      // 3. Ranger Cabin Interior Yellow Lantern
      { pos: new THREE.Vector3(22, 2.8, -20), color: 0xfde047, base: 1.1, speed: 3, dist: 14 },
      // 4. Logging Shed Work Lamp
      { pos: new THREE.Vector3(-28, 2.8, 25), color: 0xfbbf24, base: 1.2, speed: 7, dist: 14 },
      // 5. Generator Status Beacon
      { pos: new THREE.Vector3(26, 2.2, 22), color: 0x10b981, base: 1.0, speed: 5, dist: 10 },
      // 6. Forestry Highway Gate Hazard Flasher
      { pos: new THREE.Vector3(0, 3.8, 48.5), color: 0xef4444, base: 1.2, speed: 8, dist: 16 },
    ];

    lightConfigs.forEach((cfg) => {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: cfg.color })
      );
      bulb.position.copy(cfg.pos);
      this.scene.add(bulb);

      const light = new THREE.PointLight(cfg.color, cfg.base, cfg.dist, 1.6);
      light.position.copy(cfg.pos);
      light.castShadow = true;
      this.scene.add(light);

      this.flickeringLights.push({
        light,
        base: cfg.base,
        timer: Math.random() * 10,
        speed: cfg.speed,
      });
    });
  }

  // Raycast interaction prompt checker
  private updateInteractablePrompt() {
    if (this.isPlayerHiding) {
      const prompt = '[E] Exit Hunting Blind';
      if (this.activePrompt !== prompt) {
        this.activePrompt = prompt;
        this.onPromptChange?.(prompt);
      }
      return;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = 3.2;

    const candidateMeshes: THREE.Object3D[] = [];
    this.itemMeshes.forEach((mesh) => candidateMeshes.push(mesh));
    if (this.fuseBoxMesh) candidateMeshes.push(this.fuseBoxMesh);
    if (this.substationDoorMesh) candidateMeshes.push(this.substationDoorMesh);
    if (this.exitDoorMesh) candidateMeshes.push(this.exitDoorMesh);

    const intersects = raycaster.intersectObjects(candidateMeshes, true);
    if (intersects.length > 0) {
      let rootObj: THREE.Object3D | null = intersects[0].object;
      while (rootObj && !rootObj.userData.itemId && rootObj.parent) {
        rootObj = rootObj.parent;
      }
      const itemId = rootObj?.userData.itemId;
      if (itemId) {
        const item = this.items.find((it) => it.id === itemId);
        if (item && !item.collected && (item.id !== 'item_keycard' || this.isPickupHoodOpen)) {
          if (item.type === 'fusebox') {
            const prompt = this.isPowerRestored
              ? 'Diesel Generator [Running - Power Restored]'
              : this.inventory.fuses >= 3 && this.inventory.hasFuelCan
              ? `[E] Pull Recoil Cord (${this.survivalVitals.recoilPulls}/3) to Crank Diesel Engine`
              : this.inventory.fuses >= 3
              ? '[E] Generator (Missing 5-Gal Diesel Canister from Logging Camp)'
              : this.inventory.hasFuelCan
              ? `[E] Generator (${this.inventory.fuses}/3 Spark Plugs Installed - Fuel Ready)`
              : `[E] Generator (${this.inventory.fuses}/3 Spark Plugs - Missing Diesel Fuel Can)`;
            if (this.activePrompt !== prompt) {
              this.activePrompt = prompt;
              this.onPromptChange?.(prompt);
            }
            return;
          }
          if (item.type === 'radio') {
            const prompt = this.inventory.isRadioRepaired
              ? '[E] Listen to Emergency Radio Broadcast'
              : this.inventory.hasRadioTube
              ? '[E] Insert 6L6 Tube into Ham Radio Transceiver'
              : 'Ham Radio Transceiver (Needs 6L6 Vacuum Tube from Drawer)';
            if (this.activePrompt !== prompt) {
              this.activePrompt = prompt;
              this.onPromptChange?.(prompt);
            }
            return;
          }
          if (item.type === 'substation_door') {
            const prompt = this.isSubstationUnlocked
              ? null
              : this.inventory.hasKeycard
              ? '[E] Unlock Ranger Cabin with Key'
              : 'Ranger Station Locked (Requires Key from Pickup Truck)';
            if (this.activePrompt !== prompt) {
              this.activePrompt = prompt;
              this.onPromptChange?.(prompt);
            }
            return;
          }
          if (item.type === 'exit_door') {
            const prompt = this.isPowerRestored
              ? '[E] Escape Through Forestry Gate!'
              : 'Highway Gate Locked (Electrified - Start Diesel Generator)';
            if (this.activePrompt !== prompt) {
              this.activePrompt = prompt;
              this.onPromptChange?.(prompt);
            }
            return;
          }

          if (this.activePrompt !== item.label) {
            this.activePrompt = item.label;
            this.onPromptChange?.(item.label);
          }
          return;
        }
      }
    }

    if (this.activePrompt !== null) {
      this.activePrompt = null;
      this.onPromptChange?.(null);
    }
  }

  // Main Loop
  public start() {
    this.isRunning = true;
    this.clock.start();
    horrorAudio.init();
    this.loop();
  }

  public pause() {
    this.isRunning = false;
    this.clearInputState();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private update(delta: number) {
    this.promptCheckTimer -= delta;
    this.staminaNotifyTimer -= delta;
    this.flashlightNotifyTimer -= delta;
    this.sensorNotifyTimer -= delta;
    this.vitalsNotifyTimer -= delta;

    if (this.hoodControlMesh && !this.isPickupHoodOpen) {
      const markerMaterial = this.hoodControlMesh.material as THREE.MeshStandardMaterial;
      markerMaterial.emissiveIntensity = 1.45 + Math.sin(this.clock.elapsedTime * 4.5) * 0.45;
    }

    // If player is currently being killed by the creature
    if (this.isDying) {
      this.deathTimer += delta;

      // Lock position and camera snaps directly into the monster's face
      const monsterHead = this.creature.position.clone().add(new THREE.Vector3(0, 2.7, 0));
      this.camera.lookAt(monsterHead);

      // Camera tremor / violent jitter
      this.camera.position.x = this.playerPosition.x + (Math.random() - 0.5) * 0.16;
      this.camera.position.y = this.playerPosition.y + (Math.random() - 0.5) * 0.16;
      this.camera.position.z = this.playerPosition.z + (Math.random() - 0.5) * 0.16;

      // Flashlight flickers out violently
      this.flashlight.intensity = Math.random() < 0.25 ? 0.3 : 0.0;

      if (this.deathTimer >= 1.25) {
        this.pause();
        try {
          if (document.exitPointerLock) {
            document.exitPointerLock();
          }
        } catch {}
        horrorAudio.stopDieselEngine();
        this.onGameOver?.();
      }
      return;
    }

    // 1. Stamina & Player Movement
    const speedMultiplier = this.isSprinting && this.stamina > 10 ? 1.85 : this.isCrouching ? 0.45 : 1.0;
    const baseSpeed = 4.2 * speedMultiplier;

    if (this.isSprinting && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
      this.stamina = Math.max(0, this.stamina - delta * 24);
      if (this.staminaNotifyTimer <= 0) {
        this.onStaminaChange?.(this.stamina);
        this.staminaNotifyTimer = 0.1;
      }
      if (this.stamina <= 0 && this.exhaustTimer <= 0) {
        this.exhaustTimer = 4.0;
        horrorAudio.playPlayerExhaustedGasp();
      }
    } else {
      this.stamina = Math.min(100, this.stamina + delta * 15);
      if (this.staminaNotifyTimer <= 0) {
        this.onStaminaChange?.(this.stamina);
        this.staminaNotifyTimer = 0.1;
      }
    }

    // Jump cooldown update
    if (this.jumpCooldownTimer > 0) {
      this.jumpCooldownTimer -= delta;
    }
    if (this.branchSnapCooldown > 0) {
      this.branchSnapCooldown -= delta;
    }

    // Vertical / Jumping physics & ground collision (snappy, weighted Earth gravity)
    if (!this.isGrounded) {
      this.verticalVelocity -= 22.0 * delta; // Grounded 22m/s^2 gravity avoids floaty moon physics
      this.jumpHeightOffset += this.verticalVelocity * delta;
      if (this.jumpHeightOffset <= 0) {
        this.jumpHeightOffset = 0;
        const impactSpeed = Math.abs(this.verticalVelocity);
        this.verticalVelocity = 0;
        this.isGrounded = true;

        // Realistic knee absorption camera dip on landing
        this.landingCameraDip = Math.min(0.08, impactSpeed * 0.022);

        if (impactSpeed > 1.4) {
          const landingSurface =
            this.playerPosition.x >= 12 && this.playerPosition.x <= 34 && this.playerPosition.z >= -34 && this.playerPosition.z <= -8
              ? 'wood'
              : Math.abs(this.playerPosition.x) < 2.8
              ? 'gravel'
              : 'dirt';
          horrorAudio.playLandGroan(impactSpeed, landingSurface);
          // Heavy impact sound alerts the monster if nearby
          if (this.creature && this.creature.state !== 'CHASE') {
            const dist = this.playerPosition.distanceTo(this.creature.position);
            if (dist < 16) {
              this.creature.state = 'INVESTIGATE';
            }
          }
        }
      }
    }

    // Smoothly restore landing camera dip back to neutral eye-level
    if (this.landingCameraDip > 0) {
      this.landingCameraDip = THREE.MathUtils.lerp(this.landingCameraDip, 0, delta * 12);
    }

    // Camera height (crouch vs standing vs hiding) + jump height offset - landing impact dip
    const baseTargetHeight = this.isPlayerHiding ? 1.4 : this.isCrouching ? 1.05 : 1.65;
    this.playerPosition.y = THREE.MathUtils.lerp(this.playerPosition.y, baseTargetHeight, delta * 10) + this.jumpHeightOffset - this.landingCameraDip;

    // Calculate forward & right movement vectors
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const wishDir = new THREE.Vector3();
    if (!this.isPlayerHiding) {
      if (this.moveForward) wishDir.add(forward);
      if (this.moveBackward) wishDir.sub(forward);
      if (this.moveRight) wishDir.add(right);
      if (this.moveLeft) wishDir.sub(right);
    }

    const isMoving = wishDir.lengthSq() > 0.001;
    if (isMoving) {
      wishDir.normalize();
      const acceleration = this.isSprinting ? 14 : this.isCrouching ? 8 : 11;
      const targetVelocityX = wishDir.x * baseSpeed;
      const targetVelocityZ = wishDir.z * baseSpeed;
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, targetVelocityX, acceleration, delta);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, targetVelocityZ, acceleration, delta);

      // Footstep audio (plays only when grounded on terrain)
      if (this.isGrounded) {
        this.footstepTimer += delta;
        const stepInterval = this.isSprinting ? 0.32 : this.isCrouching ? 0.75 : 0.52;
        if (this.footstepTimer > stepInterval) {
          this.footstepTimer = 0;

          // Surface detection for realistic material acoustics
          const px = this.playerPosition.x;
          const pz = this.playerPosition.z;
          const isWood =
            (px >= 12 && px <= 34 && pz >= -34 && pz <= -8) || // Ranger Cabin & Porch
            (px >= -35 && px <= -18 && pz >= 12 && pz <= 30) || // Logging Shack
            (px >= 19 && px <= 33 && pz >= 10 && pz <= 26); // Generator Shed

          const isTrail =
            Math.abs(px) < 2.8 ||
            (px >= 18 && px <= 30 && pz >= -16 && pz <= 22) ||
            (px >= -32 && px <= -22 && pz >= -3 && pz <= 24);

          const surface = isWood ? 'wood' : isTrail ? 'gravel' : 'dirt';
          horrorAudio.playFootstep(this.isSprinting, this.isCrouching, surface);
          if (!this.isCrouching && Math.random() < (this.isSprinting ? 0.42 : 0.1)) {
            horrorAudio.playPlayerEffort(this.isSprinting);
          }
        }
      }

      // Head bobbing
      if (this.settings.headBobbing) {
        this.headBobTimer += delta * (this.isSprinting ? 14 : 9);
      }
    } else {
      const friction = this.isGrounded ? 12 : 3.5;
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, friction, delta);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, friction, delta);
      this.footstepTimer = 0;
    }

    // Apply movement with multi-substep collision resolution (if not hiding)
    if (!this.isPlayerHiding) {
      const subSteps = Math.max(1, Math.min(4, Math.ceil(delta / 0.016)));
      const subDelta = delta / subSteps;
      for (let s = 0; s < subSteps; s++) {
          this.playerPosition.x += this.playerVelocity.x * subDelta;
          this.playerPosition.z += this.playerVelocity.z * subDelta;
        this.resolveEntityCollision(this.playerPosition, 0.42, this.isPlayerHiding);
      }

        this.checkForBranchSnap(isMoving);
        this.checkForEscape();
    }

    // Corner Peeking / Leaning calculation
    const targetLean = this.activeLean === 'left' ? -0.45 : this.activeLean === 'right' ? 0.45 : 0;
    const targetLeanRoll = this.activeLean === 'left' ? 0.08 : this.activeLean === 'right' ? -0.08 : 0;
    this.leanOffset = THREE.MathUtils.lerp(this.leanOffset, targetLean, delta * 12);
    this.leanRoll = THREE.MathUtils.lerp(this.leanRoll, targetLeanRoll, delta * 12);

    // Apply Camera Transform with wall clearance check (prevents camera clipping through walls)
    const leanVector = right.clone().multiplyScalar(this.leanOffset);
    const targetCamX = this.playerPosition.x + leanVector.x;
    const targetCamZ = this.playerPosition.z + leanVector.z;
    const testCamPos = new THREE.Vector3(targetCamX, 0, targetCamZ);
    this.resolveEntityCollision(testCamPos, 0.22, this.isPlayerHiding);
    this.camera.position.x = testCamPos.x;
    this.camera.position.z = testCamPos.z;

    const bobAmount = this.isSprinting ? 0.075 : this.isCrouching ? 0.018 : 0.042;
    const bobOffsetY = isMoving && this.settings.headBobbing ? Math.sin(this.headBobTimer) * bobAmount : 0;
    const bobRollZ = isMoving && this.settings.headBobbing ? Math.cos(this.headBobTimer * 0.5) * bobAmount * 0.28 : 0;
    const breathingSway = this.isHoldingBreath ? 0 : Math.sin(this.clock.getElapsedTime() * 1.8) * 0.006;
    this.camera.position.y = this.playerPosition.y + bobOffsetY + breathingSway;
    const targetFov = this.isSprinting ? 77 : this.isCrouching ? 68 : 72;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, delta);
    this.camera.updateProjectionMatrix();

    // Apply Euler rotation: Yaw (Y) then Pitch (X) + lean roll
    const euler = new THREE.Euler(this.pitch, this.yaw, bobRollZ + this.leanRoll, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 2. Flashlight Position & Natural Handheld Inertia (held in hand, lag behind head turns)
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const handOffset = rightDir.clone().multiplyScalar(0.18).add(upDir.clone().multiplyScalar(-0.16));
    const targetFlashlightPos = this.camera.position.clone().add(handOffset);
    this.flashlight.position.lerp(targetFlashlightPos, delta * 20);
    if (this.flashlightSpill) {
      this.flashlightSpill.position.copy(this.flashlight.position);
    }
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const targetPos = this.camera.position.clone().add(forwardDir.multiplyScalar(30));
    this.flashlightTarget.position.lerp(targetPos, delta * 12);

    // Dynamic Scotopic Vision (Pupil Dilation & Night Adaptation)
    if (!this.flashlightState.enabled) {
      this.pupilDilation = Math.min(1.0, this.pupilDilation + delta * 0.45);
    } else {
      this.pupilDilation = Math.max(0.0, this.pupilDilation - delta * 2.8);
    }
    this.survivalVitals.isPupilDilated = this.pupilDilation > 0.6;
    if (this.ambientLight) {
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.06, 0.22, this.pupilDilation);
    }

    // Realistic Battery Drainage, Voltage Sag, and Loose Battery Spring Contact
    if (this.flickerSuppressTimer > 0) {
      this.flickerSuppressTimer -= delta;
      this.flashlightState.isFlickering = false;
      this.onFlashlightTappable?.(false);
    }

    if (this.flashlightState.enabled) {
      this.flashlightState.battery = Math.max(0, this.flashlightState.battery - delta * 0.55);

      // Realistic tungsten filament color shift & voltage drop when battery < 25%
      if (!this.flashlightState.isUVMode) {
        if (this.flashlightState.battery < 25) {
          const sagRatio = this.flashlightState.battery / 25;
          this.flashlight.color.setHex(sagRatio < 0.4 ? 0xd97706 : 0xf59e0b);
          this.flashlight.distance = 42 + sagRatio * 88;
        } else {
          this.flashlight.color.setHex(0xfff7ed);
          this.flashlight.distance = 145;
        }
      }

      // Contact flickering when battery < 25% or near monster EMF, unless recently tapped
      const isEMFNear = this.creature && this.creature.state !== 'DORMANT' && this.playerPosition.distanceTo(this.creature.position) < 14;
      if (this.flickerSuppressTimer <= 0 && (this.flashlightState.battery < 25 || isEMFNear)) {
        if (Math.random() < 0.12) {
          this.flashlight.intensity = Math.random() * 1.2;
          this.flashlightState.isFlickering = true;
          this.onFlashlightTappable?.(true);
          horrorAudio.playFlashlightFlicker();
        } else {
          this.flashlight.intensity = this.flashlightState.isUVMode ? 5.5 : 10.5;
          this.flashlightState.isFlickering = false;
        }
      } else if (this.flickerSuppressTimer > 0) {
        this.flashlight.intensity = this.flashlightState.isUVMode ? 5.5 : 10.5;
        this.flashlightState.isFlickering = false;
        this.onFlashlightTappable?.(false);
      } else {
        this.flashlight.intensity = this.flashlightState.isUVMode ? 5.5 : 10.5;
        this.flashlightState.isFlickering = false;
        this.onFlashlightTappable?.(false);
      }

      if (this.flashlightState.battery <= 0) {
        this.flashlightState.enabled = false;
        this.flashlight.visible = false;
        if (this.flashlightSpill) this.flashlightSpill.visible = false;
        horrorAudio.playFlashlightClick(false);
      }
      if (this.flashlightNotifyTimer <= 0) {
        this.onFlashlightChange?.({ ...this.flashlightState });
        this.flashlightNotifyTimer = 0.1;
      }
    } else {
      this.onFlashlightTappable?.(false);
    }

    // Realistic Sub-Zero Mountain Hypothermia & Shivering
    const px = this.playerPosition.x;
    const pz = this.playerPosition.z;
    const isNearFireplace = Math.hypot(px - 23.5, pz - 24.5) < 4.0;
    const isInsideCabinOrShack =
      (px >= 14 && px <= 32 && pz >= -32 && pz <= -10) ||
      (px >= -33 && px <= -20 && pz >= 14 && pz <= 28) ||
      this.isPlayerHiding;

    if (isNearFireplace) {
      this.survivalVitals.bodyTemp = Math.min(100, this.survivalVitals.bodyTemp + delta * 3.5);
    } else if (isInsideCabinOrShack) {
      this.survivalVitals.bodyTemp = Math.min(100, this.survivalVitals.bodyTemp + delta * 0.8);
    } else {
      const coolingRate = this.isSprinting ? 0.15 : this.isCrouching ? 0.35 : 0.48;
      this.survivalVitals.bodyTemp = Math.max(15, this.survivalVitals.bodyTemp - delta * coolingRate);
    }

    this.survivalVitals.isShivering = this.survivalVitals.bodyTemp < 42;
    if (this.survivalVitals.isShivering) {
      this.shiveringTeethTimer += delta;
      if (this.shiveringTeethTimer > 6.5) {
        this.shiveringTeethTimer = 0;
        horrorAudio.playShiveringTeethChatter();
      }
      if (!this.isPlayerHiding && !this.isDying) {
        this.camera.position.x += (Math.random() - 0.5) * 0.007;
        this.camera.position.y += (Math.random() - 0.5) * 0.007;
      }
    }
    if (this.vitalsNotifyTimer <= 0) {
      this.onVitalsChange?.({ ...this.survivalVitals });
      this.vitalsNotifyTimer = 0.15;
    }

    // 3. Flickering Ceiling Lights
    this.flickeringLights.forEach((f) => {
      f.timer += delta * f.speed;
      const noise = Math.sin(f.timer) + Math.sin(f.timer * 2.3) * 0.5;
      if (noise < -0.8) {
        f.light.intensity = 0.05;
      } else {
        f.light.intensity = f.base + Math.random() * 0.2;
      }
    });

    // 4. Update Active Flare & Chemical Combustion Particles
    if (this.activeFlare) {
      this.activeFlare.timer -= delta;
      this.activeFlare.light.intensity = 3.2 + Math.sin(this.activeFlare.timer * 28) * 0.85;

      // Spawn burning magnesium spark particles
      if (Math.random() < 0.75) {
        this.spawnFlareSpark(this.activeFlare.position);
      }
      // Spawn thick drifting red chemical smoke billows
      if (Math.random() < 0.35) {
        this.spawnFlareSmoke(this.activeFlare.position);
      }

      if (this.activeFlare.timer <= 0) {
        this.scene.remove(this.activeFlare.mesh);
        this.activeFlare = null;
      }
    }
    this.updateFlareParticles(delta);

    // 5. Monster Awakening progression ("make him appear later")
    if (!this.isMonsterAwakened) {
      this.monsterAwakenTimer += delta;

      // Awaken conditions:
      // 1. 45 seconds of exploration grace period, OR
      // 2. Player found their first generator spark plug, OR
      // 3. Player ventured south past central crossroads (Z > 2.0)
      const shouldAwaken =
        this.monsterAwakenTimer > 45 ||
        this.inventory.fuses > 0 ||
        this.playerPosition.z > 2.0;

      if (shouldAwaken) {
        this.isMonsterAwakened = true;
        this.creature.awaken(new THREE.Vector3(18, 0, 10)); // Deep in East Woods by Generator Shed
        const msg = "A blood-curdling roar echoes through the pines. SOMETHING HAS AWAKENED.";
        this.bannerMessage = msg;
        this.onBannerMessage?.(msg);
        setTimeout(() => {
          if (this.bannerMessage === msg) {
            this.bannerMessage = null;
            this.onBannerMessage?.(null);
          }
        }, 7000);
      }
    }

    // Update Creature AI Entity with Olfactory Scent Vector Tracking
    const creatureResult = this.creature.update(
      delta,
      this.playerPosition,
      this.isSprinting,
      this.isCrouching,
      this.flashlightState.enabled,
      this.camera.position,
      this.walls,
      this.isPlayerHiding,
      this.activeFlare ? this.activeFlare.position : null,
      forwardDir,
      this.isHoldingBreath,
      this.windVector
    );

    // Adrenaline-Induced Auditory Exclusion (Tunnel Hearing)
    const panicDist = Math.hypot(this.playerPosition.x - this.creature.position.x, this.playerPosition.z - this.creature.position.z);
    const adrenalineRatio = this.creature.state === 'CHASE' ? 1.0 : Math.max(0, Math.min(1, (18 - panicDist) / 14));
    horrorAudio.setAdrenalineMuffle(adrenalineRatio);

    // Drift ground fog planes slowly with the mountain wind
    for (let i = 0; i < this.fogPlanes.length; i++) {
      const p = this.fogPlanes[i];
      p.position.x += delta * 0.45;
      p.position.z += delta * 0.25;
      if (p.position.x > 75) p.position.x = -75;
      if (p.position.z > 75) p.position.z = -75;
    }

    // Dynamic mountain storm lightning & distant thunder
    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 36 + Math.random() * 28;
      this.lightningFlashesRemaining = Math.random() < 0.5 ? 2 : 3;
      this.flashSubTimer = 0.08;
      setTimeout(() => {
        horrorAudio.playDistantThunder(0.85);
      }, 1500 + Math.random() * 800);
    }

    if (this.lightningFlashesRemaining > 0) {
      this.flashSubTimer -= delta;
      if (this.flashSubTimer <= 0) {
        this.lightningFlashesRemaining--;
        this.flashSubTimer = this.lightningFlashesRemaining % 2 === 0 ? 0.09 : 0.06;
        const isFlashOn = this.lightningFlashesRemaining % 2 === 1;
        if (isFlashOn) {
          this.moonLight.intensity = 3.8;
          this.scene.background = new THREE.Color(0x16243b);
        } else {
          this.moonLight.intensity = 0.5;
          this.scene.background = new THREE.Color(0x04070e);
        }
      }
    }

    // Dynamic wind gusts and tree wood tension creaking
    this.windGustTimer -= delta;
    if (this.windGustTimer <= 0) {
      this.windGustTimer = 20 + Math.random() * 22;
      horrorAudio.playWindGust();
    }

    // Realistic mountain wind swaying trees
    const time = this.clock.getElapsedTime();
    const gustMultiplier = this.windGustTimer < 4.0 ? 2.2 : 1.0;
    for (let i = 0; i < this.swayingTrees.length; i++) {
      const tree = this.swayingTrees[i];
      const swayZ = Math.sin(time * tree.freq + tree.phase) * (tree.amp * gustMultiplier) +
                    Math.sin(time * 0.38 + tree.phase * 0.5) * (tree.amp * 0.45 * gustMultiplier);
      const swayX = Math.cos(time * (tree.freq * 0.72) + tree.phase) * (tree.amp * 0.55 * gustMultiplier);
      tree.group.rotation.z = tree.initialRotZ + swayZ;
      tree.group.rotation.x = tree.initialRotX + swayX;
    }

    this.treeCreakTimer -= delta;
    if (this.treeCreakTimer <= 0) {
      this.treeCreakTimer = 26 + Math.random() * 24;
      horrorAudio.playWoodTreeCreak();
    }

    // Nocturnal Mountain Screech Owl
    this.owlTimer -= delta;
    if (this.owlTimer <= 0) {
      this.owlTimer = 34 + Math.random() * 28;
      if (creatureResult.distanceToPlayer > 18) {
        horrorAudio.playNocturnalOwl();
      }
    }

    // Realistic Cold Mountain Air Breathing & Volumetric Vapor Plumes
    if (!this.isDying) {
      if (this.isHoldingBreath) {
        this.breathHoldTime = Math.max(0, this.breathHoldTime - delta);
        this.onBreathHoldChange?.(true, this.breathHoldTime / this.maxBreathHoldTime);

        if (this.breathHoldTime <= 0) {
          // Forced violent recovery gasp when oxygen depletes
          this.isHoldingBreath = false;
          this.stamina = Math.max(8, this.stamina - 18);
          horrorAudio.playGaspRecovery();
          this.triggerExhaleBurst(true, 7);
          this.breathTimer = 1.3;
          this.onBreathHoldChange?.(false, 0);
        }
      } else {
        this.breathHoldTime = Math.min(this.maxBreathHoldTime, this.breathHoldTime + delta * 1.5);
        this.onBreathHoldChange?.(false, this.breathHoldTime / this.maxBreathHoldTime);

        this.breathTimer -= delta;
        const isPanic = creatureResult.distanceToPlayer < 14;
        const isExhausted = this.stamina < 35;
        const isHeavyBreathing = (this.isSprinting && isMoving) || isExhausted || isPanic;

        if (this.breathTimer <= 0) {
          this.breathTimer = isHeavyBreathing
            ? (isPanic ? 1.25 + Math.random() * 0.35 : 1.55 + Math.random() * 0.4)
            : this.isCrouching
            ? 4.6 + Math.random() * 1.2
            : 3.4 + Math.random() * 0.8;

          horrorAudio.playColdExhale(isHeavyBreathing);
          this.triggerExhaleBurst(isHeavyBreathing, isHeavyBreathing ? 6 : 4);
        }
      }
    }

    this.updateExhalePlumes(delta);
    this.updateAtmosphericDustMotes(delta);
    this.updateRain(delta);

    if (this.exhaustTimer > 0) {
      this.exhaustTimer -= delta;
    }

    // Dynamic EMF radio static & physiological cardiovascular heartbeat
    horrorAudio.updateRadioStatic(creatureResult.distanceToPlayer);
    horrorAudio.updateFearLevel(creatureResult.distanceToPlayer < 12 ? 1 : 0, creatureResult.distanceToPlayer);
    this.updateHorrorDirector(delta, creatureResult.distanceToPlayer);
    if (this.sensorNotifyTimer <= 0) {
      this.onFearChange?.(creatureResult.distanceToPlayer < 12 ? 1 : 0, creatureResult.distanceToPlayer);
      this.onHearingChange?.(creatureResult.hearingLevel);
      this.onHearingColorChange?.(creatureResult.hearingColor);
      this.sensorNotifyTimer = 0.1;
    }

    // Jumpscare / Catch Game Over check (player in locker is protected!)
    if (creatureResult.jumpscareTriggered && !this.isPlayerHiding && !this.isDying) {
      this.isDying = true;
      this.deathTimer = 0;
      horrorAudio.playJumpScare();
      horrorAudio.playMonsterRoar(0);
      try {
        if (document.exitPointerLock) {
          document.exitPointerLock();
        }
      } catch {}
      this.onDeathStart?.();
      return;
    }

    // 6. Update Interactive Prompt
    if (this.promptCheckTimer <= 0) {
      this.updateInteractablePrompt();
      this.promptCheckTimer = 0.12;
    }
  }

  // Queue a realistic undulating exhalation plume sequence of multiple billow puffs
  private triggerExhaleBurst(heavy: boolean, count: number) {
    if (this.isHoldingBreath || this.isDying) return;
    for (let i = 0; i < count; i++) {
      this.exhalePlumeQueue.push({
        delay: i * (heavy ? 0.045 : 0.065),
        heavy,
      });
    }
  }

  // Spawns a physical mist particle at the player's mouth/nose
  private spawnBreathPuff(heavy: boolean) {
    if (!this.breathGeometry || !this.breathTexture) return;

    const mat = new THREE.MeshBasicMaterial({
      map: this.breathTexture,
      color: 0x94b4cf,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const puffMesh = new THREE.Mesh(this.breathGeometry, mat);

    const fwd = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    right.crossVectors(fwd, up).normalize();

    // Spawn point: slightly forward and down from eye level
    const spawnPos = this.camera.position
      .clone()
      .addScaledVector(fwd, 0.28)
      .addScaledVector(up, -0.15)
      .addScaledVector(right, (Math.random() - 0.5) * 0.04);

    puffMesh.position.copy(spawnPos);
    puffMesh.quaternion.copy(this.camera.quaternion);
    this.scene.add(puffMesh);

    // Initial velocity: forward exhaled momentum + thermal buoyancy + player movement momentum
    const fwdSpeed = heavy ? 0.38 + Math.random() * 0.12 : 0.22 + Math.random() * 0.08;
    const vel = fwd
      .clone()
      .multiplyScalar(fwdSpeed)
      .addScaledVector(up, 0.08 + Math.random() * 0.05)
      .addScaledVector(right, (Math.random() - 0.5) * 0.06)
      .add(this.playerVelocity.clone().multiplyScalar(0.35));

    this.breathPuffs.push({
      mesh: puffMesh,
      velocity: vel,
      life: 0,
      maxLife: heavy ? 1.45 + Math.random() * 0.3 : 1.15 + Math.random() * 0.25,
      initialScale: heavy ? 0.15 : 0.1,
      targetScale: heavy ? 0.72 + Math.random() * 0.2 : 0.46 + Math.random() * 0.14,
      rotationZ: Math.random() * Math.PI * 2,
      spinRate: (Math.random() - 0.5) * 1.5,
      baseOpacity: heavy ? 0.38 : 0.24,
      isHeavy: heavy,
    });
  }

  // Update active breath vapor clouds with physical simulation & flashlight forward scattering
  private updateExhalePlumes(delta: number) {
    // 1. Process queued plume puffs
    for (let i = this.exhalePlumeQueue.length - 1; i >= 0; i--) {
      const q = this.exhalePlumeQueue[i];
      q.delay -= delta;
      if (q.delay <= 0) {
        this.spawnBreathPuff(q.heavy);
        this.exhalePlumeQueue.splice(i, 1);
      }
    }

    // 2. Update active breath vapor puffs in world space
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const camPos = this.camera.position;

    const lightOn = this.flashlightState.enabled;
    const isUV = this.flashlightState.isUVMode;
    const isLowBatt = this.flashlightState.battery < 25;

    for (let i = this.breathPuffs.length - 1; i >= 0; i--) {
      const puff = this.breathPuffs[i];
      puff.life += delta;

      if (puff.life >= puff.maxLife) {
        this.scene.remove(puff.mesh);
        (puff.mesh.material as THREE.Material).dispose();
        this.breathPuffs.splice(i, 1);
        continue;
      }

      const progress = puff.life / puff.maxLife;

      // Realistic physical forces: air drag & thermal buoyancy
      puff.velocity.x *= 0.982;
      puff.velocity.z *= 0.982;
      // Warm moist breath rises smoothly in freezing mountain air
      puff.velocity.y += 0.08 * delta;

      // Dynamic wind displacement
      if (this.windGustTimer < 3.0) {
        puff.velocity.x += 0.1 * delta;
        puff.velocity.z -= 0.08 * delta;
      }

      puff.mesh.position.addScaledVector(puff.velocity, delta);

      // Expansion curve (non-linear billow dispersion)
      const currentScale = THREE.MathUtils.lerp(
        puff.initialScale,
        puff.targetScale,
        Math.pow(progress, 0.62)
      );
      puff.mesh.scale.set(currentScale, currentScale, currentScale);

      // Billow rotation swirl
      puff.rotationZ += puff.spinRate * delta;
      puff.mesh.quaternion.copy(this.camera.quaternion);
      puff.mesh.rotateZ(puff.rotationZ);

      // Organic condensation opacity envelope:
      // 0.0 -> 0.18: fast condensation into visible cloud droplets
      // 0.18 -> 0.45: dense, billowed vapor cloud
      // 0.45 -> 1.0: soft diffusion into the night air
      let alphaFactor = 0;
      if (progress < 0.18) {
        alphaFactor = progress / 0.18;
      } else if (progress < 0.45) {
        alphaFactor = 1.0;
      } else {
        const fadeP = (progress - 0.45) / 0.55;
        alphaFactor = Math.cos(fadeP * (Math.PI / 2));
      }

      // Check flashlight illumination & Mie forward scattering
      const toPuff = puff.mesh.position.clone().sub(camPos);
      const dist = toPuff.length();
      toPuff.normalize();
      const dot = fwd.dot(toPuff);

      const mat = puff.mesh.material as THREE.MeshBasicMaterial;

      if (lightOn && dot > 0.78 && dist < 5.0) {
        // Vapor droplets catching the flashlight beam (Tyndall forward scattering)
        const beamIntensity = Math.min(1.0, (dot - 0.78) / 0.18);
        if (isUV) {
          mat.color.setHex(0xbba2fe); // Fluorescent blacklight violet scatter
        } else if (isLowBatt) {
          mat.color.setHex(0xf5a524); // Warm amber incandescent sag
        } else {
          mat.color.setHex(0xfffaed); // Crisp bright flashlight beam illumination
        }
        // Glare multiplier when looking right into the breath
        mat.opacity = alphaFactor * puff.baseOpacity * (1.0 + beamIntensity * 0.95);
      } else {
        // Cold ambient moonlight & night mist
        mat.color.setHex(0x94b4cf);
        mat.opacity = alphaFactor * puff.baseOpacity;
      }
    }
  }

  // Update volumetric atmospheric dust motes dancing in the flashlight beam
  private updateAtmosphericDustMotes(delta: number) {
    if (!this.dustMotes || !this.dustMotePositions || !this.dustMoteVelocities) return;
    const pos = this.dustMotePositions;
    const vel = this.dustMoteVelocities;
    const count = pos.length / 3;
    const camPos = this.camera.position;

    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const lightOn = this.flashlightState.enabled;

    const geo = this.dustMotes.geometry;
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    const colors = colorAttr ? (colorAttr.array as Float32Array) : null;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx] += vel[idx] * delta;
      pos[idx + 1] += vel[idx + 1] * delta;
      pos[idx + 2] += vel[idx + 2] * delta;

      // Wrap particles around player within a 20m bounding box
      const dx = pos[idx] - camPos.x;
      const dy = pos[idx + 1] - camPos.y;
      const dz = pos[idx + 2] - camPos.z;

      if (dx > 11) pos[idx] = camPos.x - 11;
      else if (dx < -11) pos[idx] = camPos.x + 11;

      if (dy > 4.5) pos[idx + 1] = camPos.y - 1.2;
      else if (dy < -2) pos[idx + 1] = camPos.y + 3.8;

      if (dz > 11) pos[idx + 2] = camPos.z - 11;
      else if (dz < -11) pos[idx + 2] = camPos.z + 11;

      // Volumetric lighting: Motes in flashlight beam illuminate and glitter
      if (colors) {
        if (lightOn) {
          const toMote = new THREE.Vector3(dx, dy, dz).normalize();
          const dot = fwd.dot(toMote);
          if (dot > 0.84) {
            colors[idx] = 1.0;
            colors[idx + 1] = 0.98;
            colors[idx + 2] = 0.92;
          } else {
            colors[idx] = 0.18;
            colors[idx + 1] = 0.22;
            colors[idx + 2] = 0.28;
          }
        } else {
          colors[idx] = 0.12;
          colors[idx + 1] = 0.15;
          colors[idx + 2] = 0.2;
        }
      }
    }

    geo.attributes.position.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
  }

  private updateRain(delta: number): void {
    if (!this.rainPoints || !this.rainPositions || !this.rainVelocities) return;

    const positions = this.rainPositions;
    const velocities = this.rainVelocities;
    const player = this.camera.position;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * delta;
      positions[i + 1] += velocities[i + 1] * delta;
      positions[i + 2] += velocities[i + 2] * delta;

      if (positions[i + 1] < 0) {
        positions[i] = player.x + (Math.random() - 0.5) * 34;
        positions[i + 1] = player.y + 10 + Math.random() * 7;
        positions[i + 2] = player.z + (Math.random() - 0.5) * 34;
      }
    }

    this.rainPoints.geometry.attributes.position.needsUpdate = true;
  }

  private checkForBranchSnap(isMoving: boolean): void {
    if (!isMoving || this.isCrouching || !this.isGrounded || this.branchSnapCooldown > 0) return;

    for (const branch of this.walls) {
      if (!branch.id?.startsWith('fallen_branch_')) continue;
      if (
        this.playerPosition.x < branch.minX - 0.45 ||
        this.playerPosition.x > branch.maxX + 0.45 ||
        this.playerPosition.z < branch.minZ - 0.45 ||
        this.playerPosition.z > branch.maxZ + 0.45
      ) {
        continue;
      }

      this.branchSnapCooldown = 1.1;
      const distance = this.creature ? this.playerPosition.distanceTo(this.creature.position) : 99;
      horrorAudio.playTwigSnap(distance);
      if (this.creature && this.creature.state !== 'CHASE' && distance < 30) {
        this.creature.distractToLocation(this.playerPosition.clone());
      }
      return;
    }
  }

  private updateHorrorDirector(delta: number, creatureDistance: number): void {
    if (this.watcherTimer > 0 && this.watcher) {
      this.watcherTimer -= delta;
      const fade = Math.min(1, this.watcherTimer / 0.8);
      this.watcherMaterials.forEach((material) => {
        material.opacity = fade * 0.78;
      });
      this.watcher.rotation.y += delta * 0.18;
      if (this.watcherTimer <= 0) {
        this.scene.remove(this.watcher);
        this.watcher = null;
        this.watcherMaterials = [];
      }
      return;
    }

    this.horrorEventTimer -= delta;
    if (
      this.horrorEventTimer > 0 ||
      this.isDying ||
      this.isPlayerHiding ||
      this.creature.state === 'CHASE' ||
      creatureDistance < 20 ||
      this.isPowerRestored
    ) {
      return;
    }

    this.horrorEventTimer = 18 + Math.random() * 26;
    if (Math.random() > 0.72) return;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const side = new THREE.Vector3(-forward.z, 0, forward.x);
    const watcherPosition = this.playerPosition.clone()
      .addScaledVector(forward, -10 - Math.random() * 5)
      .addScaledVector(side, (Math.random() - 0.5) * 8);
    watcherPosition.y = 0;

    const silhouette = new THREE.Group();
    const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: 0x020305, transparent: true, opacity: 0.78 });
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xb8f3ff, transparent: true, opacity: 0.9 });
    this.watcherMaterials = [silhouetteMaterial, eyeMaterial];

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.48, 2.4, 7), silhouetteMaterial);
    body.position.y = 1.45;
    silhouette.add(body);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), silhouetteMaterial);
    hood.scale.set(0.8, 1.25, 0.75);
    hood.position.y = 2.85;
    silhouette.add(hood);

    for (const x of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMaterial);
      eye.position.set(x, 2.9, 0.32);
      silhouette.add(eye);
    }

    silhouette.position.copy(watcherPosition);
    silhouette.lookAt(this.playerPosition.x, 1.5, this.playerPosition.z);
    this.scene.add(silhouette);
    this.watcher = silhouette;
    this.watcherTimer = 2.2;
    horrorAudio.playDistortedWhispers(this.playerPosition.distanceTo(watcherPosition));
  }

  private checkForEscape(): void {
    if (this.escapeTriggered || !this.isPowerRestored || this.isDying) return;
    const inGateOpening = Math.abs(this.playerPosition.x) < 5.9;
    if (inGateOpening && this.playerPosition.z > 50.5) {
      this.escapeTriggered = true;
      horrorAudio.playEmergencyPowerRestored();
      horrorAudio.stopDieselEngine();
      this.onVictory?.();
    }
  }

  public resolveEntityCollision(pos: THREE.Vector3, radius: number, isHiding: boolean = false): void {
    if (isHiding) return;

    const WORLD_LIMIT = 78.0;
    pos.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.x));
    pos.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.z));

    for (let it = 0; it < 3; it++) {
      for (const w of this.walls) {
        if (w.height <= 0.5) continue;
        const minX = w.minX - radius;
        const maxX = w.maxX + radius;
        const minZ = w.minZ - radius;
        const maxZ = w.maxZ + radius;

        if (pos.x <= minX || pos.x >= maxX || pos.z <= minZ || pos.z >= maxZ) {
          continue;
        }

        const closestX = Math.max(w.minX, Math.min(pos.x, w.maxX));
        const closestZ = Math.max(w.minZ, Math.min(pos.z, w.maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distanceSq = dx * dx + dz * dz;

        if (distanceSq > 0.00001 && distanceSq < radius * radius) {
          const distance = Math.sqrt(distanceSq);
          const overlap = radius - distance;
          pos.x += (dx / distance) * overlap;
          pos.z += (dz / distance) * overlap;
        } else if (distanceSq <= 0.00001) {
          const pushLeft = pos.x - minX;
          const pushRight = maxX - pos.x;
          const pushBottom = pos.z - minZ;
          const pushTop = maxZ - pos.z;
          const minPush = Math.min(pushLeft, pushRight, pushBottom, pushTop);
          if (minPush === pushLeft) pos.x = minX;
          else if (minPush === pushRight) pos.x = maxX;
          else if (minPush === pushBottom) pos.z = minZ;
          else pos.z = maxZ;
        }
      }
      pos.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.x));
      pos.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.z));
    }
  }

  public checkWallCollision(x: number, z: number, radius = 0.4): boolean {
    for (const w of this.walls) {
      if (w.height <= 0.5) continue;
      const closestX = Math.max(w.minX, Math.min(x, w.maxX));
      const closestZ = Math.max(w.minZ, Math.min(z, w.maxZ));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
    }
    return false;
  }

  // Mobile / Onscreen Virtual Joystick support
  public setVirtualMovement(forward: boolean, backward: boolean, left: boolean, right: boolean) {
    if (this.isPlayerHiding) {
      this.exitLocker();
    }
    this.moveForward = forward;
    this.moveBackward = backward;
    this.moveLeft = left;
    this.moveRight = right;
  }

  public applyLookDelta(dx: number, dy: number) {
    const sens = 0.003 * this.settings.mouseSensitivity;
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
  }

  public resetGame(chapterId: number = 1) {
    this.clearInputState();
    this.yaw = Math.PI;
    this.pitch = 0;
    this.stamina = 100;
    this.verticalVelocity = 0;
    this.jumpHeightOffset = 0;
    this.jumpCooldownTimer = 0;
    this.landingCameraDip = 0;
    this.branchSnapCooldown = 0;
    this.breathHoldTime = this.maxBreathHoldTime;
    this.breathTimer = 2.4;
    this.isHoldingBreath = false;
    this.exhaustTimer = 0;
    this.flickerSuppressTimer = 0;
    this.promptCheckTimer = 0;
    this.staminaNotifyTimer = 0;
    this.flashlightNotifyTimer = 0;
    this.sensorNotifyTimer = 0;
    this.vitalsNotifyTimer = 0;
    this.activePrompt = null;
    this.isDying = false;
    this.deathTimer = 0;
    this.isMonsterAwakened = false;
    this.monsterAwakenTimer = 0;
    this.isPowerRestored = false;
    this.isSubstationUnlocked = false;
    this.isPlayerHiding = false;
    this.currentLockerPos = null;
    this.activeLean = null;
    this.isPickupHoodOpen = false;
    if (this.pickupHoodHinge) this.pickupHoodHinge.rotation.x = 0;
    if (this.substationDoorHinge) this.substationDoorHinge.rotation.set(0, 0, 0);
    if (this.substationDoorMesh) this.substationDoorMesh.rotation.set(0, 0, 0);
    this.horrorEventTimer = 18 + Math.random() * 12;
    this.watcherTimer = 0;
    if (this.watcher) {
      this.scene.remove(this.watcher);
      this.watcher = null;
      this.watcherMaterials = [];
    }

    // Position & inventory tailored to selected chapter
    if (chapterId === 2) {
      this.playerPosition.set(16, 1.65, -14);
      this.isSubstationUnlocked = true;
    } else if (chapterId === 3) {
      this.playerPosition.set(-15, 1.65, 8);
      this.isSubstationUnlocked = true;
    } else if (chapterId === 4) {
      this.playerPosition.set(18, 1.65, 14);
      this.isSubstationUnlocked = true;
      this.isPowerRestored = true;
    } else {
      this.playerPosition.set(-1, 1.65, -20);
    }
    this.camera.position.copy(this.playerPosition);
    this.camera.rotation.set(0, 0, 0);

    const initialMsg =
      chapterId === 2
        ? 'CHAPTER II // Search the woods and monoliths for 3 spark plugs.'
        : chapterId === 3
        ? 'CHAPTER III // Retrieve the diesel fuel can from the logging camp.'
        : chapterId === 4
        ? 'CHAPTER IV // Power restored! Sprint to the South Gate and escape!'
        : 'The woods are quiet... for now. Search the stalled truck for the Cabin Key.';

    this.bannerMessage = initialMsg;
    this.onBannerMessage?.(initialMsg);
    setTimeout(() => {
      if (this.bannerMessage === initialMsg) {
        this.bannerMessage = null;
        this.onBannerMessage?.(null);
      }
    }, 6000);

    if (this.activeFlare) {
      this.scene.remove(this.activeFlare.mesh);
      this.activeFlare = null;
    }
    this.flareSparks.forEach(({ mesh }) => this.scene.remove(mesh));
    this.flareSmokePuffs.forEach(({ mesh }) => this.scene.remove(mesh));
    this.flareSparks = [];
    this.flareSmokePuffs = [];
    this.breathPuffs.forEach(({ mesh }) => this.scene.remove(mesh));
    this.breathPuffs = [];
    this.exhalePlumeQueue = [];

    this.inventory = {
      fuses: chapterId >= 3 ? 3 : 0,
      maxFuses: 3,
      hasKeycard: chapterId >= 2,
      hasRadioTube: false,
      isRadioRepaired: false,
      hasFuelCan: chapterId >= 4,
      isGeneratorFueled: chapterId >= 4,
      batteries: 2,
      bottles: 1,
      flares: 1,
      hasMap: false,
      notesRead: [],
    };
    this.flashlightState = {
      enabled: true,
      battery: 100,
      isFlickering: false,
      isUVMode: false,
    };
    this.flashlight.visible = true;
    this.flashlight.color.setHex(0xfff7ed);
    this.flashlight.intensity = 10.5;
    this.flashlight.distance = 145;

    // Reset doors
    if (this.substationDoorMesh) {
      this.substationDoorMesh.rotation.y = chapterId >= 2 ? Math.PI / 2.2 : 0;
    }
    if (this.exitDoorMesh) this.exitDoorMesh.position.set(0, chapterId >= 4 ? 5.7 : 1.9, 48.5);
    this.escapeTriggered = false;
    if (this.fuseBoxMesh) {
      const mat = this.fuseBoxMesh.material as THREE.MeshStandardMaterial;
      mat.map = createGeneratorTexture(chapterId >= 4 ? 3 : chapterId >= 3 ? 3 : 0);
      mat.needsUpdate = true;
    }

    // Re-populate collected items
    this.itemMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.itemMeshes.clear();
    const { items } = getFacilityLayout();
    this.items = items;
    if (chapterId >= 2) {
      const keyItem = this.items.find((it) => it.type === 'keycard');
      if (keyItem) keyItem.collected = true;
    }
    if (chapterId >= 3) {
      this.items.filter((it) => it.type === 'fuse').forEach((it) => (it.collected = true));
    }
    if (chapterId >= 4) {
      const fuelItem = this.items.find((it) => it.type === 'fuel_can');
      if (fuelItem) fuelItem.collected = true;
    }
    this.updateActiveWalls();
    this.buildInteractiveItems();

    // Reset creature as dormant (emerges later)
    this.creature.reset(chapterId < 4);

    this.onInventoryChange?.({ ...this.inventory });
    this.onFlashlightChange?.({ ...this.flashlightState });
    this.onPromptChange?.(null);
    this.onHidingChange?.(false);
    this.onCrouchChange?.(false);
    this.onStaminaChange?.(100);
    this.onBreathHoldChange?.(false, 1);
  }

  private handleResize = () => {
    if (!this.canvasContainer) return;
    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    this.pause();
    if (this.controlCanvas) this.controlCanvas.removeEventListener('click', this.handleCanvasClick);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('resize', this.handleResize);
    horrorAudio.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
