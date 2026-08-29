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

    // Random velocity angle that gives dynamic initial trajectory
    const velAngle = Math.random() * Math.PI * 2;
    // Map settings speed (0-1000) to actual pixels per second. 
    // Say max 1000 = 800px/s. So speed/1000 * 800
    const mappedSpeed = Math.max(10, (config.speed / 1000) * 800); 
    const speed = mappedSpeed * (0.9 + Math.random() * 0.2);

    // Arc anchor position on rim (evenly spaced around perimeter)
    const arcCenterAngle = angleAroundCenter;

    const anchors: RayAnchor[] = [];
    for (let j = 0; j < config.rayCount; j++) {
      anchors.push({
        x: arenaCenter.x + Math.cos(arcCenterAngle) * arenaRadius,
        y: arenaCenter.y + Math.sin(arcCenterAngle) * arenaRadius,
        active: true,
        moved: false,
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

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Distance from arena center
      const dx = ball.x - arenaCenter.x;
      const dy = ball.y - arenaCenter.y;
      const dist = Math.hypot(dx, dy);

      const maxAllowedDist = arenaRadius - ball.radius;

      if (dist >= maxAllowedDist) {
        // Normal vector pointing inward from perimeter toward center (or outward)
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);

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

          // Move up to 3 active, un-moved anchors to the new bounce point
          let anchoredCount = 0;
          for (let i = 0; i < ball.anchors.length && anchoredCount < 3; i++) {
            const anchor = ball.anchors[i];
            if (anchor.active && !anchor.moved) {
              // Place the anchor exactly on the boundary wall
              anchor.x = arenaCenter.x + nx * arenaRadius;
              anchor.y = arenaCenter.y + ny * arenaRadius;
              anchor.moved = true;
              anchoredCount++;
            }
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

          // Ball cuts line if distance <= ball radius + line tolerance
          const lineThicknessTolerance = 2.0;
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
            break; // ONLY CUT ONE LINE PER PHYSICS STEP SO BALLS SURVIVE LONGER
          }
        }

        // If owner lost all active lines, it is eliminated
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
