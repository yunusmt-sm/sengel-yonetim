import React, { useState, useMemo } from 'react';
import { Resident, DebtBalance, ResidentWithDebt } from '../types';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface AdminDashboardProps {
  residents: ResidentWithDebt[];
  debtBalances: DebtBalance[];
  onUpdateResidents: (data: Resident[]) => void;
  onUpdateDebtBalances: (data: DebtBalance[]) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ residents, debtBalances, onUpdateResidents, onUpdateDebtBalances, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Phone Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [phoneInput, setPhoneInput] = useState('');

  // Edit Resident Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Resident>>({});

  // Residents already come with debt data, but we'll use them directly
  const residentsWithDebt = residents;

  // Calculate Statistics
  const stats = useMemo(() => {
    const totalDebt = debtBalances.reduce((acc, curr) => acc + (curr.debtBalance || 0), 0);
    const totalCredit = debtBalances.reduce((acc, curr) => acc + (curr.creditBalance || 0), 0);
    const debtorCount = debtBalances.filter(d => (d.debtBalance || 0) > 0).length;
    const creditorCount = debtBalances.filter(d => (d.creditBalance || 0) > 0).length;

    return { totalDebt, totalCredit, debtorCount, creditorCount };
  }, [debtBalances]);

  const filteredData = useMemo(() => {
    return residentsWithDebt.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.id.includes(searchTerm)
    );
  }, [searchTerm, residentsWithDebt]);

  const chartData = useMemo(() => {
    // Top 5 Debtors
    return [...residentsWithDebt]
      .sort((a, b) => (b.debtBalance || 0) - (a.debtBalance || 0))
      .slice(0, 5)
      .map(r => ({
        name: r.name.split(' ')[0] + ' ' + (r.name.split(' ')[1] || '').charAt(0) + '.',
        debt: r.debtBalance || 0
      }));
  }, [residentsWithDebt]);

  const pieData = [
    { name: 'Toplam Borçlu', value: stats.debtorCount },
    { name: 'Toplam Alacaklı', value: stats.creditorCount },
  ];
  const COLORS = ['#ef4444', '#22c55e'];

  const handleImport = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('Lütfen veri yapıştırın.');
      return;
    }

    try {
      const lines = importText.trim().split('\n');
      const updatedDebtBalancesMap = new Map<string, DebtBalance>();

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        let columns = line.split('\t');
        if (columns.length < 2) {
           columns = line.split(/\s{2,}/);
        }

        if (columns[0].includes('HESAP') || columns[0].includes('Dönem')) continue;

        if (columns.length >= 6) {
          const id = columns[0].trim();
          const name = columns[1].trim();
          
          const parseMoney = (val: string) => {
            if (!val) return 0;
            const clean = val.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
            return parseFloat(clean) || 0;
          };

          const totalDebit = parseMoney(columns[2]);
          const totalCredit = parseMoney(columns[3]);
          const debtBalance = parseMoney(columns[4]);
          const creditBalance = parseMoney(columns[5]);
          
          if (id && name) {
            const newDebtBalance: DebtBalance = {
              id,
              totalDebit,
              totalCredit,
              debtBalance,
              creditBalance,
            };
            updatedDebtBalancesMap.set(id, newDebtBalance);
          }
        }
      }

      if (updatedDebtBalancesMap.size === 0) {
        setImportError('Hiçbir geçerli veri satırı bulunamadı. Formatı kontrol edin.');
        return;
      }

      if (window.confirm(`${updatedDebtBalancesMap.size} adet borç bilgisi güncellenecek. Onaylıyor musunuz?`)) {
        // Merge with existing debt balances
        const updatedDebtBalances = debtBalances.map(existing => {
          const updated = updatedDebtBalancesMap.get(existing.id);
          return updated || existing;
        });

        // Add new debt balances that don't exist
        updatedDebtBalancesMap.forEach((newDebt, id) => {
          if (!debtBalances.find(d => d.id === id)) {
            updatedDebtBalances.push(newDebt);
          }
        });

        onUpdateDebtBalances(updatedDebtBalances);
        setShowImportModal(false);
        setImportText('');
      }

    } catch (err) {
      setImportError('Veri işlenirken hata oluştu. Formatı kontrol edin.');
      console.error(err);
    }
  };

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    let cleaned = input.replace(/\D/g, '');
    
    // If it starts with '0', remove it (0532... -> 532...)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If it doesn't start with '90' and looks like a local mobile (5xx), add '90'
    if (!cleaned.startsWith('90') && cleaned.length === 10) {
      cleaned = '90' + cleaned;
    }
    
    return cleaned;
  };

  const formatPhoneNumberDisplay = (phone?: string): string => {
    if (!phone) return '-';
    
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with '90', remove it for display
    if (cleaned.startsWith('90') && cleaned.length >= 12) {
      cleaned = '0' + cleaned.substring(2);
    }
    
    // Format Turkish phone number: 0XXX XXX XX XX
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9, 11)}`;
    }
    
    // If it's 10 digits without leading 0, add 0
    if (cleaned.length === 10) {
      return `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    }
    
    // Return as is if doesn't match expected format
    return phone;
  };

  const openWhatsAppDirectly = (resident: ResidentWithDebt, phone: string, isOwnerMessage: boolean = false) => {
    const amount = (resident.debtBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    let messageText = '';
    
    if (isOwnerMessage && resident.ownerName) {
      // Ev sahibine gönderilecek mesaj
      messageText = `Sayın ${resident.ownerName},\n\nŞengel Residence Yönetimi olarak hatırlatmadır.\n${resident.name} (${resident.id}) numaralı dairenin ${new Date().toLocaleDateString('tr-TR')} tarihi itibariyle toplam *${amount} TL* borcu bulunmaktadır.\n\nLütfen ödemenizi en kısa sürede yapınız.\nIyi günler dileriz.`;
    } else {
      // Kiracıya gönderilecek mesaj
      messageText = `Sayın ${resident.name},\n\nŞengel Residence Yönetimi olarak hatırlatmadır.\n${new Date().toLocaleDateString('tr-TR')} tarihi itibariyle toplam *${amount} TL* borcunuz bulunmaktadır.\n\nLütfen ödemenizi en kısa sürede yapınız.\nIyi günler dileriz.`;
    }
    
    const encodedMessage = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleWhatsAppClick = (resident: ResidentWithDebt) => {
    if (resident.phone) {
      const formatted = formatPhoneNumber(resident.phone);
      openWhatsAppDirectly(resident, formatted, false);
    } else {
      openPhoneModal(resident);
    }
  };

  const handleOwnerWhatsAppClick = (resident: ResidentWithDebt) => {
    if (resident.ownerPhone) {
      const formatted = formatPhoneNumber(resident.ownerPhone);
      openWhatsAppDirectly(resident, formatted, true);
    } else {
      alert('Ev sahibi telefon numarası bulunamadı. Lütfen önce ev sahibi bilgilerini düzenleyin.');
    }
  };

  const openPhoneModal = (resident: ResidentWithDebt) => {
    setEditingResident(resident);
    setPhoneInput(resident.phone || '');
    setShowPhoneModal(true);
  };

  const handleSavePhoneAndSend = () => {
    if (!editingResident) return;

    const formattedPhone = formatPhoneNumber(phoneInput);

    if (formattedPhone.length < 10) {
      alert('Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }

    // Update Data
    const updatedResidents = residents.map(r => 
      r.id === editingResident.id ? { ...r, phone: formattedPhone } : r
    );
    onUpdateResidents(updatedResidents);
    
    // Send Message immediately
    const updatedResident = { ...editingResident, phone: formattedPhone };
    openWhatsAppDirectly(updatedResident, formattedPhone);

    setShowPhoneModal(false);
  };

  // Password Reset Functions
  const handleResetPassword = (resident: ResidentWithDebt) => {
    if (window.confirm(`${resident.name} için şifreyi '1234' olarak sıfırlamak istediğinize emin misiniz?`)) {
      const updatedResidents = residents.map(r => 
        r.id === resident.id ? { ...r, password: '1234' } : r
      );
      onUpdateResidents(updatedResidents);
      alert('Şifre başarıyla sıfırlandı.');
    }
  };

  // Edit Resident Functions
  const openEditModal = (resident: ResidentWithDebt) => {
    setEditingResident(resident);
    setEditFormData({
      name: resident.name,
      phone: resident.phone,
      isOwner: resident.isOwner,
      ownerPhone: resident.ownerPhone,
      ownerName: resident.ownerName,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingResident) return;

    const updatedResident: Resident = {
      ...editingResident,
      name: editFormData.name || editingResident.name,
      phone: editFormData.phone,
      isOwner: editFormData.isOwner !== undefined ? editFormData.isOwner : editingResident.isOwner,
      ownerPhone: editFormData.ownerPhone,
      ownerName: editFormData.ownerName,
    };

    // If name or phone changed and isOwner is false, update owner info
    if (!updatedResident.isOwner) {
      if (editFormData.name && editFormData.name !== editingResident.name) {
        // If name changed, update ownerName if it was the same as the old name
        if (updatedResident.ownerName === editingResident.name) {
          updatedResident.ownerName = editFormData.name;
        }
      }
      if (editFormData.phone && editFormData.phone !== editingResident.phone) {
        // If phone changed, update ownerPhone if it was the same as the old phone
        if (updatedResident.ownerPhone === editingResident.phone) {
          updatedResident.ownerPhone = editFormData.phone;
        }
      }
    }

    const updatedResidents = residents.map(r => 
      r.id === editingResident.id ? updatedResident : r
    );
    onUpdateResidents(updatedResidents);
    setShowEditModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Navbar title="Yönetici Paneli" onLogout={onLogout} userName="Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
          <a
            href="/test-veri.csv"
            download="test-veri.csv"
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-2 rounded-lg shadow transition-all text-sm font-medium touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Örnek Dosya İndir</span>
            <span className="sm:hidden">Dosya İndir</span>
          </a>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 sm:py-2 rounded-lg shadow transition-all text-sm font-medium touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Excel'den Veri Yükle / Güncelle</span>
            <span className="sm:hidden">Veri Yükle</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard 
            title="Toplam Bekleyen Borç" 
            value={`₺${stats.totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} 
            color="red"
            subtext={`${stats.debtorCount} daire borçlu`}
          />
          <StatCard 
            title="Toplam Alacak Bakiyesi" 
            value={`₺${stats.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} 
            color="green"
            subtext={`${stats.creditorCount} daire alacaklı`}
          />
          <StatCard 
            title="Kayıtlı Daire" 
            value={residents.length.toString()} 
            color="blue"
            subtext="Aktif hesap sayısı"
          />
          <StatCard 
            title="Net Durum" 
            value={`₺${(stats.totalCredit - stats.totalDebt).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} 
            color={stats.totalCredit >= stats.totalDebt ? 'green' : 'red'}
            subtext="Kasa durumu tahmini"
          />
        </div>

        {/* Charts Row - Hidden on mobile */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4">En Yüksek Borcu Olan 5 Daire</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                  <Tooltip formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`} />
                  <Bar dataKey="debt" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Sakin Durum Dağılımı</h3>
             <div className="h-64 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col gap-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Sakin Listesi ve Bakiyeler</h3>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="İsim veya Hesap No Ara..."
                className="w-full pl-10 pr-4 py-3 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-3 sm:top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hesap Kodu</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hesap Adı</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Telefon</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Borç Bakiyesi</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Alacak Bakiyesi</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredData.length > 0 ? (
                  filteredData.map((resident) => (
                    <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{resident.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{resident.name}</div>
                        {!resident.isOwner && resident.ownerName && (
                          <div className="text-xs text-slate-400 mt-1">
                            Sahibi: {resident.ownerName}
                            {resident.ownerPhone && <span className="ml-1">({formatPhoneNumberDisplay(resident.ownerPhone)})</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {resident.phone ? (
                          <div className="text-sm font-semibold text-blue-600">{formatPhoneNumberDisplay(resident.phone)}</div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                        {(resident.debtBalance || 0) > 0 ? `₺${(resident.debtBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                        {(resident.creditBalance || 0) > 0 ? `₺${(resident.creditBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2 flex-wrap gap-1">
                          <button
                            onClick={() => openEditModal(resident)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors touch-manipulation"
                            title="Düzenle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleResetPassword(resident)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors touch-manipulation"
                            title="Şifreyi Sıfırla (1234)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                          {(resident.debtBalance || 0) > 0 && (
                            <>
                              {resident.phone ? (
                                <button
                                  onClick={() => handleWhatsAppClick(resident)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-full transition-colors shadow-sm touch-manipulation"
                                  title="WhatsApp ile Borç Bildirimi Gönder"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.537 2.051.82 3.174.821h.001c3.244.001 5.884-2.64 5.885-5.925.001-1.581-.615-3.067-1.734-4.186-1.118-1.118-2.604-1.735-4.176-1.735zm12 5.765c0 6.578-5.421 12-12.029 12-2.103 0-4.095-.537-5.853-1.477l-6.15 1.613 1.641-5.997c-1.048-1.786-1.603-3.849-1.6-5.983 0-6.578 5.422-12 12.032-12 3.214 0 6.236 1.252 8.509 3.525 2.273 2.273 3.525 5.295 3.526 8.509z"/>
                                  </svg>
                                  Bildir
                                </button>
                              ) : (
                                <button
                                  onClick={() => openPhoneModal(resident)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-medium rounded-full transition-colors touch-manipulation"
                                >
                                  + Numara Ekle
                                </button>
                              )}
                              {!resident.isOwner && resident.ownerPhone && (
                                <button
                                  onClick={() => handleOwnerWhatsAppClick(resident)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-full transition-colors shadow-sm touch-manipulation"
                                  title="Ev Sahibine WhatsApp ile Borç Bildirimi Gönder"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.537 2.051.82 3.174.821h.001c3.244.001 5.884-2.64 5.885-5.925.001-1.581-.615-3.067-1.734-4.186-1.118-1.118-2.604-1.735-4.176-1.735zm12 5.765c0 6.578-5.421 12-12.029 12-2.103 0-4.095-.537-5.853-1.477l-6.15 1.613 1.641-5.997c-1.048-1.786-1.603-3.849-1.6-5.983 0-6.578 5.422-12 12.032-12 3.214 0 6.236 1.252 8.509 3.525 2.273 2.273 3.525 5.295 3.526 8.509z"/>
                                  </svg>
                                  Ev Sahibine
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      Aradığınız kriterlere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-200">
            {filteredData.length > 0 ? (
              filteredData.map((resident) => (
                <div key={resident.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-500 mb-1">Hesap Kodu</div>
                      <div className="text-sm font-bold text-slate-900 mb-2">{resident.id}</div>
                      <div className="text-sm font-semibold text-slate-800">{resident.name}</div>
                      {!resident.isOwner && resident.ownerName && (
                        <div className="text-xs text-slate-400 mt-1">
                          Sahibi: {resident.ownerName}
                          {resident.ownerPhone && <span className="ml-1">({formatPhoneNumberDisplay(resident.ownerPhone)})</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => openEditModal(resident)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                        title="Düzenle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleResetPassword(resident)}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors touch-manipulation"
                        title="Şifreyi Sıfırla"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {resident.phone && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-slate-500 mb-1">Telefon</div>
                      <div className="text-sm font-bold text-blue-600">{formatPhoneNumberDisplay(resident.phone)}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">Borç</div>
                      <div className={`text-sm font-bold ${(resident.debtBalance || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {(resident.debtBalance || 0) > 0 ? `₺${(resident.debtBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">Alacak</div>
                      <div className={`text-sm font-bold ${(resident.creditBalance || 0) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {(resident.creditBalance || 0) > 0 ? `₺${(resident.creditBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </div>
                    </div>
                  </div>

                  {(resident.debtBalance || 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {resident.phone ? (
                        <button
                          onClick={() => handleWhatsAppClick(resident)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm touch-manipulation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.537 2.051.82 3.174.821h.001c3.244.001 5.884-2.64 5.885-5.925.001-1.581-.615-3.067-1.734-4.186-1.118-1.118-2.604-1.735-4.176-1.735zm12 5.765c0 6.578-5.421 12-12.029 12-2.103 0-4.095-.537-5.853-1.477l-6.15 1.613 1.641-5.997c-1.048-1.786-1.603-3.849-1.6-5.983 0-6.578 5.422-12 12.032-12 3.214 0 6.236 1.252 8.509 3.525 2.273 2.273 3.525 5.295 3.526 8.509z"/>
                          </svg>
                          Bildir
                        </button>
                      ) : (
                        <button
                          onClick={() => openPhoneModal(resident)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-sm font-medium rounded-lg transition-colors touch-manipulation"
                        >
                          + Numara Ekle
                        </button>
                      )}
                      {!resident.isOwner && resident.ownerPhone && (
                        <button
                          onClick={() => handleOwnerWhatsAppClick(resident)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm touch-manipulation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.537 2.051.82 3.174.821h.001c3.244.001 5.884-2.64 5.885-5.925.001-1.581-.615-3.067-1.734-4.186-1.118-1.118-2.604-1.735-4.176-1.735zm12 5.765c0 6.578-5.421 12-12.029 12-2.103 0-4.095-.537-5.853-1.477l-6.15 1.613 1.641-5.997c-1.048-1.786-1.603-3.849-1.6-5.983 0-6.578 5.422-12 12.032-12 3.214 0 6.236 1.252 8.509 3.525 2.273 2.273 3.525 5.295 3.526 8.509z"/>
                          </svg>
                          Ev Sahibine
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500">
                Aradığınız kriterlere uygun kayıt bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && editingResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Telefon Numarası</h3>
              <button onClick={() => setShowPhoneModal(false)} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                <span className="font-semibold text-slate-800">{editingResident?.name}</span> için WhatsApp bildirimlerinin gönderileceği numarayı giriniz.
              </p>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">TELEFON NUMARASI</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-lg tracking-wide"
                  placeholder="5XX XXX XX XX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">Başında 0 olmadan girebilirsiniz.</p>
              </div>
              
              <div className="flex space-x-3 pt-2">
                 <button 
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSavePhoneAndSend}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg shadow-green-200 transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.537 2.051.82 3.174.821h.001c3.244.001 5.884-2.64 5.885-5.925.001-1.581-.615-3.067-1.734-4.186-1.118-1.118-2.604-1.735-4.176-1.735zm12 5.765c0 6.578-5.421 12-12.029 12-2.103 0-4.095-.537-5.853-1.477l-6.15 1.613 1.641-5.997c-1.048-1.786-1.603-3.849-1.6-5.983 0-6.578 5.422-12 12.032-12 3.214 0 6.236 1.252 8.509 3.525 2.273 2.273 3.525 5.295 3.526 8.509z"/>
                  </svg>
                  Kaydet ve Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resident Modal */}
      {showEditModal && editingResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Sakin Bilgilerini Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">HESAP KODU</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingResident.id}
                  disabled
                />
                <p className="text-xs text-slate-400 mt-1">Hesap kodu değiştirilemez.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">İSİM *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">TELEFON NUMARASI</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="5XX XXX XX XX"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">Başında 0 olmadan girebilirsiniz.</p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    checked={editFormData.isOwner !== undefined ? editFormData.isOwner : editingResident.isOwner}
                    onChange={(e) => setEditFormData({ ...editFormData, isOwner: e.target.checked })}
                  />
                  <span className="text-sm text-slate-700">Sahibi mi?</span>
                </label>
              </div>

              {(!editFormData.isOwner && editFormData.isOwner !== undefined) || (!editingResident.isOwner && editFormData.isOwner === undefined) ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">SAHİP ADI</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editFormData.ownerName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">SAHİP TELEFON NUMARASI</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="5XX XXX XX XX"
                      value={editFormData.ownerPhone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, ownerPhone: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Veri Yükle / Güncelle</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4">
                Excel dosyanızdaki tabloyu (Başlıklar hariç) seçip kopyalayın ve aşağıdaki alana yapıştırın.
                <br/>
                <span className="text-xs text-slate-400">Beklenen Sütun Sırası: Hesap Kodu | Hesap Adı | Borç | Alacak | Borç Bakiyesi | Alacak Bakiyesi</span>
              </p>
              
              <textarea
                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={`Örn:\n131.001.001\tNAMIK KETHÜDA\t38.922,78\t40.374,64\t0\t1.451,86\n...`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              ></textarea>

              {importError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                  {importError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
              >
                Verileri İşle ve Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;