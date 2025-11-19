import React from 'react';

interface NavbarProps {
  title: string;
  onLogout: () => void;
  userName?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title, onLogout, userName }) => {
  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <div className="h-8 w-8 bg-yellow-500 rounded-md mr-3 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">Ş</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {userName && <span className="text-sm text-slate-300 hidden md:block">{userName}</span>}
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;