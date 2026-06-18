import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api, { apiCache, API_BASE } from '../config';

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
  const [grandpa, setGrandpa] = useState(null);
  const [tributeForm, setTributeForm] = useState({ name: '', relation: '', message: '', media: null });
  const [tributeMsg, setTributeMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiCache.get('/api/tributes'),
      apiCache.get('/api/grandpa')
    ]).then(([resTributes, resGrandpa]) => {
        setTributes(resTributes.data);
        setGrandpa(resGrandpa.data);
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
      const formData = new FormData();
      formData.append('name', tributeForm.name);
      formData.append('relation', tributeForm.relation);
      formData.append('message', tributeForm.message);
      if (tributeForm.media) {
        formData.append('media', tributeForm.media);
      }

      const res = await api.post('/api/tributes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setTributes([...tributes, res.data.tribute]);
        setTributeForm({ name: '', relation: '', message: '', media: null });
        if (document.getElementById('media')) document.getElementById('media').value = '';
        setTributeMsg('Thank you for your tribute. Your message has been added.');
        setTimeout(() => setTributeMsg(''), 5000);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const renderMedia = (mediaPath) => {
    if (!mediaPath) return null;
    const isVideo = mediaPath.match(/\.(mp4|webm|ogg)$/i);
    const fullPath = `${API_BASE}/api/static/images/${mediaPath}`;
    
    return (
      <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
        {isVideo ? (
          <video controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}>
            <source src={fullPath} />
            Your browser does not support the video element.
          </video>
        ) : (
          <audio controls style={{ width: '100%' }}>
            <source src={fullPath} />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    );
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
            <h2 className="section-title">Tributes to {grandpa?.name || 'Grandpa'}</h2>
            <div className="section-rule">
              <span className="section-rule-line"></span>
              <span className="section-rule-dot"></span>
              <span className="section-rule-line"></span>
            </div>
            <p className="section-sub">Tributes in all languages are welcome.</p>
          </div>
        </Reveal>

        <Reveal>
          <div className="tribute-form-wrap" style={{ marginBottom: '4rem', marginTop: '0' }}>
            <h3 className="form-title">Leave a Tribute</h3>
            <p className="form-sub">Share a memory, a word of love, or a prayer. You can also attach an audio or video tribute.</p>

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
                <div className="form-field full">
                  <label className="form-label" htmlFor="media">Attach Audio/Video (Optional)</label>
                  <input className="form-input" type="file" id="media" accept="audio/*,video/*" onChange={e => setTributeForm({...tributeForm, media: e.target.files[0]})} />
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
                  {renderMedia(tribute.media)}
                  <div className="tribute-meta" style={{ marginTop: '1.5rem' }}>
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
                <p className="tribute-message">Be the first to leave a tribute for {grandpa?.name || 'Grandpa'}.</p>
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
