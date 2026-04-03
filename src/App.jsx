import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// --- CONFIG FIREBASE (TETAP PAKAI MILIKMU) ---
const firebaseConfig = {
  apiKey: "AIzaSyD1OHn2utYY881b504XEgMAwmhrglqtinQ",
  authDomain: "sedabase.firebaseapp.com",
  databaseURL: "https://sedabase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sedabase",
  storageBucket: "sedabase.firebasestorage.app",
  messagingSenderId: "921144451877",
  appId: "1:921144451877:web:f37ec5e4de4ff4fc4870cc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isPremium: false, projectLimit: 5 });
  const [projects, setProjects] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, docs, settings
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState({ name: '', ep: '', key: '', base: '', seda: '' });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onValue(ref(db, `users/${u.uid}/profile`), (s) => {
          if (s.exists()) setUserData(s.val());
          else set(ref(db, `users/${u.uid}/profile`), { isPremium: false, projectLimit: 5 });
        });
        onValue(ref(db, `users/${u.uid}/projects`), (s) => setProjects(s.val() || {}));
      }
    });
    return () => unsub();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedProject && Object.keys(projects).length >= userData.projectLimit) return alert("Limit Penuh!");
    const id = selectedProject || Date.now();
    update(ref(db, `users/${user.uid}/projects/${id}`), form).then(() => {
      alert("Berhasil disimpan!");
      setForm({ name: '', ep: '', key: '', base: '', seda: '' });
      setSelectedProject(null);
    });
  };

  const deleteProj = (id) => {
    if(confirm("Hapus proyek ini?")) remove(ref(db, `users/${user.uid}/projects/${id}`));
  };

  const editProj = (id, data) => {
    setSelectedProject(id);
    setForm(data);
    setActiveTab('dashboard');
  };

  if (!user) return (
    <div style={st.center}>
      <h1 style={{fontSize: '2.5rem', marginBottom: '10px'}}>Seda<span style={{color:'#3498db'}}>base</span></h1>
      <p style={{color:'#666', marginBottom: '20px'}}>Cloud Key Management System</p>
      <button style={st.btnPrimary} onClick={() => signInWithPopup(auth, provider)}>Login with Google</button>
    </div>
  );

  return (
    <div style={st.app}>
      {/* Sidebar Mobile */}
      <nav style={st.nav}>
        <h2 style={{margin:0, fontSize:'20px'}}>Seda<span>base</span></h2>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? st.navBtnA : st.navBtn}>Console</button>
          <button onClick={() => setActiveTab('docs')} style={activeTab === 'docs' ? st.navBtnA : st.navBtn}>API Docs</button>
        </div>
      </nav>

      <main style={{padding: '20px', maxWidth: '800px', margin: 'auto'}}>
        {activeTab === 'dashboard' ? (
          <div>
            <div style={st.card}>
              <h3>{selectedProject ? "Edit Project" : "Add New Project"}</h3>
              <form onSubmit={handleSave} style={st.formGrid}>
                <input placeholder="Project Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={st.input} />
                <input placeholder="Endpoint URL" value={form.ep} onChange={e => setForm({...form, ep: e.target.value})} style={st.input} />
                <input placeholder="API Key" value={form.key} onChange={e => setForm({...form, key: e.target.value})} style={st.input} />
                <input placeholder="Database Base" value={form.base} onChange={e => setForm({...form, base: e.target.value})} style={st.input} />
                <button type="submit" style={st.btnSave}>{selectedProject ? "Update" : "Save Project"}</button>
                {selectedProject && <button type="button" onClick={() => setSelectedProject(null)} style={st.btnCancel}>Cancel</button>}
              </form>
            </div>

            <div style={{marginTop: '20px'}}>
              <h4>Your Projects ({Object.keys(projects).length}/{userData.projectLimit})</h4>
              {Object.entries(projects).map(([id, p]) => (
                <div key={id} style={st.projectCard}>
                  <div>
                    <b>{p.name}</b><br/>
                    <small style={{color:'#888'}}>{id}</small>
                  </div>
                  <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={() => editProj(id, p)} style={st.btnEdit}>Edit</button>
                    <button onClick={() => deleteProj(id)} style={st.btnDel}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3>API Documentation</h3>
            <p style={{fontSize:'14px', color:'#666'}}>Gunakan kredensial ini untuk menghubungkan proyekmu ke aplikasi pihak ketiga.</p>
            {Object.entries(projects).map(([id, p]) => (
              <div key={id} style={st.docsCard}>
                <div style={st.docsHeader}>{p.name}</div>
                <div style={st.docsBody}>
                  <code><b>GET</b> /config/{id}</code>
                  <pre style={st.codeBox}>
{`{
  "project_id": "${id}",
  "endpoint": "${p.ep || 'none'}",
  "api_key": "${p.key || 'none'}",
  "db_base": "${p.base || 'none'}"
}`}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => signOut(auth)} style={st.btnOut}>Sign Out</button>
      </main>
    </div>
  );
}

const st = {
  app: { minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif' },
  nav: { background: '#1c1c1e', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  navBtn: { background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize:'14px' },
  navBtnA: { background: '#3498db', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize:'14px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  formGrid: { display: 'grid', gap: '10px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  btnPrimary: { padding: '12px 25px', background: '#3498db', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold' },
  btnSave: { padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { padding: '12px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  projectCard: { background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' },
  btnEdit: { background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' },
  btnDel: { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' },
  docsCard: { background: '#fff', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden', border: '1px solid #ddd' },
  docsHeader: { background: '#f1f1f1', padding: '10px 15px', fontWeight: 'bold', fontSize: '14px' },
  docsBody: { padding: '15px' },
  codeBox: { background: '#272822', color: '#f8f8f2', padding: '15px', borderRadius: '5px', fontSize: '12px', overflowX: 'auto' },
  btnOut: { width: '100%', marginTop: '30px', padding: '12px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer' }
};
