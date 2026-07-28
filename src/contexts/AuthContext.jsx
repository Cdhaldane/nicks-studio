import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken, clearToken, authHeaders } from '../services/adminAuth';

const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * Admin authentication.
 *
 * The password is validated server-side against the ADMIN_PASSWORD env var and
 * exchanged for a short-lived signed token. Nothing secret is shipped to the
 * browser, so reading the JS bundle no longer reveals how to get in.
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Re-validate any stored token on mount — it may have expired, or the server
  // secret may have been rotated since it was issued.
  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      if (!getToken()) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/admin?resource=session`, {
          headers: authHeaders(),
        });
        const data = await response.json();
        if (cancelled) return;

        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          clearToken();
        }
      } catch {
        // Offline or API down — fail closed and make the user log in again.
        if (!cancelled) clearToken();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    validate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (password) => {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (!response.ok || !data.token) {
        return { success: false, message: data.message || 'Invalid password' };
      }

      setToken(data.token);
      setIsAuthenticated(true);
      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Could not reach the server. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
