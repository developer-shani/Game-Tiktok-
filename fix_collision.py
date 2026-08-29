import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

old_code = """        const anchors = computeRayAnchors(
          arenaCenter.x,
          arenaCenter.y,
          arenaRadius,
          owner.arcCenterAngle,
          owner.arcSpan,
          owner.rayCount
        );

        for (let k = 0; k < anchors.length; k++) {
          if (!owner.activeLines[k]) continue;

          const anchor = anchors[k];"""

new_code = """        for (let k = 0; k < owner.anchors.length; k++) {
          const anchor = owner.anchors[k];
          if (!anchor.active) continue;"""

content = content.replace(old_code, new_code)

old_cut = """              owner.activeLines[k] = false;
              pendingLineDestructions.push({
                owner,
                cutter,
                x: intersection.x,
                y: intersection.y,
              });
              
              const remaining = owner.activeLines.filter(Boolean).length;"""

new_cut = """              anchor.active = false;
              pendingLineDestructions.push({
                owner,
                cutter,
                x: intersection.x,
                y: intersection.y,
              });
              
              const remaining = owner.anchors.filter(a => a.active).length;"""

content = content.replace(old_cut, new_cut)

with open('lib/physics.ts', 'w') as f:
    f.write(content)
