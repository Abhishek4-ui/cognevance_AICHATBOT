import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('neurochat_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('neurochat_user');
      return null;
    }
  });
  
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('neurochat_token') || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // Validate token in background without blocking initial render
      authAPI.getProfile()
        .then((res) => {
          if (res.data?.status === 'success' && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('neurochat_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token invalid or expired - gracefully clear without crashing
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.data?.status === 'success') {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('neurochat_token', newToken);
      localStorage.setItem('neurochat_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data?.message || 'Login failed' };
  };

  const register = async (email, username, password) => {
    const res = await authAPI.register(email, username, password);
    if (res.data?.status === 'success') {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('neurochat_token', newToken);
      localStorage.setItem('neurochat_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data?.message || 'Registration failed' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('neurochat_token');
    localStorage.removeItem('neurochat_user');
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('neurochat_user', JSON.stringify(merged));
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
