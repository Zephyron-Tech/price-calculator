import { createContext, useContext } from 'react';

interface AuthContextValue {
  lock: () => void;
}

export const AuthContext = createContext<AuthContextValue>({ lock: () => {} });
export const useAuth = () => useContext(AuthContext);
