import re

# Update components/LaserBattleRoyale.tsx
with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

old_config = """const DEFAULT_CONFIG: SimulationConfig = {
  headerText: "DAY 7 UNTIL PINK WINS",
  speed: 300,
  bounciness: 1.0,
  gravity: 0,
  ballRadius: 15,
  competitors: 4,
  players: [
    { name: "Player 1", color: "#FF1493" },
    { name: "Player 2", color: "#00E676" },
    { name: "Player 3", color: "#00E5FF" },
    { name: "Player 4", color: "#FF3D00" },
    { name: "Player 5", color: "#E040FB" },
    { name: "Player 6", color: "#FFC400" },
  ],
  arcSpanDeg: 60,
  rayCount: 150,
};"""

new_config = """const DEFAULT_CONFIG: SimulationConfig = {
  headerText: "DAY 7 UNTIL PINK WINS",
  speed: 250,
  bounciness: 1.0,
  gravity: 0,
  ballRadius: 7,
  competitors: 4,
  players: [
    { name: "Player 1", color: "#FF1493" },
    { name: "Player 2", color: "#00E676" },
    { name: "Player 3", color: "#00E5FF" },
    { name: "Player 4", color: "#FF3D00" },
    { name: "Player 5", color: "#E040FB" },
    { name: "Player 6", color: "#FFC400" },
  ],
  arcSpanDeg: 60,
  rayCount: 250,
};"""

content = content.replace(old_config, new_config)

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)


# Update lib/physics.ts
with open('lib/physics.ts', 'r') as f:
    physics_content = f.read()

old_physics = """          if (distance <= cutter.radius + lineThicknessTolerance) {
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
          }"""

new_physics = """          if (distance <= cutter.radius + lineThicknessTolerance) {
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
          }"""

physics_content = physics_content.replace(old_physics, new_physics)

with open('lib/physics.ts', 'w') as f:
    f.write(physics_content)
