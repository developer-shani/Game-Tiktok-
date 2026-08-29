import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

# Fix Initialization (All anchors start at the exact same point)
old_init = """    const anchors: RayAnchor[] = [];
    for (let j = 0; j < config.rayCount; j++) {
      const angle = arcCenterAngle - arcSpanRad / 2 + (j / (config.rayCount - 1)) * arcSpanRad;
      anchors.push({
        x: arenaCenter.x + Math.cos(angle) * arenaRadius,
        y: arenaCenter.y + Math.sin(angle) * arenaRadius,
        active: true,
        id: j
      });
    }"""

new_init = """    const anchors: RayAnchor[] = [];
    for (let j = 0; j < config.rayCount; j++) {
      anchors.push({
        x: arenaCenter.x + Math.cos(arcCenterAngle) * arenaRadius,
        y: arenaCenter.y + Math.sin(arcCenterAngle) * arenaRadius,
        active: true,
        id: j
      });
    }"""

content = content.replace(old_init, new_init)

# Fix Bounce (Anchor up to 3 lines per bounce)
old_bounce = """          // Move the oldest active anchor to the new bounce point
          let attempts = 0;
          while (attempts < ball.anchors.length) {
            const anchor = ball.anchors[ball.nextAnchorIndex];
            ball.nextAnchorIndex = (ball.nextAnchorIndex + 1) % ball.anchors.length;
            if (anchor.active) {
              // Place the anchor exactly on the boundary wall
              anchor.x = arenaCenter.x + nx * arenaRadius;
              anchor.y = arenaCenter.y + ny * arenaRadius;
              break;
            }
            attempts++;
          }"""

new_bounce = """          // Move up to 3 oldest active anchors to the new bounce point
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

content = content.replace(old_bounce, new_bounce)

with open('lib/physics.ts', 'w') as f:
    f.write(content)
