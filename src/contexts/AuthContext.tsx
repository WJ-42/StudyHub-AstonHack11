import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, AuthResponse } from '../api/auth';
import { fetchDecks, fetchNotes } from '../api/sync';
import { setLoggedIn, logout as sessionLogout } from '../store/session';

interface AuthUser {
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSuccess = useCallback(async (response: AuthResponse) => {
    setUser({ email: response.email, displayName: response.displayName });
    setLoggedIn(true);
    try {
      const [decks, notes] = await Promise.all([fetchDecks(), fetchNotes()]);
      console.log(`Synced ${decks.length} decks and ${notes.length} notes from cloud`);
    } catch (err) {
      console.warn('Cloud sync failed, continuing with local data', err);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiLogin(email, password);
      await handleAuthSuccess(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRegister(email, password, displayName);
      await handleAuthSuccess(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const logout = useCallback(() => {
    apiLogout();
    sessionLogout();
    setUser(null);
    setError(null);
  }, []);

  // Updates the display name in context state so TopBar and anywhere else
  // that reads user.displayName reflects the change immediately without a reload
  const updateDisplayName = useCallback((name: string) => {
    setUser(prev => prev ? { ...prev, displayName: name } : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: user !== null,
      isLoading,
      error,
      login,
      register,
      logout,
      updateDisplayName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
