import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')
i = s.find('Created reminder dueDate')
print('indexOf dueDate check:', i)
print('context:', repr(s[i-80:i+350]))
