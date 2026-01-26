# Node State Pulse — Frontend Application

> **Note**: This is now a **frontend-only** application. The backend has been removed.

This document provides a technical overview of the Node State Pulse frontend application. It explains the system architecture, data model, UI components, and implementation patterns.

## 1) Problem Domain and Objectives

Node State Pulse is an interactive network simulation and visualization platform designed for learning and experimentation. The frontend provides:

- A 2D canvas to model network nodes (router, switch, host, server) and their connections (ethernet, Wi‑Fi, fiber)
- UI for generating, routing, and delivering messages/packets between nodes
- Visual feedback through timeline/logs and analytics
- An approachable UI with "modes" (select, add node, connect, delete) for building topologies by direct manipulation


## 2) Frontend Architecture

**Technology Stack**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui

- Main simulation UI (canvas + panels + analytics)
- React hooks for state management and network simulation logic
- Local state + utility layer
- Prepared for backend integration via REST and WebSocket (currently not connected)


### 2.1 Directory Map

- `src/`
  - `components/` UI for simulator: `SimulatorLayout.tsx`, `NetworkCanvas.tsx`, `ModeSelector.tsx`, `ControlPanel.tsx`, `CustomMessagePanel.tsx`, `AnalyticsDashboard.tsx`, `AIHelpPanel.tsx`, etc.
  - `hooks/` integration logic: `useNetworkSimulation.ts`, `useSession.ts`
  - `services/api.ts` REST client wrapping axios instance in `lib/api-client.ts` (prepared for backend integration)
  - `lib/` UI and API helpers, e.g., `utils.ts`, `gemini.ts`
  - `pages/Index.tsx` entry view with session selection and simulator


## 3) Data Model

The types mirror the pydantic schemas and the mock server’s in-memory records. Key entities:

- Session
  - id: string (UUID in FastAPI, random id in mock)
  - student_name: string
  - is_active: bool
  - created_at, updated_at
  - metadata_json: object
- Node
  - id: int (auto-increment DB; random int in mock)
  - session_id: string
  - name: string
  - node_type: enum {router, switch, host, server}
  - x_position, y_position: float
  - status: enum {active, inactive, error}
  - properties: object
- Connection
  - id: int
  - session_id: string
  - source_node_id, destination_node_id: int
  - connection_type: enum {ethernet, wifi, fiber}
  - bandwidth_mbps, latency_ms: number
  - status: NodeStatus
  - properties: object
- Message
  - id: int
  - session_id: string
  - source_node_id, destination_node_id: int
  - message_type: enum {data, control, broadcast}
  - content: string
  - packet_size_bytes: number
  - priority: number
  - status: enum {queued, in_transit, delivered, failed}


## 3) Data Model

The frontend is designed to work with the following data types (prepared for future backend integration):

- **Session**: id, student_name, is_active, created_at, updated_at, metadata_json
- **Node**: id, session_id, name, node_type (router/switch/host/server), x_position, y_position, status, properties
- **Connection**: id, session_id, source_node_id, destination_node_id, connection_type (ethernet/wifi/fiber), bandwidth_mbps, latency_ms, status, properties
- **Message**: id, session_id, source_node_id, destination_node_id, message_type, content, packet_size_bytes, priority, status
- **Anomaly**: id, session_id, anomaly_type, probability, severity, parameters, is_active


## 4) Key Frontend Components

- **Rendering**: React function components, Tailwind for styles, shadcn/ui primitives (Accordion, Dialog, Select, etc.)
- **Interaction model**: "Modes" control the canvas semantics (`ModeSelector.tsx`): select, add node, connect, delete. Double-click to create nodes; drag to move.
- **State management**:
  - `useSession.ts`: Session management and switching; stores current session id in localStorage
  - `useNetworkSimulation.ts`: Wraps `services/api.ts` for nodes, connections, messages, anomalies, and simulation
  - `SimulatorLayout.tsx`: Orchestrates canvas, side panels, logs, and dispatches actions
  - `CustomMessagePanel.tsx`: UI to compose and send messages; shows recent sent messages
- **API client**: `lib/api-client.ts` wraps axios (prepared for backend integration)


## 5) How to Run

PowerShell commands (Windows):

```powershell
# Navigate to project directory
cd C:\Users\seerv\Desktop\Github\node-state-pulse

# Install dependencies
npm install

# Start development server (port 8080; will use 8081 if busy)
npm run dev
```

Then open the printed local URL (e.g., http://localhost:8080 or http://localhost:8081).

> **Note**: The application is currently frontend-only. Backend integration features are prepared but not connected.


## 6) Quick Reference: Key Files

- **Frontend**
  - `src/components/SimulatorLayout.tsx` (orchestration)
  - `src/components/NetworkCanvas.tsx` (render/interaction)
  - `src/components/ModeSelector.tsx` (interaction mode)
  - `src/components/CustomMessagePanel.tsx` (message UI)
  - `src/hooks/useNetworkSimulation.ts` (API wrapper + state)
  - `src/services/api.ts` / `src/lib/api-client.ts` (REST client)


## 7) Research Roadmap and Future Enhancements

This section proposes topics for potential future development:

### A) Network Modeling & Algorithms
- Path finding: Dijkstra/OSPF-like link-state vs. distance-vector routing
- Queueing models: M/M/1 vs. M/D/1 queues; buffer sizing and loss events
- Congestion control: TCP-like AIMD vs. BBR-like models
- Multicast/broadcast protocols: Flooding vs. spanning tree

### B) Discrete-Event Simulation Engine
- Migrate to discrete-event core with event calendar
- Step/run modes with breakpoints and deterministic reproducibility
- Model time dilation for educational demos

### C) Anomaly Injection and Faults
- Expand anomaly catalog: burst losses, asymmetric delays, clock drift
- Failure domains: node failure, link flap, targeted attack simulation

### D) Measurement & Analytics
- Define metrics: throughput, goodput, latency distribution, jitter, loss
- Statistical repeatability: export configs and results for reproducible research

### E) Visualization & UX
- Canvas performance: Benchmark canvas vs. WebGL (PixiJS) for large networks
- Timeline views: Correlate events across layers
- Accessibility & pedagogy: Guided labs with goals and automatic grading

### F) ML & AI Assistance
- Use collected traces to train anomaly classifiers
- AI assistant with guardrails for proposing remediation steps

### G) Architecture & Ops
- Persistence and versioning: store snapshots of topologies
- Collaboration: multi-user sessions with CRDT-based edits
- Packaging: Electron desktop build or PWA offline mode


---

This document provides an overview of the Node State Pulse frontend application, its architecture, and potential future directions.

