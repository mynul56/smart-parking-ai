import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/models.dart';

// Events
abstract class ParkingEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadParkingLots extends ParkingEvent {
  final double? lat;
  final double? lng;
  final double? radius;

  LoadParkingLots([this.lat, this.lng, this.radius]);

  @override
  List<Object?> get props => [lat, lng, radius];
}

class LoadParkingSlots extends ParkingEvent {
  final String lotId;

  LoadParkingSlots(this.lotId);

  @override
  List<Object?> get props => [lotId];
}

class UpdateSlotStatus extends ParkingEvent {
  final String slotId;
  final String status;
  final double confidence;

  UpdateSlotStatus(this.slotId, this.status, this.confidence);

  @override
  List<Object?> get props => [slotId, status, confidence];
}

// States
abstract class ParkingState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ParkingInitial extends ParkingState {}

class ParkingLoading extends ParkingState {}

class ParkingLotsLoaded extends ParkingState {
  final List<ParkingLot> lots;

  ParkingLotsLoaded(this.lots);

  @override
  List<Object?> get props => [lots];
}

class ParkingSlotsLoaded extends ParkingState {
  final List<ParkingSlot> slots;
  final ParkingLot lot;

  ParkingSlotsLoaded(this.slots, this.lot);

  @override
  List<Object?> get props => [slots, lot];
}

class ParkingError extends ParkingState {
  final String message;

  ParkingError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
class ParkingBloc extends Bloc<ParkingEvent, ParkingState> {
  final ApiClient apiClient;

  ParkingBloc(this.apiClient) : super(ParkingInitial()) {
    on<LoadParkingLots>(_onLoadParkingLots);
    on<LoadParkingSlots>(_onLoadParkingSlots);
    on<UpdateSlotStatus>(_onUpdateSlotStatus);
  }

  Future<void> _onLoadParkingLots(
    LoadParkingLots event,
    Emitter<ParkingState> emit,
  ) async {
    emit(ParkingLoading());
    try {
      final response = await apiClient.getParkingLots(
        lat: event.lat,
        lng: event.lng,
        radius: event.radius,
      );

      if (response.statusCode == 200) {
        final List lots = response.data['data'];
        final parkingLots = lots.map((e) => ParkingLot.fromJson(e)).toList();
        emit(ParkingLotsLoaded(parkingLots));
      } else {
        emit(ParkingError('Failed to load parking lots'));
      }
    } catch (e) {
      emit(ParkingError(e.toString()));
    }
  }

  Future<void> _onLoadParkingSlots(
    LoadParkingSlots event,
    Emitter<ParkingState> emit,
  ) async {
    emit(ParkingLoading());
    try {
      final lotResponse = await apiClient.getParkingLot(event.lotId);
      final slotsResponse = await apiClient.getSlots(event.lotId, limit: 500);

      if (lotResponse.statusCode == 200 && slotsResponse.statusCode == 200) {
        final lot = ParkingLot.fromJson(lotResponse.data['data']);
        final List slotsData = slotsResponse.data['data'];
        final slots = slotsData.map((e) => ParkingSlot.fromJson(e)).toList();
        emit(ParkingSlotsLoaded(slots, lot));
      } else {
        emit(ParkingError('Failed to load slots'));
      }
    } catch (e) {
      emit(ParkingError(e.toString()));
    }
  }

  Future<void> _onUpdateSlotStatus(
    UpdateSlotStatus event,
    Emitter<ParkingState> emit,
  ) async {
    if (state is ParkingSlotsLoaded) {
      final currentState = state as ParkingSlotsLoaded;
      final updatedSlots = currentState.slots.map((slot) {
        if (slot.id == event.slotId) {
          return ParkingSlot(
            id: slot.id,
            slotNumber: slot.slotNumber,
            status: event.status,
            confidence: event.confidence,
            lastDetectedAt: DateTime.now(),
          );
        }
        return slot;
      }).toList();

      emit(ParkingSlotsLoaded(updatedSlots, currentState.lot));
    }
  }
}
