import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// --- KUSTOMISASI NOTIFIKASI MGM STYLE (UPDATED COLORS) ---
const mgmNotify = {
  success: (msg) => {
    Swal.fire({
      icon: 'success',
      title: '<span class="font-black italic tracking-tighter" style="color:#00804D">SUCCESS</span>',
      text: msg,
      confirmButtonColor: '#1e4890',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-3xl border-b-8 border-[#00804D] shadow-2xl',
        confirmButton: 'rounded-xl font-black px-10 py-3 uppercase text-[10px] tracking-widest'
      }
    });
  },
  error: (msg) => {
    Swal.fire({
      icon: 'error',
      title: '<span class="font-black tracking-tighter text-red-600">SYSTEM ERROR</span>',
      text: msg,
      confirmButtonColor: '#1f2937',
      customClass: { popup: 'rounded-3xl border-b-8 border-red-600' }
    });
  },
  confirm: async (title, text) => {
    return Swal.fire({
      title: `<span class="font-black italic text-xl text-[#1e4890]">${title}</span>`,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00804D',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'KONFIRMASI',
      cancelButtonText: 'BATAL',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl border-4 border-[#1e4890]',
        confirmButton: 'rounded-lg font-black px-6 py-3 text-[10px]',
        cancelButton: 'rounded-lg font-black px-6 py-3 text-[10px]'
      }
    });
  }
};

function SlaTracker({ targetDate, status, closedAt }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);
  const isFinished = status === 'sudah divalidasi user' || status === 'sudah selesai';

  useEffect(() => {
    if (!targetDate) return;
    const calculatePerformance = () => {
      const deadline = new Date(targetDate).getTime();
      if (isFinished) {
        const finishTime = closedAt ? new Date(closedAt).getTime() : new Date().getTime();
        setIsOverdue(finishTime > deadline);
        return;
      }
      const now = new Date().getTime();
      const diff = deadline - now;
      setIsOverdue(diff < 0);
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(days > 0 ? `${days}D ${hours}H ${minutes}M` : `${hours}H ${minutes}M`);
      } else {
        const diffAbs = Math.abs(diff);
        const hours = Math.floor(diffAbs / (1000 * 60 * 60));
        const minutes = Math.floor((diffAbs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`DELAY: ${hours}H ${minutes}M`);
      }
    };
    calculatePerformance();
    const timer = setInterval(calculatePerformance, 60000);
    return () => clearInterval(timer);
  }, [targetDate, isFinished, closedAt]);

  return (
    <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-100">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Expected Completion</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOverdue && !isFinished ? 'bg-red-500 animate-pulse' : 'bg-[#00804D]'}`}></div>
            <p className="text-[10px] font-black text-gray-800 tabular-nums">
              {new Date(targetDate).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="text-right">
          {isFinished ? (
            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 ${
              isOverdue ? 'bg-white text-orange-600 border-orange-200' : 'bg-white text-[#00804D] border-[#00804D]/20'
            }`}>
              {isOverdue ? '⚠️ OVERDUE' : '✅ ON TIME'}
            </span>
          ) : (
            <p className={`text-[10px] font-black px-3 py-1 rounded-lg shadow-inner ${
              isOverdue ? 'bg-red-600 text-white animate-bounce' : 'bg-[#1e4890] text-white'
            }`}>
              {timeLeft}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ... kode import tetap sama ...

export default function RequestStatus() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [isTeamView, setIsTeamView] = useState(false);

  useEffect(() => {
    if (!user?.nik) return;
    const q = isTeamView 
      ? query(collection(db, "requests"), where("bagian", "==", user.dept))
      : query(collection(db, "requests"), where("nik", "==", user.nik));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // --- LOGIKA SORTING KUSTOM SESUAI PERMINTAAN ---
      const statusPriority = {
        'sudah selesai': 1,
        'to do': 2,
        'sedang dikerjakan': 3,
        'pending': 4, // Cadangan jika ada status pending
        'ditolak': 5,
        'pause': 6,
        'sudah divalidasi user': 7
      };

      const sortedData = data.sort((a, b) => {
        const priorityA = statusPriority[a.status?.toLowerCase()] || 99;
        const priorityB = statusPriority[b.status?.toLowerCase()] || 99;

        // Jika status sama, urutkan berdasarkan waktu terbaru (createdAt)
        if (priorityA === priorityB) {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        }
        return priorityA - priorityB;
      });

      setMyRequests(sortedData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isTeamView]);

  const handleUpdateTarget = async (id) => {
    if (!newTargetDate) {
      mgmNotify.error("Pilih tanggal target baru.");
      return;
    }
    try {
      const targetISO = new Date(newTargetDate).toISOString();
      const logEntry = {
        status: 'Target Selesai diupdate user',
        timestamp: new Date().toISOString(),
        updatedBy: user.name,
        message: `User mengubah target penyelesaian menjadi ${new Date(newTargetDate).toLocaleString('id-ID')}`
      };
      await updateDoc(doc(db, "requests", id), { 
        targetSelesai: targetISO,
        logs: arrayUnion(logEntry)
      });
      setEditingId(null);
      setNewTargetDate("");
      mgmNotify.success("Target updated.");
    } catch (error) { 
      mgmNotify.error("Failed to update target."); 
    }
  };

  const handleValidasi = async (id) => {
    const result = await mgmNotify.confirm("VALIDATION", "Konfirmasi bahwa pekerjaan telah selesai sesuai standar.");
    if (result.isConfirmed) {
      try {
        const now = new Date().toISOString();
        const logEntry = {
          status: 'sudah divalidasi user',
          timestamp: now,
          updatedBy: user.name,
          message: "User memvalidasi hasil pekerjaan."
        };
        await updateDoc(doc(db, "requests", id), { 
          status: 'sudah divalidasi user',
          logs: arrayUnion(logEntry),
          closedAt: now 
        });
        mgmNotify.success("Task archived.");
      } catch (error) { 
        mgmNotify.error("Error validation."); 
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-1 bg-gray-100 overflow-hidden mb-4">
        <div className="w-full h-full bg-[#1e4890] animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
      <p className="text-[8px] font-black text-gray-900 uppercase tracking-[0.5em]">MGM.OS SYNCING</p>
    </div>
  );

  return (
    <div className="bg-[#f3f4f6] min-h-screen p-4 md:p-10 font-sans selection:bg-[#1e4890]/10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#1e4890] pb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1e4890] tracking-tighter italic uppercase leading-[0.8]">Status<br/><span className="text-[#00804D]">Monitor</span></h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00804D] rounded-full"></span> Asset Performance Tracking
            </p>
          </div>
          <div className="bg-[#9ef3c6a3] text-black px-6 py-4 rounded-tr-3xl rounded-bl-3xl shadow-xl border-l-8 border-[#00804D]">
            <p className="text-[8px] font-bold text-black uppercase tracking-widest mb-1">Authenticated</p>
            <p className="text-sm font-black italic tracking-tight">{user?.name} <span className="text-black/30 mx-1">/</span> {user?.dept}</p>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between mb-10 gap-4">
          <div className="flex bg-white p-1 rounded-2xl border-2 border-[#1e4890]/20 shadow-sm">
            <button 
              onClick={() => setIsTeamView(false)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isTeamView ? 'bg-[#1e4890] text-white shadow-lg' : 'text-gray-400 hover:text-[#1e4890]'}`}
            >
              My Request
            </button>
            <button 
              onClick={() => setIsTeamView(true)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isTeamView ? 'bg-[#1e4890] text-white shadow-lg' : 'text-gray-400 hover:text-[#1e4890]'}`}
            >
              Team {user?.dept}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase">Live Database</p>
                <p className="text-xl font-black text-[#1e4890]">{myRequests.length} <span className="text-[10px] text-gray-300">Entries</span></p>
             </div>
          </div>
        </div>

        {myRequests.length === 0 ? (
  <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-200">
    <div className="text-5xl mb-4 opacity-20 text-[#1e4890]">📊</div>
    <p className="text-gray-400 font-black uppercase tracking-widest text-sm italic">Queue is Empty</p>
  </div>
) : (
  /* PERUBAHAN DISINI: grid-cols-1 (mobile), md:grid-cols-2 (tablet), lg:grid-cols-4 (desktop) */
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {myRequests.map(req => {
      const isOwner = req.nik === user?.nik;
      const isEditable = isOwner && req.status !== 'sudah divalidasi user' && req.status !== 'sudah selesai';
      const isFinished = req.status === 'sudah divalidasi user';
      
      const requestDate = req.createdAt?.seconds 
        ? new Date(req.createdAt.seconds * 1000).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Pending';

      return (
        /* Padding dikurangi dari p-8 menjadi p-6 agar konten tidak terlalu sesak */
        <div key={req.id} className={`group bg-white rounded-[2rem] border-2 border-transparent hover:border-[#1e4890]/30 transition-all duration-500 flex flex-col relative overflow-hidden shadow-sm hover:shadow-2xl ${isFinished ? 'opacity-60 grayscale' : ''}`}>
          
          <div className={`absolute top-0 right-6 h-10 w-6 ${req.prioritas === 'mendesak' ? 'bg-red-600' : 'bg-[#1e4890]'} clip-path-label shadow-lg`}></div>

          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-300 tabular-nums uppercase tracking-tighter italic">ID-{req.id.substring(0, 8).toUpperCase()}</span>
                 <span className="text-[7px] font-bold text-[#1e4890] uppercase tracking-widest mt-0.5">{requestDate}</span>
              </div>
            </div>

            {/* Ukuran font judul dikurangi dari text-xl menjadi text-lg */}
            <h3 className="text-lg font-black text-[#1e4890] uppercase tracking-tighter mb-3 leading-tight group-hover:text-[#00804D] transition-colors">{req.tipe}</h3>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              {req.idMesin && (
                <span className="bg-[#00804D] text-white px-2.5 py-0.5 rounded-full text-[8px] font-black italic tracking-tighter">
                  {req.idMesin}
                </span>
              )}
              <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-gray-200">
                {req.areaSpesifik || 'General'}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4 flex-1">
                <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">"{req.deskripsi}"</p>
            </div>

            <div className="mb-3 flex items-center gap-2 px-1">
                <div className="w-1 h-1 bg-[#1e4890] rounded-full"></div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">By: <span className="text-[#00804D]">{req.nama || 'Anon'}</span></p>
            </div>

            {/* Status badge sedikit lebih ramping */}
            <div className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-center mb-4 transition-all border-2 ${
              req.status === 'sudah divalidasi user' ? 'bg-gray-100 text-gray-400 border-transparent' :
              req.status === 'sudah selesai' ? 'bg-[#00804D]/10 text-[#00804D] border-[#00804D]/20 shadow-lg shadow-[#00804D]/10' :
              req.status === 'sedang dikerjakan' ? 'bg-[#1e4890]/10 text-[#1e4890] border-[#1e4890]/20' :
              'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {req.status}
            </div>

            {req.picId && (
              <div className="flex justify-between items-center px-1 mb-4">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">In Charge:</span>
                <span className="text-[9px] font-black text-[#1e4890] uppercase underline decoration-[#00804D] decoration-2 underline-offset-4">{req.picId}</span>
              </div>
            )}

            {isEditable && (
              <div className="mt-auto">
                {editingId === req.id ? (
                  <div className="space-y-2 animate-in fade-in zoom-in-95">
                    <input 
                      type="datetime-local" 
                      className="w-full text-[10px] font-black p-2 rounded-lg border-2 border-[#1e4890] outline-none"
                      onChange={(e) => setNewTargetDate(e.target.value)}
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleUpdateTarget(req.id)} className="flex-1 bg-[#1e4890] text-white text-[8px] font-black py-2 rounded-lg hover:bg-[#00804D]">SAVE</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-500 text-[8px] font-black py-2 rounded-lg">CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingId(req.id)} className="w-full py-2.5 border-2 border-[#1e4890]/10 rounded-xl text-[8px] font-black text-[#1e4890]/40 uppercase hover:bg-[#1e4890] hover:text-white transition-all italic tracking-widest">
                    ✎ Update Target
                  </button>
                )}
              </div>
            )}

            {req.targetSelesai && (
              <SlaTracker 
                targetDate={req.targetSelesai} 
                status={req.status} 
                closedAt={req.closedAt || req.updatedAt} 
              />
            )}
          </div>

          {req.status === 'sudah selesai' && isOwner && (
            <div className="p-6 bg-[#1e4890] mt-auto">
              <button 
                onClick={() => handleValidasi(req.id)}
                className="w-full bg-[#00804D] text-white text-[10px] font-black py-3 rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest italic"
              >
                VALIDATE
              </button>
            </div>
          )}
        </div>
      );
    })}
  </div>
)}
      </div>
      
      <style jsx>{`
        .clip-path-label {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}