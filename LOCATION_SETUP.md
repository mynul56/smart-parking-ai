# Location Detection Setup

## What Changed

Your app now detects your actual location in Bangladesh instead of showing hardcoded USA data!

### Mobile App Changes

1. ✅ Added `geolocator` and `permission_handler` packages
2. ✅ Created `LocationService` to handle location detection
3. ✅ Updated HomePage to use actual location (defaults to Dhaka, Bangladesh)
4. ✅ Updated AI Chatbot to use your real location
5. ✅ Added Android location permissions
6. ✅ Added iOS location permissions

### Web App Changes

1. ✅ Dashboard now detects browser geolocation
2. ✅ AI Chatbot uses your actual location
3. ✅ Falls back to Dhaka, Bangladesh if location unavailable

## Setup Instructions

### For Mobile App

1. **Install Dependencies**

   ```bash
   cd mobile
   flutter pub get
   ```

2. **Clean and Rebuild**

   ```bash
   flutter clean
   flutter pub get
   ```

3. **Run the App**

   ```bash
   # For Android
   flutter run

   # For iOS
   flutter run
   ```

4. **Grant Location Permission**
   - When the app starts, it will ask for location permission
   - Tap "Allow" or "Allow while using app"
   - The map will center on your location in Bangladesh!

### For Web App

1. **No installation needed** - just refresh your browser

2. **Grant Location Permission**
   - Your browser will show a prompt asking for location access
   - Click "Allow"
   - The AI chatbot will now use your actual location

## How It Works

### Mobile App

**HomePage (`home_page.dart`)**

- On startup, requests your location
- Centers map on Bangladesh (Dhaka: 23.8103°N, 90.4125°E) by default
- Updates to your actual location when available
- "My Location" button refreshes your position

**AI Chatbot (`chatbot_page.dart`)**

- Detects your location on page load
- Sends location to AI for better parking recommendations
- Falls back to Dhaka coordinates if unavailable

**LocationService (`location_service.dart`)**

- Checks if location services are enabled
- Requests permissions if needed
- Gets current GPS position
- Falls back to Dhaka, Bangladesh if unavailable

### Web App

**Dashboard (`dashboard/page.tsx`)**

- Uses browser's Geolocation API
- Detects your location automatically
- Defaults to Dhaka if permission denied

**Chatbot (`Chatbot.tsx`)**

- Receives location from parent component
- Uses it for AI parking suggestions

## Testing Location

### On Real Device (Recommended)

```bash
# Connect your phone and run
flutter run
```

✅ Will use your actual GPS location in Bangladesh!

### On Emulator

**Android Emulator:**

1. Open Extended Controls (⋮ button)
2. Go to Location
3. Enter Bangladesh coordinates:
   - Latitude: 23.8103
   - Longitude: 90.4125
4. Click "Send"

**iOS Simulator:**

1. Go to Features → Location
2. Select "Custom Location"
3. Enter: 23.8103, 90.4125

## Default Location

If location is unavailable, the app defaults to:
**Dhaka, Bangladesh**

- Latitude: 23.8103°N
- Longitude: 90.4125°E
- Zoom: 14

## Permissions Required

### Android (`AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS (`Info.plist`)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to your location to help you find nearby parking spots.</string>
```

### Web (Browser)

- Automatically prompts for permission
- Must be on HTTPS (or localhost)

## Troubleshooting

### "Location permission denied"

- Go to phone Settings → Apps → Smart Parking → Permissions
- Enable Location permission

### "Map shows wrong location"

- Tap the "My Location" button (target icon)
- Wait a few seconds for GPS to acquire location

### "Still showing USA data"

- Make sure you ran `flutter pub get`
- Stop and restart the app completely
- Clear app data and reinstall

### Web shows wrong location

- Check browser location permissions
- Try in a different browser
- Use HTTPS (location may not work on HTTP)

## API Integration

The location is sent to the backend API when:

1. Loading parking lots (to find nearby ones)
2. Asking the AI chatbot for recommendations
3. Calculating distances to parking spots

Example API call:

```dart
{
  "message": "Find me parking nearby",
  "userLocation": {
    "lat": 23.8103,
    "lng": 90.4125
  }
}
```

## Next Steps

Now that location works:

1. ✅ Map centers on Bangladesh
2. ✅ AI chatbot knows your location
3. ✅ Can find nearby parking (when data is available)
4. 🔄 Need to add parking lot data for Bangladesh in your database

To add parking lots in Bangladesh, use the admin panel or API to create lots with Bangladesh coordinates!

---

**Status**: ✅ Location detection fully implemented
**Last Updated**: February 8, 2026
