function CountdownTimer({ targetDate, status }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!targetDate || status === 'sudah selesai' || status === 'ditolak') {
      setTimeLeft("");
      return;
    }

    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsOverdue(true);
        setTimeLeft("TERLAMBAT");
        return;
      }

      setIsOverdue(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      let timeString = "";
      if (days > 0) timeString += `${days}h `;
      timeString += `${hours}j ${minutes}m`;
      setTimeLeft(timeString);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update setiap 1 menit

    return () => clearInterval(timer);
  }, [targetDate, status]);

  if (!targetDate) return <span className="text-[9px] text-gray-300 italic">BELUM DIATUR</span>;
  if (status === 'sudah selesai') return <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">COMPLETED</span>;
  if (status === 'ditolak') return <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">REJECTED</span>;

  return (
    <div className="flex flex-col items-center">
      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isOverdue ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
        {timeLeft}
      </span>
      <span className="text-[8px] text-gray-400 mt-1 uppercase">
        {new Date(targetDate).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}