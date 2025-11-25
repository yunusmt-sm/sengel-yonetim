import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserSession, AppRoutes, Resident, DebtBalance, ResidentWithDebt } from './types';
import { RESIDENTS_DATA, DEBT_BALANCES_DATA } from './constants';
import { fetchResidents, fetchDebtBalances, updateResidents, updateDebtBalances } from './services/jsonbin';
import { getCurrentUser, removeToken, verifyToken, getToken } from './services/auth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  // Central State for Residents and Debt Balances Data
  const [residents, setResidents] = useState<Resident[]>([]);
  const [debtBalances, setDebtBalances] = useState<DebtBalance[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [session, setSession] = useState<UserSession>({
    isAuthenticated: false,
    role: null,
  });

  // 1. Load Session and Data on Startup
  useEffect(() => {
    // Verify token and restore session
    const token = getToken();
    if (token) {
      const tokenPayload = verifyToken(token);
      if (tokenPayload) {
        // Token is valid, restore session
        if (tokenPayload.role === 'admin') {
          setSession({ isAuthenticated: true, role: 'admin' });
        } else {
          // For user, we need to load resident data
          // Will be loaded after residents are fetched
        }
      } else {
        // Token is invalid or expired, remove it
        removeToken();
        localStorage.removeItem('appSession');
      }
    }

    // Load old session format for backward compatibility
    const savedSession = localStorage.getItem('appSession');
    if (savedSession && !token) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.isAuthenticated) {
          setSession(parsed);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Load Data from JSONBin.io
    const loadData = async () => {
      try {
        const [fetchedResidents, fetchedDebtBalances] = await Promise.all([
          fetchResidents(),
          fetchDebtBalances(),
        ]);

        if (fetchedResidents.length > 0) {
          setResidents(fetchedResidents);
        } else {
          // Fallback to constants if empty
          setResidents(RESIDENTS_DATA);
        }

        if (fetchedDebtBalances.length > 0) {
          setDebtBalances(fetchedDebtBalances);
        } else {
          // Fallback to constants if empty
          setDebtBalances(DEBT_BALANCES_DATA);
        }

        // If user is logged in via token, restore their data
        const tokenPayload = getCurrentUser();
        if (tokenPayload && tokenPayload.role === 'user') {
          const resident = (fetchedResidents.length > 0 ? fetchedResidents : RESIDENTS_DATA).find(r => r.id === tokenPayload.userId);
          if (resident) {
            const debt = (fetchedDebtBalances.length > 0 ? fetchedDebtBalances : DEBT_BALANCES_DATA).find(d => d.id === resident.id);
            const userWithDebt: ResidentWithDebt = {
              ...resident,
              totalDebit: debt?.totalDebit,
              totalCredit: debt?.totalCredit,
              debtBalance: debt?.debtBalance,
              creditBalance: debt?.creditBalance,
            };
            setSession({ isAuthenticated: true, role: 'user', userData: userWithDebt });
          }
        }

        setDataError(null);
      } catch (error) {
        console.error('Error loading data from JSONBin.io:', error);
        setDataError('Veri yüklenirken hata oluştu. Varsayılan veriler kullanılıyor.');
        // Fallback to constants
        setResidents(RESIDENTS_DATA);
        setDebtBalances(DEBT_BALANCES_DATA);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, []);

  // 2. Update Residents Function (Called by Admin)
  const handleUpdateResidents = async (newData: Resident[]) => {
    setResidents(newData);
    try {
      await updateResidents(newData);
      setDataError(null);
    } catch (error) {
      console.error('Error updating residents:', error);
      setDataError('Veri güncellenirken hata oluştu.');
    }
    
    // If currently logged in user is a resident, update their session data too
    if (session.role === 'user' && session.userData) {
      const updatedUser = newData.find(r => r.id === session.userData?.id);
      if (updatedUser) {
        const debt = debtBalances.find(d => d.id === updatedUser.id);
        const userWithDebt: ResidentWithDebt = {
          ...updatedUser,
          totalDebit: debt?.totalDebit,
          totalCredit: debt?.totalCredit,
          debtBalance: debt?.debtBalance,
          creditBalance: debt?.creditBalance,
        };
        const newSession = { ...session, userData: userWithDebt };
        setSession(newSession);
        localStorage.setItem('appSession', JSON.stringify(newSession));
      }
    }
  };

  // 3. Update Debt Balances Function (Called by Admin)
  const handleUpdateDebtBalances = async (newData: DebtBalance[]) => {
    setDebtBalances(newData);
    try {
      await updateDebtBalances(newData);
      setDataError(null);
    } catch (error) {
      console.error('Error updating debt balances:', error);
      setDataError('Veri güncellenirken hata oluştu.');
    }
  };

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    // Keep appSession for backward compatibility, but token is primary
    localStorage.setItem('appSession', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession({ isAuthenticated: false, role: null });
    removeToken();
    localStorage.removeItem('appSession');
  };

  if (!isDataLoaded) return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;

  // Combine residents and debt balances for UI display
  const residentsWithDebt: ResidentWithDebt[] = residents.map(resident => ({
    ...resident,
    ...(debtBalances.find(debt => debt.id === resident.id) || {
      totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0
    }),
  }));

  // Check authentication once per render
  const tokenPayload = getCurrentUser();
  const isAuthenticated = session.isAuthenticated && tokenPayload !== null;
  const isAdmin = isAuthenticated && session.role === 'admin' && tokenPayload?.role === 'admin';
  const isUser = isAuthenticated && session.role === 'user' && tokenPayload?.role === 'user' && session.userData;

  return (
    <HashRouter>
      {dataError && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50">
          <p className="text-sm">{dataError}</p>
        </div>
      )}
      <Routes>
        <Route 
          path={AppRoutes.LOGIN} 
          element={
            isAuthenticated ? (
              <Navigate to={isAdmin ? AppRoutes.ADMIN_DASHBOARD : AppRoutes.USER_DASHBOARD} replace />
            ) : (
              <Login onLogin={handleLogin} residents={residentsWithDebt} />
            )
          } 
        />
        
        <Route 
          path={AppRoutes.ADMIN_DASHBOARD} 
          element={
            isAdmin ? (
              <AdminDashboard 
                residents={residentsWithDebt}
                debtBalances={debtBalances}
                onUpdateResidents={handleUpdateResidents}
                onUpdateDebtBalances={handleUpdateDebtBalances}
                onLogout={handleLogout} 
              />
            ) : (
              <Navigate to={AppRoutes.LOGIN} replace />
            )
          } 
        />

        <Route 
          path={AppRoutes.USER_DASHBOARD} 
          element={
            isUser ? (
              (() => {
                // We pass the resident from the main list to ensure it's always up to date
                const resident = residents.find(r => r.id === session.userData!.id);
                const debt = debtBalances.find(d => d.id === session.userData!.id);
                const userWithDebt: ResidentWithDebt = resident ? {
                  ...resident,
                  totalDebit: debt?.totalDebit,
                  totalCredit: debt?.totalCredit,
                  debtBalance: debt?.debtBalance,
                  creditBalance: debt?.creditBalance,
                } : session.userData!;
                return <UserDashboard 
                  userData={userWithDebt} 
                  onLogout={handleLogout}
                  onUpdatePassword={async (newPassword: string) => {
                    const updatedResidents = residents.map(r => 
                      r.id === userWithDebt.id ? { ...r, password: newPassword } : r
                    );
                    await handleUpdateResidents(updatedResidents);
                  }}
                />;
              })()
            ) : (
              <Navigate to={AppRoutes.LOGIN} replace />
            )
          } 
        />
      </Routes>
    </HashRouter>
  );
}

export default App;