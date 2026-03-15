// src/pages/_app.js
import '@/styles/globals.css'; // Pastikan Tailwind CSS sudah terinstall
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar statis di bagian atas */}
        <Navbar />
        
        {/* Konten halaman dinamis */}
        <main className="container mx-auto p-4 md:p-8">
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}