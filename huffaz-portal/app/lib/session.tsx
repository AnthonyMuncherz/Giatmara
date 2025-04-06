'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  role: string;
  // Add other relevant user fields if available from /api/auth/me
};

type SessionContextType = {
  user: User | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  refreshSession: async () => { },
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache', // Extra headers for good measure
          'Expires': '0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRetryCount(0); // Reset retry count on success
      } else {
        setUser(null);
        // If we get a 401 or other error, we've definitively determined the user isn't logged in
        // No need to retry in this case
      }
    } catch (error) {
      console.error('SessionProvider: Failed to load user data:', error);
      setUser(null);
      
      // If there was a network error, we might want to retry
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        // Don't set loading to false yet - we'll retry
        return;
      }
    } finally {
      setLoading(false); // Set loading to false after fetch attempt or max retries
    }
  };

  useEffect(() => {
    loadUserData();
  }, [retryCount]); // Add retryCount as dependency to trigger retries

  // If we need to retry, set up a short timeout
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3 && loading) {
      const timer = setTimeout(() => {
        loadUserData();
      }, 500 * retryCount); // Increasing backoff
      
      return () => clearTimeout(timer);
    }
  }, [retryCount, loading]);

  const value = {
    user,
    loading,
    refreshSession: loadUserData, // Provide the function to allow manual refresh
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
