import re

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

old_draw = """        for (let i = 0; i < ball.anchors.length; i++) {
          const anchor = ball.anchors[i];
          if (!anchor.active) continue;
          
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(anchor.x, anchor.y);
          ctx.strokeStyle = ball.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(anchor.x, anchor.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.9;
          ctx.stroke();
        }"""

new_draw = """        for (let i = 0; i < ball.anchors.length; i++) {
          const anchor = ball.anchors[i];
          if (!anchor.active) continue;
          
          // Draw Line
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(anchor.x, anchor.y);
          ctx.strokeStyle = ball.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(anchor.x, anchor.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.9;
          ctx.stroke();
          
          // Draw Anchor Point on boundary
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.globalAlpha = 1.0;
          ctx.fill();
        }"""

content = content.replace(old_draw, new_draw)

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)
