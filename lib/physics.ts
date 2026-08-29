import { Ball, RayAnchor, Particle, Shockwave, SimulationConfig } from './types';

// Preset Neon Palette
export const BALL_PRESETS = [
  { name: 'Pink', color: '#FF1493', glowColor: '#FF69B4', secondaryColor: '#FFB6C1' },
  { name: 'Cyan Blue', color: '#00E5FF', glowColor: '#38BDF8', secondaryColor: '#BAE6FD' },
  { name: 'Neon Green', color: '#00E676', glowColor: '#4ADE80', secondaryColor: '#BBF7D0' },
  { name: 'Vibrant Orange', color: '#FF9100', glowColor: '#FB923C', secondaryColor: '#FED7AA' },
  { name: 'Electric Purple', color: '#D500F9', glowColor: '#C084FC', secondaryColor: '#E9D5FF' },
  { name: 'Golden Yellow', color: '#FFD600', glowColor: '#FACC15', secondaryColor: '#FEF08A' },
  { name: 'Crimson Red', color: '#FF1744', glowColor: '#F87171', secondaryColor: '#FECACA' },
  { name: 'Aqua Mint', color: '#00F5D4', glowColor: '#2DD4BF', secondaryColor: '#99F6E4' },
];

// Distance from point (px, py) to line segment [(x1, y1), (x2, y2)]
export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { distance: number; closestX: number; closestY: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return {
      distance: Math.hypot(px - x1, py - y1),
      closestX: x1,
      closestY: y1,
    };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return {
    distance: Math.hypot(px - closestX, py - closestY),
    closestX,
    closestY,
  };
}

// Compute anchor points on the circular perimeter for a ball's laser fan

// Initialize balls inside arena
export function initializeBalls(
  arenaCenter: { x: number; y: number },
  arenaRadius: number,
  config: SimulationConfig
): Ball[] {
  const balls: Ball[] = [];
  const arcSpanRad = (config.arcSpanDeg * Math.PI) / 180;
  const offsetAngle = Math.random() * Math.PI * 2;
  const numCompetitors = Math.min(config.competitors, config.players.length);

  for (let i = 0; i < numCompetitors; i++) {
    const playerConfig = config.players[i];
    
    // Find preset or fallback
    const preset = BALL_PRESETS.find(p => p.color === playerConfig.color) || {
      name: playerConfig.name,
      color: playerConfig.color,
      glowColor: playerConfig.color,
      secondaryColor: playerConfig.color,
    };
    
    preset.name = playerConfig.name || preset.name;
    
    const angleAroundCenter = offsetAngle + (i * 2 * Math.PI) / numCompetitors;

    // Spawn distance: distributed within inner 55% of arena radius
    const spawnDist = arenaRadius * (0.25 + Math.random() * 0.35);
    const x = arenaCenter.x + Math.cos(angleAroundCenter) * spawnDist;
    const y = arenaCenter.y + Math.sin(angleAroundCenter) * spawnDist;

    // Assign strategic AI personalities to balls for varied gameplay:
    // Builder: Focuses on banking off walls, building massive lines, and staying clear of central dogfights
    // Hunter: Aggressive interceptor that hunts enemy strings
    // Balanced: Dynamic mixture of perimeter charging and calculated strikes
    const personality: 'builder' | 'hunter' | 'balanced' = 
      i % 3 === 0 ? 'builder' : (i % 3 === 1 ? 'balanced' : 'hunter');

    // Direction calculation:
    // Builders spawn with outward wall-seeking trajectories so they immediately hit perimeter and power up
    let velAngle: number;
    if (personality === 'builder') {
      // Direct toward outer perimeter
      velAngle = angleAroundCenter + (Math.random() - 0.5) * 0.5;
    } else if (personality === 'balanced') {
      velAngle = angleAroundCenter + (Math.random() > 0.5 ? 1.2 : -1.2);
    } else {
      velAngle = Math.random() * Math.PI * 2;
    }

    // Map settings speed (0-1000) to actual pixels per second. 
    // Say max 1000 = 800px/s. So speed/1000 * 800
    const mappedSpeed = Math.max(10, (config.speed / 1000) * 800); 
    const speed = mappedSpeed * (0.9 + Math.random() * 0.2);

    // Arc anchor position on rim (evenly spaced around perimeter)
    const arcCenterAngle = angleAroundCenter;

    const count = Math.max(1, config.initialLines ?? 5);
    const anchors: RayAnchor[] = [];
    for (let j = 0; j < count; j++) {
      // Doubled spacing between initial lines
      const offset = (j - (count - 1) / 2) * 0.07;
      const angle = arcCenterAngle + offset;
      anchors.push({
        x: arenaCenter.x + Math.cos(angle) * arenaRadius,
        y: arenaCenter.y + Math.sin(angle) * arenaRadius,
        active: true,
        id: j
      });
    }

    balls.push({
      id: `ball-${i}-${Date.now()}`,
      name: preset.name,
      color: preset.color,
      glowColor: preset.glowColor,
      secondaryColor: preset.secondaryColor,
      x,
      y,
      vx: Math.cos(velAngle) * speed,
      vy: Math.sin(velAngle) * speed,
      radius: config.ballRadius,
      speed,
      alive: true,
      anchors,
      nextAnchorIndex: 0,
      kills: 0,
      aiPersonality: personality,
      spawnTime: Date.now(),
    });
  }

  return balls;
}

export interface StepResult {
  eliminated: Array<{ victim: Ball; killer: Ball; impactX: number; impactY: number }>;
  bounces: Array<{ ball: Ball; x: number; y: number; normalX: number; normalY: number }>;
  lineDestructions: Array<{ owner: Ball; cutter: Ball; x: number; y: number }>;
}

// Physics Sub-stepping simulation step to avoid tunneling at high speeds
export function stepSimulation(
  balls: Ball[],
  arenaCenter: { x: number; y: number },
  arenaRadius: number,
  dt: number,
  config: SimulationConfig
): StepResult {
  const result: StepResult = {
    eliminated: [],
    bounces: [],
    lineDestructions: [],
  };

  // We no longer loop substeps here, the caller handles fixed timestep accumulation
  // 1. Move balls and handle perimeter bounce
  for (const ball of balls) {
      if (!ball.alive) continue;

      // Apply Gravity
      ball.vy += config.gravity * dt;

      // Distance from arena center
      const dx = ball.x - arenaCenter.x;
      const dy = ball.y - arenaCenter.y;
      const dist = Math.hypot(dx, dy);

      // Smart Tactical Guidance (Strategy Algorithm):
      // When a ball is a "builder" OR is low on lines (danger zone), it tactically angles toward perimeter boundaries
      // to farm lines and avoid immediate death, while hunters and high-power balls engage in mid-field cuts.
      const activeLineCount = ball.anchors.filter((a) => a.active).length;
      const needsPower = activeLineCount <= 4 || ball.aiPersonality === 'builder';
      
      if (needsPower && dist > 5) {
        // Subtle radial bias nudging ball toward wall to bank lines
        const radialForce = 45; // Gentle acceleration outward toward perimeter
        const rx = dx / dist;
        const ry = dy / dist;
        ball.vx += rx * radialForce * dt;
        ball.vy += ry * radialForce * dt;

        // Maintain consistent natural speed
        const curSpd = Math.hypot(ball.vx, ball.vy);
        if (curSpd > 0) {
          ball.vx = (ball.vx / curSpd) * ball.speed;
          ball.vy = (ball.vy / curSpd) * ball.speed;
        }
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Updated distance after step
      const nextDx = ball.x - arenaCenter.x;
      const nextDy = ball.y - arenaCenter.y;
      const nextDist = Math.hypot(nextDx, nextDy);

      const maxAllowedDist = arenaRadius - ball.radius;

      if (nextDist >= maxAllowedDist) {
        // Normal vector pointing inward from perimeter toward center (or outward)
        const nx = nextDx / (nextDist || 1);
        const ny = nextDy / (nextDist || 1);

        // Clamp position back inside perimeter
        ball.x = arenaCenter.x + nx * maxAllowedDist;
        ball.y = arenaCenter.y + ny * maxAllowedDist;

        // Dot product: v . n
        const vDotN = ball.vx * nx + ball.vy * ny;

        // Reflect velocity vector if moving outward
        if (vDotN > 0) {
          ball.vx = (ball.vx - 2 * vDotN * nx) * config.bounciness;
          ball.vy = (ball.vy - 2 * vDotN * ny) * config.bounciness;

          // If gravity is 0 and bounciness is 1, preserve exact speed (legacy behavior)
          if (config.gravity === 0 && config.bounciness >= 0.99 && config.bounciness <= 1.01) {
            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            if (currentSpeed > 0) {
              ball.vx = (ball.vx / currentSpeed) * ball.speed;
              ball.vy = (ball.vy / currentSpeed) * ball.speed;
            }
          }

          // Add 3 brand new lines/anchors attached to the new bounce point on the wall
          // Doubled distance between the 3 lines (2x spread)
          const baseAngle = Math.atan2(ny, nx);
          const angleOffsets = [-0.10, 0, 0.10]; // Doubled spread angles (2x wider distance between 3 lines)
          
          for (let k = 0; k < 3; k++) {
            const angle = baseAngle + angleOffsets[k];
            ball.anchors.push({
              x: arenaCenter.x + Math.cos(angle) * arenaRadius,
              y: arenaCenter.y + Math.sin(angle) * arenaRadius,
              active: true,
              id: ball.anchors.length,
            });
          }

          result.bounces.push({
            ball,
            x: ball.x,
            y: ball.y,
            normalX: nx,
            normalY: ny,
          });
        }
      }
    }

    // 1.5. Ball-to-Ball Collisions
    const activeBallsForCollisions = balls.filter((b) => b.alive);
    for (let i = 0; i < activeBallsForCollisions.length; i++) {
      for (let j = i + 1; j < activeBallsForCollisions.length; j++) {
        const b1 = activeBallsForCollisions[i];
        const b2 = activeBallsForCollisions[j];

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist) {
          // Resolve overlap
          const overlap = minDist - dist;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Move balls apart evenly
          b1.x -= nx * (overlap / 2);
          b1.y -= ny * (overlap / 2);
          b2.x += nx * (overlap / 2);
          b2.y += ny * (overlap / 2);

          // Calculate normal velocities
          const v1n = b1.vx * nx + b1.vy * ny;
          const v2n = b2.vx * nx + b2.vy * ny;

          // If they are moving toward each other, reflect their velocities along the normal
          if (v1n - v2n > 0) {
            const diff = (v1n - v2n) * (1 + config.bounciness) / 2;

            b1.vx -= nx * diff;
            b1.vy -= ny * diff;
            b2.vx += nx * diff;
            b2.vy += ny * diff;

            // If gravity is 0 and bounciness is 1, preserve exact speed (legacy behavior)
            if (config.gravity === 0 && config.bounciness >= 0.99 && config.bounciness <= 1.01) {
              const currentSpeed1 = Math.hypot(b1.vx, b1.vy);
              if (currentSpeed1 > 0) {
                b1.vx = (b1.vx / currentSpeed1) * b1.speed;
                b1.vy = (b1.vy / currentSpeed1) * b1.speed;
              }
              const currentSpeed2 = Math.hypot(b2.vx, b2.vy);
              if (currentSpeed2 > 0) {
                b2.vx = (b2.vx / currentSpeed2) * b2.speed;
                b2.vy = (b2.vy / currentSpeed2) * b2.speed;
              }
            }

            // Record bounce for visual/audio effects
            result.bounces.push({
              ball: b1,
              x: b1.x + nx * b1.radius,
              y: b1.y + ny * b1.radius,
              normalX: -nx,
              normalY: -ny,
            });
          }
        }
      }
    }

    // 2. Collision & Elimination Check: Ball A (cutter) against active Ball B's (owner's) laser strings
    const pendingEliminations: Map<string, { victim: Ball; killer: Ball; impactX: number; impactY: number }> = new Map();
    const pendingLineDestructions: Array<{ owner: Ball; cutter: Ball; x: number; y: number }> = [];

    const activeBalls = balls.filter((b) => b.alive);
    const lineThicknessTolerance = 3.0;

    for (const cutter of activeBalls) {
      for (const owner of activeBalls) {
        if (cutter.id === owner.id) continue; // Ball doesn't cut its own strings
        if (pendingEliminations.has(owner.id)) continue; // Owner already eliminated this frame

        let cutAny = false;
        let lastHitX = owner.x;
        let lastHitY = owner.y;

        for (let i = 0; i < owner.anchors.length; i++) {
          const anchor = owner.anchors[i];
          if (!anchor.active) continue; // Line already destroyed
          const { distance, closestX, closestY } = distanceToSegment(
            cutter.x,
            cutter.y,
            owner.x,
            owner.y,
            anchor.x,
            anchor.y
          );

          if (distance <= cutter.radius + lineThicknessTolerance) {
            anchor.active = false;
            cutAny = true;
            lastHitX = closestX;
            lastHitY = closestY;

            pendingLineDestructions.push({
              owner,
              cutter,
              x: closestX,
              y: closestY,
            });
          }
        }

        // If owner lost all active lines, eliminate owner
        if (cutAny && !owner.anchors.some((a) => a.active)) {
          pendingEliminations.set(owner.id, {
            victim: owner,
            killer: cutter,
            impactX: lastHitX,
            impactY: lastHitY,
          });
        }
      }
    }
    
    result.lineDestructions.push(...pendingLineDestructions);

    // Apply eliminations from this substep
    for (const elim of pendingEliminations.values()) {
      if (elim.victim.alive) {
        elim.victim.alive = false;
        elim.victim.eliminatedAt = Date.now();
        elim.victim.eliminatedBy = elim.killer.name;
        elim.killer.kills += 1;
        result.eliminated.push(elim);
      }
    }

  return result;
}

// Create explosion particles when a ball is eliminated
export function createEliminationParticles(
  x: number,
  y: number,
  color: string,
  secondaryColor: string
): { particles: Particle[]; shockwave: Shockwave } {
  const particles: Particle[] = [];
  const particleCount = 45;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 6.5;
    const isSpark = Math.random() > 0.3;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: isSpark ? 2 + Math.random() * 3 : 4 + Math.random() * 5,
      color: Math.random() > 0.4 ? color : secondaryColor,
      alpha: 1,
      life: 0,
      maxLife: 30 + Math.random() * 25,
      type: isSpark ? 'spark' : 'debris',
    });
  }

  const shockwave: Shockwave = {
    x,
    y,
    radius: 5,
    maxRadius: 65,
    color,
    alpha: 0.9,
  };

  return { particles, shockwave };
}

// Create subtle sparks on rim bounce
export function createBounceSparks(x: number, y: number, normalX: number, normalY: number, color: string): Particle[] {
  const sparks: Particle[] = [];
  const count = 6;
  const baseAngle = Math.atan2(-normalY, -normalX); // Pointing inward

  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 1.2;
    const angle = baseAngle + spread;
    const speed = 1 + Math.random() * 3.5;

    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 2,
      color,
      alpha: 0.8,
      life: 0,
      maxLife: 15 + Math.random() * 10,
      type: 'spark',
    });
  }

  return sparks;
}
