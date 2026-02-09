import 'dart:io';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    // iOS Physical Device uses computer's LAN IP
    return 'http://10.0.30.242:3000/api/v1';
  }

  late final Dio _dio;
  final SharedPreferences _prefs;

  ApiClient(this._prefs) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    // Request interceptor - add auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _prefs.getString('token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        // print('API Request: ${options.method} ${options.uri}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        // print('API Response: ${response.statusCode} - ${response.requestOptions.uri}');
        return handler.next(response);
      },
      onError: (error, handler) async {
        // print('API Error: ${error.message}');
        // print('Response: ${error.response?.data}');

        if (error.response?.statusCode == 401) {
          // Token expired, try refresh
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry original request
            return handler.resolve(await _dio.fetch(error.requestOptions));
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = _prefs.getString('refreshToken');
      if (refreshToken == null) return false;

      final response = await _dio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200) {
        final newToken = response.data['data']['token'];
        await _prefs.setString('token', newToken);
        return true;
      }
    } catch (e) {
      // Refresh failed, clear tokens
      await _prefs.remove('token');
      await _prefs.remove('refreshToken');
    }
    return false;
  }

  // Generic HTTP methods
  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> data) async {
    final response = await _dio.post(path, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await _dio.get(path);
    return response.data as Map<String, dynamic>;
  }

  // Auth
  Future<Response> login(String email, String password) {
    return _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> register(Map<String, dynamic> data) {
    return _dio.post('/auth/register', data: data);
  }

  // Parking Lots
  Future<Response> getParkingLots({double? lat, double? lng, double? radius}) {
    return _dio.get('/lots', queryParameters: {
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (radius != null) 'radius': radius,
    });
  }

  Future<Response> getParkingLot(String id) {
    return _dio.get('/lots/$id');
  }

  Future<Response> getRecommendations(double lat, double lng) {
    return _dio.post('/lots/recommend', data: {
      'lat': lat,
      'lng': lng,
    });
  }

  Future<Response> getSlots(String lotId, {String? status, int? limit}) {
    return _dio.get('/lots/$lotId/slots', queryParameters: {
      if (status != null) 'status': status,
      if (limit != null) 'limit': limit,
    });
  }

  // Reservations
  Future<Response> createReservation(Map<String, dynamic> data) {
    return _dio.post('/reservations', data: data);
  }

  Future<Response> getMyReservations({String? status}) {
    return _dio.get('/reservations/me', queryParameters: {
      if (status != null) 'status': status,
    });
  }

  Future<Response> cancelReservation(String id) {
    return _dio.delete('/reservations/$id');
  }

  // User
  Future<Response> getProfile() {
    return _dio.get('/users/me');
  }

  Future<Response> updateProfile(Map<String, dynamic> data) {
    return _dio.put('/users/me', data: data);
  }
}
