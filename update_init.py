import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

# Replace initializeBalls balls.push part
old_init = """    balls.push({
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
      arcCenterAngle,
      arcSpan: arcSpanRad,
      rayCount: config.rayCount,
      activeLines: new Array(config.rayCount).fill(true),
      kills: 0,
    });"""

new_init = """    const anchors: RayAnchor[] = [];
    for (let j = 0; j < config.rayCount; j++) {
      const angle = arcCenterAngle - arcSpanRad / 2 + (j / (config.rayCount - 1)) * arcSpanRad;
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
    });"""

content = content.replace(old_init, new_init)

with open('lib/physics.ts', 'w') as f:
    f.write(content)
