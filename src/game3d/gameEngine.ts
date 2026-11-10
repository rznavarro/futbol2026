import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Stadium, STADIUM_CONFIG } from './stadium';
import { Ball } from './ballPhysics';
import { PlayerModel } from './playerModel';
import { AiController } from './aiController';
import { sound } from '../audio/soundSystem';
import {
  Team,
  GameSettings,
  MatchState,
  MatchStats,
  CameraMode,
} from '../types/game';

export interface HudData {
  homeScore: number;
  awayScore: number;
  matchTimeStr: string;
  halfStr: string;
  matchState: MatchState;
  activePlayerName: string;
  activePlayerNumber: number;
  activePlayerStamina: number; // 0 - 100
  shotPowerPercent: number;    // 0 - 100
  possessionHome: number;      // 0 - 100
  possessionAway: number;      // 0 - 100
  radarPlayers: Array<{ x: number; z: number; isHome: boolean; isControlled: boolean }>;
  radarBall: { x: number; z: number };
  goalCelebrationScorer?: string;
  goalCelebrationTeamName?: string;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private stadium!: Stadium;
  public ball!: Ball;
  public players: PlayerModel[] = [];
  public ai!: AiController;

  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Teams & Match Settings
  public homeTeam: Team;
  public awayTeam: Team;
  public settings: GameSettings;

  // Match State & Clock
  public matchState: MatchState = 'KICKOFF_WAIT';
  public matchTimeMinutes: number = 0; // 0 to 90
  public half: 1 | 2 = 1;
  public matchStats: MatchStats;

  // Active Controlled Player
  public activePlayerIndex: number = 4; // Default to striker (player 4)
  public activePlayerStamina: number = 100;
  private shotCharging: boolean = false;
  private shotChargeTime: number = 0;

  // Input states
  private keysHeld: { [key: string]: boolean } = {};

  // Camera tracking
  private cameraMode: CameraMode = 'BROADCAST';
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3();
  private targetCameraLook: THREE.Vector3 = new THREE.Vector3();

  // Possession calculation
  private homePossessionTicks: number = 50;
  private awayPossessionTicks: number = 50;

  // Goal celebration timer
  private celebrationTimer: number = 0;
  private latestScorerName: string = '';
  private latestScorerTeam: string = '';

  // Callback to React HUD
  public onHudUpdate?: (data: HudData) => void;
  public onMatchEnd?: (stats: MatchStats) => void;

  constructor(
    container: HTMLElement,
    homeTeam: Team,
    awayTeam: Team,
    settings: GameSettings,
    onHudUpdate?: (data: HudData) => void,
    onMatchEnd?: (stats: MatchStats) => void
  ) {
    this.container = container;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.settings = settings;
    this.cameraMode = settings.cameraMode;
    this.onHudUpdate = onHudUpdate;
    this.onMatchEnd = onMatchEnd;

    this.matchStats = {
      homeScore: 0,
      awayScore: 0,
      homeShots: 0,
      awayShots: 0,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
      homePossessionPercent: 50,
      awayPossessionPercent: 50,
      homePassesCompleted: 0,
      awayPassesCompleted: 0,
      homeTackles: 0,
      awayTackles: 0,
      homeCorners: 0,
      awayCorners: 0,
      homeFouls: 0,
      awayFouls: 0,
      scorers: [],
    };

    this.initThree();
    this.initAudio();
    this.bindInputs();
    this.setupMatchPositions();
    this.startLoop();
  }

  private initThree() {
    // Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Scene & Fog (Night stadium atmosphere)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);
    this.scene.fog = new THREE.FogExp2(0x060c18, 0.008);

    // Camera (Tele / Broadcast perspective)
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
    this.camera.position.set(0, 24, 38);
    this.camera.lookAt(0, 0, 0);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Ambient & Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x1a2e1a, 0.9);
    this.scene.add(hemiLight);

    // Stadium & Ball
    this.stadium = new Stadium(this.renderer);
    this.scene.add(this.stadium.group);

    this.ball = new Ball();
    this.scene.add(this.ball.mesh);

    // Create 10 Players (5 Home + 5 Away)
    this.homeTeam.players.forEach((p) => {
      const pm = new PlayerModel(p, this.homeTeam, true);
      this.players.push(pm);
      this.scene.add(pm.group);
    });

    this.awayTeam.players.forEach((p) => {
      const pm = new PlayerModel(p, this.awayTeam, false);
      this.players.push(pm);
      this.scene.add(pm.group);
    });

    // Mark initial active player
    this.updateActiveControlledPlayer();

    // AI Controller
    this.ai = new AiController(this.settings.difficulty);

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);
  }

  private initAudio() {
    if (this.settings.soundEnabled) {
      sound.setVolumes(this.settings.sfxVolume, this.settings.crowdVolume);
      sound.startCrowdAmbience();
      sound.playWhistle('kickoff');
    }
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private bindInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    this.keysHeld[key] = true;

    // Edge-triggered actions
    if (key === 'J' && this.matchState === 'PLAYING') {
      this.performShortPass();
    } else if (key === 'K' && this.matchState === 'PLAYING') {
      this.performLongPass();
    } else if (key === 'L' && this.matchState === 'PLAYING') {
      this.switchControlledPlayer();
    } else if (key === 'E' && this.matchState === 'PLAYING') {
      this.performTackle();
    } else if (e.code === 'Space' && this.matchState === 'PLAYING') {
      if (!this.shotCharging) {
        this.shotCharging = true;
        this.shotChargeTime = 0;
      }
    } else if (e.code === 'Space' && this.matchState === 'KICKOFF_WAIT') {
      // Start match / kickoff
      this.matchState = 'PLAYING';
      sound.playWhistle('kickoff');
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    this.keysHeld[key] = false;

    if (e.code === 'Space' && this.shotCharging) {
      this.performShoot();
      this.shotCharging = false;
      this.shotChargeTime = 0;
    }
  };

  private handleBlur = () => {
    this.keysHeld = {};
    this.shotCharging = false;
    this.shotChargeTime = 0;
  };

  // --- Kickoff & Formation Positions ---
  public setupMatchPositions(kickoffTeam: 'home' | 'away' = 'home') {
    // Initial standard 5v5 positions
    const homeSpots = [
      { x: -30.0, z: 0.0 },   // GK
      { x: -18.0, z: 0.0 },   // DEF
      { x: -7.0,  z: -6.0 },  // MID
      { x: -5.0,  z: 7.0 },   // FWD
      { x: kickoffTeam === 'home' ? -0.8 : -4.0, z: 0.0 }, // ST
    ];

    const awaySpots = [
      { x: 30.0, z: 0.0 },    // GK
      { x: 18.0, z: 0.0 },    // DEF
      { x: 7.0,  z: 6.0 },    // MID
      { x: 5.0,  z: -7.0 },   // FWD
      { x: kickoffTeam === 'away' ? 0.8 : 4.0, z: 0.0 },  // ST
    ];

    for (let i = 0; i < 5; i++) {
      const hp = this.players[i];
      hp.position.set(homeSpots[i].x, 0, homeSpots[i].z);
      hp.velocity.set(0, 0, 0);
      hp.targetFacingAngle = 0; // facing away goal (+X)
      hp.facingAngle = 0;
      hp.update(0);

      const ap = this.players[i + 5];
      ap.position.set(awaySpots[i].x, 0, awaySpots[i].z);
      ap.velocity.set(0, 0, 0);
      ap.targetFacingAngle = Math.PI; // facing home goal (-X)
      ap.facingAngle = Math.PI;
      ap.update(0);
    }

    // Ball to center circle
    this.ball.reset(0, 0);
    this.activePlayerIndex = 4; // Striker
    this.updateActiveControlledPlayer();
  }

  private updateActiveControlledPlayer() {
    this.players.forEach((p, idx) => {
      p.setControlled(idx === this.activePlayerIndex);
    });
  }

  // Switch to nearest teammate to ball (or manual switch L key)
  public switchControlledPlayer() {
    let closestIndex = this.activePlayerIndex;
    let minDistance = Infinity;

    // Look through home outfield players (indices 1 to 4)
    for (let i = 1; i < 5; i++) {
      if (i === this.activePlayerIndex) continue;
      const d = this.players[i].position.distanceTo(this.ball.pos);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    this.activePlayerIndex = closestIndex;
    this.updateActiveControlledPlayer();
    sound.playUiClick();
  }

  // Auto-switch to closest player when defending if ball is far from current controlled player
  private checkAutoSwitch() {
    const controlled = this.players[this.activePlayerIndex];
    if (!controlled) return;

    const currentDist = controlled.position.distanceTo(this.ball.pos);
    if (currentDist > 14 && this.ball.lastKickerTeam === 'away') {
      let nearestIdx = this.activePlayerIndex;
      let nearestDist = currentDist;
      for (let i = 1; i < 5; i++) {
        const d = this.players[i].position.distanceTo(this.ball.pos);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      if (nearestIdx !== this.activePlayerIndex) {
        this.activePlayerIndex = nearestIdx;
        this.updateActiveControlledPlayer();
      }
    }
  }

  // --- Player Action: Short Pass ---
  private performShortPass() {
    const controlled = this.players[this.activePlayerIndex];
    if (!controlled) return;

    const distToBall = controlled.position.distanceTo(this.ball.pos);
    if (distToBall > 1.6 || this.ball.pos.y > 1.2) return; // Must be close to pass

    // Find best open teammate in front / direction of movement
    const moveDir = this.getInputDirection();
    const forward = moveDir.lengthSq() > 0 ? moveDir.normalize() : new THREE.Vector3(1, 0, 0);

    let bestTeammate: PlayerModel | null = null;
    let bestScore = -Infinity;

    for (let i = 1; i < 5; i++) {
      if (i === this.activePlayerIndex) continue;
      const t = this.players[i];
      const toTeammate = new THREE.Vector3().subVectors(t.position, controlled.position);
      const dist = toTeammate.length();
      if (dist < 2.0) continue;
      toTeammate.normalize();

      const dot = forward.dot(toTeammate);
      const score = dot * 2.0 - dist * 0.03;
      if (score > bestScore) {
        bestScore = score;
        bestTeammate = t;
      }
    }

    controlled.triggerKick();
    sound.playKick(false);

    if (bestTeammate) {
      // Crisp grounded pass directed straight to teammate's stride
      const leadPos = new THREE.Vector3().copy(bestTeammate.position).addScaledVector(bestTeammate.velocity, 0.4);
      const passDir = new THREE.Vector3().subVectors(leadPos, this.ball.pos).normalize();
      passDir.y = 0.08;
      const passPower = 17.5 + (controlled.player.stats.passing / 100) * 5;
      this.ball.applyKick(passDir.multiplyScalar(passPower), undefined, 'home', controlled.player.id);

      // Auto-switch control to receiving teammate!
      const targetIdx = this.players.indexOf(bestTeammate);
      if (targetIdx !== -1) {
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.activePlayerIndex = targetIdx;
            this.updateActiveControlledPlayer();
          }
        }, 220);
      }
    } else {
      // Pass forward into space
      const passDir = forward.clone();
      passDir.y = 0.08;
      this.ball.applyKick(passDir.multiplyScalar(16), undefined, 'home', controlled.player.id);
    }

    this.matchStats.homePassesCompleted++;
  }

  // --- Player Action: Long Pass / Lofted Cross ---
  private performLongPass() {
    const controlled = this.players[this.activePlayerIndex];
    if (!controlled) return;

    const distToBall = controlled.position.distanceTo(this.ball.pos);
    if (distToBall > 1.6) return;

    const moveDir = this.getInputDirection();
    const forward = moveDir.lengthSq() > 0 ? moveDir.normalize() : new THREE.Vector3(1, 0, 0);

    controlled.triggerKick();
    sound.playKick(true);

    // Lofted cross with airborne arc
    const crossDir = forward.clone();
    crossDir.y = 0.55; // High launch angle
    crossDir.normalize();

    const crossPower = 22 + (controlled.player.stats.passing / 100) * 6;
    this.ball.applyKick(crossDir.multiplyScalar(crossPower), undefined, 'home', controlled.player.id);
    this.matchStats.homePassesCompleted++;
  }

  // --- Player Action: Shoot to Goal ---
  private performShoot() {
    const controlled = this.players[this.activePlayerIndex];
    if (!controlled) return;

    const distToBall = controlled.position.distanceTo(this.ball.pos);
    if (distToBall > 1.6) return;

    // Power calculated based on charge duration (0.1s to 1.2s max)
    const powerNorm = Math.min(1.0, this.shotChargeTime / 0.85);
    const shootingStat = controlled.player.stats.shooting;
    const shotSpeed = 22 + powerNorm * 14 + (shootingStat / 100) * 8; // up to 44 m/s (pro blast!)

    controlled.triggerKick();
    sound.playKick(true);

    // Aim towards away goal (+32, y: 0.5 to 2.2, z: between -3.2 and +3.2)
    const goalX = 32.0;
    // Input direction adjusts target corner (aiming up/down steers left/right post)
    const moveDir = this.getInputDirection();
    const aimZ = moveDir.z * 3.1;
    const aimY = 0.6 + powerNorm * 1.5;

    const shotDir = new THREE.Vector3(goalX - this.ball.pos.x, aimY, aimZ - this.ball.pos.z).normalize();
    // Add realistic curve spin based on aim direction
    const spin = new THREE.Vector3(0, -aimZ * 3.5, 0);

    this.ball.applyKick(shotDir.multiplyScalar(shotSpeed), spin, 'home', controlled.player.id);

    this.matchStats.homeShots++;
    if (Math.abs(aimZ) < 3.4 && aimY < 2.44) {
      this.matchStats.homeShotsOnTarget++;
    }
  }

  // --- Player Action: Tackle ---
  private performTackle() {
    const controlled = this.players[this.activePlayerIndex];
    if (!controlled) return;

    controlled.triggerTackle();
    sound.playTackle();
    this.matchStats.homeTackles++;

    // Check if nearby opponent has the ball
    const distToBall = controlled.position.distanceTo(this.ball.pos);
    if (distToBall < 2.0) {
      // Dispossess and push ball in forward direction
      const forward = new THREE.Vector3(Math.cos(controlled.facingAngle), 0, Math.sin(controlled.facingAngle));
      this.ball.applyKick(forward.multiplyScalar(14), undefined, 'home', controlled.player.id);
    }
  }

  private getInputDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, 0);
    if (this.keysHeld['W'] || this.keysHeld['ARROWUP']) dir.z -= 1;
    if (this.keysHeld['S'] || this.keysHeld['ARROWDOWN']) dir.z += 1;
    if (this.keysHeld['A'] || this.keysHeld['ARROWLEFT']) dir.x -= 1;
    if (this.keysHeld['D'] || this.keysHeld['ARROWRIGHT']) dir.x += 1;
    return dir;
  }

  // --- Controlled Player Movement & Ball Dribbling ---
  private updateControlledPlayer(dt: number) {
    const controlled = this.players[this.activePlayerIndex];
    if (!controlled) return;

    const inputDir = this.getInputDirection();
    const isMoving = inputDir.lengthSq() > 0;
    const isSprinting = (this.keysHeld['SHIFT'] || this.keysHeld['SHIFTLEFT']) && this.activePlayerStamina > 5;

    // Stamina system
    if (isSprinting && isMoving) {
      this.activePlayerStamina = Math.max(0, this.activePlayerStamina - dt * 25);
    } else {
      this.activePlayerStamina = Math.min(100, this.activePlayerStamina + dt * 15);
    }

    const baseSpeed = (controlled.player.stats.speed / 100) * 8.5;
    const speed = isSprinting ? baseSpeed * 1.45 : baseSpeed;

    if (isMoving) {
      inputDir.normalize();
      controlled.velocity.copy(inputDir).multiplyScalar(speed);
      controlled.position.x += controlled.velocity.x * dt;
      controlled.position.z += controlled.velocity.z * dt;
      controlled.targetFacingAngle = Math.atan2(inputDir.z, inputDir.x);
    } else {
      controlled.velocity.set(0, 0, 0);
    }

    // Keep within pitch boundaries
    controlled.position.x = Math.max(-31, Math.min(31, controlled.position.x));
    controlled.position.z = Math.max(-20, Math.min(20, controlled.position.z));
    controlled.update(dt);

    // Ball Dribbling / Magnetization when controlled player is in possession
    const distToBall = controlled.position.distanceTo(this.ball.pos);
    const hasBall = distToBall < 1.3 && this.ball.pos.y < 1.0;

    if (hasBall && !this.ball.inNet) {
      this.ball.lastKickerTeam = 'home';
      this.ball.ownerPlayerId = controlled.player.id;

      // Position ball smoothly in front of player's feet
      const forward = new THREE.Vector3(Math.cos(controlled.facingAngle), 0, Math.sin(controlled.facingAngle));
      const targetBallX = controlled.position.x + forward.x * 0.72;
      const targetBallZ = controlled.position.z + forward.z * 0.72;

      this.ball.pos.x += (targetBallX - this.ball.pos.x) * Math.min(1, dt * 18);
      this.ball.pos.z += (targetBallZ - this.ball.pos.z) * Math.min(1, dt * 18);
      this.ball.pos.y = this.ball.radius;
      this.ball.vel.copy(controlled.velocity);
    }
  }

  // --- Dynamic Broadcast TV Camera ---
  private updateCamera(dt: number) {
    if (this.cameraMode === 'BROADCAST') {
      // Follow ball with smooth broadcast lateral track
      const targetX = Math.max(-20, Math.min(20, this.ball.pos.x * 0.65));
      const targetZ = 34 + this.ball.pos.z * 0.25;
      const targetY = 22 + Math.abs(this.ball.pos.x) * 0.08;

      this.targetCameraPos.set(targetX, targetY, targetZ);
      this.targetCameraLook.set(this.ball.pos.x * 0.85, 1.0, this.ball.pos.z * 0.4);
    } else if (this.cameraMode === 'DYNAMIC') {
      // Dynamic closer action camera
      const controlled = this.players[this.activePlayerIndex] || this.players[4];
      this.targetCameraPos.set(controlled.position.x - 12, 14, controlled.position.z + 18);
      this.targetCameraLook.copy(this.ball.pos);
    } else {
      // Tactical top-down overview
      this.targetCameraPos.set(this.ball.pos.x * 0.5, 42, 22);
      this.targetCameraLook.set(this.ball.pos.x * 0.5, 0, 0);
    }

    // Special Zoom during Goal Celebration!
    if (this.matchState === 'GOAL_CELEBRATION') {
      const scorer = this.players.find((p) => p.player.name === this.latestScorerName) || this.players[4];
      this.targetCameraPos.set(scorer.position.x + 4, 3.5, scorer.position.z + 5);
      this.targetCameraLook.set(scorer.position.x, 1.2, scorer.position.z);
    }

    // Smooth exponential damping
    this.camera.position.lerp(this.targetCameraPos, Math.min(1, dt * 4.5));
    const currentLook = new THREE.Vector3();
    this.camera.getWorldDirection(currentLook);
    this.camera.lookAt(this.targetCameraLook);
  }

  // --- Main Tick Game Loop ---
  private startLoop() {
    let lastTime = performance.now();

    const tick = () => {
      if (this.isDestroyed) return;

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt

      // 1. Update Match Clock (Scaled real-to-game time)
      if (this.matchState === 'PLAYING') {
        const gameMinutesPerSec = 90 / (this.settings.matchDurationMinutes * 60);
        this.matchTimeMinutes += dt * gameMinutesPerSec;

        // Halftime at 45 mins
        if (this.matchTimeMinutes >= 45 && this.half === 1) {
          this.half = 2;
          this.matchState = 'HALF_TIME';
          sound.playWhistle('kickoff');
          setTimeout(() => {
            if (!this.isDestroyed && this.matchState === 'HALF_TIME') {
              this.setupMatchPositions('away');
              this.matchState = 'PLAYING';
            }
          }, 3000);
        }

        // Fulltime at 90 mins
        if (this.matchTimeMinutes >= 90) {
          this.matchTimeMinutes = 90;
          this.matchState = 'FULL_TIME';
          sound.playWhistle('fulltime');
          if (this.onMatchEnd) {
            this.onMatchEnd(this.matchStats);
          }
        }

        // Shot charge meter accumulation
        if (this.shotCharging) {
          this.shotChargeTime += dt;
        }

        // Possession Tracking
        if (this.ball.lastKickerTeam === 'home') {
          this.homePossessionTicks += dt;
        } else if (this.ball.lastKickerTeam === 'away') {
          this.awayPossessionTicks += dt;
        }
        const totalPoss = this.homePossessionTicks + this.awayPossessionTicks;
        this.matchStats.homePossessionPercent = Math.round((this.homePossessionTicks / totalPoss) * 100);
        this.matchStats.awayPossessionPercent = 100 - this.matchStats.homePossessionPercent;
      }

      // 2. Goal Celebration Processing
      if (this.matchState === 'GOAL_CELEBRATION') {
        this.celebrationTimer -= dt;
        if (this.celebrationTimer <= 0) {
          // Reset for next kickoff
          const concededTeam = this.ball.goalScoredFor === 'home' ? 'away' : 'home';
          this.setupMatchPositions(concededTeam);
          this.matchState = 'PLAYING';
          sound.playWhistle('kickoff');
        }
      }

      // 3. Out of Bounds Restart Handling
      if (this.matchState === 'PLAYING' && this.ball.outOfBounds) {
        const restartType = this.ball.outOfBounds;
        const restartLoc = this.ball.outLocation.clone();
        this.matchState = 'OUT_OF_BOUNDS';
        sound.playWhistle('foul');

        if (restartType === 'CORNER') {
          if (restartLoc.x > 0) this.matchStats.awayCorners++;
          else this.matchStats.homeCorners++;
        }

        setTimeout(() => {
          if (!this.isDestroyed) {
            this.ball.reset(restartLoc.x, restartLoc.z);
            this.matchState = 'PLAYING';
          }
        }, 1500);
      }

      // 4. Update Ball Physics
      this.ball.update(
        dt,
        () => sound.playPostHit(),
        () => sound.playNetHit()
      );

      // Check Goal Scored
      if (this.ball.goalScoredFor && this.matchState === 'PLAYING') {
        const isHomeGoal = this.ball.goalScoredFor === 'home';
        if (isHomeGoal) {
          this.matchStats.homeScore++;
          this.latestScorerName = this.homeTeam.players[this.activePlayerIndex]?.name || this.homeTeam.keyPlayer.name;
          this.latestScorerTeam = this.homeTeam.name;
        } else {
          this.matchStats.awayScore++;
          this.latestScorerName = this.awayTeam.keyPlayer.name;
          this.latestScorerTeam = this.awayTeam.name;
        }

        this.matchStats.scorers.push({
          teamId: isHomeGoal ? this.homeTeam.id : this.awayTeam.id,
          playerName: this.latestScorerName,
          minute: Math.max(1, Math.min(90, Math.floor(this.matchTimeMinutes))),
        });

        this.matchState = 'GOAL_CELEBRATION';
        this.celebrationTimer = 4.2; // 4.2s celebration
        sound.playGoalRoar();
      }

      // 5. Update Controlled Player
      if (this.matchState === 'PLAYING') {
        this.updateControlledPlayer(dt);
        this.checkAutoSwitch();
      }

      // 6. Update AI Opponents and Teammates
      if (this.matchState === 'PLAYING') {
        const controlledId = this.players[this.activePlayerIndex]?.player.id || '';
        this.ai.update(
          dt,
          this.players,
          this.ball,
          controlledId,
          (vel, isShot, kicker) => {
            this.ball.applyKick(vel, undefined, kicker.isHome ? 'home' : 'away', kicker.player.id);
            sound.playKick(isShot);
            if (!kicker.isHome) {
              if (isShot) {
                this.matchStats.awayShots++;
                if (Math.abs(vel.z) < 3.2 && vel.y < 2.44) this.matchStats.awayShotsOnTarget++;
              } else {
                this.matchStats.awayPassesCompleted++;
              }
            }
          },
          () => {
            sound.playTackle();
            this.matchStats.awayTackles++;
          }
        );
      }

      // 7. Update Stadium LED Banner & Crowd
      this.stadium.updateLedTexture(dt);
      this.stadium.updateCrowd(now / 1000, this.matchState === 'GOAL_CELEBRATION');

      // Update Stadium Electronic Scoreboard Display
      const minStr = Math.floor(this.matchTimeMinutes).toString().padStart(2, '0');
      const secStr = Math.floor((this.matchTimeMinutes % 1) * 60).toString().padStart(2, '0');
      const timeDisplay = `${minStr}:${secStr}`;
      const halfDisplay = this.half === 1 ? '1T' : '2T';
      this.stadium.updateScoreboardDisplay(
        this.homeTeam.shortName,
        this.awayTeam.shortName,
        this.matchStats.homeScore,
        this.matchStats.awayScore,
        timeDisplay,
        halfDisplay
      );

      // 8. Update Camera Tracking
      this.updateCamera(dt);

      // 9. Dispatch HUD update to React
      if (this.onHudUpdate) {
        const activePlayer = this.players[this.activePlayerIndex]?.player;
        const hudData: HudData = {
          homeScore: this.matchStats.homeScore,
          awayScore: this.matchStats.awayScore,
          matchTimeStr: timeDisplay,
          halfStr: halfDisplay,
          matchState: this.matchState,
          activePlayerName: activePlayer ? activePlayer.shortName : '',
          activePlayerNumber: activePlayer ? activePlayer.number : 0,
          activePlayerStamina: Math.round(this.activePlayerStamina),
          shotPowerPercent: Math.round(Math.min(1.0, this.shotChargeTime / 0.85) * 100),
          possessionHome: this.matchStats.homePossessionPercent,
          possessionAway: this.matchStats.awayPossessionPercent,
          radarPlayers: this.players.map((p, idx) => ({
            x: p.position.x,
            z: p.position.z,
            isHome: p.isHome,
            isControlled: idx === this.activePlayerIndex,
          })),
          radarBall: { x: this.ball.pos.x, z: this.ball.pos.z },
          goalCelebrationScorer: this.matchState === 'GOAL_CELEBRATION' ? this.latestScorerName : undefined,
          goalCelebrationTeamName: this.matchState === 'GOAL_CELEBRATION' ? this.latestScorerTeam : undefined,
        };
        this.onHudUpdate(hudData);
      }

      // 10. Render Scene
      this.renderer.render(this.scene, this.camera);

      // Software WebGL pacing guard per skill instructions
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public pauseMatch() {
    if (this.matchState === 'PLAYING') {
      this.matchState = 'PAUSED';
    }
  }

  public resumeMatch() {
    if (this.matchState === 'PAUSED') {
      this.matchState = 'PLAYING';
    }
  }

  public restartMatch() {
    this.matchStats = {
      homeScore: 0,
      awayScore: 0,
      homeShots: 0,
      awayShots: 0,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
      homePossessionPercent: 50,
      awayPossessionPercent: 50,
      homePassesCompleted: 0,
      awayPassesCompleted: 0,
      homeTackles: 0,
      awayTackles: 0,
      homeCorners: 0,
      awayCorners: 0,
      homeFouls: 0,
      awayFouls: 0,
      scorers: [],
    };
    this.matchTimeMinutes = 0;
    this.half = 1;
    this.homePossessionTicks = 50;
    this.awayPossessionTicks = 50;
    this.setupMatchPositions('home');
    this.matchState = 'KICKOFF_WAIT';
    sound.playWhistle('kickoff');
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    sound.stopCrowdAmbience();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
