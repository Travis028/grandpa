import { useState, useEffect } from 'react';
import api, { API_BASE } from '../config';
import { motion } from 'framer-motion';

const S = {
  btn: { padding: '8px 16px', cursor: 'pointer', border: 'none', borderRadius: '4px' },
  btnBlack: { background: '#000', color: '#fff' },
  btnRed: { background: '#e53e3e', color: '#fff' },
  btnGray: { background: '#ccc', color: '#000' },
  btnGreen: { background: '#276749', color: '#fff' },
  input: { padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  card: { border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '16px', background: '#fff' },
  label: { display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.85rem' },
};

// ── Login ──────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/admin/login', { username, password });
      onLogin(res.data.token);
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '120px 20px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '24px' }}>Admin Login</h2>
      <form onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
        <input style={S.input} type="text" placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)} required />
        <input style={S.input} type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" style={{ ...S.btn, ...S.btnBlack, padding: '12px' }}>Login</button>
        <button type="button" onClick={() => setShowHint(!showHint)}
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
          Forgot password?
        </button>
        {showHint && (
          <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '6px', padding: '12px', fontSize: '0.85rem' }}>
            <p>Please contact the site administrator to reset your credentials.</p>
          </div>
        )}
      </form>
    </motion.div>
  );
}

// ── Family Member Editor ───────────────────────────────────────────────────
function FamilyEditor({ member, idx, token, onSaved }) {
  const [form, setForm] = useState({ name: member.name, spouse: member.spouse || '', note: member.note || '', tribute: member.tribute || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [gcPhotos, setGcPhotos] = useState({});

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/family/${idx}`, form, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Saved!');
      onSaved();
    } catch { setMsg('Error saving.'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const uploadPortrait = async () => {
    if (!photoFile) return;
    const fd = new FormData();
    fd.append('photo', photoFile);
    try {
      await api.post(`/api/admin/family/${idx}/photo`, fd, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Portrait uploaded!');
      onSaved();
    } catch { setMsg('Upload failed.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const uploadGcPhoto = async (gidx) => {
    const file = gcPhotos[gidx];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await api.post(`/api/admin/family/${idx}/grandchild/${gidx}/photo`, fd, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(`Photo uploaded for grandchild!`);
      onSaved();
    } catch { setMsg('Upload failed.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={S.card}>
      <h4 style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
        {member.name}
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={S.label}>Name</label>
          <input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label style={S.label}>Spouse</label>
          <input style={S.input} value={form.spouse} onChange={e => setForm({ ...form, spouse: e.target.value })} />
        </div>
        <div>
          <label style={S.label}>Note</label>
          <input style={S.input} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={S.label}>Tribute to Dad</label>
        <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
          value={form.tribute} onChange={e => setForm({ ...form, tribute: e.target.value })} />
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Portrait Photo</label>
          <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} style={{ fontSize: '0.85rem' }} />
        </div>
        {member.portrait && (
          <img src={`${API_BASE}/api/static/images/children/${member.portrait}`} alt=""
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ddd' }}
            onError={e => e.target.style.display = 'none'} />
        )}
        <button style={{ ...S.btn, ...S.btnBlack, marginTop: '20px' }} onClick={uploadPortrait}>Upload</button>
      </div>

      <button style={{ ...S.btn, ...S.btnBlack }} onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      {msg && <span style={{ marginLeft: '12px', color: '#276749', fontSize: '0.85rem' }}>{msg}</span>}

      {member.grandchildren && member.grandchildren.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h5 style={{ marginBottom: '12px', color: '#555' }}>Grandchildren</h5>
          {member.grandchildren.map((gc, gidx) => (
            <div key={gidx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '6px', flexWrap: 'wrap' }}>
              <img src={`${API_BASE}/api/static/images/children/${gc.photo}`} alt={gc.name}
                style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ddd', flexShrink: 0 }}
                onError={e => e.target.style.display = 'none'} />
              <span style={{ fontWeight: '600', minWidth: '120px' }}>{gc.name}</span>
              <input type="file" accept="image/*" style={{ fontSize: '0.8rem', flex: 1 }}
                onChange={e => setGcPhotos({ ...gcPhotos, [gidx]: e.target.files[0] })} />
              <button style={{ ...S.btn, ...S.btnBlack, fontSize: '0.8rem' }} onClick={() => uploadGcPhoto(gidx)}>Upload</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tributes Manager ───────────────────────────────────────────────────────
function TributesManager({ tributes, token, onSaved }) {
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');

  const startEdit = (idx) => {
    setEditing(idx);
    setEditForm({ ...tributes[idx] });
  };

  const saveEdit = async (idx) => {
    try {
      await api.put(`/api/admin/tributes/${idx}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setEditing(null);
      setMsg('Tribute updated!');
      onSaved();
    } catch { setMsg('Error updating.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteTribute = async (idx) => {
    if (!window.confirm('Delete this tribute?')) return;
    try {
      await api.delete(`/api/admin/tributes/${idx}`, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Tribute deleted.');
      onSaved();
    } catch { setMsg('Error deleting.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      {msg && <p style={{ color: '#276749', marginBottom: '12px' }}>{msg}</p>}
      {tributes.length === 0 && <p style={{ color: '#888' }}>No tributes yet.</p>}
      {tributes.map((t, idx) => (
        <div key={idx} style={S.card}>
          {editing === idx ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input style={S.input} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
              <input style={S.input} value={editForm.relation} onChange={e => setEditForm({ ...editForm, relation: e.target.value })} placeholder="Relation" />
              <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
                value={editForm.message} onChange={e => setEditForm({ ...editForm, message: e.target.value })} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...S.btn, ...S.btnGreen }} onClick={() => saveEdit(idx)}>Save</button>
                <button style={{ ...S.btn, ...S.btnGray }} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>"{t.message}"</p>
              <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '12px' }}>
                — {t.name} · {t.relation} · {t.date}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...S.btn, ...S.btnBlack }} onClick={() => startEdit(idx)}>Edit</button>
                <button style={{ ...S.btn, ...S.btnRed }} onClick={() => deleteTribute(idx)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAdminData = async (t = token) => {
    try {
      const res = await api.get('/api/admin/data', { headers: { Authorization: `Bearer ${t}` } });
      setData(res.data);
    } catch {
      setToken(null);
      localStorage.removeItem('adminToken');
    }
  };

  useEffect(() => { if (token) fetchAdminData(); }, [token]);

  const handleLogin = (t) => {
    setToken(t);
    localStorage.setItem('adminToken', t);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  if (!token) return <LoginForm onLogin={handleLogin} />;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading dashboard...</div>;

  const tabs = ['overview', 'family', 'tributes'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '100px 20px 60px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Admin Dashboard</h2>
        <button style={{ ...S.btn, ...S.btnGray }} onClick={handleLogout}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...S.btn, background: activeTab === tab ? '#000' : '#f4f4f4', color: activeTab === tab ? '#fff' : '#333', borderRadius: '4px 4px 0 0', textTransform: 'capitalize' }}>
            {tab === 'overview' ? 'Overview' : tab === 'family' ? `Family (${data.family.length})` : `Tributes (${data.tributes.length})`}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '30px' }}>
            <div style={{ ...S.card, textAlign: 'center' }}>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Live Visitors</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4ade80' }}>{data.live_visitors}</p>
            </div>
            <div style={{ ...S.card, textAlign: 'center' }}>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Tributes</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{data.tributes.length}</p>
            </div>
            <div style={{ ...S.card, textAlign: 'center' }}>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Family Branches</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{data.family.length}</p>
            </div>
          </div>

          <div style={S.card}>
            <h4 style={{ marginBottom: '12px' }}>Grandpa Info</h4>
            <p><strong>Name:</strong> {data.grandpa.name}</p>
            <p><strong>Born:</strong> {data.grandpa.birth_year} &nbsp;|&nbsp; <strong>Departed:</strong> {data.grandpa.death_year}</p>
            <p><strong>Final Words:</strong> "{data.grandpa.final_words}"</p>
          </div>

          {data.visitor_details && data.visitor_details.length > 0 && (
            <div style={S.card}>
              <h4 style={{ marginBottom: '12px' }}>Active Visitors</h4>
              {data.visitor_details.map((v, i) => (
                <p key={i} style={{ fontSize: '0.85rem', color: '#555' }}>IP: {v.ip} — connected at {v.time}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family Tab */}
      {activeTab === 'family' && (
        <div>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
            Edit each family member's details, tribute, and upload their portrait or grandchildren photos.
          </p>
          {data.family.map((member, idx) => (
            <FamilyEditor key={idx} member={member} idx={idx} token={token} onSaved={() => fetchAdminData()} />
          ))}
        </div>
      )}

      {/* Tributes Tab */}
      {activeTab === 'tributes' && (
        <div>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
            View, edit or delete tributes left by visitors.
          </p>
          <TributesManager tributes={data.tributes} token={token} onSaved={() => fetchAdminData()} />
        </div>
      )}
    </motion.div>
  );
}
