import { apiFetch, getAccessToken } from "./config";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// WebSocket connects directly to message-service (bypasses the gateway for WS)
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8090/ws";

// ── REST API ──────────────────────────────────────────────────────────────────

// GET /api/messages/rooms
export function getChatRooms() {
  return apiFetch("/messages/rooms");
}

// GET /api/messages/recent/{contractId}
export function getRecentMessages(contractId) {
  return apiFetch(`/messages/recent/${contractId}`);
}

// GET /api/messages/history/{contractId}
export function getChatHistory(contractId) {
  return apiFetch(`/messages/history/${contractId}`);
}

// GET /api/messages/unread-count
export function getUnreadCount() {
  return apiFetch("/messages/unread-count");
}

// ── WebSocket / STOMP Client ──────────────────────────────────────────────────

let stompClient = null;
let connected = false;
const subscribers = new Map();

function notifySubs(topic, payload) {
  const subs = subscribers.get(topic);
  if (subs) subs.forEach((cb) => cb(payload));
}

export function connectWS(userId, onConnect, onDisconnect) {
  if (stompClient && connected) {
    onConnect?.();
    return;
  }

  const token = getAccessToken();

  stompClient = new Client({
    webSocketFactory: () => {
      const token = getAccessToken();
      return new SockJS(`${WS_URL}?token=${token}`);
    },
    connectHeaders: { Authorization: token ? `Bearer ${token}` : "" },
    reconnectDelay: 5000,
    onConnect: () => {
      connected = true;
      // Private message queue
      stompClient.subscribe(`/user/${userId}/queue/messages`, (frame) => {
        try {
          const msg = JSON.parse(frame.body);
          notifySubs("message", msg);
          if (msg.contractId) notifySubs(`message:${msg.contractId}`, msg);
        } catch {}
      });
      // Read receipts
      stompClient.subscribe(`/user/${userId}/queue/read-receipt`, (frame) => {
        try {
          notifySubs("read-receipt", JSON.parse(frame.body));
        } catch {}
      });
      onConnect?.();
    },
    onDisconnect: () => {
      connected = false;
      onDisconnect?.();
    },
    onStompError: () => {
      connected = false;
      onDisconnect?.();
    },
  });

  stompClient.activate();
}

export function disconnectWS() {
  stompClient?.deactivate();
  stompClient = null;
  connected = false;
}

export function isWSConnected() {
  return connected;
}

export function sendWSMessage(contractId, content) {
  if (!stompClient || !connected) throw new Error("WebSocket not connected");
  stompClient.publish({
    destination: "/app/chat/send",
    body: JSON.stringify({ contractId, content, type: "TEXT" }),
  });
}

export function markWSRead(contractId) {
  if (!stompClient || !connected) return;
  stompClient.publish({
    destination: "/app/chat/read",
    body: JSON.stringify({ contractId }),
  });
}

export function onWSEvent(topic, callback) {
  if (!subscribers.has(topic)) subscribers.set(topic, new Set());
  subscribers.get(topic).add(callback);
  return () => subscribers.get(topic)?.delete(callback);
}
