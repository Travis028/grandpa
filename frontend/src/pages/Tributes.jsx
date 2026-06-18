import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api, { apiCache } from '../config';

function Reveal({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export default function Tributes() {
  const [tributes, setTributes] = useState([]);
  const [tributeForm, setTributeForm] = useState({ name: '', relation: '', message: '' });
  const [tributeMsg, setTributeMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCache.get('/api/tributes')
      .then(res => {
        setTributes(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    let socket;
    try {
      socket = io(socketUrl, { path: '/socket.io', transports: ['polling'] });
      socket.on('new_tribute', (tribute) => {
        setTributes(prev => {
          if (prev.some(t => t.name === tribute.name && t.message === tribute.message)) return prev;
          return [...prev, tribute];
        });
      });
    } catch {}
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const handleTributeSubmit = async (e) => {
    e.preventDefault();
    if (!tributeForm.message) return;
    try {
      const res = await api.post('/api/tributes', tributeForm);
      if (res.data.success) {
        setTributes([...tributes, res.data.tribute]);
        setTributeForm({ name: '', relation: '', message: '' });
        setTributeMsg('Thank you for your tribute. Your message has been added.');
        setTimeout(() => setTributeMsg(''), 5000);
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', backgroundColor: 'var(--bg-warm)' }}>
      {tributeMsg && (
        <div className="flash-container">
          <div className="flash-message">{tributeMsg}</div>
        </div>
      )}

      <div className="container-narrow" style={{ padding: '4rem 0' }}>
        <Reveal>
          <div className="section-header">
            <span className="section-tag">Words from the Heart</span>
            <h2 className="section-title">Tributes to Grandpa</h2>
            <div className="section-rule">
              <span className="section-rule-line"></span>
              <span className="section-rule-dot"></span>
              <span className="section-rule-line"></span>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="tribute-form-wrap" style={{ marginBottom: '4rem', marginTop: '0' }}>
            <h3 className="form-title">Leave a Tribute</h3>
            <p className="form-sub">Share a memory, a word of love, or a prayer for the family.</p>

            <form onSubmit={handleTributeSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="name">Your Name</label>
                  <input className="form-input" type="text" id="name" required placeholder="e.g. Auntie Jane" value={tributeForm.name} onChange={e => setTributeForm({...tributeForm, name: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="relation">Your Relation</label>
                  <input className="form-input" type="text" id="relation" placeholder="e.g. Grandchild, Friend, Neighbor" value={tributeForm.relation} onChange={e => setTributeForm({...tributeForm, relation: e.target.value})} />
                </div>
                <div className="form-field full">
                  <label className="form-label" htmlFor="message">Your Message</label>
                  <textarea className="form-textarea" id="message" required placeholder="Write your tribute here…" value={tributeForm.message} onChange={e => setTributeForm({...tributeForm, message: e.target.value})}></textarea>
                </div>
              </div>
              <button className="btn-submit" type="submit">Share Your Tribute →</button>
            </form>
          </div>
        </Reveal>

        <Reveal>
          <div className="ornament" style={{ marginBottom: '4rem' }}>✦ &nbsp;&nbsp; ✦ &nbsp;&nbsp; ✦</div>
        </Reveal>

        <div className="tributes-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading tributes...</div>
          ) : tributes && tributes.length > 0 ? (
            [...tributes].reverse().map((tribute, idx) => (
              <Reveal key={idx}>
                <div className="tribute-card">
                  <div className="tribute-quote-mark">"</div>
                  <p className="tribute-message">{tribute.message}</p>
                  <div className="tribute-meta">
                    <span className="tribute-name">{tribute.name}</span>
                    <span>·</span>
                    <span className="tribute-relation">{tribute.relation}</span>
                    <span>·</span>
                    <span className="tribute-date">{tribute.date}</span>
                  </div>
                </div>
              </Reveal>
            ))
          ) : (
            <Reveal>
              <div className="tribute-card">
                <div className="tribute-quote-mark">"</div>
                <p className="tribute-message">Be the first to leave a tribute for Grandpa.</p>
                <div className="tribute-meta">
                  <span className="tribute-name">Family</span>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
      
      <div className="container" style={{ textAlign: 'center', paddingBottom: '4rem' }}>
        <Link to="/" className="btn-secondary" style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '30px', fontWeight: '600' }}>← Return Home</Link>
      </div>
    </div>
  );
}
