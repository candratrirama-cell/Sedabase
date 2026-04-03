import { useState, useEffect } from 'react'
import { initializeApp } from "firebase/app"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"
import { getDatabase, ref, onValue, update, increment, set } from "firebase/database"

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
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [saldo, setSaldo] = useState(0);
  const [depoAmt, setDepoAmt] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [wd, setWd] = useState({ wallet: "DANA", target: "", amount: "" });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) onValue(ref(db, `users/${u.uid}/saldo`), (s) => setSaldo(s.val() || 0));
    });
  }, []);

  const handleWithdraw = async () => {
    const total = parseInt(wd.amount) + 1000;
    if (wd.amount < 10000 || saldo < total) return alert("Cek Saldo/Minimal 10k");
    const id = "PAY" + Math.random().toString(36).substring(7).toUpperCase();
    await update(ref(db, `users/${user.uid}`), { saldo: increment(-total) });
    await set(ref(db, `withdrawals/${id}`), { ...wd, uid: user.uid, status: "pending", time: Date.now() });
    alert(`Request ${id} Terkirim!`);
  };

  if (!user) return (
    <div className="h-screen flex items-center justify-center p-6">
      <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_black] text-center w-full max-w-xs">
        <h1 className="text-3xl font-black italic mb-6">SEDABASE</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-white border-4 border-black p-3 font-black uppercase shadow-[4px_4px_0px_black] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">Login Google</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <header className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_black] flex justify-between items-center">
        <h1 className="font-black italic">SEDABASE</h1>
        <button onClick={() => signOut(auth)} className="text-[10px] font-bold border-2 border-black px-2 py-1 bg-red-400">LOGOUT</button>
      </header>

      <div className="bg-green-400 p-6 border-4 border-black shadow-[6px_6px_0px_black]">
        <p className="text-xs font-bold uppercase">Saldo:</p>
        <h2 className="text-4xl font-black">Rp {saldo.toLocaleString('id-ID')}</h2>
      </div>

      <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_black]">
        <h3 className="font-black mb-4 uppercase underline">Deposit</h3>
        <input type="number" value={depoAmt} onChange={e => setDepoAmt(e.target.value)} placeholder="Min 1000" className="w-full p-2 border-4 border-black font-bold mb-3" />
        <button onClick={() => setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SEDABASE-${depoAmt}`)} className="w-full bg-blue-500 p-3 font-black uppercase border-4 border-black shadow-[4px_4px_0px_black] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">Top Up</button>
        {qrCode && <img src={qrCode} className="mt-4 mx-auto border-4 border-black p-1" />}
      </div>

      <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_black]">
        <h3 className="font-black mb-4 uppercase underline text-red-600">Withdraw</h3>
        <select value={wd.wallet} onChange={e => setWd({...wd, wallet: e.target.value})} className="w-full p-2 border-4 border-black font-bold mb-2">
          <option>DANA</option><option>GOPAY</option>
        </select>
        <input type="text" placeholder="Nomor" onChange={e => setWd({...wd, target: e.target.value})} className="w-full p-2 border-4 border-black font-bold mb-2" />
        <input type="number" placeholder="Min 10000" onChange={e => setWd({...wd, amount: e.target.value})} className="w-full p-2 border-4 border-black font-bold mb-2" />
        <p className="text-[10px] font-bold mb-3 italic">Admin Rp 1.000 | Proses Maks 120 Jam</p>
        <button onClick={handleWithdraw} className="w-full bg-red-500 p-3 font-black uppercase border-4 border-black shadow-[4px_4px_0px_black] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">Tarik Dana</button>
      </div>
    </div>
  );
}
