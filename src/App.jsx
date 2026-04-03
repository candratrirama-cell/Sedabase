import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// --- CONFIG FIREBASE ---
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projectName, setProjectName] = useState('');

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

  const createProject = (e) => {
    e.preventDefault();
    if (Object.keys(projects).length >= userData.projectLimit) return alert("Limit Penuh! Upgrade ke Premium.");
    
    // LOGIKA OTOMATIS: Membuat data tanpa input user
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const slug = projectName.toLowerCase().replace(/\s+/g, '-');
    const newId = `${slug}-${shortId}`;

    const autoData = {
      name: projectName,
      project_id: newId,
      endpoint: `https://api.sedabase.vercel.app/v1/${newId}`,
      apikey: `sb_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      sedabase: `db_${newId}`,
      created_at: new Date().toISOString()
    };

    set(ref(db, `users/${user.uid}/projects/${newId}`), autoData).then(() => {
      alert("Proyek Berhasil Dibuat Otomatis!");
      setProjectName('');
    });
  };

  const deleteProj = (id) => {
    if(confirm("Hapus proyek ini?")) remove(ref(db, `users/${user.uid}/projects/${id}`));
  };

  if (!user) return (
    <div style={st.center}>
      <h1 style={{fontSize: '2.8rem', margin: 0}}>Seda<span style={{color:'#3498db'}}>base</span></h1>
      <p style={{color:'#7f8c8d', marginBottom: '30px'}}>Automatic Key Provisioning</p>
      <button style={st.btnPrimary} onClick={() => signInWithPopup(auth, provider)}>Get Started with Google</button>
    </div>
  );

  return (
    <div style={st.app}>
      <nav style={st.nav}>
        <h2 style={{margin:0}}>Seda<span>base</span></h2>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? st.navBtnA : st.navBtn}>Console</button>
          <button onClick={() => setActiveTab('docs')} style={activeTab === 'docs' ? st.navBtnA : st.navBtn}>API Docs</button>
        </div>
      </nav>

      <main style={{padding: '20px', maxWidth: '600px', margin: 'auto'}}>
        {activeTab === 'dashboard' ? (
          <div>
            <div style={st.card}>
              <h3 style={{marginTop:0}}>New Project</h3>
              <form onSubmit={createProject}>
                <input 
                  placeholder="Masukkan Nama Project Saja..." 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value)} 
                  required 
                  style={st.input} 
                />
                <button type="submit" style={st.btnSave}>Create & Generate Keys</button>
              </form>
            </div>

            <div style={{marginTop: '30px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h4>Projects ({Object.keys(projects).length}/{userData.projectLimit})</h4>
                {!userData.isPremium && <button style={st.badgePrem}>Free Plan</button>}
              </div>
              
              {Object.entries(projects).map(([id, p]) => (
                <div key={id} style={st.projectCard}>
                  <div>
                    <b style={{fontSize:'16px'}}>{p.name}</b><br/>
                    <code style={{fontSize:'10px', color:'#3498db'}}>{id}</code>
                  </div>
                  <button onClick={() => deleteProj(id)} style={st.btnDel}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3>API Reference</h3>
            {Object.entries(projects).map(([id, p]) => (
              <div key={id} style={st.docsCard}>
                <div style={st.docsHeader}>{p.name}</div>
                <div style={st.docsBody}>
                   <p style={st.label}>Endpoint URL</p>
                   <code style={st.val}>{p.endpoint}</code>
                   
                   <p style={st.label}>X-API-KEY</p>
                   <code style={st.val}>{p.apikey}</code>

                   <p style={st.label}>Sedabase ID</p>
                   <code style={st.val}>{p.sedabase}</code>
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
  app: { minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, sans-serif' },
  nav: { background: '#111827', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  navBtn: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontWeight: '500' },
  navBtnA: { background: '#3b82f6', border: 'none', color: 'white', padding: '6px 15px', borderRadius: '20px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  card: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '15px', boxSizing: 'border-box', fontSize:'16px' },
  btnPrimary: { padding: '14px 30px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize:'16px' },
  btnSave: { width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  projectCard: { background: 'white', padding: '15px 20px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f3f4f6' },
  btnDel: { background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' },
  docsCard: { background: '#fff', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  docsHeader: { background: '#f9fafb', padding: '12px 15px', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb' },
  docsBody: { padding: '15px' },
  label: { margin: '10px 0 5px', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' },
  val: { display: 'block', background: '#f3f4f6', padding: '10px', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all', color: '#1f2937' },
  badgePrem: { background: '#dcfce7', color: '#15803d', border: 'none', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' },
  btnOut: { width: '100%', marginTop: '40px', padding: '12px', background: 'none', border: '1px solid #d1d5db', color: '#6b7280', borderRadius: '10px', cursor: 'pointer' }
};
