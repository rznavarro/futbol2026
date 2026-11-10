import * as THREE from 'three';
import { Player, Team } from '../types/game';

export class PlayerModel {
  public group: THREE.Group;
  public player: Player;
  public team: Team;
  public isHome: boolean;

  // Joints and parts for procedural kinematics
  private torso!: THREE.Mesh;
  private headGroup!: THREE.Group;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private contactShadow!: THREE.Mesh;
  private indicatorChevron!: THREE.Mesh;
  private selectionRing!: THREE.Mesh;

  // Animation states
  public animTime: number = Math.random() * 10;
  public isRunning: boolean = false;
  public isKicking: boolean = false;
  private kickProgress: number = 0;
  public isTackling: boolean = false;
  private tackleProgress: number = 0;
  public isControlled: boolean = false;

  // Kinematic parameters
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public facingAngle: number = 0;
  public targetFacingAngle: number = 0;

  constructor(player: Player, team: Team, isHome: boolean) {
    this.player = player;
    this.team = team;
    this.isHome = isHome;
    this.group = new THREE.Group();

    this.buildProceduralBody();
    this.createIndicator();
  }

  private buildProceduralBody() {
    const isGK = !!this.player.isGoalkeeper;
    const kit = isGK ? this.team.gkKit : this.team.homeKit;

    // Materials with varied roughness and physical properties
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.player.skinTone),
      roughness: 0.65,
      metalness: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.player.hairColor),
      roughness: 0.85,
      metalness: 0.1,
    });

    const jerseyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(kit.jersey),
      roughness: 0.5,
      metalness: 0.15,
    });

    const shortsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(kit.shorts),
      roughness: 0.55,
      metalness: 0.1,
    });

    const socksMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(kit.socks),
      roughness: 0.6,
      metalness: 0.1,
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: isGK ? 0xff6600 : 0x1a1a1a,
      roughness: 0.35,
      metalness: 0.4,
    });

    const studMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Golden boot studs
      roughness: 0.2,
      metalness: 0.8,
    });

    // 1. Torso & Jersey (0.8m above ground)
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.52, 10);
    this.torso = new THREE.Mesh(torsoGeo, jerseyMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.group.add(this.torso);

    // Number Canvas Badge on Jersey Back
    const numCanvas = document.createElement('canvas');
    numCanvas.width = 128;
    numCanvas.height = 128;
    const numCtx = numCanvas.getContext('2d')!;
    numCtx.fillStyle = kit.jersey;
    numCtx.fillRect(0, 0, 128, 128);
    numCtx.fillStyle = this.team.numberColor || '#ffffff';
    numCtx.font = 'bold 84px Montserrat, system-ui, sans-serif';
    numCtx.textAlign = 'center';
    numCtx.textBaseline = 'middle';
    numCtx.fillText(`${this.player.number}`, 64, 64);
    const numTex = new THREE.CanvasTexture(numCanvas);
    numTex.colorSpace = THREE.SRGBColorSpace;
    const badgeGeo = new THREE.PlaneGeometry(0.26, 0.26);
    const badgeMat = new THREE.MeshBasicMaterial({ map: numTex });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.05, -0.21);
    badge.rotation.y = Math.PI;
    this.torso.add(badge);

    // Shorts Hip Base
    const hipsGeo = new THREE.CylinderGeometry(0.21, 0.23, 0.24, 10);
    const hips = new THREE.Mesh(hipsGeo, shortsMat);
    hips.position.y = -0.32;
    hips.castShadow = true;
    this.torso.add(hips);

    // 2. Head & Neck
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.42, 0);

    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 8);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = -0.05;
    this.headGroup.add(neck);

    const headGeo = new THREE.SphereGeometry(0.15, 12, 10);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Hair Model
    const hairGeo = new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.03;
    hair.rotation.x = -0.15;
    this.headGroup.add(hair);

    this.torso.add(this.headGroup);

    // 3. Legs & Boots (Left & Right)
    const createLeg = (isLeft: boolean) => {
      const legGroup = new THREE.Group();
      const xOff = isLeft ? -0.11 : 0.11;
      legGroup.position.set(xOff, 0.78, 0);

      // Thigh (Shorts sleeve + upper leg)
      const thighGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.38, 8);
      const thigh = new THREE.Mesh(thighGeo, shortsMat);
      thigh.position.y = -0.18;
      thigh.castShadow = true;
      legGroup.add(thigh);

      // Shin / Sock
      const shinGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.38, 8);
      const shin = new THREE.Mesh(shinGeo, socksMat);
      shin.position.y = -0.48;
      shin.castShadow = true;
      legGroup.add(shin);

      // Soccer Cleat Boot
      const bootGeo = new THREE.BoxGeometry(0.11, 0.09, 0.24);
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(0, -0.68, 0.04);
      boot.castShadow = true;
      legGroup.add(boot);

      // Studs accent
      const studGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6);
      const s1 = new THREE.Mesh(studGeo, studMat);
      s1.position.set(0, -0.73, 0.08);
      legGroup.add(s1);

      return legGroup;
    };

    this.leftLegGroup = createLeg(true);
    this.rightLegGroup = createLeg(false);
    this.group.add(this.leftLegGroup);
    this.group.add(this.rightLegGroup);

    // 4. Arms (Left & Right)
    const createArm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      const xOff = isLeft ? -0.27 : 0.27;
      armGroup.position.set(xOff, 1.25, 0);

      // Shoulder / Jersey sleeve
      const shoulderGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.22, 8);
      const shoulder = new THREE.Mesh(shoulderGeo, jerseyMat);
      shoulder.position.y = -0.09;
      shoulder.castShadow = true;
      armGroup.add(shoulder);

      // Forearm with skin tone (or goalkeeper gloves!)
      const forearmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8);
      const forearm = new THREE.Mesh(forearmGeo, isGK ? socksMat : skinMat);
      forearm.position.y = -0.28;
      forearm.castShadow = true;
      armGroup.add(forearm);

      // Hand or Glove
      const handGeo = new THREE.SphereGeometry(isGK ? 0.08 : 0.055, 8, 8);
      const hand = new THREE.Mesh(handGeo, isGK ? socksMat : skinMat);
      hand.position.y = -0.42;
      armGroup.add(hand);

      return armGroup;
    };

    this.leftArmGroup = createArm(true);
    this.rightArmGroup = createArm(false);
    this.group.add(this.leftArmGroup);
    this.group.add(this.rightArmGroup);

    // 5. Radial Ground Contact Shadow (flush at ground)
    const shadowGeo = new THREE.PlaneGeometry(0.95, 0.95);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.015;
    this.group.add(this.contactShadow);

    // Apply player height scale
    this.group.scale.set(this.player.height, this.player.height, this.player.height);
  }

  // --- Active Player Indicator (Chevron + Ground Ring) ---
  private createIndicator() {
    // 1. Floating Chevron Arrow Above Head
    const chevronGeo = new THREE.ConeGeometry(0.18, 0.32, 4);
    const chevronMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: false,
    });
    this.indicatorChevron = new THREE.Mesh(chevronGeo, chevronMat);
    this.indicatorChevron.rotation.x = Math.PI; // point down
    this.indicatorChevron.position.set(0, 2.15, 0);
    this.indicatorChevron.visible = false;
    this.group.add(this.indicatorChevron);

    // 2. Glowing Ring on Turf
    const ringGeo = new THREE.RingGeometry(0.48, 0.58, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.02;
    this.selectionRing.visible = false;
    this.group.add(this.selectionRing);
  }

  public setControlled(controlled: boolean) {
    this.isControlled = controlled;
    this.indicatorChevron.visible = controlled;
    this.selectionRing.visible = controlled;
  }

  public triggerKick() {
    this.isKicking = true;
    this.kickProgress = 0;
  }

  public triggerTackle() {
    this.isTackling = true;
    this.tackleProgress = 0;
  }

  // --- Animation Kinematics Update ---
  public update(dt: number) {
    // Smooth angle interpolation
    let diff = this.targetFacingAngle - this.facingAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facingAngle += diff * Math.min(1, dt * 14);
    this.group.rotation.y = this.facingAngle;

    // Position sync
    this.group.position.copy(this.position);

    // Floating indicator bounce
    if (this.isControlled) {
      this.indicatorChevron.position.y = 2.15 + Math.sin(this.animTime * 6) * 0.08;
      this.selectionRing.rotation.z += dt * 1.5;
    }

    // 1. Kick Animation
    if (this.isKicking) {
      this.kickProgress += dt * 5.0; // Fast 0.2s kick
      if (this.kickProgress >= 1.0) {
        this.isKicking = false;
        this.kickProgress = 0;
      } else {
        const kickAngle = Math.sin(this.kickProgress * Math.PI) * 1.1;
        this.rightLegGroup.rotation.x = -kickAngle;
        this.torso.rotation.x = kickAngle * 0.25;
        this.leftArmGroup.rotation.x = -kickAngle * 0.4;
        return;
      }
    }

    // 2. Slide Tackle Animation
    if (this.isTackling) {
      this.tackleProgress += dt * 3.0; // 0.33s slide
      if (this.tackleProgress >= 1.0) {
        this.isTackling = false;
        this.tackleProgress = 0;
      } else {
        const slide = Math.sin(this.tackleProgress * Math.PI);
        this.torso.position.y = 1.05 - slide * 0.55;
        this.torso.rotation.x = slide * 0.8;
        this.rightLegGroup.rotation.x = -slide * 1.3;
        this.leftLegGroup.rotation.x = slide * 0.6;
        return;
      }
    }

    // 3. Running & Idle Animation Cycle
    const speed = this.velocity.length();
    this.isRunning = speed > 0.4;

    if (this.isRunning) {
      const runSpeed = Math.min(16, speed * 2.2);
      this.animTime += dt * runSpeed;

      const legSwing = Math.sin(this.animTime) * 0.65;
      const armSwing = Math.sin(this.animTime) * 0.6;
      const bounce = Math.abs(Math.sin(this.animTime)) * 0.06;

      this.leftLegGroup.rotation.x = legSwing;
      this.rightLegGroup.rotation.x = -legSwing;

      this.leftArmGroup.rotation.x = -armSwing;
      this.rightArmGroup.rotation.x = armSwing;

      this.torso.position.y = 1.05 + bounce;
      this.torso.rotation.x = 0.15; // Athletic forward lean
      this.torso.rotation.y = Math.sin(this.animTime) * 0.08;
    } else {
      // Idle Breathing & Slight Stance
      this.animTime += dt * 2.0;
      const breath = Math.sin(this.animTime) * 0.015;

      this.leftLegGroup.rotation.x = 0;
      this.rightLegGroup.rotation.x = 0;
      this.leftArmGroup.rotation.x = Math.sin(this.animTime) * 0.04;
      this.rightArmGroup.rotation.x = -Math.sin(this.animTime) * 0.04;
      this.torso.position.y = 1.05 + breath;
      this.torso.rotation.x = 0;
      this.torso.rotation.y = 0;
    }
  }
}
