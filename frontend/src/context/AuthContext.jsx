import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ims_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ims_auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  // Validate session on mount
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data) {
          const freshUser = res.data.data;
          setUser(freshUser);
          localStorage.setItem('ims_user_profile', JSON.stringify(freshUser));
        }
      } catch (err) {
        // Token invalid or expired
        setToken(null);
        setUser(null);
        localStorage.removeItem('ims_auth_token');
        localStorage.removeItem('ims_user_profile');
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();

    // Listen for unauthorized 401 events from Axios interceptor
    const handleUnauthorized = (e) => {
      setToken(null);
      setUser(null);
      setSessionMessage(e.detail?.message || 'Your session has expired. Please log in again.');
    };

    window.addEventListener('ims:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ims:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email, password) => {
    setSessionMessage('');
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success && res.data.data) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('ims_auth_token', newToken);
      localStorage.setItem('ims_user_profile', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login failed.');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('ims_auth_token');
      localStorage.removeItem('ims_user_profile');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword });
    if (res.data.success && res.data.data?.token) {
      const freshToken = res.data.data.token;
      setToken(freshToken);
      localStorage.setItem('ims_auth_token', freshToken);
    }
    return res.data;
  };

  const hasRole = useCallback((...allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  const canAccessWarehouse = useCallback((warehouseId) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (!user.warehouses) return false;
    return user.warehouses.some(w => w.id === parseInt(warehouseId, 10));
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    sessionMessage,
    login,
    logout,
    changePassword,
    hasRole,
    canAccessWarehouse,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
