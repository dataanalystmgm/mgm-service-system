// src/pages/request/status.js
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export default function RequestStatus() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.nik) return;
    
    // Mengurutkan berdasarkan yang terbaru
    const q = query(
      collection(db, "requests"), 
      where("nik", "==", user.nik)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manual jika index firestore belum dibuat
      setMyRequests(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleValidasi = async (id) => {
    const confirm = window.confirm("Apakah Anda yakin perbaikan/pengadaan ini sudah selesai dengan benar?");
    if (confirm) {
      await updateDoc(doc(db, "requests", id), { 
        status: 'validasi',
        closedAt: new Date().toISOString()
      });
      alert("Terima kasih atas validasinya. Laporan telah ditutup.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat status permintaan...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Status Pengajuan Layanan</h1>
        <p className="text-sm text-gray-500">Pantau perkembangan permintaan perbaikan atau pengadaan Anda.</p>
      </header>

      <div className="grid gap-6">
        {myRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
            <p className="text-gray-400">Anda belum pernah membuat pengajuan.</p>
          </div>
        ) : (
          myRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      req.prioritas === 'mendesak' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.prioritas}
                    </span>
                    <span className="text-xs text-gray-400">ID: {req.id.substring(0, 8)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{req.tipe}</h3>
                  <p className="text-sm text-gray-600 line-clamp-1">{req.deskripsi}</p>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className={`w-full md:w-auto text-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    req.status === 'validasi' ? 'bg-gray-100 text-gray-500' :
                    req.status === 'selesai' ? 'bg-green-100 text-green-700' :
                    req.status === 'sedang dikerjakan' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status}
                  </div>
                  
                  {req.picId && req.status !== 'validasi' && (
                    <span className="text-[10px] text-gray-500 italic">Dikerjakan oleh: {req.picId}</span>
                  )}
                </div>
              </div>

              {/* Action Area */}
              {req.status === 'selesai' && (
                <div className="bg-green-50 p-4 border-t border-green-100 flex flex-col md:flex-row justify-between items-center gap-3">
                  <p className="text-sm text-green-800 font-medium">PIC telah menyelesaikan tugas. Mohon periksa kembali.</p>
                  <button 
                    onClick={() => handleValidasi(req.id)}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-6 rounded-lg shadow-md transition-all active:scale-95"
                  >
                    VALIDASI SELESAI
                  </button>
                </div>
              )}
              
              {req.status === 'validasi' && (
                <div className="bg-gray-50 p-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400 font-medium italic">Permintaan ini sudah selesai dan divalidasi.</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}