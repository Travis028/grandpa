try:
    import eventlet
    eventlet.monkey_patch()
except ImportError:
    pass
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import jwt
from functools import wraps
import os, json, threading
from datetime import datetime, timezone, timedelta
import urllib.request, urllib.error, base64
import sqlite3
from PIL import Image, ImageOps
import imagehash
import io
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')
GITHUB_REPO = 'Travis028/grandpa'
GITHUB_BRANCH = 'main'

def sync_to_github(filepath, commit_msg):
    if not GITHUB_TOKEN: return
    try:
        github_path = filepath.replace('\\', '/')
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{github_path}"
        req = urllib.request.Request(url, headers={'Authorization': f'token {GITHUB_TOKEN}'})
        sha = None
        try:
            with urllib.request.urlopen(req) as response:
                sha = json.loads(response.read().decode()).get('sha')
        except urllib.error.HTTPError as e:
            if e.code != 404: pass

        with open(filepath, 'rb') as f:
            content = base64.b64encode(f.read()).decode('utf-8')

        payload = {'message': commit_msg, 'content': content, 'branch': GITHUB_BRANCH}
        if sha: payload['sha'] = sha
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Authorization': f'token {GITHUB_TOKEN}', 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json'}, method='PUT')
        with urllib.request.urlopen(req) as response:
            pass
    except Exception as e:
        print("GitHub Sync Error:", str(e))

def sync_file_bg(filepath):
    threading.Thread(target=sync_to_github, args=(filepath, f"Auto-sync {filepath}")).start()

ALLOWED_ORIGINS = "*"

app = Flask(__name__, static_folder='static')
CORS(app, origins=ALLOWED_ORIGINS)
app.secret_key = 'owino-memorial-secret-2026'
app.config['JWT_SECRET'] = 'owino-admin-jwt-2026'
socketio = SocketIO(app, cors_allowed_origins=ALLOWED_ORIGINS)

active_visitors = {}   # sid -> {name, ip, time, page}
_lock = threading.Lock()

# ── FILE PATHS ────────────────────────────────────────────────────────────────
DATA_DIR         = os.path.join('static', 'images', 'app_data')
FAMILY_FILE      = os.path.join(DATA_DIR, 'family.json')
GRANDPA_FILE     = os.path.join(DATA_DIR, 'grandpa.json')
TRIBUTES_FILE    = os.path.join(DATA_DIR, 'tributes.json')
VISITORS_FILE    = os.path.join(DATA_DIR, 'visitors.json')
ACTIVITY_FILE    = os.path.join(DATA_DIR, 'activity.json')
SHARES_FILE      = os.path.join(DATA_DIR, 'shares.json')
REQUESTS_FILE    = os.path.join(DATA_DIR, 'admin_requests.json')
os.makedirs(DATA_DIR, exist_ok=True)

DEFAULT_GRANDPA = {
    "name": "APOLLO J. FIZVALENTINE OWINO.",
    "birth_year": "1952", "death_year": "2026",
    "birth_place": "[Fill in: Village/Town, Kenya]",
    "wife_name": "Joyce Owino",
    "final_words": "God was good to me.",
    "life_story": "APOLLO J. FIZVALENTINE OWINO. was born in [FILL IN] to [FILL IN PARENTS' NAMES]. He grew up knowing the value of hard work and faith. Throughout his life, he was known for his quiet strength, his generous spirit, and his deep love for his family.\n\nHe worked as a [FILL IN OCCUPATION] and provided for his family with dignity and pride. Even in difficult times, he never complained. Instead, he taught his children that every challenge is an opportunity to grow stronger.\n\nHis faith was the foundation of his life. He believed in [FILL IN FAITH/CHURCH] and prayed for his family every single day.\n\nIn his final months, he faced [FILL IN ILLNESS] with remarkable courage. Even when his body grew weak, his spirit remained strong. His last words to his family were, \"God was good to me.\"",
    "firstborn_name": "Nabi Owino",
    "firstborn_note": "Firstborn of APOLLO J. FIZVALENTINE OWINO. Preceded his father in death. Forever remembered. Forever loved.",
    "activities": []
}

DB_FILE = os.path.join(DATA_DIR, 'database.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        spouse TEXT,
        note TEXT,
        tribute TEXT,
        spouse_tribute TEXT
    )''')
    try:
        c.execute('ALTER TABLE family_members ADD COLUMN spouse_tribute TEXT')
    except sqlite3.OperationalError:
        pass # Column likely already exists
    c.execute('''CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        type TEXT,
        path TEXT,
        comment TEXT,
        phash TEXT,
        FOREIGN KEY(member_id) REFERENCES family_members(id)
    )''')
    conn.commit()
    conn.close()

init_db()

DEFAULT_FAMILY = [
    {"name":"Evans Odhiambo","spouse":"Eunice Evance & the late Monica Odhiambo","note":"","portrait":"evans_odhiambo/portrait.jpg","tribute":"[FILL IN: Evans' tribute to Grandpa]","gallery":[],"grandchildren":[
        {"name":"Kevins Ochieng","photo":"evans_odhiambo/grandchildren/kevins.jpg"},
        {"name":"Ireene Awuor","photo":"evans_odhiambo/grandchildren/awuor.jpg"},
        {"name":"Peter Odhiambo","photo":"peter_odhiambo/portrait.jpg","tribute":"[FILL IN]"},
        {"name":"Elly Opiyo (junier)","photo":"elly_opiyo/portrait.jpg","note":"Twin to Peter","tribute":"[FILL IN]"},
        {"name":"Felix Omondi","photo":"felix_otieno/portrait.jpg","tribute":"[FILL IN]"},
        {"name":"Joy Odhiambo","photo":""}
    ]},
    {"name":"Joyce Owino","spouse":"","note":"","portrait":"joy_odhiambo/portrait.jpg","tribute":"[FILL IN: Joyce's tribute to Dad]","gallery":[],"grandchildren":[]},
    {"name":"Jeph Apollo","spouse":"Roseline Jeph","note":"","portrait":"jeff_apollo/portrait.jpg","tribute":"[FILL IN: Jeph's tribute to Dad]","gallery":[],"grandchildren":[
        {"name":"Dean Reeves Ochieng","photo":"jeff_apollo/grandchildren/dean.jpg"},
        {"name":"Jimmy Adams Ochieng","photo":"jeff_apollo/grandchildren/jimmy.jpg"},
        {"name":"Marc Joe","photo":"jeff_apollo/grandchildren/mark.jpg"},
        {"name":"Amaya Joy","photo":"jeff_apollo/grandchildren/amaya.jpg"}
    ]},
    {"name":"Cherles Were","spouse":"Lilian Were","note":"","portrait":"cherls_were/portrait.jpg","tribute":"[FILL IN: Cherles' tribute to Grandpa]","gallery":[],"grandchildren":[
        {"name":"Dashon Tindely","photo":"cherls_were/grandchildren/dashon.jpg"},
        {"name":"Pendo Daniela","photo":"cherls_were/grandchildren/pendo.jpg"}
    ]},
    {"name":"Timothy Owino","spouse":"Nancy Otieno","note":"","portrait":"timothy_owino/portrait.jpg","tribute":"[FILL IN: Timothy's tribute to Dad]","gallery":[],"grandchildren":[
        {"name":"Wayne Travis","photo":"timothy_owino/grandchildren/wayne.jpg"},
        {"name":"Natasha Pinkette","photo":"timothy_owino/grandchildren/natasha.jpg"},
        {"name":"Emmanuela Winslette","photo":"timothy_owino/grandchildren/emmanuela.jpg"},
        {"name":"Zach Gabriels","photo":"timothy_owino/grandchildren/zach.jpg"}
    ]},
    {"name":"Hellen Owino","spouse":"","note":"","portrait":"hellon_owino/portrait.jpg","tribute":"[FILL IN: Hellen's tribute to Dad]","gallery":[],"grandchildren":[
        {"name":"Jerald Okello","photo":"hellon_owino/grandchildren/jerald.jpg"},
        {"name":"Bevaline Okello","photo":"hellon_owino/grandchildren/bevaline.jpg"},
        {"name":"Henry Okelo (Obash)","photo":"hellon_owino/grandchildren/henry.jpg"},
        {"name":"Antonette Okello","photo":"hellon_owino/grandchildren/antonette.jpg"},
        {"name":"Katindi","photo":"hellon_owino/grandchildren/katindi.jpg"}
    ]},
    {"name":"Beryl Mercy","spouse":"","note":"","portrait":"beryl_mercy/portrait.jpg","tribute":"[FILL IN: Beryl's tribute to Dad]","gallery":[],"grandchildren":[
        {"name":"Peter","photo":"beryl_mercy/grandchildren/peter.jpg"}
    ]},
    {"name":"Joan Apollo","spouse":"","note":"","portrait":"joan_apollo/portrait.jpg","tribute":"[FILL IN: Joan's tribute to Dad]","gallery":[],"grandchildren":[
        {"name":"Richard Leakey","photo":"joan_apollo/grandchildren/richard.jpg"},
        {"name":"Macreen","photo":"joan_apollo/grandchildren/macreen.jpg"},
        {"name":"Bonney","photo":"joan_apollo/grandchildren/bonney.jpg"},
        {"name":"Siste","photo":"joan_apollo/grandchildren/siste.jpg"},
        {"name":"Boss","photo":"joan_apollo/grandchildren/boss.jpg"}
    ]}
]



DEFAULT_PROGRAM = {
    "event_name":"Memorial & Funeral Service","date":"[FILL IN DATE]",
    "venue":"[FILL IN CHURCH/HALL NAME AND LOCATION]","venue_address":"[FILL IN FULL ADDRESS]",
    "time_start":"[FILL IN START TIME]","time_end":"[FILL IN END TIME]",
    "dress_code":"[FILL IN DRESS CODE]","burial_location":"[FILL IN BURIAL LOCATION]",
    "hymnal_1":"[FILL IN HYMNAL 1 LYRICS\\nVerse 1...]",
    "hymnal_2":"[FILL IN HYMNAL 2 LYRICS\\nVerse 1...]",
    "order":[
        {"time":"10:00 AM","item":"Opening Prayer","leader":"[FILL IN NAME]"},
        {"time":"10:10 AM","item":"Hymn / Worship","leader":"Family"},
        {"time":"10:20 AM","item":"Scripture Reading","leader":"[FILL IN NAME]"},
        {"time":"10:30 AM","item":"Eulogy Reading","leader":"Family"},
        {"time":"11:00 AM","item":"Tributes from Children","leader":"Each child speaks"},
        {"time":"11:45 AM","item":"Special Song","leader":"[FILL IN NAME]"},
        {"time":"12:00 PM","item":"Message / Sermon","leader":"[FILL IN PASTOR/MINISTER]"},
        {"time":"12:30 PM","item":"Final Prayer & Blessing","leader":"[FILL IN NAME]"},
        {"time":"1:00 PM","item":"Burial / Committal","leader":"At the graveside"},
        {"time":"2:00 PM","item":"Lunch & Fellowship","leader":"All are invited"}
    ]
}

# ── PERSISTENCE HELPERS ───────────────────────────────────────────────────────
def _load(path, default=None):
    if default is None:
        default = []
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return default

def _save(path, data):
    with _lock:
        tmp = path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)   # atomic write — never corrupts file
        sync_file_bg(path)

def load_grandpa():
    return _load(GRANDPA_FILE, DEFAULT_GRANDPA.copy())

def save_grandpa(data):
    _save(GRANDPA_FILE, data)

def migrate_json_to_db():
    conn = get_db()
    c = conn.cursor()
    
    flag_path = os.path.join(DATA_DIR, 'migrated_v3.flag')
    if not os.path.exists(flag_path):
        c.execute('DELETE FROM family_members')
        c.execute('DELETE FROM photos')
        conn.commit()
        _save(GRANDPA_FILE, DEFAULT_GRANDPA)
        _save(FAMILY_FILE, DEFAULT_FAMILY)
        with open(flag_path, 'w') as f:
            f.write('done')
            
    c.execute('SELECT COUNT(*) as count FROM family_members')
    if c.fetchone()['count'] == 0:
        fam_json = _load(FAMILY_FILE, DEFAULT_FAMILY)
        for member in fam_json:
            c.execute('''INSERT INTO family_members (name, spouse, note, tribute, spouse_tribute)
                         VALUES (?, ?, ?, ?, ?)''', (member.get('name', ''), member.get('spouse', ''), member.get('note', ''), member.get('tribute', ''), member.get('spouse_tribute', '')))
            member_id = c.lastrowid
            
            if member.get('portrait'):
                c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                             VALUES (?, ?, ?, ?, ?)''', (member_id, 'portrait', member['portrait'], '', ''))
            
            for g in member.get('gallery', []):
                path = g if isinstance(g, str) else g.get('path', '')
                comment = '' if isinstance(g, str) else g.get('comment', '')
                if path:
                    c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                                 VALUES (?, ?, ?, ?, ?)''', (member_id, 'gallery', path, comment, ''))
            
            for gc in member.get('grandchildren', []):
                photo_path = gc.get('photo') or ''
                c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                             VALUES (?, ?, ?, ?, ?)''', (member_id, 'grandchild', photo_path, gc.get('name', ''), ''))
        conn.commit()
    conn.close()

migrate_json_to_db()

def load_family():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM family_members ORDER BY id ASC')
    members = c.fetchall()
    
    result = []
    for m in members:
        member_id = m['id']
        member_dict = dict(m)
        member_dict['gallery'] = []
        member_dict['grandchildren'] = []
        member_dict['spouse_portrait'] = ''
        
        c.execute('SELECT * FROM photos WHERE member_id = ? ORDER BY id ASC', (member_id,))
        photos = c.fetchall()
        for p in photos:
            if p['type'] == 'portrait':
                member_dict['portrait'] = p['path']
            elif p['type'] == 'spouse_portrait':
                member_dict['spouse_portrait'] = p['path']
            elif p['type'] == 'gallery':
                member_dict['gallery'].append({'path': p['path'], 'comment': p['comment']})
            elif p['type'] == 'grandchild':
                name_part = p['comment']
                tribute_part = ''
                if '|' in p['comment']:
                    name_part, tribute_part = p['comment'].split('|', 1)
                member_dict['grandchildren'].append({'name': name_part, 'tribute': tribute_part, 'photo': p['path']})
        
        result.append(member_dict)
    conn.close()
    return result

def save_family(data):
    # Backward compatibility for API routes that still mutate the entire JSON structure and save it.
    conn = get_db()
    c = conn.cursor()
    
    # We clear and re-insert to keep it simple, but we maintain the logic.
    # Note: A better approach is to use precise UPDATE statements via API routes, 
    # but for full compatibility with existing routes modifying the list in memory:
    c.execute('DELETE FROM photos')
    c.execute('DELETE FROM family_members')
    
    for member in data:
        c.execute('''INSERT INTO family_members (name, spouse, note, tribute, spouse_tribute)
                     VALUES (?, ?, ?, ?, ?)''', (member.get('name', ''), member.get('spouse', ''), member.get('note', ''), member.get('tribute', ''), member.get('spouse_tribute', '')))
        member_id = c.lastrowid
        
        if member.get('portrait'):
            c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                         VALUES (?, ?, ?, ?, ?)''', (member_id, 'portrait', member['portrait'], '', ''))
                         
        if member.get('spouse_portrait'):
            c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                         VALUES (?, ?, ?, ?, ?)''', (member_id, 'spouse_portrait', member['spouse_portrait'], '', ''))
        
        for g in member.get('gallery', []):
            path = g if isinstance(g, str) else g.get('path', '')
            comment = '' if isinstance(g, str) else g.get('comment', '')
            if path:
                c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                             VALUES (?, ?, ?, ?, ?)''', (member_id, 'gallery', path, comment, ''))
        
        for gc in member.get('grandchildren', []):
            photo_path = gc.get('photo') or ''
            c.execute('''INSERT INTO photos (member_id, type, path, comment, phash)
                         VALUES (?, ?, ?, ?, ?)''', (member_id, 'grandchild', photo_path, f"{gc.get('name', '')}|{gc.get('tribute', '')}", ''))
    conn.commit()
    conn.close()
    _save(FAMILY_FILE, data) # Also keep the JSON file updated for GitHub sync logic

def load_program():
    return _load(os.path.join(DATA_DIR, 'program.json'), DEFAULT_PROGRAM)

def now_str():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def log_activity(name, action, detail=''):
    log = _load(ACTIVITY_FILE)
    log.append({'name': name, 'action': action, 'detail': detail, 'time': now_str()})
    _save(ACTIVITY_FILE, log[-500:])

# Seed files on first boot so they always exist
if not os.path.exists(GRANDPA_FILE):
    _save(GRANDPA_FILE, DEFAULT_GRANDPA)
if not os.path.exists(FAMILY_FILE):
    _save(FAMILY_FILE, DEFAULT_FAMILY)
if not os.path.exists(os.path.join(DATA_DIR, 'program.json')):
    _save(os.path.join(DATA_DIR, 'program.json'), DEFAULT_PROGRAM)

# ── PHOTO HELPERS ─────────────────────────────────────────────────────────────
def get_memory_photos():
    d = os.path.join('static', 'images', 'memories')
    if not os.path.exists(d):
        return []
    result = []
    for f in os.listdir(d):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
            result.append({"file": f, "caption": f.rsplit('.', 1)[0].replace('_', ' ').title(), "submitted_by": "Family"})
    return result

def get_life_photos():
    d = os.path.join('static', 'images', 'life_photos')
    if not os.path.exists(d):
        return []
    return [f for f in os.listdir(d) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]

def process_and_save_image(file, save_dir, filename_prefix, img_type='portrait'):
    try:
        img = Image.open(file)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        phash_val = str(imagehash.phash(img))
        
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT path FROM photos WHERE phash = ? AND phash != ""', (phash_val,))
        dup = c.fetchone()
        conn.close()
        
        if dup:
            return {"error": "Duplicate photo detected."}

        if img_type == 'portrait' or img_type == 'grandchild':
            size = min(img.size)
            img = ImageOps.fit(img, (size, size), Image.Resampling.LANCZOS)
        elif img_type == 'gallery':
            # Optionally crop to 16:9 if it is very tall, else keep original
            pass
            
        filename = f"{filename_prefix}.webp"
        save_path = os.path.join(save_dir, filename)
        img.save(save_path, 'WEBP', quality=85)
        
        return {"success": True, "filename": filename, "phash": phash_val}
    except Exception as e:
        return {"error": str(e)}

# ── PUBLIC API ────────────────────────────────────────────────────────────────
#@app.route('/')
#def index():
    #return jsonify({"status": "Memorial API is running!"})

@app.route('/api/grandpa')
def get_grandpa():
    return jsonify(load_grandpa())

@app.route('/api/family')
def get_family():
    g = load_grandpa()
    fb = {"name": g.get("firstborn_name", ""), "note": g.get("firstborn_note", "")}
    return jsonify({"family": load_family(), "firstborn": fb})

@app.route('/api/memories')
def api_memories():
    return jsonify(get_memory_photos())

@app.route('/api/life_photos')
def api_life_photos():
    return jsonify(get_life_photos())

@app.route('/api/program')
def get_program():
    return jsonify(_load(os.path.join(DATA_DIR, 'program.json'), DEFAULT_PROGRAM))

@app.route('/api/tributes', methods=['GET', 'POST'])
def api_tributes():
    if request.method == 'POST':
        if request.content_type and request.content_type.startswith('multipart/form-data'):
            body = request.form
            file = request.files.get('media')
        else:
            body = request.json or {}
            file = None
            
        msg = body.get('message', '').strip()
        if not msg:
            return jsonify({"error": "Message required"}), 400
            
        tribute = {
            'name': body.get('name', 'Anonymous'),
            'relation': body.get('relation', 'Friend'),
            'message': msg,
            'date': datetime.now().strftime('%B %d, %Y')
        }
        
        if file and file.filename:
            d = os.path.join('static', 'images', 'tributes_media')
            os.makedirs(d, exist_ok=True)
            ts = datetime.now().strftime('%Y%m%d%H%M%S')
            safe_name = file.filename.replace(' ', '_')
            filename = f"{ts}_{safe_name}"
            path = os.path.join(d, filename)
            file.save(path)
            sync_file_bg(path)
            tribute['media'] = f"tributes_media/{filename}"

        tributes = _load(TRIBUTES_FILE)
        tributes.append(tribute)
        _save(TRIBUTES_FILE, tributes)
        log_activity(tribute['name'], 'tribute', msg[:80])
        socketio.emit('new_tribute', tribute)
        return jsonify({"success": True, "tribute": tribute})
    return jsonify(_load(TRIBUTES_FILE))

@app.route('/api/upload_qr', methods=['POST'])
def upload_qr():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        d = os.path.join('static', 'images', 'grandpa')
        os.makedirs(d, exist_ok=True)
        path = os.path.join(d, 'qr_code.jpg')
        file.save(path)
        sync_file_bg(path)
        return jsonify({"success": True})
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/upload_program_cover', methods=['POST'])
def upload_program_cover():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        d = os.path.join('static', 'images', 'grandpa')
        os.makedirs(d, exist_ok=True)
        path = os.path.join(d, 'program_cover.jpg')
        file.save(path)
        sync_file_bg(path)
        return jsonify({"success": True})
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/upload_program_photos', methods=['POST'])
def upload_program_photos():
    files = request.files.getlist('files')
    if not files: return jsonify({"error": "No files"}), 400
    d = os.path.join('static', 'images', 'program_photos')
    os.makedirs(d, exist_ok=True)
    # Safely remove existing files instead of rmtree
    for filename in os.listdir(d):
        file_path = os.path.join(d, filename)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception:
            pass
    for f in files:
        if f.filename:
            f.save(os.path.join(d, f.filename))
    return jsonify({"success": True})

@app.route('/api/program_photos', methods=['GET'])
def get_program_photos():
    d = os.path.join('static', 'images', 'program_photos')
    if not os.path.exists(d): return jsonify([])
    files = [f for f in os.listdir(d) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    files.sort()  # Ensure they appear in the order they are named
    return jsonify(files)

@app.route('/api/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

# ── VISITOR / SHARE TRACKING ──────────────────────────────────────────────────
@app.route('/api/register_visitor', methods=['POST'])
def register_visitor():
    body = request.json or {}
    name = (body.get('name') or 'Anonymous').strip() or 'Anonymous'
    visitors = _load(VISITORS_FILE)
    visitors.append({'name': name, 'ip': request.remote_addr, 'time': now_str()})
    _save(VISITORS_FILE, visitors)
    log_activity(name, 'visited', 'Entered memorial')
    return jsonify({'success': True})

@app.route('/api/track_share', methods=['POST'])
def track_share():
    body = request.json or {}
    name, platform = body.get('name', 'Guest'), body.get('platform', 'unknown')
    shares = _load(SHARES_FILE)
    shares.append({'name': name, 'platform': platform, 'time': now_str()})
    _save(SHARES_FILE, shares)
    log_activity(name, 'shared', f'via {platform}')
    socketio.emit('site_shared', {'name': name, 'platform': platform})
    return jsonify({'success': True})

@app.route('/api/track_page', methods=['POST'])
def track_page():
    body = request.json or {}
    name, page, sid = body.get('name', 'Guest'), body.get('page', '/'), body.get('sid', '')
    log_activity(name, 'navigated', page)
    if sid in active_visitors:
        active_visitors[sid]['page'] = page
    socketio.emit('visitor_count', {'count': len(active_visitors), 'visitors': list(active_visitors.values())})
    return jsonify({'success': True})

@app.route('/api/admin/request_access', methods=['POST'])
def request_access():
    body = request.json or {}
    name = body.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    reqs = _load(REQUESTS_FILE)
    reqs.append({'name': name, 'reason': body.get('reason', ''), 'status': 'pending', 'time': now_str()})
    _save(REQUESTS_FILE, reqs)
    socketio.emit('admin_request', {'name': name})
    return jsonify({'success': True})

# ── WEBSOCKETS ────────────────────────────────────────────────────────────────
@socketio.on('connect')
def on_connect():
    active_visitors[request.sid] = {"name": "Guest", "ip": request.remote_addr,
                                     "time": datetime.now().strftime("%H:%M:%S"), "page": "/"}
    emit('visitor_count', {'count': len(active_visitors), 'visitors': list(active_visitors.values())}, broadcast=True)

@socketio.on('set_name')
def on_set_name(data):
    name = (data or {}).get('name', 'Guest')
    if request.sid in active_visitors:
        active_visitors[request.sid]['name'] = name
    emit('visitor_count', {'count': len(active_visitors), 'visitors': list(active_visitors.values())}, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    active_visitors.pop(request.sid, None)
    emit('visitor_count', {'count': len(active_visitors), 'visitors': list(active_visitors.values())}, broadcast=True)

# ── AUTH ──────────────────────────────────────────────────────────────────────
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        raw = request.headers.get('Authorization', '')
        try:
            tok = raw.split(' ')[1]
            jwt.decode(tok, app.config['JWT_SECRET'], algorithms=['HS256'])
        except Exception:
            return jsonify({'message': 'Unauthorised'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/admin/login', methods=['POST'])
def login():
    body = request.json or {}
    if body.get('username') == 'apolloowino' and body.get('password') == 'apolloowino':
        tok = jwt.encode({'user': 'admin', 'exp': datetime.now(timezone.utc) + timedelta(hours=8)},
                         app.config['JWT_SECRET'], algorithm='HS256')
        return jsonify({'token': tok})
    return jsonify({'message': 'Invalid credentials'}), 401

# ── ADMIN DATA ────────────────────────────────────────────────────────────────
@app.route('/api/admin/data', methods=['GET'])
@token_required
def get_admin_data():
    visitors = _load(VISITORS_FILE)
    unique = list({v['name'] for v in visitors if v['name'] not in ('Anonymous', 'Guest')})
    return jsonify({
        "grandpa": load_grandpa(),
        "family": load_family(),
        "program": _load(os.path.join(DATA_DIR, 'program.json'), DEFAULT_PROGRAM),
        "tributes": _load(TRIBUTES_FILE),
        "feedback": _load(os.path.join(DATA_DIR, 'feedback.json')),
        "live_visitors": len(active_visitors),
        "live_visitor_details": list(active_visitors.values()),
        "total_visitors": len(visitors),
        "unique_visitors": unique,
        "activity": _load(ACTIVITY_FILE)[-100:],
        "shares": _load(SHARES_FILE),
        "admin_requests": _load(REQUESTS_FILE)
    })

# ── ADMIN EDIT FAMILY ─────────────────────────────────────────────────────────
@app.route('/api/admin/family', methods=['POST'])
@token_required
def add_family_member():
    family = load_family()
    body = request.json or {}
    new_member = {
        "name": body.get("name", "New Family Member"),
        "spouse": body.get("spouse", ""),
        "note": body.get("note", ""),
        "portrait": "",
        "spouse_portrait": "",
        "tribute": "",
        "spouse_tribute": "",
        "gallery": [],
        "grandchildren": []
    }
    family.append(new_member)
    save_family(family)
    socketio.emit('family_updated', {'idx': len(family) - 1})
    return jsonify({'success': True, 'member': new_member})

@app.route('/api/admin/family/<int:idx>', methods=['DELETE'])
@token_required
def delete_family_member(idx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    family.pop(idx)
    save_family(family)
    socketio.emit('family_updated', {'idx': -1})
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>', methods=['PUT'])
@token_required
def update_family_member(idx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    body = request.json or {}
    for f in ['name', 'spouse', 'note', 'tribute', 'spouse_tribute']:
        if f in body:
            family[idx][f] = body[f]
    save_family(family)
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True, 'member': family[idx]})

@app.route('/api/admin/family/<int:idx>/photo', methods=['POST'])
@token_required
def upload_family_photo(idx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    if 'photo' not in request.files:
        return jsonify({'error': 'No file'}), 400
    folder = family[idx]['name'].lower().replace(' ', '_')
    d = os.path.join('static', 'images', 'children', folder)
    os.makedirs(d, exist_ok=True)
    
    file = request.files['photo']
    res = process_and_save_image(file, d, 'portrait', img_type='portrait')
    
    if "error" in res:
        return jsonify({'error': res["error"]}), 400
        
    path = f"{folder}/{res['filename']}"
    family[idx]['portrait'] = path
    save_family(family)
    
    # Update DB directly with phash for portrait
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE photos SET phash = ? WHERE type = 'portrait' AND path = ?", (res['phash'], path))
    conn.commit()
    conn.close()
    
    sync_file_bg(os.path.join(d, res['filename']))
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True, 'portrait': family[idx]['portrait']})

@app.route('/api/admin/family/<int:idx>/photo', methods=['DELETE'])
@token_required
def delete_family_photo(idx):
    family = load_family()
    if not (0 <= idx < len(family)): return jsonify({'error': 'Not found'}), 404
    path = family[idx].get('portrait')
    if path:
        full = os.path.join('static', 'images', 'children', path)
        if os.path.exists(full):
            os.remove(full)
        family[idx]['portrait'] = ''
        save_family(family)
        socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>/spouse_photo', methods=['POST'])
@token_required
def upload_spouse_photo(idx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    if 'photo' not in request.files:
        return jsonify({'error': 'No file'}), 400
    folder = family[idx]['name'].lower().replace(' ', '_')
    d = os.path.join('static', 'images', 'children', folder)
    os.makedirs(d, exist_ok=True)
    
    file = request.files['photo']
    res = process_and_save_image(file, d, 'spouse_portrait', img_type='portrait')
    
    if "error" in res:
        return jsonify({'error': res["error"]}), 400
        
    path = f"{folder}/{res['filename']}"
    family[idx]['spouse_portrait'] = path
    save_family(family)
    
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE photos SET phash = ? WHERE type = 'spouse_portrait' AND path = ?", (res['phash'], path))
    conn.commit()
    conn.close()
    
    sync_file_bg(os.path.join(d, res['filename']))
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True, 'spouse_portrait': path})

@app.route('/api/admin/family/<int:idx>/spouse_photo', methods=['DELETE'])
@token_required
def delete_spouse_photo(idx):
    family = load_family()
    if not (0 <= idx < len(family)): return jsonify({'error': 'Not found'}), 404
    path = family[idx].get('spouse_portrait')
    if path:
        full = os.path.join('static', 'images', 'children', path)
        if os.path.exists(full):
            os.remove(full)
        family[idx]['spouse_portrait'] = ''
        save_family(family)
        socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>/gallery', methods=['POST'])
@token_required
def upload_gallery_photo(idx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    if 'photo' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['photo']
    folder = family[idx]['name'].lower().replace(' ', '_')
    d = os.path.join('static', 'images', 'children', folder, 'gallery')
    os.makedirs(d, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d%H%M%S')
    safe_name = file.filename.replace(' ', '_').rsplit('.', 1)[0]
    filename_prefix = f"{ts}_{safe_name}"
    
    res = process_and_save_image(file, d, filename_prefix, img_type='gallery')
    if "error" in res:
        return jsonify({'error': res["error"]}), 400
        
    path = f"{folder}/gallery/{res['filename']}"
    family[idx].setdefault('gallery', []).append({'path': path, 'comment': ''})
    save_family(family)
    
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE photos SET phash = ? WHERE type = 'gallery' AND path = ?", (res['phash'], path))
    conn.commit()
    conn.close()
    
    sync_file_bg(os.path.join(d, res['filename']))
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True, 'path': path})

@app.route('/api/admin/memories', methods=['POST'])
@token_required
def upload_memory_photo():
    if 'photo' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['photo']
    d = os.path.join('static', 'images', 'memories')
    os.makedirs(d, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d%H%M%S')
    safe_name = file.filename.replace(' ', '_').rsplit('.', 1)[0]
    filename_prefix = f"{ts}_{safe_name}"
    
    res = process_and_save_image(file, d, filename_prefix, img_type='gallery')
    if "error" in res:
        return jsonify({'error': res["error"]}), 400
        
    sync_file_bg(os.path.join(d, res['filename']))
    return jsonify({'success': True, 'filename': res['filename']})

@app.route('/api/admin/memories/<path:filename>', methods=['DELETE'])
@token_required
def delete_memory_photo(filename):
    full = os.path.join('static', 'images', 'memories', filename)
    if os.path.exists(full):
        os.remove(full)
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>/gallery/<int:gidx>', methods=['PUT', 'DELETE'])
@token_required
def manage_gallery_photo(idx, gidx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    gallery = family[idx].get('gallery', [])
    if not (0 <= gidx < len(gallery)):
        return jsonify({'error': 'Not found'}), 404
    
    if request.method == 'DELETE':
        item = gallery.pop(gidx)
        path = item['path'] if isinstance(item, dict) else item
        full = os.path.join('static', 'images', 'children', path)
        if os.path.exists(full):
            os.remove(full)
    else:
        body = request.json or {}
        if 'comment' in body:
            if isinstance(gallery[gidx], str):
                gallery[gidx] = {'path': gallery[gidx], 'comment': body['comment']}
            else:
                gallery[gidx]['comment'] = body['comment']

    save_family(family)
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>/grandchild/<int:gidx>/photo', methods=['POST'])
@token_required
def upload_grandchild_photo(idx, gidx):
    family = load_family()
    if not (0 <= idx < len(family)):
        return jsonify({'error': 'Not found'}), 404
    gc = family[idx].get('grandchildren', [])
    if not (0 <= gidx < len(gc)):
        return jsonify({'error': 'Not found'}), 404
    if 'photo' not in request.files:
        return jsonify({'error': 'No file'}), 400
    folder = family[idx]['name'].lower().replace(' ', '_')
    gc_slug = gc[gidx]['name'].lower().replace(' ', '_').replace('(', '').replace(')', '')
    d = os.path.join('static', 'images', 'children', folder, 'grandchildren')
    os.makedirs(d, exist_ok=True)
    
    file = request.files['photo']
    res = process_and_save_image(file, d, gc_slug, img_type='grandchild')
    if "error" in res:
        return jsonify({'error': res["error"]}), 400
        
    path = f"{folder}/grandchildren/{res['filename']}"
    family[idx]['grandchildren'][gidx]['photo'] = path
    save_family(family)
    
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE photos SET phash = ? WHERE type = 'grandchild' AND path = ?", (res['phash'], path))
    conn.commit()
    conn.close()
    
    sync_file_bg(os.path.join(d, res['filename']))
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True})

# ── ADMIN EDIT GRANDPA ────────────────────────────────────────────────────────
@app.route('/api/admin/grandpa', methods=['PUT'])
@token_required
def update_grandpa():
    g = load_grandpa()
    body = request.json or {}
    for f in ['name', 'birth_year', 'death_year', 'birth_place', 'wife_name', 'final_words', 'life_story', 'firstborn_name', 'firstborn_note', 'activities']:
        if f in body:
            g[f] = body[f]
    save_grandpa(g)
    socketio.emit('grandpa_updated', {})
    return jsonify({'success': True, 'grandpa': g})

# ── ADMIN TRIBUTES ────────────────────────────────────────────────────────────
@app.route('/api/admin/tributes/<int:idx>', methods=['PUT', 'DELETE'])
@token_required
def manage_tribute(idx):
    tributes = _load(TRIBUTES_FILE)
    if not (0 <= idx < len(tributes)):
        return jsonify({'error': 'Not found'}), 404
    if request.method == 'DELETE':
        tributes.pop(idx)
    else:
        body = request.json or {}
        for f in ['name', 'relation', 'message']:
            if f in body:
                tributes[idx][f] = body[f]
    _save(TRIBUTES_FILE, tributes)
    return jsonify({'success': True})

# ── ADMIN EDIT PROGRAM ───────────────────────────────────────────────────────
PROGRAM_FILE = os.path.join(DATA_DIR, 'program.json')

@app.route('/api/admin/program', methods=['PUT'])
@token_required
def update_program():
    prog = _load(PROGRAM_FILE, DEFAULT_PROGRAM.copy())
    body = request.json or {}
    for f in ['event_name','date','venue','venue_address','time_start','time_end','dress_code','burial_location','hymnal_1','hymnal_2']:
        if f in body:
            prog[f] = body[f]
    if 'order' in body:
        prog['order'] = body['order']
    _save(PROGRAM_FILE, prog)
    socketio.emit('program_updated', {})
    return jsonify({'success': True, 'program': prog})

# ── FEEDBACK ──────────────────────────────────────────────────────────────────
FEEDBACK_FILE = os.path.join(DATA_DIR, 'feedback.json')

@app.route('/api/feedback', methods=['GET', 'POST'])
def api_feedback():
    if request.method == 'POST':
        body = request.json or {}
        msg = body.get('message', '').strip()
        if not msg:
            return jsonify({'error': 'Message required'}), 400
        entry = {
            'name': body.get('name', 'Anonymous'),
            'rating': body.get('rating', 5),
            'message': msg,
            'date': datetime.now().strftime('%B %d, %Y'),
            'time': now_str()
        }
        items = _load(FEEDBACK_FILE)
        items.append(entry)
        _save(FEEDBACK_FILE, items)
        log_activity(entry['name'], 'feedback', msg[:80])
        socketio.emit('new_feedback', entry)
        return jsonify({'success': True, 'feedback': entry})
    return jsonify(_load(FEEDBACK_FILE))

@app.route('/api/admin/feedback/<int:idx>', methods=['DELETE'])
@token_required
def delete_feedback(idx):
    items = _load(FEEDBACK_FILE)
    if not (0 <= idx < len(items)):
        return jsonify({'error': 'Not found'}), 404
    items.pop(idx)
    _save(FEEDBACK_FILE, items)
    return jsonify({'success': True})

# ── ADMIN LIFE PHOTOS ─────────────────────────────────────────────────────────
@app.route('/api/admin/life_photos', methods=['POST'])
@token_required
def upload_admin_life_photo():
    if 'photo' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['photo']
    d = os.path.join('static', 'images', 'life_photos')
    os.makedirs(d, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{ts}_{file.filename.replace(' ', '_')}"
    path = os.path.join(d, filename)
    file.save(path)
    sync_file_bg(path)
    socketio.emit('grandpa_updated', {})
    return jsonify({'success': True, 'file': filename})

@app.route('/api/admin/life_photos/<filename>', methods=['DELETE'])
@token_required
def delete_admin_life_photo(filename):
    path = os.path.join('static', 'images', 'life_photos', filename)
    if os.path.exists(path):
        os.remove(path)
    socketio.emit('grandpa_updated', {})
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>/grandchild/<int:gidx>', methods=['PUT', 'DELETE'])
@token_required
def manage_grandchild(idx, gidx):
    family = load_family()
    if not (0 <= idx < len(family)): return jsonify({'error': 'Not found'}), 404
    gc = family[idx].get('grandchildren', [])
    if not (0 <= gidx < len(gc)): return jsonify({'error': 'Not found'}), 404
    
    if request.method == 'DELETE':
        gc.pop(gidx)
    else:
        body = request.json or {}
        if 'name' in body:
            gc[gidx]['name'] = body['name']
        if 'tribute' in body:
            gc[gidx]['tribute'] = body['tribute']
            
    family[idx]['grandchildren'] = gc
    save_family(family)
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True})

@app.route('/api/admin/family/<int:idx>/grandchild', methods=['POST'])
@token_required
def add_grandchild(idx):
    family = load_family()
    if not (0 <= idx < len(family)): return jsonify({'error': 'Not found'}), 404
    gc = family[idx].get('grandchildren', [])
    gc.append({'name': 'New Grandchild', 'tribute': '', 'photo': ''})
    family[idx]['grandchildren'] = gc
    save_family(family)
    socketio.emit('family_updated', {'idx': idx})
    return jsonify({'success': True})

# ── ADMIN REQUESTS ────────────────────────────────────────────────────────────
@app.route('/api/admin/requests/<int:idx>', methods=['PUT'])
@token_required
def handle_admin_request(idx):
    reqs = _load(REQUESTS_FILE)
    if not (0 <= idx < len(reqs)):
        return jsonify({'error': 'Not found'}), 404
    reqs[idx]['status'] = (request.json or {}).get('status', 'pending')
    _save(REQUESTS_FILE, reqs)
    return jsonify({'success': True})

# ── ADMIN DATA (updated to include feedback & program) ────────────────────────

# ── STATIC FRONTEND SERVING ───────────────────────────────────────────────────
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Skip API and WebSocket routes
    if path.startswith('api/') or path.startswith('socket.io/'):
        return jsonify({'error': 'Not found'}), 404
    
    dist_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
    file_path = os.path.join(dist_dir, path)
    
    # If the file exists, serve it with correct MIME type
    if path != "" and os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(dist_dir, path)
    
    # For all other paths (including React routes), serve index.html
    return send_from_directory(dist_dir, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
