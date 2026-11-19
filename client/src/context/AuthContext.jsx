import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/apiServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // A 401 anywhere in the console means the session is gone. Drop the user so the
  // guards put them back on the sign-in screen instead of an empty dashboard.
  useEffect(() => {
    const handleExpired = () => {
      setUser((current) => {
        if (current) toast.error('Your session expired — please sign in again.');
        return null;
      });
    };
    window.addEventListener('lw:session-expired', handleExpired);
    return () => window.removeEventListener('lw:session-expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout even if network error
    } finally {
      setUser(null);
      toast.success('Signed out');
    }
  };

  const isOwner = user?.role === 'owner';
  const isCounter = user?.role === 'counter' || isOwner;
  const isKitchen = user?.role === 'kitchen' || isOwner;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isOwner,
        isCounter,
        isKitchen,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
