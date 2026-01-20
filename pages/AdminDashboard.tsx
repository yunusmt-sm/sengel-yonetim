import React, { useState, useMemo, useEffect } from 'react';
import { Resident, DebtBalance, ResidentWithDebt, MonthlyWarning, GasDebt } from '../types';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { WHATSAPP_MESSAGE_TEMPLATES } from '../constants';
import { uploadFile, getUploadedFiles, deleteFile, clearAllFiles, UploadedFile, getFileUrl, copyFileToClipboard, base64ToFile, createFileShareMessage, createFileOnlyMessage, uploadFileToHosting, createFileShareMessageWithLink, createFileOnlyMessageWithLink, setImgBBApiKey, getImgBBApiKey } from '../services/fileStorage';

interface AdminDashboardProps {
  residents: ResidentWithDebt[];
  debtBalances: DebtBalance[];
  monthlyWarnings: MonthlyWarning[];
  gasDebts: GasDebt[];
  lastUpdatedDate: string | null;
  onUpdateResidents: (data: Resident[]) => void;
  onUpdateDebtBalances: (data: DebtBalance[]) => void;
  onUpdateMonthlyWarnings: (data: MonthlyWarning[]) => void;
  onUpdateGasDebts: (data: GasDebt[]) => void;
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ residents, debtBalances, monthlyWarnings, gasDebts, lastUpdatedDate, onUpdateResidents, onUpdateDebtBalances, onUpdateMonthlyWarnings, onUpdateGasDebts, onRefreshData, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting State
  const [sortField, setSortField] = useState<'debtBalance' | 'creditBalance' | 'gasDebt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Gas Debt Import Modal State
  const [showGasImportModal, setShowGasImportModal] = useState(false);
  const [gasImportText, setGasImportText] = useState('');
  const [gasImportError, setGasImportError] = useState('');

  // Phone Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [phoneInput, setPhoneInput] = useState('');

  // Edit Resident Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Resident>>({});
  const [editDebtData, setEditDebtData] = useState<{
    totalDebit?: string;
    totalCredit?: string;
    debtBalance?: string;
    creditBalance?: string;
    gasDebt?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Message Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('standard');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Monthly Warning Edit Modal State
  const [showWarningEditModal, setShowWarningEditModal] = useState(false);
  const [editingWarningResident, setEditingWarningResident] = useState<ResidentWithDebt | null>(null);
  const [editingWarnings, setEditingWarnings] = useState<string[]>([]);

  // Reset All Debts Modal State
  const [showResetDebtsModal, setShowResetDebtsModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Refresh Data State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFileForWhatsApp, setSelectedFileForWhatsApp] = useState<UploadedFile | null>(null);
  const [imgbbApiKey, setImgbbApiKey] = useState<string>('');

  // Residents already come with debt data, but we'll use them directly
  const residentsWithDebt = residents;

  // Load uploaded files on mount
  useEffect(() => {
    setUploadedFiles(getUploadedFiles());
    // ImgBB API key'i yükle (varsayılan değer dahil)
    const savedApiKey = getImgBBApiKey();
    if (savedApiKey) {
      setImgbbApiKey(savedApiKey);
    }
  }, []);

  // Calculate Statistics
  const stats = useMemo(() => {
    const totalDebt = debtBalances.reduce((acc, curr) => acc + (curr.debtBalance || 0), 0);
    const totalCredit = debtBalances.reduce((acc, curr) => acc + (curr.creditBalance || 0), 0);
    const debtorCount = debtBalances.filter(d => (d.debtBalance || 0) > 0).length;
    const creditorCount = debtBalances.filter(d => (d.creditBalance || 0) > 0).length;
    const totalGasDebt = gasDebts.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const gasDebtorCount = gasDebts.filter(g => (g.amount || 0) > 0).length;

    return { totalDebt, totalCredit, debtorCount, creditorCount, totalGasDebt, gasDebtorCount };
  }, [debtBalances, gasDebts]);

  const filteredData = useMemo(() => {
    let filtered = residentsWithDebt.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.id.includes(searchTerm)
    );
    
    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number;
        let bValue: number;
        
        if (sortField === 'debtBalance') {
          aValue = a.debtBalance || 0;
          bValue = b.debtBalance || 0;
        } else if (sortField === 'creditBalance') {
          aValue = a.creditBalance || 0;
          bValue = b.creditBalance || 0;
        } else if (sortField === 'gasDebt') {
          aValue = a.gasDebt || 0;
          bValue = b.gasDebt || 0;
        } else {
          return 0;
        }
        
        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    
    return filtered;
  }, [searchTerm, residentsWithDebt, sortField, sortDirection]);
  
  const handleSort = (field: 'debtBalance' | 'creditBalance' | 'gasDebt') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

  const gasChartData = useMemo(() => {
    // Top 5 Gas Debtors
    return [...residentsWithDebt]
      .map(r => {
        const gasDebt = gasDebts.find(g => g.id === r.id);
        return {
          ...r,
          gasDebt: gasDebt?.amount || 0
        };
      })
      .sort((a, b) => (b.gasDebt || 0) - (a.gasDebt || 0))
      .slice(0, 5)
      .map(r => ({
        name: r.name.split(' ')[0] + ' ' + (r.name.split(' ')[1] || '').charAt(0) + '.',
        gasDebt: r.gasDebt || 0
      }));
  }, [residentsWithDebt, gasDebts]);

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
        // Görünmez karakterleri temizle (Excel'den kopyalama sorunları için)
        line = line.trim().replace(/\u00A0/g, ' ').replace(/\u2009/g, ' ');
        if (!line) continue;

        // Tab ile ayrılmış veri
        let columns = line.split('\t');
        
        // Eğer tab yoksa, boşluk ile ayır (en az 2 boşluk)
        if (columns.length < 2) {
          columns = line.split(/\s{2,}/);
          if (columns.length < 2) {
            // Son çare: normal boşluk ile ayır
            columns = line.split(/\s+/);
          }
        }

        // Başlık satırlarını atla
        const firstCol = columns[0]?.trim() || '';
        if (firstCol.includes('HESAP') || firstCol.includes('KODU') || firstCol.includes('Dönem') || firstCol === '') {
          continue;
        }

        // Yeni format: 6 kolon (ID, totalDebit, totalCredit, debtBalance, creditBalance, 0)
        if (columns.length >= 6) {
          let id = columns[0].trim().replace(/\u00A0/g, '').replace(/\u2009/g, '');
          
          // Hesap kodunu normalize et: 131.001.1 -> 131.001.001 formatına çevir
          const normalizeId = (rawId: string): string | null => {
            if (!rawId) return null;
            const match = rawId.match(/^(\d+)\.(\d+)\.(\d+)$/);
            if (!match) return null;
            const [, part1, part2, part3] = match;
            const normalizedPart3 = part3.padStart(3, '0');
            return `${part1}.${part2}.${normalizedPart3}`;
          };
          
          const normalizedId = normalizeId(id);
          if (!normalizedId) {
            continue; // Geçersiz format, atla
          }
          
          const parseMoney = (val: string) => {
            if (!val) return 0;
            // Hem virgül hem nokta ile ondalık ayırıcıyı destekle
            let clean = val.trim();
            
            // Eğer hem nokta hem virgül varsa, son kullanılan ondalık ayırıcıyı kullan
            const lastComma = clean.lastIndexOf(',');
            const lastDot = clean.lastIndexOf('.');
            
            if (lastComma > lastDot) {
              // Virgül ondalık ayırıcı (Türkçe format: 1.234,56)
              clean = clean.replace(/\./g, '').replace(',', '.');
            } else if (lastDot > lastComma) {
              // Nokta ondalık ayırıcı (İngilizce format: 1234.56)
              clean = clean.replace(/,/g, '');
            } else {
              // Sadece bir tane var veya hiç yok
              if (clean.includes(',')) {
                clean = clean.replace(/\./g, '').replace(',', '.');
              } else {
                clean = clean.replace(/,/g, '');
              }
            }
            
            clean = clean.replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(clean);
            return isNaN(parsed) ? 0 : parsed;
          };

          // Kolon sırası: 0=ID, 1=totalDebit, 2=totalCredit, 3=debtBalance, 4=creditBalance, 5=0 (atlanacak)
          const totalDebit = parseMoney(columns[1]);
          const totalCredit = parseMoney(columns[2]);
          const debtBalance = parseMoney(columns[3]);
          const creditBalance = parseMoney(columns[4]);
          
          const newDebtBalance: DebtBalance = {
            id: normalizedId,
            totalDebit,
            totalCredit,
            debtBalance,
            creditBalance,
          };
          updatedDebtBalancesMap.set(normalizedId, newDebtBalance);
        } else if (columns.length >= 5) {
          // Eski format desteği (5 kolon)
          let id = columns[0].trim().replace(/\u00A0/g, '').replace(/\u2009/g, '');
          const normalizeId = (rawId: string): string | null => {
            if (!rawId) return null;
            const match = rawId.match(/^(\d+)\.(\d+)\.(\d+)$/);
            if (!match) return null;
            const [, part1, part2, part3] = match;
            const normalizedPart3 = part3.padStart(3, '0');
            return `${part1}.${part2}.${normalizedPart3}`;
          };
          
          const normalizedId = normalizeId(id);
          if (!normalizedId) continue;
          
          const parseMoney = (val: string) => {
            if (!val) return 0;
            let clean = val.trim();
            const lastComma = clean.lastIndexOf(',');
            const lastDot = clean.lastIndexOf('.');
            if (lastComma > lastDot) {
              clean = clean.replace(/\./g, '').replace(',', '.');
            } else if (lastDot > lastComma) {
              clean = clean.replace(/,/g, '');
            } else {
              if (clean.includes(',')) {
                clean = clean.replace(/\./g, '').replace(',', '.');
              } else {
                clean = clean.replace(/,/g, '');
              }
            }
            clean = clean.replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(clean);
            return isNaN(parsed) ? 0 : parsed;
          };

          const totalDebit = parseMoney(columns[1]);
          const totalCredit = parseMoney(columns[2]);
          const debtBalance = parseMoney(columns[3]);
          const creditBalance = parseMoney(columns[4]);
          
          const newDebtBalance: DebtBalance = {
            id: normalizedId,
            totalDebit,
            totalCredit,
            debtBalance,
            creditBalance,
          };
          updatedDebtBalancesMap.set(normalizedId, newDebtBalance);
        }
      }
      
      // Debug: İlk birkaç kaydı logla
      console.log('Borç verisi import edildi:', {
        toplam: updatedDebtBalancesMap.size,
        ilk5: Array.from(updatedDebtBalancesMap.entries()).slice(0, 5).map(([id, db]) => ({ 
          id, 
          totalDebit: db.totalDebit, 
          totalCredit: db.totalCredit,
          debtBalance: db.debtBalance,
          creditBalance: db.creditBalance
        }))
      });

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

  const handleGasImport = () => {
    setGasImportError('');
    if (!gasImportText.trim()) {
      setGasImportError('Lütfen veri yapıştırın.');
      return;
    }

    try {
      const lines = gasImportText.trim().split('\n');
      const updatedGasDebtsArray: GasDebt[] = []; // Sırayı korumak için array kullan
      const updatedGasDebtsMap = new Map<string, GasDebt>(); // Hızlı arama için map

      for (let line of lines) {
        // Görünmez karakterleri temizle (Excel'den kopyalama sorunları için)
        line = line.trim().replace(/\u00A0/g, ' ').replace(/\u2009/g, ' '); // Non-breaking space ve diğer görünmez karakterler
        if (!line) continue;

        // Tab ile ayrılmış veri
        let columns = line.split('\t');
        
        // Eğer tab yoksa, boşluk ile ayır (en az 2 boşluk veya normal boşluk)
        if (columns.length < 2) {
          // Önce çoklu boşluk ile dene
          columns = line.split(/\s{2,}/);
          if (columns.length < 2) {
            // Sonra normal boşluk ile dene
            columns = line.split(/\s+/);
          }
        }

        // Başlık satırlarını atla
        const firstCol = columns[0]?.trim() || '';
        if (firstCol.includes('HESAP') || firstCol.includes('KODU') || firstCol === '') {
          // Eğer gerçek bir hesap kodu değilse atla
          if (!firstCol.match(/^\d+\.\d+\.\d+$/)) {
            continue;
          }
        }

        if (columns.length >= 2) {
          // Görünmez karakterleri temizle
          let id = columns[0].trim().replace(/\u00A0/g, '').replace(/\u2009/g, '');
          
          // Hesap kodunu normalize et: 131.001.1 -> 131.001.001 formatına çevir
          const normalizeId = (rawId: string): string | null => {
            if (!rawId) return null;
            
            // 131.001.1 veya 131.001.001 formatını kontrol et
            const match = rawId.match(/^(\d+)\.(\d+)\.(\d+)$/);
            if (!match) return null;
            
            const [, part1, part2, part3] = match;
            
            // Son kısmı 3 haneli yap (001, 002, ...)
            const normalizedPart3 = part3.padStart(3, '0');
            
            return `${part1}.${part2}.${normalizedPart3}`;
          };
          
          const normalizedId = normalizeId(id);
          if (!normalizedId) {
            // Geçersiz format, atla
            continue;
          }
          
          // İkinci kolondan sonraki tüm kolonları birleştir (TL kelimesi olabilir)
          const amountStr = columns.slice(1).join(' ').trim();
          
          const parseMoney = (val: string) => {
            if (!val) return 0;
            // TL kelimesini kaldır
            let clean = val.replace(/TL/gi, '').trim();
            // Türkçe format: 1.234,56 veya 1234,56
            // Noktaları kaldır (binlik ayırıcı), virgülü noktaya çevir
            clean = clean.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(clean);
            return isNaN(parsed) ? 0 : parsed;
          };

          const amount = parseMoney(amountStr);
          
          // Normalize edilmiş ID ile devam et
          const newGasDebt: GasDebt = {
            id: normalizedId,
            amount,
          };
          
          // Sırayı korumak için array'e ekle (eğer daha önce eklenmediyse)
          if (!updatedGasDebtsMap.has(normalizedId)) {
            updatedGasDebtsArray.push(newGasDebt);
            updatedGasDebtsMap.set(normalizedId, newGasDebt);
          } else {
            // Eğer aynı ID daha önce eklendiyse, son eklenen değeri kullan (sırayı koru)
            const existingIndex = updatedGasDebtsArray.findIndex(g => g.id === normalizedId);
            if (existingIndex !== -1) {
              updatedGasDebtsArray[existingIndex] = newGasDebt;
              updatedGasDebtsMap.set(normalizedId, newGasDebt);
            }
          }
        }
      }

      if (updatedGasDebtsArray.length === 0) {
        setGasImportError('Hiçbir geçerli veri satırı bulunamadı. Formatı kontrol edin. Örnek: 131.001.1	4.376,48 TL veya 131.001.001	4.376,48 TL\n\nNot: Hesap kodları otomatik olarak normalize edilir (131.001.1 -> 131.001.001)');
        return;
      }
      
      // Debug: İlk birkaç kaydı logla
      console.log('Doğalgaz borcu import edildi:', {
        toplam: updatedGasDebtsArray.length,
        ilk5: updatedGasDebtsArray.slice(0, 5).map(g => ({ id: g.id, amount: g.amount }))
      });

      if (window.confirm(`${updatedGasDebtsArray.length} adet doğalgaz borcu güncellenecek. Doğalgaz borcu borç bakiyesinden ayrı tutulacaktır. Onaylıyor musunuz?`)) {
        // Import edilen verilerin sırasını koru
        // Önce import edilen verileri sırasıyla ekle
        const allGasDebts: GasDebt[] = [];
        const processedIds = new Set<string>();
        
        // 1. Import edilen verileri sırasıyla ekle (sırayı koru)
        updatedGasDebtsArray.forEach(importedDebt => {
          allGasDebts.push(importedDebt);
          processedIds.add(importedDebt.id);
        });
        
        // 2. Mevcut residents'ları ekle (eğer import edilmediyse)
        residents.forEach(resident => {
          if (!processedIds.has(resident.id)) {
            const existing = gasDebts.find(g => g.id === resident.id);
            if (existing) {
              allGasDebts.push(existing);
            } else {
              allGasDebts.push({ id: resident.id, amount: 0 });
            }
            processedIds.add(resident.id);
          }
        });

        // Doğalgaz borcu ayrı tutulur, borç bakiyesine eklenmez
        // Borç bakiyesi = geçmiş aylardan gelen borçlar
        // Doğalgaz borcu = o aya ait ödenmesi gereken borçlar

        // Sadece doğalgaz borçlarını güncelle (borç bakiyesine dokunma)
        onUpdateGasDebts(allGasDebts).then(() => {
          setShowGasImportModal(false);
          setGasImportText('');
          setGasImportError('');
        }).catch((err) => {
          setGasImportError('Güncelleme sırasında hata oluştu: ' + (err instanceof Error ? err.message : String(err)));
          console.error('Update error:', err);
        });
      }

    } catch (err) {
      setGasImportError('Veri işlenirken hata oluştu. Formatı kontrol edin. Hata: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Gas import error:', err);
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

  const openWhatsAppDirectly = async (resident: ResidentWithDebt, phone: string, isOwnerMessage: boolean = false, file?: UploadedFile) => {
    const amount = (resident.debtBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const date = new Date().toLocaleDateString('tr-TR');
    
    // Seçili şablonu bul
    const selectedTemplate = WHATSAPP_MESSAGE_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_MESSAGE_TEMPLATES[0];
    
    // Mesajı oluştur
    const messageText = selectedTemplate.template(
      {
        name: resident.name,
        id: resident.id,
        ownerName: resident.ownerName
      },
      amount,
      date,
      isOwnerMessage
    );
    
    // Aylık uyarıyı kaydet (YYYY-MM formatında)
    const currentDate = new Date();
    const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Mevcut uyarı kaydını bul veya yeni oluştur
    const existingWarning = monthlyWarnings.find(w => w.id === resident.id);
    let updatedWarnings: MonthlyWarning[];
    
    if (existingWarning) {
      // Eğer bu ay için zaten uyarı varsa ekleme
      if (!existingWarning.warnings.includes(yearMonth)) {
        updatedWarnings = monthlyWarnings.map(w => 
          w.id === resident.id 
            ? { ...w, warnings: [...w.warnings, yearMonth] }
            : w
        );
      } else {
        updatedWarnings = monthlyWarnings;
      }
    } else {
      // Yeni uyarı kaydı oluştur
      updatedWarnings = [...monthlyWarnings, { id: resident.id, warnings: [yearMonth] }];
    }
    
    // Sadece değişiklik varsa güncelle
    if (updatedWarnings !== monthlyWarnings) {
      await onUpdateMonthlyWarnings(updatedWarnings);
    }
    
    // Eğer dosya varsa, dosyayı JSONBin'e yükle ve link al
    let finalMessage = messageText;
    if (file) {
      try {
        // Dosyayı JSONBin'e yükle
        const fileUrl = await uploadFileToHosting(file);
        // Link ile mesaj oluştur
        finalMessage = createFileShareMessageWithLink(messageText, fileUrl, file.name, file.type);
      } catch (error) {
        // Yükleme başarısız olursa, kullanıcıya bilgi ver
        console.error('File upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        alert(`⚠️ Dosya yükleme başarısız oldu!\n\nHata: ${errorMessage}\n\nLütfen dosyayı manuel olarak WhatsApp'tan gönderin.`);
        // Mesajı dosya olmadan gönder
        finalMessage = messageText;
      }
    }
    
    const encodedMessage = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleWhatsAppClick = (resident: ResidentWithDebt) => {
    if (resident.phone) {
      const formatted = formatPhoneNumber(resident.phone);
      openWhatsAppDirectly(resident, formatted, false, selectedFileForWhatsApp || undefined);
    } else {
      openPhoneModal(resident);
    }
  };

  const handleOwnerWhatsAppClick = (resident: ResidentWithDebt) => {
    if (resident.ownerPhone) {
      const formatted = formatPhoneNumber(resident.ownerPhone);
      openWhatsAppDirectly(resident, formatted, true, selectedFileForWhatsApp || undefined);
    } else {
      alert('Ev sahibi telefon numarası bulunamadı. Lütfen önce ev sahibi bilgilerini düzenleyin.');
    }
  };

  // Sadece dosya gönderme (mesaj olmadan)
  const handleSendFileOnly = async (phone: string) => {
    if (!selectedFileForWhatsApp) {
      alert('Lütfen önce bir dosya seçin.');
      return;
    }

    const formatted = formatPhoneNumber(phone);
    
    try {
      // Dosyayı JSONBin'e yükle
      const fileUrl = await uploadFileToHosting(selectedFileForWhatsApp);
      
      // Link ile mesaj oluştur
      const fileMessage = createFileOnlyMessageWithLink(fileUrl, selectedFileForWhatsApp.name, selectedFileForWhatsApp.type);
      const encodedMessage = encodeURIComponent(fileMessage);
      window.open(`https://wa.me/${formatted}?text=${encodedMessage}`, '_blank');
    } catch (error) {
      // Yükleme başarısız olursa, kullanıcıya bilgi ver
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`⚠️ Dosya yükleme başarısız oldu!\n\nHata: ${errorMessage}\n\nLütfen dosyayı manuel olarak WhatsApp'tan gönderin.`);
    }
  };

  // File upload handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const uploaded = await uploadFile(file);
      setUploadedFiles(getUploadedFiles());
      setSelectedFileForWhatsApp(uploaded); // Yeni yüklenen dosyayı otomatik seç
      e.target.value = ''; // Reset input
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Dosya yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      deleteFile(fileId);
      setUploadedFiles(getUploadedFiles());
      if (selectedFileForWhatsApp?.id === fileId) {
        setSelectedFileForWhatsApp(null);
      }
    }
  };

  const handleClearAllFiles = () => {
    if (confirm('Tüm dosyaları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      clearAllFiles();
      setUploadedFiles([]);
      setSelectedFileForWhatsApp(null);
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

  // Format number to Turkish format (1.234,56)
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '';
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse Turkish formatted number to number
  const parseNumber = (value: string | undefined): number => {
    if (!value || value.trim() === '') return 0;
    // Remove all dots (thousand separators) and replace comma with dot
    const cleaned = value.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Format input value as user types
  const formatInputValue = (value: string): string => {
    // Remove all non-numeric characters except comma and dot
    let cleaned = value.replace(/[^0-9,.-]/g, '');
    
    // Only allow one decimal separator (comma for Turkish)
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // If user types dot, convert to comma
    cleaned = cleaned.replace(/\./g, ',');
    
    // Only allow one comma
    const commaIndex = cleaned.indexOf(',');
    if (commaIndex !== -1) {
      cleaned = cleaned.substring(0, commaIndex + 1) + cleaned.substring(commaIndex + 1).replace(/,/g, '');
    }
    
    // Limit decimal places to 2
    if (commaIndex !== -1) {
      const decimalPart = cleaned.substring(commaIndex + 1);
      if (decimalPart.length > 2) {
        cleaned = cleaned.substring(0, commaIndex + 1) + decimalPart.substring(0, 2);
      }
    }
    
    // Add thousand separators (dots)
    if (commaIndex !== -1) {
      const integerPart = cleaned.substring(0, commaIndex);
      const decimalPart = cleaned.substring(commaIndex);
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return formattedInteger + decimalPart;
    } else {
      return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
    // Get debt balance data and format it
    const debtBalance = debtBalances.find(d => d.id === resident.id);
    const gasDebt = gasDebts.find(g => g.id === resident.id);
    setEditDebtData({
      totalDebit: formatNumber(debtBalance?.totalDebit),
      totalCredit: formatNumber(debtBalance?.totalCredit),
      debtBalance: formatNumber(debtBalance?.debtBalance),
      creditBalance: formatNumber(debtBalance?.creditBalance),
      gasDebt: formatNumber(gasDebt?.amount),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingResident || isSaving) return;

    try {
      setIsSaving(true);

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

      // Update debt balance data
      const updatedDebtBalance: DebtBalance = {
        id: editingResident.id,
        totalDebit: parseNumber(editDebtData.totalDebit),
        totalCredit: parseNumber(editDebtData.totalCredit),
        debtBalance: parseNumber(editDebtData.debtBalance),
        creditBalance: parseNumber(editDebtData.creditBalance),
      };

      const existingDebtBalance = debtBalances.find(d => d.id === editingResident.id);
      let updatedDebtBalances: DebtBalance[];
      
      if (existingDebtBalance) {
        updatedDebtBalances = debtBalances.map(d => 
          d.id === editingResident.id ? updatedDebtBalance : d
        );
      } else {
        updatedDebtBalances = [...debtBalances, updatedDebtBalance];
      }

      // Update gas debt data
      const updatedGasDebt: GasDebt = {
        id: editingResident.id,
        amount: parseNumber(editDebtData.gasDebt) || 0,
      };

      const existingGasDebt = gasDebts.find(g => g.id === editingResident.id);
      let updatedGasDebts: GasDebt[];
      
      if (existingGasDebt) {
        updatedGasDebts = gasDebts.map(g => 
          g.id === editingResident.id ? updatedGasDebt : g
        );
      } else {
        updatedGasDebts = [...gasDebts, updatedGasDebt];
      }

      // Update all in parallel
      await Promise.all([
        onUpdateResidents(residents.map(r => 
          r.id === editingResident.id ? updatedResident : r
        )),
        onUpdateDebtBalances(updatedDebtBalances),
        onUpdateGasDebts(updatedGasDebts)
      ]);

      setShowEditModal(false);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllDebts = async () => {
    setIsResetting(true);
    try {
      // Reset all debt balances to zero
      const resetDebtBalances = debtBalances.map(db => ({
        ...db,
        totalDebit: 0,
        totalCredit: 0,
        debtBalance: 0,
        creditBalance: 0,
      }));

      // Reset all gas debts to zero
      const resetGasDebts = gasDebts.map(gd => ({
        ...gd,
        amount: 0,
      }));

      // Update both in parallel
      await Promise.all([
        onUpdateDebtBalances(resetDebtBalances),
        onUpdateGasDebts(resetGasDebts),
      ]);

      setShowResetDebtsModal(false);
      alert('Tüm borçlar başarıyla sıfırlandı.');
    } catch (error) {
      console.error('Borç sıfırlama hatası:', error);
      alert('Borçları sıfırlarken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Navbar title="Yönetici Paneli" onLogout={onLogout} userName="Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await onRefreshData();
              } catch (error) {
                console.error('Refresh error:', error);
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 sm:py-2 rounded-lg shadow transition-all text-sm font-medium touch-manipulation"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Yenileniyor...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">JSONBin'den Yenile</span>
                <span className="sm:hidden">Yenile</span>
              </>
            )}
          </button>
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
          <button 
            onClick={() => setShowGasImportModal(true)}
            className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 sm:py-2 rounded-lg shadow transition-all text-sm font-medium touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Doğalgaz Borcu Yükle</span>
            <span className="sm:hidden">Doğalgaz</span>
          </button>
          <button 
            onClick={() => setShowResetDebtsModal(true)}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-3 sm:py-2 rounded-lg shadow transition-all text-sm font-medium touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Tüm Borçları Sıfırla</span>
            <span className="sm:hidden">Sıfırla</span>
          </button>
          <button 
            onClick={() => setShowFileModal(true)}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 sm:py-2 rounded-lg shadow transition-all text-sm font-medium touch-manipulation relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="hidden sm:inline">Dosya Yükle</span>
            <span className="sm:hidden">Dosya</span>
            {uploadedFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {uploadedFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
          <StatCard 
            title="Toplam Bekleyen Doğalgaz Borcu" 
            value={`₺${stats.totalGasDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} 
            color="orange"
            subtext={`${stats.gasDebtorCount} daire doğalgaz borçlu`}
          />
        </div>

        {/* Last Updated Date Info */}
        {lastUpdatedDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-blue-900">Veri Güncelleme Tarihi</span>
            </div>
            <p className="text-sm text-blue-800 mb-1">
              <strong>Yüklenme Tarihi:</strong> {new Date(lastUpdatedDate).toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-xs text-blue-700 italic">
              Bu tarihten sonra yapılan ödemeler borçlardan düşecektir.
            </p>
          </div>
        )}

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

        {/* Gas Debt Chart Row - Hidden on mobile */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4">En Yüksek Doğalgaz Borcu Olan 5 Daire</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gasChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                  <Tooltip formatter={(value: number) => `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} />
                  <Bar dataKey="gasDebt" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20}>
                    {gasChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#f97316" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Doğalgaz Borcu Özeti</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ₺{stats.totalGasDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-slate-600">Toplam Doğalgaz Borcu</p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Borçlu Daire Sayısı</span>
                  <span className="text-lg font-bold text-slate-800">{stats.gasDebtorCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Ortalama Borç</span>
                  <span className="text-lg font-bold text-slate-800">
                    ₺{stats.gasDebtorCount > 0 
                      ? (stats.totalGasDebt / stats.gasDebtorCount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                      : '0,00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Sakin Listesi ve Bakiyeler</h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial sm:min-w-[220px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Mesaj Şablonu</label>
                  <div className="relative">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white touch-manipulation appearance-none cursor-pointer"
                    >
                      {WHATSAPP_MESSAGE_TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <button
                    onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 touch-manipulation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {showTemplatePreview ? 'Önizlemeyi Gizle' : 'Önizle'}
                  </button>
                </div>
                <div className="relative flex-1 sm:flex-initial sm:min-w-[220px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    WhatsApp'a Eklenecek Dosya {selectedFileForWhatsApp && <span className="text-green-600">(Seçili)</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFileForWhatsApp?.id || ''}
                      onChange={(e) => {
                        const file = uploadedFiles.find(f => f.id === e.target.value);
                        setSelectedFileForWhatsApp(file || null);
                      }}
                      className="w-full px-3 py-2.5 sm:py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm bg-white touch-manipulation appearance-none cursor-pointer"
                    >
                      <option value="">Dosya seçilmedi</option>
                      {uploadedFiles.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </option>
                      ))}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {uploadedFiles.length === 0 && (
                    <button
                      onClick={() => setShowFileModal(true)}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 touch-manipulation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Dosya Yükle
                    </button>
                  )}
                </div>
              </div>
            </div>
            {showTemplatePreview && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">Mesaj Önizlemesi</h4>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => {
                        const selectedTemplate = WHATSAPP_MESSAGE_TEMPLATES.find(t => t.id === selectedTemplateId);
                        if (selectedTemplate) {
                          const exampleResident = { name: 'Örnek Kiracı', id: '131.001.001', ownerName: 'Örnek Ev Sahibi' };
                          const exampleAmount = '1.500,00';
                          const exampleDate = new Date().toLocaleDateString('tr-TR');
                          const previewText = selectedTemplate.template(exampleResident, exampleAmount, exampleDate, false);
                          navigator.clipboard.writeText(previewText);
                          alert('Mesaj kopyalandı!');
                        }
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors touch-manipulation"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 mb-2">Kiracıya Gönderilecek Mesaj:</div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-green-50 p-3 rounded border border-green-200">
                      {(() => {
                        const selectedTemplate = WHATSAPP_MESSAGE_TEMPLATES.find(t => t.id === selectedTemplateId);
                        if (selectedTemplate) {
                          const exampleResident = { name: 'Örnek Kiracı', id: '131.001.001', ownerName: 'Örnek Ev Sahibi' };
                          const exampleAmount = '1.500,00';
                          const exampleDate = new Date().toLocaleDateString('tr-TR');
                          return selectedTemplate.template(exampleResident, exampleAmount, exampleDate, false);
                        }
                        return '';
                      })()}
                    </div>
                    <div className="text-xs font-medium text-slate-500 mb-2 mt-4">Ev Sahibine Gönderilecek Mesaj:</div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-blue-50 p-3 rounded border border-blue-200">
                      {(() => {
                        const selectedTemplate = WHATSAPP_MESSAGE_TEMPLATES.find(t => t.id === selectedTemplateId);
                        if (selectedTemplate) {
                          const exampleResident = { name: 'Örnek Kiracı', id: '131.001.001', ownerName: 'Örnek Ev Sahibi' };
                          const exampleAmount = '1.500,00';
                          const exampleDate = new Date().toLocaleDateString('tr-TR');
                          return selectedTemplate.template(exampleResident, exampleAmount, exampleDate, true);
                        }
                        return '';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  <th scope="col" className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleSort('debtBalance')}
                      className="flex items-center justify-end gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors w-full"
                    >
                      Borç Bakiyesi
                      {sortField === 'debtBalance' ? (
                        sortDirection === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleSort('creditBalance')}
                      className="flex items-center justify-end gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors w-full"
                    >
                      Alacak Bakiyesi
                      {sortField === 'creditBalance' ? (
                        sortDirection === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('gasDebt')}
                      className="flex items-center justify-end space-x-1 hover:text-blue-600 transition-colors w-full"
                      title="Doğalgaz Borcu ile Sırala"
                    >
                      <span>Doğalgaz Borcu</span>
                      {sortField === 'gasDebt' ? (
                        sortDirection === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </button>
                  </th>
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
                        {/* Monthly Warning Squares */}
                        {(() => {
                          const residentWarning = monthlyWarnings.find(w => w.id === resident.id);
                          const months = ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];
                          const currentDate = new Date();
                          const currentMonth = currentDate.getMonth();
                          
                          // Son 12 ayı oluştur
                          const last12Months: string[] = [];
                          for (let i = 11; i >= 0; i--) {
                            const date = new Date(currentDate.getFullYear(), currentMonth - i, 1);
                            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                            last12Months.push(yearMonth);
                          }
                          
                          return (
                            <div className="flex items-center gap-1 mt-2">
                              <div className="flex items-center gap-0.5">
                                {last12Months.map((yearMonth) => {
                                  const hasWarning = residentWarning?.warnings.includes(yearMonth) || false;
                                  return (
                                    <div
                                      key={yearMonth}
                                      className={`w-3 h-3 rounded border ${
                                        hasWarning 
                                          ? 'bg-red-500 border-red-600' 
                                          : 'bg-slate-100 border-slate-200'
                                      }`}
                                      title={yearMonth}
                                    />
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingWarningResident(resident);
                                  setEditingWarnings(residentWarning?.warnings || []);
                                  setShowWarningEditModal(true);
                                }}
                                className="ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Uyarı Geçmişini Düzenle"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          );
                        })()}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600 text-right">
                        {(() => {
                          const gasDebt = gasDebts.find(g => g.id === resident.id);
                          return gasDebt && gasDebt.amount > 0 
                            ? `₺${gasDebt.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` 
                            : '-';
                        })()}
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
                          {/* Sadece Dosya Gönder Butonu - Dosya seçildiğinde görünür */}
                          {selectedFileForWhatsApp && resident.phone && (
                            <button
                              onClick={() => handleSendFileOnly(resident.phone!)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-full transition-colors shadow-sm touch-manipulation"
                              title="Sadece Dosyayı Gönder (Mesaj Yok)"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              Dosya
                            </button>
                          )}
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
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
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
                      {/* Monthly Warning Squares - Mobile */}
                      {(() => {
                        const residentWarning = monthlyWarnings.find(w => w.id === resident.id);
                        const months = ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];
                        const currentDate = new Date();
                        const currentMonth = currentDate.getMonth();
                        
                        // Son 12 ayı oluştur
                        const last12Months: string[] = [];
                        for (let i = 11; i >= 0; i--) {
                          const date = new Date(currentDate.getFullYear(), currentMonth - i, 1);
                          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          last12Months.push(yearMonth);
                        }
                        
                        return (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs font-medium text-slate-500">Uyarı Geçmişi</div>
                              <button
                                onClick={() => {
                                  setEditingWarningResident(resident);
                                  setEditingWarnings(residentWarning?.warnings || []);
                                  setShowWarningEditModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Düzenle"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5 flex-wrap">
                              {last12Months.map((yearMonth) => {
                                const hasWarning = residentWarning?.warnings.includes(yearMonth) || false;
                                return (
                                  <div
                                    key={yearMonth}
                                    className={`w-3 h-3 rounded border ${
                                      hasWarning 
                                        ? 'bg-red-500 border-red-600' 
                                        : 'bg-slate-100 border-slate-200'
                                    }`}
                                    title={yearMonth}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
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

                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500 mb-1">Doğalgaz Borcu</div>
                    <div className={`text-sm font-bold ${(() => {
                      const gasDebt = gasDebts.find(g => g.id === resident.id);
                      return gasDebt && gasDebt.amount > 0 ? 'text-orange-600' : 'text-slate-400';
                    })()}`}>
                      {(() => {
                        const gasDebt = gasDebts.find(g => g.id === resident.id);
                        return gasDebt && gasDebt.amount > 0 
                          ? `₺${gasDebt.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` 
                          : '-';
                      })()}
                    </div>
                  </div>

                  {/* Sadece Dosya Gönder Butonu - Mobile - Dosya seçildiğinde görünür */}
                  {selectedFileForWhatsApp && resident.phone && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => handleSendFileOnly(resident.phone!)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm touch-manipulation"
                        title="Sadece Dosyayı Gönder (Mesaj Yok)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Dosya Gönder
                      </button>
                    </div>
                  )}
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

              {/* Debt Balance Section */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Borç ve Alacak Bilgileri</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">TOPLAM BORÇ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="0,00"
                      value={editDebtData.totalDebit || ''}
                      onChange={(e) => {
                        const formatted = formatInputValue(e.target.value);
                        setEditDebtData({ ...editDebtData, totalDebit: formatted });
                      }}
                    />
                    <p className="text-xs text-slate-400 mt-1">Toplam biriken borç</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">TOPLAM ALACAK</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="0,00"
                      value={editDebtData.totalCredit || ''}
                      onChange={(e) => {
                        const formatted = formatInputValue(e.target.value);
                        setEditDebtData({ ...editDebtData, totalCredit: formatted });
                      }}
                    />
                    <p className="text-xs text-slate-400 mt-1">Toplam ödenen tutar</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">BORÇ BAKİYESİ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50"
                      placeholder="0,00"
                      value={editDebtData.debtBalance || ''}
                      onChange={(e) => {
                        const formatted = formatInputValue(e.target.value);
                        setEditDebtData({ ...editDebtData, debtBalance: formatted });
                      }}
                    />
                    <p className="text-xs text-slate-400 mt-1">Ödenmesi gereken borç</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">ALACAK BAKİYESİ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-green-50"
                      placeholder="0,00"
                      value={editDebtData.creditBalance || ''}
                      onChange={(e) => {
                        const formatted = formatInputValue(e.target.value);
                        setEditDebtData({ ...editDebtData, creditBalance: formatted });
                      }}
                    />
                    <p className="text-xs text-slate-400 mt-1">Fazla ödenen tutar</p>
                  </div>
                </div>
              </div>

              {/* Gas Debt Section */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Doğalgaz Borcu</h4>
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">DOĞALGAZ BORCU</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50"
                    placeholder="0,00"
                    value={editDebtData.gasDebt || ''}
                    onChange={(e) => {
                      const formatted = formatInputValue(e.target.value);
                      setEditDebtData({ ...editDebtData, gasDebt: formatted });
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">Doğalgaz borcu tutarı</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Warning Edit Modal */}
      {showWarningEditModal && editingWarningResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Aylık Uyarı Geçmişini Düzenle</h3>
              <button onClick={() => {
                setShowWarningEditModal(false);
                setEditingWarningResident(null);
                setEditingWarnings([]);
              }} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                <span className="font-semibold text-slate-800">{editingWarningResident.name}</span> için uyarı verilen ayları seçiniz. Kareye tıklayarak ekleyip çıkarabilirsiniz.
              </p>
              
              <div className="mb-6">
                <div className="text-xs font-medium text-slate-500 mb-3">Son 12 Ay</div>
                <div className="grid grid-cols-12 gap-2">
                  {(() => {
                    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                    const currentDate = new Date();
                    const currentMonth = currentDate.getMonth();
                    
                    // Son 12 ayı oluştur
                    const last12Months: string[] = [];
                    for (let i = 11; i >= 0; i--) {
                      const date = new Date(currentDate.getFullYear(), currentMonth - i, 1);
                      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      last12Months.push(yearMonth);
                    }
                    
                    return last12Months.map((yearMonth) => {
                      const date = new Date(yearMonth + '-01');
                      const monthIndex = date.getMonth();
                      const hasWarning = editingWarnings.includes(yearMonth);
                      
                      return (
                        <div key={yearMonth} className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              if (hasWarning) {
                                setEditingWarnings(editingWarnings.filter(w => w !== yearMonth));
                              } else {
                                setEditingWarnings([...editingWarnings, yearMonth]);
                              }
                            }}
                            className={`w-full aspect-square rounded border-2 transition-all cursor-pointer ${
                              hasWarning 
                                ? 'bg-red-500 border-red-600 hover:bg-red-600' 
                                : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={`${months[monthIndex]} ${date.getFullYear()}`}
                          />
                          <span className="text-xs text-slate-500 font-medium text-center">
                            {months[monthIndex].substring(0, 3)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {date.getFullYear()}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-slate-100 border-slate-200"></div>
                  <span className="text-slate-600">Uyarı yok</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-red-500 border-red-600"></div>
                  <span className="text-slate-600">Uyarı verildi</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => {
                    setShowWarningEditModal(false);
                    setEditingWarningResident(null);
                    setEditingWarnings([]);
                  }}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={async () => {
                    if (!editingWarningResident) return;
                    
                    // Güncelleme işlemi
                    const existingWarning = monthlyWarnings.find(w => w.id === editingWarningResident.id);
                    let updatedWarnings: MonthlyWarning[];
                    
                    if (editingWarnings.length === 0) {
                      // Eğer tüm uyarılar silindi ise, kaydı kaldır
                      updatedWarnings = monthlyWarnings.filter(w => w.id !== editingWarningResident.id);
                    } else if (existingWarning) {
                      // Mevcut kaydı güncelle
                      updatedWarnings = monthlyWarnings.map(w => 
                        w.id === editingWarningResident.id 
                          ? { ...w, warnings: editingWarnings }
                          : w
                      );
                    } else {
                      // Yeni kayıt oluştur
                      updatedWarnings = [...monthlyWarnings, { id: editingWarningResident.id, warnings: editingWarnings }];
                    }
                    
                    await onUpdateMonthlyWarnings(updatedWarnings);
                    setShowWarningEditModal(false);
                    setEditingWarningResident(null);
                    setEditingWarnings([]);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow transition-colors"
                >
                  Kaydet
                </button>
              </div>
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

      {/* Gas Debt Import Modal */}
      {showGasImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Doğalgaz Borcu Yükle</h3>
              <button onClick={() => {
                setShowGasImportModal(false);
                setGasImportText('');
                setGasImportError('');
              }} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4">
                Excel veya text dosyanızdaki doğalgaz borcu verilerini (Başlıklar hariç) seçip kopyalayın ve aşağıdaki alana yapıştırın.
                <br/>
                <span className="text-xs text-slate-400">Beklenen Format: Hesap Kodu (Tab veya boşluk) Borç Tutarı (TL)</span>
                <br/>
                <span className="text-xs text-slate-400 font-semibold">Örnek: 131.001.2	4.376,48 TL</span>
              </p>
              
              <textarea
                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder={`Örn:\n131.001.2\t4.376,48 TL\n131.001.8\t1.213,48 TL\n131.001.10\t1.480,35 TL\n...`}
                value={gasImportText}
                onChange={(e) => setGasImportText(e.target.value)}
              ></textarea>

              {gasImportError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                  {gasImportError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowGasImportModal(false);
                  setGasImportText('');
                  setGasImportError('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleGasImport}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow transition-colors"
              >
                Doğalgaz Borçlarını İşle ve Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Debts Confirmation Modal */}
      {showResetDebtsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Tüm Borçları Sıfırla</h3>
              <p className="text-sm text-slate-600 text-center mb-4">
                Bu işlem <strong>sadece</strong> tüm sakinlerin borç bakiyelerini, alacak bakiyelerini ve doğalgaz borçlarını sıfırlayacaktır.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-green-800 text-center">
                  ✓ İsimler, telefon numaraları ve diğer tüm bilgiler korunacaktır
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-red-800 text-center">
                  ⚠️ Bu işlem geri alınamaz!
                </p>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Toplam Borç Bakiyesi:</span>
                  <span className="font-semibold text-red-600">₺{stats.totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam Alacak Bakiyesi:</span>
                  <span className="font-semibold text-green-600">₺{stats.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam Doğalgaz Borcu:</span>
                  <span className="font-semibold text-orange-600">₺{gasDebts.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setShowResetDebtsModal(false)}
                disabled={isResetting}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
              <button 
                onClick={handleResetAllDebts}
                disabled={isResetting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sıfırlanıyor...</span>
                  </>
                ) : (
                  'Evet, Tümünü Sıfırla'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Dosya Yükleme ve Yönetimi</h3>
                <button
                  onClick={() => setShowFileModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ImgBB API Key Girişi */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ImgBB API Key <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={imgbbApiKey}
                    onChange={(e) => setImgbbApiKey(e.target.value)}
                    placeholder="ImgBB API Key'inizi girin"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      if (imgbbApiKey.trim()) {
                        setImgBBApiKey(imgbbApiKey.trim());
                        alert('ImgBB API key kaydedildi!');
                      } else {
                        alert('Lütfen geçerli bir API key girin.');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Kaydet
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  API key almak için: <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://api.imgbb.com/</a>
                </p>
                {!imgbbApiKey && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ API key olmadan dosya yüklenemez!
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Yeni Dosya Yükle (Resim veya PDF, max 32MB - ImgBB limiti)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label
                    htmlFor="file-upload-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-slate-600 font-medium">
                      {isUploading ? 'Yükleniyor...' : 'Dosya Seç veya Sürükle'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      JPG, PNG, GIF veya PDF (max 20MB - ImgBB limiti)
                    </span>
                  </label>
                </div>
                {uploadError && (
                  <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                    {uploadError}
                  </div>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Yüklenen Dosyalar ({uploadedFiles.length})
                    </h4>
                    <button
                      onClick={handleClearAllFiles}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Tümünü Sil
                    </button>
                  </div>
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`p-4 border rounded-lg ${
                          selectedFileForWhatsApp?.id === file.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {file.type === 'image' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              )}
                              <span className="text-sm font-medium text-slate-700">{file.name}</span>
                              {selectedFileForWhatsApp?.id === file.id && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Seçili</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleString('tr-TR')}
                            </div>
                            {file.type === 'image' && (
                              <div className="mt-2">
                                <img
                                  src={getFileUrl(file)}
                                  alt={file.name}
                                  className="max-w-full h-32 object-contain rounded border border-slate-200"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                if (selectedFileForWhatsApp?.id === file.id) {
                                  setSelectedFileForWhatsApp(null);
                                } else {
                                  setSelectedFileForWhatsApp(file);
                                }
                              }}
                              className={`px-3 py-1 text-xs rounded transition-colors ${
                                selectedFileForWhatsApp?.id === file.id
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {selectedFileForWhatsApp?.id === file.id ? 'Seçili' : 'Seç'}
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedFiles.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Henüz dosya yüklenmedi. Yukarıdaki alana tıklayarak dosya yükleyebilirsiniz.
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Not:</strong> Yüklenen dosyalar sadece bu oturum için geçerlidir. Tarayıcıyı kapatırsanız dosyalar silinir. 
                  WhatsApp'ta dosya göndermek için mesajı gönderdikten sonra ekranın altındaki 📎 (ekle) butonunu kullanabilirsiniz.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowFileModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;