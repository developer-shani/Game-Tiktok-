import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

bounce_code = """          if (config.gravity === 0 && config.bounciness >= 0.99 && config.bounciness <= 1.01) {
            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            if (currentSpeed > 0) {
              ball.vx = (ball.vx / currentSpeed) * ball.speed;
              ball.vy = (ball.vy / currentSpeed) * ball.speed;
            }
          }"""

new_bounce_code = """          if (config.gravity === 0 && config.bounciness >= 0.99 && config.bounciness <= 1.01) {
            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            if (currentSpeed > 0) {
              ball.vx = (ball.vx / currentSpeed) * ball.speed;
              ball.vy = (ball.vy / currentSpeed) * ball.speed;
            }
          }

          // Move the oldest active anchor to the new bounce point
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

content = content.replace(bounce_code, new_bounce_code)

with open('lib/physics.ts', 'w') as f:
    f.write(content)
