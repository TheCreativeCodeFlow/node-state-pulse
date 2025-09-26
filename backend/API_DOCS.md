# API Documentation

## Network Simulator Backend API

### Base URL
```
http://localhost:8000
```

### WebSocket URL
```
ws://localhost:8000/ws/{session_id}
```

## Authentication
Currently no authentication required. In production, implement proper session-based authentication.

## API Endpoints

### Sessions
- `POST /api/v1/sessions/` - Create new session
- `GET /api/v1/sessions/` - List all sessions
- `GET /api/v1/sessions/{session_id}` - Get session details
- `PUT /api/v1/sessions/{session_id}` - Update session
- `DELETE /api/v1/sessions/{session_id}` - Deactivate session
- `POST /api/v1/sessions/{session_id}/undo-redo` - Handle undo/redo
- `GET /api/v1/sessions/{session_id}/stats` - Get session statistics

### Nodes
- `POST /api/v1/nodes/{session_id}/nodes` - Create node
- `GET /api/v1/nodes/{session_id}/nodes` - List nodes
- `GET /api/v1/nodes/{session_id}/nodes/{node_id}` - Get node
- `PUT /api/v1/nodes/{session_id}/nodes/{node_id}` - Update node
- `DELETE /api/v1/nodes/{session_id}/nodes/{node_id}` - Delete node

### Connections
- `POST /api/v1/connections/{session_id}/connections` - Create connection
- `GET /api/v1/connections/{session_id}/connections` - List connections
- `GET /api/v1/connections/{session_id}/connections/{connection_id}` - Get connection
- `PUT /api/v1/connections/{session_id}/connections/{connection_id}` - Update connection
- `DELETE /api/v1/connections/{session_id}/connections/{connection_id}` - Delete connection
- `GET /api/v1/connections/{session_id}/nodes/{node_id}/connections` - Get node connections

### Messages
- `POST /api/v1/messages/{session_id}/messages` - Create message
- `GET /api/v1/messages/{session_id}/messages` - List messages
- `GET /api/v1/messages/{session_id}/messages/{message_id}` - Get message
- `DELETE /api/v1/messages/{session_id}/messages/{message_id}` - Delete message

### Anomalies
- `POST /api/v1/anomalies/{session_id}/anomalies` - Create anomaly
- `GET /api/v1/anomalies/{session_id}/anomalies` - List anomalies
- `GET /api/v1/anomalies/{session_id}/anomalies/{anomaly_id}` - Get anomaly
- `PUT /api/v1/anomalies/{session_id}/anomalies/{anomaly_id}/toggle` - Toggle anomaly
- `DELETE /api/v1/anomalies/{session_id}/anomalies/{anomaly_id}` - Delete anomaly

### Simulation
- `POST /api/v1/simulation/{session_id}/simulate` - Start simulation
- `POST /api/v1/simulation/{session_id}/simulate/{simulation_id}/stop` - Stop simulation
- `GET /api/v1/simulation/{session_id}/simulate/status` - Get simulation status
- `POST /api/v1/simulation/{session_id}/validate` - Validate network topology

### AI Tutor
- `POST /api/v1/ai/{session_id}/query` - Query AI tutor
- `GET /api/v1/ai/{session_id}/query/suggestions` - Get query suggestions

## WebSocket Events

### Connection Events
- `connection_established` - WebSocket connected
- `pong` - Response to ping

### Simulation Events
- `simulation_started` - Simulation began
- `simulation_completed` - Simulation finished
- `simulation_error` - Simulation failed
- `packet_sent` - Packet sent from source
- `packet_arrived` - Packet arrived at node
- `packet_delivered` - Packet delivered to destination
- `packet_lost` - Packet lost due to anomaly
- `packet_delayed` - Packet delayed
- `packet_misdelivered` - Packet delivered to wrong destination
- `packet_failed` - Packet transmission failed

### Log Events
- `log_*` - Various log events broadcast to frontend

## Example Usage

### 1. Create a Session
```bash
curl -X POST "http://localhost:8000/api/v1/sessions/" \
  -H "Content-Type: application/json" \
  -d '{"student_name": "John Doe"}'
```

### 2. Create Nodes
```bash
curl -X POST "http://localhost:8000/api/v1/nodes/{session_id}/nodes" \
  -H "Content-Type: application/json" \
  -d '{"name": "Router1", "node_type": "router", "x_position": 100, "y_position": 100}'
```

### 3. Create Connection
```bash
curl -X POST "http://localhost:8000/api/v1/connections/{session_id}/connections" \
  -H "Content-Type: application/json" \
  -d '{"source_node_id": 1, "destination_node_id": 2, "bandwidth_mbps": 100}'
```

### 4. Create Message
```bash
curl -X POST "http://localhost:8000/api/v1/messages/{session_id}/messages" \
  -H "Content-Type: application/json" \
  -d '{"source_node_id": 1, "destination_node_id": 2, "content": "Hello World"}'
```

### 5. Start Simulation
```bash
curl -X POST "http://localhost:8000/api/v1/simulation/{session_id}/simulate" \
  -H "Content-Type: application/json" \
  -d '{"message_ids": [1], "enable_anomalies": true, "speed_multiplier": 1.0}'
```

### 6. WebSocket Connection (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session_id_here');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data.event_type, data.data);
};
```

## Error Responses

All endpoints return structured error responses:

```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error