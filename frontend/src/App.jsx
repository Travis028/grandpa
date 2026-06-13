import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, Component } from 'react';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import Life from './pages/Life';
import Program from './pages/Program';
import Admin from './pages/Admin';
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
  const url = 'https://tiny-ganache-32bfab.netlify.app';
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

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ visitors }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <p className="footer-dates">1940 — 2026</p>
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
  const socketRef = useRef(null);
  const nameRef = useRef(localStorage.getItem('visitorName'));

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      // polling first — most reliable through proxies/firewalls, upgrades to websocket if possible
      transports: ['polling', 'websocket'],
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
      <Router>
        <PageTracker socketRef={socketRef} />
        <Navbar visitors={visitors} />
        <Routes>
          <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="/life" element={<ErrorBoundary><Life /></ErrorBoundary>} />
          <Route path="/program" element={<ErrorBoundary><Program /></ErrorBoundary>} />
          <Route path="/admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
        </Routes>
        <Footer />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
