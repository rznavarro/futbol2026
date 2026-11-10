import * as THREE from 'three';

export interface StadiumConfig {
  pitchLength: number; // 64
  pitchWidth: number;  // 42
  goalWidth: number;   // 7.32
  goalHeight: number;  // 2.44
  goalDepth: number;   // 2.2
}

export const STADIUM_CONFIG: StadiumConfig = {
  pitchLength: 64,
  pitchWidth: 42,
  goalWidth: 7.32,
  goalHeight: 2.44,
  goalDepth: 2.2,
};

export class Stadium {
  public group: THREE.Group;
  public scoreboardCanvas!: HTMLCanvasElement;
  public scoreboardTexture!: THREE.CanvasTexture;
  public ledTexture!: THREE.CanvasTexture;
  private ledCanvas!: HTMLCanvasElement;
  private ledCtx!: CanvasRenderingContext2D;
  private ledOffset: number = 0;
  public netMeshLeft!: THREE.Mesh;
  public netMeshRight!: THREE.Mesh;
  private crowdMesh!: THREE.InstancedMesh;
  private crowdCount: number = 240;
  private crowdOriginalPositions: THREE.Vector3[] = [];

  constructor(private renderer: THREE.WebGLRenderer) {
    this.group = new THREE.Group();
    this.createPitch();
    this.createGoals();
    this.createCornerFlags();
    this.createStands();
    this.createCrowd();
    this.createFloodlights();
    this.createLedBoards();
    this.createScoreboard();
  }

  // --- Procedural Pitch Texture with Mowed Stripes & Crisp Lines ---
  private createPitch() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1344;
    const ctx = canvas.getContext('2d')!;

    const L = STADIUM_CONFIG.pitchLength;
    const W = STADIUM_CONFIG.pitchWidth;
    const pxPerMeter = canvas.width / (L + 6); // Add boundary buffer
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    const toX = (x: number) => offsetX + x * pxPerMeter;
    const toY = (z: number) => offsetY + z * pxPerMeter;

    // Grass stripes (alternating greens)
    const stripeWidth = 4 * pxPerMeter;
    const numStripes = Math.ceil(canvas.width / stripeWidth);
    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#276823' : '#225d1e';
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
    }

    // Grass fine noise texture overlay
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw Regulation Soccer Pitch White Lines
    ctx.strokeStyle = '#f8fdf8';
    ctx.lineWidth = 0.12 * pxPerMeter;
    ctx.lineCap = 'square';

    const halfL = L / 2;
    const halfW = W / 2;

    // Outer Touchlines & Goal lines
    ctx.strokeRect(toX(-halfL), toY(-halfW), L * pxPerMeter, W * pxPerMeter);

    // Halfway Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(-halfW));
    ctx.lineTo(toX(0), toY(halfW));
    ctx.stroke();

    // Center Circle (Radius 6m)
    ctx.beginPath();
    ctx.arc(toX(0), toY(0), 6 * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.fillStyle = '#f8fdf8';
    ctx.beginPath();
    ctx.arc(toX(0), toY(0), 0.28 * pxPerMeter, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Areas (10m deep, 20m wide)
    const penDepth = 10;
    const penHalfW = 10;

    // Left Penalty Box
    ctx.strokeRect(toX(-halfL), toY(-penHalfW), penDepth * pxPerMeter, penHalfW * 2 * pxPerMeter);
    // Right Penalty Box
    ctx.strokeRect(toX(halfL - penDepth), toY(-penHalfW), penDepth * pxPerMeter, penHalfW * 2 * pxPerMeter);

    // Goal Areas (Goal boxes: 4m deep, 12m wide)
    const goalBoxDepth = 4;
    const goalBoxHalfW = 6;
    ctx.strokeRect(toX(-halfL), toY(-goalBoxHalfW), goalBoxDepth * pxPerMeter, goalBoxHalfW * 2 * pxPerMeter);
    ctx.strokeRect(toX(halfL - goalBoxDepth), toY(-goalBoxHalfW), goalBoxDepth * pxPerMeter, goalBoxHalfW * 2 * pxPerMeter);

    // Penalty Spots (7m from goal line)
    ctx.beginPath();
    ctx.arc(toX(-halfL + 7), toY(0), 0.22 * pxPerMeter, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(toX(halfL - 7), toY(0), 0.22 * pxPerMeter, 0, Math.PI * 2);
    ctx.fill();

    // Penalty D Arcs
    ctx.beginPath();
    ctx.arc(toX(-halfL + 7), toY(0), 5 * pxPerMeter, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(toX(halfL - 7), toY(0), 5 * pxPerMeter, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();

    // Corner Arcs (Radius 1m)
    const drawArc = (cx: number, cy: number, start: number, end: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 1 * pxPerMeter, start, end);
      ctx.stroke();
    };
    drawArc(toX(-halfL), toY(-halfW), 0, Math.PI / 2);
    drawArc(toX(halfL), toY(-halfW), Math.PI / 2, Math.PI);
    drawArc(toX(-halfL), toY(halfW), -Math.PI / 2, 0);
    drawArc(toX(halfL), toY(halfW), Math.PI, Math.PI * 1.5);

    const pitchTexture = new THREE.CanvasTexture(canvas);
    pitchTexture.colorSpace = THREE.SRGBColorSpace;
    pitchTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    pitchTexture.wrapS = THREE.ClampToEdgeWrapping;
    pitchTexture.wrapT = THREE.ClampToEdgeWrapping;

    const pitchGeo = new THREE.PlaneGeometry(L + 6, W + 6);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: pitchTexture,
      roughness: 0.88,
      metalness: 0.05,
    });

    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.position.y = 0;
    pitchMesh.receiveShadow = true;
    this.group.add(pitchMesh);

    // Extended outer grass run-off border
    const outerGeo = new THREE.PlaneGeometry(L + 28, W + 24);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x1a4a17,
      roughness: 0.95,
      metalness: 0.0,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.y = -0.01;
    outerMesh.receiveShadow = true;
    this.group.add(outerMesh);
  }

  // --- Procedural Net Texture ---
  private createNetTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.0)';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(240, 240, 245, 0.75)';
    ctx.lineWidth = 2.5;

    // Diamond net pattern
    const step = 16;
    for (let x = -128; x <= 256; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 128, 128);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 128);
      ctx.lineTo(x + 128, 0);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 4);
    return texture;
  }

  // --- 3D Goals ---
  private createGoals() {
    const L = STADIUM_CONFIG.pitchLength;
    const halfL = L / 2;
    const gw = STADIUM_CONFIG.goalWidth;
    const gh = STADIUM_CONFIG.goalHeight;
    const gd = STADIUM_CONFIG.goalDepth;
    const postRadius = 0.07;

    const postMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.25,
      metalness: 0.65,
    });

    const netTexture = this.createNetTexture();
    const netMat = new THREE.MeshStandardMaterial({
      map: netTexture,
      transparent: true,
      opacity: 0.72,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const createSingleGoal = (isLeft: boolean) => {
      const goalGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;

      // Vertical Posts
      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, gh, 16);
      const post1 = new THREE.Mesh(postGeo, postMat);
      post1.position.set(0, gh / 2, -gw / 2);
      post1.castShadow = true;
      goalGroup.add(post1);

      const post2 = new THREE.Mesh(postGeo, postMat);
      post2.position.set(0, gh / 2, gw / 2);
      post2.castShadow = true;
      goalGroup.add(post2);

      // Top Crossbar
      const barGeo = new THREE.CylinderGeometry(postRadius, postRadius, gw, 16);
      const bar = new THREE.Mesh(barGeo, postMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(0, gh, 0);
      bar.castShadow = true;
      goalGroup.add(bar);

      // Depth Support Posts (back frame)
      const depthSupportGeo = new THREE.CylinderGeometry(postRadius * 0.7, postRadius * 0.7, gd, 12);
      const support1 = new THREE.Mesh(depthSupportGeo, postMat);
      support1.rotation.z = Math.PI / 2;
      support1.position.set(xSign * (gd / 2), 0.05, -gw / 2);
      goalGroup.add(support1);

      const support2 = new THREE.Mesh(depthSupportGeo, postMat);
      support2.rotation.z = Math.PI / 2;
      support2.position.set(xSign * (gd / 2), 0.05, gw / 2);
      goalGroup.add(support2);

      // Top Angled Back Bar
      const topBackBar = new THREE.Mesh(barGeo, postMat);
      topBackBar.rotation.x = Math.PI / 2;
      topBackBar.position.set(xSign * gd, gh * 0.85, 0);
      goalGroup.add(topBackBar);

      // Top diagonal supports
      const diagLen = Math.sqrt(gd * gd + (gh * 0.15) * (gh * 0.15));
      const diagGeo = new THREE.CylinderGeometry(postRadius * 0.6, postRadius * 0.6, diagLen, 12);
      const diag1 = new THREE.Mesh(diagGeo, postMat);
      diag1.rotation.z = xSign * (Math.PI / 2 - 0.15);
      diag1.position.set(xSign * (gd / 2), gh * 0.92, -gw / 2);
      goalGroup.add(diag1);

      const diag2 = new THREE.Mesh(diagGeo, postMat);
      diag2.rotation.z = xSign * (Math.PI / 2 - 0.15);
      diag2.position.set(xSign * (gd / 2), gh * 0.92, gw / 2);
      goalGroup.add(diag2);

      // Net Mesh Box
      const netBoxGeo = new THREE.BoxGeometry(gd, gh, gw);
      const netMesh = new THREE.Mesh(netBoxGeo, netMat);
      netMesh.position.set(xSign * (gd / 2), gh / 2, 0);
      goalGroup.add(netMesh);

      if (isLeft) {
        this.netMeshLeft = netMesh;
      } else {
        this.netMeshRight = netMesh;
      }

      goalGroup.position.set(xSign * halfL, 0, 0);
      return goalGroup;
    };

    this.group.add(createSingleGoal(true));
    this.group.add(createSingleGoal(false));
  }

  // --- Corner Flags with moving cloth ---
  private createCornerFlags() {
    const halfL = STADIUM_CONFIG.pitchLength / 2;
    const halfW = STADIUM_CONFIG.pitchWidth / 2;
    const corners = [
      [-halfL, -halfW],
      [halfL, -halfW],
      [-halfL, halfW],
      [halfL, halfW],
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6, side: THREE.DoubleSide });

    corners.forEach(([x, z]) => {
      const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 0.75, z);
      pole.castShadow = true;
      this.group.add(pole);

      const flagGeo = new THREE.PlaneGeometry(0.35, 0.25);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(x + (x > 0 ? -0.18 : 0.18), 1.35, z);
      flag.rotation.y = Math.PI / 4;
      this.group.add(flag);
    });
  }

  // --- LED Perimeter Advertising Boards ---
  private createLedBoards() {
    this.ledCanvas = document.createElement('canvas');
    this.ledCanvas.width = 1024;
    this.ledCanvas.height = 128;
    this.ledCtx = this.ledCanvas.getContext('2d')!;

    this.updateLedTexture(0);

    this.ledTexture = new THREE.CanvasTexture(this.ledCanvas);
    this.ledTexture.wrapS = THREE.RepeatWrapping;
    this.ledTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.ledTexture.repeat.set(4, 1);

    const boardMat = new THREE.MeshBasicMaterial({
      map: this.ledTexture,
    });

    const boardHeight = 0.95;
    const L = STADIUM_CONFIG.pitchLength + 4;
    const W = STADIUM_CONFIG.pitchWidth + 4;

    // North & South LED lines
    const nsGeo = new THREE.BoxGeometry(L, boardHeight, 0.15);
    const northBoard = new THREE.Mesh(nsGeo, boardMat);
    northBoard.position.set(0, boardHeight / 2, -(W / 2));
    this.group.add(northBoard);

    const southBoard = new THREE.Mesh(nsGeo, boardMat);
    southBoard.position.set(0, boardHeight / 2, W / 2);
    southBoard.rotation.y = Math.PI;
    this.group.add(southBoard);

    // East & West LED lines (with gap for goals)
    const sideSegLen = (W - STADIUM_CONFIG.goalWidth - 3) / 2;
    const ewGeo = new THREE.BoxGeometry(0.15, boardHeight, sideSegLen);

    const createSideSegment = (x: number, z: number) => {
      const board = new THREE.Mesh(ewGeo, boardMat);
      board.position.set(x, boardHeight / 2, z);
      this.group.add(board);
    };

    const sideZ = (STADIUM_CONFIG.goalWidth + 3) / 2 + sideSegLen / 2;
    createSideSegment(-(L / 2), -sideZ);
    createSideSegment(-(L / 2), sideZ);
    createSideSegment(L / 2, -sideZ);
    createSideSegment(L / 2, sideZ);
  }

  public updateLedTexture(dt: number) {
    this.ledOffset += dt * 45;
    const ctx = this.ledCtx;
    const w = this.ledCanvas.width;
    const h = this.ledCanvas.height;

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    // Dynamic animated sports banners
    const sponsors = [
      { text: '⚽ FÚTBOL 2026', bg: '#0052cc', color: '#ffffff' },
      { text: '★ ULTRA STRIKE', bg: '#d41132', color: '#ffd700' },
      { text: 'TURBO SPRINT PC', bg: '#00875a', color: '#ffffff' },
      { text: 'CHAMPIONS LEAGUE 2026', bg: '#172b4d', color: '#00c7e6' },
      { text: 'PRO FOOTBALL ENGINE', bg: '#ff5630', color: '#ffffff' },
    ];

    const bannerW = 280;
    const totalW = bannerW * sponsors.length;
    sponsors.forEach((sp, idx) => {
      const x = ((idx * bannerW - this.ledOffset) % totalW + totalW) % totalW;
      ctx.fillStyle = sp.bg;
      ctx.fillRect(x, 6, bannerW - 12, h - 12);
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 6, bannerW - 12, h - 12);

      ctx.fillStyle = sp.color;
      ctx.font = 'bold 24px Montserrat, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sp.text, x + (bannerW - 12) / 2, h / 2);
    });

    if (this.ledTexture) {
      this.ledTexture.needsUpdate = true;
    }
  }

  // --- Grandstands Architecture ---
  private createStands() {
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      roughness: 0.8,
      metalness: 0.2,
    });
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x0f3460,
      roughness: 0.6,
      metalness: 0.3,
    });

    const L = STADIUM_CONFIG.pitchLength + 16;
    const W = STADIUM_CONFIG.pitchWidth + 14;

    // Terraced stepped grandstands (North & South)
    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const stepH = 1.4;
      const stepD = 3.0;
      const y = t * stepH + 0.8;
      const zNorth = -(W / 2 + t * stepD);
      const zSouth = W / 2 + t * stepD;

      const stepGeo = new THREE.BoxGeometry(L, stepH, stepD);
      const nStep = new THREE.Mesh(stepGeo, standMat);
      nStep.position.set(0, y, zNorth);
      nStep.receiveShadow = true;
      this.group.add(nStep);

      const sStep = new THREE.Mesh(stepGeo, standMat);
      sStep.position.set(0, y, zSouth);
      sStep.receiveShadow = true;
      this.group.add(sStep);

      // Seat row accents
      const seatGeo = new THREE.BoxGeometry(L - 2, 0.35, 1.2);
      const nSeat = new THREE.Mesh(seatGeo, seatMat);
      nSeat.position.set(0, y + stepH / 2 + 0.18, zNorth);
      this.group.add(nSeat);

      const sSeat = new THREE.Mesh(seatGeo, seatMat);
      sSeat.position.set(0, y + stepH / 2 + 0.18, zSouth);
      this.group.add(sSeat);
    }

    // East & West Grandstands (behind goals)
    for (let t = 0; t < tiers; t++) {
      const stepH = 1.4;
      const stepD = 3.0;
      const y = t * stepH + 0.8;
      const xWest = -(L / 2 + t * stepD);
      const xEast = L / 2 + t * stepD;

      const stepGeo = new THREE.BoxGeometry(stepD, stepH, W + 12);
      const wStep = new THREE.Mesh(stepGeo, standMat);
      wStep.position.set(xWest, y, 0);
      wStep.receiveShadow = true;
      this.group.add(wStep);

      const eStep = new THREE.Mesh(stepGeo, standMat);
      eStep.position.set(xEast, y, 0);
      eStep.receiveShadow = true;
      this.group.add(eStep);
    }

    // Stadium Outer Canopy & Perimeter Walls (to prevent floating in void)
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0c1220,
      roughness: 0.4,
      metalness: 0.7,
    });
    const canopyNorth = new THREE.Mesh(new THREE.BoxGeometry(L + 16, 1.2, 14), canopyMat);
    canopyNorth.position.set(0, 14, -(W / 2 + 10));
    this.group.add(canopyNorth);

    const canopySouth = new THREE.Mesh(new THREE.BoxGeometry(L + 16, 1.2, 14), canopyMat);
    canopySouth.position.set(0, 14, W / 2 + 10);
    this.group.add(canopySouth);
  }

  // --- Instanced 3D Crowd Spectators ---
  private createCrowd() {
    const crowdGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.9, 6);
    const crowdMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.1,
    });

    this.crowdMesh = new THREE.InstancedMesh(crowdGeo, crowdMat, this.crowdCount);
    this.crowdMesh.castShadow = false;
    this.crowdMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colors = [
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#004d98'), // Blue
      new THREE.Color('#dc052d'), // Red
      new THREE.Color('#6cabdd'), // Sky Blue
      new THREE.Color('#c8102e'), // Crimson
      new THREE.Color('#e5b800'), // Yellow
      new THREE.Color('#222222'), // Dark
    ];

    const W = STADIUM_CONFIG.pitchWidth + 14;
    const L = STADIUM_CONFIG.pitchLength + 10;
    let idx = 0;

    // Distribute spectators in rows along stands
    for (let row = 0; row < 4; row++) {
      const zOffset = W / 2 + row * 2.8 + 1.2;
      const yOffset = row * 1.4 + 1.6;
      const spectatorsPerRow = 30;
      for (let i = 0; i < spectatorsPerRow; i++) {
        if (idx >= this.crowdCount) break;
        const xOffset = -L / 2 + 3 + (i / (spectatorsPerRow - 1)) * (L - 6);
        const side = idx % 2 === 0 ? 1 : -1;
        const pos = new THREE.Vector3(xOffset + (Math.random() - 0.5) * 0.4, yOffset, side * (zOffset + (Math.random() - 0.5) * 0.3));

        dummy.position.copy(pos);
        dummy.scale.set(0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2);
        dummy.updateMatrix();

        this.crowdMesh.setMatrixAt(idx, dummy.matrix);
        this.crowdMesh.setColorAt(idx, colors[Math.floor(Math.random() * colors.length)]);
        this.crowdOriginalPositions.push(pos.clone());
        idx++;
      }
    }

    this.crowdMesh.instanceMatrix.needsUpdate = true;
    if (this.crowdMesh.instanceColor) this.crowdMesh.instanceColor.needsUpdate = true;
    this.group.add(this.crowdMesh);
  }

  // --- Dynamic Crowd Celebration Animation ---
  public updateCrowd(time: number, isCheering: boolean) {
    if (!this.crowdMesh) return;
    const dummy = new THREE.Object3D();
    const freq = isCheering ? 8.0 : 2.0;
    const amp = isCheering ? 0.35 : 0.08;

    for (let i = 0; i < this.crowdCount; i++) {
      const orig = this.crowdOriginalPositions[i];
      if (!orig) continue;
      const bounce = Math.sin(time * freq + i * 0.3) * amp;
      dummy.position.set(orig.x, orig.y + Math.max(0, bounce), orig.z);
      dummy.scale.set(1, 1 + bounce * 0.5, 1);
      dummy.updateMatrix();
      this.crowdMesh.setMatrixAt(i, dummy.matrix);
    }
    this.crowdMesh.instanceMatrix.needsUpdate = true;
  }

  // --- 4 Massive Stadium Floodlight Pylons ---
  private createFloodlights() {
    const halfL = STADIUM_CONFIG.pitchLength / 2 + 12;
    const halfW = STADIUM_CONFIG.pitchWidth / 2 + 10;
    const pylonHeight = 18;

    const corners = [
      [-halfL, -halfW],
      [halfL, -halfW],
      [-halfL, halfW],
      [halfL, halfW],
    ];

    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.4,
      metalness: 0.8,
    });
    const lampGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfffaea,
    });

    corners.forEach(([x, z], i) => {
      // Lattice tower leg
      const towerGeo = new THREE.CylinderGeometry(0.4, 0.9, pylonHeight, 8);
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(x, pylonHeight / 2, z);
      tower.castShadow = true;
      this.group.add(tower);

      // Light Panel Head (grid of flood lamps)
      const headGeo = new THREE.BoxGeometry(4.5, 3.2, 0.6);
      const head = new THREE.Mesh(headGeo, towerMat);
      head.position.set(x, pylonHeight + 1.2, z);

      // Angle head towards center field
      head.lookAt(0, 0, 0);
      this.group.add(head);

      // Glowing lens surface
      const lensGeo = new THREE.PlaneGeometry(4.2, 2.9);
      const lens = new THREE.Mesh(lensGeo, lampGlowMat);
      lens.position.set(0, 0, 0.32);
      head.add(lens);

      // Directional Key Light from Corner Pylon (only 2 cast shadows to stay within ≤3 shadow caster limit)
      const light = new THREE.DirectionalLight(0xfff6e6, i === 0 ? 2.2 : 1.2);
      light.position.set(x, pylonHeight + 1.5, z);
      light.target.position.set(0, 0, 0);

      if (i === 0) {
        // Main Key Light shadow caster
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 5;
        light.shadow.camera.far = 120;
        const d = 38;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.bias = -0.0004;
        light.shadow.normalBias = 0.02;
      }
      this.group.add(light);
      this.group.add(light.target);
    });
  }

  // --- Giant Electronic Stadium Scoreboard in Stands ---
  private createScoreboard() {
    this.scoreboardCanvas = document.createElement('canvas');
    this.scoreboardCanvas.width = 1024;
    this.scoreboardCanvas.height = 384;
    this.scoreboardTexture = new THREE.CanvasTexture(this.scoreboardCanvas);
    this.scoreboardTexture.colorSpace = THREE.SRGBColorSpace;

    this.updateScoreboardDisplay('MADRID', 'BARCELONA', 0, 0, "00:00", '1T');

    const screenGeo = new THREE.PlaneGeometry(16, 6);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.scoreboardTexture,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    // Mount above south grandstand
    screen.position.set(0, 11, -(STADIUM_CONFIG.pitchWidth / 2 + 18));
    screen.rotation.y = 0;
    this.group.add(screen);

    // Scoreboard Frame & Bezel
    const frameGeo = new THREE.BoxGeometry(17, 7, 0.8);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e17,
      roughness: 0.5,
      metalness: 0.7,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(screen.position);
    frame.position.z -= 0.42;
    this.group.add(frame);
  }

  public updateScoreboardDisplay(
    home: string,
    away: string,
    homeScore: number,
    awayScore: number,
    timeStr: string,
    halfStr: string
  ) {
    if (!this.scoreboardCanvas) return;
    const ctx = this.scoreboardCanvas.getContext('2d')!;
    const w = this.scoreboardCanvas.width;
    const h = this.scoreboardCanvas.height;

    // Carbon / LED matrix background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Neon Header
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 36px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FÚTBOL 2026 ★ COPA DE ÉLITE', w / 2, 54);

    // Timer & Period
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText(`⏱ ${timeStr}  [${halfStr}]`, w / 2, 105);

    // Team 1 (Home)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(home.toUpperCase(), w / 2 - 120, 210);

    // Big Scores
    ctx.font = '900 110px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(`${homeScore}`, w / 2 - 60, 230);
    ctx.fillStyle = '#64748b';
    ctx.fillText('-', w / 2, 225);
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`${awayScore}`, w / 2 + 60, 230);

    // Team 2 (Away)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(away.toUpperCase(), w / 2 + 120, 210);

    // Footer ticker
    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESTADIO INTERCONTINENTAL · TRANSMISIÓN OFICIAL 4K', w / 2, 330);

    if (this.scoreboardTexture) {
      this.scoreboardTexture.needsUpdate = true;
    }
  }
}
