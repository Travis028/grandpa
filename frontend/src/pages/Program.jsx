import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Program() {
  const [program, setProgram] = useState(null);

  useEffect(() => {
    axios.get('/api/program')
      .then(res => setProgram(res.data))
      .catch(err => console.error("Error fetching program:", err));
  }, []);

  if (!program) return <div style={{padding: '5rem', textAlign: 'center'}}>Loading...</div>;

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
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-value">{program.date}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Time:</span>
                <span className="info-value">{program.time_start} - {program.time_end}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Venue:</span>
                <span className="info-value">{program.venue} <br/> <small>{program.venue_address}</small></span>
              </div>
              <div className="info-row">
                <span className="info-label">Dress Code:</span>
                <span className="info-value">{program.dress_code}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Burial:</span>
                <span className="info-value">{program.burial_location}</span>
              </div>
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
            <Link to="/" className="btn-back">← Back to Home</Link>
          </div>
        </div>
      </section>
    </>
  );
}
