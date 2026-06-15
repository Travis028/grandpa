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
  const [lightboxImg, setLightboxImg] = useState('');

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

  const openLightbox = (imgSrc) => {
    setLightboxImg(imgSrc);
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
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ cursor: 'pointer', marginBottom: '20px' }}
          onClick={() => openLightbox(`${API_BASE}/api/static/images/children/${member.portrait}`)}
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
                onClick={() => openLightbox(`${API_BASE}/api/static/images/children/${gc.photo}`)}
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
          <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <Swiper
              modules={[Navigation, Pagination, EffectFade, Autoplay]}
              effect="fade"
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              loop={true}
              style={{ width: '100%', height: '500px', background: '#000' }}
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
                      <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, textAlign: 'center' }}>
                        <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                          {comment}
                        </span>
                      </div>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
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
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImg}
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
