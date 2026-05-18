import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, AuthResponse } from '../api/auth';
import { fetchDecks } from '../api/sync';
import { setLoggedIn, logout as sessionLogout } from '../store/session';
import {
  clearLocalFlashcards,
  saveDeck,
  saveCard,
  DECK_COLOR_PALETTE,
  type FlashcardDeck,
  type Flashcard,
} from '../store/study';

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

// Clears any stale local flashcard data then writes down whatever
// the cloud has for this user. Runs on every login so account B
// never sees account A's decks after a browser switch.
async function hydrateLocalFromCloud(): Promise<void> {
  try {
    await clearLocalFlashcards();
    const cloudDecks = await fetchDecks();
    for (let i = 0; i < cloudDecks.length; i++) {
      const d = cloudDecks[i];
      const deck: FlashcardDeck = {
        id: d.clientId,
        name: d.name,
        createdAt: Date.now(),
        colorIndex: i % DECK_COLOR_PALETTE.length,
      };
      await saveDeck(deck);
      for (const c of d.cards) {
        const card: Flashcard = {
          id: c.clientId,
          deckId: d.clientId,
          front: c.front,
          back: c.back,
        };
        await saveCard(card);
      }
    }
  } catch (err) {
    console.warn('Could not hydrate local decks from cloud:', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSuccess = useCallback(async (response: AuthResponse) => {
    setUser({ email: response.email, displayName: response.displayName });
    setLoggedIn(true);
    // Always hydrate from cloud on login so the local IDB reflects this
    // user's data and not whoever was logged in before them.
    await hydrateLocalFromCloud();
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
    // Wipe local flashcard data on logout so the next person who logs in
    // on this browser starts with a clean slate before cloud hydration.
    clearLocalFlashcards().catch((err) =>
      console.warn('Could not clear local flashcards on logout:', err)
    );
  }, []);

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
