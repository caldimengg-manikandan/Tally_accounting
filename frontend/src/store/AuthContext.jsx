import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data on initial load
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // We assume /api/auth/me returns user, role, company, plan, subscriptionStatus
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          setCompany(response.data.company); // Includes plan and subscriptionStatus
        }
      } catch (error) {
        console.error('Failed to fetch auth data', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setCompany(response.data.company);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, login, logout, loading, setCompany }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
