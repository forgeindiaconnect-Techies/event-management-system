
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export type TeamSession = {
  token: string;
  email: string;
  role: string;
  userId?: number;
  portalId?: number;
  portalName?: string;
  portalCode?: string;
};

type SessionContextValue = {
  session: TeamSession | null;
  setSession: (session: TeamSession | null) => void;
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<TeamSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const storedSession = await SecureStore.getItemAsync('team_session');
        if (storedSession) {
          setSessionState(JSON.parse(storedSession));
        }
      } catch (error) {
        console.error('Failed to load session', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const setSession = async (newSession: TeamSession | null) => {
    setSessionState(newSession);
    try {
      if (newSession) {
        await SecureStore.setItemAsync('team_session', JSON.stringify(newSession));
      } else {
        await SecureStore.deleteItemAsync('team_session');
      }
    } catch (error) {
      console.error('Failed to save session', error);
    }
  };

  return (
    <SessionContext.Provider value={{ session, setSession, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}
