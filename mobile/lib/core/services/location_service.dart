import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Check if location services are enabled and permissions are granted
  Future<bool> checkPermissions() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    // Check location permissions
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Get current user location
  Future<Position?> getCurrentLocation() async {
    try {
      // Check permissions first
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get current position
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  /// Get current location or return default (Dhaka, Bangladesh)
  Future<Position> getCurrentLocationOrDefault() async {
    final position = await getCurrentLocation();

    if (position != null) {
      return position;
    }

    // Default to Dhaka, Bangladesh if location is unavailable
    return Position(
      latitude: 23.8103, // Dhaka latitude
      longitude: 90.4125, // Dhaka longitude
      timestamp: DateTime.now(),
      accuracy: 0,
      altitude: 0,
      heading: 0,
      speed: 0,
      speedAccuracy: 0,
      altitudeAccuracy: 0,
      headingAccuracy: 0,
    );
  }

  /// Get location as a map for API calls
  Future<Map<String, double>> getLocationAsMap() async {
    final position = await getCurrentLocationOrDefault();
    return {
      'lat': position.latitude,
      'lng': position.longitude,
    };
  }

  /// Check distance between two coordinates (in meters)
  double calculateDistance(
    double startLat,
    double startLon,
    double endLat,
    double endLon,
  ) {
    return Geolocator.distanceBetween(startLat, startLon, endLat, endLon);
  }
}
