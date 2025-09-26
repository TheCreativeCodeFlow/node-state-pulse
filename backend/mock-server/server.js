const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const port = 8000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Mock data
let sessions = [];
let nodes = [];
let connections = [];
let messages = [];
let anomalies = [];

// Utility function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Session endpoints
app.post('/api/v1/sessions/', (req, res) => {
  const session = {
    id: generateId(),
    student_name: req.body.student_name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    metadata_json: req.body.metadata_json || {}
  };
  sessions.push(session);
  res.status(201).json(session);
});

app.get('/api/v1/sessions/', (req, res) => {
  res.json(sessions);
});

app.get('/api/v1/sessions/:sessionId', (req, res) => {
  const session = sessions.find(s => s.id === req.params.sessionId);
  if (!session) {
    return res.status(404).json({ detail: 'Session not found' });
  }
  res.json(session);
});

app.delete('/api/v1/sessions/:sessionId', (req, res) => {
  const index = sessions.findIndex(s => s.id === req.params.sessionId);
  if (index === -1) {
    return res.status(404).json({ detail: 'Session not found' });
  }
  sessions.splice(index, 1);
  res.status(204).send();
});

// Node endpoints
app.post('/api/v1/nodes/:sessionId/nodes', (req, res) => {
  const node = {
    id: parseInt(generateId(), 36),
    session_id: req.params.sessionId,
    name: req.body.name,
    node_type: req.body.node_type,
    x_position: req.body.x_position,
    y_position: req.body.y_position,
    status: 'active',
    properties: req.body.properties || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  nodes.push(node);
  res.status(201).json(node);
});

app.get('/api/v1/nodes/:sessionId/nodes', (req, res) => {
  const sessionNodes = nodes.filter(n => n.session_id === req.params.sessionId);
  res.json(sessionNodes);
});

app.put('/api/v1/nodes/:sessionId/nodes/:nodeId', (req, res) => {
  const nodeIndex = nodes.findIndex(n => 
    n.id === parseInt(req.params.nodeId) && n.session_id === req.params.sessionId
  );
  
  if (nodeIndex === -1) {
    return res.status(404).json({ detail: 'Node not found' });
  }

  const node = nodes[nodeIndex];
  Object.assign(node, req.body, { updated_at: new Date().toISOString() });
  nodes[nodeIndex] = node;
  
  res.json(node);
});

app.delete('/api/v1/nodes/:sessionId/nodes/:nodeId', (req, res) => {
  const index = nodes.findIndex(n => 
    n.id === parseInt(req.params.nodeId) && n.session_id === req.params.sessionId
  );
  
  if (index === -1) {
    return res.status(404).json({ detail: 'Node not found' });
  }
  
  // Also remove connections involving this node
  const nodeId = parseInt(req.params.nodeId);
  connections = connections.filter(c => 
    c.source_node_id !== nodeId && c.destination_node_id !== nodeId
  );
  
  nodes.splice(index, 1);
  res.status(204).send();
});

// Connection endpoints
app.post('/api/v1/connections/:sessionId/connections', (req, res) => {
  const connection = {
    id: parseInt(generateId(), 36),
    session_id: req.params.sessionId,
    source_node_id: req.body.source_node_id,
    destination_node_id: req.body.destination_node_id,
    connection_type: req.body.connection_type || 'ethernet',
    bandwidth_mbps: req.body.bandwidth_mbps || 100,
    latency_ms: req.body.latency_ms || 10,
    status: 'active',
    properties: req.body.properties || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  connections.push(connection);
  res.status(201).json(connection);
});

app.get('/api/v1/connections/:sessionId/connections', (req, res) => {
  const sessionConnections = connections.filter(c => c.session_id === req.params.sessionId);
  res.json(sessionConnections);
});

app.delete('/api/v1/connections/:sessionId/connections/:connectionId', (req, res) => {
  const index = connections.findIndex(c => 
    c.id === parseInt(req.params.connectionId) && c.session_id === req.params.sessionId
  );
  
  if (index === -1) {
    return res.status(404).json({ detail: 'Connection not found' });
  }
  
  connections.splice(index, 1);
  res.status(204).send();
});

app.delete('/api/v1/messages/:sessionId/messages/:messageId', (req, res) => {
  const index = messages.findIndex(m => 
    m.id === parseInt(req.params.messageId) && m.session_id === req.params.sessionId
  );
  
  if (index === -1) {
    return res.status(404).json({ detail: 'Message not found' });
  }
  
  messages.splice(index, 1);
  res.status(204).send();
});

// Message endpoints
app.post('/api/v1/messages/:sessionId/messages', (req, res) => {
  const message = {
    id: parseInt(generateId(), 36),
    session_id: req.params.sessionId,
    source_node_id: req.body.source_node_id,
    destination_node_id: req.body.destination_node_id,
    message_type: req.body.message_type || 'data',
    content: req.body.content || '',
    packet_size_bytes: req.body.packet_size_bytes || 1024,
    priority: req.body.priority || 1,
    status: 'queued',
    path_taken: [],
    created_at: new Date().toISOString(),
    delivered_at: null
  };
  messages.push(message);
  res.status(201).json(message);
});

app.get('/api/v1/messages/:sessionId/messages', (req, res) => {
  const sessionMessages = messages.filter(m => m.session_id === req.params.sessionId);
  res.json(sessionMessages);
});

// Anomaly endpoints
app.post('/api/v1/anomalies/:sessionId/anomalies', (req, res) => {
  const anomaly = {
    id: parseInt(generateId(), 36),
    session_id: req.params.sessionId,
    anomaly_type: req.body.anomaly_type,
    affected_node_id: req.body.affected_node_id || null,
    affected_connection_id: req.body.affected_connection_id || null,
    probability: req.body.probability || 0.1,
    severity: req.body.severity || 'medium',
    parameters: req.body.parameters || {},
    is_active: true,
    created_at: new Date().toISOString(),
    expires_at: req.body.expires_at || null
  };
  anomalies.push(anomaly);
  res.status(201).json(anomaly);
});

app.get('/api/v1/anomalies/:sessionId/anomalies', (req, res) => {
  const sessionAnomalies = anomalies.filter(a => a.session_id === req.params.sessionId);
  res.json(sessionAnomalies);
});

app.put('/api/v1/anomalies/:sessionId/anomalies/:anomalyId/toggle', (req, res) => {
  const anomalyIndex = anomalies.findIndex(a => 
    a.id === parseInt(req.params.anomalyId) && a.session_id === req.params.sessionId
  );
  
  if (anomalyIndex === -1) {
    return res.status(404).json({ detail: 'Anomaly not found' });
  }

  const anomaly = anomalies[anomalyIndex];
  anomaly.is_active = !anomaly.is_active;
  anomalies[anomalyIndex] = anomaly;
  
  res.json(anomaly);
});

app.delete('/api/v1/anomalies/:sessionId/anomalies/:anomalyId', (req, res) => {
  const index = anomalies.findIndex(a => 
    a.id === parseInt(req.params.anomalyId) && a.session_id === req.params.sessionId
  );
  
  if (index === -1) {
    return res.status(404).json({ detail: 'Anomaly not found' });
  }
  
  anomalies.splice(index, 1);
  res.status(204).send();
});

// Simulation endpoints
app.post('/api/v1/simulation/:sessionId/simulate', (req, res) => {
  const simulationId = generateId();
  
  // Simulate sending WebSocket events
  setTimeout(() => {
    broadcastToSession(req.params.sessionId, {
      event_type: 'simulation_started',
      session_id: req.params.sessionId,
      timestamp: new Date().toISOString(),
      data: { simulation_id: simulationId }
    });

    // Simulate packet events
    req.body.message_ids.forEach((messageId, index) => {
      setTimeout(() => {
        broadcastToSession(req.params.sessionId, {
          event_type: 'packet_sent',
          session_id: req.params.sessionId,
          timestamp: new Date().toISOString(),
          data: { 
            message: `Packet ${messageId} sent`,
            packet: { id: messageId, source_node_id: 1, destination_node_id: 2 }
          }
        });

        setTimeout(() => {
          broadcastToSession(req.params.sessionId, {
            event_type: 'packet_delivered',
            session_id: req.params.sessionId,
            timestamp: new Date().toISOString(),
            data: { message: `Packet ${messageId} delivered successfully` }
          });
        }, 2000);
      }, index * 1000);
    });

    setTimeout(() => {
      broadcastToSession(req.params.sessionId, {
        event_type: 'simulation_completed',
        session_id: req.params.sessionId,
        timestamp: new Date().toISOString(),
        data: { simulation_id: simulationId }
      });
    }, 5000);
  }, 100);

  res.json({
    simulation_id: simulationId,
    status: 'started',
    message: 'Simulation started successfully'
  });
});

// WebSocket handling
const sessionConnections = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.pathname.split('/').pop();
  
  console.log(`WebSocket connected for session: ${sessionId}`);
  
  // Store connection by session
  if (!sessionConnections.has(sessionId)) {
    sessionConnections.set(sessionId, new Set());
  }
  sessionConnections.get(sessionId).add(ws);

  // Send connection established event
  ws.send(JSON.stringify({
    event_type: 'connection_established',
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    data: { message: 'WebSocket connection established' }
  }));

  ws.on('close', () => {
    console.log(`WebSocket disconnected for session: ${sessionId}`);
    if (sessionConnections.has(sessionId)) {
      sessionConnections.get(sessionId).delete(ws);
    }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          event_type: 'pong',
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          data: {}
        }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
});

function broadcastToSession(sessionId, event) {
  if (sessionConnections.has(sessionId)) {
    const connections = sessionConnections.get(sessionId);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API documentation endpoint (simple version)
app.get('/docs', (req, res) => {
  res.json({
    title: 'Mock Network Simulator Backend',
    description: 'Simple mock server for testing frontend integration',
    version: '1.0.0',
    endpoints: {
      'POST /api/v1/sessions/': 'Create session',
      'GET /api/v1/sessions/': 'List sessions',
      'GET /api/v1/sessions/:id': 'Get session',
      'POST /api/v1/nodes/:sessionId/nodes': 'Create node',
      'GET /api/v1/nodes/:sessionId/nodes': 'List nodes',
      'POST /api/v1/connections/:sessionId/connections': 'Create connection',
      'GET /api/v1/connections/:sessionId/connections': 'List connections',
      'POST /api/v1/messages/:sessionId/messages': 'Create message',
      'POST /api/v1/simulation/:sessionId/simulate': 'Start simulation'
    },
    websocket: 'ws://localhost:8000/ws/{session_id}'
  });
});

server.listen(port, () => {
  console.log(`🚀 Mock Network Simulator Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`🔌 WebSocket: ws://localhost:${port}/ws/{session_id}`);
  console.log('💡 This is a mock server for testing frontend integration');
});

module.exports = app;