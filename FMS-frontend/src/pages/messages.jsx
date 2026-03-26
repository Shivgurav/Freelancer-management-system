import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/use-app-store";
import {
  getChatRooms, getRecentMessages,
  connectWS, disconnectWS, isWSConnected,
  sendWSMessage, markWSRead, onWSEvent,
} from "@/api/messages";
import { uploadMessageFile, getFileDownloadUrl, formatFileSize, getFileIcon } from "@/api/files";
import { Send, Wifi, WifiOff, MessageSquare, Loader2, Paperclip, X, Download } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatRoomDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Room list item ─────────────────────────────────────────────────────────────

function RoomItem({ room, active, onClick }) {
  const { currentRole } = useAppStore();
  const other = currentRole === "client"
    ? (room.freelancerName || "Freelancer")
    : (room.clientName || "Client");
  const initial = other.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
        active
          ? "bg-primary-bg border-r-2 border-primary"
          : "hover:bg-background/60 border-r-2 border-transparent"
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary-light text-primary-darker flex items-center justify-center text-[13px] font-semibold">
          {initial}
        </div>
        {room.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {room.unreadCount > 9 ? "9+" : room.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[13.5px] font-semibold text-ink truncate">{other}</span>
          {room.lastMessageAt && (
            <span className="text-[10px] text-ink-4 flex-shrink-0">
              {formatRoomDate(room.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="text-[12px] text-ink-3 truncate">
          {room.jobTitle || "Project chat"}
        </div>
      </div>
    </button>
  );
}

// ── File attachment preview (in compose bar) ───────────────────────────────────

function AttachmentPreview({ file, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-primary-bg border border-primary-light rounded-lg px-3 py-1.5 text-[12px]">
      <span>{getFileIcon(file.name)}</span>
      <span className="text-ink font-medium truncate max-w-[140px]">{file.name}</span>
      <span className="text-ink-3 flex-shrink-0">{formatFileSize(file.size)}</span>
      <button onClick={onRemove} className="text-ink-3 hover:text-danger transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── File message bubble ────────────────────────────────────────────────────────

function FileAttachment({ attachment }) {
  const { fileId, fileName, fileSize } = attachment;
  const url = fileId ? getFileDownloadUrl(fileId) : null;

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 transition-colors mt-1 text-[12px] group"
    >
      <span className="text-base">{getFileIcon(fileName)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{fileName || "File"}</div>
        {fileSize && <div className="opacity-70 text-[11px]">{formatFileSize(fileSize)}</div>}
      </div>
      <Download className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 flex-shrink-0" />
    </a>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }) {
  const isFile = msg.type === "FILE";
  const isSystem = msg.type === "SYSTEM";

  return (
    <div className={`flex items-end gap-2 mb-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && !isSystem && (
        <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-[10px] font-semibold text-primary-darker flex-shrink-0 mb-0.5">
          {(msg.senderName || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className={`max-w-[68%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isMe && !isSystem && (
          <span className="text-[11px] text-ink-3 px-1">{msg.senderName}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${
            isSystem
              ? "bg-background border border-border text-ink-3 italic text-center text-[12px] mx-auto rounded-lg px-3 py-2"
              : isMe
              ? "bg-primary text-white rounded-br-sm"
              : "bg-surface border border-border text-ink rounded-bl-sm shadow-sm"
          }`}
        >
          {msg.content && <p>{msg.content}</p>}
          {isFile && msg.attachment && (
            <FileAttachment attachment={msg.attachment} />
          )}
          {/* Legacy: fileUrl string */}
          {isFile && msg.fileUrl && !msg.attachment && (
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 underline text-[12px] mt-1"
            >
              <Paperclip className="w-3.5 h-3.5" />
              {msg.fileName || "Download file"}
            </a>
          )}
        </div>
        <span className="text-[10px] text-ink-4 px-1">{formatTime(msg.sentAt)}</span>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ hasRooms }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-14 h-14 rounded-2xl bg-primary-bg flex items-center justify-center mb-4">
        <MessageSquare className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display text-[16px] font-semibold text-ink mb-2">
        {hasRooms ? "Select a conversation" : "No conversations yet"}
      </h3>
      <p className="text-[13px] text-ink-3 max-w-[280px] leading-relaxed">
        {hasRooms
          ? "Choose a chat room from the left to start messaging."
          : "Chat rooms are created automatically when a bid is accepted and a contract is started."}
      </p>
    </div>
  );
}

// ── Main Messages page ────────────────────────────────────────────────────────

export default function Messages() {
  const { user } = useAppStore();
  const userId = user?.id;

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // File attachment state
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [wsStatus, setWsStatus] = useState("disconnected");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load rooms
  useEffect(() => {
    setRoomsLoading(true);
    getChatRooms()
      .then((data) => {
        setRooms(Array.isArray(data) ? data : []);
        setRoomsError("");
      })
      .catch((err) => setRoomsError(err.message))
      .finally(() => setRoomsLoading(false));
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (!userId) return;
    setWsStatus("connecting");
    connectWS(
      userId,
      () => setWsStatus("connected"),
      () => setWsStatus("disconnected")
    );
    return () => { disconnectWS(); };
  }, [userId]);

  // Subscribe to incoming messages
  useEffect(() => {
    const unsub = onWSEvent("message", (msg) => {
      setMessages((prev) => {
        if (activeRoom && msg.contractId === activeRoom.contractId) {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });
      setRooms((prev) =>
        prev.map((r) => {
          if (r.contractId !== msg.contractId) return r;
          const isActive = activeRoom?.contractId === msg.contractId;
          return {
            ...r,
            lastMessageAt: msg.sentAt,
            unreadCount: isActive ? 0 : (r.unreadCount || 0) + 1,
          };
        })
      );
    });
    return unsub;
  }, [activeRoom]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select a room
  const selectRoom = useCallback((room) => {
    setActiveRoom(room);
    setDraft("");
    setSendError("");
    setPendingFile(null);
    setMsgsLoading(true);
    getRecentMessages(room.contractId)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setMsgsLoading(false));
    markWSRead(room.contractId);
    setRooms((prev) =>
      prev.map((r) => r.contractId === room.contractId ? { ...r, unreadCount: 0 } : r)
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // 20 MB limit
    if (file.size > 20 * 1024 * 1024) {
      setSendError("File too large — max 20 MB.");
      return;
    }
    setPendingFile(file);
    e.target.value = "";
  }

  // Send message (text or file)
  async function handleSend(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text && !pendingFile) return;
    if (!activeRoom) return;
    setSendError("");

    if (!isWSConnected()) {
      setSendError("Not connected — please wait a moment and try again.");
      return;
    }

    setSending(true);

    try {
      if (pendingFile) {
        // Upload file first
        setUploadingFile(true);
        let fileData = null;
        try {
          fileData = await uploadMessageFile(pendingFile);
        } catch (uploadErr) {
          // If file service is unavailable, send as text with note
          console.warn("File upload failed, sending filename as text:", uploadErr);
          fileData = null;
        }
        setUploadingFile(false);

        if (fileData?.fileId || fileData?.id) {
          // Send a FILE type message via WS
          const fileId = fileData.fileId || fileData.id;
          sendWSMessage(activeRoom.contractId, text || "", {
            type: "FILE",
            fileId,
            fileName: pendingFile.name,
            fileSize: pendingFile.size,
          });
        } else {
          // Fallback: send filename as text message
          const fallbackText = text
            ? `${text}\n📎 ${pendingFile.name}`
            : `📎 Attached: ${pendingFile.name}`;
          sendWSMessage(activeRoom.contractId, fallbackText);
        }

        // Optimistic message
        const optimistic = {
          id: `opt_${Date.now()}`,
          contractId: activeRoom.contractId,
          senderId: userId,
          senderName: user?.name || "You",
          content: text || "",
          type: fileData ? "FILE" : "TEXT",
          attachment: fileData ? {
            fileId: fileData.fileId || fileData.id,
            fileName: pendingFile.name,
            fileSize: pendingFile.size,
          } : undefined,
          sentAt: new Date().toISOString(),
          direction: "ME",
        };
        setMessages((prev) => [...prev, optimistic]);
        setPendingFile(null);
        setDraft("");
      } else {
        // Text-only message
        sendWSMessage(activeRoom.contractId, text);
        const optimistic = {
          id: `opt_${Date.now()}`,
          contractId: activeRoom.contractId,
          senderId: userId,
          senderName: user?.name || "You",
          content: text,
          type: "TEXT",
          sentAt: new Date().toISOString(),
          direction: "ME",
        };
        setMessages((prev) => [...prev, optimistic]);
        setDraft("");
      }
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  }

  const chatPartner = activeRoom
    ? activeRoom.clientId === userId
      ? activeRoom.freelancerName
      : activeRoom.clientName
    : null;

  const isBusy = sending || uploadingFile;
  const canSend = (draft.trim() || pendingFile) && !isBusy && wsStatus === "connected";

  return (
    <DashboardLayout title="Messages">
      <div className="flex h-[calc(100vh-120px)] bg-surface border border-border rounded-[14px] overflow-hidden shadow-sm">

        {/* Sidebar */}
        <aside className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
          <div className="px-4 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-[14px] font-semibold text-ink">Conversations</h2>
            <div className="flex items-center gap-1.5">
              {wsStatus === "connected" && (
                <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                  <Wifi className="w-3 h-3" /> Live
                </span>
              )}
              {wsStatus === "connecting" && (
                <span className="flex items-center gap-1 text-[11px] text-warning font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> Connecting
                </span>
              )}
              {wsStatus === "disconnected" && (
                <span className="flex items-center gap-1 text-[11px] text-ink-4 font-medium">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="p-6 text-center text-ink-3 text-[13px] animate-pulse">Loading rooms…</div>
            ) : roomsError ? (
              <div className="p-4 text-[12px] text-danger text-center">{roomsError}</div>
            ) : rooms.length === 0 ? (
              <div className="p-6 text-center text-ink-3 text-[13px]">
                No conversations yet.
                <p className="text-[11px] text-ink-4 mt-1">
                  Chat rooms open when a contract starts.
                </p>
              </div>
            ) : (
              rooms.map((room) => (
                <RoomItem
                  key={room.contractId || room.id}
                  room={room}
                  active={activeRoom?.contractId === room.contractId}
                  onClick={() => selectRoom(room)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeRoom ? (
            <EmptyState hasRooms={rooms.length > 0} />
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-border bg-surface flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-light text-primary-darker flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                  {(chatPartner || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink">{chatPartner || "Chat"}</div>
                  <div className="text-[11px] text-ink-3">{activeRoom.jobTitle || "Project"}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 bg-background">
                {msgsLoading ? (
                  <div className="text-center text-ink-3 text-[13px] animate-pulse py-10">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-ink-3 text-[13px] py-10">
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === userId || msg.direction === "ME";
                    return (
                      <MessageBubble key={msg.id || i} msg={msg} isMe={isMe} />
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Compose bar */}
              <div className="px-4 py-3.5 border-t border-border bg-surface">
                {sendError && (
                  <p className="text-[12px] text-danger mb-2">{sendError}</p>
                )}

                {/* Pending file preview */}
                {pendingFile && (
                  <div className="mb-2">
                    <AttachmentPreview
                      file={pendingFile}
                      onRemove={() => setPendingFile(null)}
                    />
                  </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv"
                  />

                  {/* Attach file button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={wsStatus !== "connected"}
                    title="Attach file"
                    className="w-10 h-10 border-[1.5px] border-border rounded-xl flex items-center justify-center text-ink-3 hover:text-primary hover:border-primary hover:bg-primary-bg transition-all disabled:opacity-40 flex-shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      pendingFile
                        ? "Add a message (optional)…"
                        : wsStatus === "connected"
                        ? "Type a message… (Enter to send)"
                        : "Connecting to chat…"
                    }
                    disabled={wsStatus !== "connected"}
                    className="flex-1 border-[1.5px] border-border rounded-xl px-4 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={!canSend}
                    className="w-10 h-10 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all hover:shadow-md flex-shrink-0"
                    aria-label="Send"
                  >
                    {isBusy
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </form>

                {uploadingFile && (
                  <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading file…
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}