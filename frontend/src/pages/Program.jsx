import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config';

export default function Program() {
  const [program, setProgram] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, message: '' });
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('visitorName');
    if (saved) setForm(f => ({ ...f, name: saved }));

    let retries = 0;
    const load = () => {
      api.get('/api/program')
        .then(r => {
          setProgram(r.data);
          if (window.location.hash === '#feedback') {
            setTimeout(() => document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' }), 300);
          }
        })
        .catch(() => {
          if (retries < 3) { retries++; setTimeout(load, 4000); }
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
      <p>The server is waking up, please wait...</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', cursor: 'pointer', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '12px' }}>Retry</button>
    </div>
  );

  if (!program) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading... (server may be waking up)</div>;

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

      {/* Feedback form — results visible to admin only */}
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
