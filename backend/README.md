# Network Simulator Backend

A comprehensive Java Spring Boot backend for an interactive Computer Network Simulator platform that enables students to create custom network topologies, simulate message passing with realistic anomalies, and learn networking concepts through hands-on experimentation.

## 🚀 Features

### Core Functionality
- **Dynamic Network Topology**: Create and manage custom nodes (routers, switches, hosts, etc.) and connections
- **Real-time Simulation**: Simulate message/packet transmission with realistic network behavior
- **Anomaly Injection**: Configurable network anomalies (packet loss, delays, corruption, wrong delivery, etc.)
- **Path Computation**: Multiple routing algorithms (shortest path, Dijkstra, flooding)
- **Session Management**: Isolated student sessions with persistent state

### API Endpoints
- **Sessions**: `/api/sessions` - CRUD operations for simulation sessions
- **Nodes**: `/api/nodes` - Manage network nodes
- **Connections**: `/api/connections` - Manage network links
- **Messages**: `/api/messages` - Handle message transmission
- **Simulation**: `/api/simulation` - Start/stop/monitor simulations
- **Logs**: `/api/logs` - Retrieve detailed simulation logs
- **AI Integration**: `/api/ai/query` - Educational AI assistance (optional)

### Real-time Features
- **WebSocket Events**: Live packet transmission updates
- **Event Broadcasting**: Real-time simulation events to frontend
- **Progress Tracking**: Detailed packet journey visualization

### Advanced Features
- **Undo/Redo**: Command pattern for reversible operations
- **Multi-tenancy**: Parallel student sessions with isolation
- **Comprehensive Logging**: Detailed audit trail and analytics
- **Scalable Architecture**: Async processing and optimized performance

## 🏗️ Architecture

### Technology Stack
- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL with Spring Data JPA
- **Real-time**: WebSocket with STOMP protocol
- **Documentation**: OpenAPI 3 / Swagger UI
- **Testing**: JUnit, TestContainers
- **Containerization**: Docker with Docker Compose

### Domain Model
```
Session (1) ←→ (N) Node
Session (1) ←→ (N) Connection
Session (1) ←→ (N) Message
Session (1) ←→ (N) SessionLog
Message (1) ←→ (N) Anomaly
```

## 🚦 Getting Started

### Prerequisites
- Java 17+
- Maven 3.6+
- PostgreSQL 13+ (or Docker)
- Node.js 18+ (for frontend integration)

### Local Development

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Start PostgreSQL** (using Docker):
   ```bash
   docker-compose up postgres -d
   ```

3. **Build and run**:
   ```bash
   mvn clean package
   mvn spring-boot:run
   ```

4. **Access API Documentation**:
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - OpenAPI Spec: http://localhost:8080/v3/api-docs

### Docker Deployment

1. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

2. **Services will be available at**:
   - Backend API: http://localhost:8080
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## 📡 WebSocket Integration

### Connection
Connect to WebSocket endpoint: `ws://localhost:8080/ws`

### Event Subscription
Subscribe to session-specific events:
```javascript
stompClient.subscribe('/topic/simulation/{sessionId}', function(event) {
    const packetEvent = JSON.parse(event.body);
    // Handle real-time packet events
});
```

### Event Types
- `packet_sent` - Packet transmission started
- `packet_arrived` - Packet reached intermediate node
- `packet_forwarded` - Packet forwarded to next hop
- `packet_delivered` - Packet successfully delivered
- `packet_lost` - Packet dropped/lost
- `anomaly_applied` - Network anomaly occurred
- `simulation_started` - Simulation began
- `simulation_completed` - Simulation finished

## 🔧 Configuration

### Application Properties
Key configuration options in `application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/network_simulator

# Simulation Settings
app.simulation.max-concurrent-sessions=100
app.simulation.max-messages-per-session=1000
app.simulation.timeout-seconds=300

# AI Integration (Optional)
app.ai.enabled=false
app.ai.api.url=https://api.openai.com/v1/chat/completions
```

### Simulation Configuration Presets

1. **Default Config**: Balanced anomaly rates for learning
2. **High Anomaly Config**: Increased failure rates for advanced scenarios
3. **Reliable Config**: Minimal anomalies for basic connectivity testing

## 🧪 API Usage Examples

### Create a Session
```bash
curl -X POST http://localhost:8080/api/sessions \
     -H "X-Student-Id: student123" \
     -H "Content-Type: application/json" \
     -d '{"sessionName": "My Network Lab", "description": "Learning TCP/IP"}'
```

### Add Nodes
```bash
curl -X POST http://localhost:8080/api/sessions/{sessionId}/nodes \
     -H "X-Student-Id: student123" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Router1",
       "type": "ROUTER",
       "positionX": 100,
       "positionY": 200,
       "ipAddress": "192.168.1.1"
     }'
```

### Start Simulation
```bash
curl -X POST http://localhost:8080/api/simulation/{sessionId}/start \
     -H "X-Student-Id: student123" \
     -H "Content-Type: application/json" \
     -d '{
       "packetLossRate": 0.02,
       "enableAnomalies": true,
       "routingAlgorithm": "SHORTEST_PATH"
     }'
```

## 🔍 Monitoring & Logging

### Health Checks
- Application health: http://localhost:8080/actuator/health
- Metrics: http://localhost:8080/actuator/metrics
- Prometheus: http://localhost:8080/actuator/prometheus

### Log Levels
Configure logging in `application.properties`:
```properties
logging.level.com.netlab.networksimulator=DEBUG
logging.level.org.springframework.web.socket=DEBUG
```

## 🤝 Integration with Frontend

The backend is designed to integrate seamlessly with the React frontend:

1. **CORS Configuration**: Properly configured for local development
2. **Real-time Updates**: WebSocket events for live simulation updates
3. **RESTful API**: Standard HTTP methods with JSON payloads
4. **Error Handling**: Consistent error responses with details

## 🛠️ Development

### Running Tests
```bash
mvn test
```

### Code Quality
- Lombok for boilerplate reduction
- Comprehensive validation with Bean Validation
- Extensive logging with SLF4J
- Proper exception handling

### Database Schema
Auto-generated with Hibernate DDL. For production, use Flyway migrations.

## 📈 Performance & Scalability

- **Async Processing**: Non-blocking simulation execution
- **Connection Pooling**: Optimized database connections
- **WebSocket Scaling**: Session-based message routing
- **Caching**: Redis integration ready for session caching

## 🔐 Security Considerations

- **Student Isolation**: Session-based data separation
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Restricted origins for production

## 📚 Educational Value

This backend provides rich learning opportunities:
- **Network Protocols**: TCP/IP, UDP, routing protocols
- **Network Reliability**: Packet loss, retransmission, error detection
- **Performance Analysis**: Latency, throughput, congestion control
- **Troubleshooting**: Log analysis, anomaly investigation

## 🤖 AI Integration (Optional)

The `/api/ai/query` endpoint can proxy requests to external AI services for educational explanations:
- Analyze simulation logs
- Explain network anomalies  
- Provide troubleshooting suggestions
- Generate learning insights

---

**Built with ❤️ for Computer Science Education**

This backend serves as a comprehensive foundation for network simulation education, providing both technical depth and educational value for students learning computer networking concepts.