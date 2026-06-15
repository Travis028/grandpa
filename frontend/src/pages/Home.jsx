import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api, { API_BASE, apiCache } from '../config';

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

export default function Home() {
  const [grandpa, setGrandpa] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [tributes, setTributes] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [dots, setDots] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [viewingGallery, setViewingGallery] = useState(null);

  const [tributeForm, setTributeForm] = useState({ name: '', relation: '', message: '' });
  const [tributeMsg, setTributeMsg] = useState('');

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(dotTimer);
  }, []);

  useEffect(() => {
    let retries = 0;
    const MAX = 10;
    const fetchData = () => {
      Promise.all([
        apiCache.get('/api/grandpa'),
        apiCache.get('/api/family'),
        apiCache.get('/api/memories'),
        apiCache.get('/api/tributes')
      ]).then(([resGrandpa, resFamily, resMemories, resTributes]) => {
        setGrandpa(resGrandpa.data);
        setFamilyData(resFamily.data);
        setMemories(resMemories.data);
        setTributes(resTributes.data);
        setLoadError(false);
      }).catch(() => {
        if (retries < MAX) { retries++; setTimeout(fetchData, 3000); }
        else setLoadError(true);
      });
    };
    fetchData();
  }, []);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    let socket;
    try {
      socket = io(socketUrl, { path: '/socket.io', transports: ['polling'] });
      socket.on('new_tribute', (tribute) => {
        setTributes(prev => {
          // avoid duplicates if we just submitted it ourselves
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

  if (loadError) return (
    <div style={{padding:'5rem',textAlign:'center'}}>
      <p style={{fontSize:'1.1rem',marginBottom:'8px'}}>The server took too long to respond.</p>
      <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>The server may still be waking up. Please try again.</p>
      <button onClick={() => { setLoadError(false); window.location.reload(); }} style={{padding:'12px 28px',cursor:'pointer',background:'#000',color:'#fff',border:'none',borderRadius:'4px',fontSize:'1rem'}}>Try Again</button>
    </div>
  );

  if (!grandpa || !familyData || !Array.isArray(familyData.family)) return (
    <div style={{padding:'5rem',textAlign:'center'}}>
      <p style={{fontSize:'1.1rem',marginBottom:'6px'}}>Loading memorial{dots}</p>
      <p style={{color:'#888',fontSize:'0.85rem'}}>The server is starting up, please wait a moment</p>
    </div>
  );

  const { family, firstborn } = familyData;
  const numGrandchildren = family.reduce((acc, child) => acc + (child.grandchildren ? child.grandchildren.length : 0), 0);
  const yearsOfGrace = parseInt(grandpa.death_year) - parseInt(grandpa.birth_year);

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')`}}>
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-top-bar"></div>
        <div className="floating-photo-container">
          <img src={`${API_BASE}/api/static/images/grandpa/floating_photo.jpg`} alt="Grandpa" className="floating-photo" onError={(e) => { e.target.src = '/assets/floating_photo.jpg' }} />
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow">In Loving Memory</p>
          <h1 className="hero-name">{grandpa.name}</h1>
          <p className="hero-dates">{grandpa.birth_year} — {grandpa.death_year}</p>
          <div className="hero-divider">
            <span className="hero-divider-line"></span>
            <span className="hero-divider-ornament">✦</span>
            <span className="hero-divider-line"></span>
          </div>
          <blockquote className="hero-quote">
            "{grandpa.final_words}"
            <cite className="hero-quote-attr">— {grandpa.name}, final words</cite>
          </blockquote>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="hero-scroll-line"></div>
        </div>
      </section>

      {tributeMsg && (
        <div className="flash-container">
          <div className="flash-message">{tributeMsg}</div>
        </div>
      )}

      <div className="quick-nav">
        <div className="container">
          <div className="quick-nav-buttons">
            <Link to="/life" className="quick-nav-btn">His Life Story</Link>
            <Link to="/program" className="quick-nav-btn">Funeral Program</Link>
            <a href="#family" className="quick-nav-btn">Our Family</a>
            <a href="#tributes" className="quick-nav-btn">Leave a Tribute</a>
            <Link to="/program#feedback" className="quick-nav-btn">Leave Feedback</Link>
          </div>
        </div>
      </div>

      <section className="section preview-section" id="life-preview">
        <div className="container-narrow">
          <Reveal>
            <div className="section-header">
              <span className="section-tag">His Story</span>
              <h2 className="section-title">A Life Well Lived</h2>
              <div className="section-rule">
                <span className="section-rule-line"></span>
                <span className="section-rule-dot"></span>
                <span className="section-rule-line"></span>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="preview-content">
              <p className="preview-text">{grandpa.life_story.substring(0, 500)}...</p>
              <Link to="/life" className="btn-readmore">Read Full Story →</Link>
            </div>
          </Reveal>
          <Reveal>
            <div className="life-stats">
              <div className="life-stat">
                <span className="life-stat-number">{family.length}</span>
                <span className="life-stat-label">Living Children</span>
              </div>
              <div className="life-stat">
                <span className="life-stat-number">{numGrandchildren}+</span>
                <span className="life-stat-label">Grandchildren</span>
              </div>
              <div className="life-stat">
                <span className="life-stat-number">{yearsOfGrace}</span>
                <span className="life-stat-label">Years of Grace</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section family-section" id="family">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="section-tag">His Greatest Gift</span>
              <h2 className="section-title">Owino's Family</h2>
              <div className="section-rule">
                <span className="section-rule-line"></span>
                <span className="section-rule-dot"></span>
                <span className="section-rule-line"></span>
              </div>
              <p className="section-sub">Each child, a chapter. Each grandchild, a verse.</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="firstborn-note">
              <span className="firstborn-ornament">✦</span>
              <p className="firstborn-text">
                <strong>{firstborn.name}</strong> — {firstborn.note}
              </p>
            </div>
          </Reveal>

          <div className="family-grid">
            {family.map((child, idx) => (
              <Reveal key={idx}>
                <motion.div 
                  className="family-card"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/family/${idx}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="family-photo-wrap">
                      <img src={`${API_BASE}/api/static/images/children/${child.portrait}`} alt={child.name} loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                      <div className="family-photo-placeholder" style={{display: 'none'}}>
                        <span>{child.name[0]}</span>
                      </div>
                      <div className="family-photo-overlay"></div>
                    </div>
                    <div className="family-body" style={{ textAlign: 'center' }}>
                      <h3 className="family-name">{child.name}</h3>
                      {child.spouse && <p className="family-spouse">❧ {child.spouse}</p>}
                      <div style={{ marginTop: '15px' }}>
                        <span className="btn-secondary" style={{ display: 'inline-block', padding: '8px 20px', fontSize: '0.9rem', background: '#f3f4f6', borderRadius: '20px', color: '#111', fontWeight: 600 }}>
                          View Details & Gallery →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section memories-section" id="memories">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="section-tag" style={{color: 'var(--gold2)'}}>Snapshots in Time</span>
              <h2 className="section-title section-title-light">Memories</h2>
              <div className="section-rule">
                <span className="section-rule-line"></span>
                <span className="section-rule-dot"></span>
                <span className="section-rule-line"></span>
              </div>
              <p className="section-sub section-sub-light">Moments that live on in all of us</p>
            </div>
          </Reveal>

          {memories && memories.length > 0 ? (
            <div className="memories-masonry">
              {memories.map((mem, idx) => (
                <Reveal key={idx}>
                  <div className="memory-item">
                    <img src={`${API_BASE}/api/static/images/memories/${mem.file}`} alt={mem.caption} loading="lazy" />
                    <div className="memory-caption">
                      <p>"{mem.caption}"</p>
                      <small>Shared by {mem.submitted_by}</small>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="memories-placeholder">
              <p>Family photos will appear here</p>
              <p className="small">To add photos, drop .jpg or .png files into: <br/><code>static/images/memories/</code></p>
            </div>
          )}
        </div>
      </section>

      <section className="section tributes-section" id="tributes">
        <div className="container-narrow">
          <Reveal>
            <div className="section-header">
              <span className="section-tag">Words from the Heart</span>
              <h2 className="section-title">Tributes</h2>
              <div className="section-rule">
                <span className="section-rule-line"></span>
                <span className="section-rule-dot"></span>
                <span className="section-rule-line"></span>
              </div>
            </div>
          </Reveal>

          <div className="tributes-list">
            {tributes && tributes.length > 0 ? (
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

          <Reveal>
            <div className="ornament">✦ &nbsp;&nbsp; ✦ &nbsp;&nbsp; ✦</div>
          </Reveal>

          <Reveal>
            <div className="tribute-form-wrap" id="tribute-form">
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
        </div>
      </section>

      {viewingGallery && !viewingPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', overflowY: 'auto' }} onClick={() => setViewingGallery(null)}>
          <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#fff', fontSize: '3rem', cursor: 'pointer', lineHeight: 1 }} onClick={() => setViewingGallery(null)}>&times;</button>
          <h2 style={{ color: '#fff', marginBottom: '30px', fontFamily: '"Playfair Display", serif' }}>{viewingGallery.name}'s Gallery</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '1000px' }}>
            {viewingGallery.photos.map((item, gIdx) => {
              const photo = typeof item === 'string' ? item : item.path;
              const comment = typeof item === 'string' ? '' : (item.comment || '');
              return (
                <div key={gIdx} style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: '8px', background: '#222' }} onClick={(e) => { e.stopPropagation(); setViewingPhoto({ photo, comment }); }}>
                  <img src={`${API_BASE}/api/static/images/children/${photo}`} alt="gallery"
                    loading="lazy"
                    style={{width:'180px',height:'180px',objectFit:'cover',display:'block',opacity:0.9,transition:'0.3s'}}
                    onMouseOver={e => e.target.style.opacity=1}
                    onMouseOut={e => e.target.style.opacity=0.9}
                    onError={e => e.target.parentElement.style.display='none'} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setViewingPhoto(null)}>
          <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#fff', fontSize: '3rem', cursor: 'pointer', lineHeight: 1 }} onClick={() => setViewingPhoto(null)}>&times;</button>
          <img src={`${API_BASE}/api/static/images/children/${viewingPhoto.photo}`} style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
          {viewingPhoto.comment && <p style={{ color: '#fff', marginTop: '20px', fontSize: '1.2rem', maxWidth: '600px', textAlign: 'center', fontStyle: 'italic', letterSpacing: '0.5px' }}>"{viewingPhoto.comment}"</p>}
        </div>
      )}
    </>
  );
}
