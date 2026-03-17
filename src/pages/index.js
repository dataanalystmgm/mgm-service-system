import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* 1. HERO SECTION (SETENGAH LAYAR) */}
      <div className="relative w-full h-[50vh] overflow-hidden bg-gray-900">
        <Image 
          src="/assets/cover.png" 
          alt="MGM Cover" 
          fill 
          priority 
          className="object-cover opacity-60" 
        />
        {/* Konten di Atas Gambar */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl">
            MGM <span className="text-[#00804D]">SERVICE</span> SYSTEM
          </h1>
          <div className="mt-4 h-1 w-24 bg-[#00804D] rounded-full shadow-lg shadow-[#00804D]/50"></div>
          <p className="mt-4 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-gray-200 bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            Mercindo Global Manufaktur 
          </p>
        </div>
        {/* Gradasi Halus ke arah Konten Bawah */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* 2. MENU NAVIGATION SECTION */}
      <div className="flex-1 flex flex-col items-center justify-start -mt-12 relative z-10 px-4 pb-20">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white max-w-4xl w-full text-center">
          <p className="text-[#1e4890] font-black uppercase text-[10px] tracking-widest mb-6 italic">
            — Silakan Pilih Akses Sesuai Peran Anda —
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* USER CARD */}
            <Link href="/request" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-[#00804D] hover:shadow-xl hover:shadow-[#00804D]/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#00804D]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00804D] transition-colors">
                <svg className="w-6 h-6 text-[#00804D] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="font-black text-[#00804D] uppercase italic text-sm">User / Karyawan</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Buat permintaan perbaikan atau pengadaan barang</p>
            </Link>
            
            {/* ADMIN CARD */}
            <Link href="/admin/DashboardSPV" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-gray-900 hover:shadow-xl hover:shadow-gray-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-900 transition-colors">
                <svg className="w-6 h-6 text-gray-900 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="font-black text-gray-900 uppercase italic text-sm">SPV / Admin</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Kelola antrean laporan dan manajemen tugas PIC</p>
            </Link>

            {/* PIC CARD */}
            <Link href="/pic/DashboardPIC" className="group p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-[#1e4890] hover:shadow-xl hover:shadow-[#1e4890]/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#1e4890]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1e4890] transition-colors">
                <svg className="w-6 h-6 text-[#1e4890] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-black text-[#1e4890] uppercase italic text-sm">PIC / Petugas</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-2 leading-relaxed">Update progres pengerjaan dan penyelesaian tugas</p>
            </Link>
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