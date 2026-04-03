import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// --- KONFIGURASI FIREBASE ---
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
  const [profile, setProfile] = useState({ isPremium: false, limit: 5 });
  const [projects, setProjects] = useState({});
  const [view, setView] = useState('home'); // home | docs | explorer
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Sync Profile & Limits
        onValue(ref(db, `users/${u.uid}/profile`), (s) => {
          setProfile(s.val() || { isPremium: false, limit: 5 });
        });
        // Sync Projects
        onValue(ref(db, `users/${u.uid}/projects`), (s) => {
          setProjects(s.val() || {});
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const createProject = (name) => {
    if (Object.keys(projects).length >= profile.limit) return alert("Limit tercapai!");
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const projectId = `${slug}-${id}`;

    const newProject = {
        name,
        projectId,
        apiKey: `sb_key_${Math.random().toString(36).substring(2, 15)}`,
        endpoint: `https://sedabase.vercel.app/${projectId}`,
        createdAt: new Date().toISOString()
    };

    set(ref(db, `users/${user.uid}/projects/${projectId}`), newProject);
  };

  if (loading) return <div style={st.center}>Memuat Sedabase...</div>;

  if (!user) return (
    <div style={st.center}>
      <h1 style={st.logo}>Seda<span style={{color:'#3b82f6'}}>base</span></h1>
      <p style={{marginBottom:'20px', color:'#666'}}>The Future of Mobile Database PaaS</p>
      <button style={st.btnAuth} onClick={() => signInWithPopup(auth, provider)}>Sign in with Google</button>
    </div>
  );

  return (
    <div style={st.app}>
      {/* NAVBAR */}
      <nav style={st.nav}>
        <h2 style={{fontSize:'18px'}}>Sedabase</h2>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={() => setView('home')} style={view === 'home' ? st.navA : st.navI}>Projects</button>
          <button onClick={() => setView('docs')} style={view === 'docs' ? st.navA : st.navI}>API</button>
        </div>
      </nav>

      {/* CONTENT */}
      <main style={st.main}>
        {view === 'home' ? (
          <div>
            <div style={st.card}>
                <h4 style={{marginBottom:'10px'}}>Quick Create</h4>
                <div style={{display:'flex', gap:'10px'}}>
                    <input id="pname" placeholder="Project Name..." style={st.input} />
                    <button style={st.btnCreate} onClick={() => {
                        const val = document.getElementById('pname').value;
                        if(val) createProject(val);
                    }}>Generate</button>
                </div>
            </div>

            <h4 style={{margin:'20px 0 10px'}}>Your Infrastructure ({Object.keys(projects).length}/{profile.limit})</h4>
            {Object.entries(projects).map(([id, p]) => (
                <div key={id} style={st.projCard}>
                    <div>
                        <div style={{fontWeight:'bold'}}>{p.name}</div>
                        <code style={{fontSize:'10px', color:'#3b82f6'}}>{p.projectId}</code>
                    </div>
                    <button onClick={() => remove(ref(db, `users/${user.uid}/projects/${id}`))} style={st.btnDel}>✕</button>
                </div>
            ))}
          </div>
        ) : (
          <div>
            <h3 style={{marginBottom:'15px'}}>API Credentials</h3>
            {Object.entries(projects).map(([id, p]) => (
                <div key={id} style={st.docsCard}>
                    <div style={st.docsHead}>{p.name}</div>
                    <div style={st.docsBody}>
                        <label style={st.label}>ENDPOINT</label>
                        <code style={st.code}>{p.endpoint}</code>
                        <label style={st.label}>X-API-KEY</label>
                        <code style={st.code}>{p.apiKey}</code>
                    </div>
                </div>
            ))}
          </div>
        )}
      </main>

      <footer style={st.footer}>
          <button onClick={() => signOut(auth)} style={st.btnOut}>Logout {user.displayName}</button>
      </footer>
    </div>
  );
}

const st = {
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' },
  logo: { fontSize: '40px', fontWeight: 'bold', margin: 0 },
  btnAuth: { padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold' },
  app: { background: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { background: '#111827', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position:'sticky', top:0 },
  navI: { background: 'none', border: 'none', color: '#9ca3af', fontSize:'14px' },
  navA: { background: '#3b82f6', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize:'14px' },
  main: { padding: '20px', maxWidth: '600px', margin: 'auto' },
  card: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize:'14px' },
  btnCreate: { background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold' },
  projCard: { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb' },
  btnDel: { background: '#fee2e2', color: '#ef4444', border: 'none', width: '25px', height: '25px', borderRadius: '50%' },
  docsCard: { background: '#fff', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden', border: '1px solid #ddd' },
  docsHead: { background: '#f9fafb', padding: '10px 15px', fontWeight: 'bold', borderBottom: '1px solid #eee' },
  docsBody: { padding: '15px' },
  label: { fontSize: '10px', color: '#6b7280', display: 'block', marginTop: '10px' },
  code: { display: 'block', background: '#f3f4f6', padding: '8px', borderRadius: '5px', fontSize: '11px', wordBreak: 'break-all', marginTop: '5px' },
  footer: { padding: '20px', textAlign: 'center' },
  btnOut: { background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', textDecoration: 'underline' }
};
