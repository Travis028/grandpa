# Grandpa Memorial Website

A modern, responsive memorial application built with a React frontend and Python (Flask) backend to honor and celebrate the life of APOLLO J. FIZVALENTINE OWINO. 

## Architecture & Migration Details

Originally built as a server-side rendered application with Flask and Jinja templates, this project has been fully migrated to a modern Single Page Application (SPA) stack using **React** and **Vite**, powered by a **Python API**.

### Key Changes During Migration:
- **Separation of Concerns:** The backend now strictly serves JSON data via REST APIs, while the React frontend handles all routing, state, and UI.
- **Emoji-Free Codebase:** As requested, all emojis have been strictly removed from both the data and the UI to ensure compatibility and a highly formal aesthetic.
- **Dynamic Image Support for Admins:** The backend automatically scans the `static/images/memories/` and `static/images/life_photos/` directories. Admins can simply drop images directly into those folders post-deployment, and the frontend will fetch and display them automatically—no code changes required.
- **Old Files Archived:** The legacy Jinja templates and CSS files have been safely archived in the `archive/` folder.
- **Responsive UI & Premium Aesthetics:** The React components utilize modern CSS practices (imported from the legacy design) ensuring the site looks beautiful on desktop, tablet, and mobile browsers.

## Project Structure

```
grandpa/
├── app.py                  # Main Flask API backend
├── requirements.txt        # Python dependencies
├── data/
│   └── tributes.json       # User-submitted tributes
├── static/
│   ├── images/             # Admin-managed photo directories
│   │   ├── children/
│   │   ├── grandpa/
│   │   ├── life_photos/
│   │   └── memories/
├── frontend/               # React Application (Vite)
│   ├── src/
│   │   ├── pages/          # React route components
│   │   ├── App.jsx         # Layout & Routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Premium styles
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite proxy & build config
└── archive/                # Legacy files
```

## How to Run the Project Locally

To run the full stack during development, you will need to run both the backend API and the frontend dev server.

### 1. Start the Python (Flask) Backend API
Open your terminal in the root directory (`grandpa/`) and run:
```bash
# Install dependencies if you haven't already
pip install -r requirements.txt

# Run the server (starts on http://127.0.0.1:5000)
python app.py
```

### 2. Start the React Frontend Dev Server
Open a second terminal, navigate into the `frontend/` directory, and run:
```bash
# Move to frontend folder
cd frontend

# Install Node modules (if you haven't already)
npm install

# Run Vite dev server
npm run dev
```
Vite will proxy all `/api` requests to `localhost:5000`. You can now view the app at the URL provided by Vite (typically `http://localhost:5173`).

## Managing Photos (Admin Post-Deployment)

You can add new photos at any time without rebuilding the application:
1. **Memories Gallery:** Drop any `.jpg` or `.png` into `static/images/memories/`. The app auto-extracts the file name as the caption.
2. **Life Story Photos:** Drop photos into `static/images/life_photos/`.
3. **Family Member Photos:** Replace images in `static/images/children/` ensuring the file names match what is defined in `app.py`.

The React application will fetch these from the API seamlessly!
