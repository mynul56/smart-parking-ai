import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/models.dart';

// Events
abstract class ReservationEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadReservations extends ReservationEvent {}

class CreateReservation extends ReservationEvent {
  final String slotId;
  final DateTime startTime;
  final DateTime endTime;

  CreateReservation({
    required this.slotId,
    required this.startTime,
    required this.endTime,
  });

  @override
  List<Object?> get props => [slotId, startTime, endTime];
}

class CancelReservation extends ReservationEvent {
  final String id;

  CancelReservation(this.id);

  @override
  List<Object?> get props => [id];
}

// States
abstract class ReservationState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ReservationInitial extends ReservationState {}

class ReservationLoading extends ReservationState {}

class ReservationsLoaded extends ReservationState {
  final List<Reservation> reservations;

  ReservationsLoaded(this.reservations);

  @override
  List<Object?> get props => [reservations];
}

class ReservationOperationSuccess extends ReservationState {
  final String message;

  ReservationOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class ReservationError extends ReservationState {
  final String message;

  ReservationError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
class ReservationBloc extends Bloc<ReservationEvent, ReservationState> {
  final ApiClient apiClient;

  ReservationBloc(this.apiClient) : super(ReservationInitial()) {
    on<LoadReservations>(_onLoadReservations);
    on<CreateReservation>(_onCreateReservation);
    on<CancelReservation>(_onCancelReservation);
  }

  Future<void> _onLoadReservations(
    LoadReservations event,
    Emitter<ReservationState> emit,
  ) async {
    emit(ReservationLoading());
    try {
      final response = await apiClient.getMyReservations();
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'];
        final reservations =
            data.map((json) => Reservation.fromJson(json)).toList();
        emit(ReservationsLoaded(reservations));
      } else {
        emit(ReservationError('Failed to load reservations'));
      }
    } catch (e) {
      emit(ReservationError(e.toString()));
    }
  }

  Future<void> _onCreateReservation(
    CreateReservation event,
    Emitter<ReservationState> emit,
  ) async {
    emit(ReservationLoading());
    try {
      final response = await apiClient.createReservation({
        'slotId': event.slotId,
        'startTime': event.startTime.toIso8601String(),
        'endTime': event.endTime.toIso8601String(),
      });

      if (response.statusCode == 201) {
        emit(ReservationOperationSuccess('Reservation created successfully'));
        add(LoadReservations());
      } else {
        emit(ReservationError('Failed to create reservation'));
      }
    } catch (e) {
      emit(ReservationError(e.toString()));
    }
  }

  Future<void> _onCancelReservation(
    CancelReservation event,
    Emitter<ReservationState> emit,
  ) async {
    emit(ReservationLoading());
    try {
      final response = await apiClient.cancelReservation(event.id);
      if (response.statusCode == 200) {
        emit(ReservationOperationSuccess('Reservation cancelled successfully'));
        add(LoadReservations());
      } else {
        emit(ReservationError('Failed to cancel reservation'));
      }
    } catch (e) {
      emit(ReservationError(e.toString()));
    }
  }
}
