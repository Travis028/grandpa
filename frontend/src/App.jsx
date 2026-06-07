import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, Component } from 'react';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import Life from './pages/Life';
import Program from './pages/Program';
import Admin from './pages/Admin';
import api from './config';

// ── Error Boundary ────────────────────────────────────────────────────────────
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

// ── Visitor Name Modal ────────────────────────────────────────────────────────
function VisitorModal({ onDone }) {
  const [name, setName] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim() || 'Guest';
    localStorage.setItem('visitorName', n);
    onDone(n);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
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

// ── Share Button ──────────────────────────────────────────────────────────────
function ShareButton() {
  const [open, setOpen] = useState(false);
  const url = window.location.origin;
  const text = 'Join us in honouring the life of APOLLO J. FIZVALENTINE OWINO.';
  const visitorName = localStorage.getItem('visitorName') || 'Guest';

  const track = (platform) => {
    api.post('/api/track_share', { name: visitorName, platform }).catch(() => {});
    setOpen(false);
  };

  const platforms = [
    { name: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { name: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Twitter/X', color: '#000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: 'Copy Link', color: '#555', href: null },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    track('copy_link');
    alert('Link copied!');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)}
        style={{ padding: '10px 22px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
        Share This Memorial
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '200px' }}>
          {platforms.map(p => (
            p.href ? (
              <a key={p.name} href={p.href} target="_blank" rel="noreferrer" onClick={() => track(p.name)}
                style={{ display: 'block', padding: '10px 14px', marginBottom: '6px', background: p.color, color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', textAlign: 'center' }}>
                {p.name}
              </a>
            ) : (
              <button key={p.name} onClick={copyLink}
                style={{ display: 'block', width: '100%', padding: '10px 14px', background: p.color, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                {p.name}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page Tracker ──────────────────────────────────────────────────────────────
function PageTracker({ socket }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const name = localStorage.getItem('visitorName') || 'Guest';
    const sid = socket?.id || '';
    api.post('/api/track_page', { name, page: pathname, sid }).catch(() => {});
  }, [pathname]);
  return null;
}

// ── Navbar ────────────────────────────────────────────────────────────────────
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

// ── Footer ────────────────────────────────────────────────────────────────────
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

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [visitors, setVisitors] = useState(1);
  const [visitorName, setVisitorName] = useState(localStorage.getItem('visitorName'));
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;
    try {
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 8000,
      });
      socketRef.current = socket;
      socket.on('visitor_count', (data) => setVisitors(data.count));
      socket.on('connect_error', () => {});
    } catch (e) {}
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const handleNameSet = (name) => {
    setVisitorName(name);
    api.post('/api/register_visitor', { name }).catch(() => {});
    if (socketRef.current) {
      socketRef.current.emit('set_name', { name });
    }
  };

  return (
    <ErrorBoundary>
      {!visitorName && <VisitorModal onDone={handleNameSet} />}
      <Router>
        <PageTracker socket={socketRef.current} />
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
