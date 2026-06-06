import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Life from './pages/Life';
import Program from './pages/Program';

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">APOLLO J. FIZVALENTINE OWINO.</Link>
        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/life">His Life</Link></li>
          <li><Link to="/program">Program</Link></li>
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
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/life" element={<Life />} />
        <Route path="/program" element={<Program />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
