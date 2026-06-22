import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { apiCache } from '../config';

export default function Program() {
  const [program, setProgram] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, message: '' });
  const [submitMsg, setSubmitMsg] = useState('');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('visitorName');
    if (saved) setForm(f => ({ ...f, name: saved }));
    let retries = 0;
    const load = () => {
      apiCache.get('/api/program')
        .then(r => {
          setProgram(r.data);
          if (window.location.hash === '#feedback') {
            setTimeout(() => document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' }), 300);
          }
        })
        .catch(() => {
          if (retries < 10) { retries++; setTimeout(load, 3000); }
          else setLoadError(true);
        });
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    try {
      const res = await api.post('/api/feedback', form);
      if (res.data.success) {
        setForm(f => ({ ...f, message: '', rating: 5 }));
        setSubmitMsg('Thank you for your feedback! It has been received.');
        setTimeout(() => setSubmitMsg(''), 6000);
      }
    } catch { setSubmitMsg('Could not submit. Please try again.'); }
  };

  if (loadError) return (
    <div style={{ padding: '5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>The server took too long to respond.</p>
      <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Please try again.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '12px 28px', cursor: 'pointer', background: '#000', color: '#fff', border: 'none', borderRadius: '4px' }}>Try Again</button>
    </div>
  );

  if (!program) return (
    <div style={{ padding: '5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Loading{dots}</p>
      <p style={{ color: '#888', fontSize: '0.85rem' }}>The server is starting up, please wait</p>
    </div>
  );

  const stars = (r) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < r ? '#d97706' : '#ddd', fontSize: '1.4rem', cursor: 'pointer' }}
      onClick={() => setForm(f => ({ ...f, rating: i + 1 }))}>★</span>
  ));

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-content">
          <h1>{program.event_name}</h1>
          <p>Order of Service</p>
        </div>
      </section>

      <section className="section program-section">
        <div className="container-narrow">
          <div className="program-details reveal visible">
            
            {/* PDF Burner Banner */}
            <div style={{ background: '#111', padding: '25px', borderRadius: '8px', border: '1px solid var(--gold, #d4af37)', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
              <h3 style={{ color: 'var(--gold, #d4af37)', fontFamily: '"Playfair Display", serif', marginBottom: '10px', fontSize: '1.6rem' }}>Eulogy & Program Booklet</h3>
              <p style={{ color: '#eee', marginBottom: '20px', fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.5 }}>
                Download the beautifully formatted memorial booklet containing the full order of service, life story, family tributes, hymnals, and photo gallery.
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => window.open('/print-program', '_blank')} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #b89025 100%)', color: '#111', padding: '12px 24px', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)' }}>
                  🖨️ Download Program PDF
                </button>
                <Link to="/admin" style={{ background: '#333', color: '#fff', padding: '12px 24px', border: '1px solid #555', borderRadius: '4px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  ⚙️ Edit Details
                </Link>
              </div>
              <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '15px', fontStyle: 'italic' }}>
                * Editing the program, hymnals, and timeline requires Admin access. All updates instantly sync to the PDF.
              </p>
            </div>

            <div className="program-info-box">
              {[['Date', program.date], ['Time', `${program.time_start} - ${program.time_end}`],
                ['Venue', program.venue], ['Venue Address', program.venue_address],
                ['Dress Code', program.dress_code], ['Burial', program.burial_location]
              ].map(([label, value]) => (
                <div className="info-row" key={label}>
                  <span className="info-label">{label}:</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="program-timeline">
              <h3 className="timeline-title">Order of Events</h3>
              <div className="timeline">
                {program.order.map((item, idx) => (
                  <div className="timeline-item" key={idx}>
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-content">
                      <h4 className="timeline-event">{item.item}</h4>
                      <p className="timeline-person">{item.leader}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="back-link" style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link to="/" className="btn-back">Back to Home</Link>
          </div>
        </div>
      </section>

      <section className="section" id="feedback" style={{ background: '#f9f9f9', paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="container-narrow">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="section-tag">Your Thoughts</span>
            <h2 className="section-title">Leave Feedback</h2>
            <div className="section-rule">
              <span className="section-rule-line"></span>
              <span className="section-rule-dot"></span>
              <span className="section-rule-line"></span>
            </div>
            <p className="section-sub">Help us know how this memorial touched you</p>
          </div>

          <div className="tribute-form-wrap">
            <h3 className="form-title">Share Your Feedback</h3>
            <p className="form-sub">Your feedback is private and will only be seen by the family administrator.</p>
            {submitMsg && <p style={{ color: '#276749', marginBottom: '12px', fontWeight: 600 }}>{submitMsg}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" type="text" required placeholder="e.g. Jane Owino"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Rating</label>
                  <div style={{ display: 'flex', gap: '4px', padding: '8px 0' }}>{stars(form.rating)}</div>
                </div>
                <div className="form-field full">
                  <label className="form-label">Your Feedback</label>
                  <textarea className="form-textarea" required placeholder="Share how this memorial touched you..."
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
              </div>
              <button className="btn-submit" type="submit">Submit Feedback</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
