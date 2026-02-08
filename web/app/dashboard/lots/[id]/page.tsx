'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { lotsAPI } from '@/lib/api';
import { useSocket } from '@/lib/socket-context';

export default function LotDetailPage() {
    const params = useParams();
    const lotId = params.id as string;
    const { socket, isConnected } = useSocket();
    const [slots, setSlots] = useState<any[]>([]);

    // Fetch parking lot details
    const { data: lot, isLoading: lotLoading } = useQuery({
        queryKey: ['lot', lotId],
        queryFn: async () => {
            const response = await lotsAPI.getById(lotId);
            return response.data.data;
        },
    });

    // Fetch slots
    const { data: slotsData, isLoading: slotsLoading } = useQuery({
        queryKey: ['slots', lotId],
        queryFn: async () => {
            const response = await lotsAPI.getSlots(lotId, { limit: 500 });
            return response.data.data;
        },
    });

    // Initialize slots
    useEffect(() => {
        if (slotsData) {
            setSlots(slotsData);
        }
    }, [slotsData]);

    // WebSocket connection for real-time updates
    useEffect(() => {
        if (!socket || !isConnected) return;

        console.log('✅ Connected to WebSocket (Shared)');
        socket.emit('subscribe', { type: 'lot', id: lotId });

        const handleSlotUpdate = (event: any) => {
            console.log('🔄 Slot updated:', event);

            // Update the slot in local state
            setSlots((prevSlots) =>
                prevSlots.map((slot) =>
                    slot._id === event.slotId
                        ? { ...slot, ...event.updates, updatedAt: event.timestamp }
                        : slot
                )
            );
        };

        socket.on('slot:updated', handleSlotUpdate);

        return () => {
            socket.emit('unsubscribe', { type: 'lot', id: lotId });
            socket.off('slot:updated', handleSlotUpdate);
        };
    }, [socket, isConnected, lotId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-available';
            case 'occupied':
                return 'bg-occupied';
            case 'reserved':
                return 'bg-reserved';
            case 'maintenance':
                return 'bg-maintenance';
            default:
                return 'bg-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (lotLoading || slotsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!lot) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Parking lot not found</p>
            </div>
        );
    }

    // Group slots by status
    const statusCounts = slots.reduce((acc, slot) => {
        acc[slot.status] = (acc[slot.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            {/* Lot Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{lot.name}</h2>
                        <p className="text-gray-600 mt-1">{lot.address}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            ${lot.pricing?.hourlyRate || 0}/hour • {lot.totalSlots} total slots
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
                        <span className="text-sm text-gray-600">
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-available">{statusCounts.available || 0}</p>
                        <p className="text-sm text-gray-600">Available</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-occupied">{statusCounts.occupied || 0}</p>
                        <p className="text-sm text-gray-600">Occupied</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-reserved">{statusCounts.reserved || 0}</p>
                        <p className="text-sm text-gray-600">Reserved</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-maintenance">{statusCounts.maintenance || 0}</p>
                        <p className="text-sm text-gray-600">Maintenance</p>
                    </div>
                </div>
            </div>

            {/* Parking Grid */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Parking Slots</h3>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded bg-available"></div>
                            <span>Available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded bg-occupied"></div>
                            <span>Occupied</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded bg-reserved"></div>
                            <span>Reserved</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded bg-maintenance"></div>
                            <span>Maintenance</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-10 gap-2">
                    {slots.map((slot) => (
                        <div
                            key={slot._id}
                            className={`
                ${getStatusColor(slot.status)}
                rounded-lg p-3 text-white text-center
                transition-all duration-300 hover:scale-105 cursor-pointer
                shadow-sm hover:shadow-md
              `}
                            title={`${slot.slotNumber} - ${getStatusText(slot.status)} - Confidence: ${(slot.confidence * 100).toFixed(0)}%`}
                        >
                            <div className="text-xs font-semibold">{slot.slotNumber}</div>
                            <div className="text-[10px] mt-1 opacity-80">
                                {(slot.confidence * 100).toFixed(0)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
