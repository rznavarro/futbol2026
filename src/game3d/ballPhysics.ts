import * as THREE from 'three';
import { STADIUM_CONFIG } from './stadium';

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
}

export class Ball {
  public mesh: THREE.Group;
  public sphereMesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;
  public radius: number = 0.22; // Regulation size 5 soccer ball radius

  // Physics state
  public pos: THREE.Vector3 = new THREE.Vector3(0, 0.22, 0);
  public vel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public spin: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Ball possession & control
  public lastKickerTeam: 'home' | 'away' | null = null;
  public lastKickerPlayerId: string | null = null;
  public ownerPlayerId: string | null = null;

  // Goal & Event detection
  public inNet: boolean = false;
  public goalScoredFor: 'home' | 'away' | null = null;
  public outOfBounds: 'THROW_IN' | 'CORNER' | 'GOAL_KICK' | null = null;
  public outLocation: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.mesh = new THREE.Group();

    // 1. Procedural Soccer Ball Canvas Texture (Classic Pentagon & Hexagon Pattern)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Clean white base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 256);

    // Stitched pentagons and black patches
    ctx.fillStyle = '#111827';
    const drawPatch = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = x + Math.cos(ang) * r;
        const py = y + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Golden seam accent
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Stitched pattern layout
    const patchPositions = [
      [80, 70], [220, 50], [360, 70], [480, 50],
      [140, 180], [280, 190], [420, 180], [20, 190],
    ];
    patchPositions.forEach(([x, y]) => drawPatch(x, y, 28));

    // Panel seams
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(64 * i + 32, 128, 45, 0, Math.PI * 2);
      ctx.stroke();
    }

    const ballTexture = new THREE.CanvasTexture(canvas);
    ballTexture.colorSpace = THREE.SRGBColorSpace;

    const ballGeo = new THREE.SphereGeometry(this.radius, 32, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.35,
      metalness: 0.08,
    });

    this.sphereMesh = new THREE.Mesh(ballGeo, ballMat);
    this.sphereMesh.castShadow = true;
    this.sphereMesh.receiveShadow = true;
    this.mesh.add(this.sphereMesh);

    // 2. Soft Contact Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(0.7, 0.7);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.mesh.add(this.shadowMesh);
  }

  public reset(x: number = 0, z: number = 0) {
    this.pos.set(x, this.radius, z);
    this.vel.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this.inNet = false;
    this.goalScoredFor = null;
    this.outOfBounds = null;
    this.ownerPlayerId = null;
    this.updateMeshTransforms();
  }

  public applyKick(velocity: THREE.Vector3, spin?: THREE.Vector3, kickerTeam?: 'home' | 'away', kickerId?: string) {
    this.vel.copy(velocity);
    if (spin) {
      this.spin.copy(spin);
    } else {
      // Natural spin aligned with forward velocity
      this.spin.set(velocity.z * 1.5, 0, -velocity.x * 1.5);
    }
    if (kickerTeam) this.lastKickerTeam = kickerTeam;
    if (kickerId) this.lastKickerPlayerId = kickerId;
    this.ownerPlayerId = null;
  }

  public update(dt: number, onPostHit?: () => void, onNetHit?: () => void) {
    const gravity = -14.5;
    const airDrag = 0.988;
    const groundFriction = 0.94;
    const bounciness = 0.64;

    // Apply Gravity and Air Drag
    this.vel.y += gravity * dt;
    this.vel.x *= Math.pow(airDrag, dt * 60);
    this.vel.z *= Math.pow(airDrag, dt * 60);

    // Magnus Effect (Curving shots via spin)
    if (this.pos.y > this.radius * 1.1) {
      this.vel.x += this.spin.y * this.vel.z * 0.04 * dt;
      this.vel.z -= this.spin.y * this.vel.x * 0.04 * dt;
    }

    // Integrate Position
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    // Ground Collision
    if (this.pos.y <= this.radius) {
      this.pos.y = this.radius;
      if (Math.abs(this.vel.y) > 0.4) {
        this.vel.y = -this.vel.y * bounciness;
      } else {
        this.vel.y = 0;
      }
      this.vel.x *= Math.pow(groundFriction, dt * 60);
      this.vel.z *= Math.pow(groundFriction, dt * 60);

      // Stop microscopic jitter
      if (this.vel.lengthSq() < 0.005) {
        this.vel.set(0, 0, 0);
      }
    }

    // Goal & Post Collisions Check
    this.checkGoalAndPosts(onPostHit, onNetHit);

    // Boundary Out of Bounds Check (if not in net and no goal already scored)
    if (!this.inNet && !this.goalScoredFor && !this.outOfBounds) {
      this.checkPitchBounds();
    }

    // Sphere Rolling Rotation Visual
    const speed = this.vel.length();
    if (speed > 0.05) {
      const rollAxis = new THREE.Vector3(this.vel.z, 0, -this.vel.x).normalize();
      const angle = (speed * dt) / this.radius;
      this.sphereMesh.rotateOnAxis(rollAxis, angle);
    }

    this.updateMeshTransforms();
  }

  private checkGoalAndPosts(onPostHit?: () => void, onNetHit?: () => void) {
    const halfL = STADIUM_CONFIG.pitchLength / 2; // 32
    const gw = STADIUM_CONFIG.goalWidth; // 7.32 (half is 3.66)
    const gh = STADIUM_CONFIG.goalHeight; // 2.44
    const gd = STADIUM_CONFIG.goalDepth; // 2.2
    const postR = 0.08;

    // Left Goal (Home goal defense, Away scores here) => X around -32
    // Right Goal (Away goal defense, Home scores here) => X around +32

    // 1. Goal Detection (Ball crosses line into net between posts)
    if (!this.goalScoredFor) {
      if (this.pos.x > halfL && this.pos.x < halfL + gd && Math.abs(this.pos.z) < gw / 2 - this.radius && this.pos.y < gh) {
        // Ball crossed into RIGHT goal => Home scored!
        this.goalScoredFor = 'home';
        this.inNet = true;
        if (onNetHit) onNetHit();
      } else if (this.pos.x < -halfL && this.pos.x > -halfL - gd && Math.abs(this.pos.z) < gw / 2 - this.radius && this.pos.y < gh) {
        // Ball crossed into LEFT goal => Away scored!
        this.goalScoredFor = 'away';
        this.inNet = true;
        if (onNetHit) onNetHit();
      }
    }

    // If ball is inside net, bounce/decelerate on net back and sides
    if (this.inNet) {
      // Right net boundary
      if (this.pos.x >= halfL + gd - this.radius) {
        this.pos.x = halfL + gd - this.radius;
        this.vel.x = -Math.abs(this.vel.x) * 0.2;
        this.vel.multiplyScalar(0.7);
      }
      // Left net boundary
      if (this.pos.x <= -halfL - gd + this.radius) {
        this.pos.x = -halfL - gd + this.radius;
        this.vel.x = Math.abs(this.vel.x) * 0.2;
        this.vel.multiplyScalar(0.7);
      }
      // Net sides
      if (Math.abs(this.pos.z) >= gw / 2 - this.radius) {
        this.pos.z = Math.sign(this.pos.z) * (gw / 2 - this.radius);
        this.vel.z = -this.vel.z * 0.3;
      }
      // Net ceiling
      if (this.pos.y >= gh - this.radius) {
        this.pos.y = gh - this.radius;
        this.vel.y = -Math.abs(this.vel.y) * 0.2;
      }
      return;
    }

    // 2. Crossbar & Posts Collision Detection
    const checkPostHit = (postX: number, postZ: number) => {
      const dx = this.pos.x - postX;
      const dz = this.pos.z - postZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < postR + this.radius && this.pos.y < gh) {
        // Bounce off post
        const normal = new THREE.Vector3(dx, 0, dz).normalize();
        this.vel.reflect(normal).multiplyScalar(0.75);
        this.pos.x = postX + normal.x * (postR + this.radius + 0.01);
        this.pos.z = postZ + normal.z * (postR + this.radius + 0.01);
        if (onPostHit) onPostHit();
      }
    };

    // Right Goal Posts & Crossbar
    checkPostHit(halfL, -gw / 2);
    checkPostHit(halfL, gw / 2);
    // Left Goal Posts & Crossbar
    checkPostHit(-halfL, -gw / 2);
    checkPostHit(-halfL, gw / 2);

    // Crossbar collision (top horizontal bar)
    const checkCrossbar = (barX: number) => {
      if (Math.abs(this.pos.x - barX) < postR + this.radius && Math.abs(this.pos.z) < gw / 2) {
        if (Math.abs(this.pos.y - gh) < postR + this.radius) {
          const dy = this.pos.y - gh;
          const dx = this.pos.x - barX;
          const normal = new THREE.Vector3(dx, dy, 0).normalize();
          this.vel.reflect(normal).multiplyScalar(0.7);
          this.pos.y = gh + normal.y * (postR + this.radius + 0.01);
          if (onPostHit) onPostHit();
        }
      }
    };
    checkCrossbar(halfL);
    checkCrossbar(-halfL);
  }

  private checkPitchBounds() {
    const halfL = STADIUM_CONFIG.pitchLength / 2; // 32
    const halfW = STADIUM_CONFIG.pitchWidth / 2;  // 21

    // Out over sidelines (touchlines) => THROW-IN
    if (Math.abs(this.pos.z) > halfW + this.radius) {
      this.outOfBounds = 'THROW_IN';
      this.outLocation.copy(this.pos);
      this.outLocation.z = Math.sign(this.pos.z) * halfW;
    }
    // Out over end lines (goal lines) without goal
    else if (Math.abs(this.pos.x) > halfL + this.radius) {
      const isRightEnd = this.pos.x > 0;
      if (isRightEnd) {
        // Ball went past right goal line
        if (this.lastKickerTeam === 'away') {
          // Attacking team kicked out => GOAL KICK for Home
          this.outOfBounds = 'GOAL_KICK';
          this.outLocation.set(halfL - 6, 0.22, 0);
        } else {
          // Defending team kicked out => CORNER for Away
          this.outOfBounds = 'CORNER';
          this.outLocation.set(halfL, 0.22, Math.sign(this.pos.z) * halfW);
        }
      } else {
        // Ball went past left goal line
        if (this.lastKickerTeam === 'home') {
          // Attacking team kicked out => GOAL KICK for Away
          this.outOfBounds = 'GOAL_KICK';
          this.outLocation.set(-halfL + 6, 0.22, 0);
        } else {
          // Defending team kicked out => CORNER for Home
          this.outOfBounds = 'CORNER';
          this.outLocation.set(-halfL, 0.22, Math.sign(this.pos.z) * halfW);
        }
      }
    }
  }

  private updateMeshTransforms() {
    this.sphereMesh.position.copy(this.pos);

    // Ground Contact Shadow scaling based on height above ground
    this.shadowMesh.position.x = this.pos.x;
    this.shadowMesh.position.z = this.pos.z;
    const height = Math.max(0, this.pos.y - this.radius);
    const shadowScale = Math.max(0.2, 1.0 - height * 0.18);
    this.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.65 - height * 0.12);
  }
}
