import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import NewSession from "./pages/NewSession";
import Interview from "./pages/Interview";
import TranscriptReview from "./pages/TranscriptReview";
import ProcessingStatus from "./pages/ProcessingStatus";
import SessionDetail from "./pages/SessionDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import CategoryDetail from "./pages/CategoryDetail";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Exports from "./pages/Exports";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Analytics from "./pages/Analytics";
import DemoMode from "./pages/DemoMode";
import Settings, {
  SettingsProfile, SettingsAccount, SettingsWorkspace, SettingsTeam,
  SettingsAI, SettingsTranscript, SettingsOutput, SettingsNotifications,
  SettingsIntegrations, SettingsAppearance
} from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/new" element={<NewSession />} />
            <Route path="sessions/interview" element={<Interview />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="sessions/:id/review" element={<TranscriptReview />} />
            <Route path="sessions/:id/processing" element={<ProcessingStatus />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="knowledge/:id" element={<CategoryDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:id" element={<ReportDetail />} />
            <Route path="exports" element={<Exports />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="demo" element={<DemoMode />} />
            <Route path="settings" element={<Settings />}>
              <Route index element={<SettingsProfile />} />
              <Route path="account" element={<SettingsAccount />} />
              <Route path="workspace" element={<SettingsWorkspace />} />
              <Route path="team" element={<SettingsTeam />} />
              <Route path="ai" element={<SettingsAI />} />
              <Route path="transcript" element={<SettingsTranscript />} />
              <Route path="output" element={<SettingsOutput />} />
              <Route path="notifications" element={<SettingsNotifications />} />
              <Route path="integrations" element={<SettingsIntegrations />} />
              <Route path="appearance" element={<SettingsAppearance />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;