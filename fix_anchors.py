import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

old_code = """        // Compute owner's current laser fan anchor points
        const anchors = computeRayAnchors(
          arenaCenter.x,
          arenaCenter.y,
          arenaRadius,
          owner.arcCenterAngle,
          owner.arcSpan,
          owner.rayCount
        );

        let cutAny = false;
        let lastHitX = owner.x;
        let lastHitY = owner.y;

        for (let i = 0; i < anchors.length; i++) {
          if (!owner.activeLines[i]) continue; // Line already destroyed

          const anchor = anchors[i];"""

new_code = """        let cutAny = false;
        let lastHitX = owner.x;
        let lastHitY = owner.y;

        for (let i = 0; i < owner.anchors.length; i++) {
          const anchor = owner.anchors[i];
          if (!anchor.active) continue; // Line already destroyed"""

content = content.replace(old_code, new_code)

old_cut_code = """              owner.activeLines[i] = false;

              pendingLineDestructions.push({
                owner,
                cutter,
                x: intersection.x,
                y: intersection.y,
              });

              // Check remaining lines
              const remaining = owner.activeLines.filter(Boolean).length;"""

new_cut_code = """              anchor.active = false;

              pendingLineDestructions.push({
                owner,
                cutter,
                x: intersection.x,
                y: intersection.y,
              });

              // Check remaining lines
              const remaining = owner.anchors.filter(a => a.active).length;"""

content = content.replace(old_cut_code, new_cut_code)

with open('lib/physics.ts', 'w') as f:
    f.write(content)
