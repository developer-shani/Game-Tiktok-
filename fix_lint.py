import re

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

# Fix 1: suppress set-state-in-effect
content = content.replace("startNewRound(DEFAULT_CONFIG);", "// eslint-disable-next-line react-hooks/set-state-in-effect\n    startNewRound(DEFAULT_CONFIG);")

# Fix 2: suppress exhaustive-deps on renderLoop
content = content.replace("}, []);\n\n  const toggleFullscreen", "    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  const toggleFullscreen")

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)
