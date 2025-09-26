const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8082",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const sessions = new Map();
const nodes = new Map();
const connections = new Map();
const messages = new Map();
const logs = new Map();

// Utility functions
const generateId = () => uuidv4();
const getCurrentTimestamp = () => new Date().toISOString();

// Mock Gemini AI response
const mockGeminiResponse = (prompt, queryType = 'explain') => {
  const responses = {
    explain: `Based on your network simulation, I can see several key concepts at play:

**Network Topology Analysis:**
Your current setup demonstrates fundamental networking principles. The nodes represent different network devices, each with specific roles in packet forwarding and processing.

**Key Learning Points:**
1. **Packet Routing:** Messages travel through predetermined paths based on routing algorithms
2. **Network Latency:** Each hop introduces processing delays
3. **Reliability Factors:** Packet loss and corruption simulate real-world network conditions

**Recommendations:**
- Experiment with different network topologies to understand routing efficiency
- Observe how packet loss affects overall network performance
- Try adjusting latency settings to simulate various network conditions

This simulation helps you understand how data flows through networks and the challenges network engineers face in designing reliable systems.`,

    troubleshoot: `Let me help you troubleshoot your network simulation:

**Common Issues Identified:**
1. **High Packet Loss:** Check connection reliability settings
2. **Routing Loops:** Verify your network topology doesn't create circular paths
3. **Congestion:** Monitor node buffer utilization

**Diagnostic Steps:**
1. Check packet journey logs to identify where failures occur
2. Analyze anomaly patterns to understand failure modes
3. Verify node connectivity and configuration

**Solutions:**
- Reduce packet loss rates for more reliable transmission
- Implement redundant paths for better fault tolerance
- Adjust buffer sizes to handle traffic bursts

Would you like me to analyze specific error patterns in your logs?`,

    learn: `Great question! Let me explain this networking concept:

**Fundamental Concepts:**
Network simulation helps you understand how data travels across interconnected devices. Key concepts include:

**Packet Switching:** Data is broken into packets, each finding its own path to the destination
**Network Protocols:** Rules that govern how devices communicate
**Quality of Service:** Managing network resources to ensure reliable delivery

**Learning Objectives:**
- Understand OSI layer interactions
- Learn about routing algorithms and their trade-offs
- Explore how network anomalies affect performance

**Next Steps:**
Try creating different network topologies and observe how they affect packet delivery. Experiment with various anomaly settings to see how real networks handle failures.`,

    analyze: `Network Analysis Report:

**Performance Metrics:**
- Successful packet delivery rate indicates network reliability
- Average latency shows network responsiveness
- Anomaly frequency reveals potential trouble spots

**Pattern Recognition:**
Your simulation data shows typical network behavior patterns. The anomalies you're seeing are realistic representations of real-world network challenges.

**Optimization Opportunities:**
1. **Path Diversity:** Multiple routes can improve reliability
2. **Load Balancing:** Distribute traffic across available paths
3. **Error Recovery:** Implement retransmission mechanisms

**Educational Value:**
This analysis helps you understand network performance monitoring and optimization strategies used by network administrators.`
  };

  return responses[queryType] || responses.explain;
};

// Routes

// Session Management
app.get('/api/sessions', (req, res) => {
  const studentId = req.headers['x-student-id'];
  const userSessions = Array.from(sessions.values()).filter(s => s.studentId === studentId);
  res.json(userSessions);
});

app.post('/api/sessions', (req, res) => {
  const studentId = req.headers['x-student-id'];
  const { sessionName, description } = req.body;
  
  const session = {
    id: generateId(),
    studentId,
    sessionName,
    description,
    status: 'ACTIVE',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp()
  };
  
  sessions.set(session.id, session);
  res.status(201).json(session);
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// Node Management
app.get('/api/sessions/:sessionId/nodes', (req, res) => {
  const sessionNodes = Array.from(nodes.values()).filter(n => n.sessionId === req.params.sessionId);
  res.json(sessionNodes);
});

app.post('/api/sessions/:sessionId/nodes', (req, res) => {
  const sessionId = req.params.sessionId;
  const nodeData = req.body;
  
  const node = {
    id: generateId(),
    ...nodeData,
    sessionId,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp()
  };
  
  nodes.set(node.id, node);
  
  // Log the event
  const logEntry = {
    id: generateId(),
    sessionId,
    eventType: 'NODE_CREATED',
    message: `Node created: ${node.name}`,
    timestamp: getCurrentTimestamp(),
    nodeId: node.id
  };
  
  if (!logs.has(sessionId)) logs.set(sessionId, []);
  logs.get(sessionId).push(logEntry);
  
  res.status(201).json(node);
});

app.delete('/api/sessions/:sessionId/nodes/:nodeId', (req, res) => {
  const { sessionId, nodeId } = req.params;
  const node = nodes.get(nodeId);
  
  if (!node || node.sessionId !== sessionId) {
    return res.status(404).json({ error: 'Node not found' });
  }
  
  nodes.delete(nodeId);
  
  // Log the event
  const logEntry = {
    id: generateId(),
    sessionId,
    eventType: 'NODE_DELETED',
    message: `Node deleted: ${node.name}`,
    timestamp: getCurrentTimestamp(),
    nodeId
  };
  
  if (!logs.has(sessionId)) logs.set(sessionId, []);
  logs.get(sessionId).push(logEntry);
  
  res.status(204).send();
});

// Simulation Control
app.post('/api/simulation/:sessionId/start', (req, res) => {
  const sessionId = req.params.sessionId;
  const config = req.body;
  
  // Mock simulation start
  const logEntry = {
    id: generateId(),
    sessionId,
    eventType: 'SIMULATION_STARTED',
    message: 'Simulation started with mock data',
    timestamp: getCurrentTimestamp()
  };
  
  if (!logs.has(sessionId)) logs.set(sessionId, []);
  logs.get(sessionId).push(logEntry);
  
  // Simulate some packet events
  setTimeout(() => {
    const sessionNodes = Array.from(nodes.values()).filter(n => n.sessionId === sessionId);
    if (sessionNodes.length >= 2) {
      simulatePacketFlow(sessionId, sessionNodes);
    }
  }, 1000);
  
  res.json({ message: `Simulation started for session: ${sessionId}` });
});

app.post('/api/simulation/:sessionId/stop', (req, res) => {
  const sessionId = req.params.sessionId;
  
  const logEntry = {
    id: generateId(),
    sessionId,
    eventType: 'SIMULATION_STOPPED',
    message: 'Simulation stopped',
    timestamp: getCurrentTimestamp()
  };
  
  if (!logs.has(sessionId)) logs.set(sessionId, []);
  logs.get(sessionId).push(logEntry);
  
  res.json({ message: `Simulation stopped for session: ${sessionId}` });
});

// Logs
app.get('/api/logs/:sessionId', (req, res) => {
  const sessionLogs = logs.get(req.params.sessionId) || [];
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 50;
  
  const startIndex = page * size;
  const endIndex = startIndex + size;
  const paginatedLogs = sessionLogs.slice(startIndex, endIndex);
  
  res.json({
    content: paginatedLogs,
    totalElements: sessionLogs.length,
    totalPages: Math.ceil(sessionLogs.length / size),
    size,
    number: page
  });
});

// AI Integration
app.post('/api/ai/query', (req, res) => {
  const { sessionId, question, queryType } = req.body;
  
  // Mock AI response
  const response = mockGeminiResponse(question, queryType);
  
  res.json({
    response,
    timestamp: getCurrentTimestamp(),
    queryType,
    sessionId
  });
});

app.post('/api/ai/explain-logs/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const sessionLogs = logs.get(sessionId) || [];
  
  const explanation = `Based on your simulation logs, I can see ${sessionLogs.length} events occurred. Here's what happened:

**Event Summary:**
${sessionLogs.slice(0, 5).map(log => `- ${log.eventType}: ${log.message}`).join('\n')}

**Analysis:**
Your network simulation demonstrates typical network behavior. The events show how packets flow through your network topology and how various network conditions affect transmission.

**Key Insights:**
1. Network events are logged chronologically for analysis
2. Each event provides context about network operations
3. Patterns in logs help identify network performance characteristics

This logging system helps you understand network behavior and troubleshoot issues in real networks.`;
  
  res.json({
    explanation,
    logCount: sessionLogs.length,
    timestamp: getCurrentTimestamp()
  });
});

app.post('/api/ai/analyze-anomalies/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  const analysis = `Network Anomaly Analysis for Session ${sessionId}:

**Detected Patterns:**
Your simulation includes realistic network anomalies that mirror real-world conditions:

1. **Packet Loss:** Random packet drops simulate network congestion
2. **Latency Variations:** Processing delays model network jitter
3. **Connection Issues:** Temporary failures represent link instability

**Educational Value:**
These anomalies teach you about:
- Network reliability challenges
- Error detection and recovery mechanisms
- Performance monitoring strategies

**Recommendations:**
- Observe how different anomaly rates affect overall performance
- Experiment with redundancy to improve reliability
- Study retry mechanisms used in real protocols

This analysis helps you understand why networks need robust error handling and quality assurance mechanisms.`;
  
  res.json({
    analysis,
    anomalyCount: Math.floor(Math.random() * 10) + 1,
    timestamp: getCurrentTimestamp()
  });
});

// Simulate packet flow for demonstration
function simulatePacketFlow(sessionId, sessionNodes) {
  if (sessionNodes.length < 2) return;
  
  const sourceNode = sessionNodes[0];
  const targetNode = sessionNodes[1];
  const packetId = generateId();
  
  // Emit WebSocket events
  io.to(`session-${sessionId}`).emit('packet-event', {
    eventType: 'packet_sent',
    sessionId,
    packetId,
    sourceNodeId: sourceNode.id,
    targetNodeId: targetNode.id,
    currentNodeId: sourceNode.id,
    status: 'INFO',
    description: `Packet sent from ${sourceNode.name}`,
    timestamp: getCurrentTimestamp(),
    progress: 0.0
  });
  
  // Log the event
  const logEntry = {
    id: generateId(),
    sessionId,
    eventType: 'PACKET_SENT',
    message: `Packet ${packetId} sent from ${sourceNode.name} to ${targetNode.name}`,
    timestamp: getCurrentTimestamp(),
    packetId
  };
  
  if (!logs.has(sessionId)) logs.set(sessionId, []);
  logs.get(sessionId).push(logEntry);
  
  // Simulate delivery after delay
  setTimeout(() => {
    io.to(`session-${sessionId}`).emit('packet-event', {
      eventType: 'delivered',
      sessionId,
      packetId,
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      currentNodeId: targetNode.id,
      status: 'SUCCESS',
      description: `Packet delivered to ${targetNode.name}`,
      timestamp: getCurrentTimestamp(),
      progress: 1.0,
      duration: 2000
    });
    
    // Log delivery
    const deliveryLog = {
      id: generateId(),
      sessionId,
      eventType: 'PACKET_DELIVERED',
      message: `Packet ${packetId} delivered to ${targetNode.name}`,
      timestamp: getCurrentTimestamp(),
      packetId
    };
    
    logs.get(sessionId).push(deliveryLog);
  }, 2000);
}

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Client ${socket.id} joined session: ${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Mock Network Simulator Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time events`);
  console.log(`🤖 AI endpoints available (mock responses)`);
  console.log(`💡 Connect your frontend to http://localhost:${PORT}`);
});