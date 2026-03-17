import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { 
  collection, query, orderBy, onSnapshot, doc, 
  updateDoc, addDoc, deleteDoc, arrayUnion 
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ImageModal from '@/components/ImageModal';
import Swal from 'sweetalert2';

// --- HELPER UNTUK NOTIFIKASI SPV ---
const spvNotify = {
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
      title: 'ERROR!',
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
    if (!targetDate || isFinished || currentStatus === "DITOLAK") {
      setTimeLeft("0");
      return;
    }
    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("LATE"); return; }
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m`);
    };
    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [targetDate, isFinished, currentStatus]);

  return (
    <div className="flex flex-col items-center flex-1 bg-white/50 px-1 py-1 rounded-xl border border-black/5 shadow-sm">
      <span className="text-[6px] font-black uppercase text-[#1e4890] tracking-tighter">{label}</span>
      <div className={`text-[8px] font-black ${timeLeft === "LATE" ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
        {isFinished ? "0" : timeLeft}
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

  if (!isFinished || !targetDate) return (
    <div className="flex flex-col items-center flex-1 px-1 py-1 rounded-xl border border-dashed border-gray-200">
        <span className="text-[6px] font-black text-gray-300 uppercase tracking-tighter">{label}</span>
        <span className="text-[7px] font-black text-gray-300 italic">WAITING</span>
    </div>
  );

  const finishTime = closedAt ? new Date(closedAt).getTime() : new Date().getTime();
  const targetTime = new Date(targetDate).getTime();
  const diffMs = targetTime - finishTime;
  const isOntime = diffMs >= 0;
  const absMs = Math.abs(diffMs);
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const timeText = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  return (
    <div className={`flex flex-col items-center flex-1 px-1 py-1 rounded-xl border ${isOntime ? 'bg-[#00804D]/10 border-[#00804D]/20' : 'bg-red-500/10 border-red-200'}`}>
      <span className="text-[6px] font-black text-gray-600 uppercase tracking-tighter">{label}</span>
      <div className={`text-[7px] font-black uppercase ${isOntime ? 'text-[#00804D]' : 'text-red-700'}`}>
        {isOntime ? 'ONTIME' : 'LATE'}
      </div>
      <span className={`text-[6px] font-bold ${isOntime ? 'text-[#00804D]' : 'text-red-600'}`}>
        {isOntime ? `-${timeText}` : `+${timeText}`}
      </span>
    </div>
  );
}

export default function DashboardSPV() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [picList, setPicList] = useState([]); 
  const [newPic, setNewPic] = useState({ name: '', nik: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [showPicMaster, setShowPicMaster] = useState(false);

  const SUPER_ADMIN_ID = ["MGM 4329", "MGM 1111"];
  const isAuthorized = SUPER_ADMIN_ID.includes(user?.nik);

  useEffect(() => {
    const qRequest = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubRequest = onSnapshot(qRequest, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const qPic = query(collection(db, "pics"), orderBy("name", "asc"));
    const unsubPic = onSnapshot(qPic, (snapshot) => {
      setPicList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubRequest(); unsubPic(); };
  }, []);

  const handleAddPic = async (e) => {
    e.preventDefault();
    if (!newPic.name.trim() || !newPic.nik.trim()) return spvNotify.error("Lengkapi Nama dan NIK PIC!");
    try {
      await addDoc(collection(db, "pics"), { name: newPic.name, nik: newPic.nik, createdAt: new Date().toISOString() });
      setNewPic({ name: '', nik: '' });
      spvNotify.success("Registrasi Berhasil", `PIC ${newPic.name} telah didaftarkan.`);
    } catch (e) { spvNotify.error("Gagal menyimpan ke database."); }
  };

  const handleDeletePic = async (id) => {
    const result = await spvNotify.confirm("Hapus PIC?", "Data PIC akan dihapus permanen.", "HAPUS SEKARANG");
    if (result.isConfirmed) {
      try { await deleteDoc(doc(db, "pics", id)); spvNotify.success("Terhapus", "PIC berhasil dihapus."); } 
      catch (e) { spvNotify.error("Gagal menghapus PIC."); }
    }
  };

  const handleUpdateTask = async (id) => {
    const picSelect = document.getElementById(`pic-${id}`);
    const selectedOption = picSelect.options[picSelect.selectedIndex];
    const targetSelesai = document.getElementById(`date-${id}`).value;
    if (!selectedOption.value || !targetSelesai) return spvNotify.error("Lengkapi PIC & Deadline!");
    try {
      await updateDoc(doc(db, "requests", id), {
        picId: selectedOption.value,
        picNik: selectedOption.getAttribute('data-nik'),
        targetSelesai: targetSelesai,
        status: 'to do',
        logs: arrayUnion({ status: 'to do', updatedBy: user.name, timestamp: new Date().toISOString(), message: "Task Published" }),
        assignedAt: new Date().toISOString()
      });
      setEditId(null);
      spvNotify.success("Task Published", `Ditugaskan ke ${selectedOption.value}`);
    } catch (e) { spvNotify.error("Gagal mengupdate."); }
  };

  const handleReject = async (id) => {
    const { value: alasan } = await Swal.fire({
        title: '<span class="font-black italic uppercase text-red-600">Alasan Penolakan</span>',
        input: 'textarea',
        inputPlaceholder: 'Tulis alasan penolakan...',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'TOLAK',
        customClass: { popup: 'rounded-[2rem]' },
        inputValidator: (value) => { if (!value) return 'Alasan harus diisi!' }
    });
    if (alasan) {
      try {
        await updateDoc(doc(db, "requests", id), {
          status: 'ditolak',
          logs: arrayUnion({ status: 'ditolak', updatedBy: user.name, timestamp: new Date().toISOString(), message: alasan })
        });
        spvNotify.success("Rejected", "Permintaan ditolak.");
      } catch (e) { spvNotify.error("Gagal menolak."); }
    }
  };

  if (loading || authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00804D]"></div></div>;

  return (
    <div className="bg-gray-100 min-h-screen p-2 md:p-4 font-sans text-gray-800">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">
              MGM <span className="text-[#00804D]">CONTROL</span> CENTER
            </h1>
            <p className="text-[8px] font-bold text-[#1e4890] uppercase tracking-[0.3em]">Supervisor Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthorized && (
              <button onClick={() => setShowPicMaster(!showPicMaster)} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${showPicMaster ? 'bg-[#00804D] text-white border-[#00663d]' : 'bg-white text-gray-900 shadow-sm'}`}>
                {showPicMaster ? 'Close PIC' : 'PIC Master'}
              </button>
            )}
            <div className="bg-white px-3 py-1 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm">
                <p className="text-[10px] font-black text-[#00804D] uppercase leading-none italic">{user?.name}</p>
                <div className="h-6 w-6 bg-[#1e4890] rounded-full flex items-center justify-center text-white font-bold text-[10px] italic shadow-inner">{user?.name?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* PIC MASTER PANEL */}
        {isAuthorized && showPicMaster && (
          <div className="mb-6 bg-white p-4 rounded-[1.5rem] shadow-xl border-2 border-[#00804D]/5 animate-in fade-in zoom-in duration-200">
            <div className="flex gap-2 mb-4 flex-wrap">
              <input type="text" placeholder="Nama..." value={newPic.name} onChange={e => setNewPic({...newPic, name: e.target.value})} className="flex-1 p-2 bg-gray-50 border rounded-lg text-[10px] font-bold outline-none focus:border-[#00804D]" />
              <input type="text" placeholder="NIK..." value={newPic.nik} onChange={e => setNewPic({...newPic, nik: e.target.value})} className="w-24 p-2 bg-gray-50 border rounded-lg text-[10px] font-bold outline-none focus:border-[#00804D]" />
              <button onClick={handleAddPic} className="bg-[#1e4890] text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase hover:bg-[#16356d] transition-colors">Add</button>
            </div>
            <div className="flex flex-wrap gap-1 max-h-[150px] overflow-y-auto">
              {picList.map(pic => (
                <div key={pic.id} className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 text-[8px] font-black flex gap-2 items-center">
                  <span className="text-[#1e4890]">{pic.nik}</span>
                  <span className="text-gray-800 uppercase italic">{pic.name}</span>
                  <button onClick={() => handleDeletePic(pic.id)} className="text-red-600 hover:scale-125 transition-transform">&times;</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GRID 5 KOLOM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {requests.map((req) => {
            const isEditing = editId === req.id || req.status === 'pending';
            const currentStatus = req.status?.toUpperCase();
            const isFinal = currentStatus === "SUDAH DIVALIDASI USER" || currentStatus === "SUDAH SELESAI";
            const isMendesak = req.prioritas?.toLowerCase() === 'mendesak';

            let cardBg = "bg-white";
            const targetTime = new Date(req.targetSelesai || req.deadline).getTime();
            const now = new Date().getTime();
            if (isFinal) cardBg = (new Date(req.closedAt).getTime() <= targetTime) ? "bg-[#00804D]/5" : "bg-red-500/5";
            else if (now > targetTime && req.status !== 'ditolak') cardBg = "bg-red-500/5";

            return (
              <div key={req.id} className={`${cardBg} rounded-[1.2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md ${req.status === 'ditolak' ? 'grayscale opacity-60' : ''}`}>
                <div className="p-3 flex-1 flex flex-col">
                  
                  {/* TIMESTAMP & PRIORITY BADGE */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-[6px] font-black text-gray-400 uppercase leading-none">Requested At:</span>
                      <span className="text-[8px] font-bold text-gray-500 italic">
                        {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : '-'}
                      </span>
                    </div>
                    {isMendesak && (
                      <span className="bg-red-600 text-white text-[6px] font-black px-1.5 py-0.5 rounded italic animate-pulse tracking-tighter">MENDESAK</span>
                    )}
                  </div>

                  {/* TYPE & DESCRIPTION */}
                  <div className="mb-2">
                    <span className="text-[7px] font-black bg-[#1e4890] text-white px-1.5 py-0.5 rounded uppercase tracking-widest">{req.tipe}</span>
                    <h3 className="text-[9px] font-black text-gray-900 uppercase leading-tight mt-1 line-clamp-2 min-h-[1.6rem] italic">{req.deskripsi}</h3>
                  </div>

                  {/* COUNTDOWNS DENGAN AKSEN BIRU */}
                  <div className="flex gap-1 mb-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                    <CountdownTimer label="INT" targetDate={req.targetSelesai} status={req.status} />
                    <CountdownTimer label="USR" targetDate={req.deadline} status={req.status} />
                  </div>

                  {/* PERSON INFO */}
                  <div className="grid grid-cols-2 gap-1 text-[8px] mb-2 bg-white/40 p-1.5 rounded-lg border border-gray-100">
                    <div className="truncate">
                      <p className="text-[6px] font-black text-gray-400 uppercase leading-none">User</p>
                      <p className="font-bold text-gray-800 truncate uppercase">{req.nama}</p>
                    </div>
                    <div className="truncate">
                      <p className="text-[6px] font-black text-gray-400 uppercase leading-none">PIC</p>
                      <p className="font-bold text-[#00804D] truncate uppercase">{req.picId || 'NONE'}</p>
                    </div>
                  </div>

                  {/* ACTION / SLA AREA */}
                  <div className="mt-auto pt-2 border-t border-gray-100">
                    {isEditing && isAuthorized ? (
                      <div className="flex flex-col gap-1">
                        <select id={`pic-${req.id}`} defaultValue={req.picId || ""} className="w-full p-1 bg-white border border-gray-200 rounded-md text-[8px] font-black outline-none focus:border-[#00804D]">
                          <option value="">-- PIC --</option>
                          {picList.map(pic => <option key={pic.id} value={pic.name} data-nik={pic.nik}>{pic.name}</option>)}
                        </select>
                        <input type="datetime-local" id={`date-${req.id}`} defaultValue={req.targetSelesai || ""} className="w-full p-1 bg-white border border-gray-200 text-[8px] font-black rounded-md outline-none focus:border-[#00804D]" />
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdateTask(req.id)} className="flex-1 bg-[#00804D] text-white py-1.5 rounded-md text-[8px] font-black uppercase hover:bg-[#00663d]">Publish</button>
                          <button onClick={() => handleReject(req.id)} className="bg-gray-900 text-white px-2 py-1.5 rounded-md text-[8px] font-black uppercase hover:bg-red-600">X</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center gap-1">
                           <SlaAnalysis label="SLA INT" targetDate={req.targetSelesai} closedAt={req.closedAt} status={req.status} />
                           <SlaAnalysis label="SLA USR" targetDate={req.deadline} closedAt={req.closedAt} status={req.status} />
                           {!isFinal && isAuthorized && (
                              <button onClick={() => setEditId(req.id)} className="bg-white hover:bg-[#1e4890] hover:text-white text-[#1e4890] p-1.5 rounded-lg border border-gray-100 shadow-sm transition-all">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                           )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedTask && <ImageModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}