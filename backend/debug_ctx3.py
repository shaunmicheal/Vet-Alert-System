import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')
i = s.find('completed.status === 200')
print('indexOf completed.status:', i)
print('context:', repr(s[i-120:i+200]))
