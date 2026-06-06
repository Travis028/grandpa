import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Life() {
  const [grandpa, setGrandpa] = useState(null);
  const [lifePhotos, setLifePhotos] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get('/api/grandpa'),
      axios.get('/api/life_photos')
    ]).then(([resGrandpa, resPhotos]) => {
      setGrandpa(resGrandpa.data);
      setLifePhotos(resPhotos.data);
    }).catch(err => console.error("Error fetching data:", err));
  }, []);

  if (!grandpa) return <div style={{padding: '5rem', textAlign: 'center'}}>Loading...</div>;

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
                      <img src={`/api/static/images/life_photos/${photo}`} alt="Grandpa" loading="lazy" />
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
