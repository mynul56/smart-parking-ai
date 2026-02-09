import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/models/models.dart';
import '../../../core/services/location_service.dart';
import '../../../main.dart';
import '../bloc/parking_bloc.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Completer<GoogleMapController> _controller =
      Completer<GoogleMapController>();
  Set<Marker> _markers = {};
  ParkingLot? _selectedLot;
  final LocationService _locationService = getIt<LocationService>();
  bool _locationPermissionGranted = false;

  // Default to Dhaka, Bangladesh (will be updated with actual location)
  CameraPosition _initialPosition = const CameraPosition(
    target: LatLng(23.8103, 90.4125), // Dhaka, Bangladesh
    zoom: 14,
  );

  @override
  void initState() {
    super.initState();
    _requestLocationPermission();
    _getCurrentLocation();
    context.read<ParkingBloc>().add(LoadParkingLots());
  }

  Future<void> _requestLocationPermission() async {
    final status = await Permission.location.request();
    setState(() {
      _locationPermissionGranted = status.isGranted;
    });
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await _locationService.getCurrentLocationOrDefault();
      setState(() {
        _initialPosition = CameraPosition(
          target: LatLng(position.latitude, position.longitude),
          zoom: 14,
        );
      });

      // Move camera to user's location
      if (_controller.isCompleted) {
        final controller = await _controller.future;
        controller.animateCamera(
          CameraUpdate.newCameraPosition(_initialPosition),
        );
      }
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _controller.complete(controller);
    // if (_mapStyle != null) {
    //   controller.setMapStyle(_mapStyle);
    // }
  }

  void _updateMarkers(List<ParkingLot> lots) {
    setState(() {
      _markers = lots.map((lot) {
        final isSelected = _selectedLot?.id == lot.id;
        return Marker(
          markerId: MarkerId(lot.id),
          position: LatLng(lot.lat, lot.lng),
          onTap: () {
            setState(() {
              _selectedLot = lot;
            });
            _animateToLocation(lot.lat, lot.lng);
          },
          icon: BitmapDescriptor.defaultMarkerWithHue(
            lot.availableSlots > 0
                ? (isSelected
                    ? BitmapDescriptor.hueAzure
                    : BitmapDescriptor.hueGreen)
                : BitmapDescriptor.hueRed,
          ),
        );
      }).toSet();
    });
  }

  Future<void> _animateToLocation(double lat, double lng) async {
    final GoogleMapController controller = await _controller.future;
    controller.animateCamera(CameraUpdate.newLatLng(LatLng(lat, lng)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<ParkingBloc, ParkingState>(
        listener: (context, state) {
          if (state is ParkingLotsLoaded) {
            _updateMarkers(state.lots);
          }
        },
        builder: (context, state) {
          if (state is ParkingLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final lots = state is ParkingLotsLoaded ? state.lots : <ParkingLot>[];

          return Stack(
            children: [
              // 1. Google Map Layer (Full Screen)
              GoogleMap(
                mapType: MapType.normal,
                initialCameraPosition: _initialPosition,
                markers: _markers,
                onMapCreated: _onMapCreated,
                myLocationEnabled: _locationPermissionGranted,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                onTap: (_) {
                  setState(() {
                    _selectedLot = null;
                  });
                  _updateMarkers(lots);
                },
              ),

              // 2. Safe Area for UI Overlays
              Positioned.fill(
                child: SafeArea(
                  child: Stack(
                    children: [
                      // Top Search Box (Relative to SafeArea)
                      Positioned(
                        top: 10,
                        left: 16,
                        right: 16,
                        child: Column(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(30),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.1),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: TextField(
                                decoration: InputDecoration(
                                  hintText: 'Search parking locations...',
                                  prefixIcon: const Icon(Icons.search,
                                      color: Colors.grey),
                                  suffixIcon: IconButton(
                                    icon: const Icon(Icons.tune,
                                        color: Colors.grey),
                                    onPressed: () {
                                      // TODO: Show filters
                                    },
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 20, vertical: 15),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Right Side Buttons
                      Positioned(
                        right: 16,
                        top: 80, // Moved up slightly as we are in SafeArea
                        child: Column(
                          children: [
                            FloatingActionButton.small(
                              heroTag: 'location_btn',
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black87,
                              child: const Icon(Icons.my_location),
                              onPressed: () async {
                                await _getCurrentLocation();
                              },
                            ),
                            const SizedBox(height: 12),
                            FloatingActionButton.small(
                              heroTag: 'refresh_btn',
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black87,
                              child: const Icon(Icons.refresh),
                              onPressed: () {
                                context
                                    .read<ParkingBloc>()
                                    .add(LoadParkingLots());
                              },
                            ),
                          ],
                        ),
                      ),

                      // Bottom Cards (Card or List)
                      if (_selectedLot != null)
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: 10,
                          child: _ParkingLotDetailCard(lot: _selectedLot!),
                        )
                      else if (lots.isNotEmpty)
                        Positioned(
                          bottom: 10,
                          left: 0,
                          right: 0,
                          child: SizedBox(
                            height: 160,
                            child: ListView.builder(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              scrollDirection: Axis.horizontal,
                              itemCount: lots.length,
                              itemBuilder: (context, index) {
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: SizedBox(
                                    width: 300,
                                    child: GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _selectedLot = lots[index];
                                          _updateMarkers(lots);
                                        });
                                        _animateToLocation(
                                            lots[index].lat, lots[index].lng);
                                      },
                                      child: _ParkingLotCard(
                                          lot: lots[index], compact: true),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ParkingLotDetailCard extends StatelessWidget {
  final ParkingLot lot;

  const _ParkingLotDetailCard({required this.lot});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ParkingLotCard(lot: lot, compact: false),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context)
                      .pushNamed('/lot-detail', arguments: lot.id);
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  backgroundColor: Colors.blueAccent,
                ),
                child: const Text(
                  'View Details & Reserve',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ParkingLotCard extends StatelessWidget {
  final ParkingLot lot;
  final bool compact;

  const _ParkingLotCard({required this.lot, this.compact = false});

  Color _getOccupancyColor() {
    if (lot.occupancyRate < 0.5) return Colors.green;
    if (lot.occupancyRate < 0.8) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: compact
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                )
              ]
            : [],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
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
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        lot.address,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '\$${lot.hourlyRate.toStringAsFixed(0)}/h',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${(lot.occupancyRate * 100).toStringAsFixed(0)}% Occupied',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _getOccupancyColor(),
                            ),
                          ),
                          Text(
                            '${lot.availableSlots} spots left',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Progress Bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: lot.occupancyRate,
                          minHeight: 6,
                          backgroundColor: Colors.grey.shade100,
                          valueColor:
                              AlwaysStoppedAnimation(_getOccupancyColor()),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Tags Row (Traffic & Best Match)
                      Row(
                        children: [
                          if (lot.isBestMatch)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.purple,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.star,
                                      color: Colors.white, size: 12),
                                  SizedBox(width: 4),
                                  Text(
                                    'BEST MATCH',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getTrafficColor(lot.trafficCondition)
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.traffic,
                                    color:
                                        _getTrafficColor(lot.trafficCondition),
                                    size: 12),
                                const SizedBox(width: 4),
                                Text(
                                  lot.trafficCondition.toUpperCase(),
                                  style: TextStyle(
                                    color:
                                        _getTrafficColor(lot.trafficCondition),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getTrafficColor(String condition) {
    switch (condition.toLowerCase()) {
      case 'heavy':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
      default:
        return Colors.green;
    }
  }
}
