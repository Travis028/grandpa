import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE } from '../config';

export default function Life() {
  const [grandpa, setGrandpa] = useState(null);
  const [lifePhotos, setLifePhotos] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let retries = 0;
    const fetchData = () => {
      Promise.all([
        api.get('/api/grandpa'),
        api.get('/api/life_photos')
      ]).then(([resGrandpa, resPhotos]) => {
        setGrandpa(resGrandpa.data);
        setLifePhotos(resPhotos.data);
      }).catch(() => {
        if (retries < 10) { retries++; setTimeout(fetchData, 8000); }
        else setLoadError(true);
      });
    };
    fetchData();
  }, []);

  if (loadError) return (
    <div style={{padding:'5rem',textAlign:'center'}}>
      <p style={{fontSize:'1.1rem',marginBottom:'8px'}}>The server took too long to respond.</p>
      <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Please try again.</p>
      <button onClick={() => window.location.reload()} style={{padding:'12px 28px',cursor:'pointer',background:'#000',color:'#fff',border:'none',borderRadius:'4px',fontSize:'1rem'}}>Try Again</button>
    </div>
  );

  if (!grandpa) return <div style={{padding:'5rem',textAlign:'center'}}><p style={{fontSize:'1.1rem',marginBottom:'6px'}}>Loading{dots}</p><p style={{color:'#888',fontSize:'0.85rem'}}>The server is starting up, please wait</p></div>;

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-content">
          <h1>His Life</h1>
          <p>A journey of faith, family, and love</p>
        </div>
      </section>

      <section className="section life-full-section">
        <div className="container-narrow">
          <div className="life-full-content reveal visible">
            <div className="life-basic-info">
              <p><strong>Born:</strong> {grandpa.birth_year} in {grandpa.birth_place}</p>
              <p><strong>Married:</strong> {grandpa.wife_name}</p>
              <p><strong>Departed:</strong> {grandpa.death_year}</p>
            </div>

            <div className="life-story-full" dangerouslySetInnerHTML={{ __html: grandpa.life_story }} />

            {lifePhotos && lifePhotos.length > 0 && (
              <div className="life-photos">
                <h3 className="life-photos-title">Photographs Through the Years</h3>
                <div className="life-photos-grid">
                  {lifePhotos.map((photo, idx) => (
                    <div className="life-photo-item" key={idx}>
                      <img src={`${API_BASE}/api/static/images/life_photos/${photo}`} alt="Grandpa" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pullquote life-pullquote">
              <p>"{grandpa.final_words}"</p>
              <cite>— {grandpa.name}, final words to his family</cite>
            </div>
          </div>

          <div className="back-link" style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link to="/" className="btn-back">← Back to Home</Link>
          </div>
        </div>
      </section>
    </>
  );
}
