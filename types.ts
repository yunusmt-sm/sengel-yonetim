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