import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { authApi, getToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Profile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  profile_photo?: string;
  bio?: string;
  notifications?: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: string | null; // JWT token
  loading: boolean;
  isAdmin: boolean;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(token);

    const { data, error } = await authApi.me();
    if (error || !data) {
      // Token is invalid or expired
      authApi.logout();
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      return;
    }

    setUser(data.user);
    setProfile(data.profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Listen for storage changes (multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'civic_auth_token') {
        fetchCurrentUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchCurrentUser]);

  const signOut = () => {
    authApi.logout();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isAdmin = profile?.role === 'admin';

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
