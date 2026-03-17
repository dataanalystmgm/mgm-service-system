import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nik: '',
    dept: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Buat User di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // 2. Simpan Data Tambahan ke Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        nik: formData.nik,
        dept: formData.dept,
        email: formData.email,
        role: 'USER', // Role default
        createdAt: new Date().toISOString()
      });

      alert("Akun berhasil dibuat! Silakan login.");
      router.push('/login');
    } catch (error) {
      console.error(error);
      alert("Gagal mendaftar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans selection:bg-[#9ef3c6a3]/20">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
        
        {/* Dekorasi Aksen */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#1e4890]"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00804D] opacity-5 rounded-full -mr-10 -mt-10"></div>

        <div className="mb-8">
            <h2 className="text-2xl font-black text-[#1e4890] tracking-tighter uppercase italic">Daftar Akun <span className="text-[#00804D]">MGM</span></h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Lengkapi data autentikasi internal</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nama Lengkap</label>
            <input 
                required 
                type="text" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" 
                placeholder="Nama Sesuai ID Card"
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">NIK</label>
              <input 
                required 
                type="text" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#00804D] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm placeholder:font-normal" 
                placeholder="MGMXXXX"
                onChange={(e) => setFormData({...formData, nik: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Departemen</label>
              <input 
                required 
                type="text" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#00804D] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" 
                placeholder="Contoh: Sewing"
                onChange={(e) => setFormData({...formData, dept: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Email Perusahaan</label>
            <input 
                required 
                type="email" 
                className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" 
                placeholder="email@mgm.com"
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

        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-center">
             <div className="w-8 h-1 bg-gray-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}