import { create } from "zustand";
import { login as apiLogin, logout as apiLogout, register as apiRegister } from "@/api/auth";
import { getMyFreelancerProfile, updateFreelancerProfile, getMyClientProfile, updateClientProfile, initFreelancerProfile, initClientProfile } from "@/api/profile";
import { getMyNotifications } from "@/api/notifications";
import { getAccessToken, getRefreshToken, clearTokens } from "@/api/config";

// ── JWT decode (no library needed — just base64 the payload) ──────────────────
function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    // base64url → base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function makeInitials(firstName, lastName) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "U";
}

function buildUser(authUser, profile) {
  const firstName = authUser.firstName || profile?.firstName || "";
  const lastName  = authUser.lastName  || profile?.lastName  || "";
  const role = (authUser.role || "").toString(); // may be enum string like "CLIENT"
  return {
    id: authUser.id,
    email: authUser.email,
    firstName,
    lastName,
    role,
    name: [firstName, lastName].filter(Boolean).join(" ") || authUser.email || "User",
    initials: makeInitials(firstName, lastName),
    // freelancer profile fields
    title:            profile?.title            || "",
    bio:              profile?.bio              || "",
    hourlyRate:       profile?.hourlyRate       || null,
    location:         profile?.location         || "",
    yearsOfExperience:profile?.yearsOfExperience|| null,
    portfolioUrl:     profile?.portfolioUrl     || "",
    linkedinUrl:      profile?.linkedinUrl      || "",
    githubUrl:        profile?.githubUrl        || "",
    avgRating:        profile?.avgRating        || null,
    totalReviews:     profile?.totalReviews     || 0,
    totalJobsCompleted: profile?.totalJobsCompleted || 0,
    skills:           profile?.skills           || [],
    // client profile fields
    companyName:      profile?.companyName      || "",
    description:      profile?.description      || "",
    industry:         profile?.industry         || "",
    companySize:      profile?.companySize      || "",
    websiteUrl:       profile?.websiteUrl       || "",
    totalJobsPosted:  profile?.totalJobsPosted  || 0,
    profileId:        profile?.id               || null,
  };
}

// Fetch profile silently — never throws, returns null on failure
async function fetchProfile(role) {
  try {
    if ((role || "").toUpperCase() === "FREELANCER") {
      return await getMyFreelancerProfile();
    }
    return await getMyClientProfile();
  } catch {
    // Profile may not exist yet (new user) or service is unavailable.
    // Return null — caller decides what to do. Never clear tokens here
    // because fetchProfile is also called during login after token is fresh.
    return null;
  }
}

export const useAppStore = create((set, get) => ({
  isAuthenticated: false,
  authLoading: false,
  authError: null,

  // ── Restore session from stored JWT (called on app mount) ─────────────────
  initAuth: async () => {
    const token = getAccessToken();
    if (!token) { set({ isAuthenticated: false }); return; }

    // Decode JWT locally — avoids the 403 from /api/auth/me (gateway strips Authorization)
    const claims = decodeJwtPayload(token);
    if (!claims) { clearTokens(); set({ isAuthenticated: false }); return; }

    // Check client-side expiry first (fast path)
    const nowSecs = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < nowSecs) {
      clearTokens();
      set({ isAuthenticated: false });
      return;
    }

    const authUser = {
      id:        claims.sub || claims.userId || claims.id,
      email:     claims.email,
      firstName: claims.firstName,
      lastName:  claims.lastName,
      role:      claims.role,
    };

    const role = authUser.role || "CLIENT";
    set({ authLoading: true });

    const profile = await fetchProfile(role);

    // After fetchProfile, check if tokens were cleared by apiFetch's 401 handler.
    // If so, the server considers this token revoked — treat as logged out.
    if (!getAccessToken()) {
      set({ isAuthenticated: false, authLoading: false });
      return;
    }

    set({
      isAuthenticated: true,
      authLoading: false,
      user: buildUser(authUser, profile),
      currentRole: role.toLowerCase(),
    });
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    set({ authLoading: true, authError: null });
    try {
      // AuthResponse: { accessToken, refreshToken, tokenType, user: { id, email, firstName, lastName, role } }
      const data = await apiLogin({ email, password });
      const authUser = data.user || data; // user is nested in AuthResponse
      const role = (authUser.role || "CLIENT").toString();

      const profile = await fetchProfile(role);

      set({
        isAuthenticated: true,
        authLoading: false,
        user: buildUser(authUser, profile),
        currentRole: role.toLowerCase(),
      });

      return { role };
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      throw err;
    }
  },

  // ── Register ──────────────────────────────────────────────────────────────
  register: async ({ firstName, lastName, email, password, role }) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await apiRegister({ firstName, lastName, email, password, role });
      const authUser = data.user || { firstName, lastName, email, role, id: data.id };

      // Now fetch the newly created profile
      const profile = await fetchProfile(role);

      set({
        isAuthenticated: true,
        authLoading: false,
        user: buildUser(authUser, profile),
        currentRole: role.toLowerCase(),
      });

      return { role };
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      throw err;
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    const refreshToken = getRefreshToken();
    try { await apiLogout(refreshToken); } catch { /* ignore */ }
    finally {
      set({
        isAuthenticated: false,
        user: null,
        currentRole: "client",
        notifications: [],
        unreadNotifications: 0,
      });
    }
  },

  // ── Role ──────────────────────────────────────────────────────────────────
  currentRole: "client",
  setRole: (role) => set({ currentRole: role }),

  // ── User ──────────────────────────────────────────────────────────────────
  user: null,
  setUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : updates })),

  // Save profile — routes to correct endpoint based on role
  saveProfile: async (updates) => {
    const { currentRole } = get();
    let data;
    if (currentRole === "freelancer") {
      data = await updateFreelancerProfile({
        title:             updates.title             || "",
        bio:               updates.bio               || "",
        hourlyRate:        updates.hourlyRate         ? Number(updates.hourlyRate) : null,
        location:          updates.location           || "",
        yearsOfExperience: updates.yearsOfExperience  ? Number(updates.yearsOfExperience) : null,
        portfolioUrl:      updates.portfolioUrl       || "",
        linkedinUrl:       updates.linkedinUrl        || "",
        githubUrl:         updates.githubUrl          || "",
      });
    } else {
      data = await updateClientProfile({
        firstName:   updates.firstName   || get().user?.firstName || "",
        lastName:    updates.lastName    || get().user?.lastName  || "",
        companyName: updates.companyName || "",
        description: updates.description || updates.bio || "",
        industry:    updates.industry    || "",
        companySize: updates.companySize || "",
        location:    updates.location    || "",
        websiteUrl:  updates.websiteUrl  || "",
        linkedinUrl: updates.linkedinUrl || "",
      });
    }
    if (data) {
      const existing = get().user || {};
      set({ user: buildUser({ ...existing, ...data }, data) });
    }
    return data;
  },

  // ── Messages ──────────────────────────────────────────────────────────────
  unreadMessages: 0,
  incrementUnreadMessages: (by = 1) =>
    set((s) => ({ unreadMessages: Math.max(0, s.unreadMessages + by) })),
  clearUnreadMessages: () => set({ unreadMessages: 0 }),

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: [],
  unreadNotifications: 0,

  loadNotifications: async () => {
    // Only call if we believe we're authenticated
    if (!useAppStore.getState().isAuthenticated) return;
    try {
      const result = await getMyNotifications();
      const list = Array.isArray(result) ? result : result?.notifications ?? [];
      const unread = list.filter((n) => !n.read).length;
      set({ notifications: list, unreadNotifications: unread });
    } catch (err) {
      // 401 = token invalid — clear session so user is redirected to login
      if (err.message && err.message.includes("401")) {
        clearTokens();
        set({ isAuthenticated: false, user: null });
      }
      // All other errors: silently ignore (service may be down)
    }
  },

  notify: (partial) =>
    set((state) => {
      const n = {
        id: `n_${Date.now()}`,
        read: false,
        type: "info",
        title: "Notification",
        message: "",
        createdAt: new Date().toISOString(),
        ...partial,
      };
      return {
        notifications: [n, ...state.notifications].slice(0, 50),
        unreadNotifications: state.unreadNotifications + 1,
      };
    }),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadNotifications: 0,
    })),
}));
