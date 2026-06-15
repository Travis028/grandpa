import os, glob

fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M20 100c0-20 15-35 30-35s30 15 30 35' fill='%23ccc'/%3E%3C/svg%3E"

for f in glob.glob(r'c:\Users\wayne\OneDrive\Desktop\grandpa\frontend\src\**\*.jsx', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace("onError={e => e.target.style.display = 'none'}", f"onError={{e => {{ e.target.onerror = null; e.target.src = '{fallback}'; }}}}")
    content = content.replace("onError={(e) => { e.target.style.display = 'none'; }}", f"onError={{(e) => {{ e.target.onerror = null; e.target.src = '{fallback}'; }}}}")
    content = content.replace("onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}", f"onError={{(e) => {{ e.target.onerror = null; e.target.src = '{fallback}'; }}}}")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print('Done')
