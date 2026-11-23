import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signUp: (full_name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const token = api.getAuthToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        if (active) setUser(me);
      } catch {
        await api.logout();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res.user;
  }, []);

  const signUp = useCallback(async (full_name: string, email: string, password: string) => {
    const res = await api.signUp(full_name, email, password);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
