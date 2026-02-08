import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/parking_bloc.dart';
import '../../reservations/bloc/reservation_bloc.dart';
import '../../../core/models/models.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

class LotDetailPage extends StatefulWidget {
  final String lotId;

  const LotDetailPage({super.key, required this.lotId});

  @override
  State<LotDetailPage> createState() => _LotDetailPageState();
}

class _LotDetailPageState extends State<LotDetailPage> {
  IO.Socket? socket;
  bool isConnected = false;

  @override
  void initState() {
    super.initState();
    context.read<ParkingBloc>().add(LoadParkingSlots(widget.lotId));
    _initWebSocket();
  }

  Future<void> _initWebSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token != null) {
      // Use 10.0.2.2 for Android emulator
      socket = IO.io('http://10.0.2.2:3000', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'auth': {'token': token},
      });

      socket!.onConnect((_) {
        setState(() => isConnected = true);
        socket!.emit('subscribe', {'type': 'lot', 'id': widget.lotId});
      });

      socket!.on('slot:updated', (data) {
        context.read<ParkingBloc>().add(
              UpdateSlotStatus(
                data['slotId'],
                data['updates']['status'],
                data['updates']['confidence'] ?? 0.9,
              ),
            );
      });

      socket!.onDisconnect((_) {
        setState(() => isConnected = false);
      });
    }
  }

  @override
  void dispose() {
    socket?.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'available':
        return Colors.green;
      case 'occupied':
        return Colors.red;
      case 'reserved':
        return Colors.orange;
      case 'maintenance':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  void _showReservationDialog(BuildContext context, ParkingSlot slot) {
    final startTime = DateTime.now();
    DateTime endTime = startTime.add(const Duration(hours: 1));

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('Reserve Slot ${slot.slotNumber}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Select duration:'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ActionChip(
                    label: const Text('1h'),
                    backgroundColor: endTime.difference(startTime).inHours == 1
                        ? Colors.blue.shade100
                        : null,
                    onPressed: () {
                      setDialogState(() {
                        endTime = startTime.add(const Duration(hours: 1));
                      });
                    },
                  ),
                  ActionChip(
                    label: const Text('2h'),
                    backgroundColor: endTime.difference(startTime).inHours == 2
                        ? Colors.blue.shade100
                        : null,
                    onPressed: () {
                      setDialogState(() {
                        endTime = startTime.add(const Duration(hours: 2));
                      });
                    },
                  ),
                  ActionChip(
                    label: const Text('3h'),
                    backgroundColor: endTime.difference(startTime).inHours == 3
                        ? Colors.blue.shade100
                        : null,
                    onPressed: () {
                      setDialogState(() {
                        endTime = startTime.add(const Duration(hours: 3));
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Price: \$${(3.0 * endTime.difference(startTime).inHours).toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                context.read<ReservationBloc>().add(
                      CreateReservation(
                        slotId: slot.id,
                        startTime: startTime,
                        endTime: endTime,
                      ),
                    );
                Navigator.pop(context);
              },
              child: const Text('Confirm'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parking Slots'),
        actions: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isConnected ? Colors.green : Colors.grey,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  isConnected ? 'Live' : 'Offline',
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<ReservationBloc, ReservationState>(
            listener: (context, state) {
              if (state is ReservationOperationSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(state.message)),
                );
                // Refresh slots
                context.read<ParkingBloc>().add(LoadParkingSlots(widget.lotId));
              } else if (state is ReservationError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(state.message)),
                );
              }
            },
          ),
        ],
        child: BlocBuilder<ParkingBloc, ParkingState>(
          builder: (context, state) {
            if (state is ParkingLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is ParkingError) {
              return Center(child: Text(state.message));
            } else if (state is ParkingSlotsLoaded) {
              final statusCounts = <String, int>{};
              for (var slot in state.slots) {
                statusCounts[slot.status] =
                    (statusCounts[slot.status] ?? 0) + 1;
              }

              return Column(
                children: [
                  // Lot Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: Colors.white,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          state.lot.name,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          state.lot.address,
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _StatusChip(
                              label: 'Available',
                              count: statusCounts['available'] ?? 0,
                              color: Colors.green,
                            ),
                            _StatusChip(
                              label: 'Occupied',
                              count: statusCounts['occupied'] ?? 0,
                              color: Colors.red,
                            ),
                            _StatusChip(
                              label: 'Reserved',
                              count: statusCounts['reserved'] ?? 0,
                              color: Colors.orange,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  // Slots Grid
                  Expanded(
                    child: GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 5,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        childAspectRatio: 1,
                      ),
                      itemCount: state.slots.length,
                      itemBuilder: (context, index) {
                        final slot = state.slots[index];
                        final isAvailable = slot.status == 'available';

                        return InkWell(
                          onTap: isAvailable
                              ? () => _showReservationDialog(context, slot)
                              : null,
                          child: _SlotCard(
                            slot: slot,
                            color: _getStatusColor(slot.status),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              );
            }

            return const Center(child: Text('No data'));
          },
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatusChip({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$count',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class _SlotCard extends StatelessWidget {
  final ParkingSlot slot;
  final Color color;

  const _SlotCard({required this.slot, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            slot.slotNumber,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${(slot.confidence * 100).toStringAsFixed(0)}%',
            style: const TextStyle(color: Colors.white70, fontSize: 8),
          ),
        ],
      ),
    );
  }
}
