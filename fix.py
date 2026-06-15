import re
with open(r'c:\Users\wayne\OneDrive\Desktop\grandpa\frontend\src\pages\Admin.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("onError={e => e.target.style.display = 'none'} /> : <div style={{width: '48px', height: '48px', borderRadius: '50%', background: '#eee'}}></div>}", "onError={e => e.target.style.display = 'none'} />")

with open(r'c:\Users\wayne\OneDrive\Desktop\grandpa\frontend\src\pages\Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
