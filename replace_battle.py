import re

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

# We need to replace DEFAULT_CONFIG
old_config = re.search(r'const DEFAULT_CONFIG: SimulationConfig = \{.*?\};', content, re.DOTALL)

new_config = """const DEFAULT_CONFIG: SimulationConfig = {
  headerText: "DAY 7 UNTIL PINK WINS",
  speed: 300,
  bounciness: 1.0,
  gravity: 0,
  ballRadius: 15,
  competitors: 4,
  players: [
    { name: "Player 1", color: "#FF1493" },
    { name: "Player 2", color: "#00E676" },
    { name: "Player 3", color: "#00E5FF" },
    { name: "Player 4", color: "#FF9100" },
    { name: "Player 5", color: "#D500F9" },
    { name: "Player 6", color: "#FFD600" },
    { name: "Player 7", color: "#FF1744" },
    { name: "Player 8", color: "#00F5D4" },
  ],
  rayCount: 40,
  arcSpanDeg: 60,
  glowIntensity: 1.0,
  soundEnabled: true,
  autoRestart: true,
  autoRestartDelaySec: 3,
  speedMultiplier: 1.0,
};"""

content = content.replace(old_config.group(0), new_config)

# Update imports to include X, Settings
content = content.replace("Settings2,", "Settings,\n  X,")
content = content.replace("StepForward,", "StepForward,\n  Settings,")

# Save back to a temp file
with open('components/LaserBattleRoyale.tsx.tmp', 'w') as f:
    f.write(content)
