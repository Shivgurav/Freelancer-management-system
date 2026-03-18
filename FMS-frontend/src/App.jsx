import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/use-app-store";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ClientDashboard from "@/pages/dashboard-client";
import FreelancerDashboard from "@/pages/dashboard-freelancer";
import BrowseProjects from "@/pages/browse-projects";
import ProjectTracking from "@/pages/project-tracking";
import PostProject from "@/pages/post-project";
import SubmitProposal from "@/pages/submit-proposal";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Reviews from "@/pages/reviews";
import Bids from "@/pages/bids";
import NotFoundPage from "@/pages/not-found";

function DashboardRedirect() {
  const currentRole = useAppStore((s) => s.currentRole);
  return <Navigate to={`/dashboard/${currentRole}`} replace />;
}

export default function App() {
  const { initAuth, loadNotifications } = useAppStore();

  useEffect(() => {
    initAuth();
    loadNotifications();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/dashboard/client" element={<ClientDashboard />} />
        <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
        <Route path="/projects" element={<BrowseProjects />} />
        <Route path="/tracking" element={<ProjectTracking />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/submit-proposal" element={<SubmitProposal />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/bids" element={<Bids />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
