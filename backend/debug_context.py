import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')
i = s.find('const tokenA')
print('indexOf tokenA:', i)
print('context:', repr(s[i-120:i+300]))
