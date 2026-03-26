import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useState } from "react";
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
import FindFreelancers from "@/pages/find-freelancers";
import FreelancerProfile from "@/pages/freelancer-profile";

function DashboardRedirect() {
  const { currentRole, isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${currentRole}`} replace />;
}

// Shown while initAuth is running — prevents the login flash
function InitSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[13px] text-ink-3">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { initAuth, loadNotifications, isAuthenticated } = useAppStore();
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    initAuth()
      .then(() => {
        // Only load notifications if we are actually authenticated
        if (useAppStore.getState().isAuthenticated) {
          loadNotifications();
        }
      })
      .finally(() => {
        setInitialising(false);
      });
  }, []);

  // Block rendering until we know the auth state — eliminates the flash
  if (initialising) return <InitSpinner />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/dashboard/client" element={<ClientDashboard />} />
        <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
        
        {/* Job Routes */}
        <Route path="/projects" element={<BrowseProjects />} />
        <Route path="/tracking" element={<ProjectTracking />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/submit-proposal" element={<SubmitProposal />} />
        <Route path="/bids" element={<Bids />} />
        
        {/* Freelancer Routes */}
        <Route path="/freelancers" element={<FindFreelancers />} />
        <Route path="/freelancer/:profileId" element={<FreelancerProfile />} /> {/* New Route */}
        
        {/* Contract & Messages */}
        <Route path="/contracts" element={<ProjectTracking />} />
        <Route path="/messages" element={<Messages />} />
        
        {/* Profile & Reviews */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/reviews" element={<Reviews />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}