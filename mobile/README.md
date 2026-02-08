# Smart Parking Mobile App (Flutter)

Complete Flutter mobile application for the AI-Based Smart Car Parking Platform.

## ✅ Features Implemented

### Authentication
- ✅ Login with JWT token management
- ✅ Automatic token refresh
- ✅ Secure credential storage
- ✅ Form validation

### Parking Management
- ✅ Browse all parking lots
- ✅ View lot details with real-time slot grid
- ✅ Live WebSocket updates for slot changes
- ✅ Occupancy visualization
- ✅ Color-coded slot status

### Architecture
- ✅ Clean Architecture pattern
- ✅ BLoC state management
- ✅ Dependency Injection (GetIt)
- ✅ Equatable for value comparison
- ✅ Dio for HTTP requests
- ✅ Socket.IO for real-time updates

## 📱 Screenshots

### Login Screen
- Material Design 3
- Gradient background
- Form validation
- Loading states

### Home Screen
- Parking lot list
- Availability indicators
- Pull-to-refresh
- Occupancy progress bars

### Lot Detail
- Real-time slot grid (5x40 grid for 200 slots)
- Live connection indicator
- Status counters
- Color-coded slots (green/red/orange/grey)

## 🚀 Running the App

### Prerequisites
```bash
flutter --version  # Should be >= 3.0.0
```

### Setup
```bash
# Install dependencies
cd smart_parking_mobile
flutter pub get

# Update API URL if needed (lib/core/api/api_client.dart)
# Default: http://localhost:3000/api/v1
```

### Run on Emulator/Device
```bash
# iOS Simulator
flutter run

# Android Emulator
flutter run

# Specific device
flutter devices
flutter run -d <device_id>
```

## 🔐 Test Credentials

```
Email: user@parking.com
Password: password123
```

## 📂 Project Structure

```
lib/
├── main.dart                           # App entry point
├── core/
│   ├── api/
│   │   └── api_client.dart            # HTTP client with interceptors
│   └── models/
│       └── models.dart                 # Domain entities
├── features/
│   ├── auth/
│   │   ├── bloc/
│   │   │   └── auth_bloc.dart         # Authentication logic
│   │   └── pages/
│   │       └── login_page.dart        # Login UI
│   └── parking/
│       ├── bloc/
│       │   └── parking_bloc.dart      # Parking lot logic
│       └── pages/
│           ├── home_page.dart         # Lot list
│           └── lot_detail_page.dart   # Slot grid
```

## 🔧 Configuration

### Update Backend URL

Edit `lib/core/api/api_client.dart`:
```dart
static const String baseUrl = 'YOUR_API_URL/api/v1';
```

For local testing with Android emulator:
```dart
static const String baseUrl = 'http://10.0.2.2:3000/api/v1';
```

For iOS simulator:
```dart
static const String baseUrl = 'http://localhost:3000/api/v1';
```

### WebSocket URL

Edit `lib/features/parking/pages/lot_detail_page.dart`:
```dart
socket = IO.io('YOUR_WEBSOCKET_URL', ...);
```

## 🎨 Customization

### Theme Colors

Edit `lib/main.dart`:
```dart
colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
```

### Slot Grid Layout

Edit `lib/features/parking/pages/lot_detail_page.dart`:
```dart
SliverGridDelegateWithFixedCrossAxisCount(
  crossAxisCount: 5,  // Change columns
  ...
)
```

## 🧪 Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Code coverage
flutter test --coverage
```

## 📦 Build for Production

### Android
```bash
flutter build apk --release          # APK
flutter build appbundle --release    # App Bundle (for Play Store)
```

### iOS
```bash
flutter build ios --release
# Then archive in Xcode
```

## 🔌 API Integration

### Endpoints Used
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `GET /lots` - List parking lots
- `GET /lots/:id` - Lot details
- `GET /lots/:id/slots` - Slot list
- `GET /users/me` - User profile

### WebSocket Events
- `connect` - Establish connection
- `subscribe` - Subscribe to lot updates
- `slot:updated` - Real-time slot changes
- `disconnect` - Connection closed

## ⚡ Performance

- Efficient state management with BLoC
- Lazy loading for large lists
- Grid virtualization for 200+ slots
- Optimized rebuilds with Equatable
- Network caching with Dio interceptors

## 🔒 Security

- JWT token storage in SharedPreferences
- Automatic token refresh
- Secure HTTPS connections (production)
- Input validation
- Error handling

## 🐛 Troubleshooting

### WebSocket not connecting
- Ensure backend is running
- Check WebSocket URL
- Verify JWT token is valid

### API errors
- Check network connectivity
- Verify API endpoint URLs
- Ensure backend is accessible from device

### Build failures
- Run `flutter clean && flutter pub get`
- Update Flutter: `flutter upgrade`
- Check `pubspec.yaml` compatibility

## 📱 Device Compatibility

- **iOS:** 12.0+
- **Android:** API 21+ (Android 5.0 Lollipop)
- **Platforms:** iOS, Android

## 🛠️ Development Tools

```bash
# Code generation (if using freezed)
flutter pub run build_runner build --delete-conflicting-outputs

# Analyze code
flutter analyze

# Format code
dart format lib/
```

## 📖 Additional Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [BLoC Pattern Guide](https://bloclibrary.dev/)
- [Dio Package](https://pub.dev/packages/dio)
- [Socket.IO Client](https://pub.dev/packages/socket_io_client)

## 🚢 Deployment

### Google Play Store
1. Update version in `pubspec.yaml`
2. Build app bundle: `flutter build appbundle --release`
3. Upload to Play Console

### Apple App Store
1. Update version in `pubspec.yaml`
2. Build iOS: `flutter build ios --release`
3. Archive and upload via Xcode

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**License:** MIT
