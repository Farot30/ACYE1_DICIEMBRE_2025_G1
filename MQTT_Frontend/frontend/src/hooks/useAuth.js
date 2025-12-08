import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Verificar token almacenado
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   verifyToken(token);
    // }
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(username, password);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser({ username });
        // TODO: Guardar token
        // localStorage.setItem('auth_token', response.token);
        return { success: true };
      }
    } catch (err) {
      setError(err.message || 'Error de autenticación');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // TODO: Limpiar token
    // localStorage.removeItem('auth_token');
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout
  };
};