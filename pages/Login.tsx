import React, { useState } from 'react';
import { UserSession, Resident } from '../types';
import { THEME_CONFIG } from '../constants';

interface LoginProps {
  onLogin: (session: UserSession) => void;
  residents: Resident[];
}

const Login: React.FC<LoginProps> = ({ onLogin, residents }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'admin') {
      // Mock Admin Login
      if (username === 'admin' && password === 'admin') {
        onLogin({ isAuthenticated: true, role: 'admin' });
      } else {
        setError('Geçersiz yönetici bilgileri. Lütfen bilgilerinizi kontrol ediniz.');
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
          setError('Hatalı şifre. Lütfen tekrar deneyiniz.');
        }
      } else {
        setError('Daire bulunamadı. Lütfen daire numaranızı kontrol ediniz.');
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${THEME_CONFIG.backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="bg-white p-8 text-center border-b border-slate-100">
          <div className="flex justify-center mb-4">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Şengel Residence Logo" 
                className="h-24 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              /* Professional Fallback Logo */
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg mx-auto">
                 <span className="text-4xl font-serif font-bold text-white">Ş</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 font-serif">ŞENGEL RESIDENCE</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium uppercase tracking-wide">Site Yönetim Sistemi</p>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'user'
                ? 'text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50/50'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50'
            }`}
            onClick={() => { setActiveTab('user'); setError(''); setUsername(''); setPassword(''); }}
          >
            Sakin Girişi
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50/50'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50'
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
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  {activeTab === 'user' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'user' ? 'Örn: 1, 35, 120' : 'Kullanıcı Adı'}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              {activeTab === 'user' ? 'Giriş Yap' : 'Yönetim Paneline Git'}
            </button>
          </form>
          
          {activeTab === 'user' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Daire numaranızı girerek (Örn: 35) borç sorgulayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-4 text-white/40 text-xs z-10">
        &copy; {new Date().getFullYear()} Şengel Residence Yönetim Sistemi
      </div>
    </div>
  );
};

export default Login;