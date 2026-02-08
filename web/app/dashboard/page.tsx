'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lotsAPI, reservationsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/lib/socket-context';
import Link from 'next/link';
import ParkingMap from '@/components/Map';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [showAddLotModal, setShowAddLotModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [newLot, setNewLot] = useState({
        name: '',
        address: '',
        totalSlots: 0,
        coordinates: { lat: 0, lng: 0 }
    });

    const { socket, isConnected } = useSocket();

    // Listen for real-time updates
    useEffect(() => {
        if (!socket || !isConnected) return;

        socket.on('lot:updated', (data: any) => {
            console.log('🔄 Dashboard Lot Update:', data);

            queryClient.setQueryData(['lots'], (oldLots: any[] | undefined) => {
                if (!oldLots) return oldLots;

                return oldLots.map(lot => {
                    if (lot._id === data.lotId) {
                        return {
                            ...lot,
                            availableSlots: Math.max(0, Math.min(lot.totalSlots, lot.availableSlots + data.delta))
                        };
                    }
                    return lot;
                });
            });
        });

        return () => {
            socket.off('lot:updated');
        };
    }, [socket, isConnected, queryClient]);

    const { data: lots, isLoading: lotsLoading } = useQuery({
        queryKey: ['lots'],
        queryFn: async () => {
            const response = await lotsAPI.getAll();
            return response.data.data;
        },
    });

    const { data: reservations, isLoading: reservationsLoading } = useQuery({
        queryKey: ['my-reservations'],
        queryFn: async () => {
            const response = await reservationsAPI.getMine({ limit: 5 });
            return response.data.data;
        },
        enabled: user?.role === 'user',
    });

    const createLotMutation = useMutation({
        mutationFn: async (lotData: any) => {
            const response = await lotsAPI.create({
                name: lotData.name,
                address: lotData.address,
                totalSlots: Number(lotData.totalSlots),
                availableSlots: Number(lotData.totalSlots),
                location: {
                    type: 'Point',
                    coordinates: [lotData.coordinates.lng, lotData.coordinates.lat]
                },
                pricing: {
                    hourlyRate: 3.0,
                    currency: 'USD'
                },
                status: 'active'
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lots'] });
            setShowAddLotModal(false);
            setNewLot({ name: '', address: '', totalSlots: 0, coordinates: { lat: 0, lng: 0 } });
        },
    });

    const handleCreateLot = (e: React.FormEvent) => {
        e.preventDefault();
        createLotMutation.mutate(newLot);
    };

    // Calculate stats
    const totalSlots = lots?.reduce((sum: number, lot: any) => sum + lot.totalSlots, 0) || 0;
    const availableSlots = lots?.reduce((sum: number, lot: any) => sum + lot.availableSlots, 0) || 0;
    const occupancyRate = totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots * 100).toFixed(1) : 0;

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user?.name}! 👋
                </h2>
                <p className="mt-2 text-gray-600">
                    {user?.role === 'admin' && 'Manage parking lots and monitor system performance'}
                    {user?.role === 'staff' && 'Monitor parking lots and assist customers'}
                    {user?.role === 'user' && 'Find and reserve parking spots near you'}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Parking Lots</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {lotsLoading ? '...' : lots?.length || 0}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏢</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Available Slots</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                {lotsLoading ? '...' : availableSlots}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                {lotsLoading ? '...' : `${occupancyRate}%`}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end mb-4">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'list'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'map'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Map View
                    </button>
                </div>
            </div>

            {/* List or Map View */}
            {viewMode === 'list' ? (
                /* Parking Lots List */
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Parking Lots</h3>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setShowAddLotModal(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700"
                            >
                                Add New Lot
                            </button>
                        )}
                    </div>

                    <div className="divide-y divide-gray-200">
                        {lotsLoading ? (
                            <div className="p-6 text-center text-gray-500">Loading...</div>
                        ) : lots && lots.length > 0 ? (
                            lots.map((lot: any) => (
                                <Link
                                    key={lot._id}
                                    href={`/dashboard/lots/${lot._id}`}
                                    className="block px-6 py-4 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="text-base font-medium text-gray-900">{lot.name}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{lot.address}</p>
                                        </div>

                                        <div className="flex items-center space-x-6">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Available</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {lot.availableSlots} / {lot.totalSlots}
                                                </p>
                                            </div>

                                            <div className="w-24">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-600 h-2 rounded-full transition-all"
                                                        style={{
                                                            width: `${(lot.availableSlots / lot.totalSlots) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <span className="text-gray-400">→</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500">No parking lots found</div>
                        )}
                    </div>
                </div>
            ) : (
                /* Map View */
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Parking Map</h3>
                    </div>
                    <ParkingMap lots={lots || []} />
                </div>
            )}

            {/* Recent Reservations (for users) */}
            {user?.role === 'user' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">My Reservations</h3>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {reservationsLoading ? (
                            <div className="p-6 text-center text-gray-500">Loading...</div>
                        ) : reservations && reservations.length > 0 ? (
                            reservations.map((reservation: any) => (
                                <div key={reservation._id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Reservation #{reservation._id.slice(-6)}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            reservation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                reservation.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {reservation.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                <p>No reservations yet</p>
                                <Link href="/dashboard/lots" className="text-primary hover:underline mt-2 inline-block">
                                    Browse parking lots →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Lot Modal */}
            {showAddLotModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Add New Parking Lot</h3>
                            <button
                                onClick={() => setShowAddLotModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateLot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lot Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newLot.name}
                                    onChange={(e) => setNewLot({ ...newLot, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Downtown Parking"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newLot.address}
                                    onChange={(e) => setNewLot({ ...newLot, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Slots
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={newLot.totalSlots || ''}
                                    onChange={(e) => setNewLot({ ...newLot, totalSlots: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={newLot.coordinates.lat || ''}
                                        onChange={(e) => setNewLot({ ...newLot, coordinates: { ...newLot.coordinates, lat: parseFloat(e.target.value) || 0 } })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="37.7749"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={newLot.coordinates.lng || ''}
                                        onChange={(e) => setNewLot({ ...newLot, coordinates: { ...newLot.coordinates, lng: parseFloat(e.target.value) || 0 } })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="-122.4194"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddLotModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLotMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createLotMutation.isPending ? 'Creating...' : 'Create Lot'}
                                </button>
                            </div>

                            {createLotMutation.isError && (
                                <p className="text-sm text-red-600 mt-2">
                                    Error creating lot. Please try again.
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
