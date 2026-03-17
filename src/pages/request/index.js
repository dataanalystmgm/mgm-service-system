import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { db } from '@/lib/firebaseConfig';
import { uploadToDrive } from '@/lib/uploadFile';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2'; 

// Definisi Admin secara terpusat
const ALLOWED_ADMINS = ["MGM 4329", "MGM 1111"];

// --- HELPER UNTUK NOTIFIKASI MGM STYLE (UPDATED COLORS) ---
const mgmNotify = {
  success: (msg) => {
    return Swal.fire({
      icon: 'success',
      title: '<span class="font-black italic tracking-tighter" style="color:#00804D">BERHASIL</span>',
      text: msg,
      confirmButtonColor: '#00804D',
      customClass: {
        popup: 'rounded-[2rem] border-b-8 border-[#00804D] shadow-2xl',
        confirmButton: 'rounded-xl font-black px-8 py-3 uppercase text-[10px] tracking-widest'
      }
    });
  },
  error: (msg) => {
    Swal.fire({
      icon: 'error',
      title: '<span class="text-red-600">GAGAL KIRIM</span>',
      text: msg,
      confirmButtonColor: '#1e4890',
      customClass: { popup: 'rounded-[2rem]' }
    });
  },
  loading: (msg) => {
    Swal.fire({
      title: msg,
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
      customClass: { popup: 'rounded-[2rem]' }
    });
  }
};

export default function RequestForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = ALLOWED_ADMINS.includes(user?.nik);

  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    bagian: '',
    keperluan: 'perbaikan',
    tipe: '',
    deskripsi: '',
    deadline: '',
    areaSpesifik: '', 
    idMesin: '',      
    prioritas: 'tidak mendesak'
  });

  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMachineRelated = formData.tipe.toLowerCase().includes('mesin') || 
                           formData.tipe.toLowerCase().includes('cutter') ||
                           newType.toLowerCase().includes('mesin');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        nama: user.name || '',
        nik: user.nik || '',
        bagian: user.dept || ''
      }));
    }

    const fetchTypes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "types"));
        setTypes(querySnapshot.docs.map(doc => doc.data().name));
      } catch (error) {
        console.error("Gagal mengambil data tipe:", error);
      }
    };
    fetchTypes();
  }, [user, authLoading, router]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    mgmNotify.loading("Mengunggah data ke server...");
    setIsSubmitting(true);

    try {
      let finalType = formData.tipe;
      if (formData.tipe === 'Lainnya' && newType) {
        await addDoc(collection(db, "types"), { name: newType });
        finalType = newType;
      }

      let googleDriveUrl = "";
      if (file) {
        googleDriveUrl = await uploadToDrive(file);
      }

      const initialLog = {
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedBy: user.name,
        message: "Permintaan dibuat oleh user"
      };

      await addDoc(collection(db, "requests"), {
        ...formData,
        tipe: finalType,
        idMesin: isMachineRelated ? formData.idMesin : "", 
        fotoUrl: googleDriveUrl,
        status: 'pending',
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        logs: [initialLog],
        targetSelesai: formData.deadline 
      });

      await mgmNotify.success("Laporan Anda berhasil dikirim ke Control Center MGM!");
      router.push('/request/status');
    } catch (error) {
      console.error("Error submitting request:", error);
      mgmNotify.error("Terjadi masalah saat mengirim. Cek koneksi Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-1 bg-gray-200 overflow-hidden mb-4 rounded-full">
          <div className="w-full h-full bg-[#00804D] animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">MGM.OS LOADING</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-10 p-4 font-sans selection:bg-[#00804D]/10">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-[#1e4890]/5">
        
        {/* HEADER - CORPORATE BLUE BASE */}
        <div className="bg-[#9ef3c6a3] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00804D] opacity-10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">MGM Service<br/><span className="text-[#00804D]">Request</span></h1>
              <p className="text-black/50 text-[10px] font-bold tracking-[0.3em] mt-3 uppercase">Asset Management System</p>
            </div>
            {isAuthorized && (
              <div className="bg-[#00804D] px-4 py-2 rounded-full shadow-lg shadow-black/20 border border-white/20">
                <span className="text-[9px] font-black tracking-widest uppercase italic">Admin Active</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner group transition-all hover:bg-white hover:border-[#1e4890]/20">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">User Pemohon</label>
              <p className="text-sm font-bold text-gray-800">{formData.nama}</p>
              <p className="text-[10px] text-[#1e4890] font-black italic mt-1">{formData.nik}</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner group transition-all hover:bg-white hover:border-[#00804D]/20">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Departemen</label>
              <p className="text-sm font-bold text-gray-800">{formData.bagian}</p>
              <div className="w-4 h-1 bg-[#00804D] mt-2 rounded-full"></div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Detail Permintaan</h2>
                <div className="h-px bg-gray-100 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Jenis Keperluan</label>
                <select 
                  value={formData.keperluan} 
                  onChange={(e) => setFormData({...formData, keperluan: e.target.value})}
                  className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#1e4890] outline-none transition-all shadow-sm"
                >
                  <option value="perbaikan">Perbaikan Kerusakan</option>
                  <option value="pengadaan">Pengadaan Barang Baru</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Tipe Barang / Mesin</label>
                <select 
                  required 
                  value={formData.tipe} 
                  onChange={(e) => setFormData({...formData, tipe: e.target.value, idMesin: ''})} 
                  className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#1e4890] outline-none transition-all shadow-sm"
                >
                  <option value="">Pilih Tipe</option>
                  {types.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  <option value="Lainnya" className="font-black text-[#00804D] italic">+ Tambah Tipe Baru</option>
                </select>
              </div>
            </div>

            {formData.tipe === 'Lainnya' && (
              <div className="bg-[#00804D]/5 p-6 rounded-[2rem] border-2 border-[#00804D]/20 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-[#00804D] uppercase italic tracking-widest mb-2 block">Input Nama Tipe Baru</label>
                <input 
                  type="text" 
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-[#00804D] outline-none py-2 text-sm font-black text-[#1e4890] placeholder:text-gray-300"
                  placeholder="Ketik nama tipe di sini..."
                />
              </div>
            )}

            {isMachineRelated && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[11px] font-black text-[#00804D] uppercase tracking-widest">ID Mesin / No. Asset</label>
                <input 
                  required
                  type="text"
                  value={formData.idMesin}
                  onChange={(e) => setFormData({...formData, idMesin: e.target.value.toUpperCase()})}
                  className="w-full p-4 bg-[#00804D]/5 border-2 border-[#00804D]/10 rounded-2xl text-sm font-black text-[#00804D] focus:border-[#00804D] outline-none placeholder:text-[#00804D]/20"
                  placeholder="CONTOH: MAC-SEW-01"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Area Spesifik (Lokasi)</label>
              <input 
                required
                type="text"
                value={formData.areaSpesifik}
                onChange={(e) => setFormData({...formData, areaSpesifik: e.target.value})}
                className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#1e4890] outline-none transition-all shadow-sm"
                placeholder="Line 15, Gedung A Lantai 2, Area Packing"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Lampiran Foto Lapangan</label>
              <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 group hover:border-[#00804D]/50 transition-colors">
                <div className="relative w-24 h-24 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Pilih Gambar Masalah</p>
                    <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-[#1e4890] file:text-white hover:file:bg-[#00804D] cursor-pointer"
                    />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Deskripsi Masalah</label>
              <textarea 
                required 
                rows="4" 
                value={formData.deskripsi} 
                onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                className="w-full p-5 bg-white border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-[#00804D] transition-all outline-none resize-none shadow-sm"
                placeholder="Berikan rincian kendala..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Target Selesai</label>
                <input 
                  required 
                  type="datetime-local"
                  value={formData.deadline} 
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#00804D] outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1e4890] uppercase tracking-tighter">Tingkat Prioritas</label>
                <div className="flex gap-2">
                  {['tidak mendesak', 'mendesak'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, prioritas: p})}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        formData.prioritas === p 
                          ? 'bg-[#00804D] border-[#00804D] text-white shadow-lg shadow-[#00804D]/20' 
                          : 'border-gray-100 bg-gray-50 text-gray-300 hover:border-[#1e4890]/30'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl italic ${
              isSubmitting 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-[#00804D] text-white hover:bg-[#1e4890] hover:scale-[1.01] active:scale-[0.98] shadow-[#00804D]/20'
            }`}
          >
            {isSubmitting ? "TRANSMITTING DATA..." : "SUBMIT REPORT TO CONTROL CENTER"}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}