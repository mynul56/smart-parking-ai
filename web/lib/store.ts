import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'staff' | 'user';
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;

    setAuth: (data: { user: User; token: string; refreshToken: string }) => void;
    logout: () => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,

    setAuth: ({ user, token, refreshToken }) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
        }

        set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
        });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        }

        set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
        });
    },

    hydrate: () => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken');

            if (user && token && refreshToken) {
                set({
                    user: JSON.parse(user),
                    token,
                    refreshToken,
                    isAuthenticated: true,
                });
            }
        }
    },
}));
