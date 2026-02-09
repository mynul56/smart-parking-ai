# Bangladesh AI Training Guide

## 🇧🇩 What Changed

Your AI chatbot is now fully trained for Bangladesh! It understands Bengali phrases, local areas, and provides context-aware responses.

## ✅ AI Capabilities

### 1. **Location Detection**

The AI automatically detects if you're in Bangladesh by:

- GPS coordinates (20-27°N, 88-93°E)
- Mentioning Bangladesh cities (Dhaka, Chittagong, Sylhet, etc.)
- Mentioning Dhaka areas (Dhanmondi, Gulshan, Uttara, Banani, etc.)
- Using Bengali phrases
- Using BDT/Taka currency

### 2. **Bengali Language Support**

Understands common Bengali phrases:

- "Assalamu alaikum" / "Salam"
- "Kemon acho" (How are you?)
- "Kothay" (Where?)
- "Koto taka" / "Dam koto" (How much?)
- "Parking khujchi" (Looking for parking)
- "Khali ache" (Is it available?)

### 3. **Bangladesh-Specific Features**

- **Currency**: Uses ৳ (Taka) instead of $
- **Pricing**: Default 50 BDT/hour (vs $5/hour)
- **Areas**: Knows Dhanmondi, Gulshan, Uttara, Banani, Bashundhara, etc.
- **Features**: Security guard, 24/7, near shopping/bazar
- **Bilingual Responses**: Mix of English and Bengali

## 🗣️ Example Conversations

### English

**You:** "Find me parking in Dhanmondi"
**AI:** "সুখবর! আপনার জন্য 2টি পার্কিং অপশন পেয়েছি।

🅿️ **Dhanmondi Shopping Complex Parking** সবচেয়ে ভালো!
📍 Road 2, Dhanmondi, Dhaka 1205
✅ 45টি জায়গা খালি (মোট 80টি)
💵 ৳40/ঘণ্টা"

### Bengali Phrases

**You:** "Gulshan e parking kothay?"
**AI:** Returns parking options in Gulshan with bilingual response

**You:** "Koto taka?"
**AI:** Shows pricing in BDT (৳)

**You:** "Sasta parking dekhao"
**AI:** Shows cheapest parking options

### Mixed Language

**You:** "I need parking near Bashundhara mall"
**AI:** Understands "Bashundhara" and provides Bangladesh-context response

## 📍 Supported Locations

### **Dhaka Areas**

- Dhanmondi
- Gulshan (1 & 2)
- Banani
- Uttara
- Mirpur
- Mohammadpur
- Motijheel
- Bashundhara
- Badda
- Rampura
- Malibagh
- Tejgaon
- Farmgate
- Shahbag
- Old Dhaka / Purana Dhaka
- Sadarghat
- Kamalapur

### **Other Cities**

- Chittagong / Chattogram
- Sylhet
- Rajshahi
- Khulna
- Barisal
- Rangpur
- Mymensingh
- Comilla
- Gazipur
- Narayanganj
- Cox's Bazar
- Bogra
- Jessore
- Dinajpur

## 💰 Pricing Context

**Bangladesh:**

- Cheap: < ৳60/hour
- Moderate: ৳60-80/hour
- Expensive: > ৳80/hour
- Default: ৳50/hour

**International:**

- Cheap: < $5/hour
- Moderate: $5-10/hour
- Expensive: > $10/hour
- Default: $5/hour

## 🏗️ Bangladesh-Specific Features

The AI recognizes these features:

- `covered` / `chad` / `chader niche` - Covered parking
- `security` / `nirapod` / `nirapad` - Security features
- `security_guard` / `guard` / `chowkidar` - Security guard present
- `24/7` / `sorboda` / `sob somoy` - 24-hour access
- `near_shopping` / `mall` / `bazar` - Near shopping areas
- `cctv` / `camera` - CCTV surveillance
- `ev_charging` - Electric vehicle charging

## 📊 Sample Bangladesh Data

To add sample parking lots in Bangladesh, run:

```bash
cd backend
node scripts/bangladesh-seed.js
```

This adds:

- **12 parking lots** in Bangladesh
- **9 in Dhaka** (Dhanmondi, Gulshan, Uttara, Banani, Bashundhara, Motijheel)
- **2 in Chittagong** (Agrabad, GEC Circle)
- **1 in Sylhet** (Zindabazar)
- **1000+ parking slots** total

## 🧪 Test the AI

### Test Location Detection

```javascript
// In Bangladesh (will use Bengali context)
userLocation: { lat: 23.8103, lng: 90.4125 } // Dhaka

// Outside Bangladesh (will use English)
userLocation: { lat: 37.7749, lng: -122.4194 } // San Francisco
```

### Test Queries

**Location-based:**

- "Find parking in Dhanmondi"
- "Gulshan e parking kothay?"
- "Show me parking near Bashundhara"

**Price-based:**

- "Cheap parking in Dhaka"
- "Sasta parking dekhao"
- "Koto taka lagbe?"

**Feature-based:**

- "I need covered parking"
- "Security wala parking"
- "24 ghonta parking"

**Availability:**

- "What's available right now?"
- "Khali ache ki?"
- "Ekhon kothay parking available?"

**General:**

- "Assalamu alaikum"
- "Parking khujchi"
- "Help me find parking"

## 🔄 How It Works

1. **Message Received** → AI detects language and location context
2. **Intent Detection** → Understands what you're asking (find, price, availability)
3. **Context Detection** → Checks if Bangladesh context (location, language, currency)
4. **Query Processing** → Searches database with Bangladesh-specific parameters
5. **Response Generation** → Returns bilingual, context-aware response

## 🌐 Bilingual Responses

When Bangladesh context is detected:

- **Greeting**: "আসসালামু আলাইকুম! আমি আপনার AI পার্কিং এসিস্ট্যান্ট..."
- **Success**: "সুখবর! আপনার জন্য XটিParkingঅপশন পেয়েছি..."
- **Error**: "দুঃখিত! একটি সমস্যা হয়েছে..."
- **Help**: Mix of Bengali and English for clarity

## 🛠️ Technical Details

### Chatbot Service Updates

- Added Bangladesh city/area recognition
- Bengali phrase detection
- Bilingual response generation
- BDT currency support
- Bangladesh-specific features
- Context-aware pricing (50 BDT default)

### Detection Methods

```javascript
// Location-based
lat >= 20 && lat <= 27 && lng >= 88 && lng <= 93

// City/Area mentions
['dhaka', 'dhanmondi', 'gulshan', 'uttara', ...]

// Bengali phrases
['assalamu alaikum', 'kemon acho', 'koto taka', ...]

// Currency
/(taka|tk|bdt|৳)/i
```

## 📱 Mobile App

The mobile app automatically detects your location in Bangladesh and sends it to the AI:

```dart
// LocationService defaults to Dhaka, Bangladesh
latitude: 23.8103
longitude: 90.4125
```

## 🌐 Web App

The web app uses browser geolocation and falls back to Dhaka:

```typescript
// Default location
{ lat: 23.8103, lng: 90.4125 }
```

## ✨ Features Summary

| Feature         | Bangladesh             | International |
| --------------- | ---------------------- | ------------- |
| Currency        | ৳ (Taka)               | $ (USD)       |
| Default Price   | ৳50/hour               | $5/hour       |
| Language        | Bengali + English      | English       |
| Areas           | Dhaka areas recognized | Generic       |
| Cheap Threshold | < ৳60                  | < $5          |
| Response Style  | Bilingual              | English only  |

## 🚀 Next Steps

1. **Run the seed script** to add Bangladesh parking data
2. **Test the AI** with Bengali phrases
3. **Add more parking lots** in your specific areas
4. **Customize responses** for your local dialect
5. **Add more cities** as you expand

## 📝 Adding Custom Data

To add your own parking lots in Bangladesh:

```javascript
{
  name: 'Your Parking Lot Name',
  address: 'Full address in Bangladesh',
  location: {
    type: 'Point',
    coordinates: [longitude, latitude] // Note: [lng, lat]
  },
  totalSlots: 100,
  availableSlots: 75,
  pricePerHour: 45, // in BDT
  features: ['covered', 'security', '24/7'],
  status: 'active'
}
```

## 🎯 Success Indicators

✅ AI responds in Bengali when context detected
✅ Prices shown in ৳ (Taka)
✅ Recognizes Dhaka areas (Dhanmondi, Gulshan, etc.)
✅ Understands Bengali phrases
✅ Provides bilingual help messages
✅ Defaults to Dhaka coordinates

---

**Status**: ✅ AI fully trained for Bangladesh
**Coverage**: 🇧🇩 All major cities and Dhaka areas
**Language**: 🗣️ English + Bengali (Banglish)
**Currency**: 💰 BDT (Taka)
