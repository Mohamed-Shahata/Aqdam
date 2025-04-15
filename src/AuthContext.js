import React, { createContext, useEffect, useState } from 'react';
import Cookies from "js-cookie"
import api from './api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const response = await api.get('/users');
          setUser(response.data[0]);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Invalid token:', error);
          Cookies.remove('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = (token) => {
    Cookies.set('token', token, { expires: 7 });
    setIsAuthenticated(true);

    api.get('/users').then(response => {
      setUser(response.data[0]);
    }).catch(error => {
      console.error('Failed to fetch user after login:', error);
    });
  };

  const logout = () => {
    Cookies.remove('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading, user, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}