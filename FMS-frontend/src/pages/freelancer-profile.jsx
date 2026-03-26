// src/pages/freelancer-profile.jsx
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SkillTag } from "@/components/ui/skill-tag";
// import { StarRating } from "@/components/ui/star-rating";
import {
  MapPin, Star, Briefcase, DollarSign, Globe, Github, Linkedin,
  MessageSquare, Calendar, Award, CheckCircle, ArrowLeft
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getFreelancerProfileById } from "@/api/profile";
import { getChatRooms, connectWS, disconnectWS, sendWSMessage, isWSConnected } from "@/api/messages";
import { useContracts } from "@/hooks/use-contracts";

export default function FreelancerProfile() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user, currentRole } = useAppStore();
  const { data: contracts = [] } = useContracts();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [existingRoom, setExistingRoom] = useState(null);

  useEffect(() => {
    if (!profileId) {
      setError("Profile ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    getFreelancerProfileById(profileId)
      .then((data) => {
        setProfile(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  // Check for existing chat room when user clicks message
  useEffect(() => {
    if (showMessageModal && user?.id && profile?.userId) {
      getChatRooms()
        .then((rooms) => {
          const existing = rooms.find(
            (r) =>
              (r.freelancerId === profile.userId && r.clientId === user.id) ||
              (r.freelancerId === user.id && r.clientId === profile.userId)
          );
          setExistingRoom(existing);
        })
        .catch(() => {});
    }
  }, [showMessageModal, user?.id, profile?.userId]);

  const handleSendMessage = async () => {
    if (!messageDraft.trim()) return;
    
    setSendingMessage(true);
    setMessageError("");
    
    try {
      if (existingRoom) {
        // Send to existing contract
        connectWS(user.id);
        await new Promise(resolve => setTimeout(resolve, 500));
        sendWSMessage(existingRoom.contractId, messageDraft.trim());
      } else {
        // No existing contract - show message
        setMessageError("You can only message freelancers you have a contract with.");
        return;
      }
      
      setShowMessageModal(false);
      setMessageDraft("");
      navigate("/messages");
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-ink-2">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-danger mb-4">{error || "Profile not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 px-5 text-sm font-semibold transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const initials = ((profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")).toUpperCase() || "F";
  const isClient = currentRole === "client";
  const hasContract = contracts.some(
    (c) => c.freelancerId === profile.userId || c.freelancerProfileId === profile.profileId
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-surface to-background border border-border rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl bg-primary flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-ink">
                  {profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(" ")}
                </h1>
                {profile.title && (
                  <p className="text-primary-dark font-medium mt-1">{profile.title}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-ink-2">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.hourlyRate && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(profile.hourlyRate)}/hr</span>
                  </div>
                )}
                {profile.yearsOfExperience != null && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.yearsOfExperience} years experience</span>
                  </div>
                )}
              </div>

              {/* Rating & Stats */}
              <div className="flex flex-wrap gap-4 pt-2">
                {profile.avgRating != null && (
                  <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg">
                    <Star className="w-4 h-4 text-warning-fill" />
                    <span className="font-semibold text-ink">{Number(profile.avgRating).toFixed(1)}</span>
                    {profile.totalReviews > 0 && (
                      <span className="text-ink-3">({profile.totalReviews} reviews)</span>
                    )}
                  </div>
                )}
                {profile.totalJobsCompleted > 0 && (
                  <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-ink">{profile.totalJobsCompleted} jobs completed</span>
                  </div>
                )}
                {profile.availability && (
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium",
                    profile.availability === "FULL_TIME" && "bg-success-bg text-success-text",
                    profile.availability === "PART_TIME" && "bg-warning-bg text-warning-text",
                    profile.availability === "NOT_AVAILABLE" && "bg-danger-bg text-danger-text"
                  )}>
                    {profile.availability.replace("_", " ")}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isClient && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowMessageModal(true)}
                  disabled={!hasContract}
                  className={cn(
                    "flex items-center gap-2 rounded-xl py-2.5 px-5 text-sm font-semibold transition-all",
                    hasContract
                      ? "bg-primary hover:bg-primary-dark text-white shadow-md"
                      : "bg-border text-ink-3 cursor-not-allowed"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  {hasContract ? "Send Message" : "No Active Contract"}
                </button>
                {!hasContract && (
                  <p className="text-xs text-ink-3 text-center">
                    You can only message freelancers you have a contract with
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* About */}
        {profile.bio && (
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-ink mb-3">About</h2>
            <p className="text-ink-2 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <SkillTag
                  key={skill.id || skill.name}
                  className={cn(
                    "px-3 py-1.5 text-sm",
                    skill.proficiencyLevel === "EXPERT" && "bg-primary-bg text-primary-dark",
                    skill.proficiencyLevel === "INTERMEDIATE" && "bg-surface text-ink border border-border",
                    skill.proficiencyLevel === "BEGINNER" && "bg-background text-ink-2 border border-border"
                  )}
                >
                  {skill.name}
                  {skill.proficiencyLevel && (
                    <span className="text-xs opacity-70 ml-1">
                      ({skill.proficiencyLevel.charAt(0) + skill.proficiencyLevel.slice(1).toLowerCase()})
                    </span>
                  )}
                </SkillTag>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Links */}
        {(profile.portfolioUrl || profile.linkedinUrl || profile.githubUrl) && (
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">Portfolio & Links</h2>
            <div className="flex flex-wrap gap-3">
              {profile.portfolioUrl && (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-sm text-ink hover:border-primary transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Portfolio
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-sm text-ink hover:border-primary transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-sm text-ink hover:border-primary transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        {profile.totalReviews > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">Reviews</h2>
            <p className="text-ink-2 text-sm">
              {profile.totalReviews} review{profile.totalReviews !== 1 ? "s" : ""} with{" "}
              <span className="font-semibold text-ink">{Number(profile.avgRating).toFixed(1)}</span> average rating
            </p>
            {/* Reviews can be expanded later */}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ink mb-4">Send Message</h3>
            
            {existingRoom ? (
              <>
                <textarea
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 text-sm text-ink bg-surface focus:outline-none focus:border-primary resize-none"
                />
                {messageError && (
                  <p className="text-sm text-danger mt-2">{messageError}</p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium text-ink hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageDraft.trim()}
                    className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
                  >
                    {sendingMessage ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="w-12 h-12 text-ink-3 mx-auto mb-3" />
                <p className="text-ink-2 mb-4">
                  You need an active contract with this freelancer to send messages.
                </p>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 px-6 text-sm font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}