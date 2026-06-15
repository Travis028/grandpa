import os, glob

fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M20 100c0-20 15-35 30-35s30 15 30 35' fill='%23ccc'/%3E%3C/svg%3E"
bad_fallback = f"'{fallback}'"
good_fallback = f"`{fallback}`"

for f in glob.glob(r'c:\Users\wayne\OneDrive\Desktop\grandpa\frontend\src\**\*.jsx', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace(f"e.target.src = {bad_fallback}", f"e.target.src = {good_fallback}")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print('Done')
