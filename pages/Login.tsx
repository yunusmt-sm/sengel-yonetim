import React, { useState } from 'react';
import { UserSession, Resident } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
  residents: Resident[];
}

const Login: React.FC<LoginProps> = ({ onLogin, residents }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'admin') {
      // Mock Admin Login
      if (username === 'admin' && password === 'admin') {
        onLogin({ isAuthenticated: true, role: 'admin' });
      } else {
        setError('Geçersiz yönetici bilgileri. (Demo: admin / admin)');
      }
    } else {
      // Resident Login logic
      // Kullanıcı sadece '35' girebilir, biz bunu 131.001.035 ile eşleştirmeliyiz.
      const inputId = username.trim();

      const resident = residents.find(r => {
        // 1. Tam eşleşme kontrolü (Eski usül veya tam kod girilirse)
        if (r.id === inputId) return true;

        // 2. Kısa kod kontrolü (Daire no)
        // Hesap kodu: 131.001.035 -> split('.') -> ["131", "001", "035"] -> son parça "035"
        const parts = r.id.split('.');
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          // Sayıya çevirerek karşılaştırıyoruz ki "035" ile "35" eşleşsin
          return parseInt(lastPart) === parseInt(inputId);
        }
        return false;
      });

      if (resident) {
        if (password === '1234') { // Default demo password
          onLogin({ isAuthenticated: true, role: 'user', userData: resident });
        } else {
          setError('Hatalı şifre. (Demo: 1234)');
        }
      } else {
        setError('Daire bulunamadı. Lütfen daire numaranızı kontrol ediniz.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500 mb-4">
            <span className="text-2xl font-bold text-slate-900">Ş</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Şengel Rezidans</h2>
          <p className="text-slate-400 mt-2 text-sm">Site Yönetim Sistemi</p>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'user'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setActiveTab('user'); setError(''); setUsername(''); setPassword(''); }}
          >
            Sakin Girişi
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setActiveTab('admin'); setError(''); setUsername(''); setPassword(''); }}
          >
            Yönetici Girişi
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {activeTab === 'user' ? 'Daire No' : 'Kullanıcı Adı'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeTab === 'user' ? 'Örn: 1, 35, 120' : 'admin'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {activeTab === 'user' ? 'Borç Sorgula' : 'Yönetim Paneline Git'}
            </button>
          </form>
          
          {activeTab === 'user' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Daire numaranızı girerek (Örn: 35) giriş yapabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;