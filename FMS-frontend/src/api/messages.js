import { apiFetch } from "./config";

export function getConversations() {
  return apiFetch("/messages/conversations");
}

export function getMessages(contactId) {
  return apiFetch(`/messages/${contactId}`);
}

export function sendMessage(contactId, text) {
  return apiFetch(`/messages/${contactId}`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
