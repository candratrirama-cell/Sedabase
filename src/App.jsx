import { useState, useEffect } from 'react'
import { initializeApp } from "firebase/app"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, onValue } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyD1OHn2utYY881b504XEgMAwmhrglqtinQ",
  authDomain: "sedabase.firebaseapp.com",
  databaseURL: "https://sedabase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sedabase",
  storageBucket: "sedabase.firebasestorage.app",
  messagingSenderId: "921144451877",
  appId: "1:921144451877:web:f37ec5e4de4ff4fc4870cc"
};

// Inisialisasi di luar komponen agar tidak berulang
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }, (err) => {
        setErrorMsg("Auth Error: " + err.message);
      });
      return () => unsub();
    } catch (e) {
      setErrorMsg("Init Error: " + e.message);
    }
  }, []);

  if (errorMsg) return (
    <div className="h-screen bg-red-500 text-white p-10 font-bold">
      <p>WADUH ERROR:</p>
      <pre>{errorMsg}</pre>
    </div>
  );

  if (loading) return (
    <div className="h-screen bg-yellow-400 flex items-center justify-center font-black">
      <p className="animate-pulse">SEDABASE LOADING...</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-yellow-400 flex items-center justify-center p-6">
      <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_black] text-center w-full max-w-xs">
        <h1 className="text-3xl font-black italic mb-6 uppercase">Sedabase</h1>
        <button 
          onClick={() => signInWithPopup(auth, provider).catch(e => setErrorMsg(e.message))} 
          className="w-full bg-white border-4 border-black p-3 font-black uppercase shadow-[4px_4px_0px_black] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
        >
          Login Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-yellow-400 min-h-screen font-mono">
       <h1 className="font-black">HALO, {user.displayName}</h1>
       {/* Sisipkan sisa UI Dashboard di sini */}
    </div>
  );
}
