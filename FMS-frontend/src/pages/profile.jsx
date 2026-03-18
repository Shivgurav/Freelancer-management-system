import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SkillTag } from "@/components/ui/skill-tag";
import { MapPin, Star, ArrowUpRight, Briefcase, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProfileById } from "@/api/profile";
import { useContracts } from "@/hooks/use-contracts";

export default function Profile() {
  const { user, saveProfile, currentRole } = useAppStore();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contact");
  const [contactProfile, setContactProfile] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const { data: contracts = [] } = useContracts();

  useEffect(() => {
    if (!contactId) {
      setContactProfile(null);
      return;
    }
    setContactLoading(true);
    getProfileById(contactId)
      .then(setContactProfile)
      .catch(() => setContactProfile(null))
      .finally(() => setContactLoading(false));
  }, [contactId]);

  const profile = contactProfile || user;
  const isReadOnly = Boolean(contactId);
  const isClient = currentRole === "client";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    headline: user?.headline || "",
    company: user?.company || "",
    location: user?.location || "",
    bio: user?.bio || "",
    email: user?.email || "",
    phone: user?.phone || "",
    skillsText: (user?.skills || []).join(", "),
  });

  function startEdit() {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      headline: user?.headline || "",
      company: user?.company || "",
      location: user?.location || "",
      bio: user?.bio || "",
      email: user?.email || "",
      phone: user?.phone || "",
      skillsText: (user?.skills || []).join(", "),
    });
    setSaved(false);
    setSaveError("");
    setEditing(true);
  }

  async function save() {
    const skills = form.skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    const updates = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      headline: form.headline,
      company: form.company,
      location: form.location,
      bio: form.bio,
      email: form.email,
      phone: form.phone,
      skills,
    };

    setSaving(true);
    setSaveError("");
    try {
      await saveProfile(updates);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
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

  return (
    <DashboardLayout title={isReadOnly ? "Profile" : "My Profile"}>
      <div className="bg-surface border border-border rounded-[14px] p-6 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start gap-5">
          <div className="w-[72px] h-[72px] rounded-full bg-primary-light flex items-center justify-center text-[22px] font-bold text-primary-darker shrink-0">
            {profile.initials || ((profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")).toUpperCase() || "U"}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 mb-3">
              <div>
                <h1 className="font-display text-[22px] font-bold text-ink mb-1">
                  {profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ")}
                </h1>
                {!isClient && profile.headline && (
                  <p className="text-[13px] text-primary-dark font-medium mb-1">{profile.headline}</p>
                )}
                {isClient && profile.company && (
                  <p className="text-[13px] text-ink-3 font-medium mb-1">{profile.company}</p>
                )}
                <div className="flex items-center gap-3 text-[13px] text-ink-3 flex-wrap">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </span>
                  )}
                  {profile.rating != null && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-warning text-warning" /> {profile.rating}
                      </span>
                    </>
                  )}
                  {profile.projectsCount != null && (
                    <>
                      <span>•</span>
                      <span>{profile.projectsCount} projects</span>
                    </>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => (editing ? setEditing(false) : startEdit())}
                  className="bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 px-5 text-[13px] font-semibold transition-all hover:shadow-md flex items-center gap-1.5"
                >
                  {editing ? "Cancel" : "Edit Profile"} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {profile.bio && (
              <p className="text-[13.5px] text-ink-2 leading-relaxed mb-4">{profile.bio}</p>
            )}

            {!isClient && profile.skills && profile.skills.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {profile.skills.map((skill) => (
                  <SkillTag key={skill}>{skill}</SkillTag>
                ))}
              </div>
            )}

            {isClient && profile.company && (
              <div className="flex items-center gap-1.5 text-[13px] text-ink-2">
                <Briefcase className="w-3.5 h-3.5 text-ink-3" />
                {profile.company}
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

      {!isReadOnly && editing && (
        <div className="bg-surface border border-border rounded-[14px] p-6 mb-5 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-ink mb-5">Edit Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">First Name</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Last Name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            {isClient ? (
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-2">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="e.g. TechCorp Inc."
                  className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-2">Professional Headline</label>
                <input
                  value={form.headline}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  placeholder="e.g. Senior React Developer"
                  className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[12px] font-medium text-ink-2 mb-2">
              {isClient ? "About / Company Description" : "About Me"}
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {!isClient && (
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-ink-2 mb-2">
                Skills <span className="text-ink-4 font-normal">(comma separated)</span>
              </label>
              <input
                value={form.skillsText}
                onChange={(e) => setForm((f) => ({ ...f, skillsText: e.target.value }))}
                placeholder="React, Node.js, Figma..."
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white rounded-lg py-2.5 px-5 text-[13px] font-semibold transition-all hover:shadow-md"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border border-border rounded-lg py-2.5 px-5 text-[13px] font-semibold text-ink-2 hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {isClient ? (
          <>
            <StatCard value={user?.totalSpent != null ? formatCurrency(user.totalSpent) : "—"} label="Total Spent" icon={DollarSign} />
            <StatCard value={String(contracts.length || 0)} label="Contracts" icon={Briefcase} />
            <StatCard value={String(contracts.filter((c) => c.status === "Active").length || 0)} label="Active Contracts" icon={Star} />
          </>
        ) : (
          <>
            <StatCard value={user?.totalEarned != null ? formatCurrency(user.totalEarned) : "—"} label="Total Earned" icon={DollarSign} />
            <StatCard value={String(user?.projectsCount ?? contracts.length)} label="Projects Completed" icon={Briefcase} />
            <StatCard value={user?.completionRate != null ? `${user.completionRate}%` : "—"} label="Completion Rate" icon={Star} />
          </>
        )}
      </div>

      {contracts.length > 0 && (
        <div className="bg-surface border border-border rounded-[14px] p-6 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-ink mb-4">
            {isClient ? "Recent Contracts" : "Recent Work"}
          </h2>
          <div className="divide-y divide-border">
            {contracts.slice(0, 5).map((contract, i) => (
              <div key={contract.id || i} className="py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{contract.title || contract.jobTitle || "Contract"}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {isClient ? `Freelancer: ${contract.freelancerName || "—"}` : `Client: ${contract.clientName || "—"}`}
                  </div>
                </div>
                <div className="text-right">
                  {contract.amount != null && (
                    <div className="text-[13px] font-semibold text-ink">{formatCurrency(contract.amount)}</div>
                  )}
                  <div className={`text-xs font-medium mt-0.5 ${contract.status === "Active" ? "text-success" : "text-ink-3"}`}>
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
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-3 mt-1">{label}</div>
    </div>
  );
}
