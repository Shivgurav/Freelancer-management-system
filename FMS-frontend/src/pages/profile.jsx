import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SkillTag } from "@/components/ui/skill-tag";
import {
  MapPin, Star, ArrowUpRight, Briefcase, DollarSign, Globe,
  Github, Linkedin, Upload, Trash2, FileText, Image as ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getFreelancerProfileById, getClientProfileById, addSkill, removeSkill } from "@/api/profile";
import {
  uploadResume, uploadPortfolio, downloadFile,
  getPortfolioFiles, deleteFile, formatFileSize, getFileIcon,
} from "@/api/files";
import { useContracts } from "@/hooks/use-contracts";

export default function Profile() {
  const { user, saveProfile, currentRole, setUser } = useAppStore();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contact");
  const [contactProfile, setContactProfile] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const { data: contracts = [] } = useContracts();

  // Resume state (freelancer only)
  const [resumeFile, setResumeFile]       = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeMsg, setResumeMsg]         = useState("");
  const [resumeError, setResumeError]     = useState("");
  const resumeRef = useRef(null);

  // Portfolio state (freelancer only)
  const [portfolioFiles, setPortfolioFiles]   = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioMsg, setPortfolioMsg]       = useState("");
  const portfolioRef = useRef(null);

  useEffect(() => {
    if (!contactId) { setContactProfile(null); return; }
    setContactLoading(true);
    getFreelancerProfileById(contactId)
      .then(setContactProfile)
      .catch(() => getClientProfileById(contactId).then(setContactProfile).catch(() => setContactProfile(null)))
      .finally(() => setContactLoading(false));
  }, [contactId]);

  // Load portfolio for freelancers
  useEffect(() => {
    const profileUserId = contactId ? null : user?.id;
    if (!profileUserId || currentRole !== "freelancer") return;
    setPortfolioLoading(true);
    getPortfolioFiles(profileUserId)
      .then((files) => setPortfolioFiles(Array.isArray(files) ? files : []))
      .catch(() => {})
      .finally(() => setPortfolioLoading(false));
  }, [user?.id, currentRole, contactId]);

  const isReadOnly = Boolean(contactId);
  const isFreelancer = currentRole === "freelancer";
  const profile = contactProfile || user;

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [newSkillName, setNewSkillName]         = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technical");
  const [skillError, setSkillError]             = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", title: "", bio: "", hourlyRate: "",
    location: "", yearsOfExperience: "", portfolioUrl: "", linkedinUrl: "", githubUrl: "",
    companyName: "", description: "", industry: "", companySize: "", websiteUrl: "",
  });

  function startEdit() {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      title: user?.title || "",
      bio: user?.bio || user?.description || "",
      hourlyRate: user?.hourlyRate || "",
      location: user?.location || "",
      yearsOfExperience: user?.yearsOfExperience || "",
      portfolioUrl: user?.portfolioUrl || "",
      linkedinUrl: user?.linkedinUrl || "",
      githubUrl: user?.githubUrl || "",
      companyName: user?.companyName || "",
      description: user?.description || "",
      industry: user?.industry || "",
      companySize: user?.companySize || "",
      websiteUrl: user?.websiteUrl || "",
    });
    setSaved(false);
    setSaveError("");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      await saveProfile(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill() {
    if (!newSkillName.trim()) return;
    setSkillError("");
    try {
      const skill = await addSkill({ name: newSkillName.trim(), category: newSkillCategory, proficiencyLevel: "INTERMEDIATE" });
      setUser({ skills: [...(user?.skills || []), skill] });
      setNewSkillName("");
    } catch (err) {
      setSkillError(err.message);
    }
  }

  async function handleRemoveSkill(skillId) {
    try {
      await removeSkill(skillId);
      setUser({ skills: (user?.skills || []).filter((s) => s.id !== skillId) });
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Resume upload ─────────────────────────────────────────────────────────
  async function handleResumeUpload() {
    if (!resumeFile) return;
    setResumeUploading(true);
    setResumeMsg("");
    setResumeError("");
    try {
      await uploadResume(resumeFile);
      setResumeMsg("Resume uploaded successfully!");
      setResumeFile(null);
      if (resumeRef.current) resumeRef.current.value = "";
    } catch (err) {
      setResumeError(err.message || "Upload failed");
    } finally {
      setResumeUploading(false);
    }
  }

  // ── Portfolio upload ──────────────────────────────────────────────────────
  async function handlePortfolioUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortfolioUploading(true);
    setPortfolioMsg("");
    try {
      const result = await uploadPortfolio(file);
      setPortfolioFiles((prev) => [...prev, result]);
      setPortfolioMsg("Portfolio item uploaded!");
    } catch (err) {
      setPortfolioMsg("Upload failed: " + (err.message || ""));
    } finally {
      setPortfolioUploading(false);
      if (portfolioRef.current) portfolioRef.current.value = "";
    }
  }

  async function handleDeletePortfolio(fileId) {
    if (!confirm("Remove this portfolio item?")) return;
    try {
      await deleteFile(fileId);
      setPortfolioFiles((prev) => prev.filter((f) => f.fileId !== fileId && f.id !== fileId));
    } catch (err) {
      alert(err.message);
    }
  }

  if (contactLoading) {
    return (
      <DashboardLayout title="Profile">
        <div className="text-center text-ink-3 py-12 animate-pulse">Loading profile...</div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profile">
        <div className="text-center text-ink-3 py-12">Profile not found.</div>
      </DashboardLayout>
    );
  }

  const displayName = profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "—";
  const initials = ((profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")).toUpperCase() || profile.initials || "U";

  return (
    <DashboardLayout title={isReadOnly ? "Profile" : "My Profile"}>
      {/* Profile Header */}
      <div className="bg-surface border border-border rounded-[14px] p-6 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start gap-5">
          <div className="w-[72px] h-[72px] rounded-full bg-primary-light flex items-center justify-center text-[22px] font-bold text-primary-darker shrink-0">
            {initials}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 mb-3">
              <div>
                <h1 className="font-display text-[22px] font-bold text-ink mb-1">{displayName}</h1>
                {isFreelancer && profile.title && (
                  <p className="text-[13px] text-primary-dark font-medium mb-1">{profile.title}</p>
                )}
                {!isFreelancer && profile.companyName && (
                  <p className="text-[13px] text-ink-2 font-medium mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-ink-3" /> {profile.companyName}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[13px] text-ink-3 flex-wrap">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </span>
                  )}
                  {profile.avgRating != null && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-warning text-warning" /> {Number(profile.avgRating).toFixed(1)}
                      {profile.totalReviews > 0 && <span className="text-ink-4">({profile.totalReviews})</span>}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-ink-3 hover:text-primary transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-ink-3 hover:text-ink transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {(profile.portfolioUrl || profile.websiteUrl) && (
                    <a href={profile.portfolioUrl || profile.websiteUrl} target="_blank" rel="noreferrer" className="text-ink-3 hover:text-primary transition-colors">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => editing ? setEditing(false) : startEdit()}
                  className="bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 px-5 text-[13px] font-semibold transition-all hover:shadow-md flex items-center gap-1.5"
                >
                  {editing ? "Cancel" : "Edit Profile"} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {(profile.bio || profile.description) && (
              <p className="text-[13.5px] text-ink-2 leading-relaxed mb-3">{profile.bio || profile.description}</p>
            )}

            {isFreelancer && profile.skills && profile.skills.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {profile.skills.map((skill) => (
                  <SkillTag
                    key={skill.id || skill.name || skill}
                    onRemove={!isReadOnly && skill.id ? () => handleRemoveSkill(skill.id) : undefined}
                  >
                    {skill.name || skill}
                  </SkillTag>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-4 bg-success-bg border border-success/30 text-success-text rounded-xl px-4 py-3 text-[13px] font-medium">
          Profile saved successfully!
        </div>
      )}
      {saveError && (
        <div className="mb-4 bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px] font-medium">
          {saveError}
        </div>
      )}

      {/* Edit Form */}
      {!isReadOnly && editing && (
        <div className="bg-surface border border-border rounded-[14px] p-6 mb-5 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-ink mb-5">Edit Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {!isFreelancer && (
              <>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">First Name</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Last Name</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Company Name</label>
                  <input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} placeholder="Acme Corp"
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Industry</label>
                  <input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="Technology"
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
              </>
            )}
            {isFreelancer && (
              <>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Professional Title</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Senior React Developer"
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Hourly Rate ($)</label>
                  <input type="number" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} placeholder="75"
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Years of Experience</label>
                  <input type="number" value={form.yearsOfExperience} onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))} placeholder="5" min="0" max="50"
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-2">Portfolio URL</label>
                  <input value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://myportfolio.com"
                    className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
                </div>
              </>
            )}
            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="New York, USA"
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">LinkedIn URL</label>
              <input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..."
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
            </div>
            {isFreelancer && (
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-2">GitHub URL</label>
                <input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..."
                  className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
              </div>
            )}
            {!isFreelancer && (
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-2">Website URL</label>
                <input value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://company.com"
                  className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all" />
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-[12px] font-medium text-ink-2 mb-2">
              {isFreelancer ? "Bio" : "Company Description"}
            </label>
            <textarea
              value={isFreelancer ? form.bio : form.description}
              onChange={(e) => setForm((f) => isFreelancer ? { ...f, bio: e.target.value } : { ...f, description: e.target.value })}
              rows={3}
              placeholder="Tell people about yourself or your company..."
              className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white rounded-lg py-2.5 px-5 text-[13px] font-semibold transition-all hover:shadow-md">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => setEditing(false)}
              className="border border-border rounded-lg py-2.5 px-5 text-[13px] font-semibold text-ink-2 hover:bg-background transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Skill (freelancer only, not read-only) */}
      {isFreelancer && !isReadOnly && (
        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5 shadow-sm">
          <h2 className="font-display text-[14px] font-semibold text-ink mb-3">Add a Skill</h2>
          {skillError && <p className="text-danger text-xs mb-2">{skillError}</p>}
          <div className="flex gap-2">
            <input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              placeholder="e.g. React, Node.js..."
              className="flex-1 border-[1.5px] border-border rounded-lg px-3.5 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="border-[1.5px] border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
            >
              <option>Technical</option>
              <option>Design</option>
              <option>Marketing</option>
              <option>Writing</option>
              <option>Management</option>
              <option>Other</option>
            </select>
            <button onClick={handleAddSkill}
              className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition-all">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Resume Upload (freelancer only, not read-only) */}
      {isFreelancer && !isReadOnly && (
        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5 shadow-sm">
          <h2 className="font-display text-[14px] font-semibold text-ink mb-1">Resume / CV</h2>
          <p className="text-[12px] text-ink-3 mb-3">Upload your resume so clients can download it from your public profile.</p>
          {resumeMsg && <p className="text-success text-[12px] mb-2">{resumeMsg}</p>}
          {resumeError && <p className="text-danger text-[12px] mb-2">{resumeError}</p>}
          <div className="flex items-center gap-3">
            <input
              ref={resumeRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={() => resumeRef.current?.click()}
              className="border border-border rounded-lg px-4 py-2 text-[13px] text-ink-2 hover:border-primary hover:text-primary hover:bg-primary-bg transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {resumeFile ? resumeFile.name : "Choose File (PDF/DOC)"}
            </button>
            {resumeFile && (
              <button
                onClick={handleResumeUpload}
                disabled={resumeUploading}
                className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                {resumeUploading ? "Uploading…" : "Upload Resume"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Upload (freelancer only, not read-only) */}
      {isFreelancer && !isReadOnly && (
        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5 shadow-sm">
          <h2 className="font-display text-[14px] font-semibold text-ink mb-1">Portfolio Files</h2>
          <p className="text-[12px] text-ink-3 mb-3">Upload work samples — visible publicly on your profile.</p>
          {portfolioMsg && (
            <p className={`text-[12px] mb-2 ${portfolioMsg.includes("failed") ? "text-danger" : "text-success"}`}>
              {portfolioMsg}
            </p>
          )}
          <div className="flex items-center gap-3 mb-3">
            <input
              ref={portfolioRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.zip"
              className="hidden"
              onChange={handlePortfolioUpload}
            />
            <button
              onClick={() => portfolioRef.current?.click()}
              disabled={portfolioUploading}
              className="border border-border rounded-lg px-4 py-2 text-[13px] text-ink-2 hover:border-primary hover:text-primary hover:bg-primary-bg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              {portfolioUploading ? "Uploading…" : "Upload Portfolio Item"}
            </button>
          </div>
          {portfolioLoading ? (
            <p className="text-[12px] text-ink-3 animate-pulse">Loading portfolio…</p>
          ) : portfolioFiles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {portfolioFiles.map((f) => {
                const fileId = f.fileId || f.id;
                return (
                  <div key={fileId} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2">
                    <span className="text-base">{getFileIcon(f.fileName || f.originalFileName)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink font-medium truncate">{f.fileName || f.originalFileName || "File"}</p>
                      {f.fileSize != null && <p className="text-[11px] text-ink-3">{formatFileSize(f.fileSize)}</p>}
                    </div>
                    <button
                      onClick={() => handleDeletePortfolio(fileId)}
                      className="text-ink-3 hover:text-danger transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-ink-3">No portfolio items yet.</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {!isFreelancer ? (
          <>
            <StatCard value={String(profile.totalJobsPosted || 0)} label="Jobs Posted" icon={Briefcase} />
            <StatCard value={String(contracts.length || 0)} label="Contracts" icon={DollarSign} />
            <StatCard value={profile.avgRating ? Number(profile.avgRating).toFixed(1) : "—"} label="Avg Rating" icon={Star} />
          </>
        ) : (
          <>
            <StatCard value={profile.hourlyRate ? formatCurrency(profile.hourlyRate) + "/hr" : "—"} label="Hourly Rate" icon={DollarSign} />
            <StatCard value={String(profile.totalJobsCompleted || 0)} label="Jobs Completed" icon={Briefcase} />
            <StatCard value={profile.avgRating ? Number(profile.avgRating).toFixed(1) : "—"} label="Avg Rating" icon={Star} />
          </>
        )}
      </div>

      {/* Recent Contracts */}
      {contracts.length > 0 && (
        <div className="bg-surface border border-border rounded-[14px] p-6 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-ink mb-4">Recent Contracts</h2>
          <div className="divide-y divide-border">
            {contracts.slice(0, 5).map((contract, i) => (
              <div key={contract.id || i} className="py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{contract.jobTitle || `Contract #${contract.id?.slice(0, 8)}`}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {!isFreelancer ? `Freelancer: ${contract.freelancerName || "—"}` : `Client: ${contract.clientName || "—"}`}
                  </div>
                </div>
                <div className="text-right">
                  {contract.agreedAmount != null && (
                    <div className="text-[13px] font-semibold text-ink">{formatCurrency(contract.agreedAmount)}</div>
                  )}
                  <div className={`text-xs font-medium mt-0.5 ${contract.status === "ACTIVE" ? "text-success" : "text-ink-3"}`}>
                    {contract.status || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm text-center">
      <div className="flex justify-center mb-2 text-primary-dark"><Icon className="w-5 h-5" /></div>
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-3 mt-1">{label}</div>
    </div>
  );
}
