import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { db } from '@/lib/firebaseConfig';
import { uploadToDrive } from '@/lib/uploadFile'; // Helper yang memanggil GAS
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function RequestForm() {
  const { user } = useAuth();
  const router = useRouter();

  // State Utama Form
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    bagian: '',
    keperluan: 'perbaikan',
    tipe: '',
    deskripsi: '',
    deadline: '',
    prioritas: 'tidak mendesak'
  });

  // State UI & Data
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Load data awal (Tipe yang sudah ada & Auto-fill User)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "types"));
        setTypes(querySnapshot.docs.map(doc => doc.data().name));
      } catch (error) {
        console.error("Gagal mengambil data tipe:", error);
      }
    };
    fetchData();

    if (user) {
      setFormData(prev => ({
        ...prev,
        nama: user.name || '',
        nik: user.nik || '',
        bagian: user.dept || ''
      }));
    }
  }, [user]);

  // 2. Handle Perubahan File & Preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // 3. Proses Simpan ke Drive & Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalType = formData.tipe;

      // Jika user menambahkan tipe barang baru
      if (formData.tipe === 'Lainnya' && newType) {
        await addDoc(collection(db, "types"), { name: newType });
        finalType = newType;
      }

      // Upload ke Google Drive via Helper (GAS Bridge)
      let googleDriveUrl = "";
      if (file) {
        googleDriveUrl = await uploadToDrive(file);
      }

      // Simpan record ke Firestore
      await addDoc(collection(db, "requests"), {
        ...formData,
        tipe: finalType,
        fotoUrl: googleDriveUrl, // Link dari Google Drive
        status: 'pending',
        userId: user?.uid || 'guest',
        whatsapp: user?.whatsapp || '',
        createdAt: serverTimestamp(),
      });

      alert("Permintaan MGM Service Berhasil Terkirim!");
      router.push('/request/status');
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Gagal mengirim data. Pastikan koneksi internet stabil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
      {/* Header Branding MGM */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 p-6 text-white text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Form Pelayanan MGM</h1>
        <p className="text-red-100 text-sm opacity-90">PT. Mercindo Global Manufaktur - Internal Service System</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Section 1: Identitas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nomor Induk Karyawan (NIK)</label>
            <input required type="text" value={formData.nik} onChange={(e) => setFormData({...formData, nik: e.target.value})} className="w-full mt-1 p-3 border-b-2 border-gray-200 focus:border-red-500 outline-none transition-colors" placeholder="MGMXXXX" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
            <input required type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full mt-1 p-3 border-b-2 border-gray-200 focus:border-red-500 outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Bagian / Departemen</label>
          <input required type="text" value={formData.bagian} onChange={(e) => setFormData({...formData, bagian: e.target.value})} className="w-full mt-1 p-3 border-b-2 border-gray-200 focus:border-red-500 outline-none transition-colors" />
        </div>

        <hr className="border-gray-100" />

        {/* Section 2: Detail Keperluan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Keperluan</label>
            <select value={formData.keperluan} onChange={(e) => setFormData({...formData, keperluan: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-red-500">
              <option value="pengadaan">Pengadaan Barang Baru</option>
              <option value="perbaikan">Perbaikan Kerusakan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tipe (Mesin/Alat/Fasilitas)</label>
            <select required value={formData.tipe} onChange={(e) => setFormData({...formData, tipe: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-red-500">
              <option value="">Pilih Opsi</option>
              {types.map((t, i) => <option key={i} value={t}>{t}</option>)}
              <option value="Lainnya">+ Tambah Tipe Baru</option>
            </select>
          </div>
        </div>

        {formData.tipe === 'Lainnya' && (
          <div className="bg-red-50 p-4 rounded-lg animate-pulse border border-red-100">
            <label className="text-xs font-bold text-red-700 uppercase">Nama Tipe Baru</label>
            <input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="Tulis nama mesin/fasilitas baru..." className="w-full mt-1 p-2 bg-transparent border-b border-red-300 outline-none" />
          </div>
        )}

        {/* Section 3: Lampiran Foto (Drive Storage) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Lampiran Foto (Upload ke Google Drive)</label>
          <div className="mt-3 flex items-center gap-6">
            <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
              {previewUrl ? (
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="text-gray-300 text-center flex flex-col items-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                  <span className="text-[10px] mt-1">Belum Ada Foto</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-red-50 hover:file:text-red-700 cursor-pointer" />
              <p className="text-[10px] text-gray-400 mt-2 italic">*Foto otomatis masuk ke folder Drive MGM</p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi Masalah / Alasan Pengadaan</label>
          <textarea required rows="4" value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} className="w-full mt-2 p-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Jelaskan detail kerusakan atau barang yang dibutuhkan..."></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tanggal Permintaan Selesai</label>
            <input required type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tingkat Prioritas</label>
            <div className="flex mt-2 gap-4">
              {['tidak mendesak', 'mendesak'].map((p) => (
                <button key={p} type="button" onClick={() => setFormData({...formData, prioritas: p})} className={`flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase border-2 transition-all ${formData.prioritas === p ? 'bg-red-600 border-red-600 text-white' : 'border-gray-200 text-gray-400'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white transition-all shadow-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-95'}`}
        >
          {loading ? "Menyimpan ke Google Drive..." : "Kirim Permintaan Ke SPV"}
        </button>
      </form>
    </div>
  );
}