import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    try {
      const res = await axios.get('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      setToken(null);
      localStorage.removeItem('adminToken');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', { username, password });
      setToken(res.data.token);
      localStorage.setItem('adminToken', res.data.token);
      setError('');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  if (!token) {
    return (
      <motion.div className="admin-login" initial={{opacity:0}} animate={{opacity:1}} style={{padding: '100px 20px', textAlign: 'center'}}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto'}}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={{padding: '10px'}} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{padding: '10px'}} />
          {error && <p style={{color: 'red'}}>{error}</p>}
          <button type="submit" className="btn-primary" style={{padding: '10px', background: '#000', color: '#fff'}}>Login</button>
        </form>
      </motion.div>
    );
  }

  if (!data) return <div style={{padding: '100px', textAlign: 'center'}}>Loading dashboard...</div>;

  return (
    <motion.div className="admin-dashboard" initial={{opacity:0}} animate={{opacity:1}} style={{padding: '100px 20px', maxWidth: '1000px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'}}>
        <h2>Dashboard</h2>
        <button onClick={handleLogout} className="btn-secondary" style={{padding: '8px 16px', background: '#ccc'}}>Logout</button>
      </div>

      <div style={{display: 'flex', gap: '20px', marginBottom: '40px'}}>
        <div style={{background: '#f4f4f4', padding: '20px', borderRadius: '10px', flex: 1, textAlign: 'center'}}>
          <h3>Live Visitors</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#4ade80'}}>{data.live_visitors}</p>
        </div>
        <div style={{background: '#f4f4f4', padding: '20px', borderRadius: '10px', flex: 1, textAlign: 'center'}}>
          <h3>Tributes Received</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold'}}>{data.tributes.length}</p>
        </div>
      </div>

      <section style={{marginBottom: '40px'}}>
        <h3>Grandpa Info</h3>
        <p><strong>Name:</strong> {data.grandpa.name}</p>
        <p><strong>Final Words:</strong> {data.grandpa.final_words}</p>
        <button disabled style={{marginTop: '10px'}}>Edit Info (Coming Soon)</button>
      </section>

      <section>
        <h3>Family Hierarchy ({data.family.length} branches)</h3>
        {data.family.map((member, idx) => (
          <div key={idx} style={{border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px'}}>
            <h4>{member.name} {member.spouse && `& ${member.spouse}`}</h4>
            <p style={{fontStyle: 'italic', fontSize: '0.9rem'}}>{member.tribute}</p>
            {member.grandchildren.length > 0 && (
              <p style={{fontSize: '0.9rem'}}>Grandchildren: {member.grandchildren.map(g => g.name).join(', ')}</p>
            )}
            <div style={{marginTop: '10px'}}>
               <button disabled>Edit</button>
            </div>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
