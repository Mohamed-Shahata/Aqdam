import React, { createContext, useState } from 'react';
import Cookies from "js-cookie"

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (token) => {
    if (token) {
      Cookies.set('token', token, { expires: 7 })
    }
    setIsAuthenticated(true);
  }
  const logout = () => {
    Cookies.remove('token')
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}