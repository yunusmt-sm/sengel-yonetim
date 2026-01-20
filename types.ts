// Apartman Sakinleri - Ana Bilgiler
export interface Resident {
  id: string; // Hesap Kodu (e.g., 131.001.001)
  name: string; // Hesap Adı
  phone?: string; // Telefon numarası
  isOwner: boolean; // Sahibi mi kiracı mı
  ownerPhone?: string; // Sahip telefon numarası (kiracı ise)
  ownerName?: string; // Sahip adı (kiracı ise)
  username: string; // Kullanıcı adı (e.g., "1" for 131.001.001)
  password: string; // Şifre
}

// Borç Bilgileri - Ayrı JSON'da tutulacak
export interface DebtBalance {
  id: string; // Resident id ile eşleşir
  totalDebit: number; // Borç (Total accrued debt)
  totalCredit: number; // Alacak (Total paid)
  debtBalance: number; // Borç Bakiyesi (Current debt owed)
  creditBalance: number; // Alacak Bakiyesi (Surplus/Prepaid)
}

// Birleşik görünüm (UI için)
export interface ResidentWithDebt extends Resident {
  totalDebit?: number;
  totalCredit?: number;
  debtBalance?: number;
  creditBalance?: number;
  gasDebt?: number;
}

// Aylık Uyarı Takibi - Her sakin için hangi aylarda uyarı verildiğini tutar
export interface MonthlyWarning {
  id: string; // Resident id ile eşleşir
  warnings: string[]; // YYYY-MM formatında (örn: ["2025-01", "2025-02"])
}

// Doğalgaz Borcu - Ayrı JSON'da tutulacak
export interface GasDebt {
  id: string; // Resident id ile eşleşir
  amount: number; // Doğalgaz borcu tutarı
}

export interface UserSession {
  isAuthenticated: boolean;
  role: 'admin' | 'user' | null;
  userData?: ResidentWithDebt;
}

export enum AppRoutes {
  LOGIN = '/',
  ADMIN_DASHBOARD = '/admin',
  USER_DASHBOARD = '/dashboard'
}