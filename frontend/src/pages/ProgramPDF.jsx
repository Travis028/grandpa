import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE } from '../config';

export default function ProgramPDF() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperSize, setPaperSize] = useState('A4');
  const [qrUploading, setQrUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/grandpa'),
      api.get('/api/family'),
      api.get('/api/life_photos')
    ]).then(([resGrandpa, resFamily, resLife]) => {
      setData({
        grandpa: resGrandpa.data,
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
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#d4af37' }}>Preparing 4-Page Booklet...</div>;
  }

  if (!data || !data.grandpa) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Error loading data.</div>;
  }

  const { grandpa, family, lifePhotos } = data;

  const handlePrint = () => {
    window.print();
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/api/upload_qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('QR Code successfully uploaded! Please refresh the page to see changes.');
    } catch (err) {
      alert('Error uploading QR Code.');
    } finally {
      setQrUploading(false);
    }
  };

  // Helper to truncate tributes safely
  const truncateTribute = (text) => {
    if (!text) return "";
    if (text.length > 200) {
      return text.substring(0, 197) + '...';
    }
    return text;
  };

  // --- PAGE COMPONENTS ---

  // Page 1: Cover
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

  // Page 2: Order of Service (Static Text as requested)
  const PageProgram = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>Order of Service</h2>
        
        <div style={{ fontSize: '0.85rem', lineHeight: '1.4', paddingRight: '15px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.0rem', margin: '0 0 4px 0', color: 'var(--primary)' }}>1. The Prelude</h3>
            <p style={{ margin: '0 0 2px 0' }}><strong>Music:</strong> Soft, reflective background music is played as guests arrive and take their seats.</p>
            <p style={{ margin: '0' }}><strong>Seating of the Family:</strong> Close family members are escorted to their designated seating just before the service begins.</p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.0rem', margin: '0 0 4px 0', color: 'var(--primary)' }}>2. The Opening</h3>
            <p style={{ margin: '0 0 2px 0' }}><strong>Welcome / Words of Comfort:</strong> The officiant, clergy, or host welcomes guests, shares a brief opening statement, and acknowledges the purpose of the gathering.</p>
            <p style={{ margin: '0' }}><strong>Opening Prayer or Reading:</strong> A short prayer, scriptural reading, or non-religious poem to set a peaceful tone.</p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.0rem', margin: '0 0 4px 0', color: 'var(--primary)' }}>3. The Tributes</h3>
            <p style={{ margin: '0 0 2px 0' }}><strong>Reading of the Obituary:</strong> A brief summary of the deceased’s life, achievements, and surviving family members.</p>
            <p style={{ margin: '0 0 2px 0' }}><strong>Eulogy:</strong> A personal, heartfelt speech that highlights the character, legacy, and fond memories of the departed.</p>
            <p style={{ margin: '0' }}><strong>Tributes / Reflections:</strong> Open time for pre-selected friends or family members to share short, personal memories.</p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.0rem', margin: '0 0 4px 0', color: 'var(--primary)' }}>4. Musical Interlude & Special Tributes</h3>
            <p style={{ margin: '0 0 2px 0' }}><strong>Special Music:</strong> A live or recorded musical performance, hymn, or playing of the deceased's favorite song.</p>
            <p style={{ margin: '0' }}><strong>Photo Slideshow or Video:</strong> A visual montage of the deceased's life set to music.</p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.0rem', margin: '0 0 4px 0', color: 'var(--primary)' }}>5. The Closing</h3>
            <p style={{ margin: '0 0 2px 0' }}><strong>Final Commendation / Prayer:</strong> A final prayer or blessing, particularly important if the service is directly followed by a burial.</p>
            <p style={{ margin: '0' }}><strong>Acknowledgments:</strong> Thank you messages to the guests, pallbearers, and those who sent flowers or condolences.</p>
          </div>

          <div style={{ marginBottom: '0' }}>
            <h3 style={{ fontSize: '1.0rem', margin: '0 0 4px 0', color: 'var(--primary)' }}>6. The Recessional</h3>
            <p style={{ margin: '0 0 2px 0' }}><strong>Closing Music:</strong> Upbeat or triumphant music plays as the family exits the venue, followed by the rest of the attendees.</p>
            <p style={{ margin: '0' }}><strong>Dismissal:</strong> Ushers or family members provide instructions regarding the repast or procession to the gravesite.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Page 3: Tributes (Summarized, No Portraits)
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
                <div key={idx} className="pdf-family-tribute" style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                  <div className="pdf-tribute-header" style={{ marginBottom: '4px' }}>
                    <h3 className="pdf-tribute-name" style={{ fontSize: '1.0rem', margin: 0, color: 'var(--primary)' }}>{child.name}</h3>
                    {child.spouse && <span className="pdf-tribute-spouse" style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#666' }}>& {child.spouse}</span>}
                  </div>
                  
                  {child.tribute && (
                    <p className="pdf-tribute-text" style={{ fontSize: '0.85rem', margin: '0 0 4px 0', fontStyle: 'italic' }}>"{truncateTribute(child.tribute)}"</p>
                  )}
                  {child.spouse_tribute && (
                    <p className="pdf-tribute-text" style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 4px 0', fontStyle: 'italic' }}>"{truncateTribute(child.spouse_tribute)}" — {child.spouse}</p>
                  )}

                  {child.grandchildren && child.grandchildren.length > 0 && (
                    <div className="pdf-grandchildren-tributes" style={{ marginTop: '4px', paddingLeft: '10px', borderLeft: '2px solid #f0f0f0' }}>
                      {child.grandchildren.map((gc, gIdx) => {
                        if (!gc.tribute) return null;
                        return (
                          <div key={gIdx} className="pdf-gc-tribute" style={{ marginBottom: '2px' }}>
                            <span className="pdf-gc-text" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>"{truncateTribute(gc.tribute)}"</span>
                            <span className="pdf-gc-name" style={{ fontSize: '0.75rem', color: '#777', marginLeft: '5px', fontWeight: 'bold' }}>— {gc.name}</span>
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

  // Page 4: Joyce Owino Gallery & QR Code edge
  const PageGalleryAndBack = () => {
    // ONLY use lifePhotos (Joyce Owino Gallery)
    const galleryPhotos = lifePhotos ? [...lifePhotos].sort(() => 0.5 - Math.random()).slice(0, 9) : [];

    return (
      <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
        <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>Precious Memories</h2>
          
          <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {galleryPhotos.map((photo, idx) => (
              <div key={idx} className="pdf-gallery-item" style={{ height: '140px', background: '#f5f5f5', border: '3px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <img src={`${API_BASE}/api/static/images/life_photos/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '2px solid var(--gold)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 className="pdf-title" style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>{grandpa.name}</h2>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>Thank you for your love, support, and prayers.</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#888', fontWeight: 'bold' }}>{grandpa.birth_year} — {grandpa.death_year}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <img src={`${API_BASE}/api/static/images/grandpa/qr_code.jpg?t=${Date.now()}`} alt="QR Code" style={{ width: '100px', height: '100px', border: '2px solid var(--gold)', padding: '5px', background: '#fff' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>Scan Memorial Website</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Exact 4 pages defined
  const pagesRaw = [
    <PageCover />,          // Page 1
    <PageProgram />,        // Page 2
    <PageTributes />,       // Page 3
    <PageGalleryAndBack />  // Page 4
  ];

  // Layout Engine
  const renderedPages = [];
  if (paperSize === 'A3') {
    // 4-Page Folded Booklet Layout on A3 (2 pages per sheet)
    // Sheet 1 Front: [Page 4, Page 1] (Back cover, Front cover)
    // Sheet 1 Back: [Page 2, Page 3] (Inside front, Inside back)
    const a3Layout = [
      [pagesRaw[3], pagesRaw[0]],
      [pagesRaw[1], pagesRaw[2]]
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
            <p style={{ margin: 0, color: '#555', fontSize: '1.1rem' }}>4-Page Book Layout. Click "Print / Save as PDF" below.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            <button onClick={handlePrint} className="pdf-burner-btn-main">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save as PDF
            </button>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>Paper Layout:</label>
              <select value={paperSize} onChange={e => setPaperSize(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>
                <option value="A4">A4 (Sequential - 4 Pages)</option>
                <option value="A3">A3 (Folded Booklet - 2 Sheets)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f5f5f5', padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <label style={{ fontSize: '0.9rem', color: '#444', fontWeight: 'bold' }}>Upload QR Code:</label>
              <input type="file" accept="image/*" onChange={handleQrUpload} disabled={qrUploading} style={{ fontSize: '0.85rem', width: '180px' }} />
              {qrUploading && <span style={{ fontSize: '0.8rem', color: '#d4af37' }}>Uploading...</span>}
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
