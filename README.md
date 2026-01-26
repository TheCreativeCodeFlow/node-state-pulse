# Node State Pulse

> **Network Simulation & Visualization Platform**

**Node State Pulse** is an interactive, frontend-driven network simulation tool designed to model, visualize, and analyze network topologies and message propagations in real-time. It provides an intuitive canvas for students, educators, and network enthusiasts to experiment with network concepts without the need for complex hardware or virtualization setups.

---

## 🚀 Table of Contents

1. [Project Overview](#1-project-title-and-high-level-overview)
2. [Key Features](#2-key-features-and-functionalties)
3. [System Architecture](#3-system-architecture-and-design)
4. [Technology Stack](#4-technology-stack)
5. [Application Design & UI/UX](#5-application-design-and-uiux)
6. [Functional Modules](#6-functional-modules)
7. [Installation & Setup](#7-installation-and-setup)
8. [Running the Application](#8-running-the-application)
9. [Folder Structure](#9-folder-structure-explanation)
10. [Data Model](#10-database-design-data-model)
11. [API Documentation](#11-api-documentation)
12. [Security Considerations](#12-security-considerations)
13. [Performance & Scalability](#13-performance-and-scalability)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment](#15-deployment-strategy)
16. [Limitations](#16-limitations-and-known-issues)
17. [Roadmap](#17-future-enhancements-and-roadmap)
18. [Contributing](#18-contribution-guidelines)
19. [License](#19-license)

---

## 1. Project Title and High-Level Overview

### Problem Statement
Understanding computer networks often involves abstract concepts that are difficult to visualize. Traditional simulators are often complex, resource-heavy, or lack modern, interactive web interfaces for quick experimentation.

### Purpose
**Node State Pulse** aims to bridge this gap by offering a lightweight, browser-based simulation environment. It allows users to visually construct networks, define node behaviors, and watch how data packets travel across connections in a controlled environment.

### Target Users & Use Cases
-   **Students & Educators**: Demonstrating routing protocols, packet switching, and network topologies.
-   **Developers**: Prototyping basic network interactions and visualizations.
-   **Network Enthusiasts**: Experimenting with custom network configurations and failure scenarios.

---

## 2. Key Features and Functionalities

### Core Features
-   **Interactive Canvas**: Drag-and-drop interface to place and organize network nodes.
-   **Node Management**: Create various node types (ROUTER, SWITCH, HOST, SERVER) with custom properties.
-   **Connection Management**: Link nodes with different media types (Ethernet, Wi-Fi, Fiber) affecting bandwidth and latency.
-   **Simulation Modes**: Distinct modes for selecting, adding nodes, connecting, and deleting elements.

### Advanced Features
-   **Packet Visualization**: Visual animation of messages traversing links between nodes.
-   **Real-time Analytics**: Dashboard showing network stats, active nodes, and message logs.
-   **Anomaly Injection**: (Experimental) Simulate network faults like packet loss or high latency.
-   **AI Help Assistant**: Integrated chat interface for guided assistance (using Gemini AI).

### User Workflows
1.  **Topology Creation**: User selects "Add Node" mode, places nodes, then switches to "Connect" mode to link them.
2.  **Simulation**: User creates a message/packet from a source to a destination and watches the delivery process.
3.  **Analysis**: User reviews the activity log and analytics dashboard to understand network performance.

---

## 3. System Architecture and Design

### High-Level Architecture
Node State Pulse follows a **Single Page Application (SPA)** architecture. It is currently a **Frontend-Only** implementation that mocks backend responses, ensuring zero-setup usage. It is designed to be decoupled, allowing a future backend (e.g., Python/FastAPI) to be plugged in seamlessly via the API service layer.

### Frontend Architecture
-   **Component-Based**: Built with React, leveraging reusable UI components.
-   **State Driven**: Uses React Hooks (`useNetworkSimulation`, `useSession`) to manage the complex state of the network graph (nodes, edges, messages).
-   **Event Loop**: A local simulation loop handles the "tick" updates for packet movement and status changes.

### Data Flow
1.  **User Action**: User interacts with the Canvas or Control Panel.
2.  **State Update**: React Context/Hooks update the local store.
3.  **Rendering**: The Canvas re-renders the topology; UI panels update statistics.
4.  **Service Layer**: All data mutations go through a service abstraction (`services/api.ts`), currently interacting with a mock store but structured for REST API calls.

---

## 4. Technology Stack

### Frontend Technologies
-   **Framework**: [React 18](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Library**: [shadcn/ui](https://ui.shadcn.com/) (based on Radix UI)
-   **Icons**: [Lucide React](https://lucide.dev/)

### Data & State
-   **State Management**: React Hooks & Context API
-   **Data Fetching**: [TanStack Query](https://tanstack.com/query/v5) (React Query)
-   **Validation**: [Zod](https://zod.dev/)

### Development Tools
-   **Linting**: ESLint
-   **Formatting**: Prettier (implied via standard practices)
-   **Package Manager**: npm

---

## 5. Application Design and UI/UX

### Design Philosophy
The UI prioritizes **clarity** and **interactivity**. It adopts a "dark mode" technical aesthetic suitable for engineering tools, with color-coded nodes and distinct visual cues for active vs. inactive states.

### Screen Structure
-   **Canvas Area**: The central workspace for drawing the network.
-   **Sidebar / Control Panel**: Access to tools, node properties, and message composition.
-   **Top Bar**: Session management and mode switching.
-   **Floating Action Panels**: For quick access to AI help or specific node actions.

### Component Structure
-   Atomic components (buttons, inputs) from `shadcn/ui`.
-   Composite components (`NetworkCanvas`, `NodeIcon`, `ConnectionLine`) specific to the domain.

### Responsiveness
The layout uses Flexbox and Grid to adapt to different screen sizes, though the Canvas is best experienced on desktop resolutions.

---

## 6. Functional Modules

1.  **Simulator Engine**:
    -   *Responsibility*: Handles the physics of packet movement and graph topological correctness.
    -   *Interaction*: Updates the `nodes` and `messages` state arrays.
2.  **Mode Selector**:
    -   *Responsibility*: Switches user intent (Add vs. Connect vs. Select).
    -   *Interaction*: Toggles global application mode state.
3.  **Analytics Module**:
    -   *Responsibility*: Aggregates data for charts and logs.
    -   *Interaction*: Reads from the simulation state to derive metrics like "Avg Latency" or "Packet Loss".

---

## 7. Installation and Setup

### System Requirements
-   **Node.js**: Version 18.0 or higher
-   **npm**: Version 9.0 or higher

### Environment Setup
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/node-state-pulse.git
    ```
2.  Navigate to the project folder:
    ```bash
    cd node-state-pulse
    ```

### Installation
Install all dependencies using npm:
```bash
npm install
```

### Configuration
Create a `.env` file in the root if custom environment variables are needed (currently none required for default mock mode).

---

## 8. Running the Application

### Development Mode
To start the local development server with hot-reload:
```bash
npm run dev
```
Access the app at `http://localhost:8080` (or the port shown in terminal).

### Production Build
To create an optimized production build:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## 9. Folder Structure Explanation

```
src/
├── components/         # React UI components
│   ├── networks/       # Domain-specific components (Canvas, Nodes)
│   ├── ui/             # Generic UI atoms (Buttons, Cards - shadcn)
│   └── SimulatorLayout.tsx # Main layout container
├── hooks/             # Custom React Hooks
│   ├── useNetworkSimulation.ts # Core logic for the sim
│   └── useSession.ts   # Session state management
├── lib/               # Utilities and wrappers
│   ├── utils.ts       # Helper functions
│   └── api-client.ts  # Axios configuration
├── services/          # API Service layer
│   └── api.ts         # Endpoints definition (Mock/Real)
├── pages/             # Route pages
│   └── Index.tsx      # Main entry point
└── App.tsx            # App root
```

---

## 10. Database Design (Data Model)

*Note: As a frontend-only app, this describes the logical data model used in state/mocking.*

-   **Session**: Represents a user's workspace.
    -   *Fields*: `id`, `name`, `created_at`, `active`
-   **Node**: Device in the network.
    -   *Fields*: `id`, `type` (ROUTER, SWITCH...), `x`, `y`, `status`
-   **Connection**: Link between nodes.
    -   *Fields*: `source_id`, `target_id`, `type` (WIFI, ETHERNET...), `bandwidth`
-   **Message**: Data packet.
    -   *Fields*: `id`, `source`, `destination`, `content`, `status` (QUEUED, DELIVERED)

---

## 11. API Documentation

The application currently mocks these endpoints internally, but they are structured for future backend implementation:

-   `GET /sessions`: List active sessions.
-   `POST /nodes`: Create a new node.
-   `POST /connections`: Link two nodes.
-   `POST /messages/send`: Dispatch a packet.
-   `GET /anomalies`: Fetch active network faults.

*Requests/Responses use JSON format.*

---

## 12. Security Considerations

-   **Data Validation**: All inputs (node names, IP addresses) are validated via **Zod** schemas before processing.
-   **State Isolation**: Each browser session is isolated in LocalStorage, preventing data leakage between users sharing a device (in the current mock implementation).
-   **XSS Protection**: React's built-in escaping is used to prevent Cross-Site Scripting when rendering message content.

---

## 13. Performance and Scalability

-   **Virtualization**: Uses efficient React rendering practices.
-   **Optimization Strategies**:
    -   Memoization of complex components (`React.memo`).
    -   Event throttling for canvas drag interactions.
-   **Future Scalability**: Transitioning the main canvas rendering to **Canvas API** or **WebGL** (PixiJS) is recommended for topologies exceeding 500 nodes.

---

## 14. Testing Strategy

*Current Status: Manual Verification*

-   **Unit Testing**: Recommended to use **Vitest** for utility functions and hook logic.
-   **Component Testing**: Recommended to use **React Testing Library** for UI interaction tests.
-   **E2E Testing**: Critical paths (Node Creation -> Link -> Send Message) should be verified manually or via **Playwright** in future iterations.

---

## 15. Deployment Strategy

-   **Hosting**: Static hosting platforms (Vercel, Netlify, GitHub Pages).
-   **Build Pipeline**: Standard Vite build process (`npm run build`) outputs static generation to `dist/`.
-   **CI/CD**: GitHub Actions can be configured to run linting and build on push.

---

## 16. Limitations and Known Issues

-   **Persistence**: Data is lost on browser refresh (unless LocalStorage persistence is fully enabled/configured).
-   **Simulation Depth**: OSI Model simulation is simplified; layer 2/3 protocols are abstractly represented.
-   **Performance**: Large networks (>100 nodes) may experience DOM-related lag due to SVG/Div based rendering.

---

## 17. Future Enhancements and Roadmap

-   [ ] **Backend Integration**: Connect to a Python/Go backend for persistent storage.
-   [ ] **Multiplayer Mode**: Real-time collaboration using WebSockets/CRDTs.
-   [ ] **Advanced Protocols**: Implement RIP, OSPF, or BGP simulation logic.
-   [ ] **Mobile Support**: Optimize the canvas interactions for touch devices.

---

## 18. Contribution Guidelines

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 19. License

Distributed under the MIT License. See `LICENSE` for more information.
