import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
                        refreshToken,
                    });

                    localStorage.setItem('token', data.data.token);
                    originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    register: (data: { email: string; password: string; name: string; phone?: string }) =>
        api.post('/auth/register', data),

    refreshToken: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }),
};

// Parking Lots API
export const lotsAPI = {
    getAll: (params?: { lat?: number; lng?: number; radius?: number; status?: string }) =>
        api.get('/lots', { params }),

    getById: (id: string) =>
        api.get(`/lots/${id}`),

    getSlots: (lotId: string, params?: { status?: string; minConfidence?: number; page?: number; limit?: number }) =>
        api.get(`/lots/${lotId}/slots`, { params }),

    create: (data: any) =>
        api.post('/lots', data),

    update: (id: string, data: any) =>
        api.put(`/lots/${id}`, data),
};

// Slots API
export const slotsAPI = {
    getById: (id: string) =>
        api.get(`/slots/${id}`),

    update: (id: string, data: { status?: string; confidence?: number; vehicleEntry?: any }) =>
        api.put(`/slots/${id}`, data),
};

// Reservations API
export const reservationsAPI = {
    getMine: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get('/reservations/me', { params }),

    create: (data: { slotId: string; startTime: string; endTime: string }) =>
        api.post('/reservations', data),

    cancel: (id: string) =>
        api.delete(`/reservations/${id}`),
};

// Users API
export const usersAPI = {
    getMe: () =>
        api.get('/users/me'),

    updateMe: (data: { name?: string; phone?: string; profile?: any }) =>
        api.put('/users/me', data),

    getAll: (params?: { role?: string; page?: number; limit?: number }) =>
        api.get('/users', { params }),
};

// AI Events API
export const aiEventsAPI = {
    getAll: (params?: { lotId?: string; slotId?: string; eventType?: string; isAnomaly?: boolean; page?: number; limit?: number }) =>
        api.get('/ai-events', { params }),
};
