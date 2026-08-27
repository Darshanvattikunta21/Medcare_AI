import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  login as apiLogin,
  signUp as apiSignUp,
  forgotPassword as apiForgotPassword,
  verifyOtp as apiVerifyOtp,
  fetchCurrentUser,
  setAuthToken,
  getErrorMessage
} from "@medicare/api-client";
import type { ProfileAddress } from "@medicare/api-client";

type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  DOB?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
};

type AuthContextType = {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  cachedAddresses: ProfileAddress[];
  login: (email: string, password: string) => Promise<void>;
  signUp: (payload: { name: string; email: string; phone: string; password: string; role?: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refetchUser: () => Promise<void>;
  cacheAddresses: (addresses: ProfileAddress[]) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  loading: true,
  error: null,
  isOffline: false,
  cachedAddresses: [],
  login: async () => {},
  signUp: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
  clearError: () => {},
  refetchUser: async () => {},
  cacheAddresses: async () => {}
});

const TOKEN_KEY = "medicare_auth_token";
const USER_KEY = "medicare_auth_user";
const ADDRESSES_KEY = "medicare_addresses_cache";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedAddresses, setCachedAddresses] = useState<ProfileAddress[]>([]);

  useEffect(() => {
    async function restoreSession() {
      try {
        // Restore addresses cache
        const storedAddresses = await AsyncStorage.getItem(ADDRESSES_KEY);
        if (storedAddresses) {
          setCachedAddresses(JSON.parse(storedAddresses) as ProfileAddress[]);
        }

        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken) {
          setTokenState(storedToken);
          setAuthToken(storedToken);
          if (storedUser) {
            setUserState(JSON.parse(storedUser) as UserProfile);
          }

          // Validate session and fetch latest profile from backend
          try {
            const freshUser = await fetchCurrentUser();
            setUserState(freshUser);
            setIsOffline(false);
            try {
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            } catch {
              // Non-critical
            }
          } catch (err: any) {
            const errMsg = String(err?.message || "");
            const isAuthError =
              err?.status === 401 ||
              err?.code === "unauthorized" ||
              errMsg.includes("Authentication required") ||
              errMsg.includes("401");

            if (isAuthError) {
              // Token is invalid/expired — clear storage and prompt login
              setTokenState(null);
              setUserState(null);
              setAuthToken(null);
              await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]).catch(() => null);
            } else {
              // Network error — keep using cached profile if offline
              setIsOffline(true);
            }
          }
        }
      } catch {
        // Session restoration failure is handled gracefully by keeping state null
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setIsOffline(false);
    try {
      const res = await apiLogin({ email, password });
      if (res.token) {
        setTokenState(res.token);
        setAuthToken(res.token);
        try {
          await AsyncStorage.setItem(TOKEN_KEY, res.token);
        } catch {
          // Non-critical
        }

        if (res.user) {
          setUserState(res.user);
          try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
          } catch {
            // Non-critical
          }
        } else {
          try {
            const freshUser = await fetchCurrentUser();
            setUserState(freshUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser)).catch(() => null);
          } catch {
            // Profile fetch failure after login is non-critical
          }
        }
      } else {
        throw new Error("No token returned from server");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Sign in failed");
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (payload: { name: string; email: string; phone: string; password: string; role?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiSignUp(payload);
      if (res.token) {
        setTokenState(res.token);
        setAuthToken(res.token);
        try {
          await AsyncStorage.setItem(TOKEN_KEY, res.token);
        } catch {
          // Non-critical
        }

        if (res.user) {
          setUserState(res.user);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)).catch(() => null);
        } else {
          try {
            const freshUser = await fetchCurrentUser();
            setUserState(freshUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser)).catch(() => null);
          } catch {
            // Non-critical
          }
        }
      } else {
        throw new Error("Registration failed");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Signup failed");
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiForgotPassword({ email });
      if (!res.ok) {
        throw new Error(res.message ?? "Failed to request OTP");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to request password reset");
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (_email: string, otp: string, _pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiVerifyOtp({ email: _email, otp });
      if (!res.ok) {
        throw new Error(res.message ?? "Invalid OTP code");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "OTP validation failed");
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setTokenState(null);
      setUserState(null);
      setAuthToken(null);
      setIsOffline(false);
      try {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } catch {
        // Non-critical — in-memory state is already cleared
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const refetchUser = async () => {
    try {
      const freshUser = await fetchCurrentUser();
      setUserState(freshUser);
      setIsOffline(false);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser)).catch(() => null);
    } catch {
      // Refetch failure sets offline flag but doesn't clear the cached user
      setIsOffline(true);
    }
  };

  /**
   * Persists the verified address list to AsyncStorage so it is available
   * offline on the cart and checkout screens.
   */
  const cacheAddresses = async (addresses: ProfileAddress[]) => {
    setCachedAddresses(addresses);
    try {
      await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
    } catch {
      // Non-critical
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        isOffline,
        cachedAddresses,
        login,
        signUp,
        forgotPassword,
        resetPassword,
        logout,
        clearError,
        refetchUser,
        cacheAddresses
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
