# APOLLO J. FIZVALENTINE OWINO — Memorial Website

A modern, responsive memorial web application built to honour and celebrate the life of **APOLLO J. FIZVALENTINE OWINO**.

---

## Live URL

| Service | URL |
|---------|-----|
| Full Website (Render) | https://grandpa-99ef.onrender.com |

**Note**: The application has been updated to serve both the React Frontend and Flask Backend from a single Render instance. Netlify is no longer required.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Python 3.12 + Flask + Flask-SocketIO |
| Hosting | Render (Web Service) |
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
- **Grandpa Info** — Edit name, birth year, death year, birth place, wife name, final words. Includes a full rich text editor for formatting the life story.
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
- **Program Download** — highly visible button on the home page for users to easily download the memorial booklet
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

### Single Render Deployment (Frontend + Backend)
The entire application (frontend and backend) is deployed as a single Web Service on Render.

- **Build Command:** `./build.sh` (or `cd frontend && npm install && npm run build && cd .. && pip install -r requirements.txt`)
- **Start Command:** `gunicorn --worker-class eventlet -w 1 app:app`
- **Environment:** Python 3.12
- **Environment Variables:**
  - `GITHUB_TOKEN`: Required for data persistence to survive Render sleeps.

With this setup, Render will automatically build the React frontend and then start the Python server to host both the API and the static files.

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

> **Note:** The application uses an automated GitHub sync mechanism to ensure that any uploaded photos and data changes made in the admin dashboard survive server restarts. The `GITHUB_TOKEN` environment variable must be set in Render for this to work.

---

## Offline capabilities & PWA

The application is configured as a Progressive Web App (PWA). Once visitors load the page for the first time while connected to the internet, all assets and data are cached by a Service Worker. They can completely disconnect from the internet and the site will still load perfectly.

To deploy fully offline on a local LAN (e.g., on a local computer at a funeral venue):

1. Run `./build.sh` (which builds the frontend and installs backend dependencies).
2. Run `python app.py`.
3. Open a browser to `http://localhost:5000`. 

If the host computer is connected to a local Wi-Fi router (even with no internet), anyone connected to that router can access the memorial via the host's local IP address (e.g., `http://192.168.1.5:5000`).

---

## Scaling & Capacity
The backend uses **Gunicorn** combined with **Eventlet** asynchronous workers to efficiently handle concurrent WebSocket connections and API requests. The Render free tier (with 512MB RAM) is fully capable of withstanding **up to 1,000 concurrent visitors** seamlessly due to this non-blocking architecture and the newly implemented frontend data caching strategy.

---

## Important Notes

- Render free tier **sleeps after 15 minutes** of inactivity. The first load after sleep takes ~30–60 seconds while the backend spins up.
- All JSON data and uploaded images are automatically synced to the `Travis028/grandpa` GitHub repository to prevent data loss when Render sleeps.
