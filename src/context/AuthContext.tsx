import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type AuthSession } from '../lib/api';

interface AuthContextType {
  user: AuthSession['user'] | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        const session = await api.getSession();
        if (isMounted) {
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    const session = await api.signIn(email, pass);
    setUser(session.user);
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    const session = await api.signUp(email, pass, displayName);
    setUser(session.user);
  };

  const signOut = async () => {
    await api.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<string> => {
    return await api.resetPassword(email);
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    await api.updateProfile(user.id, { display_name: name });
    setUser({ ...user, display_name: name });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
