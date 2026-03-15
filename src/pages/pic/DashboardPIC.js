import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ImageModal from '@/components/ImageModal';

export default function DashboardPIC() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Query mencari tugas yang ditugaskan ke PIC ini (berdasarkan nama atau ID)
    const q = query(
      collection(db, "requests"), 
      where("picId", "==", user.name) // Menyesuaikan dengan input dari SPV
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (taskId, newStatus, currentLogs = []) => {
    const taskRef = doc(db, "requests", taskId);
    
    // Catatan log pengerjaan untuk menghitung lead time nantinya
    const logEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: user.name
    };

    try {
      await updateDoc(taskRef, {
        status: newStatus,
        logs: arrayUnion(logEntry),
        lastUpdate: serverTimestamp()
      });
      alert(`Status diperbarui menjadi: ${newStatus.toUpperCase()}`);
    } catch (error) {
      console.error("Gagal update status:", error);
    }
  };

  if (loading) return <div className="p-10 text-center">Memuat Tugas PIC...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard PIC</h1>
            <p className="text-sm text-gray-500">Petugas: {user?.name} (MGM Indonesia)</p>
          </div>
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow text-xs font-bold uppercase tracking-widest">
            {tasks.filter(t => t.status !== 'validasi').length} Tugas Aktif
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {tasks.length === 0 && (
            <div className="bg-white p-10 text-center rounded-xl shadow border-2 border-dashed">
              <p className="text-gray-400 font-medium">Belum ada tugas yang diberikan kepada Anda.</p>
            </div>
          )}

          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">Tipe Barang</span>
                    <h3 className="text-lg font-bold text-gray-900">{task.tipe}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    task.status === 'sedang dikerjakan' ? 'bg-blue-100 text-blue-700 animate-pulse' : 
                    task.status === 'pause' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-6">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-400">Pemohon</p>
                    <p className="font-bold">{task.nama} ({task.bagian})</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-400">Prioritas</p>
                    <p className={`font-bold ${task.prioritas === 'mendesak' ? 'text-red-600' : ''}`}>{task.prioritas.toUpperCase()}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-400">Target Selesai</p>
                    <p className="font-bold text-blue-600">{task.targetSelesai}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-400">Lampiran</p>
                    <button onClick={() => setSelectedTask(task)} className="text-red-600 font-bold underline">Lihat Foto Drive</button>
                  </div>
                </div>

                <div className="border-t pt-4 flex flex-wrap gap-3">
                  {/* TOMBOL AKSI */}
                  {task.status === 'disetujui' && (
                    <button 
                      onClick={() => updateStatus(task.id, 'sedang dikerjakan')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-xs"
                    >
                      MULAI KERJA
                    </button>
                  )}

                  {task.status === 'sedang dikerjakan' && (
                    <>
                      <button 
                        onClick={() => updateStatus(task.id, 'pause')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-xs"
                      >
                        PAUSE (Jeda)
                      </button>
                      <button 
                        onClick={() => updateStatus(task.id, 'selesai')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold text-xs"
                      >
                        SELESAI
                      </button>
                    </>
                  )}

                  {task.status === 'pause' && (
                    <button 
                      onClick={() => updateStatus(task.id, 'sedang dikerjakan')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-xs"
                    >
                      LANJUTKAN KERJA
                    </button>
                  )}
                  
                  {task.status === 'selesai' && (
                    <p className="text-green-600 text-xs font-italic">Menunggu validasi dari pemohon...</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTask && (
        <ImageModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}