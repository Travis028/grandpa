import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import api, { API_BASE } from '../config';

export default function ProgramPDF() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperSize, setPaperSize] = useState('A4');
  const pdfRef = useRef();

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
        lifePhotos: resLife.data
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#d4af37' }}>Preparing Booklet...</div>;
  }

  if (!data || !data.grandpa) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Error loading data.</div>;
  }

  const { grandpa, program, family, lifePhotos } = data;

  // Gather all photos for the Gallery page (Joyce Owino/Life photos + Family portraits)
  const allGalleryPhotos = [];
  if (lifePhotos) {
    lifePhotos.forEach(p => allGalleryPhotos.push(`${API_BASE}/api/static/images/life_photos/${p}`));
  }
  family.forEach(member => {
    if (member.portrait) allGalleryPhotos.push(`${API_BASE}/api/static/images/children/${member.portrait}`);
    if (member.grandchildren) {
      member.grandchildren.forEach(g => {
        if (g.portrait) allGalleryPhotos.push(`${API_BASE}/api/static/images/children/${g.portrait}`);
      });
    }
  });

  const shuffledGallery = [...allGalleryPhotos].sort(() => 0.5 - Math.random()).slice(0, 12);

  const handleDownload = () => {
    const element = pdfRef.current;
    const opt = {
      margin:       0,
      filename:     `Memorial_Program_${grandpa.name.replace(/ /g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: paperSize === 'A3' ? 'a3' : 'a4', orientation: paperSize === 'A3' ? 'landscape' : 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
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

        {/* Include hymns if there is space */}
        {program.hymnal_1 && (
            <div className="pdf-hymnals-container" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <div className="pdf-hymnal" style={{ fontSize: '0.85rem' }}>
                <strong>Hymn:</strong>
                <div className="pdf-hymnal-lyrics" style={{ marginTop: '5px' }}>{program.hymnal_1}</div>
              </div>
            </div>
        )}
      </div>
    </div>
  );

  const PageStory = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title">His Story</h2>
        <div className="pdf-story-text" dangerouslySetInnerHTML={{ __html: grandpa.life_story }} />

        {grandpa.activities && grandpa.activities.length > 0 && (
          <div className="pdf-activities-section" style={{ marginTop: '15px' }}>
            <h3 className="pdf-subsection-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Life Milestones</h3>
            <ul className="pdf-activities-timeline" style={{ fontSize: '0.9rem' }}>
              {grandpa.activities.map((act, i) => (
                <li key={i} className="pdf-activity-item" style={{ marginBottom: '4px' }}>
                  <span className="pdf-activity-year" style={{ fontWeight: 'bold', marginRight: '10px', color: 'var(--gold)' }}>{act.year}</span>
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
    return (
      <div className="pdf-page-content">
        <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
        <div className="pdf-content-relative">
          <h2 className="pdf-section-title">Family Tributes</h2>
          <div className="pdf-tributes-list">
            {family.map((child, idx) => {
              if (!child.tribute && !child.spouse_tribute && (!child.grandchildren || child.grandchildren.length === 0)) return null;
              return (
                <div key={idx} className="pdf-family-tribute" style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <div className="pdf-tribute-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <h3 className="pdf-tribute-name" style={{ fontSize: '1.1rem', margin: 0 }}>{child.name}</h3>
                    {child.spouse && <span className="pdf-tribute-spouse" style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#666' }}>& {child.spouse}</span>}
                  </div>
                  {child.tribute && (
                    <p className="pdf-tribute-text" style={{ fontSize: '0.95rem', margin: '0 0 5px 0' }}>"{child.tribute}"</p>
                  )}
                  {child.spouse_tribute && (
                    <p className="pdf-tribute-text" style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 5px 0' }}>"{child.spouse_tribute}" <span style={{fontStyle:'italic'}}>— {child.spouse}</span></p>
                  )}
                  {child.grandchildren && child.grandchildren.length > 0 && (
                    <div className="pdf-grandchildren-tributes" style={{ marginTop: '5px', paddingLeft: '15px', borderLeft: '2px solid #f0f0f0' }}>
                      {child.grandchildren.map((gc, gIdx) => {
                        if (!gc.tribute) return null;
                        return (
                          <div key={gIdx} className="pdf-gc-tribute" style={{ marginBottom: '4px' }}>
                            <span className="pdf-gc-text" style={{ fontSize: '0.85rem' }}>"{gc.tribute}"</span>
                            <span className="pdf-gc-name" style={{ fontSize: '0.8rem', color: '#777', marginLeft: '5px' }}>— {gc.name}</span>
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

  const PageGallery = () => {
    return (
      <div className="pdf-page-content pdf-page-center">
        <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
        <div className="pdf-content-relative" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 className="pdf-section-title">Precious Memories</h2>
          <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {shuffledGallery.map((photo, idx) => (
              <div key={idx} className="pdf-gallery-item" style={{ height: '150px', background: '#f5f5f5', border: '3px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <img src={photo} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '30px' }}>
             <p className="pdf-gallery-footer" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--primary)' }}>Forever in our hearts.</p>
          </div>
        </div>
      </div>
    );
  };

  const PageBack = () => (
    <div className="pdf-page-content pdf-page-center pdf-cover">
      <div className="pdf-cover-ornament">✦ In Loving Memory ✦</div>
      <h2 className="pdf-title" style={{ fontSize: '2rem', marginTop: '30px' }}>{grandpa.name}</h2>
      <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#555', fontStyle: 'italic' }}>Thank you for your love, support, and prayers.</p>
      
      <div style={{ marginTop: '50px', border: '4px solid var(--gold)', padding: '20px', background: '#fff', borderRadius: '8px' }}>
        <img src={`${API_BASE}/api/static/images/grandpa/qr_code.jpg`} alt="Memorial QR Code" style={{ width: '160px', height: '160px', display: 'block', margin: '0 auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <p style={{ marginTop: '15px', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>Scan to View Memorial Website</p>
      </div>
      
      <p style={{ marginTop: 'auto', fontSize: '1.2rem', color: '#888', fontWeight: 'bold' }}>{grandpa.birth_year} — {grandpa.death_year}</p>
    </div>
  );

  // Exact 6 pages defined
  const pagesRaw = [
    <PageCover />,     // Page 1
    <PageProgram />,   // Page 2
    <PageStory />,     // Page 3
    <PageTributes />,  // Page 4
    <PageGallery />,   // Page 5
    <PageBack />       // Page 6
  ];

  // Layout Engine
  const renderedPages = [];
  if (paperSize === 'A3') {
    // 6-Page Folded Booklet Layout on A3 (2 pages per sheet)
    // Sheet 1 Front: [Page 6, Page 1] (Back cover, Front cover)
    // Sheet 1 Back: [Page 2, Page 5] (Inside front, Inside back)
    // Sheet 2 Front: [Page 4, Page 3] (Centerfold inside left, Centerfold right)
    const a3Layout = [
      [pagesRaw[5], pagesRaw[0]],
      [pagesRaw[1], pagesRaw[4]],
      [pagesRaw[3], pagesRaw[2]]
    ];

    a3Layout.forEach((pair, i) => {
      renderedPages.push(
        <div key={i} className="pdf-sheet pdf-sheet-a3-landscape">
          <div className="pdf-a4-panel">{pair[0]}</div>
          <div className="pdf-a4-panel">{pair[1]}</div>
        </div>
      );
    });
  } else {
    // A4 Portrait: Sequential
    for (let i = 0; i < pagesRaw.length; i++) {
      renderedPages.push(
        <div key={i} className="pdf-sheet pdf-sheet-a4-portrait">
          <div className="pdf-a4-panel">{pagesRaw[i]}</div>
        </div>
      );
    }
  }

  return (
    <div className="pdf-wrapper">
      {/* ── BURNER DASHBOARD (HIDDEN ON PRINT) ── */}
      <div className="pdf-burner-dashboard no-print">
        <div className="pdf-burner-header">
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontFamily: '"Playfair Display", serif', color: '#111', fontSize: '2.2rem' }}>Program & Eulogy Generator</h1>
            <p style={{ margin: 0, color: '#555', fontSize: '1.1rem' }}>Review the layout below. Click download to generate the PDF booklet directly to your device.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            <button onClick={handleDownload} className="pdf-burner-btn-main">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download PDF
            </button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>Paper Layout:</label>
              <select value={paperSize} onChange={e => setPaperSize(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>
                <option value="A4">A4 (Portrait / Sequential)</option>
                <option value="A3">A3 (Landscape / Folded Booklet)</option>
              </select>
            </div>
            <Link to="/admin" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>← Back to Admin</Link>
          </div>
        </div>
      </div>

      {/* ── PRINTABLE PDF DOCUMENT ── */}
      <div className="pdf-document" ref={pdfRef}>
        {renderedPages}
      </div>
    </div>
  );
}
