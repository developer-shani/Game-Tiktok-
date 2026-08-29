import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

content = content.replace("owner.activeLines[i] = false;", "anchor.active = false;")
content = content.replace("!owner.activeLines.some((active) => active)", "!owner.anchors.some((a) => a.active)")

with open('lib/physics.ts', 'w') as f:
    f.write(content)
