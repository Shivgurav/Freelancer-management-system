import { create } from "zustand";
import { login as apiLogin, logout as apiLogout, register as apiRegister } from "@/api/auth";
import { getMyProfile, updateMyProfile } from "@/api/profile";
import { getMyNotifications } from "@/api/notifications";
import { getAccessToken } from "@/api/config";

function makeInitials(firstName, lastName, name) {
  if (firstName || lastName) {
    return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "U";
  }
  if (name) {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
  }
  return "U";
}

function buildUser(raw) {
  const firstName = raw.firstName || "";
  const lastName = raw.lastName || "";
  const name = raw.name || [firstName, lastName].filter(Boolean).join(" ") || "User";
  return {
    ...raw,
    firstName,
    lastName,
    name,
    initials: makeInitials(firstName, lastName, raw.name),
  };
}

export const useAppStore = create((set, get) => ({
  isAuthenticated: false,
  authLoading: false,
  authError: null,

  initAuth: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    try {
      set({ authLoading: true });
      const profile = await getMyProfile();
      set({
        isAuthenticated: true,
        authLoading: false,
        user: buildUser(profile),
        currentRole: profile.role || "client",
      });
    } catch {
      set({ isAuthenticated: false, authLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await apiLogin({ email, password });
      const userData = data.user || data;
      set({
        isAuthenticated: true,
        authLoading: false,
        user: buildUser(userData),
        currentRole: userData.role || "client",
      });
      return data;
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      throw err;
    }
  },

  register: async ({ firstName, lastName, email, password, role }) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await apiRegister({ firstName, lastName, email, password, role });
      const userData = data.user || data;
      set({
        isAuthenticated: true,
        authLoading: false,
        user: buildUser({ ...userData, firstName, lastName }),
        currentRole: role || userData.role || "client",
      });
      return data;
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      set({ isAuthenticated: false, user: null, currentRole: "client" });
    }
  },

  currentRole: "client",
  setRole: (role) => set({ currentRole: role }),

  user: null,
  setUser: (updates) =>
    set((state) => {
      const merged = { ...(state.user || {}), ...updates };
      return { user: buildUser(merged) };
    }),

  saveProfile: async (updates) => {
    const data = await updateMyProfile(updates);
    get().setUser(data || updates);
    return data;
  },

  unreadMessages: 0,
  incrementUnreadMessages: (by = 1) =>
    set((s) => ({ unreadMessages: Math.max(0, s.unreadMessages + by) })),
  clearUnreadMessages: () => set({ unreadMessages: 0 }),

  notifications: [],
  unreadNotifications: 0,

  loadNotifications: async () => {
    try {
      const result = await getMyNotifications();
      const list = Array.isArray(result) ? result : result?.notifications ?? [];
      const unread = list.filter((n) => !n.read).length;
      set({ notifications: list, unreadNotifications: unread });
    } catch {
      // silently ignore if notifications endpoint not available
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
        unreadNotifications: state.unreadNotifications + (n.read ? 0 : 1),
      };
    }),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadNotifications: 0,
    })),
}));
