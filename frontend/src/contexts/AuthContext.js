'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userId) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const apiFetch = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 403) {
      throw new Error('Access denied');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isMember = user?.role === 'member';
  const canCheckout = isAdmin || isManager;
  const canCancel = isAdmin || isManager;
  const canManagePayments = isAdmin;

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout, apiFetch,
      isAdmin, isManager, isMember,
      canCheckout, canCancel, canManagePayments,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Return safe defaults during SSR/prerendering
    return {
      user: null, token: null, loading: true,
      login: async () => {}, logout: () => {}, apiFetch: async () => {},
      isAdmin: false, isManager: false, isMember: false,
      canCheckout: false, canCancel: false, canManagePayments: false,
    };
  }
  return ctx;
};
