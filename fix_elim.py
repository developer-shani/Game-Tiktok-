import re

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

bad_code = """              stepResult.eliminated.forEach((elim) => {
                particlesRef.current.push(...createEliminationParticles(elim.impactX, elim.impactY, elim.victim.color));
                shockwavesRef.current.push({
                  x: elim.impactX,
                  y: elim.impactY,
                  radius: 10,
                  maxRadius: 150,
                  color: elim.victim.color,
                  alpha: 1.0,
                });
              });"""

good_code = """              stepResult.eliminated.forEach((elim) => {
                const { particles, shockwave } = createEliminationParticles(
                  elim.victim.x,
                  elim.victim.y,
                  elim.victim.color,
                  elim.victim.secondaryColor
                );
                particlesRef.current.push(...particles);
                shockwavesRef.current.push(shockwave);
              });"""

content = content.replace(bad_code, good_code)

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)
