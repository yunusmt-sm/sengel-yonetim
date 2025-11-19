import React from 'react';
import { Resident } from '../types';
import Navbar from '../components/Navbar';

interface UserDashboardProps {
  userData: Resident;
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userData, onLogout }) => {
  const isInDebt = userData.debtBalance > 0;
  
  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Navbar title="Şengel Rezidans - Sakin Paneli" onLogout={onLogout} userName={userData.name} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-slate-900 px-6 py-8 md:px-10 md:py-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Merhaba, {userData.name}</h2>
            <p className="opacity-80">Hesap No: {userData.id}</p>
          </div>
          
          {/* Main Balance Display */}
          <div className="p-6 md:p-10 text-center">
            <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold mb-2">
              {isInDebt ? 'GÜNCEL BORÇ DURUMU' : 'GÜNCEL ALACAK DURUMU'}
            </p>
            <div className={`text-4xl md:text-6xl font-bold mb-4 ${isInDebt ? 'text-red-600' : 'text-green-600'}`}>
              ₺{isInDebt 
                  ? userData.debtBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) 
                  : userData.creditBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Hesap Özeti
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-600">Toplam Tahakkuk (Borç)</span>
                <span className="font-semibold text-slate-900">₺{userData.totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-600">Toplam Ödenen (Alacak)</span>
                <span className="font-semibold text-slate-900">₺{userData.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-800 font-medium">Net Bakiye</span>
                <span className={`font-bold ${isInDebt ? 'text-red-600' : 'text-green-600'}`}>
                   {isInDebt ? '-' : '+'} ₺{isInDebt ? userData.debtBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : userData.creditBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;