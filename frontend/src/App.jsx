import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, Component } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import Life from './pages/Life';
import Program from './pages/Program';
import Admin from './pages/Admin';
import FamilyDetail from './pages/FamilyDetail';
import Tributes from './pages/Tributes';
import FloatingFlowers from './components/FloatingFlowers';
import api from './config';

// Keep Render awake — ping every 14 min so it never sleeps while a user is connected
const ping = () => fetch(`/api/grandpa`).catch(() => {});
ping();
setInterval(ping, 14 * 60 * 1000);

// ── Error Boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: '5rem', textAlign: 'center' }}>
        <h2>Something went wrong.</h2>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '10px 20px', cursor: 'pointer' }}>Refresh</button>
      </div>
    );
    return this.props.children;
  }
}

// ── Install App Button ──────────────────────────────────────────────────────────
function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt) return null;

  const handleInstallClick = async () => {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  return (
    <button 
      onClick={handleInstallClick} 
      style={{
        background: 'var(--gold)',
        color: 'var(--charcoal)',
        border: 'none',
        borderRadius: '20px',
        padding: '5px 15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9rem',
        boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
      title="Install Memorial App"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Install App
    </button>
  );
}

// ── Visitor Name Modal ─────────────────────────────────────────────────────────
function VisitorModal({ onDone }) {
  const [name, setName] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim() || 'Guest';
    localStorage.setItem('visitorName', n);
    onDone(n);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 32px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>Welcome</h3>
        <p style={{ color: '#666', marginBottom: '24px', fontSize: '0.95rem' }}>
          Please enter your name so the family knows you visited this memorial.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            autoFocus
            type="text"
            placeholder="Your full name e.g. Jane Owino"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', textAlign: 'center' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}>
            Enter Memorial
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Share Button ───────────────────────────────────────────────────────────────
function ShareButton() {
  const [open, setOpen] = useState(false);
  const url = window.location.origin;
  const text = 'Join us in honouring the life of APOLLO J. FIZVALENTINE OWINO.';
  const visitorName = localStorage.getItem('visitorName') || 'Guest';

  const track = (platform) => {
    api.post('/api/track_share', { name: visitorName, platform }).catch(() => {});
    setOpen(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    track('Copy Link');
    alert('Link copied!');
  };

  const platforms = [
    { name: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { name: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Twitter/X', color: '#000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)}
        style={{ padding: '10px 22px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
        Share This Memorial
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '180px' }}>
          {platforms.map(p => (
            <a key={p.name} href={p.href} target="_blank" rel="noreferrer" onClick={() => track(p.name)}
              style={{ display: 'block', padding: '10px 14px', marginBottom: '6px', background: p.color, color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', textAlign: 'center' }}>
              {p.name}
            </a>
          ))}
          <button onClick={copyLink}
            style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#555', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page Tracker ───────────────────────────────────────────────────────────────
function PageTracker({ socketRef }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const name = localStorage.getItem('visitorName') || 'Guest';
    const sid = socketRef.current?.id || '';
    api.post('/api/track_page', { name, page: pathname, sid }).catch(() => {});
  }, [pathname]);
  return null;
}

// ── Site Loader ───────────────────────────────────────────────────────────────
function SiteLoader({ loaded }) {
  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-color)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'var(--gold)'
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', letterSpacing: '2px' }}
          >
            APOLLO J. FIZVALENTINE OWINO.
          </motion.div>
          <div style={{ marginTop: '20px', width: '40px', height: '40px', border: '3px solid rgba(212, 175, 55, 0.3)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ visitors }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">APOLLO J. FIZVALENTINE OWINO.</Link>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <InstallAppButton />
          <button onClick={toggleTheme} title="Toggle Theme" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--gold)', padding: '0', display: 'flex' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="live-visitors">
            <span className="live-dot"></span>
            {visitors} Live
          </div>
          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/life" onClick={() => setMenuOpen(false)}>His Life</Link></li>
          <li><Link to="/program" onClick={() => setMenuOpen(false)}>Program</Link></li>
          <li><Link to="/admin" className="admin-nav-btn" onClick={() => setMenuOpen(false)}>Admin</Link></li>
        </ul>
      </div>
    </nav>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="container text-center">
        <div className="footer-ornament">✦</div>
        <p className="footer-name">APOLLO J. FIZVALENTINE OWINO.</p>
        <p className="footer-dates">1952 — 2026</p>
        <div style={{ margin: '20px 0' }}>
          <ShareButton />
        </div>
        <p className="footer-credit">In Loving Memory</p>
      </div>
    </footer>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  const [visitors, setVisitors] = useState(0);
  const [visitorName, setVisitorName] = useState(localStorage.getItem('visitorName'));
  const [appLoaded, setAppLoaded] = useState(false);
  const socketRef = useRef(null);
  const nameRef = useRef(localStorage.getItem('visitorName'));

  useEffect(() => {
    // Preload the heavy background image for a smooth reveal
    const img = new Image();
    img.src = '/api/static/images/grandpa/main_photo.jpg';
    img.onload = () => setTimeout(() => setAppLoaded(true), 300); // Slight delay for smoothness
    img.onerror = () => setAppLoaded(true); // Fallback if image doesn't exist yet
  }, []);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      // Force polling to avoid websocket connection errors on Render's free tier proxy
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // As soon as connected, send the visitor's name so server knows who this is
      const name = nameRef.current;
      if (name) socket.emit('set_name', { name });
    });

    socket.on('visitor_count', (data) => {
      setVisitors(data.count);
    });

    socket.on('connect_error', () => {
      // fail silently — page still works without socket
    });

    return () => socket.disconnect();
  }, []);

  // Global Interactive Click Event Listener
  useEffect(() => {
    const handleMouseClick = (e) => {
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => {
        if (document.body.contains(ripple)) {
          ripple.remove();
        }
      }, 600);
    };
    window.addEventListener('click', handleMouseClick);
    return () => window.removeEventListener('click', handleMouseClick);
  }, []);

  const handleNameSet = (name) => {
    nameRef.current = name;
    setVisitorName(name);
    // Register visitor in DB
    api.post('/api/register_visitor', { name }).catch(() => {});
    // Tell socket server this visitor's name
    if (socketRef.current?.connected) {
      socketRef.current.emit('set_name', { name });
    }
  };

  return (
    <ErrorBoundary>
      {!visitorName && <VisitorModal onDone={handleNameSet} />}
      <SiteLoader loaded={appLoaded} />
      <Router>
        <PageTracker socketRef={socketRef} />
        <Navbar visitors={visitors} />
        <AnimatedRoutes />
        <Footer />
      </Router>
    </ErrorBoundary>
  );
}

// ── Animated Routes ────────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <FloatingFlowers />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><ErrorBoundary><Home /></ErrorBoundary></PageTransition>} />
        <Route path="/life" element={<PageTransition><ErrorBoundary><Life /></ErrorBoundary></PageTransition>} />
        <Route path="/tributes" element={<PageTransition><ErrorBoundary><Tributes /></ErrorBoundary></PageTransition>} />
        <Route path="/program" element={<PageTransition><ErrorBoundary><Program /></ErrorBoundary></PageTransition>} />
        <Route path="/family/:id" element={<PageTransition><ErrorBoundary><FamilyDetail /></ErrorBoundary></PageTransition>} />
        <Route path="/admin" element={<PageTransition><ErrorBoundary><Admin /></ErrorBoundary></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export default App;
