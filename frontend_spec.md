# Frontend Development Specification

## Project Context

You are tasked with building the frontend for an **AI-Powered Network Simulation & Learning Platform** - a web-based educational tool inspired by Cisco Packet Tracer. This platform helps students, educators, and self-learners visually build, configure, simulate, and understand computer networks directly in their browser.

---

## Core Application Purpose

The platform is a **canvas-first, workspace-oriented interface** where users can:

1. **Visually place networking devices** (computers, routers, switches, hubs, servers, wireless devices)
2. **Connect devices** with network cables and wireless connections
3. **Configure IP addresses, subnets, routing tables**, and network settings
4. **Simulate network behavior** by sending packets and observing routing, delays, and failures
5. **Receive AI-powered explanations** from Gemini that detect mistakes, explain concepts, and guide learning
6. **Collaborate in real-time** with teachers and students in shared network sessions

---

## Design Philosophy - iOS-Inspired Premium UI

### Visual Style Requirements

**CRITICAL:** The UI must feel like a premium iOS/macOS application with a **techy, modern, and highly animated** experience:

#### Color Scheme & Aesthetics
- **Dark Mode Foundation**: Deep dark backgrounds (#0a0a0f, #0f1419, #1a1d24)
- **Accent Colors**: 
  - Primary: Cyan/Electric Blue (#00d9ff, #06b6d4)
  - Success: Emerald Green (#10b981, #34d399)
  - Warning: Amber (#f59e0b, #fbbf24)
  - Error: Rose/Red (#ef4444, #f87171)
  - Neutral: Slate Grays (#64748b, #94a3b8)
- **Greenish Grid Background**: Subtle grid pattern with faint green glow (#10b98120 on dark base)
- **Glassmorphism**: Frosted glass panels with backdrop blur
- **Soft Glowing Highlights**: Neon-style glows on active elements
- **Gradient Accents**: Smooth gradients for buttons, cards, and interactive elements

#### Typography
- **Primary Font**: SF Pro Display / Inter / Plus Jakarta Sans
- **Monospace Font**: JetBrains Mono / SF Mono (for IP addresses, logs, code)
- **Font Weights**: Use varied weights (300, 400, 500, 600, 700) for hierarchy
- **Smooth Anti-aliasing**: Text should feel crisp and readable

#### Component Design Patterns
- **Rounded Corners**: 12px-16px border radius for cards, 8px for buttons
- **Subtle Shadows**: Layered elevation with soft shadows
- **Border Accents**: 1px borders with gradient or glow effects
- **Spacing**: Consistent 4px/8px/16px/24px/32px spacing system
- **Icons**: Lucide React or Heroicons with 1.5px stroke width

---

## Animation Requirements (VERY IMPORTANT)

### Micro-interactions & Animations

The interface should feel **alive and responsive** with animations everywhere:

#### 1. **Canvas Workspace Animations**
- **Device Placement**: Scale-in animation (0.8 → 1.0) with spring physics when dropped
- **Device Selection**: Glow effect + subtle scale (1.0 → 1.05) + shadow expansion
- **Dragging**: Smooth follow with slight lag (elastic feel)
- **Connection Drawing**: Animated line drawing from source to destination
- **Packet Animation**: Glowing dot traveling along connection paths with trail effect
- **Hover States**: Devices lift slightly with shadow increase
- **Grid Snapping**: Magnetic snap animation with haptic-like feedback

#### 2. **Panel & UI Animations**
- **Panel Slide-in**: Smooth slide from edges with easing (cubic-bezier)
- **Accordion Expand/Collapse**: Height animation with stagger effect for nested items
- **Button Interactions**: 
  - Hover: Slight scale + glow
  - Click: Scale down (0.95) + ripple effect
  - Loading: Rotating gradient shimmer
- **Modal Entry**: Fade-in background + scale-up modal (0.9 → 1.0)
- **Tab Switching**: Cross-fade content with slide animation
- **Toast Notifications**: Slide-in from top-right with bounce

#### 3. **Data Visualization Animations**
- **Log Entries**: Fade-in + slide from left with stagger (50ms delay each)
- **Status Indicators**: Pulsing glow for active states
- **Progress Bars**: Smooth fill animation with gradient movement
- **Charts/Metrics**: Animated drawing with delay
- **Loading States**: Skeleton screens with shimmer gradient

#### 4. **AI Assistant Animations**
- **Message Typing**: Character-by-character reveal (typewriter effect)
- **Thinking State**: Pulsing dots or orbital loader
- **Panel Expansion**: Smooth height transition with content fade-in
- **Suggestion Cards**: Hover lift with glow border

#### 5. **Responsive Feedback**
- **Validation Success**: Green checkmark with scale animation
- **Error States**: Shake animation + red glow
- **Copy to Clipboard**: Brief scale + checkmark overlay
- **Undo/Redo**: Rewind/forward icon rotation

### Animation Library Recommendations
- **Framer Motion** (primary): For React component animations
- **GSAP** (optional): For complex timeline animations
- **React Spring**: For physics-based animations
- **CSS Animations**: For simple transitions and keyframes

### Performance Considerations
- Use `will-change` for frequently animated properties
- Prefer `transform` and `opacity` for GPU acceleration
- Debounce rapid animations
- Reduce motion for accessibility when requested

---

## Layout Structure

### Main Application Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar (Fixed)                                 │
│  [Logo] [Project Name] [Save] [Collaborate] [User Avatar]   │
└─────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────┬────────────┐
│          │                                     │            │
│  LEFT    │        CANVAS WORKSPACE             │   RIGHT    │
│  PANEL   │     (Network Topology Editor)       │   PANEL    │
│          │                                     │            │
│ Devices  │  - Draggable devices                │  Logs      │
│ Tools    │  - Connections                      │  AI Chat   │
│ Config   │  - Grid background                  │  Errors    │
│ Simulate │  - Zoom/Pan controls                │  Help      │
│          │  - Packet animations                │            │
│          │                                     │            │
│ 300-350px│         Flexible Width              │  350-400px │
└──────────┴─────────────────────────────────────┴────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Bottom Status Bar (Optional)                               │
│  [Zoom Level] [Grid Toggle] [Connection Mode] [Sim Status]  │
└─────────────────────────────────────────────────────────────┘
```

### Left Panel Sections (Collapsible)
1. **Device Library**
   - Drag-and-drop device icons
   - Categories: End Devices, Network Devices, Wireless
   - Search/filter functionality

2. **Connection Tools**
   - Straight cable, Console cable, Wireless
   - Auto-connect mode toggle

3. **Configuration Panel**
   - Device properties when selected
   - IP configuration forms
   - Routing table editor

4. **Simulation Controls**
   - Send Packet button
   - Network conditions (latency, packet loss sliders)
   - Start/Stop simulation

### Right Panel Sections
1. **Event Logs**
   - Timestamped network events
   - Color-coded by severity
   - Expandable details

2. **AI Assistant (Gemini)**
   - Chat interface
   - Context-aware suggestions
   - Explain/Troubleshoot buttons

3. **Error Detection**
   - Misconfiguration warnings
   - Connectivity issues
   - Quick fix suggestions

---

## Technical Stack Requirements

### Core Framework
- **React 18+** with TypeScript
- **Vite** for build tooling (fast HMR)

### Canvas & Visualization
- **React Konva** or **Fabric.js** for canvas manipulation
- **D3.js** (optional) for data visualization
- Custom rendering logic for network topology

### State Management
- **Zustand** (lightweight) or **Redux Toolkit**
- **React Query / TanStack Query** for server state

### UI Component Libraries
- **Tailwind CSS** for utility-first styling
- **Radix UI** or **Headless UI** for accessible primitives
- **Lucide React** or **Heroicons** for icons
- **Framer Motion** for animations

### Authentication
- **Firebase Authentication** (Google OAuth)
- **React Firebase Hooks** for auth state

### Real-Time Communication
- **Socket.io Client** for WebSocket connections
- **Zustand** or context for shared state sync

### Code Quality
- **ESLint + Prettier** for code formatting
- **TypeScript** for type safety
- **Vitest** or **Jest** for testing

---

## Component Architecture

### Key Components to Build

#### 1. **Canvas Workspace (`NetworkCanvas`)**
- Renders network topology
- Handles device drag-and-drop
- Connection drawing logic
- Packet animation system
- Zoom and pan controls
- Grid background with snap-to-grid

#### 2. **Device Components**
```typescript
- DeviceNode (base component)
  - RouterDevice
  - SwitchDevice
  - PCDevice
  - ServerDevice
  - HubDevice
  - WirelessDevice
```

#### 3. **Connection Component**
- Line rendering with animation
- Packet flow visualization
- Connection status indicators

#### 4. **Left Panel Components**
```typescript
- DeviceLibrary
- ConnectionToolbar
- ConfigurationPanel
- SimulationControls
```

#### 5. **Right Panel Components**
```typescript
- EventLog
- AIAssistant (Chat Interface)
- ErrorPanel
```

#### 6. **Modals & Overlays**
```typescript
- DeviceConfigModal
- IPConfigurationForm
- RoutingTableEditor
- CollaborationInvite
- SaveProjectModal
```

#### 7. **Navigation & Auth**
```typescript
- TopNavBar
- UserMenu
- AuthModal (Google Sign-In)
```

---

## State Management Structure

### Global State (Zustand)

```typescript
interface NetworkState {
  // Canvas State
  devices: Device[];
  connections: Connection[];
  selectedDevice: Device | null;
  canvasZoom: number;
  canvasOffset: { x: number; y: number };
  
  // Simulation State
  isSimulating: boolean;
  packets: Packet[];
  logs: LogEntry[];
  
  // UI State
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeTab: string;
  
  // User State
  user: User | null;
  role: 'student' | 'teacher';
  
  // Collaboration State
  collaborators: User[];
  isLiveSession: boolean;
  
  // Actions
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  addConnection: (connection: Connection) => void;
  sendPacket: (from: string, to: string) => void;
  // ... more actions
}
```

---

## Key Features to Implement

### Phase 1: Core Canvas & Devices
- ✅ Canvas workspace with grid background
- ✅ Drag-and-drop device placement
- ✅ Device selection and highlighting
- ✅ Snap-to-grid functionality
- ✅ Zoom and pan controls

### Phase 2: Connections & Configuration
- ✅ Draw connections between devices
- ✅ Device configuration panel
- ✅ IP address assignment forms
- ✅ Connection validation

### Phase 3: Simulation Engine
- ✅ Packet sending mechanism
- ✅ Packet animation along paths
- ✅ Event logging system
- ✅ Error detection

### Phase 4: AI Integration
- ✅ Gemini API integration
- ✅ Context-aware explanations
- ✅ Troubleshooting suggestions
- ✅ Chat interface

### Phase 5: Authentication & Collaboration
- ✅ Google OAuth login
- ✅ User roles (student/teacher)
- ✅ Real-time collaboration
- ✅ Save/load projects

---

## Animation Examples to Implement

### Example 1: Device Drop Animation
```typescript
// Framer Motion variant
const deviceVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  },
  hover: { 
    scale: 1.05, 
    boxShadow: '0 0 20px rgba(0, 217, 255, 0.5)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 }
};
```

### Example 2: Packet Animation
```typescript
// Animated packet traveling along connection
const animatePacket = (fromDevice, toDevice, path) => {
  // Create glowing dot
  // Animate along SVG path using motion path
  // Add trailing glow effect
  // Emit events at each hop
};
```

### Example 3: Panel Slide-In
```typescript
const panelVariants = {
  hidden: { x: -350, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: 'tween', duration: 0.3, ease: 'easeOut' }
  }
};
```

---

## Accessibility & UX Considerations

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and roles
- **Reduced Motion**: Respect `prefers-reduced-motion` media query
- **High Contrast Mode**: Ensure readability in high contrast
- **Responsive Design**: Works on tablets (iPad focus)
- **Touch Support**: Touch-friendly interactions for mobile devices

---

## Performance Optimization

- **Canvas Rendering**: Use virtualization for large networks
- **Memoization**: React.memo for heavy components
- **Lazy Loading**: Code-split panels and modals
- **Debouncing**: Debounce canvas updates and API calls
- **Web Workers**: Offload simulation logic to workers
