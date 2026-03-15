// src/components/Navbar.js
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center border-b-2 border-red-600">
      <div className="flex items-center gap-3">
        {/* MENGGUNAKAN GAMBAR DARI /public/assets */}
        <Image 
          src="/assets/logo-mgm.png" // Path relatif dari folder 'public'
          alt="Logo Mercindo Global Manufaktur"
          width={50}  // Sesuaikan lebar
          height={50} // Sesuaikan tinggi
          className="object-contain"
        />
        <div className="flex flex-col">
          <span className="font-bold text-lg text-gray-800">MGM Service</span>
          <span className="text-xs text-gray-500">PT. Mercindo Global Manufaktur</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/" className="text-gray-600 hover:text-red-600">Dashboard</Link>
        {user ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {user.name?.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{user.name} ({user.role})</span>
          </div>
        ) : (
          <Link href="/login" className="bg-red-600 text-white px-4 py-1.5 rounded text-sm">Login</Link>
        )}
      </div>
    </nav>
  );
}