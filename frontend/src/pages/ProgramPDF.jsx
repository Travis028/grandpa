import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import api, { API_BASE } from '../config';

export default function ProgramPDF() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperSize, setPaperSize] = useState('A4');
  const [qrUploading, setQrUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  
  const pdfRef = useRef();

  useEffect(() => {
    Promise.all([
      api.get('/api/grandpa'),
      api.get('/api/program'),
      api.get('/api/life_photos'),
      api.get('/api/program_photos')
    ]).then(([resGrandpa, resProgram, resLife, resProgramPhotos]) => {
      setData({
        grandpa: resGrandpa.data,
        program: resProgram.data,
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
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#000000' }}>Preparing Floral 8-Page Booklet...</div>;
  }

  if (!data || !data.grandpa) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Error loading data.</div>;
  }

  const { grandpa, program, lifePhotos, programPhotos } = data;

  const handleDownload = () => {
    const element = pdfRef.current;
    const opt = {
      margin:       0,
      filename:     `Memorial_Program_${grandpa.name.replace(/ /g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.95 },
      // Force windowWidth to 1200 to prevent mobile media queries from stretching the A4 panels downward
      html2canvas:  { scale: 1, useCORS: true, windowWidth: 1200 }, 
      jsPDF:        { unit: 'mm', format: paperSize === 'A3' ? 'a3' : 'a4', orientation: paperSize === 'A3' ? 'landscape' : 'portrait' },
      pagebreak:    { mode: 'css', avoid: '.pdf-a4-panel' }
    };
    html2pdf().set(opt).from(element).save().catch(err => {
      console.error("PDF generation error: ", err);
      alert("There was an error generating the PDF. This is usually caused by having too many high-resolution photos. Try A4 format or fewer photos.");
    });
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/api/upload_qr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('QR Code successfully uploaded!');
      window.location.reload();
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
      alert('Program Cover successfully uploaded!');
      window.location.reload();
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
      alert('Program Gallery Photos successfully uploaded!');
      window.location.reload();
    } catch (err) {
      alert('Error uploading Program Gallery.');
    } finally {
      setGalleryUploading(false);
    }
  };

  // Floral Blue Theme Setup
  const floralBg = { 
    backgroundImage: `url('${API_BASE}/api/static/images/floral_bg.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eef7f2',
    color: '#000000', // Pure black text
  };

  const textColor = '#000000'; // High visibility
  const headingColor = '#000000'; // Dark floral blue for headings to complement the green-blue text

  // --- PAGE COMPONENTS ---

  // Page 1: Cover
  const PageCover = () => (
    <div className="pdf-page-content pdf-page-center pdf-cover" style={floralBg}>
      <div className="pdf-cover-ornament" style={{ color: headingColor }}>✦ In Loving Memory ✦</div>
      <div className="pdf-cover-photo-wrapper" style={{ border: `4px solid ${headingColor}`, boxShadow: '0 8px 20px rgba(0,0,0,0.2)', background: '#fff', padding: '5px' }}>
        <img 
          src={`${API_BASE}/api/static/images/grandpa/program_cover.jpg?t=${Date.now()}`} 
          alt={grandpa.name} 
          style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '50%' }} 
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
      <h1 className="pdf-title" style={{ color: headingColor }}>{grandpa.name}</h1>
      <h2 className="pdf-subtitle" style={{ color: textColor }}>A Life Well Lived</h2>
      <div className="pdf-dates" style={{ borderColor: headingColor, color: textColor }}>
        <div className="pdf-date-box">
          <span className="pdf-date-label">Sunrise</span>
          <span className="pdf-date-val">{grandpa.birth_year}</span>
        </div>
        <div className="pdf-date-divider" style={{ background: headingColor }}></div>
        <div className="pdf-date-box">
          <span className="pdf-date-label">Sunset</span>
          <span className="pdf-date-val">{grandpa.death_year}</span>
        </div>
      </div>
    </div>
  );

  // Page 2: Order of Service & Hymnals
  const PageProgram = () => (
    <div className="pdf-page-content" style={floralBg}>
      <div className="pdf-content-relative" style={{ display: 'flex', gap: '20px', height: '100%' }}>
        
        {/* Left Column: Order of Service */}
        <div style={{ flex: '1', borderRight: `1px dashed ${headingColor}`, paddingRight: '15px' }}>
          <h2 className="pdf-section-title" style={{ fontSize: '1.6rem', marginBottom: '10px', color: headingColor }}>Order of Service</h2>
          <div style={{ marginBottom: '15px', color: textColor, fontStyle: 'italic', fontSize: '0.9rem' }}>
            <strong>Date:</strong> {program.date} <br/>
            <strong>Venue:</strong> {program.venue} <br/>
            <strong>Time:</strong> {program.time_start} {program.time_end ? `- ${program.time_end}` : ''}
          </div>
          
          <div style={{ fontSize: '0.95rem', lineHeight: '1.4', color: textColor }}>
            {program.order.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', color: headingColor }}>
                  {item.time} - {item.item}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Hymnals */}
        <div style={{ flex: '1', paddingLeft: '5px', fontSize: '0.8rem', lineHeight: '1.4', color: textColor }}>
          <h2 className="pdf-section-title" style={{ fontSize: '1.6rem', marginBottom: '10px', color: headingColor }}>Hymnals</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: headingColor }}>258. ANANE WANG' YESU KRISTO</h4>
            <p style={{ margin: '0 0 4px 0' }}><strong>1.</strong> Anane wang' Yesu Kristo, Kobir' eboche polo; Nabedi mamor moloyo Ka Yesu owir' e piny.</p>
            <p style={{ margin: '0 0 4px 0', fontStyle: 'italic' }}><strong>Chorus:</strong> Anane wang' Yesu Kristo, Yesu Ruoth ma Jawarwa; Ka ageno Yesu pile, To chieng' moro nowara.</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>2.</strong> An to pok aneno Yesu, To ayiee gi chunya; Chieng' kofwenyore e polo, Ananene kak' obet.</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>3.</strong> Pinyni orachna moloyo, nikech tho gi tuo nitie; Anamor kaneno Yesu, Ok nane chandruok kendo.</p>
            <p style={{ margin: '0' }}><strong>4.</strong> Yesu Kristo en Jang'wono, Nosetho ni ji duto; Mondo ng'a moseyie kuome Kik olal ma nyaka chieng'.</p>
          </div>

          <div>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: headingColor }}>263. JI NOYUD MOR KA TICH ORUMO</h4>
            <p style={{ margin: '0 0 4px 0' }}><strong>1.</strong> Ji noyud mor ka tich orumo, ka jo keyo biro gi cham Ma gikelo ni Ruoth maduong', E Jerusalem Manyien.</p>
            <p style={{ margin: '0 0 4px 0', fontStyle: 'italic' }}><strong>Chorus:</strong> Mor, mor, mor nobedi maduong', Mor, mor, ma ok enorum; Mor, mor, Ndalono chiegini Ma tich biro rumoe.</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>2.</strong> Wanawer wende mamit chieng'no, wanayud mor ngang' e chunywa, Kwadendo Ruodhwa nyaka chieng' E Jerusalem Manyien.</p>
            <p style={{ margin: '0' }}><strong>3.</strong> Jo keyo noyudi mor maduong', kod kwonde bet ma nyaka chieng', Yesu Ruoth oseloso E Jerusalem Manyien</p>
          </div>
        </div>

      </div>
    </div>
  );

  // Page 3: His Life (Part 1 - Extended for readability)
  const PageStoryPart1 = () => (
    <div className="pdf-page-content" style={floralBg}>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: headingColor }}>His Story (Part 1)</h2>
        
        <div style={{ fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'justify', color: textColor }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>A Celebration of the Life of Apollo Josiah Fizvalentine Owino Awidhi</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: headingColor, fontSize: '1.1rem' }}>A Precious Gift to the World</h4>
          <p style={{ margin: '0 0 10px 0' }}>On April 23, 1952, a remarkable soul was ushered into this world, Apollo Josiah Fizvalentine Owino Awidhi, the last-born son of the late Timotheo Awidhi Nyandere and the late Isdora Kiti Awidhi. From his earliest days, it was evident that Apollo was destined for greatness, blessed with an insatiable curiosity and an enduring spirit that would later define his extraordinary life.</p>
          <p style={{ margin: '0 0 10px 0' }}>He was a cherished brother to the late Ismael Onyango Awidhi, the late Mary Mwai, the late Annah Adhiambo Odoyo, the late Samuel Awiti Awidhi, the late Nerea Odira, and the late Hesbon Odero Awidhi. Together, they formed a close-knit family bound by love, mutual respect, and shared memories that would last a lifetime.</p>
          <p style={{ margin: '0 0 10px 0' }}>His sisters-in-law, whom he held in high regard, include the late Jane Odero, Caren Onyango, Zilpah Awiti, and Silpa Onyango. They were not merely in-laws but cherished members of his extended family, and he valued their presence and contribution to the family bond.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: headingColor, fontSize: '1.1rem' }}>A Scholarly Foundation</h4>
          <p style={{ margin: '0 0 10px 0' }}>Apollo's educational journey began with humble yet significant steps. He commenced his early schooling at Kwoyo Kodolo before proceeding to Ngere Primary School, where he successfully sat for his Certificate of Primary Education in 1970. His academic prowess earned him a place at Isebania High School, where he distinguished himself and completed his East African Certificate in 1974.</p>
          <p style={{ margin: '0 0 10px 0' }}>Driven by a profound passion for imparting knowledge and shaping futures, he enrolled at Kamwenja Teachers College in 1975. Upon graduating in May 1976 with a P1 teaching certificate, Apollo was equipped not merely with qualifications but with a vocation—a calling to nurture and enlighten young minds.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: headingColor, fontSize: '1.1rem' }}>An Illustrious Career in Education</h4>
          <p style={{ margin: '0 0 10px 0' }}>Apollo's professional odyssey was one of unwavering dedication, resilience, and transformative leadership. His teaching career commenced in Nyatike Sub-County, where the Teachers Service Commission posted him to Otho Primary School and subsequently to Mariba Primary School. Between 1977 and 1979, he labored diligently, instilling knowledge and discipline in his pupils.</p>
          <p style={{ margin: '0 0 10px 0' }}>Between 1980 and 1984, his exemplary service saw him transferred to Homa Bay County, where he served at Godbondo Primary School, Asego Primary School, Lala Primary School, and Ruga Primary School. At each institution, he left an indelible mark, earning the admiration of colleagues and the respect of his students.</p>
          <p style={{ margin: '0' }}>In 1985, Apollo took on greater responsibilities when he was posted to Kuna Primary School and later to Tuk Jowi Primary School. For eight years, from 1985 to 1992, he served with distinction as Head Teacher, demonstrating exceptional administrative acumen and a visionary approach to education. His leadership was characterized by unwavering integrity, profound empathy, and an unyielding commitment to academic excellence.</p>
        </div>
      </div>
    </div>
  );

  // Page 4: His Life (Part 2)
  const PageStoryPart2 = () => (
    <div className="pdf-page-content" style={floralBg}>
      <div className="pdf-content-relative">
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: headingColor }}>His Story (Part 2)</h2>
        
        <div style={{ fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'justify', color: textColor }}>
          <p style={{ margin: '0 0 10px 0' }}>In 1993, he was transferred to Saria Primary School, where he assumed the role of Head of Institution. For fourteen years, until his retirement in 2007, Apollo steered the school with remarkable foresight and dedication. Under his stewardship, the institution flourished, and countless students were transformed into responsible, educated citizens. His career spanned over three decades—a testament to his enduring passion for education and his profound impact on generations of learners.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: headingColor, fontSize: '1.1rem' }}>A Devoted Husband and Loving Father</h4>
          <p style={{ margin: '0 0 10px 0' }}>Beyond his professional achievements, Apollo was first and foremost a family man. On April 25, 1975, he entered into holy matrimony with his beloved wife, Mama Joyce Aoko Owino. Their union, blessed with enduring love, mutual respect, and unwavering support, became a beacon of inspiration to all who knew them.</p>
          <p style={{ margin: '0 0 10px 0' }}>God blessed their marriage with several wonderful children: Pastor Evans Owino, The late Elly Owino, Hellen Okello, Joan Atieno, The late Victor Owino, Timothy Apollo, Jeph Apollo, Beryle Mercy Andrew, and Charles Apollo.</p>
          <p style={{ margin: '0 0 10px 0' }}>Apollo's heart extended generously to his daughters-in-law, whom he cherished as his own. They include the late Milca Aoko, Eunice Odhiambo, Nancy Otieno, Roselyne Jeph, and Lillian Were. He was a pillar of strength, a wellspring of wisdom, and an embodiment of unconditional love to his entire family.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: headingColor, fontSize: '1.1rem' }}>A Legacy of Love and Inspiration</h4>
          <p style={{ margin: '0 0 10px 0' }}>Apollo Josiah Fizvalentine Owino Awidhi lived a life of profound purpose. He was a mentor, a leader, a confidant, and a steadfast patriarch. His journey was marked not by the adversities he encountered but by the triumphs he achieved and the lives he transformed along the way.</p>
          <p style={{ margin: '0 0 10px 0' }}>His legacy continues through his beloved grandchildren, who brought him immense joy and pride. His grandsons are Kevin, Felix, Young, Junior, Wayne, Zach, Dean, Jimmy, Marc, Amaih, Deshon, Gerrard, Henry, Finley, Leakey, Feddy, Frankline, and Bonny. His granddaughters are Awuor, Joy, Natasha, Emmah, Pendo, Bevine, Antonnette, Natalie, and Cynthia. Each grandchild held a special place in his heart, and he cherished every moment spent with them, imparting wisdom, love, and laughter that will forever remain in their hearts.</p>
          <p style={{ margin: '0 0 10px 0' }}>On the tranquil morning of June 1, 2026, at 04:00 hours, the Lord in His infinite wisdom called His faithful servant home. Apollo transitioned peacefully, surrounded by the warmth of prayers and the love of his devoted family. Though he has departed from our physical presence, his spirit, his teachings, and his boundless love remain eternally etched in our hearts.</p>
          
          <h4 style={{ margin: '15px 0 5px 0', color: headingColor, fontSize: '1.1rem' }}>Farewell to a Gentle Giant</h4>
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
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%', ...floralBg }}>
      <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: headingColor }}>Precious Memories</h2>
        <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignContent: 'start' }}>
          {p1Photos.map((photo, idx) => (
            <div key={idx} className="pdf-gallery-item" style={{ height: '200px', background: '#f5f5f5', border: `2px solid ${headingColor}`, borderRadius: '4px', overflow: 'hidden' }}>
              <img src={`${API_BASE}/api/static/images/${isProgramSource ? 'program_photos' : 'life_photos'}/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page 6: Gallery Page 2
  const PageGallery2 = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%', ...floralBg }}>
      <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: 'transparent' }}>...</h2>
        <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignContent: 'start' }}>
          {p2Photos.map((photo, idx) => (
            <div key={idx} className="pdf-gallery-item" style={{ height: '200px', background: '#f5f5f5', border: `2px solid ${headingColor}`, borderRadius: '4px', overflow: 'hidden' }}>
              <img src={`${API_BASE}/api/static/images/${isProgramSource ? 'program_photos' : 'life_photos'}/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page 7: Gallery Page 3
  const PageGallery3 = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%', ...floralBg }}>
      <div className="pdf-content-relative" style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="pdf-section-title" style={{ fontSize: '1.8rem', marginBottom: '15px', color: 'transparent' }}>...</h2>
        <div className="pdf-gallery-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', alignContent: 'start' }}>
          {p3Photos.map((photo, idx) => (
            <div key={idx} className="pdf-gallery-item" style={{ height: '200px', background: '#f5f5f5', border: `2px solid ${headingColor}`, borderRadius: '4px', overflow: 'hidden' }}>
              <img src={`${API_BASE}/api/static/images/${isProgramSource ? 'program_photos' : 'life_photos'}/${photo}`} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page 8: Back Cover (Exactly as requested)
  const PageBackCover = () => (
    <div className="pdf-page-content pdf-page-center" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', ...floralBg }}>
      <div className="pdf-content-relative" style={{ width: '100%', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
        <h2 className="pdf-title" style={{ fontSize: '2.2rem', margin: '0 0 10px 0', color: headingColor }}>APOLLO J. FIZVALENTINE OWINO.</h2>
        <p style={{ margin: '0', fontSize: '1.2rem', color: textColor, fontStyle: 'italic' }}>Thank you for your love, support, and prayers.</p>
        <p style={{ margin: '15px 0 30px 0', fontSize: '1.1rem', color: textColor, fontWeight: 'bold' }}>1952 — 2026</p>
        
        <img src={`${API_BASE}/api/static/images/grandpa/qr_code.jpg?t=${Date.now()}`} alt="QR Code" style={{ width: '180px', height: '180px', border: `3px solid ${headingColor}`, padding: '10px', background: '#fff', margin: '0 auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <p style={{ margin: '15px 0 0 0', fontSize: '1rem', fontWeight: 'bold', color: headingColor }}>Scan Memorial Website</p>
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
          <h1 style={{ margin: '0 0 5px 0', fontFamily: '"Playfair Display", serif', color: '#000000', fontSize: '1.8rem' }}>Program Generator</h1>
          <p style={{ margin: 0, color: '#555555', fontSize: '0.95rem' }}>Floral 8-Page Booklet. Click "Download PDF" below.</p>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', flex: '2 1 500px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#f9f9f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>Upload Cover Photo:</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={coverUploading} style={{ fontSize: '0.8rem', width: '100%' }} />
            {coverUploading && <span style={{ fontSize: '0.75rem', color: '#d4af37' }}>Uploading...</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#f9f9f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>Upload Photos:</label>
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
            <label style={{ fontSize: '0.85rem', color: '#555555', fontWeight: 'bold' }}>Format:</label>
            <select value={paperSize} onChange={e => setPaperSize(e.target.value)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '0.85rem' }}>
              <option value="A4">A4 (8 Pages)</option>
              <option value="A3">A3 (Booklet)</option>
            </select>
          </div>
          <Link to="/admin" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Admin</Link>
        </div>
      </div>

      {/* ── PRINTABLE PDF DOCUMENT ── */}
      <div className="pdf-document" ref={pdfRef}>
        {renderedPages}
      </div>
    </div>
  );
}
