import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserSession, AppRoutes, Resident } from './types';
import { RESIDENTS_DATA } from './constants';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  // Central State for Residents Data
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [session, setSession] = useState<UserSession>({
    isAuthenticated: false,
    role: null,
  });

  // 1. Load Session and Data on Startup
  useEffect(() => {
    // Load Session
    const savedSession = localStorage.getItem('appSession');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    // Load Data (Priority: LocalStorage > Constants)
    const savedData = localStorage.getItem('residentsData');
    if (savedData) {
      try {
        setResidents(JSON.parse(savedData));
      } catch (e) {
        console.error("Error parsing saved data, reverting to default", e);
        setResidents(RESIDENTS_DATA);
      }
    } else {
      setResidents(RESIDENTS_DATA);
    }
    setIsDataLoaded(true);
  }, []);

  // 2. Update Data Function (Called by Admin)
  const handleUpdateData = (newData: Resident[]) => {
    setResidents(newData);
    localStorage.setItem('residentsData', JSON.stringify(newData));
    
    // If currently logged in user is a resident, update their session data too
    if (session.role === 'user' && session.userData) {
      const updatedUser = newData.find(r => r.id === session.userData?.id);
      if (updatedUser) {
        const newSession = { ...session, userData: updatedUser };
        setSession(newSession);
        localStorage.setItem('appSession', JSON.stringify(newSession));
      }
    }
  };

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('appSession', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession({ isAuthenticated: false, role: null });
    localStorage.removeItem('appSession');
  };

  if (!isDataLoaded) return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;

  return (
    <HashRouter>
      <Routes>
        <Route 
          path={AppRoutes.LOGIN} 
          element={
            session.isAuthenticated ? (
              <Navigate to={session.role === 'admin' ? AppRoutes.ADMIN_DASHBOARD : AppRoutes.USER_DASHBOARD} />
            ) : (
              <Login onLogin={handleLogin} residents={residents} />
            )
          } 
        />
        
        <Route 
          path={AppRoutes.ADMIN_DASHBOARD} 
          element={
            session.isAuthenticated && session.role === 'admin' ? (
              <AdminDashboard 
                residents={residents} 
                onUpdateData={handleUpdateData} 
                onLogout={handleLogout} 
              />
            ) : (
              <Navigate to={AppRoutes.LOGIN} />
            )
          } 
        />

        <Route 
          path={AppRoutes.USER_DASHBOARD} 
          element={
            session.isAuthenticated && session.role === 'user' && session.userData ? (
              // We pass the resident from the main list to ensure it's always up to date
              <UserDashboard 
                userData={residents.find(r => r.id === session.userData!.id) || session.userData} 
                onLogout={handleLogout} 
              />
            ) : (
              <Navigate to={AppRoutes.LOGIN} />
            )
          } 
        />
      </Routes>
    </HashRouter>
  );
}

export default App;