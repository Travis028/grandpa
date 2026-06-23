import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE } from '../config';

export default function ProgramPDF() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperSize, setPaperSize] = useState('A4');

  useEffect(() => {
    Promise.all([
      api.get('/api/grandpa'),
      api.get('/api/program'),
      api.get('/api/family'),
      api.get('/api/life_photos')
    ]).then(([resGrandpa, resProgram, resFamily, resLife]) => {
      setData({
        grandpa: resGrandpa.data,
        program: resProgram.data,
        family: resFamily.data.family,
        firstborn: resFamily.data.firstborn,
        lifePhotos: resLife.data
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#d4af37' }}>Preparing Burner...</div>;
  }

  if (!data || !data.grandpa) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Error loading data.</div>;
  }

  const { grandpa, program, family } = data;

  const allGalleryPhotos = [];
  family.forEach(member => {
    if (member.gallery) {
      member.gallery.forEach(g => {
        allGalleryPhotos.push({
          path: typeof g === 'string' ? g : g.path,
          caption: typeof g === 'string' ? '' : (g.comment || '')
        });
      });
    }
  });

  const shuffledGallery = [...allGalleryPhotos].sort(() => 0.5 - Math.random()).slice(0, 12);

  const handlePrint = () => {
    window.print();
  };

  // --- PAGE COMPONENTS ---
  const PageCover = () => (
    <div className="pdf-page-content pdf-page-center pdf-cover">
      <div className="pdf-cover-ornament">✦ In Loving Memory ✦</div>
      <div className="pdf-cover-photo-wrapper">
        <img src={`${API_BASE}/api/static/images/grandpa/main_photo.jpg`} alt={grandpa.name} className="pdf-cover-photo" onError={(e) => { e.target.src = '/assets/floating_photo.jpg' }} />
      </div>
      <h1 className="pdf-title">{grandpa.name}</h1>
      <h2 className="pdf-subtitle">A Life Well Lived</h2>
      <div className="pdf-dates">
        <div className="pdf-date-box">
          <span className="pdf-date-label">Sunrise</span>
          <span className="pdf-date-val">{grandpa.birth_year}</span>
        </div>
        <div className="pdf-date-divider"></div>
        <div className="pdf-date-box">
          <span className="pdf-date-label">Sunset</span>
          <span className="pdf-date-val">{grandpa.death_year}</span>
        </div>
      </div>
    </div>
  );

  const PageProgram = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title">Order of Service</h2>
        <div className="pdf-event-details">
          <p><strong>{program.event_name}</strong></p>
          <p><strong>Date:</strong> {program.date}</p>
          <p><strong>Time:</strong> {program.time_start} - {program.time_end}</p>
          <p><strong>Venue:</strong> {program.venue}, {program.venue_address}</p>
          <p><strong>Interment:</strong> {program.burial_location}</p>
        </div>
        
        <table className="pdf-program-table">
          <tbody>
            {(program.order || []).map((item, idx) => (
              <tr key={idx}>
                <td className="pdf-td-time">{item.time}</td>
                <td className="pdf-td-item">{item.item}</td>
                <td className="pdf-td-leader">{item.leader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PageStory = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title">His Story</h2>
        <div className="pdf-story-text">
          {grandpa.life_story}
        </div>

        {grandpa.activities && grandpa.activities.length > 0 && (
          <div className="pdf-activities-section">
            <h3 className="pdf-subsection-title">Life Milestones</h3>
            <ul className="pdf-activities-timeline">
              {grandpa.activities.map((act, i) => (
                <li key={i} className="pdf-activity-item">
                  <span className="pdf-activity-year">{act.year}</span>
                  <span className="pdf-activity-event">{act.event}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const PageTributes = () => {
    let hasTributes = false;
    family.forEach(c => { if(c.tribute || c.spouse_tribute || (c.grandchildren && c.grandchildren.some(g=>g.tribute))) hasTributes=true; });
    if (!hasTributes) return null;

    return (
      <div className="pdf-page-content">
        <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
        <div className="pdf-content-relative">
          <h2 className="pdf-section-title">Family Tributes</h2>
          <div className="pdf-tributes-list">
            {family.map((child, idx) => {
              if (!child.tribute && !child.spouse_tribute && (!child.grandchildren || child.grandchildren.length === 0)) return null;
              return (
                <div key={idx} className="pdf-family-tribute">
                  <div className="pdf-tribute-header">
                    <img src={`${API_BASE}/api/static/images/children/${child.portrait}`} alt={child.name} className="pdf-tribute-avatar" onError={(e) => { e.target.style.display = 'none'; }} />
                    <div style={{ paddingLeft: '15px' }}>
                      <h3 className="pdf-tribute-name">{child.name}</h3>
                      {child.spouse && <p className="pdf-tribute-spouse">& {child.spouse}</p>}
                    </div>
                  </div>
                  {child.tribute && (
                    <div style={{ marginBottom: '10px' }}>
                      <p className="pdf-tribute-text">"{child.tribute}"</p>
                    </div>
                  )}
                  {child.spouse_tribute && (
                    <div style={{ marginBottom: '10px' }}>
                      <p className="pdf-tribute-text" style={{ fontSize: '0.9rem', color: '#555' }}>"{child.spouse_tribute}"</p>
                      <p style={{ margin: '4px 0 0 20px', fontSize: '0.85rem', color: '#777', fontStyle: 'italic' }}>— {child.spouse || 'Spouse'}</p>
                    </div>
                  )}
                  
                  {child.grandchildren && child.grandchildren.length > 0 && (
                    <div className="pdf-grandchildren-tributes">
                      {child.grandchildren.map((gc, gIdx) => {
                        if (!gc.tribute) return null;
                        return (
                          <div key={gIdx} className="pdf-gc-tribute">
                            <p className="pdf-gc-text">"{gc.tribute}"</p>
                            <p className="pdf-gc-name">— {gc.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const PageHymnals = () => {
    if (!program.hymnal_1 && !program.hymnal_2) return null;
    return (
      <div className="pdf-page-content">
        <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
        <div className="pdf-content-relative">
          <h2 className="pdf-section-title">Hymns</h2>
          <div className="pdf-hymnals-container">
            {program.hymnal_1 && (
              <div className="pdf-hymnal">
                <div className="pdf-hymnal-lyrics">{program.hymnal_1}</div>
              </div>
            )}
            {program.hymnal_2 && (
              <div className="pdf-hymnal">
                <div className="pdf-hymnal-lyrics">{program.hymnal_2}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PageGallery = () => {
    if (shuffledGallery.length === 0) return null;
    return (
      <div className="pdf-page-content pdf-page-center">
        <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
        <div className="pdf-content-relative" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 className="pdf-section-title">Precious Memories</h2>
          <div className="pdf-gallery-grid" style={{ flexGrow: 1 }}>
            {shuffledGallery.map((photo, idx) => (
              <div key={idx} className="pdf-gallery-item">
                <img src={`${API_BASE}/api/static/images/children/${photo.path}`} alt="Memory" className="pdf-gallery-img" />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '30px' }}>
             <p className="pdf-gallery-footer">Forever in our hearts.</p>
          </div>
        </div>
      </div>
    );
  };

  // Build the array of pages
  const pagesRaw = [
    <PageCover />,
    <PageProgram />,
    <PageStory />,
    <PageTributes />,
    <PageHymnals />,
    <PageGallery />
  ].filter(p => p !== null);

  // Layout Engine
  const renderedPages = [];
  if (paperSize === 'A3') {
    // A3 Landscape: Chunk into pairs
    for (let i = 0; i < pagesRaw.length; i += 2) {
      renderedPages.push(
        <div key={i} className="pdf-sheet pdf-sheet-a3-landscape">
          <div className="pdf-a4-panel">{pagesRaw[i]}</div>
          <div className="pdf-a4-panel">{pagesRaw[i + 1] || <div className="pdf-page-content"></div>}</div>
        </div>
      );
    }
  } else {
    // A4 Portrait: Single page per sheet
    for (let i = 0; i < pagesRaw.length; i++) {
      renderedPages.push(
        <div key={i} className="pdf-sheet pdf-sheet-a4-portrait">
          <div className="pdf-a4-panel">{pagesRaw[i]}</div>
        </div>
      );
    }
  }

  return (
    <div className={`pdf-wrapper`}>
      {/* ── BURNER DASHBOARD (HIDDEN ON PRINT) ── */}
      <div className="pdf-burner-dashboard no-print">
        <div className="pdf-burner-header">
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontFamily: '"Playfair Display", serif', color: '#111', fontSize: '2.2rem' }}>Program & Eulogy Generator</h1>
            <p style={{ margin: 0, color: '#555', fontSize: '1.1rem' }}>Review the layout below. Click download and select "Save as PDF" to generate the document.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            <button onClick={handlePrint} className="pdf-burner-btn-main">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download / Print PDF
            </button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>Paper Layout:</label>
              <select value={paperSize} onChange={e => setPaperSize(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>
                <option value="A4">A4 (Portrait / Sequential)</option>
                <option value="A3">A3 (Landscape / Two A4s side-by-side)</option>
              </select>
            </div>
            <Link to="/admin" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>← Back to Admin</Link>
          </div>
        </div>
      </div>

      {/* ── PRINTABLE PDF DOCUMENT ── */}
      <div className="pdf-document">
        {renderedPages}
      </div>
    </div>
  );
}
