import * as THREE from 'three';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface GameItem {
  id: string;
  name: string;
  emoji: string;
  mesh: THREE.Mesh;
  collected: boolean;
  position: THREE.Vector3;
  glowLight: THREE.PointLight;
}

export interface GameState3D {
  phase: 'menu' | 'playing' | 'paused' | 'dead' | 'win';
  inventory: string[];
  requiredItems: string[];
  bearDistance: number;
  sanity: number;
  stamina: number;
  isRunning: boolean;
  nearItem: GameItem | null;
  nearCar: boolean;
  message: string;
  messageTimer: number;
  flashlightOn: boolean;
  flashlightBattery: number;
}

// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────
const SAVE_KEY = 'forest_trap_save';

export interface SaveData {
  inventory: string[];
  collectedItemIds: string[];
  playerX: number;
  playerZ: number;
  bearX: number;
  bearZ: number;
  sanity: number;
  flashlightBattery: number;
  savedAt: number;
}

export function saveGame(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_e) { /* quota */ }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch (_e) { return null; }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playSound(type: 'pickup' | 'bear_growl' | 'footstep' | 'heartbeat' | 'engine' | 'wind') {
  try {
    const ctx = getAudioCtx();
    if (type === 'pickup') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
    if (type === 'bear_growl') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 150;
      src.buffer = buf;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      src.start();
    }
    if (type === 'heartbeat') {
      for (let b = 0; b < 2; b++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 60;
        const t = ctx.currentTime + b * 0.25;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t); osc.stop(t + 0.2);
      }
    }
    if (type === 'footstep') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.3;
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 200 + Math.random() * 100;
      src.buffer = buf;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      gain.gain.value = 0.4;
      src.start();
    }
    if (type === 'engine') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      osc.start(); osc.stop(ctx.currentTime + 2.5);
    }
    if (type === 'wind') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 0.5;
      src.buffer = buf; src.loop = true;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      gain.gain.value = 0.07;
      src.start();
    }
  } catch (_e) {
    // audio API not available
  }
}

// ─── MAIN 3D GAME CLASS ───────────────────────────────────────────────────────
export class ForestGame3D {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;

  private keys: Record<string, boolean> = {};
  private mouseX = 0;
  private mouseY = 0;
  private pitch = 0;
  private yaw = 0;
  private isLocked = false;

  private playerPos = new THREE.Vector3(0, 1.7, 5);
  private velocity = new THREE.Vector3();
  private onGround = true;

  private trees: THREE.Object3D[] = [];
  private items: GameItem[] = [];
  private bearMesh!: THREE.Group;
  private bearPos = new THREE.Vector3(-20, 0, -20);
  private bearTarget = new THREE.Vector3();
  private bearSpeed = 0.025;
  private carMesh!: THREE.Group;

  private clock = new THREE.Clock();
  private footstepTimer = 0;
  private heartbeatTimer = 0;
  private bearGrowlTimer = 0;
  private windStarted = false;

  private flashlight!: THREE.SpotLight;
  private flashlightMesh!: THREE.Group;

  public state: GameState3D = {
    phase: 'menu',
    inventory: [],
    requiredItems: ['wrench', 'fuel', 'battery', 'wire', 'spark_plug', 'oil'],
    bearDistance: 30,
    sanity: 100,
    stamina: 100,
    isRunning: false,
    nearItem: null,
    nearCar: false,
    message: '',
    messageTimer: 0,
    flashlightOn: true,
    flashlightBattery: 100,
  };

  private onStateChange: (s: GameState3D) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange: (s: GameState3D) => void) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    this.init();
  }

  private init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.3;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020404);
    this.scene.fog = new THREE.FogExp2(0x040a06, 0.06);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.copy(this.playerPos);

    this.buildWorld();
    this.bindEvents();
    this.loop();
  }

  private buildWorld() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundVerts = groundGeo.attributes.position;
    for (let i = 0; i < groundVerts.count; i++) {
      const x = groundVerts.getX(i);
      const z = groundVerts.getZ(i);
      groundVerts.setY(i, Math.sin(x * 0.15) * 0.3 + Math.cos(z * 0.12) * 0.2);
    }
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0d1a0a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ambient light (very dim)
    const ambient = new THREE.AmbientLight(0x050d08, 0.8);
    this.scene.add(ambient);

    // Moon light
    const moon = new THREE.DirectionalLight(0x1a2a3a, 0.4);
    moon.position.set(50, 80, 30);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 200;
    moon.shadow.camera.left = -80;
    moon.shadow.camera.right = 80;
    moon.shadow.camera.top = 80;
    moon.shadow.camera.bottom = -80;
    this.scene.add(moon);

    // Player torch (ambient flicker - very dim, replaces old torch)
    const torch = new THREE.PointLight(0xff6611, 0.4, 4);
    torch.name = 'torch';
    this.camera.add(torch);
    this.scene.add(this.camera);

    // ── Flashlight (SpotLight) ──────────────────────────────────────────────
    this.flashlight = new THREE.SpotLight(0xfff5e0, 8, 35, Math.PI / 10, 0.35, 1.5);
    this.flashlight.name = 'flashlight';
    this.flashlight.castShadow = false;
    // Target moves with camera
    const flashTarget = new THREE.Object3D();
    flashTarget.position.set(0, 0, -1);
    this.camera.add(flashTarget);
    this.flashlight.target = flashTarget;
    this.camera.add(this.flashlight);

    // 3D flashlight model in hand (bottom-right of view)
    this.flashlightMesh = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    this.flashlightMesh.add(body);
    const headGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.05, 8);
    const headMesh = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    headMesh.rotation.x = Math.PI / 2;
    headMesh.position.z = -0.13;
    this.flashlightMesh.add(headMesh);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const lensGeo = new THREE.CircleGeometry(0.035, 8);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.name = 'lens';
    lens.position.z = -0.16;
    this.flashlightMesh.add(lens);
    // Position in bottom-right of view (hand position)
    this.flashlightMesh.position.set(0.22, -0.25, -0.45);
    this.flashlightMesh.rotation.set(0.1, -0.15, 0.05);
    this.camera.add(this.flashlightMesh);

    // Generate forest
    this.generateForest();

    // Build car
    this.buildCar();

    // Build bear
    this.buildBear();

    // Place items
    this.placeItems();

    // Dead leaves / debris on ground
    this.addGroundDetails();
  }

  private generateForest() {
    const TREE_COUNT = 220;
    const TRUNK_MAT = new THREE.MeshLambertMaterial({ color: 0x1a0e08 });
    const FOLIAGE_COLORS = [0x071208, 0x091409, 0x04100a, 0x060e05];

    for (let i = 0; i < TREE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 75;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Keep path near car clear
      if (Math.abs(x) < 4 && Math.abs(z) < 8) continue;

      const treeGroup = new THREE.Group();
      const height = 6 + Math.random() * 8;
      const trunkRadius = 0.15 + Math.random() * 0.2;

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.6, trunkRadius, height, 6);
      const trunk = new THREE.Mesh(trunkGeo, TRUNK_MAT);
      trunk.position.y = height / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Twisted trunk details
      const twistGeo = new THREE.CylinderGeometry(trunkRadius * 0.3, trunkRadius * 0.5, height * 0.7, 4);
      const twist = new THREE.Mesh(twistGeo, TRUNK_MAT);
      twist.position.set(trunkRadius * 0.5, height * 0.3, 0);
      twist.rotation.z = 0.15;
      treeGroup.add(twist);

      // Foliage layers
      const foliageMat = new THREE.MeshLambertMaterial({
        color: FOLIAGE_COLORS[Math.floor(Math.random() * FOLIAGE_COLORS.length)],
      });
      for (let j = 0; j < 3; j++) {
        const r = (2 - j * 0.5) * (0.8 + Math.random() * 0.4);
        const h = (2 - j * 0.3) * (0.7 + Math.random() * 0.3);
        const coneGeo = new THREE.ConeGeometry(r, h, 7);
        const cone = new THREE.Mesh(coneGeo, foliageMat);
        cone.position.y = height * 0.55 + j * (h * 0.7);
        cone.rotation.y = Math.random() * Math.PI;
        cone.castShadow = true;
        treeGroup.add(cone);
      }

      treeGroup.position.set(x, 0, z);
      treeGroup.rotation.y = Math.random() * Math.PI * 2;
      // Slight lean
      treeGroup.rotation.z = (Math.random() - 0.5) * 0.08;
      treeGroup.userData.radius = trunkRadius + 0.3;
      treeGroup.userData.x = x;
      treeGroup.userData.z = z;
      this.scene.add(treeGroup);
      this.trees.push(treeGroup);
    }

    // Bushes
    const bushMat = new THREE.MeshLambertMaterial({ color: 0x060e05 });
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 60;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const r = 0.4 + Math.random() * 0.6;
      const bushGeo = new THREE.SphereGeometry(r, 5, 4);
      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(x, r * 0.5, z);
      bush.scale.y = 0.6;
      bush.castShadow = true;
      this.scene.add(bush);
    }
  }

  private buildCar() {
    this.carMesh = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1208 });
    const bodyGeo = new THREE.BoxGeometry(2, 0.9, 4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    this.carMesh.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.8, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.65, -0.3);
    cabin.castShadow = true;
    this.carMesh.add(cabin);

    // Windows (dark)
    const windowMat = new THREE.MeshLambertMaterial({ color: 0x030608, transparent: true, opacity: 0.7 });
    const windshieldGeo = new THREE.PlaneGeometry(1.5, 0.7);
    const windshield = new THREE.Mesh(windshieldGeo, windowMat);
    windshield.position.set(0, 1.65, 0.82);
    this.carMesh.add(windshield);

    // Wheels
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    const wheelPositions = [[-1.1, 0.35, 1.3], [1.1, 0.35, 1.3], [-1.1, 0.35, -1.3], [1.1, 0.35, -1.3]];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, y, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      this.carMesh.add(wheel);
    });

    // Open hood
    const hoodMat = new THREE.MeshLambertMaterial({ color: 0x141008 });
    const hoodGeo = new THREE.BoxGeometry(1.9, 0.05, 1.2);
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 1.35, 1.7);
    hood.rotation.x = -0.5;
    this.carMesh.add(hood);

    // Car headlights (off, faint)
    const headlight = new THREE.PointLight(0x221a00, 0.3, 5);
    headlight.position.set(0, 0.9, 2.2);
    this.carMesh.add(headlight);

    this.carMesh.position.set(0, 0, -3);
    this.carMesh.rotation.y = 0.2;
    this.scene.add(this.carMesh);
  }

  private buildBear() {
    this.bearMesh = new THREE.Group();
    const furMat = new THREE.MeshLambertMaterial({ color: 0x1a0c04 });

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.7, 8, 6);
    const bearBody = new THREE.Mesh(bodyGeo, furMat);
    bearBody.scale.set(1, 1.1, 1.4);
    bearBody.position.y = 1.0;
    bearBody.castShadow = true;
    this.bearMesh.add(bearBody);

    // Head
    const headGeo = new THREE.SphereGeometry(0.45, 8, 6);
    const head = new THREE.Mesh(headGeo, furMat);
    head.position.set(0, 1.8, 0.55);
    head.castShadow = true;
    this.bearMesh.add(head);

    // Snout
    const snoutGeo = new THREE.SphereGeometry(0.22, 6, 4);
    const snout = new THREE.Mesh(snoutGeo, new THREE.MeshLambertMaterial({ color: 0x120800 }));
    snout.position.set(0, 1.72, 0.92);
    snout.scale.set(1, 0.7, 0.8);
    this.bearMesh.add(snout);

    // Eyes (glowing red)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 4);
    [-0.15, 0.15].forEach(x => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x, 1.87, 0.85);
      this.bearMesh.add(eye);
      const eyeLight = new THREE.PointLight(0xff0000, 0.5, 1.5);
      eyeLight.position.copy(eye.position);
      this.bearMesh.add(eyeLight);
    });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.7, 6);
    [[-0.4, 0.35, -0.4], [0.4, 0.35, -0.4], [-0.35, 0.35, 0.4], [0.35, 0.35, 0.4]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.bearMesh.add(leg);
    });

    this.bearMesh.position.copy(this.bearPos);
    this.scene.add(this.bearMesh);
  }

  private placeItems() {
    const itemDefs = [
      { id: 'wrench', name: 'Гаечный ключ', emoji: '🔧', color: 0x8B6914, pos: new THREE.Vector3(12, 0, -8) },
      { id: 'fuel', name: 'Канистра топлива', emoji: '⛽', color: 0xcc3300, pos: new THREE.Vector3(-15, 0, 10) },
      { id: 'battery', name: 'Аккумулятор', emoji: '🔋', color: 0x334455, pos: new THREE.Vector3(8, 0, 20) },
      { id: 'wire', name: 'Провод', emoji: '〰️', color: 0x445500, pos: new THREE.Vector3(-10, 0, -15) },
      { id: 'spark_plug', name: 'Свеча зажигания', emoji: '⚡', color: 0xccaa00, pos: new THREE.Vector3(20, 0, 5) },
      { id: 'oil', name: 'Моторное масло', emoji: '🛢️', color: 0x1a1a00, pos: new THREE.Vector3(-22, 0, -5) },
    ];

    itemDefs.forEach(def => {
      const geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const mat = new THREE.MeshLambertMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.3 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(def.pos);
      mesh.position.y = 0.3;
      mesh.castShadow = true;
      this.scene.add(mesh);

      const glow = new THREE.PointLight(def.color, 1.2, 3.5);
      glow.position.copy(mesh.position);
      this.scene.add(glow);

      this.items.push({
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        mesh,
        collected: false,
        position: def.pos.clone(),
        glowLight: glow,
      });
    });
  }

  private addGroundDetails() {
    // Scattered rocks
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
    for (let i = 0; i < 60; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.25, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 60;
      rock.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(rock);
    }
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────
  private bindEvents() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE' && this.state.nearItem && !this.state.nearItem.collected) {
        this.collectItem(this.state.nearItem);
      }
      if (e.code === 'KeyE' && this.state.nearCar) {
        this.tryRepairCar();
      }
      if (e.code === 'KeyF' && this.state.phase === 'playing') {
        const on = !this.state.flashlightOn;
        this.flashlight.visible = on;
        const lens = this.flashlightMesh.getObjectByName('lens') as THREE.Mesh;
        if (lens) (lens.material as THREE.MeshBasicMaterial).color.set(on ? 0xffffcc : 0x222222);
        this.state = { ...this.state, flashlightOn: on, message: on ? '🔦 Фонарик включён' : '🔦 Фонарик выключен', messageTimer: 1.2 };
        this.onStateChange({ ...this.state });
      }
      if (e.code === 'Escape') {
        if (this.state.phase === 'playing') {
          document.exitPointerLock();
          this.state = { ...this.state, phase: 'paused' };
          this.onStateChange({ ...this.state });
        }
      }
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });

    this.canvas.addEventListener('click', () => {
      if (this.state.phase === 'playing') this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', e => {
      if (!this.isLocked) return;
      this.yaw -= e.movementX * 0.0018;
      this.pitch -= e.movementY * 0.0018;
      this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch));
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ─── START / RESTART ──────────────────────────────────────────────────────
  public startGame() {
    deleteSave();
    this.state = {
      ...this.state,
      phase: 'playing',
      inventory: [],
      bearDistance: 30,
      sanity: 100,
      stamina: 100,
      isRunning: false,
      nearItem: null,
      nearCar: false,
      message: 'WASD — движение  ·  Shift — бег  ·  E — взять  ·  F — фонарик',
      messageTimer: 5,
      flashlightOn: true,
      flashlightBattery: 100,
    };
    this.playerPos.set(0, 1.7, 5);
    this.bearMesh.position.set(-25, 0, -20);
    this.items.forEach(item => {
      item.collected = false;
      item.mesh.visible = true;
      item.glowLight.visible = true;
    });
    this.flashlight.visible = true;
    const lens = this.flashlightMesh.getObjectByName('lens') as THREE.Mesh;
    if (lens) (lens.material as THREE.MeshBasicMaterial).color.set(0xffffcc);
    this.canvas.requestPointerLock();
    if (!this.windStarted) { playSound('wind'); this.windStarted = true; }
    this.onStateChange({ ...this.state });
  }

  public loadSave() {
    const save = loadGame();
    if (!save) return;
    this.state = {
      ...this.state,
      phase: 'playing',
      inventory: save.inventory,
      bearDistance: 30,
      sanity: save.sanity,
      stamina: 100,
      isRunning: false,
      nearItem: null,
      nearCar: false,
      message: `💾 Загружено — ${save.inventory.length} деталей`,
      messageTimer: 3,
      flashlightOn: true,
      flashlightBattery: save.flashlightBattery,
    };
    this.playerPos.set(save.playerX, 1.7, save.playerZ);
    this.bearMesh.position.set(save.bearX, 0, save.bearZ);
    // Restore collected items
    this.items.forEach(item => {
      const was = save.collectedItemIds.includes(item.id);
      item.collected = was;
      item.mesh.visible = !was;
      item.glowLight.visible = !was;
    });
    this.flashlight.visible = true;
    const lens = this.flashlightMesh.getObjectByName('lens') as THREE.Mesh;
    if (lens) (lens.material as THREE.MeshBasicMaterial).color.set(0xffffcc);
    this.canvas.requestPointerLock();
    if (!this.windStarted) { playSound('wind'); this.windStarted = true; }
    this.onStateChange({ ...this.state });
  }

  public resumeGame() {
    this.state = { ...this.state, phase: 'playing' };
    this.canvas.requestPointerLock();
    this.onStateChange({ ...this.state });
  }

  // ─── GAME LOOP ────────────────────────────────────────────────────────────
  private loop = () => {
    requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.state.phase === 'playing') {
      this.updatePlayer(delta);
      this.updateBear(delta);
      this.updateItems();
      this.updateHUD(delta);
      this.updateTorch(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePlayer(delta: number) {
    const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const canRun = isRunning && this.state.stamina > 0;
    const speed = canRun ? 7.5 : 4.0;

    // Stamina
    let stamina = this.state.stamina;
    if (canRun) stamina = Math.max(0, stamina - delta * 25);
    else stamina = Math.min(100, stamina + delta * 15);

    // Direction from camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) move.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) move.sub(forward);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) move.sub(right);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) move.add(right);

    const isMoving = move.lengthSq() > 0;
    if (isMoving) {
      move.normalize().multiplyScalar(speed * delta);

      // Footstep sound
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        playSound('footstep');
        this.footstepTimer = canRun ? 0.28 : 0.45;
      }
    } else {
      this.footstepTimer = 0;
    }

    // Bobbing
    const bob = isMoving ? Math.sin(Date.now() * (canRun ? 0.012 : 0.008)) * (canRun ? 0.07 : 0.04) : 0;

    // Collision with trees
    const nextPos = this.playerPos.clone().add(move);
    let blocked = false;
    for (const tree of this.trees) {
      const dx = nextPos.x - tree.userData.x;
      const dz = nextPos.z - tree.userData.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < tree.userData.radius + 0.4) { blocked = true; break; }
    }
    if (!blocked) this.playerPos.add(move);

    // World bounds
    this.playerPos.x = Math.max(-90, Math.min(90, this.playerPos.x));
    this.playerPos.z = Math.max(-90, Math.min(90, this.playerPos.z));

    // Camera
    this.camera.position.set(this.playerPos.x, 1.7 + bob, this.playerPos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    this.state = { ...this.state, stamina, isRunning: isMoving && canRun };
  }

  private updateBear(delta: number) {
    const bearDist = this.bearMesh.position.distanceTo(this.camera.position);
    this.state = { ...this.state, bearDistance: bearDist };

    // Bear AI: move toward player
    const toPlayer = new THREE.Vector3()
      .subVectors(this.camera.position, this.bearMesh.position)
      .setY(0);

    const distXZ = toPlayer.length();

    // Increase speed as bear gets closer
    const currentBearSpeed = bearDist < 10 ? this.bearSpeed * 2.5 : bearDist < 20 ? this.bearSpeed * 1.5 : this.bearSpeed;
    const move = toPlayer.normalize().multiplyScalar(currentBearSpeed);
    this.bearMesh.position.add(move);
    this.bearMesh.position.y = 0;

    // Bear rotation
    if (distXZ > 0.1) {
      const angle = Math.atan2(toPlayer.x, toPlayer.z);
      this.bearMesh.rotation.y = angle;
    }

    // Bear animation (leg swing)
    const t = Date.now() * 0.004;
    this.bearMesh.children.forEach((child, i) => {
      if (i > 5 && i <= 9) {
        child.position.y = 0.35 + Math.sin(t + i) * 0.08;
      }
    });
    this.bearMesh.position.y = Math.abs(Math.sin(t * 2)) * 0.05;

    // Growl
    this.bearGrowlTimer -= delta;
    if (bearDist < 15 && this.bearGrowlTimer <= 0) {
      playSound('bear_growl');
      this.bearGrowlTimer = 4 + Math.random() * 3;
    }

    // Heartbeat when close
    if (bearDist < 12) {
      this.heartbeatTimer -= delta;
      if (this.heartbeatTimer <= 0) {
        playSound('heartbeat');
        this.heartbeatTimer = Math.max(0.4, bearDist * 0.07);
      }
    }

    // Sanity drain
    let sanity = this.state.sanity;
    if (bearDist < 20) sanity = Math.max(0, sanity - delta * (20 - bearDist) * 0.5);
    else sanity = Math.min(100, sanity + delta * 2);

    // DEATH
    if (bearDist < 2.2) {
      document.exitPointerLock();
      this.state = { ...this.state, phase: 'dead', sanity };
      this.onStateChange({ ...this.state });
      return;
    }

    this.state = { ...this.state, sanity };
  }

  private updateItems() {
    const pos = this.camera.position;
    let nearItem: GameItem | null = null;

    this.items.forEach(item => {
      if (item.collected) return;
      // Floating + rotating
      item.mesh.rotation.y += 0.02;
      item.mesh.position.y = 0.3 + Math.sin(Date.now() * 0.002 + item.position.x) * 0.12;
      item.glowLight.intensity = 1.0 + Math.sin(Date.now() * 0.003) * 0.4;

      const dist = item.mesh.position.distanceTo(pos);
      if (dist < 2.5) nearItem = item;
    });

    // Near car check
    const carDist = this.carMesh.position.distanceTo(pos);
    const nearCar = carDist < 4;

    this.state = { ...this.state, nearItem, nearCar };
  }

  private updateHUD(delta: number) {
    if (this.state.messageTimer > 0) {
      this.state = { ...this.state, messageTimer: this.state.messageTimer - delta };
    }
    this.onStateChange({ ...this.state });
  }

  private updateTorch(delta: number) {
    // Ambient torch flicker
    const torch = this.scene.getObjectByName('torch') as THREE.PointLight;
    if (torch) {
      const flicker = 0.85 + Math.sin(Date.now() * 0.031) * 0.1 + Math.random() * 0.05;
      torch.intensity = 0.4 * flicker;
    }

    // Flashlight battery drain + flicker
    let { flashlightBattery, flashlightOn } = this.state;
    if (flashlightOn) {
      flashlightBattery = Math.max(0, flashlightBattery - delta * 1.2);

      // Low battery flicker
      const lowFactor = flashlightBattery < 20 ? (0.4 + Math.random() * 0.6) : 1;
      const baseIntensity = (flashlightBattery / 100) * 8 * lowFactor;
      this.flashlight.intensity = baseIntensity;
      this.flashlight.distance = 15 + (flashlightBattery / 100) * 20;

      // Dead battery
      if (flashlightBattery <= 0) {
        flashlightOn = false;
        this.flashlight.visible = false;
        const lens = this.flashlightMesh.getObjectByName('lens') as THREE.Mesh;
        if (lens) (lens.material as THREE.MeshBasicMaterial).color.set(0x222222);
        this.state = { ...this.state, flashlightOn: false, flashlightBattery: 0, message: '🔦 Батарейка села!', messageTimer: 3 };
        this.onStateChange({ ...this.state });
        return;
      }
    }

    // Hand sway animation
    const t = Date.now() * 0.0015;
    const swayX = Math.sin(t) * (this.state.isRunning ? 0.025 : 0.008);
    const swayY = Math.abs(Math.sin(t * 1.8)) * (this.state.isRunning ? 0.02 : 0.005) - 0.005;
    this.flashlightMesh.position.set(0.22 + swayX, -0.25 + swayY, -0.45);

    this.state = { ...this.state, flashlightBattery, flashlightOn };
  }

  private collectItem(item: GameItem) {
    item.collected = true;
    item.mesh.visible = false;
    item.glowLight.visible = false;
    playSound('pickup');

    const newInventory = [...this.state.inventory, item.id];
    const allDone = newInventory.length === this.state.requiredItems.length;
    this.state = {
      ...this.state,
      inventory: newInventory,
      message: allDone ? '✓ Все детали собраны! Возвращайся к машине!' : `💾 Сохранено · ${item.emoji} ${item.name}`,
      messageTimer: allDone ? 5 : 2.5,
    };

    // ── AUTO SAVE ──────────────────────────────────────────────────────────
    saveGame({
      inventory: newInventory,
      collectedItemIds: this.items.filter(i => i.collected).map(i => i.id),
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      bearX: this.bearMesh.position.x,
      bearZ: this.bearMesh.position.z,
      sanity: this.state.sanity,
      flashlightBattery: this.state.flashlightBattery,
      savedAt: Date.now(),
    });

    this.onStateChange({ ...this.state });
  }

  private tryRepairCar() {
    const missing = this.state.requiredItems.filter(r => !this.state.inventory.includes(r));
    if (missing.length > 0) {
      this.state = { ...this.state, message: `Не хватает ${missing.length} деталей`, messageTimer: 2 };
      this.onStateChange({ ...this.state });
      return;
    }
    document.exitPointerLock();
    playSound('engine');
    this.state = { ...this.state, phase: 'win' };
    this.onStateChange({ ...this.state });
  }

  public destroy() {
    this.renderer.dispose();
  }
}