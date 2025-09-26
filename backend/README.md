# Network Simulator Backend

A FastAPI-based backend for a Computer Network Simulator that provides real-time packet simulation with WebSocket streaming, anomaly injection, and AI-powered tutoring.

## Features

- **Real-time Simulation**: WebSocket-based packet streaming with animation events
- **Anomaly Injection**: Configurable network issues (packet loss, delay, corruption, etc.)
- **Session Management**: Multi-student isolation with undo/redo capabilities
- **AI Integration**: Query endpoint for contextual network behavior explanations
- **Persistence**: PostgreSQL with comprehensive logging
- **Async Architecture**: High-performance async FastAPI implementation

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database and update `.env` file

3. Run database migrations:
```bash
alembic upgrade head
```

4. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- API Docs: http://localhost:8000/docs
- WebSocket Events: ws://localhost:8000/ws/{session_id}

## Architecture

- `app/` - Main application code
- `app/models/` - SQLAlchemy database models
- `app/api/` - REST API endpoints
- `app/core/` - Core business logic and simulation engine
- `app/websocket/` - WebSocket handlers
- `alembic/` - Database migrations