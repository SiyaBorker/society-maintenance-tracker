import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, fetchMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('smt_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smt_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem('smt_user', JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem('smt_token');
        localStorage.removeItem('smt_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (user, token) => {
    localStorage.setItem('smt_token', token);
    localStorage.setItem('smt_user', JSON.stringify(user));
    setUser(user);
  };

  const login = useCallback(async (email, password) => {
    const { user, token } = await loginUser({ email, password });
    persist(user, token);
    return user;
  }, []);

  const register = useCallback(async (payload) => {
    const { user, token } = await registerUser(payload);
    persist(user, token);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smt_token');
    localStorage.removeItem('smt_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
