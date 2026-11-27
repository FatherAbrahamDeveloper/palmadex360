import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import api, { communicationApi, notificationApi } from "@/services/api";
import { useAuth } from "./AuthContext";
import { canAccess } from "@/lib/roleConfig";

// One Socket.IO connection per signed-in tab. It tries WebSockets and falls back to
// long-polling automatically, for hosts or networks that block WebSockets.
const RealtimeContext = createContext(null);

const socketOrigin = () => {
  const base = api.defaults.baseURL || window.location.origin;
  return new URL(base, window.location.origin).origin;
};

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const listeners = useRef(new Map());

  const refreshCounts = useCallback(async () => {
    if (!user || user.faceEnrollmentRequired) return;
    try {
      const [n, m] = await Promise.all([
        notificationApi.list({ limit: 1 }),
        canAccess(user, "communication") ? communicationApi.unread() : Promise.resolve(0),
      ]);
      setUnreadNotifications(n.meta.unread);
      setUnreadMessages(m);
    } catch {
      /* counts are best-effort */
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.faceEnrollmentRequired) return undefined;
    const token = localStorage.getItem("token");
    const socket = io(socketOrigin(), { path: "/socket.io", auth: { token }, transports: ["websocket", "polling"], reconnectionDelayMax: 10000 });
    socketRef.current = socket;

    socket.on("connect", () => { setConnected(true); refreshCounts(); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      // WebSocket blocked by the host: retry with polling only.
      if (socket.io.opts.transports[0] === "websocket") socket.io.opts.transports = ["polling"];
      setConnected(false);
    });

    socket.on("notification:new", (n) => {
      setUnreadNotifications((c) => c + 1);
      toast(n.title, { description: n.message, action: n.link ? { label: "Open", onClick: () => { window.location.href = n.link; } } : undefined });
    });
    socket.on("message:new", (m) => {
      if (!m.mine && m.sender && m.sender.id !== user.id) setUnreadMessages((c) => c + 1);
    });
    socket.on("conversation:read", ({ userId }) => { if (userId === user.id) refreshCounts(); });
    socket.on("presence", ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId); else next.delete(userId);
        return next;
      });
    });

    // Fan out every event to page-level subscribers.
    socket.onAny((event, payload) => {
      (listeners.current.get(event) || []).forEach((fn) => fn(payload));
    });

    refreshCounts();
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, user?.faceEnrollmentRequired, refreshCounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const subscribe = useCallback((event, fn) => {
    const list = listeners.current.get(event) || [];
    listeners.current.set(event, [...list, fn]);
    return () => listeners.current.set(event, (listeners.current.get(event) || []).filter((f) => f !== fn));
  }, []);

  const emit = useCallback((event, payload, ack) => socketRef.current?.emit(event, payload, ack), []);

  return (
    <RealtimeContext.Provider
      value={{ connected, subscribe, emit, unreadMessages, unreadNotifications, setUnreadNotifications, refreshCounts, onlineIds }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext) || {
  connected: false, subscribe: () => () => {}, emit: () => {}, unreadMessages: 0, unreadNotifications: 0,
  setUnreadNotifications: () => {}, refreshCounts: () => {}, onlineIds: new Set(),
};

// Subscribe to a realtime event for the lifetime of a component.
export function useRealtimeEvent(event, handler) {
  const { subscribe } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe(event, (p) => ref.current(p)), [event, subscribe]);
}
