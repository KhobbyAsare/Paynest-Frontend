import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LoginResponseInterface } from '@/interfaces/loginInterface';
import { deleteCookie } from 'cookies-next';

interface AuthState {
    user: LoginResponseInterface['user'] | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (authData: LoginResponseInterface) => void;
    clearAuth: () => void;
    updateUser: (userData: Partial<LoginResponseInterface['user']>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setAuth: (authData: LoginResponseInterface) => set({
                user: authData.user,
                accessToken: authData.access_token,
                isAuthenticated: true,
            }),

            clearAuth: () => {
                deleteCookie('pos_token');
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                });
            },

            updateUser: (userData: Partial<LoginResponseInterface['user']>) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null
                })),
        }),
        {
            name: 'pos-auth-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);
