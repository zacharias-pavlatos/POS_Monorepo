'use client';

import React, { createContext, useContext, useState } from 'react';

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type Session = {
  user: User;
  sessionId: string;
  token: string;
  activeOrganizationId?: string | null;
};

type AuthContextType = {
  session: Session | null;
  setActiveOrg: (orgId: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  initialSession,
  children,
}: {
  initialSession: Session;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);

  const setActiveOrg = (orgId: string) => {
    if (session) {
      setSession({ ...session, activeOrganizationId: orgId });
      // Optional: sync with backend asynchronously
      fetch('/api/set-active-org', {
        method: 'POST',
        body: JSON.stringify({ orgId }),
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, setActiveOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
