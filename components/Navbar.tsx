import React from 'react';

interface NavbarProps {
  title: string;
  onLogout: () => void;
  userName?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title, onLogout, userName }) => {
  return (
    <nav className="bg-slate-900 text-white shadow-lg z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center">
            <img 
              src="/logo.png" 
              alt="Şengel Residence" 
              className="h-12 w-auto mr-4 object-contain bg-white/10 p-1 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('nav-logo-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Fallback Logo */}
            <div id="nav-logo-fallback" className="hidden h-10 w-10 bg-yellow-500 rounded-md mr-3 items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">Ş</span>
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-bold text-lg tracking-tight leading-tight text-yellow-500">ŞENGEL RESIDENCE</h1>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {userName && (
              <div className="hidden md:flex flex-col text-right mr-2">
                <span className="text-sm font-medium text-white">{userName}</span>
                <span className="text-xs text-slate-400">Aktif Kullanıcı</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="bg-slate-800 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border border-slate-700 hover:border-red-600"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;