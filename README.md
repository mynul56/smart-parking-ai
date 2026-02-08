# Smart Parking Platform

An AI-powered smart car parking management system with real-time monitoring, mobile app, web dashboard, and AI-based parking detection simulation.

## 🏗️ Project Structure

This is a monorepo containing four main components:

```
smart-parking-ai/
├── backend/          # Express.js REST API + WebSocket server
├── web/             # Next.js admin/user dashboard
├── ai/              # AI parking detection simulation service
└── mobile/          # Flutter mobile application
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for backend, web, and AI services)
- Flutter 3.0+ (for mobile app)
- MongoDB (MongoDB Atlas recommended)

### 1. Backend API

```bash
cd backend
npm install
npm run setup-db    # Create database collections
npm run seed-db     # Seed sample data
npm start           # Start on http://localhost:3000
```

**Features:**

- RESTful API for parking management
- WebSocket for real-time updates
- JWT authentication
- Role-based access control (Admin, Staff, User)

📖 [Backend Documentation](./backend/README.md)

---

### 2. Web Dashboard

```bash
cd web
npm install
npm run dev        # Start on http://localhost:3000
```

**Features:**

- Real-time parking lot monitoring
- Reservation management
- Analytics and reporting
- Admin controls

---

### 3. AI Simulation Service

```bash
cd ai
npm install
npm start          # Starts AI detection simulation
```

**Features:**

- Simulates parking slot occupancy detection
- Random vehicle entry/exit events
- Sends updates to backend via WebSocket
- Configurable simulation parameters

---

### 4. Mobile App

```bash
cd mobile
flutter pub get
flutter run        # Run on connected device/emulator
```

**Features:**

- Find nearby parking lots
- Real-time slot availability
- Make reservations
- QR code check-in
- Google Maps integration

---

## 🔧 Environment Configuration

Each service has its own `.env` file:

- **Backend**: `backend/.env` - MongoDB, JWT secrets
- **Web**: `web/.env.local` - API URL, Next.js config
- **AI**: `ai/.env` - Backend WebSocket URL
- **Mobile**: Config in `mobile/pubspec.yaml`

Example configurations are provided in `.env.example` files.

---

## 🐳 Docker Deployment

Run all services with Docker Compose:

```bash
docker-compose up -d
```

Services will be available at:

- Backend API: `http://localhost:3000`
- Web Dashboard: `http://localhost:3001`
- AI Service: Running in background

---

## 📚 API Documentation

**Base URL:** `http://localhost:3000/api/v1`

### Key Endpoints

- `POST /auth/login` - User authentication
- `GET /lots` - Get nearby parking lots
- `GET /lots/:id/slots` - Get slots for a lot
- `POST /reservations` - Create reservation
- `GET /reservations/me` - Get my reservations

**WebSocket:** `ws://localhost:3000`

Full API documentation: [Backend README](./backend/README.md)

---

## 🧪 Testing

### Test Credentials

```
Admin:  admin@parking.com  / password123
Staff:  staff@parking.com  / password123
User:   user@parking.com   / password123
```

### Test Flow

1. Start backend: `cd backend && npm start`
2. Start AI service: `cd ai && npm start`
3. Start web dashboard: `cd web && npm run dev`
4. Login to dashboard with test credentials
5. Observe real-time slot updates from AI simulation

---

## 🛠️ Tech Stack

| Component  | Technologies                                           |
| ---------- | ------------------------------------------------------ |
| Backend    | Node.js, Express, MongoDB, Socket.IO, JWT              |
| Web        | Next.js 14, React 18, TypeScript, TailwindCSS, Zustand |
| AI Service | Node.js, Socket.IO, MongoDB                            |
| Mobile     | Flutter, Dart, BLoC pattern, Google Maps               |

---

## 📱 Features

### User Features

✅ Find nearby parking lots with map view
✅ Real-time slot availability
✅ Reserve parking slots
✅ QR code-based check-in
✅ Booking history
✅ Push notifications

### Admin Features

✅ Real-time monitoring dashboard
✅ Manage parking lots and slots
✅ View AI detection logs
✅ User management
✅ Analytics and reports
✅ System configuration

### AI Features

✅ Automated slot occupancy detection
✅ Anomaly detection
✅ Confidence scoring
✅ Event logging with TTL

---

## 🚀 Deployment

### Production Recommendations

**Backend:**

- Deploy to AWS EC2, DigitalOcean, or Heroku
- Use MongoDB Atlas for database
- Enable PM2 for process management
- Add nginx for load balancing
- Implement SSL with Let's Encrypt

**Web:**

- Deploy to Vercel, Netlify, or AWS Amplify
- Enable static page optimization
- Configure proper environment variables

**Mobile:**

- Build APK: `flutter build apk --release`
- Build iOS: `flutter build ios --release`
- Publish to Google Play Store & App Store

---

## 📝 Development Workflow

1. **Backend-first**: Ensure backend API is running
2. **AI Service**: Start simulation for development data
3. **Web Dashboard**: Develop/test admin features
4. **Mobile App**: Develop/test user features

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes in the relevant service folder
3. Test all affected services
4. Submit a pull request

---

## 📄 License

ISC

---

## 🆘 Support

For issues or questions:

- Backend: See `backend/README.md`
- Web: See `web/README.md`
- AI: See `ai/README.md`
- Mobile: See `mobile/README.md`
- Database: See `backend/README_DATABASE.md`

---

**Built with ❤️ for smarter parking solutions**
