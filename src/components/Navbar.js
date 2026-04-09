import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebaseConfig';
import { signOut, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State untuk Mobile Menu Toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // LOGIKA OTORISASI (Hanya NIK ini yang bisa melihat menu Admin & Report)
  const AUTHORIZED_IDS = ["MGM 4329", "MGM 10619", "MGM 063"]; // Update daftar NIK yang diizinkan akses SPV/Admin & Report
  const isAuthorizedAdmin = user && AUTHORIZED_IDS.includes(user.nik);

  // State untuk Edit Akun
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    newPassword: ''
  });

  // Jangan tampilkan navbar di halaman login
  if (router.pathname === '/login') return null;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'LOGOUT?',
      text: "Sesi Anda akan diakhiri.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'KELUAR',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: editData.name });
      
      if (editData.newPassword) {
        if (editData.newPassword.length < 6) throw new Error("Password minimal 6 karakter.");
        await updatePassword(auth.currentUser, editData.newPassword);
      }

      Swal.fire({
        icon: 'success',
        title: 'PROFIL DIPERBARUI',
        confirmButtonColor: '#00804D',
        customClass: { popup: 'rounded-[2rem]' }
      });
      setIsModalOpen(false);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'UPDATE GAGAL',
        text: error.message,
        confirmButtonColor: '#1e4890',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-4 md:gap-6">
              
              {/* MOBILE MENU BUTTON */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-gray-50 text-[#1e4890]"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
                )}
              </button>

              {/* LOGO SECTION */}
              <Link href="/" className="flex items-center gap-3 md:gap-4 group">
                <div className="relative w-24 h-10 md:w-32 md:h-12 flex items-center justify-center px-2 py-1 bg-white rounded-xl border border-gray-100 group-hover:border-[#00804D]/30 transition-all shadow-sm overflow-hidden">
                  <Image 
                    src="/assets/logo-mgm.png" 
                    alt="MGM Logo" 
                    width={150} 
                    height={50}
                    className="object-contain w-full h-full" 
                    priority={true}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-gray-900 text-xs md:text-lg tracking-tighter leading-none italic uppercase">
                    MGM <span className="text-[#00804D]">SERVICE</span>
                  </span>
                  <span className="text-[6px] md:text-[7px] font-bold text-[#1e4890] uppercase tracking-[0.2em] leading-tight">
                    Management System
                  </span>
                </div>
              </Link>
              
              {/* DESKTOP NAVIGATION */}
              <div className="hidden lg:ml-6 lg:flex lg:items-center lg:gap-1">
                <NavLink href="/" active={router.pathname === '/'}>Beranda</NavLink>
                <NavLink href="/request" active={router.pathname === '/request'}>Buat Laporan</NavLink>
                <NavLink href="/request/status" active={router.pathname === '/request/status'}>Status Saya</NavLink>
                
                {/* MENU KHUSUS ADMIN & REPORT (HIDDEN JIKA BUKAN MGM 4329/1111) */}
                {isAuthorizedAdmin && (
                  <>
                    <NavLink href="/admin/DashboardSPV" active={router.pathname === '/admin/DashboardSPV'}>Dashboard SPV</NavLink>
                    <NavLink href="/report" active={router.pathname === '/report'}>General Report</NavLink>
                  </>
                )}
                
                <NavLink href="/pic/DashboardPIC" active={router.pathname === '/pic/DashboardPIC'}>Tugas PIC</NavLink>
              </div>
            </div>

            {/* USER PROFILE & LOGOUT */}
            <div className="flex items-center gap-2 md:gap-3">
              {user ? (
                <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 pl-3 md:pl-4 pr-2 py-1.5 rounded-2xl border border-gray-100">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-gray-900 leading-none uppercase italic">{user.name}</p>
                    <p className="text-[8px] font-bold text-[#00804D] uppercase tracking-tighter">
                      {user.role} <span className="text-gray-300">•</span> {user.dept}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setEditData({ name: user?.name, newPassword: '' });
                      setIsModalOpen(true);
                    }}
                    className="h-8 w-8 md:h-9 md:w-9 bg-[#1e4890] rounded-xl flex items-center justify-center text-white font-black text-xs italic border-2 border-white shadow-md hover:bg-[#00804D] transition-all"
                  >
                    {user?.name?.charAt(0)}
                  </button>

                  <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              ) : (
                <Link href="/login" className="px-4 py-2 bg-[#00804D] text-white text-[9px] font-black rounded-xl uppercase italic">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out border-t border-gray-50 bg-white overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pt-4 pb-6 space-y-2">
            <MobileNavLink href="/" onClick={() => setIsMobileMenuOpen(false)} active={router.pathname === '/'}>Beranda</MobileNavLink>
            <MobileNavLink href="/request" onClick={() => setIsMobileMenuOpen(false)} active={router.pathname === '/request'}>Buat Laporan</MobileNavLink>
            <MobileNavLink href="/request/status" onClick={() => setIsMobileMenuOpen(false)} active={router.pathname === '/request/status'}>Status Saya</MobileNavLink>
            
            {/* PROTEKSI DI MOBILE MENU */}
            {isAuthorizedAdmin && (
              <>
                <MobileNavLink href="/admin/DashboardSPV" onClick={() => setIsMobileMenuOpen(false)} active={router.pathname === '/admin/DashboardSPV'}>Dashboard SPV</MobileNavLink>
                <MobileNavLink href="/report" onClick={() => setIsMobileMenuOpen(false)} active={router.pathname === '/report'}>General Report</MobileNavLink>
              </>
            )}
            
            <MobileNavLink href="/pic/DashboardPIC" onClick={() => setIsMobileMenuOpen(false)} active={router.pathname === '/pic/DashboardPIC'}>Tugas PIC</MobileNavLink>
          </div>
        </div>
      </nav>

      {/* MODAL EDIT AKUN (Sama seperti sebelumnya) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-[#1e4890] p-6 text-white flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-black uppercase italic tracking-tight text-sm">Pengaturan Profil</h3>
                <span className="text-[8px] font-bold text-[#00804D] uppercase tracking-widest">Internal User Security</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">ID Karyawan</label>
                <input type="text" value={user?.nik || ''} readOnly className="w-full p-4 bg-gray-100 rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed italic border-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nama Lengkap</label>
                <input required type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#00804D] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Password Baru</label>
                <input type="password" placeholder="Kosongkan jika tetap" value={editData.newPassword} onChange={(e) => setEditData({...editData, newPassword: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#1e4890] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-gray-400 border-2 border-gray-100 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isUpdating} className="flex-1 py-4 bg-[#00804D] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic shadow-lg hover:bg-[#1e4890] transition-all">
                  {isUpdating ? 'MENYIMPAN...' : 'SIMPAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Sub-Komponen Link Desktop
function NavLink({ href, children, active }) {
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
        active 
          ? 'bg-[#00804D] text-white shadow-md' 
          : 'text-gray-500 hover:bg-[#1e4890]/5 hover:text-[#1e4890]'
      }`}
    >
      {children}
    </Link>
  );
}

// Sub-Komponen Link Mobile
function MobileNavLink({ href, children, active, onClick }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`block px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-[#00804D] text-white italic' 
          : 'bg-gray-50 text-gray-500 hover:bg-[#1e4890]/5'
      }`}
    >
      {children}
    </Link>
  );
}