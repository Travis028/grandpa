# APOLLO J. FIZVALENTINE OWINO — Memorial Website

A modern, responsive memorial web application built to honour and celebrate the life of **APOLLO J. FIZVALENTINE OWINO**.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Netlify) | https://tiny-ganache-32bfab.netlify.app |
| Backend API (Render) | https://grandpa-99ef.onrender.com |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Python 3.12 + Flask + Flask-SocketIO |
| Hosting (Frontend) | Netlify |
| Hosting (Backend) | Render (free tier) |
| Real-time | Socket.IO (WebSockets) |
| Auth | PyJWT |

---

## Project Structure

```
grandpa/
├── app.py                        # Flask API — all routes and logic
├── requirements.txt              # Python dependencies
├── Procfile                      # Render start command
├── netlify.toml                  # Netlify build config
├── data/                         # Persistent JSON data (all admin changes saved here)
│   ├── grandpa.json              # Grandpa info (editable by admin)
│   ├── family.json               # Family data with gallery (editable by admin)
│   ├── program.json              # Funeral program (editable by admin)
│   ├── tributes.json             # User-submitted tributes
│   ├── feedback.json             # User feedback (admin-only view)
│   ├── visitors.json             # All named visitors log
│   ├── activity.json             # Full activity log
│   ├── shares.json               # Share tracking log
│   └── admin_requests.json       # Admin access requests
├── static/
│   └── images/
│       ├── grandpa/              # Main hero photo
│       ├── children/             # Family portraits + galleries + grandchildren
│       ├── memories/             # Memory gallery photos (drop files here)
│       └── life_photos/          # Life story photos (drop files here)
└── frontend/                     # React SPA (Vite)
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx          # Main page — family, tributes, memories
    │   │   ├── Life.jsx          # Life story page
    │   │   ├── Program.jsx       # Funeral program + feedback form
    │   │   └── Admin.jsx         # Full admin dashboard
    │   ├── App.jsx               # Router, Navbar, Footer, visitor modal
    │   ├── config.js             # Axios instance with API base URL
    │   ├── main.jsx              # React entry point
    │   └── index.css             # All styles
    ├── .env.production           # VITE_API_URL=https://grandpa-99ef.onrender.com
    ├── vite.config.js            # Vite config with dev proxy
    └── package.json
```

---

## Admin Credentials

| Field | Value |
|-------|-------|
| Username | `apolloowino` |
| Password | `apolloowino` |

Admin panel is at: `https://tiny-ganache-32bfab.netlify.app/admin`

---

## Admin Dashboard Features

The admin dashboard has the following tabs:

- **Overview** — Live visitor count, total visitors, named visitors list, live activity table (who is on site, what page), tributes count, shares count, pending requests
- **Grandpa Info** — Edit name, birth year, death year, birth place, wife name, final words, full life story
- **Program** — Edit all funeral program details and order of service (add/remove/edit items)
- **Activity** — Full activity log (last 100 actions) — who visited, navigated, shared, left a tribute or feedback. Share breakdown by platform
- **Family** — Edit every child's name, spouse, note, tribute. Upload portrait. Add/remove gallery photos. Upload grandchild photos
- **Tributes** — View, edit, delete all user-submitted tributes
- **Feedback** — View all user feedback with star ratings (private — users cannot see each other's feedback). Delete entries
- **Requests** — Approve or deny admin access requests submitted via the site

All changes are saved permanently to JSON files in the `data/` folder and survive server restarts.

---

## Public Features

- **Visitor name prompt** — every visitor must enter their name on first visit. Logged for admin
- **Live visitor count** — shown in navbar via WebSocket
- **Family section** — each child with portrait, tribute, grandchildren, and gallery
- **Tributes** — visitors can leave tributes (name, relation, message)
- **Feedback** — visitors can leave private star-rated feedback (admin-only view)
- **Share button** — footer share button for WhatsApp, Facebook, Twitter/X, Copy Link. All shares tracked
- **Retry on wake-up** — if Render is sleeping (free tier), the site retries automatically up to 3 times

---

## How to Run Locally

### 1. Backend (Flask)
```bash
# From the grandpa/ root folder
pip install -r requirements.txt
python app.py
# Runs on http://127.0.0.1:5000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# All /api calls are proxied to localhost:5000
```

---

## Deployment

### Backend — Render
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn --worker-class eventlet -w 1 app:app` (set in `Procfile`)
- **Environment:** Python 3.12
- No environment variables needed

### Frontend — Netlify
- **Base directory:** `frontend`
- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **Environment variable:** `VITE_API_URL=https://grandpa-99ef.onrender.com` (set in `frontend/.env.production` — committed to repo, no dashboard config needed)
- SPA redirects handled by `netlify.toml` and `public/_redirects`

### To deploy updates
```bash
git add .
git commit -m "your message"
git push
```
Both Render and Netlify auto-deploy on every push to the main branch.

---

## Managing Photos Without Redeploying

| Photo Type | Folder | How |
|-----------|--------|-----|
| Memory gallery | `static/images/memories/` | Drop `.jpg`/`.png` files — auto-detected |
| Life story photos | `static/images/life_photos/` | Drop `.jpg`/`.png` files — auto-detected |
| Family portraits | Admin dashboard → Family tab | Upload via admin |
| Family gallery | Admin dashboard → Family tab | Upload via admin |
| Grandchild photos | Admin dashboard → Family tab | Upload via admin |

> **Note:** On Render free tier, uploaded images are stored on the server's ephemeral disk and will be lost on restart. For permanent image storage, upgrade to a paid Render plan or integrate Cloudinary.

---

## Important Notes

- Render free tier **sleeps after 15 minutes** of inactivity. First load after sleep takes ~30–60 seconds. The site retries automatically
- All data in `data/*.json` files persists as long as the Render service is not redeployed from scratch
- The `data/` folder is gitignored — production data lives only on the Render server
