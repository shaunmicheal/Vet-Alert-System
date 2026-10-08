import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')

i = s.find('const completedState')
print('===COMPLETED SECTION===')
print(s[i-260:i+320])

i = s.find('Vet blocked')
if i == -1:
    i = s.find('vetToken')
print('===VET SECTION===')
print(s[i-40:i+400])
