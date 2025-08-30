'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { email, quota, etc }
  const [loading, setLoading] = useState(true);

  // Load token/user from cookie or sessionStorage if desired (can improve further)
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // When token/user update, persist for refresh
  useEffect(() => {
    if (token && user) {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  }, [token, user]);

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Fetch user profile/quota (on login, refresh, etc)
  const fetchUserProfile = async (freshToken = token) => {
    const response = await fetch('http://localhost:3001/api/auth/profile', {
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    if (!response.ok) return logout();
    const data = await response.json();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, logout, fetchUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
