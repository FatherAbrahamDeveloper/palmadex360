import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationApi } from "@/services/api";
import { useRealtime, useRealtimeEvent } from "@/context/RealtimeContext";
import { cn, timeAgo } from "@/lib/utils";

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadNotifications, setUnreadNotifications } = useRealtime();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const res = await notificationApi.list({ limit: 15 });
      setItems(res.data);
      setUnreadNotifications(res.meta.unread);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useRealtimeEvent("notification:new", (n) => { if (open) setItems((cur) => [n, ...cur].slice(0, 15)); });

  useEffect(() => {
    const outside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function openItem(n) {
    if (!n.isRead) {
      notificationApi.read(n.id).catch(() => {});
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadNotifications((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function readAll() {
    await notificationApi.readAll();
    setItems((cur) => cur.map((x) => ({ ...x, isRead: true })));
    setUnreadNotifications(0);
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative rounded-lg text-muted-foreground" aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`} onClick={() => setOpen((o) => !o)}>
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadNotifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 ring-2 ring-background text-[10px] font-semibold text-white flex items-center justify-center">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-popover border rounded-2xl shadow-lift z-[100] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold text-sm">Notifications</p>
            {unreadNotifications > 0 && (
              <button type="button" onClick={readAll} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && !items.length ? (
              <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /></div>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              items.map((n) => (
                <button key={n.id} type="button" onClick={() => openItem(n)} className={cn("w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/60 flex gap-3", !n.isRead && "bg-primary/5")}>
                  <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", n.isRead ? "bg-transparent" : "bg-primary")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                    <span className="block text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
