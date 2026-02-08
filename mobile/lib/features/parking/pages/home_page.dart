import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:async';
import '../bloc/parking_bloc.dart';
import '../../../core/models/models.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Completer<GoogleMapController> _controller =
      Completer<GoogleMapController>();
  bool _isMapView = true;
  Set<Marker> _markers = {};

  // San Francisco Center
  static const CameraPosition _kSanFrancisco = CameraPosition(
    target: LatLng(37.7749, -122.4194),
    zoom: 12,
  );

  @override
  void initState() {
    super.initState();
    context.read<ParkingBloc>().add(LoadParkingLots());
  }

  void _updateMarkers(List<ParkingLot> lots) {
    setState(() {
      _markers = lots.map((lot) {
        return Marker(
          markerId: MarkerId(lot.id),
          position: LatLng(lot.lat, lot.lng),
          infoWindow: InfoWindow(
            title: lot.name,
            snippet:
                'Available: ${lot.availableSlots} / Rate: \$${lot.hourlyRate}/hr',
            onTap: () {
              Navigator.of(context).pushNamed('/lot-detail', arguments: lot.id);
            },
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            lot.availableSlots > 0
                ? BitmapDescriptor.hueGreen
                : BitmapDescriptor.hueRed,
          ),
        );
      }).toSet();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Parking'),
        actions: [
          IconButton(
            icon: Icon(_isMapView ? Icons.list : Icons.map),
            tooltip: _isMapView ? 'Switch to List' : 'Switch to Map',
            onPressed: () {
              setState(() {
                _isMapView = !_isMapView;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<ParkingBloc>().add(LoadParkingLots());
            },
          ),
        ],
      ),
      body: BlocConsumer<ParkingBloc, ParkingState>(
        listener: (context, state) {
          if (state is ParkingLotsLoaded) {
            _updateMarkers(state.lots);
          }
        },
        builder: (context, state) {
          if (state is ParkingLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is ParkingError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(state.message),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<ParkingBloc>().add(LoadParkingLots());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          } else if (state is ParkingLotsLoaded) {
            if (state.lots.isEmpty) {
              return const Center(child: Text('No parking lots available'));
            }

            return _isMapView
                ? GoogleMap(
                    mapType: MapType.normal,
                    initialCameraPosition: _kSanFrancisco,
                    markers: _markers,
                    onMapCreated: (GoogleMapController controller) {
                      _controller.complete(controller);
                    },
                    myLocationEnabled: true,
                    myLocationButtonEnabled: true,
                  )
                : RefreshIndicator(
                    onRefresh: () async {
                      context.read<ParkingBloc>().add(LoadParkingLots());
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.lots.length,
                      itemBuilder: (context, index) {
                        return _ParkingLotCard(lot: state.lots[index]);
                      },
                    ),
                  );
          }

          return const Center(child: Text('Pull to refresh'));
        },
      ),
    );
  }
}

class _ParkingLotCard extends StatelessWidget {
  final ParkingLot lot;

  const _ParkingLotCard({required this.lot});

  Color _getOccupancyColor() {
    if (lot.occupancyRate < 0.5) return Colors.green;
    if (lot.occupancyRate < 0.8) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.of(context).pushNamed('/lot-detail', arguments: lot.id);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.local_parking, color: Colors.blue, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lot.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          lot.address,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _InfoChip(
                    icon: Icons.check_circle,
                    label: 'Available',
                    value: '${lot.availableSlots}',
                    color: Colors.green,
                  ),
                  _InfoChip(
                    icon: Icons.grid_view,
                    label: 'Total',
                    value: '${lot.totalSlots}',
                    color: Colors.blue,
                  ),
                  _InfoChip(
                    icon: Icons.attach_money,
                    label: 'Rate/hr',
                    value: '\$${lot.hourlyRate.toStringAsFixed(0)}',
                    color: Colors.purple,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: lot.occupancyRate,
                  minHeight: 8,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation(_getOccupancyColor()),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${(lot.occupancyRate * 100).toStringAsFixed(0)}% Full',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
      ],
    );
  }
}
