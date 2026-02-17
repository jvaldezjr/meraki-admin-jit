import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'meraki_admin_jit_token';

const getApiBaseUrl = () =>
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => sessionStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBaseUrl = getApiBaseUrl();

  const setToken = (newToken) => {
    if (newToken) {
      sessionStorage.setItem(STORAGE_KEY, newToken);
      setTokenState(newToken);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      setTokenState(null);
    }
  };

  const setAuth = (newToken, userData) => {
    setToken(newToken);
    setUser(userData || null);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const authHeaders = () => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${apiBaseUrl}/api/auth/saml/login`;
  };

  const logout = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const exchangeCodeForToken = async (code) => {
    const response = await fetch(`${apiBaseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Token exchange failed');
    }
    return response.json();
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    setAuth,
    exchangeCodeForToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
