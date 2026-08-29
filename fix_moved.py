import re

with open('lib/types.ts', 'r') as f:
    content = f.read()

content = content.replace("active: boolean;", "active: boolean;\n  moved?: boolean;")

with open('lib/types.ts', 'w') as f:
    f.write(content)

with open('lib/physics.ts', 'r') as f:
    content = f.read()

old_init = """      anchors.push({
        x: arenaCenter.x + Math.cos(arcCenterAngle) * arenaRadius,
        y: arenaCenter.y + Math.sin(arcCenterAngle) * arenaRadius,
        active: true,
        id: j
      });"""

new_init = """      anchors.push({
        x: arenaCenter.x + Math.cos(arcCenterAngle) * arenaRadius,
        y: arenaCenter.y + Math.sin(arcCenterAngle) * arenaRadius,
        active: true,
        moved: false,
        id: j
      });"""

content = content.replace(old_init, new_init)

old_bounce = """          // Move up to 3 oldest active anchors to the new bounce point
          let attempts = 0;
          let anchoredCount = 0;
          while (attempts < ball.anchors.length && anchoredCount < 3) {
            const anchor = ball.anchors[ball.nextAnchorIndex];
            ball.nextAnchorIndex = (ball.nextAnchorIndex + 1) % ball.anchors.length;
            if (anchor.active) {
              // Place the anchor exactly on the boundary wall
              anchor.x = arenaCenter.x + nx * arenaRadius;
              anchor.y = arenaCenter.y + ny * arenaRadius;
              anchoredCount++;
            }
            attempts++;
          }"""

new_bounce = """          // Move up to 3 active, un-moved anchors to the new bounce point
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
          }"""

content = content.replace(old_bounce, new_bounce)

with open('lib/physics.ts', 'w') as f:
    f.write(content)

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

content = content.replace("rayCount: 40", "rayCount: 150")

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)
