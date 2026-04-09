import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Palet warna profesional MGM
const COLORS = ['#00804D', '#1e4890', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function GeneralReport() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [pics, setPics] = useState([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  // States untuk Filter dan View Mode
  const [filterPic, setFilterPic] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('day'); // Opsi: 'day', 'week', 'month'

  useEffect(() => {
    const AUTHORIZED = ["MGM 4329", "MGM 10619", "MGM 063"];
    if (user && !AUTHORIZED.includes(user.nik)) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    // Mengambil data request dengan urutan waktu
    const q = query(collection(db, "requests"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
      setLoading(false);
    });

    // Mengambil data PIC untuk dropdown
    const unsubPics = onSnapshot(collection(db, "pics"), (snapshot) => {
      setPics(snapshot.docs.map(doc => doc.data().name));
    });

    return () => { unsub(); unsubPics(); };
  }, []);

  // --- LOGIKA FILTER DATA ---
  const filteredData = data.filter(item => {
    const itemDate = item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : "";
    const matchPic = filterPic === 'all' || item.picId === filterPic;
    const matchDate = (!dateRange.start || itemDate >= dateRange.start) && 
                      (!dateRange.end || itemDate <= dateRange.end);
    return matchPic && matchDate;
  });

  // --- FUNGSI HELPER ONTIME ---
  const checkIsOntime = (item) => {
    if (!item.closedAt || !item.targetSelesai) return false;
    return new Date(item.closedAt) <= new Date(item.targetSelesai);
  };

  const calculateOntimeRate = (tasks) => {
    if (tasks.length === 0) return 0;
    const ontimeCount = tasks.filter(t => checkIsOntime(t)).length;
    return Math.round((ontimeCount / tasks.length) * 100);
  };

  // --- PENGOLAHAN DATA UNTUK GRAFIK ---

  // 1. Data Pie: Tipe Permintaan
  const typeStats = filteredData.reduce((acc, curr) => {
    acc[curr.tipe] = (acc[curr.tipe] || 0) + 1;
    return acc;
  }, {});
  const typeChartData = Object.keys(typeStats).map(name => ({ name, value: typeStats[name] }));

  // 2. Data Pie: Proporsi Bagian (Dept)
  const deptStats = filteredData.reduce((acc, curr) => {
    const d = curr.bagian || 'Lainnya';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const deptChartData = Object.keys(deptStats).map(name => ({ name, value: deptStats[name] }));

  // 3. Data Bar: Trend Berdasarkan ViewMode
  const trendData = filteredData.reduce((acc, curr) => {
    const dateObj = curr.createdAt?.toDate ? curr.createdAt.toDate() : new Date();
    let label = "";

    if (viewMode === 'day') {
      label = dateObj.toLocaleDateString('id-ID');
    } else if (viewMode === 'week') {
      const oneJan = new Date(dateObj.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((dateObj - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
      label = `W-${weekNum} (${dateObj.getFullYear()})`;
    } else {
      label = dateObj.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
    }

    if (!acc[label]) {
      acc[label] = { label, pending: 0, todo: 0, progress: 0, finishOntime: 0, finishLate: 0, sortKey: dateObj.getTime() };
    }
    
    const status = curr.status?.toLowerCase();
    const isFinished = status?.includes('finish') || status?.includes('validasi');
    
    if (status === 'pending') acc[label].pending++;
    else if (status === 'to do') acc[label].todo++;
    else if (status === 'sedang dikerjakan') acc[label].progress++;
    else if (isFinished) {
      if (checkIsOntime(curr)) acc[label].finishOntime++;
      else acc[label].finishLate++;
    }
    return acc;
  }, {});

  const trendChartData = Object.values(trendData).sort((a, b) => a.sortKey - b.sortKey);

  // 4. Performa PIC untuk Tabel
  const picPerformance = [...new Set(filteredData.map(d => d.picId).filter(Boolean))].map(pic => {
    const picTasks = filteredData.filter(d => d.picId === pic);
    const completed = picTasks.filter(t => t.status?.toLowerCase().includes('validasi')).length;
    return {
      name: pic,
      total: picTasks.length,
      rate: picTasks.length ? Math.round((completed / picTasks.length) * 100) : 0,
      ontime: calculateOntimeRate(picTasks)
    };
  });

  const exportPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MGM-Analytics-Report.pdf`);
  };

  if (loading) return <div className="p-10 text-center font-black italic">LOADING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* TOP CONTROL PANEL */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 no-print">
          <div className="flex flex-wrap justify-between items-center gap-6">
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                Analytical <span className="text-[#00804D]">Dashboard</span>
              </h1>
              <p className="text-[10px] font-bold text-[#1e4890] uppercase tracking-[0.2em]">PT. MGM Factory Performance</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Tanggal */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="text-[10px] font-bold bg-transparent outline-none" />
                <span className="text-[10px] font-black">-</span>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="text-[10px] font-bold bg-transparent outline-none" />
              </div>

              {/* Option Box: Sumbu X */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 px-3 uppercase italic">Scale:</span>
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="text-[10px] font-bold bg-white border-none rounded-xl px-4 py-1.5 text-[#00804D] shadow-sm outline-none">
                  <option value="day">Harian</option>
                  <option value="week">Mingguan</option>
                  <option value="month">Bulanan</option>
                </select>
              </div>

              <select onChange={(e) => setFilterPic(e.target.value)} className="text-[10px] font-bold p-2.5 px-5 rounded-2xl border border-slate-200 bg-white outline-none">
                <option value="all">SEMUA PIC</option>
                {pics.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <button onClick={exportPDF} className="bg-slate-900 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase italic hover:bg-[#00804D] transition-all shadow-lg">
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div ref={reportRef} className="flex flex-col gap-8">
          
          {/* STATS SUMMARY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <SummaryCard label="Total Request" value={filteredData.length} color="#1e4890" />
            <SummaryCard label="In Progress" value={filteredData.filter(d => d.status === 'sedang dikerjakan').length} color="#f59e0b" />
            <SummaryCard label="Success Validated" value={filteredData.filter(d => d.status?.toLowerCase().includes('validasi')).length} color="#00804D" />
            <SummaryCard label="Ontime Performance" value={`${calculateOntimeRate(filteredData)}%`} color="#00804D" />
          </div>

          {/* MAIN CHARTS GRID (1:1:2) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Pie 1: Tipe */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
              <h3 className="text-[11px] font-black uppercase italic mb-6 text-slate-500 tracking-wider">Tipe Permintaan</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeChartData} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}
                      label={({ value }) => `${value}`} labelLine={false}>
                      {typeChartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '15px' }} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '15px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie 2: Bagian */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
              <h3 className="text-[11px] font-black uppercase italic mb-6 text-slate-500 tracking-wider">Proporsi Bagian</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptChartData} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {deptChartData.map((e, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '15px' }} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '15px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar: Trend (SPAN 2 KOLOM) */}
            <div className="md:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="text-[11px] font-black uppercase italic mb-8 text-slate-500 tracking-wider">Trend Pekerjaan ({viewMode})</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: '800' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fontWeight: '800' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ fontSize: '9px', borderRadius: '12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                    
                    <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending">
                      <LabelList dataKey="pending" position="center" style={{ fill: '#64748b', fontSize: '8px', fontWeight: '900' }} formatter={(v) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="todo" stackId="a" fill="#1e4890" name="To Do">
                      <LabelList dataKey="todo" position="center" style={{ fill: '#fff', fontSize: '8px', fontWeight: '900' }} formatter={(v) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="progress" stackId="a" fill="#f59e0b" name="Progress">
                      <LabelList dataKey="progress" position="center" style={{ fill: '#fff', fontSize: '8px', fontWeight: '900' }} formatter={(v) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="finishOntime" stackId="a" fill="#00804D" name="Ontime">
                      <LabelList dataKey="finishOntime" position="center" style={{ fill: '#fff', fontSize: '8px', fontWeight: '900' }} formatter={(v) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="finishLate" stackId="a" fill="#ef4444" name="Late" radius={[5, 5, 0, 0]}>
                      <LabelList dataKey="finishLate" position="center" style={{ fill: '#fff', fontSize: '8px', fontWeight: '900' }} formatter={(v) => v > 0 ? v : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* PIC PERFORMANCE TABLE */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 className="text-[12px] font-black uppercase italic mb-6 text-slate-700">PIC Performance Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                    <th className="pb-4">Engineer Name</th>
                    <th className="pb-4 text-center">Total Tasks</th>
                    <th className="pb-4 text-center">Completion Rate</th>
                    <th className="pb-4 text-center">Ontime Rate</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold">
                  {picPerformance.map((pic, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 uppercase italic text-[#1e4890]">{pic.name}</td>
                      <td className="py-5 text-center">{pic.total}</td>
                      <td className="py-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1e4890]" style={{width: `${pic.rate}%`}}></div>
                          </div>
                          <span className="text-[10px] w-8">{pic.rate}%</span>
                        </div>
                      </td>
                      <td className="py-5 text-center text-[#00804D] font-black italic">{pic.ontime}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER APPROVAL */}
          <div className="flex justify-between items-end border-t border-slate-100 pt-8 mt-4">
             <div className="text-[9px] font-black text-slate-400 uppercase italic tracking-[0.3em]">
               System Generated Report • {new Date().toLocaleDateString('id-ID')}
             </div>
             <div className="text-right flex flex-col items-end">
                <p className="text-[11px] font-black uppercase italic text-slate-900 mb-12">Authorized by Management,</p>
                <div className="w-40 border-t-2 border-slate-900 pt-1 text-center">
                   <p className="text-[10px] font-black uppercase">MGM SUPERVISOR</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{label}</span>
      <span className="text-3xl font-black italic" style={{ color }}>{value}</span>
    </div>
  );
}