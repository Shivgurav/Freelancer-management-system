import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Search, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/use-app-store";
import { getConversations, getMessages, sendMessage as apiSendMessage } from "@/api/messages";

function makeInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "bg-primary-light text-primary-darker",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-warning-bg text-warning-text",
  "bg-success-bg text-success-text",
];

function colorForId(id) {
  const num = String(id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[num % AVATAR_COLORS.length];
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [convError, setConvError] = useState("");
  const { user, notify, incrementUnreadMessages } = useAppStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoadingConvs(true);
    setConvError("");
    getConversations()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.conversations ?? result?.content ?? [];
        setConversations(list);
        if (list.length > 0 && !activeId) {
          const paramId = searchParams.get("contact");
          const found = paramId ? list.find((c) => String(c.id) === paramId || String(c.participantId) === paramId) : null;
          setActiveId(found?.id ?? list[0].id);
        }
      })
      .catch((err) => setConvError(err.message))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    const paramId = searchParams.get("contact");
    if (paramId && conversations.length > 0) {
      const found = conversations.find((c) => String(c.id) === paramId || String(c.participantId) === paramId);
      if (found) setActiveId(found.id);
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    getMessages(activeId)
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.messages ?? [];
        const currentUserId = user?.id;
        setMessages(
          list.map((m) => ({
            ...m,
            type: m.senderId === currentUserId || m.type === "sent" ? "sent" : "received",
            text: m.text || m.content || m.body || "",
            time: m.time || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""),
          }))
        );
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeId);

  async function sendMessage() {
    if (!messageInput.trim() || !activeId) return;
    const text = messageInput.trim();
    setMessageInput("");
    const optimistic = { type: "sent", text, time: "Just now", id: `tmp_${Date.now()}` };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await apiSendMessage(activeId, text);
    } catch {
      // keep optimistic message visible
    }
  }

  function getParticipantName(conv) {
    return conv.participantName || conv.name || conv.participant?.name || "Unknown";
  }

  return (
    <DashboardLayout title="Messages">
      <div className="flex gap-0 h-[calc(100vh-140px)] min-h-[400px] bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="w-[240px] flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-4" />
              <input
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-[12.5px] bg-background text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loadingConvs ? (
              <div className="p-4 text-center text-xs text-ink-3 animate-pulse">Loading...</div>
            ) : convError ? (
              <div className="p-4 text-center text-xs text-danger">{convError}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-3">No conversations yet.</div>
            ) : (
              conversations.map((conv) => {
                const name = getParticipantName(conv);
                const initials = makeInitials(name);
                const colorClass = colorForId(conv.id);
                const isUnread = conv.unreadCount > 0 || conv.unread;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-3 text-left hover:bg-background/60 transition-colors",
                      conv.id === activeId && "bg-primary-bg"
                    )}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${colorClass}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-medium text-ink truncate">{name}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-ink-4 flex-shrink-0 ml-1">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <div className="text-[11px] text-ink-3 truncate">{conv.lastMessage}</div>
                      )}
                    </div>
                    {isUnread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <div className="h-12 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${colorForId(activeConv.id)}`}>
                  {makeInitials(getParticipantName(activeConv))}
                </div>
                <div className="text-[13px] font-semibold text-ink">{getParticipantName(activeConv)}</div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loadingMsgs ? (
                  <div className="text-center text-xs text-ink-3 animate-pulse mt-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-ink-3 mt-4">No messages yet. Say hello!</div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={msg.id || i} className={cn("flex", msg.type === "sent" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed",
                          msg.type === "sent"
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-background border border-border text-ink rounded-bl-sm"
                        )}
                      >
                        {msg.text}
                        <div className={cn("text-[10px] mt-1", msg.type === "sent" ? "text-white/70 text-right" : "text-ink-4")}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-border p-3 flex items-end gap-2 flex-shrink-0">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-ink bg-background focus:outline-none focus:border-primary transition-colors resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="w-9 h-9 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Send"
                >
                  <ArrowUpCircle className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-ink-3">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
