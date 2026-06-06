from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import jwt
from functools import wraps
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder='static')
CORS(app) # Enable CORS for React frontend
app.secret_key = 'your-secret-key-here-change-this'
app.config['JWT_SECRET'] = 'admin-secret-key-change-this'
socketio = SocketIO(app, cors_allowed_origins="*")

active_visitors_data = {}

# ============================================
# DATA (Edit this to add/change family info)
# ============================================

# Grandpa's basic info
GRANDPA_INFO = {
    "name": "APOLLO J. FIZVALENTINE OWINO.",
    "name_alt": "APOLLO J. FIZVALENTINE OWINO.",
    "birth_year": "1940",
    "death_year": "2026",
    "birth_place": "[Fill in: Village/Town, Kenya]",
    "wife_name": "Joyce Owino",
    "final_words": "God was good to me.",
    "life_story": """
        APOLLO J. FIZVALENTINE OWINO. was born in [FILL IN] to [FILL IN PARENTS' NAMES]. 
        He grew up knowing the value of hard work and faith. Throughout his life, 
        he was known for his quiet strength, his generous spirit, and his deep love 
        for his family.
        
        He worked as a [FILL IN OCCUPATION] and provided for his family with dignity 
        and pride. Even in difficult times, he never complained. Instead, he taught 
        his children that every challenge is an opportunity to grow stronger.
        
        His faith was the foundation of his life. He believed in [FILL IN FAITH/CHURCH] 
        and prayed for his family every single day.
        
        In his final months, he faced [FILL IN ILLNESS] with remarkable courage. 
        Even when his body grew weak, his spirit remained strong. His last words 
        to his family were, "God was good to me."
    """
}

# Family data - each child with their tribute and grandchildren
FAMILY_DATA = [
    {
        "name": "Evans Odhiambo",
        "spouse": "Mama Young",
        "note": "",
        "portrait": "evans_odhiambo/portrait.jpg",
        "tribute": "[FILL IN: Evans' tribute to Grandpa]",
        "grandchildren": [
            {"name": "Kevins Ochieng", "photo": "evans_odhiambo/grandchildren/kevins.jpg"},
            {"name": "Awuor", "photo": "evans_odhiambo/grandchildren/awuor.jpg"},
            {
                "name": "Peter Odhiambo",
                "photo": "peter_odhiambo/portrait.jpg",
                "tribute": "[FILL IN: Peter's tribute to Dad]"
            },
            {
                "name": "Elly Opiyo",
                "photo": "elly_opiyo/portrait.jpg",
                "note": "Twin to Peter",
                "tribute": "[FILL IN: Elly's tribute to Dad]"
            },
            {
                "name": "Felix Otieno",
                "photo": "felix_otieno/portrait.jpg",
                "tribute": "[FILL IN: Felix's tribute to Dad]"
            }
        ]
    },
    {
        "name": "Joy Odhiambo",
        "spouse": "",
        "note": "",
        "portrait": "joy_odhiambo/portrait.jpg",
        "tribute": "[FILL IN: Joy's tribute to Dad]",
        "grandchildren": []
    },
    {
        "name": "Jeff Apollo",
        "spouse": "Roseline Jeff",
        "note": "",
        "portrait": "jeff_apollo/portrait.jpg",
        "tribute": "[FILL IN: Jeff's tribute to Dad]",
        "grandchildren": [
            {"name": "Dean Revs Ochieng", "photo": "jeff_apollo/grandchildren/dean.jpg"},
            {"name": "Jimmy Adams", "photo": "jeff_apollo/grandchildren/jimmy.jpg"},
            {"name": "Mark Johoo", "photo": "jeff_apollo/grandchildren/mark.jpg"},
            {"name": "Amaya Joy", "photo": "jeff_apollo/grandchildren/amaya.jpg"}
        ]
    },
    {
        "name": "Cherls Were",
        "spouse": "Lilian Were",
        "note": "",
        "portrait": "cherls_were/portrait.jpg",
        "tribute": "[FILL IN: Cherls' tribute to Grandpa]",
        "grandchildren": [
            {"name": "Dashon Tindely", "photo": "cherls_were/grandchildren/dashon.jpg"},
            {"name": "Pendo Daniela", "photo": "cherls_were/grandchildren/pendo.jpg"}
        ]
    },
    {
        "name": "Timothy Owino",
        "spouse": "Nancy Otieno",
        "note": "",
        "portrait": "timothy_owino/portrait.jpg",
        "tribute": "[FILL IN: Timothy's tribute to Dad]",
        "grandchildren": [
            {"name": "Wayne Travis", "photo": "timothy_owino/grandchildren/wayne.jpg"},
            {"name": "Natasha Pinkette", "photo": "timothy_owino/grandchildren/natasha.jpg"},
            {"name": "Emmanuela Winslette", "photo": "timothy_owino/grandchildren/emmanuela.jpg"},
            {"name": "Zach Gabriels", "photo": "timothy_owino/grandchildren/zach.jpg"}
        ]
    },
    {
        "name": "Hellon Owino",
        "spouse": "",
        "note": "",
        "portrait": "hellon_owino/portrait.jpg",
        "tribute": "[FILL IN: Hellon's tribute to Dad]",
        "grandchildren": [
            {"name": "Jerald Okello", "photo": "hellon_owino/grandchildren/jerald.jpg"},
            {"name": "Bevaline Okello", "photo": "hellon_owino/grandchildren/bevaline.jpg"},
            {"name": "Henry Okelo (Obash)", "photo": "hellon_owino/grandchildren/henry.jpg"},
            {"name": "Antonette Okello", "photo": "hellon_owino/grandchildren/antonette.jpg"},
            {"name": "Katindi", "photo": "hellon_owino/grandchildren/katindi.jpg"}
        ]
    },
    {
        "name": "Beryl Mercy",
        "spouse": "",
        "note": "",
        "portrait": "beryl_mercy/portrait.jpg",
        "tribute": "[FILL IN: Beryl's tribute to Dad]",
        "grandchildren": [
            {"name": "Peter", "photo": "beryl_mercy/grandchildren/peter.jpg"}
        ]
    },
    {
        "name": "Joan Apollo",
        "spouse": "",
        "note": "",
        "portrait": "joan_apollo/portrait.jpg",
        "tribute": "[FILL IN: Joan's tribute to Dad]",
        "grandchildren": [
            {"name": "Richard Leakey", "photo": "joan_apollo/grandchildren/richard.jpg"},
            {"name": "Macreen", "photo": "joan_apollo/grandchildren/macreen.jpg"},
            {"name": "Bonney", "photo": "joan_apollo/grandchildren/bonney.jpg"},
            {"name": "Siste", "photo": "joan_apollo/grandchildren/siste.jpg"},
            {"name": "Boss", "photo": "joan_apollo/grandchildren/boss.jpg"}
        ]
    }
]

# Firstborn who passed away
FIRSTBORN = {
    "name": "Bon Apollo",
    "note": "Firstborn of APOLLO J. FIZVALENTINE OWINO. Preceded his father in death. Forever remembered. Forever loved."
}

# Memory photos - ADMIN CAN ADD PHOTOS EXTERNALLY
# Just drop any .jpg or .png file into static/images/memories/
# The app will automatically show them
def get_memory_photos():
    """Auto-detect photos in memories folder - admin can add externally anytime"""
    memories_dir = os.path.join('static', 'images', 'memories')
    memories = []
    if os.path.exists(memories_dir):
        for filename in os.listdir(memories_dir):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                # Extract caption from filename or use default
                caption = filename.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').replace('_', ' ').title()
                memories.append({
                    "file": filename,
                    "caption": caption,
                    "submitted_by": "Family"
                })
    # Add some default placeholders if no photos exist
    if not memories:
        memories = [
            {"file": "placeholder1.jpg", "caption": "Add your photos here", "submitted_by": "Admin"},
            {"file": "placeholder2.jpg", "caption": "Drop photos into static/images/memories/", "submitted_by": "Admin"},
        ]
    return memories

# Life photos - auto detect
def get_life_photos():
    """Auto-detect photos in life_photos folder"""
    life_dir = os.path.join('static', 'images', 'life_photos')
    photos = []
    if os.path.exists(life_dir):
        for filename in os.listdir(life_dir):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                photos.append(filename)
    return photos

# Tributes storage
TRIBUTES_FILE = 'data/tributes.json'

def load_tributes():
    if os.path.exists(TRIBUTES_FILE):
        with open(TRIBUTES_FILE, 'r') as f:
            return json.load(f)
    return []

def save_tribute(tribute):
    tributes = load_tributes()
    tributes.append(tribute)
    os.makedirs('data', exist_ok=True)
    with open(TRIBUTES_FILE, 'w') as f:
        json.dump(tributes, f, indent=2)

# Program data
PROGRAM_DATA = {
    "event_name": "Memorial & Funeral Service",
    "date": "[FILL IN DATE]",
    "venue": "[FILL IN CHURCH/HALL NAME AND LOCATION]",
    "venue_address": "[FILL IN FULL ADDRESS]",
    "time_start": "[FILL IN START TIME, e.g. 10:00 AM]",
    "time_end": "[FILL IN END TIME, e.g. 2:00 PM]",
    "dress_code": "[FILL IN: Smart casual / All white / Dark colors]",
    "burial_location": "[FILL IN CEMETERY OR HOME LOCATION]",
    "order": [
        {"time": "10:00 AM", "item": "Opening Prayer", "leader": "[FILL IN NAME]"},
        {"time": "10:10 AM", "item": "Hymn / Worship", "leader": "Family"},
        {"time": "10:20 AM", "item": "Scripture Reading", "leader": "[FILL IN NAME]"},
        {"time": "10:30 AM", "item": "Eulogy Reading", "leader": "Family"},
        {"time": "11:00 AM", "item": "Tributes from Children", "leader": "Each child speaks"},
        {"time": "11:45 AM", "item": "Special Song", "leader": "[FILL IN NAME]"},
        {"time": "12:00 PM", "item": "Message / Sermon", "leader": "[FILL IN PASTOR/MINISTER]"},
        {"time": "12:30 PM", "item": "Final Prayer & Blessing", "leader": "[FILL IN NAME]"},
        {"time": "1:00 PM", "item": "Burial / Committal", "leader": "At the graveside"},
        {"time": "2:00 PM", "item": "Lunch & Fellowship", "leader": "All are invited"}
    ]
}

# ============================================
# API ROUTES (JSON)
# ============================================

@app.route('/api/grandpa')
def get_grandpa():
    return jsonify(GRANDPA_INFO)

@app.route('/api/family')
def get_family():
    return jsonify({
        "family": FAMILY_DATA,
        "firstborn": FIRSTBORN
    })

@app.route('/api/memories')
def api_memories():
    return jsonify(get_memory_photos())

@app.route('/api/life_photos')
def api_life_photos():
    return jsonify(get_life_photos())

@app.route('/api/program')
def get_program():
    return jsonify(PROGRAM_DATA)

@app.route('/api/tributes', methods=['GET', 'POST'])
def api_tributes():
    if request.method == 'POST':
        data = request.json
        name = data.get('name', 'Anonymous')
        relation = data.get('relation', 'Friend')
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
            
        tribute = {
            'name': name,
            'relation': relation,
            'message': message,
            'date': datetime.now().strftime('%B %d, %Y')
        }
        save_tribute(tribute)
        return jsonify({"success": True, "tribute": tribute})
        
    return jsonify(load_tributes())

# Serve static files for photos
@app.route('/api/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

# ============================================
# WEBSOCKETS (Live Visitors)
# ============================================
@app.route('/')
def index():
    return jsonify({"status": "Memorial API is running successfully!"})

@socketio.on('connect')
def handle_connect():
    active_visitors_data[request.sid] = {
        "ip": request.remote_addr,
        "time": datetime.now().strftime("%H:%M:%S")
    }
    emit('visitor_count', {'count': len(active_visitors_data)}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in active_visitors_data:
        del active_visitors_data[request.sid]
    emit('visitor_count', {'count': len(active_visitors_data)}, broadcast=True)

# ============================================
# ADMIN ROUTES (JWT Protected)
# ============================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1] # Bearer <token>
            data = jwt.decode(token, app.config['JWT_SECRET'], algorithms=["HS256"])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/admin/login', methods=['POST'])
def login():
    auth = request.json
    # Default admin credentials
    if auth and auth.get('username') == 'admin' and auth.get('password') == 'apolloowino':
        token = jwt.encode({'user': 'admin', 'exp': datetime.now().timestamp() + 3600}, app.config['JWT_SECRET'], algorithm="HS256")
        return jsonify({'token': token})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/admin/data', methods=['GET'])
@token_required
def get_admin_data():
    return jsonify({
        "grandpa": GRANDPA_INFO,
        "family": FAMILY_DATA,
        "tributes": load_tributes(),
        "live_visitors": len(active_visitors_data),
        "visitor_details": list(active_visitors_data.values())
    })

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

