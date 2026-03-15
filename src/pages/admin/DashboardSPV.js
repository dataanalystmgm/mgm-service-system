import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import Image from 'next/image';

export default function SPVDashboard() {
  const [requests, setRequests] = useState([]);
  const [pics, setPics] = useState([]); // Daftar PIC dari database
  const [selectedTask, setSelectedTask] = useState(null); // Untuk Modal Detail

  useEffect(() => {
    // 1. Ambil Data Requests secara Real-time
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Ambil Daftar PIC untuk pilihan dropdown
    const fetchPics = async () => {
      const qPic = query(collection(db, "users"), where("role", "==", "PIC"));
      const snapshot = await getDocs(qPic);
      setPics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPics();

    return () => unsubscribe();
  }, []);

  const handleAssign = async (id, picId, targetDate) => {
    if (!picId || !targetDate) return alert("Pilih PIC dan Target Selesai!");
    
    await updateDoc(doc(db, "requests", id), {
      status: 'disetujui',
      picId: picId,
      targetSelesai: targetDate,
      assignedAt: new Date().toISOString()
    });
    alert("Tugas berhasil diberikan!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Pelayanan MGM (SPV)</h1>
      
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">User / Bagian</th>
              <th className="py-3 px-6 text-left">Tipe & Deskripsi</th>
              <th className="py-3 px-6 text-center">Prioritas</th>
              <th className="py-3 px-6 text-center">Lampiran</th>
              <th className="py-3 px-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {requests.map((req) => (
              <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">
                  <div className="font-medium text-gray-800">{req.nama}</div>
                  <div className="text-xs text-gray-500">{req.bagian} (NIK: {req.nik})</div>
                </td>
                <td className="py-3 px-6 text-left max-w-xs">
                  <span className="font-bold">{req.tipe}</span>
                  <p className="truncate">{req.deskripsi}</p>
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`${req.prioritas === 'mendesak' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} py-1 px-3 rounded-full text-xs font-bold`}>
                    {req.prioritas}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  {req.fotoUrl ? (
                    <button 
                      onClick={() => setSelectedTask(req)}
                      className="text-blue-500 hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      Lihat Drive
                    </button>
                  ) : <span className="text-gray-400 italic">No File</span>}
                </td>
                <td className="py-3 px-6 text-center">
                   {req.status === 'pending' ? (
                     <div className="flex flex-col gap-2">
                        <select id={`pic-${req.id}`} className="p-1 border rounded text-xs">
                          <option value="">Pilih PIC</option>
                          <option value="PIC_INDONESIA_01">Ahmudi</option>
                          <option value="PIC_INDONESIA_02">Dani</option>
                          <option value="PIC_INDONESIA_03">Indah</option>
                        </select>
                        <input type="date" id={`date-${req.id}`} className="p-1 border rounded text-xs" />
                        <button 
                          onClick={() => {
                            const p = document.getElementById(`pic-${req.id}`).value;
                            const d = document.getElementById(`date-${req.id}`).value;
                            handleAssign(req.id, p, d);
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Tugaskan
                        </button>
                     </div>
                   ) : (
                     <span className="capitalize font-bold text-gray-400">{req.status}</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal View Gambar Google Drive */}
      {selectedTask && (
        <ImageModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}