import re

with open('lib/physics.ts', 'r') as f:
    content = f.read()

# Delete computeRayAnchors
pattern = r'export function computeRayAnchors.*?\n}\n'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('lib/physics.ts', 'w') as f:
    f.write(content)
