import * as THREE from 'three';
import { PlayerModel } from './playerModel';
import { Ball } from './ballPhysics';
import { STADIUM_CONFIG } from './stadium';
import { MatchDifficulty } from '../types/game';

export class AiController {
  private passCooldown: number = 0;
  private shotCooldown: number = 0;
  private tackleCooldown: number = 0;

  // Base formation anchor spots for 5v5 (GK, DEF, MID, FWD, ST)
  // Scaled for pitch length 64 (X: -32 to +32), width 42 (Z: -21 to +21)
  // Away team attacks towards -X (Home goal) and defends +X (Away goal).
  // Home team attacks towards +X (Away goal) and defends -X (Home goal).
  private homeFormation = [
    { x: -30.0, z: 0.0 },   // GK
    { x: -18.0, z: 0.0 },   // DEF
    { x: -6.0,  z: -6.0 },  // MID
    { x: -4.0,  z: 7.0 },   // FWD
    { x: 8.0,   z: 0.0 },   // ST
  ];

  private awayFormation = [
    { x: 30.0, z: 0.0 },    // GK
    { x: 18.0, z: 0.0 },    // DEF
    { x: 6.0,  z: 6.0 },    // MID
    { x: 4.0,  z: -7.0 },   // FWD
    { x: -8.0, z: 0.0 },    // ST
  ];

  constructor(public difficulty: MatchDifficulty = 'MEDIO') {}

  public update(
    dt: number,
    players: PlayerModel[],
    ball: Ball,
    activeControlledPlayerId: string,
    onKickBall: (velocity: THREE.Vector3, isShot: boolean, kicker: PlayerModel) => void,
    onTackle: (tackler: PlayerModel) => void
  ) {
    this.passCooldown = Math.max(0, this.passCooldown - dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    this.tackleCooldown = Math.max(0, this.tackleCooldown - dt);

    const diffSpeedMultiplier = this.difficulty === 'FACIL' ? 0.78 : this.difficulty === 'LEYENDA' ? 1.08 : 0.92;
    const diffReaction = this.difficulty === 'FACIL' ? 0.65 : this.difficulty === 'LEYENDA' ? 1.15 : 0.9;

    // Separate players by team
    const homePlayers = players.filter((p) => p.isHome);
    const awayPlayers = players.filter((p) => !p.isHome);

    let ballPossessor: PlayerModel | null = null;
    let closestDistToBall = Infinity;
    let closestPlayer: PlayerModel | null = null;

    for (const p of players) {
      const d = p.position.distanceTo(ball.pos);
      if (d < closestDistToBall) {
        closestDistToBall = d;
        closestPlayer = p;
      }
      if (d < 1.3 && ball.pos.y < 1.0) {
        ballPossessor = p;
      }
    }

    const isAwayPossession = ballPossessor !== null && !ballPossessor.isHome;
    const isHomePossession = ballPossessor !== null && ballPossessor.isHome;

    // Process each player
    players.forEach((p, index) => {
      // Do not override player if user is actively controlling this specific player
      if (p.player.id === activeControlledPlayerId) {
        return;
      }

      const isGK = !!p.player.isGoalkeeper;
      const teamFormation = p.isHome ? this.homeFormation : this.awayFormation;
      const roleIndex = p.isHome ? index : index - 5;
      const baseAnchor = teamFormation[Math.max(0, Math.min(4, roleIndex))] || { x: 0, z: 0 };

      // 1. GOALKEEPER AI BEHAVIOR
      if (isGK) {
        this.updateGoalkeeper(dt, p, ball, onKickBall);
        return;
      }

      // 2. OUTFIELD PLAYER AI BEHAVIOR
      const moveTarget = new THREE.Vector3();
      const hasBall = ballPossessor === p;
      const playerSpeed = (p.player.stats.speed / 100) * 8.2 * diffSpeedMultiplier;

      if (hasBall) {
        // --- BALL CARRIER BEHAVIOR ---
        const attackingGoalX = p.isHome ? 32 : -32;
        const distToGoal = Math.abs(attackingGoalX - p.position.x);

        // Turn towards goal or open space
        const goalTarget = new THREE.Vector3(attackingGoalX, 0, Math.max(-3, Math.min(3, p.position.z)));

        // Decision: SHOOT, PASS, or DRIBBLE
        if (distToGoal < 22 && this.shotCooldown <= 0) {
          // SHOOT on goal!
          this.shotCooldown = 1.2 / diffReaction;
          p.triggerKick();
          const shotDir = new THREE.Vector3(attackingGoalX - p.position.x, 1.2 + Math.random() * 0.8, -p.position.z * 0.6).normalize();
          const shotPower = 20 + (p.player.stats.shooting / 100) * 10;
          onKickBall(shotDir.multiplyScalar(shotPower), true, p);
          return;
        }

        // Check for pass to open teammate ahead
        const teammates = (p.isHome ? homePlayers : awayPlayers).filter((t) => t !== p && !t.player.isGoalkeeper);
        const forwardTeammate = teammates.find((t) => (p.isHome ? t.position.x > p.position.x + 3 : t.position.x < p.position.x - 3));

        if (forwardTeammate && Math.random() < 0.03 * diffReaction && this.passCooldown <= 0) {
          // PASS to open teammate
          this.passCooldown = 1.0;
          p.triggerKick();
          const passDir = new THREE.Vector3().subVectors(forwardTeammate.position, p.position).normalize();
          passDir.y = 0.2;
          const passPower = 15;
          onKickBall(passDir.multiplyScalar(passPower), false, p);
          return;
        }

        // DRIBBLE forward towards goal while keeping ball in front
        moveTarget.copy(goalTarget);
        // Guide the ball along with player
        const forward = new THREE.Vector3(Math.cos(p.facingAngle), 0, Math.sin(p.facingAngle));
        ball.pos.x = p.position.x + forward.x * 0.7;
        ball.pos.z = p.position.z + forward.z * 0.7;
        ball.pos.y = ball.radius;
        ball.vel.copy(forward).multiplyScalar(playerSpeed);
      } else {
        // --- OFF-BALL AI BEHAVIOR ---
        const myTeamHasBall = p.isHome ? isHomePossession : isAwayPossession;
        const isClosestToBall = closestPlayer === p;

        if (myTeamHasBall) {
          // ATTACKING SUPPORT: Move into open forward space
          const forwardShift = p.isHome ? 6.0 : -6.0;
          moveTarget.set(
            baseAnchor.x + forwardShift + (ball.pos.x - baseAnchor.x) * 0.35,
            0,
            baseAnchor.z + (ball.pos.z - baseAnchor.z) * 0.2
          );
        } else {
          // DEFENDING: Press ball if closest, or maintain defensive cover
          if (isClosestToBall || p.position.distanceTo(ball.pos) < 10) {
            // PRESS BALL CARRIER
            moveTarget.copy(ball.pos);

            // Attempt Tackle if in range
            const dist = p.position.distanceTo(ball.pos);
            if (dist < 1.4 && this.tackleCooldown <= 0) {
              this.tackleCooldown = 1.5;
              p.triggerTackle();
              onTackle(p);

              // Dispossess ball towards clear angle
              const tackleDir = new THREE.Vector3(p.isHome ? 1 : -1, 0.2, (Math.random() - 0.5)).normalize();
              onKickBall(tackleDir.multiplyScalar(12), false, p);
            }
          } else {
            // COVER GOAL & DEFENSIVE ZONE
            const defendGoalX = p.isHome ? -30 : 30;
            moveTarget.set(
              baseAnchor.x * 0.7 + (ball.pos.x + defendGoalX) * 0.2,
              0,
              baseAnchor.z + ball.pos.z * 0.25
            );
          }
        }
      }

      // Move player towards moveTarget
      const toTarget = new THREE.Vector3().subVectors(moveTarget, p.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      if (dist > 0.5) {
        toTarget.normalize();
        p.velocity.copy(toTarget).multiplyScalar(playerSpeed);
        p.position.x += p.velocity.x * dt;
        p.position.z += p.velocity.z * dt;
        p.targetFacingAngle = Math.atan2(toTarget.z, toTarget.x);
      } else {
        p.velocity.set(0, 0, 0);
      }

      // Constrain within pitch boundaries
      p.position.x = Math.max(-31, Math.min(31, p.position.x));
      p.position.z = Math.max(-20, Math.min(20, p.position.z));
      p.update(dt);
    });
  }

  // --- GOALKEEPER AI ---
  private updateGoalkeeper(
    dt: number,
    gk: PlayerModel,
    ball: Ball,
    onKickBall: (velocity: THREE.Vector3, isShot: boolean, kicker: PlayerModel) => void
  ) {
    const goalX = gk.isHome ? -31.5 : 31.5;
    const targetZ = Math.max(-3.2, Math.min(3.2, ball.pos.z * 0.45));
    const targetX = goalX + (gk.isHome ? Math.min(2.5, Math.max(0, ball.pos.x * 0.08 + 1.2)) : Math.max(-2.5, Math.min(0, ball.pos.x * 0.08 - 1.2)));

    // Smooth position tracking
    gk.position.x += (targetX - gk.position.x) * Math.min(1, dt * 7);
    gk.position.z += (targetZ - gk.position.z) * Math.min(1, dt * 7);
    gk.targetFacingAngle = gk.isHome ? 0 : Math.PI;

    // Goalkeeper Save / Scoop Check
    const distToBall = gk.position.distanceTo(ball.pos);
    if (distToBall < 1.8 && ball.pos.y < 2.0 && !ball.inNet) {
      // Goalkeeper blocks / catches shot!
      gk.triggerKick();
      ball.vel.set(0, 0, 0);
      // Clear ball upfield
      const clearDir = new THREE.Vector3(gk.isHome ? 1 : -1, 0.6, (Math.random() - 0.5) * 0.4).normalize();
      onKickBall(clearDir.multiplyScalar(18), false, gk);
    }

    gk.update(dt);
  }
}
