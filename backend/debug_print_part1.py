import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')

# Print the entire file in chunks for verification
lines = s.split('\n')
print('Total lines:', len(lines))
print('===== CHUNK 1 (lines 1-120) =====')
for i, line in enumerate(lines[0:120], 1):
    print(f'{i}: {line}')
