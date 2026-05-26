import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import LandingPage from "./pages/LandingPage";
import SessionDashboard from "./pages/SessionDashboard";
import SimulatorPage from "./pages/SimulatorPage";
import TestPage from "./pages/TestPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Route - Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<AuthGuard><SessionDashboard /></AuthGuard>} />
          <Route path="/session/:sessionId" element={<AuthGuard><SimulatorPage /></AuthGuard>} />
          <Route path="/test" element={<AuthGuard><TestPage /></AuthGuard>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
