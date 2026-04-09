// src/components/ImageModal.js
import '@/styles/globals.css';

export default function ImageModal({ task, onClose }) {
  // Fungsi untuk mengubah link Google Drive menjadi link preview
  const getDrivePreview = (url) => {
    if (!url) return null;
    // Mengubah /view menjadi /preview agar bisa di-embed di iframe
    return url.replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800">Lampiran Foto: {task.tipe}</h3>
            <p className="text-xs text-gray-500">Oleh: {task.nama} ({task.bagian})</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold text-2xl">&times;</button>
        </div>
        
        <div className="relative h-[60vh] bg-gray-200">
          {task.fotoUrl ? (
            <iframe 
              src={getDrivePreview(task.fotoUrl)} 
              className="w-full h-full border-none"
              allow="autoplay"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Lampiran tidak ditemukan
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3">
          <a 
            href={task.fotoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
          >
            Buka di Google Drive Full
          </a>
          <button 
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-400"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}