import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getUserInfo } from '../services/api';
import { UserInfo } from '../types';

interface AuthContextType {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  login: (id: string, pass: string) => Promise<'ok' | 'ng' | 'lock'>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const login = useCallback(async (id: string, pass: string) => {
    const result = await apiLogin(id, pass);
    if (result === 'ok') {
      setIsLoggedIn(true);
      try {
        const info = await getUserInfo();
        setUserInfo(info);
      } catch (_) {}
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsLoggedIn(false);
    setUserInfo(null);
  }, []);

  const setLoggedOut = useCallback(() => {
    setIsLoggedIn(false);
    setUserInfo(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const info = await getUserInfo();
      setUserInfo(info);
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userInfo, login, logout, refreshUser, setLoggedOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
