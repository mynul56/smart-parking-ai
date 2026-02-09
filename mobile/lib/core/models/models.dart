import 'package:equatable/equatable.dart';

export 'chatbot_models.dart';

class ParkingLot extends Equatable {
  final String id;
  final String name;
  final String address;
  final int totalSlots;
  final int availableSlots;
  final double lat;
  final double lng;
  final double hourlyRate;
  final String status;
  final String trafficCondition;
  final bool isBestMatch;

  const ParkingLot({
    required this.id,
    required this.name,
    required this.address,
    required this.totalSlots,
    required this.availableSlots,
    required this.lat,
    required this.lng,
    required this.hourlyRate,
    required this.status,
    this.trafficCondition = 'low',
    this.isBestMatch = false,
  });

  factory ParkingLot.fromJson(Map<String, dynamic> json) {
    return ParkingLot(
      id: json['_id'],
      name: json['name'],
      address: json['address'],
      totalSlots: json['totalSlots'],
      availableSlots: json['availableSlots'],
      lat: json['location']['coordinates'][1],
      lng: json['location']['coordinates'][0],
      hourlyRate: (json['pricing']?['hourlyRate'] ?? 0).toDouble(),
      status: json['status'] ?? 'active',
      trafficCondition: json['trafficCondition'] ?? 'low',
      isBestMatch: json['isBestMatch'] ?? false,
    );
  }

  double get occupancyRate => totalSlots > 0 ? (totalSlots - availableSlots) / totalSlots : 0.0;

  @override
  List<Object?> get props => [id, name, availableSlots, totalSlots, trafficCondition, isBestMatch];
}

class ParkingSlot extends Equatable {
  final String id;
  final String slotNumber;
  final String status;
  final double confidence;
  final DateTime? lastDetectedAt;

  const ParkingSlot({
    required this.id,
    required this.slotNumber,
    required this.status,
    required this.confidence,
    this.lastDetectedAt,
  });

  factory ParkingSlot.fromJson(Map<String, dynamic> json) {
    return ParkingSlot(
      id: json['_id'],
      slotNumber: json['slotNumber'],
      status: json['status'],
      confidence: (json['confidence'] ?? 0).toDouble(),
      lastDetectedAt: json['lastDetectedAt'] != null ? DateTime.parse(json['lastDetectedAt']) : null,
    );
  }

  @override
  List<Object?> get props => [id, slotNumber, status, confidence];
}

class Reservation extends Equatable {
  final String id;
  final String slotId;
  final String userId;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final double? totalCost;

  const Reservation({
    required this.id,
    required this.slotId,
    required this.userId,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.totalCost,
  });

  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['_id'],
      slotId: json['slotId'],
      userId: json['userId'],
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      status: json['status'],
      totalCost: json['totalCost']?.toDouble(),
    );
  }

  @override
  List<Object?> get props => [id, slotId, status];
}

class User extends Equatable {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? phone;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'], // Handle both 'id' and '_id'
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      phone: json['phone'],
    );
  }

  @override
  List<Object?> get props => [id, email];
}
