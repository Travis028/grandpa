import sqlite3
import json
import os

DATA_DIR = 'data'
DB_FILE = os.path.join(DATA_DIR, 'database.db')
FAMILY_FILE = os.path.join(DATA_DIR, 'family.json')

def fix_spouses():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # 1. Evans Odhiambo: Mama Young -> Eunice Evance & Milka Odhiambo
    c.execute("UPDATE family_members SET spouse = ? WHERE name = ?", ('Eunice Evance & Milka Odhiambo', 'Evans Odhiambo'))
    
    conn.commit()
    conn.close()

    # Also update family.json to keep it in sync
    if os.path.exists(FAMILY_FILE):
        with open(FAMILY_FILE, 'r') as f:
            data = json.load(f)
        for m in data:
            if m.get('name') == 'Evans Odhiambo':
                m['spouse'] = 'Eunice Evance & Milka Odhiambo'
        with open(FAMILY_FILE, 'w') as f:
            json.dump(data, f, indent=2)
            
    print("Spouse names updated successfully.")

if __name__ == '__main__':
    fix_spouses()
