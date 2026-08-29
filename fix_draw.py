import re

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

old_draw = """        const anchors = computeRayAnchors(
          center.x,
          center.y,
          radius,
          ball.arcCenterAngle,
          ball.arcSpan,
          ball.rayCount
        );

        ctx.save();
        for (let i = 0; i < anchors.length; i++) {
          if (!ball.activeLines[i]) continue;
          const anchor = anchors[i];"""

new_draw = """        ctx.save();
        for (let i = 0; i < ball.anchors.length; i++) {
          const anchor = ball.anchors[i];
          if (!anchor.active) continue;"""

content = content.replace(old_draw, new_draw)

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)
