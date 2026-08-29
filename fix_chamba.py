import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

old_bounce = """          // Move up to 3 active, un-moved anchors to the new bounce point
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

new_bounce = """          // Move up to 3 anchors to the new bounce point with a slight spread (chamba style)
          let anchoredCount = 0;
          const baseAngle = Math.atan2(ny, nx);
          const angleOffsets = [0, -0.06, 0.06]; // Spread angles: center, slightly left, slightly right
          
          let attempts = 0;
          while (attempts < ball.anchors.length && anchoredCount < 3) {
            const anchor = ball.anchors[ball.nextAnchorIndex];
            ball.nextAnchorIndex = (ball.nextAnchorIndex + 1) % ball.anchors.length;
            
            if (anchor.active) {
              const angle = baseAngle + angleOffsets[anchoredCount];
              anchor.x = arenaCenter.x + Math.cos(angle) * arenaRadius;
              anchor.y = arenaCenter.y + Math.sin(angle) * arenaRadius;
              anchoredCount++;
            }
            attempts++;
          }"""

content = content.replace(old_bounce, new_bounce)

with open('lib/physics.ts', 'w') as f:
    f.write(content)

