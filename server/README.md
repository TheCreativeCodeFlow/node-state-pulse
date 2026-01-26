# Node State Pulse - Backend Server

Backend API server for the AI-assisted network simulation platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **WebSocket**: Socket.IO
- **Authentication**: Firebase Admin SDK
- **AI**: Google Gemini API

## Getting Started

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then configure your `.env` file with:

#### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the values to your `.env`:
   - `FIREBASE_PROJECT_ID`: Your project ID
   - `FIREBASE_PRIVATE_KEY`: The private key from the JSON file
   - `FIREBASE_CLIENT_EMAIL`: The client email from the JSON file

#### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env` as `GEMINI_API_KEY`

### 3. Run Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 4. Test the Server

Health check:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "uptime": 0.123,
  "environment": "development",
  "version": "1.0.0"
}
```

## API Endpoints

### Authentication

- `POST /api/auth/verify` - Verify Firebase ID token (protected)
- `GET /api/auth/me` - Get current user info (protected)

### Health

- `GET /api/health` - Health check (public)

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── firebase.ts        # Firebase Admin initialization
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts            #  Authentication routes
│   │   └── health.ts          # Health check
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── index.ts               # Server entry point
├── package.json
├── tsconfig.json
└── .env                       # Environment variables (not in git)
```

## Next Steps

Phase 1 is complete! ✅

**What's working:**
- ✅ Express server with TypeScript
- ✅ Firebase Authentication integration
- ✅ Socket.IO ready for real-time features
- ✅ Auth middleware for protected routes
- ✅ Health check endpoint

**Next phases:**
- Phase 2: Session Management
- Phase 3: Simulation Engine
- Phase 4: Logging Service
- Phase 5: Collaboration
- Phase 6: AI Chat

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Check TypeScript types

## Security

- API keys are server-side only (never exposed to client)
- Firebase tokens validated on every protected request
- CORS configured for frontend origin
- Helmet.js for security headers
