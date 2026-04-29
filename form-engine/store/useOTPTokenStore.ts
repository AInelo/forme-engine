// 📁 src/store/useOTPTokenStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OTPAuthToken } from '../hooks/useOTPHandler';

interface OTPTokenState {
  // Stockage par formId et fieldName pour gérer plusieurs champs OTP
  tokens: Record<string, Record<string, OTPAuthToken>>; // { [formId]: { [fieldName]: token } }
  setOTPToken: (formId: string, fieldName: string, token: OTPAuthToken) => void;
  getOTPToken: (formId: string, fieldName: string) => OTPAuthToken | undefined;
  clearOTPToken: (formId: string, fieldName: string) => void;
  clearAllOTPTokens: (formId?: string) => void;
}

export const useOTPTokenStore = create<OTPTokenState>()(
  persist(
    (set, get) => ({
      tokens: {},
      
      setOTPToken: (formId, fieldName, token) =>
        set((state) => ({
          tokens: {
            ...state.tokens,
            [formId]: {
              ...state.tokens[formId],
              [fieldName]: token,
            },
          },
        })),
      
      getOTPToken: (formId, fieldName) => {
        const state = get();
        return state.tokens[formId]?.[fieldName];
      },
      
      clearOTPToken: (formId, fieldName) =>
        set((state) => {
          const formTokens = state.tokens[formId];
          if (!formTokens) return state;
          
          const { [fieldName]: _, ...rest } = formTokens;
          return {
            tokens: {
              ...state.tokens,
              [formId]: rest,
            },
          };
        }),
      
      clearAllOTPTokens: (formId) =>
        set((state) => {
          if (formId) {
            const { [formId]: _, ...rest } = state.tokens;
            return { tokens: rest };
          }
          return { tokens: {} };
        }),
    }),
    {
      name: 'otp-auth-tokens', // Clé de persistance localStorage
    }
  )
);

// Fonction utilitaire pour vérifier si un token est expiré
export const isTokenExpired = (token: OTPAuthToken): boolean => {
  if (!token.expires_at) {
    return false; // Pas d'expiration définie
  }
  return Date.now() / 1000 >= token.expires_at;
};

// Fonction utilitaire pour récupérer un token valide (non expiré)
export const getValidOTPToken = (formId: string, fieldName: string): OTPAuthToken | null => {
  const token = useOTPTokenStore.getState().getOTPToken(formId, fieldName);
  if (!token) {
    return null;
  }
  if (isTokenExpired(token)) {
    // Token expiré, le supprimer
    useOTPTokenStore.getState().clearOTPToken(formId, fieldName);
    return null;
  }
  return token;
};

