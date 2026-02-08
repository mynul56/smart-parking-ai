import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/models.dart';

// Events
abstract class AuthEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  LoginRequested(this.email, this.password);

  @override
  List<Object?> get props => [email, password];
}

class RegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String name;
  final String? phone;

  RegisterRequested(this.email, this.password, this.name, [this.phone]);

  @override
  List<Object?> get props => [email, password, name, phone];
}

class UpdateProfileRequested extends AuthEvent {
  final String name;
  final String phone;

  UpdateProfileRequested(this.name, this.phone);

  @override
  List<Object?> get props => [name, phone];
}

class LogoutRequested extends AuthEvent {}

class CheckAuthStatus extends AuthEvent {}

// States
abstract class AuthState extends Equatable {
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class Authenticated extends AuthState {
  final User user;
  final String token;

  Authenticated(this.user, this.token);

  @override
  List<Object?> get props => [user, token];
}

class Unauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  AuthError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiClient apiClient;
  final SharedPreferences prefs;

  AuthBloc(this.apiClient, this.prefs) : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<UpdateProfileRequested>(_onUpdateProfileRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      // print('Attempting login for: ${event.email}');
      final response = await apiClient.login(event.email, event.password);
      // print('Login response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = response.data['data'];
        final user = User.fromJson(data['user']);
        final token = data['token'];
        final refreshToken = data['refreshToken'];

        await prefs.setString('token', token);
        await prefs.setString('refreshToken', refreshToken);
        await prefs.setString('userId', user.id);

        await prefs.setString('userId', user.id);

        // print('Login successful for user: ${user.email}');
        emit(Authenticated(user, token));
      } else {
        final errorMsg = 'Login failed with status: ${response.statusCode}';
        // print(errorMsg);
        emit(AuthError(errorMsg));
      }
    } catch (e) {
      final errorMsg = 'Login error: ${e.toString()}';
      // print(errorMsg);
      emit(AuthError(errorMsg));
    }
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final response = await apiClient.register({
        'email': event.email,
        'password': event.password,
        'name': event.name,
        if (event.phone != null) 'phone': event.phone,
      });

      if (response.statusCode == 201) {
        final data = response.data['data'];
        final user = User.fromJson(data['user']);
        final token = data['token'];
        final refreshToken = data['refreshToken'];

        await prefs.setString('token', token);
        await prefs.setString('refreshToken', refreshToken);
        await prefs.setString('userId', user.id);

        emit(Authenticated(user, token));
      } else {
        emit(AuthError('Registration failed'));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await prefs.remove('token');
    await prefs.remove('refreshToken');
    await prefs.remove('userId');
    emit(Unauthenticated());
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    final token = prefs.getString('token');
    if (token != null) {
      try {
        final response = await apiClient.getProfile();
        if (response.statusCode == 200) {
          final user = User.fromJson(response.data['data']);
          emit(Authenticated(user, token));
          return;
        }
      } catch (e) {
        // Token invalid or user not found, clear storage
        await prefs.remove('token');
        await prefs.remove('refreshToken');
        await prefs.remove('userId');
      }
    } // Closes if (token != null)
    emit(Unauthenticated());
  }

  Future<void> _onUpdateProfileRequested(
    UpdateProfileRequested event,
    Emitter<AuthState> emit,
  ) async {
    final currentState = state;
    if (currentState is Authenticated) {
      try {
        final response = await apiClient.updateProfile({
          'name': event.name,
          'phone': event.phone,
        });

        if (response.statusCode == 200) {
          final user = User.fromJson(response.data['data']);
          emit(Authenticated(user, currentState.token));
        } else {
          emit(AuthError('Failed to update profile'));
          emit(Authenticated(currentState.user, currentState.token));
        }
      } catch (e) {
        emit(AuthError('Error: $e'));
        emit(Authenticated(currentState.user, currentState.token));
      }
    }
  }
}
