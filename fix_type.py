import re

with open('components/LaserBattleRoyale.tsx', 'r') as f:
    content = f.read()

content = content.replace("<span>{config[setting.key as keyof SimulationConfig]}</span>", "<span>{config[setting.key as keyof SimulationConfig] as number}</span>")

with open('components/LaserBattleRoyale.tsx', 'w') as f:
    f.write(content)
