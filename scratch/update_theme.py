import os

files = ['frontend/src/pdf.css', 'frontend/src/pages/ProgramPDF.jsx']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()

    # Replace headingColor in ProgramPDF
    content = content.replace("const headingColor = '#0d2b5c';", "const headingColor = '#000000';")
    content = content.replace("color: '#000000' // Ensure everything is highly visible (#000000)", "backgroundColor: '#eef7f2',\n    color: '#000000', // Pure black text\n    fontWeight: 'bold' // Bold where necessary")
    
    # Text colors to pure black
    content = content.replace('color: #111;', 'color: #000;')
    content = content.replace('color: #222;', 'color: #000;')
    content = content.replace('color: #333;', 'color: #000;')
    content = content.replace('color: #555;', 'color: #000;')
    content = content.replace('color: #666;', 'color: #000;')
    content = content.replace('color: #111111;', 'color: #000;')
    content = content.replace('color: #333333;', 'color: #000;')
    content = content.replace('color: #555555;', 'color: #000;')
    
    # Background tweaks to green floral
    content = content.replace('background: #ffffff;', 'background: #eef7f2;')
    content = content.replace('background: #e6f2eb;', 'background: #eef7f2;')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Done!')
