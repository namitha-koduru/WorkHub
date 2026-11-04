import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setActiveOrg(res.data.activeOrg || null);
      }
    } catch (err) {
      // Expected when not logged in
      setUser(null);
      setActiveOrg(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData, orgData) => {
    setUser(userData);
    setActiveOrg(orgData || null);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API warning:', err);
    } finally {
      setUser(null);
      setActiveOrg(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        setActiveOrg,
        loading,
        error,
        login,
        logout,
        checkAuth,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

