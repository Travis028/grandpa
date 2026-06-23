import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE } from '../config';

export default function ProgramPDF() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperSize, setPaperSize] = useState('A4');
  const [qrUploading, setQrUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/grandpa'),
      api.get('/api/life_photos'),
      api.get('/api/program_photos')
    ]).then(([resGrandpa, resLife, resProgramPhotos]) => {
      setData({
        grandpa: resGrandpa.data,
        lifePhotos: resLife.data,
        programPhotos: resProgramPhotos.data || []
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#d4af37' }}>Preparing 8-Page Booklet...</div>;
  }

  if (!data || !data.grandpa) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Error loading data.</div>;
  }

  const { grandpa, lifePhotos, programPhotos } = data;

  const handleDownload = () => {
    // We MUST use window.print() because processing 30 high-res photos via javascript crashes the browser!
    // Simply select "Save as PDF" in the print dialog.
    window.print();
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/api/upload_qr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('QR Code successfully uploaded! Please refresh.');
    } catch (err) {
      alert('Error uploading QR Code.');
    } finally {
      setQrUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/api/upload_program_cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Program Cover successfully uploaded! Please refresh.');
    } catch (err) {
      alert('Error uploading Program Cover.');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    try {
      await api.post('/api/upload_program_photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Program Gallery Photos successfully uploaded! Please refresh.');
    } catch (err) {
      alert('Error uploading Program Gallery.');
    } finally {
      setGalleryUploading(false);
    }
  };

  // --- PAGE COMPONENTS ---

  // Page 1: Cover
  const PageCover = () => (
    <div className="pdf-page-content pdf-page-center pdf-cover">
      <div className="pdf-cover-ornament">✦ In Loving Memory ✦</div>
      <div className="pdf-cover-photo-wrapper" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
        <img 
          src={`${API_BASE}/api/static/images/grandpa/program_cover.jpg?t=${Date.now()}`} 
          alt={grandpa.name} 
          style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '50%', border: 'none', boxShadow: 'none' }} 
          onError={(e) => { 
            if (!e.target.dataset.fallback) {
                e.target.dataset.fallback = 'true';
                e.target.src = `${API_BASE}/api/static/images/grandpa/main_photo.jpg`;
            } else {
                e.target.src = '/assets/floating_photo.jpg';
            }
          }} 
        />
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

  // Page 2: Order of Service
  const PageProgram = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Order of Service</h2>
        
        <div style={{ fontSize: '1rem', lineHeight: '1.5', paddingRight: '15px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: 'var(--primary)' }}>1. The Prelude</h3>
            <p style={{ margin: '0 0 4px 0' }}><strong>Music:</strong> Soft, reflective background music is played as guests arrive and take their seats.</p>
            <p style={{ margin: '0' }}><strong>Seating of the Family:</strong> Close family members are escorted to their designated seating just before the service begins.</p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: 'var(--primary)' }}>2. The Opening</h3>
            <p style={{ margin: '0 0 4px 0' }}><strong>Welcome / Words of Comfort:</strong> The officiant, clergy, or host welcomes guests, shares a brief opening statement, and acknowledges the purpose of the gathering.</p>
            <p style={{ margin: '0' }}><strong>Opening Prayer or Reading:</strong> A short prayer, scriptural reading, or non-religious poem to set a peaceful tone.</p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: 'var(--primary)' }}>3. The Tributes</h3>
            <p style={{ margin: '0 0 4px 0' }}><strong>Reading of the Obituary:</strong> A brief summary of the deceased’s life, achievements, and surviving family members.</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>Eulogy:</strong> A personal, heartfelt speech that highlights the character, legacy, and fond memories of the departed.</p>
            <p style={{ margin: '0' }}><strong>Tributes / Reflections:</strong> Open time for pre-selected friends or family members to share short, personal memories.</p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: 'var(--primary)' }}>4. Musical Interlude & Special Tributes</h3>
            <p style={{ margin: '0 0 4px 0' }}><strong>Special Music:</strong> A live or recorded musical performance, hymn, or playing of the deceased's favorite song.</p>
            <p style={{ margin: '0' }}><strong>Photo Slideshow or Video:</strong> A visual montage of the deceased's life set to music.</p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: 'var(--primary)' }}>5. The Closing</h3>
            <p style={{ margin: '0 0 4px 0' }}><strong>Final Commendation / Prayer:</strong> A final prayer or blessing, particularly important if the service is directly followed by a burial.</p>
            <p style={{ margin: '0' }}><strong>Acknowledgments:</strong> Thank you messages to the guests, pallbearers, and those who sent flowers or condolences.</p>
          </div>

          <div style={{ marginBottom: '0' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: 'var(--primary)' }}>6. The Recessional</h3>
            <p style={{ margin: '0 0 4px 0' }}><strong>Closing Music:</strong> Upbeat or triumphant music plays as the family exits the venue, followed by the rest of the attendees.</p>
            <p style={{ margin: '0' }}><strong>Dismissal:</strong> Ushers or family members provide instructions regarding the repast or procession to the gravesite.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Page 3: His Life (Part 1 - Extended for readability)
  const PageStoryPart1 = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>His Story (Part 1)</h2>
        
        <div style={{ fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'justify' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>A Celebration of the Life of Apollo Josiah Fizvalentine Owino Awidhi</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>A Precious Gift to the World</h4>
          <p style={{ margin: '0 0 10px 0' }}>On April 23, 1952, a remarkable soul was ushered into this world, Apollo Josiah Fizvalentine Owino Awidhi, the last-born son of the late Timotheo Awidhi Nyandere and the late Isdora Kiti Awidhi. From his earliest days, it was evident that Apollo was destined for greatness, blessed with an insatiable curiosity and an enduring spirit that would later define his extraordinary life.</p>
          <p style={{ margin: '0 0 10px 0' }}>He was a cherished brother to the late Ismael Onyango Awidhi, the late Mary Mwai, the late Annah Adhiambo Odoyo, the late Samuel Awiti Awidhi, the late Nerea Odira, and the late Hesbon Odero Awidhi. Together, they formed a close-knit family bound by love, mutual respect, and shared memories that would last a lifetime.</p>
          <p style={{ margin: '0 0 10px 0' }}>His sisters-in-law, whom he held in high regard, include the late Jane Odero, Caren Onyango, Zilpah Awiti, and Silpa Onyango. They were not merely in-laws but cherished members of his extended family, and he valued their presence and contribution to the family bond.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>A Scholarly Foundation</h4>
          <p style={{ margin: '0 0 10px 0' }}>Apollo's educational journey began with humble yet significant steps. He commenced his early schooling at Kwoyo Kodolo before proceeding to Ngere Primary School, where he successfully sat for his Certificate of Primary Education in 1970. His academic prowess earned him a place at Isebania High School, where he distinguished himself and completed his East African Certificate in 1974.</p>
          <p style={{ margin: '0 0 10px 0' }}>Driven by a profound passion for imparting knowledge and shaping futures, he enrolled at Kamwenja Teachers College in 1975. Upon graduating in May 1976 with a P1 teaching certificate, Apollo was equipped not merely with qualifications but with a vocation—a calling to nurture and enlighten young minds.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>An Illustrious Career in Education</h4>
          <p style={{ margin: '0 0 10px 0' }}>Apollo's professional odyssey was one of unwavering dedication, resilience, and transformative leadership. His teaching career commenced in Nyatike Sub-County, where the Teachers Service Commission posted him to Otho Primary School and subsequently to Mariba Primary School. Between 1977 and 1979, he labored diligently, instilling knowledge and discipline in his pupils.</p>
          <p style={{ margin: '0 0 10px 0' }}>Between 1980 and 1984, his exemplary service saw him transferred to Homa Bay County, where he served at Godbondo Primary School, Asego Primary School, Lala Primary School, and Ruga Primary School. At each institution, he left an indelible mark, earning the admiration of colleagues and the respect of his students.</p>
          <p style={{ margin: '0' }}>In 1985, Apollo took on greater responsibilities when he was posted to Kuna Primary School and later to Tuk Jowi Primary School. For eight years, from 1985 to 1992, he served with distinction as Head Teacher, demonstrating exceptional administrative acumen and a visionary approach to education. His leadership was characterized by unwavering integrity, profound empathy, and an unyielding commitment to academic excellence.</p>
        </div>
      </div>
    </div>
  );

  // Page 4: His Life (Part 2)
  const PageStoryPart2 = () => (
    <div className="pdf-page-content">
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>His Story (Part 2)</h2>
        
        <div style={{ fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'justify' }}>
          <p style={{ margin: '0 0 10px 0' }}>In 1993, he was transferred to Saria Primary School, where he assumed the role of Head of Institution. For fourteen years, until his retirement in 2007, Apollo steered the school with remarkable foresight and dedication. Under his stewardship, the institution flourished, and countless students were transformed into responsible, educated citizens. His career spanned over three decades—a testament to his enduring passion for education and his profound impact on generations of learners.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>A Devoted Husband and Loving Father</h4>
          <p style={{ margin: '0 0 10px 0' }}>Beyond his professional achievements, Apollo was first and foremost a family man. On April 25, 1975, he entered into holy matrimony with his beloved wife, Mama Joyce Aoko Owino. Their union, blessed with enduring love, mutual respect, and unwavering support, became a beacon of inspiration to all who knew them.</p>
          <p style={{ margin: '0 0 10px 0' }}>God blessed their marriage with several wonderful children: Pastor Evans Owino, The late Elly Owino, Hellen Okello, Joan Atieno, The late Victor Owino, Timothy Apollo, Jeph Apollo, Beryle Mercy Andrew, and Charles Apollo.</p>
          <p style={{ margin: '0 0 10px 0' }}>Apollo's heart extended generously to his daughters-in-law, whom he cherished as his own. They include the late Milca Aoko, Eunice Odhiambo, Nancy Otieno, Roselyne Jeph, and Lillian Were. He was a pillar of strength, a wellspring of wisdom, and an embodiment of unconditional love to his entire family.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>A Legacy of Love and Inspiration</h4>
          <p style={{ margin: '0 0 10px 0' }}>Apollo Josiah Fizvalentine Owino Awidhi lived a life of profound purpose. He was a mentor, a leader, a confidant, and a steadfast patriarch. His journey was marked not by the adversities he encountered but by the triumphs he achieved and the lives he transformed along the way.</p>
          <p style={{ margin: '0 0 10px 0' }}>His legacy continues through his beloved grandchildren, who brought him immense joy and pride. His grandsons are Kevin, Felix, Young, Junior, Wayne, Zach, Dean, Jimmy, Marc, Amaih, Deshon, Gerrard, Henry, Finley, Leakey, Feddy, Frankline, and Bonny. His granddaughters are Awuor, Joy, Natasha, Emmah, Pendo, Bevine, Antonnette, Natalie, and Cynthia. Each grandchild held a special place in his heart, and he cherished every moment spent with them, imparting wisdom, love, and laughter that will forever remain in their hearts.</p>
          <p style={{ margin: '0 0 10px 0' }}>On the tranquil morning of June 1, 2026, at 04:00 hours, the Lord in His infinite wisdom called His faithful servant home. Apollo transitioned peacefully, surrounded by the warmth of prayers and the love of his devoted family. Though he has departed from our physical presence, his spirit, his teachings, and his boundless love remain eternally etched in our hearts.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>Farewell to a Gentle Giant</h4>
          <p style={{ margin: '0 0 10px 0' }}>As we bid farewell to this extraordinary man, we do so with gratitude rather than sorrow. We are thankful for the years we shared, the lessons he imparted, and the indelible legacy he leaves behind. His life was a masterpiece of service, sacrifice, and steadfast devotion.</p>
          <p style={{ margin: '0 0 10px 0' }}>Rest now, dear Apollo. Your work on earth is complete. Your family is strong, your legacy is secure, and your memory will forever be cherished. May your soul find eternal peace in the presence of your Creator.</p>
          <p style={{ margin: '0' }}>Amen.</p>
        </div>
      </div>
    </div>
  );

  // Gallery Preparation
  const photosToUse = programPhotos && programPhotos.length > 0 ? programPhotos : lifePhotos;
  const isProgramSource = programPhotos && programPhotos.length > 0;
  // Preserve exact upload order
  const galleryPhotos = photosToUse ? [...photosToUse].slice(0, 30) : [];
  
  // Distribute 30 photos across 3 pages: 12, 12, 6
  const p1Photos = galleryPhotos.slice(0, 12);
  const p2Photos = galleryPhotos.slice(12, 24);
  const p3Photos = galleryPhotos.slice(24, 30);

  // Page 5: Gallery Page 1
  const PageGallery1 = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>Precious Memories</h2>
        <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignContent: 'start' }}>
          {p1Photos.map((photo, idx) => (
            <div key={idx} className="pdf-gallery-item" style={{ height: '200px', background: '#f5f5f5' }}>
              <img src={`${API_BASE}/api/static/images/${isProgramSource ? 'program_photos' : 'life_photos'}/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page 6: Gallery Page 2
  const PageGallery2 = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: 'transparent' }}>...</h2>
        <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignContent: 'start' }}>
          {p2Photos.map((photo, idx) => (
            <div key={idx} className="pdf-gallery-item" style={{ height: '200px', background: '#f5f5f5' }}>
              <img src={`${API_BASE}/api/static/images/${isProgramSource ? 'program_photos' : 'life_photos'}/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page 7: Gallery Page 3
  const PageGallery3 = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: 'transparent' }}>...</h2>
        <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignContent: 'start' }}>
          {p3Photos.map((photo, idx) => (
            <div key={idx} className="pdf-gallery-item" style={{ height: '200px', background: '#f5f5f5' }}>
              <img src={`${API_BASE}/api/static/images/${isProgramSource ? 'program_photos' : 'life_photos'}/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page 8: Back Cover (QR Code & Thank You)
  const PageBackCover = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
      <div className="pdf-watermark" style={{ backgroundImage: `url('${API_BASE}/api/static/images/grandpa/main_photo.jpg')` }}></div>
      <div className="pdf-content-relative" style={{ width: '100%', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
        <h2 className="pdf-title" style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--primary)' }}>{grandpa.name}</h2>
        <p style={{ margin: '0', fontSize: '1.2rem', color: '#555', fontStyle: 'italic' }}>Thank you for your love, support, and prayers.</p>
        <p style={{ margin: '15px 0 30px 0', fontSize: '1.1rem', color: '#888', fontWeight: 'bold' }}>{grandpa.birth_year} — {grandpa.death_year}</p>
        
        <img src={`${API_BASE}/api/static/images/grandpa/qr_code.jpg?t=${Date.now()}`} alt="QR Code" style={{ width: '180px', height: '180px', border: '3px solid var(--gold)', padding: '10px', background: '#fff', margin: '0 auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <p style={{ margin: '15px 0 0 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>Scan Memorial Website</p>
      </div>
    </div>
  );

  // Exact 8 pages defined
  const pagesRaw = [
    <PageCover />,            // 1
    <PageProgram />,          // 2
    <PageStoryPart1 />,       // 3
    <PageStoryPart2 />,       // 4
    <PageGallery1 />,         // 5
    <PageGallery2 />,         // 6
    <PageGallery3 />,         // 7
    <PageBackCover />         // 8
  ];

  // Layout Engine
  const renderedPages = [];
  if (paperSize === 'A3') {
    // 8-Page Folded Booklet Layout on A3 (2 pages per sheet)
    // Sheet 1 Front: [Page 8, Page 1] 
    // Sheet 1 Back: [Page 2, Page 7]
    // Sheet 2 Front: [Page 6, Page 3] 
    // Sheet 2 Back: [Page 4, Page 5]
    const a3Layout = [
      [pagesRaw[7], pagesRaw[0]],
      [pagesRaw[1], pagesRaw[6]],
      [pagesRaw[5], pagesRaw[2]],
      [pagesRaw[3], pagesRaw[4]]
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
      <div className="pdf-burner-dashboard no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px', borderBottom: '2px solid var(--gold)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontFamily: '"Playfair Display", serif', color: '#111', fontSize: '1.8rem' }}>Program Generator</h1>
          <p style={{ margin: 0, color: '#555', fontSize: '0.95rem' }}>8-Page Book Layout. Click "Download PDF" below.</p>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', flex: '2 1 500px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#f9f9f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>Upload Cover Photo:</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={coverUploading} style={{ fontSize: '0.8rem', width: '100%' }} />
            {coverUploading && <span style={{ fontSize: '0.75rem', color: '#d4af37' }}>Uploading...</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#f9f9f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>Upload 30 Photos:</label>
            <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} style={{ fontSize: '0.8rem', width: '100%' }} />
            {galleryUploading && <span style={{ fontSize: '0.75rem', color: '#d4af37' }}>Uploading...</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#f9f9f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>Upload QR Code:</label>
            <input type="file" accept="image/*" onChange={handleQrUpload} disabled={qrUploading} style={{ fontSize: '0.8rem', width: '100%' }} />
            {qrUploading && <span style={{ fontSize: '0.75rem', color: '#d4af37' }}>Uploading...</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', flex: '1 1 250px' }}>
          <button onClick={handleDownload} className="pdf-burner-btn-main" style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF
          </button>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>Format:</label>
            <select value={paperSize} onChange={e => setPaperSize(e.target.value)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '0.85rem' }}>
              <option value="A4">A4 (8 Pages)</option>
              <option value="A3">A3 (Booklet)</option>
            </select>
          </div>
          <Link to="/admin" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Admin</Link>
        </div>
      </div>

      {/* ── PRINTABLE PDF DOCUMENT ── */}
      <div className="pdf-document">
        {renderedPages}
      </div>
    </div>
  );
}
