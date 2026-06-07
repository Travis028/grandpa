import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, Component } from 'react';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import Life from './pages/Life';
import Program from './pages/Program';
import Admin from './pages/Admin';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{padding:'5rem',textAlign:'center'}}>
        <h2>Something went wrong.</h2>
        <p>Please refresh the page.</p>
        <button onClick={() => window.location.reload()} style={{marginTop:'1rem',padding:'10px 20px',cursor:'pointer'}}>Refresh</button>
      </div>
    );
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visitors, setVisitors] = useState(1);

  useEffect(() => {
    // Connect to WebSocket with error handling
    let socket;
    try {
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 5000,
      });
      socket.on('visitor_count', (data) => setVisitors(data.count));
      socket.on('connect_error', () => socket.disconnect());
    } catch (e) {
      // socket failed silently, visitors stays at 1
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (socket) socket.disconnect();
    };
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
          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/life">His Life</Link></li>
          <li><Link to="/program">Program</Link></li>
          <li><Link to="/admin" className="admin-nav-btn">Admin</Link></li>
        </ul>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container text-center">
        <div className="footer-ornament">✦</div>
        <p className="footer-name">APOLLO J. FIZVALENTINE OWINO.</p>
        <p className="footer-dates">1940 — 2026</p>
        <p className="footer-credit">In Loving Memory</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Navbar />
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
