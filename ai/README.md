# AI Parking Detection Simulation

Simulates AI-powered parking detection by automatically updating slot statuses in real-time.

## How It Works

- Connects to MongoDB database
- Randomly selects parking slots
- Changes status based on realistic transition probabilities
- Generates AI confidence scores (70-99%)
- Logs events to `ai_event_logs` collection
- Updates in real-time (2-5 second intervals)

## Status Transitions

**Available → Occupied** (30%)  
**Available → Reserved** (10%)  
**Occupied → Available** (20%)  
**Reserved → Occupied** (60%)

## Running

```bash
# Install dependencies
npm install

# Start simulation
npm start

# Development mode (auto-restart)
npm run dev
```

## Output

```
✅ Connected to MongoDB: smart_parking_db
🤖 Starting AI detection simulation...
📊 Updating slots every 2-5 seconds
==================================================
🤖 AI Update: Slot A-042 available → occupied (94.2%)
🤖 AI Update: Slot A-156 occupied → available (88.7%)
```

## Integration

Slots are updated in MongoDB, and the main API server broadcasts changes via WebSocket to connected clients. Web dashboard will show real-time updates automatically.
