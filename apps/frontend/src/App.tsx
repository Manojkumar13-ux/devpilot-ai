import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./components/LoadingScreen";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProblemList = lazy(() => import("./pages/ProblemList"));
const ProblemDetail = lazy(() => import("./pages/ProblemDetail"));
const History = lazy(() => import("./pages/History"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AnalyticsPage = lazy(() => import("./pages/Analytics"));
const SubmissionDetail = lazy(() => import("./pages/SubmissionDetail"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AdminPage = lazy(() => import("./pages/Admin"));

function LayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
        <Route path="/problems" element={<LayoutRoute><ProblemList /></LayoutRoute>} />
        <Route path="/history" element={<LayoutRoute><History /></LayoutRoute>} />
        <Route path="/analytics" element={<LayoutRoute><AnalyticsPage /></LayoutRoute>} />
        <Route path="/leaderboard" element={<LayoutRoute><Leaderboard /></LayoutRoute>} />
        <Route path="/submissions/:id" element={<ProtectedRoute><SubmissionDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<LayoutRoute><Profile /></LayoutRoute>} />
        <Route path="/settings" element={<LayoutRoute><SettingsPage /></LayoutRoute>} />
        <Route path="/admin" element={<LayoutRoute><AdminPage /></LayoutRoute>} />
        <Route
          path="/problems/:slug"
          element={
            <ProtectedRoute>
              <ProblemDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/:slug/ai-assistant/:submissionId"
          element={
            <ProtectedRoute>
              <AIAssistantPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
