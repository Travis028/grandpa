import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_BASE } from '../config';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

export default function FamilyDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [spouseModalOpen, setSpouseModalOpen] = useState(false);
  const [grandchildModalData, setGrandchildModalData] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get('/api/family')
      .then(res => {
        const fam = res.data.family;
        if (fam[id]) {
          setMember(fam[id]);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading details...</div>;
  if (error || !member) return <div style={{ padding: '100px', textAlign: 'center' }}>Member not found. <br/><Link to="/">Return home</Link></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '100px 20px 60px', maxWidth: '900px', margin: '0 auto' }}
    >
      <Link to="/" style={{ color: '#888', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>← Back to Family</Link>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            style={{ cursor: 'default' }}
          >
            {member.portrait && member.portrait !== '' ? (
              <img 
                src={`${API_BASE}/api/static/images/children/${member.portrait}`} 
                alt={member.name}
                style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M20 100c0-20 15-35 30-35s30 15 30 35' fill='%23ccc'/%3E%3C/svg%3E`; }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: '#eee' }}></div>
            )}
          </motion.div>
          
          {member.spouse_portrait && member.spouse_portrait !== '' && (
            <motion.div 
              whileHover={{ scale: 1.08 }}
              style={{ cursor: 'pointer', zIndex: 2, position: 'relative', left: '-40px' }}
              onClick={() => setSpouseModalOpen(true)}
              title={`View photo of ${member.spouse || 'Spouse'}`}
            >
              <img 
                src={`${API_BASE}/api/static/images/children/${member.spouse_portrait}`} 
                alt={member.spouse || 'Spouse'}
                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}
                onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M20 100c0-20 15-35 30-35s30 15 30 35' fill='%23ccc'/%3E%3C/svg%3E`; }}
              />
            </motion.div>
          )}
        </div>
        
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', margin: '0 0 10px 0' }}>{member.name}</h1>
        {member.spouse && <p style={{ fontSize: '1.1rem', color: '#666', fontStyle: 'italic', margin: '0 0 10px 0' }}>& {member.spouse}</p>}
        {member.note && <p style={{ color: '#888' }}>{member.note}</p>}
      </div>

      {member.tribute && (
        <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '12px', borderLeft: '4px solid var(--gold)', marginBottom: '40px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: '#333' }}>Tribute to Dad</h3>
          <p style={{ fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.6, color: '#555', margin: 0 }}>"{member.tribute}"</p>
        </div>
      )}

      {member.grandchildren && member.grandchildren.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Grandchildren</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {member.grandchildren.map((gc, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                style={{ textAlign: 'center', width: '100px', cursor: 'pointer' }}
                onClick={() => setGrandchildModalData(gc)}
              >
                <img 
                  src={`${API_BASE}/api/static/images/children/${gc.photo}`} 
                  alt={gc.name}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px', border: '2px solid #ddd' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M20 100c0-20 15-35 30-35s30 15 30 35' fill='%23ccc'/%3E%3C/svg%3E`; }}
                />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>{gc.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {member.gallery && member.gallery.length > 0 && (
        <div>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Photo Gallery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {member.gallery.map((item, i) => {
              const path = typeof item === 'string' ? item : item.path;
              const comment = typeof item === 'string' ? '' : (item.comment || '');
              return (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.05, y: -10, rotate: i % 2 === 0 ? 2 : -2, zIndex: 10 }}
                  onClick={() => openLightbox(i)}
                  style={{
                    background: '#fff',
                    padding: '14px 14px 40px 14px', // Authentic polaroid thick bottom
                    borderRadius: '2px', // Sharp paper edges
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #eaeaea',
                    position: 'relative',
                    transformOrigin: 'center center'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40px',
                    height: '15px',
                    background: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 2,
                    transform: `translateX(-50%) rotate(${i % 2 === 0 ? -3 : 3}deg)` // Tape effect
                  }}></div>
                  
                  <div style={{ width: '100%', height: '240px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={`${API_BASE}/api/static/images/children/${path}`} 
                      alt="Gallery image"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {comment && (
                    <div style={{ paddingTop: '20px', background: '#fff', display: 'flex', justifyContent: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1.1rem', color: '#333', textAlign: 'center', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', letterSpacing: '0.5px' }}>{comment}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          >
            <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '3rem', cursor: 'pointer' }}>&times;</button>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', maxWidth: '1200px', display: 'flex', alignItems: 'center' }}>
              <Swiper
                modules={[Navigation, Pagination, EffectFade]}
                effect="fade"
                navigation
                pagination={{ clickable: true }}
                initialSlide={lightboxIndex}
                style={{ width: '100%', height: '90vh' }}
              >
                {member.gallery.map((item, i) => {
                  const path = typeof item === 'string' ? item : item.path;
                  const comment = typeof item === 'string' ? '' : (item.comment || '');
                  return (
                    <SwiperSlide key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <img 
                        src={`${API_BASE}/api/static/images/children/${path}`} 
                        alt="Gallery image"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                      {comment && (
                        <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, textAlign: 'center' }}>
                          <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '10px 20px', borderRadius: '25px', fontSize: '1rem' }}>
                            {comment}
                          </span>
                        </div>
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </motion.div>
        )}
        
        {spouseModalOpen && member.spouse_portrait && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSpouseModalOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          >
            <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '3rem', cursor: 'pointer' }}>&times;</button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={`${API_BASE}/api/static/images/children/${member.spouse_portrait}`}
              alt={member.spouse}
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}

        {grandchildModalData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGrandchildModalData(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', padding: '40px', borderRadius: '20px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}
            >
              <img 
                src={`${API_BASE}/api/static/images/children/${grandchildModalData.photo}`} 
                alt={grandchildModalData.name}
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #eee', marginBottom: '20px' }}
                onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M20 100c0-20 15-35 30-35s30 15 30 35' fill='%23ccc'/%3E%3C/svg%3E`; }}
              />
              <h2 style={{ margin: '0 0 10px 0', fontFamily: '"Playfair Display", serif', fontSize: '2rem' }}>{grandchildModalData.name}</h2>
              {grandchildModalData.tribute ? (
                <p style={{ color: '#555', fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.6 }}>"{grandchildModalData.tribute}"</p>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>Tribute coming soon.</p>
              )}
              <button onClick={() => setGrandchildModalData(null)} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
