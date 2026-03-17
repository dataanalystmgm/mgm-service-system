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
import Swal from 'sweetalert2'; 

// --- HELPER UNTUK NOTIFIKASI DASHBOARD ---
const picNotify = {
  success: (title, msg) => {
    Swal.fire({
      icon: 'success',
      title: `<span class="text-lg font-black italic uppercase text-[#00804D]">${title}</span>`,
      text: msg,
      confirmButtonColor: '#00804D',
      customClass: { popup: 'rounded-[2rem]' }
    });
  },
  error: (msg) => {
    Swal.fire({
      icon: 'error',
      title: 'OPS!',
      text: msg,
      confirmButtonColor: '#dc2626',
      customClass: { popup: 'rounded-[2rem]' }
    });
  },
  confirm: async (title, text, confirmText, color = '#dc2626') => {
    return Swal.fire({
      title: `<span class="font-black uppercase italic text-xl">${title}</span>`,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: color,
      cancelButtonColor: '#9ca3af',
      confirmButtonText: confirmText,
      cancelButtonText: 'BATAL',
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl font-black uppercase text-[10px] px-6 py-3',
        cancelButton: 'rounded-xl font-black uppercase text-[10px] px-6 py-3'
      }
    });
  }
};

// --- KOMPONEN COUNTDOWN TIMER ---
function CountdownTimer({ targetDate, status, label }) {
  const [timeLeft, setTimeLeft] = useState("");
  const currentStatus = status?.toUpperCase() || "";
  const isFinished = currentStatus === "SUDAH DIVALIDASI USER" || currentStatus === "SUDAH SELESAI";

  useEffect(() => {
    if (!targetDate || isFinished) {
      setTimeLeft("DONE");
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("LATE");
        return;
      }

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [targetDate, isFinished]);

  return (
    <div className="flex flex-col items-center min-w-[65px] bg-white px-1.5 py-1 rounded-lg border border-gray-100 shadow-sm">
      <span className="text-[6px] font-black uppercase text-[#1e4890] tracking-tighter">{label}</span>
      <div className={`text-[8px] font-black ${
        timeLeft === "LATE" ? 'text-red-600 animate-pulse' : 'text-gray-700'
      }`}>
        {timeLeft}
      </div>
      <div className="flex flex-col items-center leading-none mt-0.5">
        <span className="text-[5px] font-bold text-gray-400 uppercase">
          {targetDate ? new Date(targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
        </span>
      </div>
    </div>
  );
}

// --- KOMPONEN SLA ANALYSIS ---
function SlaAnalysis({ targetDate, closedAt, status, label }) {
  const currentStatus = status?.toUpperCase() || "";
  const isFinished = currentStatus === "SUDAH DIVALIDASI USER" || currentStatus === "SUDAH SELESAI";

  if (!isFinished || !targetDate) return null;

  const finishTime = closedAt ? new Date(closedAt).getTime() : new Date().getTime();
  const targetTime = new Date(targetDate).getTime();
  const diffMs = targetTime - finishTime;
  const isOntime = diffMs >= 0;
  const absMs = Math.abs(diffMs);
  
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const timeText = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  return (
    <div className={`flex flex-col items-center min-w-[65px] px-1.5 py-1 rounded-lg border ${
      isOntime ? 'bg-[#00804D]/10 border-[#00804D]/20' : 'bg-red-50 border-red-100'
    }`}>
      <span className="text-[6px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
      <div className={`text-[7px] font-black uppercase ${isOntime ? 'text-[#00804D]' : 'text-red-700'}`}>
        {isOntime ? 'ONTIME' : 'LATE'}
      </div>
      <span className={`text-[6px] font-bold ${isOntime ? 'text-[#00804D]' : 'text-red-600'}`}>
        {isOntime ? `-${timeText}` : `+${timeText}`}
      </span>
    </div>
  );
}

export default function DashboardPIC() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const [handoverId, setHandoverId] = useState(null);
  const [newPicNik, setNewPicNik] = useState("");
  const [newPicName, setNewPicName] = useState("");

  useEffect(() => {
    if (!user?.nik) return;

    // Menangani variasi NIK Tedi (0003 vs 3)
    let nikVariations = [user.nik];
    if (user.nik.includes("MGM")) {
      const numericPart = user.nik.replace("MGM", "").trim();
      nikVariations.push(`MGM ${parseInt(numericPart, 10)}`);
      nikVariations.push(`MGM ${numericPart.padStart(4, '0')}`);
      nikVariations = [...new Set(nikVariations)];
    }

    const q = query(
      collection(db, "requests"), 
      where("picNik", "in", nikVariations) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (taskId, newStatus) => {
    if (newStatus === 'sudah selesai') {
        const result = await picNotify.confirm("Selesaikan Tugas?", "Pastikan semua perbaikan sudah dicek kembali.", "YA, SELESAI", "#00804D");
        if (!result.isConfirmed) return;
    }

    const taskRef = doc(db, "requests", taskId);
    const now = new Date().toISOString();
    
    const logEntry = {
      status: newStatus,
      timestamp: now,
      updatedBy: user.name,
      updatedByNik: user.nik
    };

    const updateData = {
      status: newStatus,
      logs: arrayUnion(logEntry),
      lastUpdate: serverTimestamp()
    };

    if (newStatus === 'sudah selesai') {
      updateData.closedAt = now;
    }

    try {
      await updateDoc(taskRef, updateData);
      picNotify.success("Update Berhasil", `Status tugas kini: ${newStatus.toUpperCase()}`);
    } catch (error) {
      console.error("Gagal update status:", error);
      picNotify.error("Gagal memperbarui status.");
    }
  };

  const handleHandover = async (taskId) => {
    if (!newPicNik || !newPicName) return picNotify.error("Harap isi NIK dan Nama PIC baru.");
    
    const result = await picNotify.confirm(
        "Konfirmasi Oper PIC", 
        `Tugas akan dialihkan ke ${newPicName}. Anda tidak akan bisa mengelola tugas ini lagi.`,
        "OPER TUGAS",
        "#1e4890"
    );

    if (!result.isConfirmed) return;

    try {
      const taskRef = doc(db, "requests", taskId);
      const now = new Date().toISOString();

      const logEntry = {
        status: 'Handover / Ganti PIC',
        timestamp: now,
        updatedBy: user.name,
        message: `Tugas dialihkan dari ${user.name} (${user.nik}) ke ${newPicName} (${newPicNik})`
      };

      await updateDoc(taskRef, {
        picNik: newPicNik,
        picId: newPicName,
        logs: arrayUnion(logEntry),
        lastUpdate: serverTimestamp()
      });

      picNotify.success("Handover Berhasil", `Tugas telah berpindah tangan ke ${newPicName}`);
      setHandoverId(null);
      setNewPicNik("");
      setNewPicName("");
    } catch (error) {
      picNotify.error("Gagal melakukan handover.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00804D]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6 font-sans text-gray-800">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter italic uppercase">
              MGM <span className="text-[#00804D]">TECH</span> DASHBOARD
            </h1>
            <p className="text-[10px] text-gray-500">
              Petugas PIC: <span className="font-bold text-[#00804D] uppercase italic">{user?.name}</span> <span className="text-[9px] bg-[#1e4890] text-white px-2 py-0.5 rounded-full ml-1 font-bold">{user?.nik}</span>
            </p>
          </div>
          <div className="bg-gray-900 text-white px-4 py-1.5 rounded-lg shadow-lg text-[9px] font-black uppercase tracking-[0.2em] border-b-4 border-[#00804D]">
            {tasks.filter(t => t.status !== 'sudah divalidasi user').length} Tugas Aktif
          </div>
        </header>

        {/* TASK LIST - Menggunakan grid-cols-4 untuk layar lebar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-3xl shadow-sm border-2 border-dashed border-gray-300">
              <div className="text-gray-200 mb-2 font-black text-3xl italic">EMPTY</div>
              <p className="text-gray-400 text-xs font-medium italic">Belum ada tugas yang dialokasikan ke ID {user?.nik}.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="p-4 flex-1 flex flex-col">
                  
                  {/* TOP ROW */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-black text-white uppercase tracking-widest bg-[#1e4890] px-1.5 py-0.5 rounded">
                          {task.tipe}
                        </span>
                        <span className="text-[7px] font-bold text-gray-400">
                          #{task.id.slice(-5).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mt-1.5 uppercase leading-tight min-h-[2rem] line-clamp-2 italic">
                        {task.deskripsi}
                      </h3>
                    </div>
                  </div>

                  {/* ANALYTICS ROW */}
                  <div className="flex gap-1.5 mb-3 overflow-x-hidden">
                    <CountdownTimer 
                      label="SISA" 
                      targetDate={task.targetSelesai} 
                      status={task.status} 
                    />
                    <SlaAnalysis 
                      label="PERF" 
                      targetDate={task.targetSelesai} 
                      closedAt={task.closedAt} 
                      status={task.status} 
                    />
                    <div className={`px-1.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-tighter shadow-sm border flex items-center justify-center flex-1 ${
                      task.status === 'sedang dikerjakan' ? 'bg-[#1e4890] text-white animate-pulse border-[#16356d]' : 
                      task.status === 'pause' ? 'bg-orange-500 text-white border-orange-600' : 
                      task.status === 'sudah selesai' ? 'bg-[#00804D]/10 text-[#00804D] border-[#00804D]/20' : 
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {task.status}
                    </div>
                  </div>

                  {/* INFO GRID - DIPERKECIL & DITAMBAH INFO REQUEST */}
                  <div className="grid grid-cols-2 gap-1.5 text-[8px] mb-4">
                    <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-400 mb-0.5 uppercase font-black text-[6px]">Pemohon</p>
                      <p className="font-bold text-gray-800 leading-none truncate uppercase">{task.nama || 'User'}</p>
                      <p className="text-[#1e4890] text-[7px] mt-0.5 italic truncate font-bold uppercase">{task.bagian || 'Dept'}</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-400 mb-0.5 uppercase font-black text-[6px]">Tgl Request</p>
                      <p className="font-bold text-gray-800 leading-none">
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'2-digit'}) : '-'}
                      </p>
                      <p className="text-gray-400 text-[6px] mt-0.5 font-bold uppercase">MGM SYSTEM</p>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg border-l-2 border-[#1e4890] shadow-sm col-span-2">
                      <p className="text-gray-400 mb-0.5 uppercase font-black text-[6px]">Target Selesai</p>
                      <p className="font-black text-[#1e4890] italic text-[9px]">
                        {task.targetSelesai ? new Date(task.targetSelesai).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '-'}
                      </p>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100 col-span-2 flex justify-between items-center">
                      <p className="text-gray-400 uppercase font-black text-[6px]">Media Lampiran</p>
                      {task.fotoUrl ? (
                        <button onClick={() => setSelectedTask(task)} className="text-[#00804D] font-bold underline hover:text-[#00663d] text-[8px] italic">
                          LIHAT FOTO
                        </button>
                      ) : (
                        <span className="text-gray-300 italic text-[7px]">No Image</span>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-auto border-t border-gray-100 pt-3 flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5 w-full">
                      {(task.status === 'to do' || task.status === 'pause' || task.status === 'disetujui' || task.status === 'pending') && (
                        <button 
                          onClick={() => updateStatus(task.id, 'sedang dikerjakan')}
                          className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-lg font-black text-[9px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-[#00804D] rounded-full animate-ping"></span>
                          {task.status === 'pause' ? 'LANJUTKAN' : 'MULAI KERJA'}
                        </button>
                      )}

                      {task.status === 'sedang dikerjakan' && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button 
                            onClick={() => updateStatus(task.id, 'pause')}
                            className="bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-black text-[9px] shadow-sm transition-all active:scale-95"
                          >
                            PAUSE
                          </button>
                          <button 
                            onClick={() => updateStatus(task.id, 'sudah selesai')}
                            className="bg-[#00804D] hover:bg-[#00663d] text-white py-2 rounded-lg font-black text-[9px] shadow-sm transition-all active:scale-95"
                          >
                            SELESAI
                          </button>
                        </div>
                      )}

                      {task.status === 'sudah selesai' && (
                        <div className="flex items-center gap-1.5 text-[#00804D] bg-[#00804D]/5 px-2 py-2 rounded-lg border border-[#00804D]/20 w-full text-center justify-center">
                          <p className="text-[7px] font-black italic uppercase tracking-tighter text-center leading-tight">Menunggu Validasi User</p>
                        </div>
                      )}
                    </div>

                    {/* SECTION HANDOVER PIC */}
                    {task.status === 'sedang dikerjakan' && (
                      <div className="w-full">
                        {handoverId === task.id ? (
                          <div className="bg-[#1e4890]/5 p-2 rounded-lg border border-[#1e4890]/20 flex flex-col gap-1.5 shadow-inner">
                            <input 
                              type="text" 
                              placeholder="NIK..." 
                              className="text-[8px] p-1.5 rounded border w-full outline-none focus:border-[#1e4890]"
                              value={newPicNik}
                              onChange={(e) => setNewPicNik(e.target.value)}
                            />
                            <input 
                              type="text" 
                              placeholder="Nama..." 
                              className="text-[8px] p-1.5 rounded border w-full outline-none focus:border-[#1e4890]"
                              value={newPicName}
                              onChange={(e) => setNewPicName(e.target.value)}
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleHandover(task.id)} className="bg-[#1e4890] text-white text-[8px] font-black py-1.5 rounded flex-1 uppercase">OPER</button>
                              <button onClick={() => { setHandoverId(null); setNewPicNik(""); setNewPicName(""); }} className="bg-white text-gray-400 text-[8px] py-1.5 rounded border flex-1 uppercase">BATAL</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setHandoverId(task.id)}
                            className="w-full flex items-center justify-center gap-2 text-[8px] font-black text-[#1e4890] uppercase tracking-widest border border-[#1e4890] py-1.5 rounded-lg hover:bg-[#1e4890] hover:text-white transition-all italic"
                          >
                            ⇄ OPER PIC
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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