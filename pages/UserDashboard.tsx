import React, { useState } from 'react';
import { Resident, ResidentWithDebt } from '../types';
import Navbar from '../components/Navbar';
import { THEME_CONFIG } from '../constants';

interface UserDashboardProps {
  userData: ResidentWithDebt;
  onLogout: () => void;
  onUpdatePassword?: (newPassword: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userData, onLogout, onUpdatePassword }) => {
  const isInDebt = (userData.debtBalance || 0) > 0;
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = () => {
    setPasswordError('');
    
    if (!currentPassword) {
      setPasswordError('Mevcut şifrenizi giriniz.');
      return;
    }

    if (currentPassword !== userData.password) {
      setPasswordError('Mevcut şifre hatalı.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('Yeni şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (onUpdatePassword) {
      onUpdatePassword(newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      alert('Şifreniz başarıyla değiştirildi.');
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100 pb-10 relative">
      {/* Background Image with White Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none fixed"
        style={{
          backgroundImage: `url('${THEME_CONFIG.backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-slate-100/90"></div>
      </div>

      <Navbar title="Sakin Paneli" onLogout={onLogout} userName={userData.name} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-slate-200">
          <div className="bg-slate-900 px-6 py-8 md:px-10 md:py-10 text-white relative overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-yellow-500 rounded-full opacity-20 blur-2xl"></div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">Merhaba, {userData.name}</h2>
            <p className="opacity-80 relative z-10 font-mono text-yellow-400">Hesap No: {userData.id}</p>
          </div>
          
          {/* Main Balance Display */}
          <div className="p-6 md:p-10 text-center">
            <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold mb-2">
              {isInDebt ? 'GÜNCEL BORÇ DURUMU' : 'GÜNCEL ALACAK DURUMU'}
            </p>
            <div className={`text-4xl md:text-6xl font-bold mb-4 ${isInDebt ? 'text-red-600' : 'text-green-600'}`}>
              ₺{isInDebt 
                  ? (userData.debtBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) 
                  : (userData.creditBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                }
            </div>
            <p className="text-slate-600 max-w-lg mx-auto">
              {isInDebt 
                ? 'Lütfen gecikmiş aidat ve ödemelerinizi en kısa sürede yönetim hesabına yatırınız.'
                : 'Hesabınızda borç bulunmamaktadır. Gelecek dönem ödemeleriniz için alacak bakiyeniz mevcuttur.'
              }
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              Hesap Özeti
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-600">Toplam Tahakkuk (Borç)</span>
                <span className="font-semibold text-slate-900">₺{(userData.totalDebit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-600">Toplam Ödenen (Alacak)</span>
                <span className="font-semibold text-slate-900">₺{(userData.totalCredit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-800 font-medium">Net Bakiye</span>
                <span className={`font-bold ${isInDebt ? 'text-red-600' : 'text-green-600'}`}>
                   {isInDebt ? '-' : '+'} ₺{isInDebt ? (userData.debtBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : (userData.creditBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-yellow-100 text-yellow-600 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Bilgilendirme
            </h3>
            <div className="text-sm text-slate-600 space-y-3">
              <p>
                <span className="font-semibold text-slate-800">Ödeme Bilgileri:</span><br/>
                Ödemelerinizi yaparken açıklama kısmına <span className="font-mono bg-slate-100 px-1 rounded text-slate-800">{userData.id}</span> hesap kodunu mutlaka yazınız.
              </p>
              <p>
                <span className="font-semibold text-slate-800">İletişim:</span><br/>
                Sorularınız için yönetim ofisine 09:00 - 18:00 saatleri arasında ulaşabilirsiniz.
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              Hesap Ayarları
            </h3>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
            >
              Şifre Değiştir
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Şifre Değiştir</h3>
              <button onClick={() => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">MEVCUT ŞİFRE</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">YENİ ŞİFRE</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">En az 4 karakter olmalıdır.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">YENİ ŞİFRE (TEKRAR)</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                  {passwordError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
              >
                Şifreyi Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;