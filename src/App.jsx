import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// --- KREDENSIAL SEDABASE ---
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
  const [payment, setPayment] = useState(null);
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

  const handleUpgrade = async () => {
    const res = await fetch(`https://bior-beta.vercel.app/api/pay?key=rapay_jur337mgb&amt=1000`);
    const data = await res.json();
    if (data.success) {
      setPayment(data);
      const checker = setInterval(async () => {
        const r = await fetch(`https://bior-beta.vercel.app/api/pay?action=check&trxId=${data.trxId}`);
        const d = await r.json();
        if (d.paid) {
          clearInterval(checker);
          update(ref(db, `users/${user.uid}/profile`), { isPremium: true, projectLimit: 20 });
          setPayment(null);
          alert("Upgrade Sukses! Slot jadi 20.");
        }
      }, 5000);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (Object.keys(projects).length >= userData.projectLimit) return alert("Limit Penuh!");
    const id = Date.now();
    set(ref(db, `users/${user.uid}/projects/${id}`), form).then(() => {
      alert("Project Tersimpan!");
      setForm({ name: '', ep: '', key: '', base: '', seda: '' });
    });
  };

  if (!user) return (
    <div style={st.login}>
      <h1>Seda<span>base</span></h1>
      <button onClick={() => signInWithPopup(auth, provider)}>Login via Google</button>
    </div>
  );

  return (
    <div style={st.app}>
      <header style={st.header}>
        <h2>Sedabase</h2>
        <p>Limit: {Object.keys(projects).length}/{userData.projectLimit}</p>
        {!userData.isPremium && <button onClick={handleUpgrade} style={st.btnUp}>Upgrade Rp1.000</button>}
      </header>

      {payment && (
        <div style={st.modal}>
          <div style={st.modalC}>
            <h3>Scan QRIS</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${payment.qr}`} alt="QR" />
            <button onClick={() => setPayment(null)}>Batal</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={st.form}>
        <input placeholder="Project Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <input placeholder="API Key" value={form.key} onChange={e => setForm({...form, key: e.target.value})} />
        <button type="submit">Add Project</button>
      </form>

      <div style={st.list}>
        {Object.entries(projects).map(([id, p]) => (
          <div key={id} style={st.card}><b>{p.name}</b></div>
        ))}
      </div>
      
      <button onClick={() => signOut(auth)} style={st.btnOut}>Logout</button>
    </div>
  );
}

// Inline Style minimalis biar gak banyak file CSS
const st = {
  login: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' },
  app: { padding: '20px', fontFamily: 'sans-serif', background: '#f4f4f4', minHeight: '100vh' },
  header: { background: '#1c1c1e', color: '#fff', padding: '15px', borderRadius: '10px' },
  btnUp: { background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  form: { background: '#fff', padding: '20px', borderRadius: '10px', marginTop: '20px', display: 'grid', gap: '10px' },
  list: { marginTop: '20px' },
  card: { background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '5px solid #3498db' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalC: { background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center' },
  btnOut: { marginTop: '20px', background: '#e74c3c', color: '#fff', border: 'none', padding: '10px', width: '100%', borderRadius: '5px' }
};
