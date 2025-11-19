export interface Resident {
  id: string; // Hesap Kodu (e.g., 131.001.001)
  name: string; // Hesap Adı
  totalDebit: number; // Borç (Total accrued debt)
  totalCredit: number; // Alacak (Total paid)
  debtBalance: number; // Borç Bakiyesi (Current debt owed)
  creditBalance: number; // Alacak Bakiyesi (Surplus/Prepaid)
  phoneNumber?: string; // Optional phone number for WhatsApp notifications
}

export interface UserSession {
  isAuthenticated: boolean;
  role: 'admin' | 'user' | null;
  userData?: Resident;
}

export enum AppRoutes {
  LOGIN = '/',
  ADMIN_DASHBOARD = '/admin',
  USER_DASHBOARD = '/dashboard'
}