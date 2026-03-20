import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext'; 

export default function Home() {
  const { user } = useAuth(); 

  // Daftar NIK yang diizinkan akses SPV/Admin & Report
  const AUTHORIZED_ADMINS = ["MGM 4329", "MGM 1111"];
  const isAdminAuthorized = user && AUTHORIZED_ADMINS.includes(user.nik);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[50vh] overflow-hidden bg-gray-900">
        <Image 
          src="/assets/cover.png" 
          alt="MGM Cover" 
          fill 
          priority 
          className="object-cover opacity-60" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl">
            MGM <span className="text-[#00804D]">SERVICE</span> SYSTEM
          </h1>
          <div className="mt-4 h-1 w-24 bg-[#00804D] rounded-full shadow-lg shadow-[#00804D]/50"></div>
          <p className="mt-4 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-gray-200 bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            Mercindo Global Manufaktur 
          </p>
        </div>
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* 2. MENU NAVIGATION SECTION */}
      <div className="flex-1 flex flex-col items-center justify-start -mt-12 relative z-10 px-4 pb-20">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white max-w-6xl w-full text-center">
          <p className="text-[#1e4890] font-black uppercase text-[10px] tracking-widest mb-6 italic">
            — Silakan Pilih Akses Sesuai Peran Anda —
          </p>
          
          {/* Ubah grid-cols menjadi 4 pada md (desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* 1. USER CARD */}
            <Link href="/request" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-[#00804D] hover:shadow-xl hover:shadow-[#00804D]/10 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#00804D]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00804D] transition-colors">
                  <svg className="w-6 h-6 text-[#00804D] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="font-black text-[#00804D] uppercase italic text-sm">User / Karyawan</h2>
                <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Buat permintaan perbaikan atau pengadaan barang</p>
              </div>
            </Link>
            
            {/* 2. ADMIN CARD */}
            {isAdminAuthorized ? (
              <Link href="/admin/DashboardSPV" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-gray-900 hover:shadow-xl hover:shadow-gray-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-900 transition-colors">
                    <svg className="w-6 h-6 text-gray-900 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="font-black text-gray-900 uppercase italic text-sm">SPV / Admin</h2>
                  <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Kelola antrean laporan dan manajemen tugas PIC</p>
                </div>
              </Link>
            ) : (
              <div className="group p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl cursor-not-allowed opacity-60 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="font-black text-gray-400 uppercase italic text-sm">SPV / Admin</h2>
                  <p className="text-[8px] font-black text-red-500 mt-2 uppercase tracking-tighter bg-red-50 py-1 rounded text-center">Akses Terbatas: Khusus Supervisor</p>
                </div>
              </div>
            )}

            {/* 3. PIC CARD */}
            <Link href="/pic/DashboardPIC" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-[#1e4890] hover:shadow-xl hover:shadow-[#1e4890]/10 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#1e4890]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1e4890] transition-colors">
                  <svg className="w-6 h-6 text-[#1e4890] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-black text-[#1e4890] uppercase italic text-sm">PIC / Petugas</h2>
                <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Update progres pengerjaan dan penyelesaian tugas</p>
              </div>
            </Link>

            {/* 4. GENERAL REPORT CARD (TAMBAHAN BARU) */}
            {isAdminAuthorized ? (
              <Link href="/report" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 transition-colors">
                    <svg className="w-6 h-6 text-amber-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h2 className="font-black text-amber-600 uppercase italic text-sm">General Report</h2>
                  <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Analisa data performa layanan dalam bentuk grafik</p>
                </div>
              </Link>
            ) : (
              <div className="group p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl cursor-not-allowed opacity-60 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="font-black text-gray-400 uppercase italic text-sm">General Report</h2>
                  <p className="text-[8px] font-black text-red-500 mt-2 uppercase tracking-tighter bg-red-50 py-1 rounded text-center">Akses Terbatas</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Credit */}
        <p className="mt-12 text-[8px] font-black text-gray-400 uppercase tracking-[0.5em] italic">
          PT. Mercindo Global Manufaktur &copy; 2026
        </p>
      </div>
    </div>
  );
}