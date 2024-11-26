'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from './firebase';
import { setCookie, deleteCookie } from 'cookies-next';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Set auth cookie when user is signed in
        const token = await user.getIdToken();
        setCookie('auth', token);

        // If user is authenticated and on auth pages, redirect to home
        if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/welcome') {
          router.push('/');
        }
      } else {
        // Remove auth cookie when user is signed out
        deleteCookie('auth');

        // If user is not authenticated and not on public pages, redirect to welcome
        if (!['/welcome', '/auth/signin', '/auth/signup'].includes(pathname)) {
          router.push('/welcome');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);