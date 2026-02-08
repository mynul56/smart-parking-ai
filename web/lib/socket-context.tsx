'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

        console.log('🔌 Connecting to WebSocket:', WS_URL);

        const newSocket = io(WS_URL, {
            auth: { token },
            transports: ['websocket'], // Force websocket
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('✅ WebSocket Connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ WebSocket Disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('⚠️ WebSocket Connection Error:', err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
