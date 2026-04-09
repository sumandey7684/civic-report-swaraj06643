import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getCurrentUser, logoutUser } from '@/lib/authApi';

const AuthContext = createContext<any>(undefined);

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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
    
    // Listen for storage changes (for multi-tab support)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const signOut = () => {
    logoutUser();
    setUser(null);
    window.location.href = "/";
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    isAdmin,
    signOut,
    refreshUser: () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
