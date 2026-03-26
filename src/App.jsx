import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ClinicProvider } from "./context/ClinicContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SchedulePage from "./pages/SchedulePage";
import DashboardPage from "./pages/DashboardPage";
import AbsencePage from "./pages/AbsencePage";
import AdminPage from "./pages/AdminPage";
import AIRulesPage from "./pages/AIRulesPage";
import AIChatPage from "./pages/AIChatPage";
import AIPredictionsPage from "./pages/AIPredictionsPage";
import SwapsPage from "./pages/SwapsPage";
import WishesPage from "./pages/WishesPage";
import FairnessPage from "./pages/FairnessPage";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState("schedule");

  if (!isAuthenticated) return <LoginPage />;

  const pages = {
    schedule: <SchedulePage />,
    dashboard: <DashboardPage />,
    absence: <AbsencePage />,
    admin: <AdminPage />,
    "ai-rules": <AIRulesPage />,
    "ai-chat": <AIChatPage />,
    "ai-predict": <AIPredictionsPage />,
    swaps: <SwapsPage />,
    wishes: <WishesPage />,
    fairness: <FairnessPage />,
  };

  return (
    <Layout page={page} setPage={setPage}>
      {pages[page] || <SchedulePage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <AppContent />
      </ClinicProvider>
    </AuthProvider>
  );
}
