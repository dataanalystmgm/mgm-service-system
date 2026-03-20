import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, onSnapshot, arrayUnion } from 'firebase/firestore'; // Ubah updateDoc jadi setDoc
import { useRouter } from 'next/router';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nik: '',
    dept: ''
  });
  
  const [departments, setDepartments] = useState([]);
  const [showNewDeptInput, setShowNewDeptInput] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const signNotify = {
    error: (msg) => {
      Swal.fire({
        icon: 'error',
        title: '<span class="text-lg font-black italic uppercase text-[#dc2626]">GAGAL</span>',
        text: msg,
        confirmButtonColor: '#dc2626',
        customClass: { popup: 'rounded-[2.5rem]' }
      });
    },
    success: (msg) => {
      Swal.fire({
        icon: 'success',
        title: '<span class="text-lg font-black italic uppercase text-[#00804D]">BERHASIL</span>',
        text: msg,
        confirmButtonColor: '#00804D',
        customClass: { popup: 'rounded-[2.5rem]' }
      });
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "lists"), (docSnap) => {
      if (docSnap.exists()) {
        setDepartments(docSnap.data().departments || []);
      }
    });
    return () => unsub();
  }, []);

  const handleAddNewDept = async () => {
    if (!newDeptName) {
      setShowNewDeptInput(false);
      return;
    }
    try {
      const formattedDept = newDeptName.trim().toUpperCase();
      const docRef = doc(db, "settings", "lists");
      
      // Menggunakan setDoc + merge agar membuat doc otomatis jika belum ada
      await setDoc(docRef, {
        departments: arrayUnion(formattedDept)
      }, { merge: true });

      setFormData({ ...formData, dept: formattedDept });
      setNewDeptName('');
      setShowNewDeptInput(false);
    } catch (err) {
      console.error(err);
      signNotify.error("Gagal menambah departemen. Cek koneksi atau Rules Firestore.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formData.dept) return signNotify.error("Pilih Departemen terlebih dahulu.");
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name.toUpperCase(),
        nik: formData.nik.toUpperCase(),
        dept: formData.dept,
        email: formData.email,
        role: 'USER', 
        createdAt: new Date().toISOString()
      });

      await signNotify.success("Akun MGM berhasil dibuat!");
      router.push('/login');
    } catch (error) {
      signNotify.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans selection:bg-[#9ef3c6a3]/20">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#1e4890]"></div>

        <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-black text-[#1e4890] tracking-tighter uppercase italic">Daftar Akun <span className="text-[#00804D]">MGM</span></h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Lengkapi data autentikasi internal</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nama Lengkap</label>
            <input 
                required type="text" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm uppercase" 
                placeholder="NAMA SESUAI ID CARD"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">NIK</label>
              <input 
                required type="text" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#00804D] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm uppercase" 
                placeholder="MGMXXXX"
                value={formData.nik}
                onChange={(e) => setFormData({...formData, nik: e.target.value})} 
              />
            </div>
            
            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Departemen</label>
              <div className="h-[52px]">
                {!showNewDeptInput ? (
                  <select 
                    required
                    className="w-full h-full px-3.5 bg-gray-50 border-2 border-transparent focus:border-[#00804D] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                    value={formData.dept}
                    onChange={(e) => e.target.value === "ADD_NEW" ? setShowNewDeptInput(true) : setFormData({...formData, dept: e.target.value})}
                  >
                    <option value="">Pilih...</option>
                    {departments.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                    <option value="ADD_NEW" className="text-[#1e4890] font-black">+ TAMBAH BARU</option>
                  </select>
                ) : (
                  <div className="relative h-full flex items-center">
                    <input 
                      type="text"
                      className="w-full h-full px-3.5 pr-12 bg-white border-2 border-[#1e4890] rounded-2xl outline-none font-bold text-sm uppercase placeholder:text-[9px]"
                      placeholder="DEPT BARU..."
                      autoFocus
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      onBlur={handleAddNewDept}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewDept())}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewDeptInput(false)}
                      className="absolute right-3 text-[#dc2626] font-black text-xs"
                    >✕</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Email Perusahaan</label>
            <input 
                required type="email" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" 
                placeholder="nama@mgm.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
            <div className="relative">
                <input 
                    required 
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm pr-12" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#00804D] transition-colors focus:outline-none"
                >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 014.132-5.411m0 0L4 4m5.352 5.352a3 3 0 004.293 4.293M15 15l3.5 3.5M21.542 12c-1.274 4.057-5.064 7-9.542 7-1.077 0-2.106-.17-3.062-.486M9 9a3 3 0 015.391 1.743M20 4l-4 4" />
                      </svg>
                    )}
                </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading} 
            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all italic mt-4 ${
                loading ? 'bg-gray-200 text-gray-400' : 'bg-[#00804D] text-white hover:bg-[#1e4890] hover:scale-[1.02] active:scale-[0.98] shadow-[#00804D]/20'
            }`}
          >
            {loading ? "MEMPROSES DATA..." : "DAFTAR SEKARANG"}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          Sudah punya akun? <Link href="/login" className="text-[#1e4890] border-b-2 border-[#00804D] pb-0.5 ml-1 hover:text-[#00804D] transition-all">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}