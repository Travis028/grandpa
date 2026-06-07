import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api, { API_BASE } from '../config';
import { motion } from 'framer-motion';

const S = {
  btn: { padding: '8px 16px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontSize: '0.85rem' },
  btnBlack: { background: '#111', color: '#fff' },
  btnRed: { background: '#e53e3e', color: '#fff' },
  btnGray: { background: '#e2e8f0', color: '#333' },
  btnGreen: { background: '#276749', color: '#fff' },
  input: { padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' },
  card: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '14px', background: '#fff' },
  label: { display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.82rem', color: '#444' },
  tag: (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', background: color, color: '#fff', fontWeight: 600 }),
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [err, setErr] = useState(''); const [hint, setHint] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try { const r = await api.post('/api/admin/login', { username: u, password: p }); onLogin(r.data.token); }
    catch { setErr('Invalid credentials.'); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '120px 20px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '8px' }}>Admin Login</h2>
      <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>Restricted access — authorised personnel only</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
        <input style={S.input} type="text" placeholder="Username" value={u} onChange={e => setU(e.target.value)} required />
        <input style={S.input} type="password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} required />
        {err && <p style={{ color: 'red', fontSize: '0.85rem' }}>{err}</p>}
        <button type="submit" style={{ ...S.btn, ...S.btnBlack, padding: '12px' }}>Login</button>
        <button type="button" onClick={() => setHint(!hint)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
          Forgot password?
        </button>
        {hint && <div style={{ background: '#f7f7f7', border: '1px solid #ddd', borderRadius: '6px', padding: '12px', fontSize: '0.85rem', color: '#555' }}>
          Please contact the site administrator to reset your credentials.
        </div>}
      </form>
    </motion.div>
  );
}

// ── Grandpa Editor ───────────────────────────────────────────────────────────
function GrandpaEditor({ grandpa, token, onSaved }) {
  const [form, setForm] = useState({ ...grandpa });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const save = async () => {
    setSaving(true);
    try { await api.put('/api/admin/grandpa', form, { headers: authHeader(token) }); flash('Saved! Changes are now live.'); onSaved(); }
    catch { flash('Error saving.'); }
    setSaving(false);
  };
  return (
    <div style={S.card}>
      <h4 style={{ marginBottom: '14px' }}>Edit Grandpa Info</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {[['name','Full Name'],['birth_year','Birth Year'],['death_year','Year of Passing'],['birth_place','Birth Place'],['wife_name','Wife Name'],['final_words','Final Words']].map(([key, label]) => (
          <div key={key}>
            <label style={S.label}>{label}</label>
            <input style={S.input} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={S.label}>Life Story</label>
        <textarea style={{ ...S.input, minHeight: '140px', resize: 'vertical' }} value={form.life_story || ''} onChange={e => setForm({ ...form, life_story: e.target.value })} />
      </div>
      <button style={{ ...S.btn, ...S.btnBlack }} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      {msg && <span style={{ marginLeft: '10px', color: '#276749', fontSize: '0.85rem' }}>{msg}</span>}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  const statBox = (label, value, color = '#111') => (
    <div style={{ ...S.card, textAlign: 'center', flex: 1 }}>
      <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {statBox('Live Now', data.live_visitors, '#16a34a')}
        {statBox('Total Visitors', data.total_visitors)}
        {statBox('Unique Named', data.unique_visitors.length)}
        {statBox('Tributes', data.tributes.length)}
        {statBox('Shares', data.shares.length)}
        {statBox('Access Requests', data.admin_requests.filter(r => r.status === 'pending').length, '#dc2626')}
      </div>

      <div style={S.card}>
        <h4 style={{ marginBottom: '10px' }}>Grandpa Info</h4>
        <p><strong>Name:</strong> {data.grandpa.name}</p>
        <p><strong>Born:</strong> {data.grandpa.birth_year} &nbsp;|&nbsp; <strong>Departed:</strong> {data.grandpa.death_year}</p>
        <p><strong>Final Words:</strong> "{data.grandpa.final_words}"</p>
      </div>

      {data.live_visitor_details.length > 0 && (
        <div style={S.card}>
          <h4 style={{ marginBottom: '10px' }}>Live on Site Right Now</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '6px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Page</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Connected</th>
            </tr></thead>
            <tbody>
              {data.live_visitor_details.map((v, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '6px' }}>{v.name}</td>
                  <td style={{ padding: '6px', color: '#555' }}>{v.page}</td>
                  <td style={{ padding: '6px', color: '#888' }}>{v.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={S.card}>
        <h4 style={{ marginBottom: '10px' }}>All Named Visitors ({data.unique_visitors.length})</h4>
        {data.unique_visitors.length === 0
          ? <p style={{ color: '#aaa' }}>No named visitors yet.</p>
          : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.unique_visitors.map((n, i) => <span key={i} style={{ background: '#f3f4f6', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>{n}</span>)}
            </div>}
      </div>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────
function ActivityTab({ data }) {
  const actionColor = { visited: '#2563eb', tribute: '#16a34a', shared: '#d97706', navigated: '#7c3aed' };
  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ ...S.card, flex: 1 }}>
          <h4 style={{ marginBottom: '10px' }}>Share Breakdown</h4>
          {data.shares.length === 0 ? <p style={{ color: '#aaa' }}>No shares yet.</p> :
            Object.entries(data.shares.reduce((a, s) => { a[s.platform] = (a[s.platform] || 0) + 1; return a; }, {}))
              .map(([k, v]) => <p key={k} style={{ fontSize: '0.9rem', marginBottom: '4px' }}><strong>{k}:</strong> {v}</p>)}
        </div>
      </div>

      <div style={S.card}>
        <h4 style={{ marginBottom: '10px' }}>Activity Log (last 100)</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead><tr style={{ borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff' }}>
              <th style={{ textAlign: 'left', padding: '6px' }}>Time</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Action</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Detail</th>
            </tr></thead>
            <tbody>
              {[...data.activity].reverse().map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '5px', color: '#999', whiteSpace: 'nowrap' }}>{a.time}</td>
                  <td style={{ padding: '5px', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '5px' }}>
                    <span style={S.tag(actionColor[a.action] || '#555')}>{a.action}</span>
                  </td>
                  <td style={{ padding: '5px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Gallery Manager ───────────────────────────────────────────────────────────
function GalleryManager({ idx, gallery, token, onSaved }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const upload = async () => {
    if (!file) return;
    const fd = new FormData(); fd.append('photo', file);
    try {
      await api.post(`/api/admin/family/${idx}/gallery`, fd, { headers: authHeader(token) });
      flash('Photo added to gallery!'); setFile(null); onSaved();
    } catch { flash('Upload failed.'); }
  };

  const remove = async (gidx) => {
    if (!window.confirm('Remove this photo?')) return;
    try {
      await api.delete(`/api/admin/family/${idx}/gallery/${gidx}`, { headers: authHeader(token) });
      flash('Removed.'); onSaved();
    } catch { flash('Error.'); }
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '14px' }}>
      <h5 style={{ marginBottom: '10px', color: '#555' }}>Gallery ({gallery.length} photos)</h5>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {gallery.map((ph, gidx) => (
          <div key={gidx} style={{ position: 'relative' }}>
            <img src={`${API_BASE}/api/static/images/children/${ph}`} alt=""
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
              onError={e => e.target.style.display = 'none'} />
            <button onClick={() => remove(gidx)}
              style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', lineHeight: '20px', padding: 0 }}>
              x
            </button>
          </div>
        ))}
        {gallery.length === 0 && <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No gallery photos yet.</p>}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="file" accept="image/*" multiple onChange={e => setFile(e.target.files[0])} style={{ fontSize: '0.82rem', flex: 1 }} />
        <button style={{ ...S.btn, ...S.btnBlack }} onClick={upload}>Add Photo</button>
      </div>
      {msg && <p style={{ color: '#276749', fontSize: '0.82rem', marginTop: '6px' }}>{msg}</p>}
    </div>
  );
}

// ── Family Editor ─────────────────────────────────────────────────────────────
function FamilyEditor({ member, idx, token, onSaved }) {
  const [form, setForm] = useState({ name: member.name, spouse: member.spouse || '', note: member.note || '', tribute: member.tribute || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [portraitFile, setPortraitFile] = useState(null);
  const [gcPhotos, setGcPhotos] = useState({});
  const [open, setOpen] = useState(false);
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    setSaving(true);
    try { await api.put(`/api/admin/family/${idx}`, form, { headers: authHeader(token) }); flash('Saved!'); onSaved(); }
    catch { flash('Error saving.'); }
    setSaving(false);
  };

  const uploadPortrait = async () => {
    if (!portraitFile) return;
    const fd = new FormData(); fd.append('photo', portraitFile);
    try { await api.post(`/api/admin/family/${idx}/photo`, fd, { headers: authHeader(token) }); flash('Portrait uploaded!'); onSaved(); }
    catch { flash('Upload failed.'); }
  };

  const uploadGcPhoto = async (gidx) => {
    const file = gcPhotos[gidx]; if (!file) return;
    const fd = new FormData(); fd.append('photo', file);
    try { await api.post(`/api/admin/family/${idx}/grandchild/${gidx}/photo`, fd, { headers: authHeader(token) }); flash('Grandchild photo uploaded!'); onSaved(); }
    catch { flash('Upload failed.'); }
  };

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={`${API_BASE}/api/static/images/children/${member.portrait}`} alt=""
            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ddd' }}
            onError={e => e.target.style.display = 'none'} />
          <div>
            <strong>{member.name}</strong>
            {member.spouse && <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: '8px' }}>& {member.spouse}</span>}
            <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0 }}>{(member.gallery || []).length} gallery photos · {(member.grandchildren || []).length} grandchildren</p>
          </div>
        </div>
        <span style={{ fontSize: '1.2rem', color: '#888' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={S.label}>Name</label><input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={S.label}>Spouse</label><input style={S.input} value={form.spouse} onChange={e => setForm({ ...form, spouse: e.target.value })} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Note</label><input style={S.input} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={S.label}>Tribute to Dad</label>
            <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical' }} value={form.tribute} onChange={e => setForm({ ...form, tribute: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}><label style={S.label}>Portrait Photo</label><input type="file" accept="image/*" onChange={e => setPortraitFile(e.target.files[0])} style={{ fontSize: '0.82rem' }} /></div>
            <button style={{ ...S.btn, ...S.btnBlack }} onClick={uploadPortrait}>Upload Portrait</button>
          </div>
          <button style={{ ...S.btn, ...S.btnBlack }} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          {msg && <span style={{ marginLeft: '10px', color: '#276749', fontSize: '0.82rem' }}>{msg}</span>}

          {/* Gallery */}
          <GalleryManager idx={idx} gallery={member.gallery || []} token={token} onSaved={onSaved} />

          {/* Grandchildren */}
          {member.grandchildren && member.grandchildren.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '14px' }}>
              <h5 style={{ marginBottom: '10px', color: '#555' }}>Grandchildren Photos</h5>
              {member.grandchildren.map((gc, gidx) => (
                <div key={gidx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '6px', flexWrap: 'wrap' }}>
                  <img src={`${API_BASE}/api/static/images/children/${gc.photo}`} alt={gc.name}
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ddd', flexShrink: 0 }}
                    onError={e => e.target.style.display = 'none'} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: '120px' }}>{gc.name}</span>
                  <input type="file" accept="image/*" style={{ fontSize: '0.78rem', flex: 1 }} onChange={e => setGcPhotos({ ...gcPhotos, [gidx]: e.target.files[0] })} />
                  <button style={{ ...S.btn, ...S.btnBlack, fontSize: '0.78rem' }} onClick={() => uploadGcPhoto(gidx)}>Upload</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tributes Tab ──────────────────────────────────────────────────────────────
function TributesTab({ tributes, token, onSaved }) {
  const [editing, setEditing] = useState(null);
  const [ef, setEf] = useState({});
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async (idx) => {
    try { await api.put(`/api/admin/tributes/${idx}`, ef, { headers: authHeader(token) }); setEditing(null); flash('Updated!'); onSaved(); }
    catch { flash('Error.'); }
  };
  const del = async (idx) => {
    if (!window.confirm('Delete this tribute?')) return;
    try { await api.delete(`/api/admin/tributes/${idx}`, { headers: authHeader(token) }); flash('Deleted.'); onSaved(); }
    catch { flash('Error.'); }
  };

  return (
    <div>
      {msg && <p style={{ color: '#276749', marginBottom: '10px' }}>{msg}</p>}
      {tributes.length === 0 && <p style={{ color: '#aaa' }}>No tributes yet.</p>}
      {tributes.map((t, idx) => (
        <div key={idx} style={S.card}>
          {editing === idx ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input style={S.input} value={ef.name || ''} onChange={e => setEf({ ...ef, name: e.target.value })} placeholder="Name" />
              <input style={S.input} value={ef.relation || ''} onChange={e => setEf({ ...ef, relation: e.target.value })} placeholder="Relation" />
              <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical' }} value={ef.message || ''} onChange={e => setEf({ ...ef, message: e.target.value })} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...S.btn, ...S.btnGreen }} onClick={() => save(idx)}>Save</button>
                <button style={{ ...S.btn, ...S.btnGray }} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontStyle: 'italic', marginBottom: '6px', fontSize: '0.9rem' }}>"{t.message}"</p>
              <p style={{ fontSize: '0.82rem', color: '#777', marginBottom: '10px' }}>— {t.name} · {t.relation} · {t.date}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...S.btn, ...S.btnBlack }} onClick={() => { setEditing(idx); setEf({ ...t }); }}>Edit</button>
                <button style={{ ...S.btn, ...S.btnRed }} onClick={() => del(idx)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Admin Requests Tab ────────────────────────────────────────────────────────
function RequestsTab({ requests, token, onSaved }) {
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const update = async (idx, status) => {
    try { await api.put(`/api/admin/requests/${idx}`, { status }, { headers: authHeader(token) }); flash(`Request ${status}.`); onSaved(); }
    catch { flash('Error.'); }
  };

  const statusColor = { pending: '#d97706', approved: '#16a34a', denied: '#dc2626' };

  return (
    <div>
      {msg && <p style={{ color: '#276749', marginBottom: '10px' }}>{msg}</p>}
      {requests.length === 0 && <p style={{ color: '#aaa' }}>No access requests yet.</p>}
      {requests.map((r, idx) => (
        <div key={idx} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p><strong>{r.name}</strong> <span style={S.tag(statusColor[r.status] || '#888')}>{r.status}</span></p>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0' }}>{r.reason}</p>
              <p style={{ fontSize: '0.78rem', color: '#aaa' }}>{r.time}</p>
            </div>
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...S.btn, ...S.btnGreen }} onClick={() => update(idx, 'approved')}>Approve</button>
                <button style={{ ...S.btn, ...S.btnRed }} onClick={() => update(idx, 'denied')}>Deny</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');

  const fetch = async (t = token) => {
    try {
      const r = await api.get('/api/admin/data', { headers: authHeader(t) });
      setData(r.data);
    } catch {
      setToken(null); localStorage.removeItem('adminToken');
    }
  };

  useEffect(() => { if (token) fetch(); }, [token]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetch(), 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Real-time socket updates — refresh data when backend emits changes
  useEffect(() => {
    if (!token) return;
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    let socket;
    try {
      socket = io(socketUrl, { path: '/socket.io', transports: ['websocket', 'polling'], reconnectionAttempts: 3 });
      socket.on('family_updated', () => fetch());
      socket.on('grandpa_updated', () => fetch());
      socket.on('new_tribute', () => fetch());
      socket.on('visitor_count', () => fetch());
      socket.on('admin_request', () => fetch());
    } catch {}
    return () => { if (socket) socket.disconnect(); };
  }, [token]);

  const handleLogin = (t) => { setToken(t); localStorage.setItem('adminToken', t); };
  const handleLogout = () => { setToken(null); localStorage.removeItem('adminToken'); setData(null); };

  if (!token) return <LoginForm onLogin={handleLogin} />;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading dashboard...</div>;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'grandpa', label: 'Grandpa Info' },
    { key: 'activity', label: `Activity` },
    { key: 'family', label: `Family (${data.family.length})` },
    { key: 'tributes', label: `Tributes (${data.tributes.length})` },
    { key: 'requests', label: `Requests ${data.admin_requests.filter(r => r.status === 'pending').length > 0 ? `(${data.admin_requests.filter(r => r.status === 'pending').length})` : ''}` },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '100px 20px 60px', maxWidth: '1060px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <p style={{ color: '#888', fontSize: '0.82rem', margin: '2px 0 0' }}>Auto-refreshes every 15 seconds</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...S.btn, ...S.btnBlack }} onClick={() => fetch()}>Refresh Now</button>
          <button style={{ ...S.btn, ...S.btnGray }} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...S.btn, background: tab === t.key ? '#111' : '#f3f4f6', color: tab === t.key ? '#fff' : '#333', borderRadius: '4px 4px 0 0', padding: '10px 16px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'grandpa' && <GrandpaEditor grandpa={data.grandpa} token={token} onSaved={() => fetch()} />}
      {tab === 'activity' && <ActivityTab data={data} />}
      {tab === 'family' && (
        <div>
          <p style={{ color: '#666', marginBottom: '16px', fontSize: '0.88rem' }}>Click any family member to expand and edit their details, portrait, gallery, and grandchildren photos.</p>
          {data.family.map((m, idx) => <FamilyEditor key={idx} member={m} idx={idx} token={token} onSaved={() => fetch()} />)}
        </div>
      )}
      {tab === 'tributes' && <TributesTab tributes={data.tributes} token={token} onSaved={() => fetch()} />}
      {tab === 'requests' && <RequestsTab requests={data.admin_requests} token={token} onSaved={() => fetch()} />}
    </motion.div>
  );
}
