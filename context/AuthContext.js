import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../api/backend';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@auth_user')
      .then(raw => {
        if (raw) {
          const u = JSON.parse(raw);
          setUser(u);
          setAuthToken(u.token);
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const login = async (userData) => {
    setUser(userData);
    setAuthToken(userData.token);
    await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setAuthToken(null);
    await AsyncStorage.removeItem('@auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
