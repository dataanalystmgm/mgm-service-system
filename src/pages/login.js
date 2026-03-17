import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role; 

        if (role === 'SPV') {
          router.push('/admin/DashboardSPV');
        } else if (role === 'PIC') {
          router.push('/pic/DashboardPIC');
        } else {
          router.push('/');
        }
      } else {
        alert("Data profil tidak ditemukan di database.");
      }
    } catch (error) {
      console.error(error);
      alert("Login Gagal: Email atau Password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans selection:bg-[#9ef3c6a3]/20">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* HEADER - CORPORATE BLUE WITH GREEN ACCENT */}
        <div className="bg-[#9ef3c6a3] p-10 text-center relative overflow-hidden">
          <h2 className="text-[10px] font-black text-[#00804D] uppercase tracking-[0.4em] mb-4 italic">MGM Service System</h2>
            <Image 
              src="/assets/logo-mgm.png"
              alt="MGM Logo"
              width={180} 
              height={60} 
              priority={true}
              className='mx-auto brightness-0 invert' // Membuat logo menjadi putih agar kontras dengan biru
            />
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Email Perusahaan</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
              placeholder="nama@mgm.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all pr-14"
                placeholder="••••••••"
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#00804D] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88L14.12 14.12" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><path d="M13 3.37a9 9 0 0 1 8.94 8.63" /><path d="M10.32 4.17A9 9 0 0 1 12 4c7 0 10 7 10 7a13.12 13.12 0 0 1-1.58 2.58" /><path d="M15.42 15.42A9 9 0 0 1 12 20c-7 0-10-7-10-7a13.12 13.12 0 0 1 1.58-2.58" /><path d="M22 22l-20-20" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all italic ${
              loading ? 'bg-gray-200 text-gray-400' : 'bg-[#00804D] text-white hover:bg-[#1e4890] hover:scale-[1.02] active:scale-[0.98] shadow-[#00804D]/20'
            }`}
          >
            {loading ? "MENGOTENTIKASI..." : "MASUK KE SISTEM"}
          </button>

          <div className="text-center mt-6">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              Belum punya akses?{" "}
              <Link href="/signup" className="text-[#1e4890] font-black border-b-2 border-[#00804D] pb-0.5 hover:text-[#00804D] transition-colors">
                Minta Akun / Daftar
              </Link>
            </p>
          </div>
        </form>

        <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">
            Authorized Personnel Only<br/>
            <span className="text-[#1e4890]/40">PT. Mercindo Global Manufaktur</span>
          </p>
        </div>
      </div>
    </div>
  );
}