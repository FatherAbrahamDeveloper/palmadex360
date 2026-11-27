import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare, Send, Paperclip, Plus, Search, Loader2, ArrowLeft, Users, Pencil, Trash2, X, FileText,
  Building2, Check, CheckCheck, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import api, { communicationApi, fileApi, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRealtime, useRealtimeEvent } from "@/context/RealtimeContext";
import { roleLabel, canAccess } from "@/lib/roleConfig";
import { cn, timeAgo, formatBytes, apiFileUrl } from "@/lib/utils";

const initials = (name = "?") => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400_000);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
};
const timeOf = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

function Avatar({ name, online, group }) {
  return (
    <span className="relative w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
      {group ? <Users className="h-4 w-4" /> : initials(name)}
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" aria-label="Online" />}
    </span>
  );
}

function NewConversationDialog({ open, onOpenChange, onCreated }) {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const [mode, setMode] = useState(isCustomer ? "COMPANY" : "DIRECT");
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]); setTitle(""); setMessage(""); setQ(""); setMode(isCustomer ? "COMPANY" : "DIRECT");
  }, [open, isCustomer]);
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => communicationApi.directory(q).then(setPeople).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [open, q]);

  const toggle = (id) => setSelected((s) => (mode === "DIRECT" ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await communicationApi.create({ type: mode, userIds: mode === "COMPANY" ? [] : selected, title: mode === "GROUP" ? title : undefined, message });
      onOpenChange(false);
      onCreated(c);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const modes = isCustomer
    ? [["COMPANY", "Palmadex team", "Your enquiry goes to the Palmadex support desk"], ["DIRECT", "A specific person", "Message someone you already work with"]]
    : [["DIRECT", "One person", "A private conversation"], ["GROUP", "Group", "Several colleagues or customers"]];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Messages are delivered instantly to people who are online, and by email to people who are not.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {modes.map(([id, label, hint]) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => { setMode(id); setSelected([]); }}
                className={cn("rounded-lg border p-3 text-left", mode === id ? "border-primary bg-primary/5" : "hover:bg-muted")}>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>

          {mode !== "COMPANY" && (
            <div className="space-y-2">
              {mode === "GROUP" && (
                <div className="space-y-1.5"><Label htmlFor="g-title">Group name</Label><Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rotterdam sesame shipment" /></div>
              )}
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find people" aria-label="Find people" />
              <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
                {people.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">No one found.</p> : people.map((p) => (
                  <button key={p.id} type="button" onClick={() => toggle(p.id)} className={cn("w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/60", selected.includes(p.id) && "bg-primary/5")}>
                    <Avatar name={p.name} online={p.online} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{p.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{p.organization || roleLabel(p.role)}</span>
                    </span>
                    {selected.includes(p.id) && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="first-msg">Message</Label>
            <Textarea id="first-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={mode === "COMPANY" ? "How can we help?" : "Write your first message"} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || (mode !== "COMPANY" && !selected.length) || (mode === "COMPANY" && !message.trim())}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Starting" /> : "Start conversation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPeopleDialog({ conversation, open, onOpenChange, onDone }) {
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    const existing = new Set(conversation.members.map((m) => m.id));
    communicationApi.directory("").then((all) => setPeople(all.filter((p) => !existing.has(p.id)))).catch(() => {});
  }, [open, conversation]);
  async function add() {
    try { onDone(await communicationApi.addMembers(conversation.id, selected)); onOpenChange(false); } catch (err) { toast.error(getErrorMessage(err)); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add people</DialogTitle></DialogHeader>
        <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
          {people.map((p) => (
            <button key={p.id} type="button" onClick={() => setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} className={cn("w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/60", selected.includes(p.id) && "bg-primary/5")}>
              <Avatar name={p.name} online={p.online} />
              <span className="flex-1 text-sm">{p.name} <span className="text-xs text-muted-foreground">· {p.organization || roleLabel(p.role)}</span></span>
              {selected.includes(p.id) && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
          {!people.length && <p className="p-4 text-sm text-muted-foreground text-center">Everyone is already here.</p>}
        </div>
        <DialogFooter><Button onClick={add} disabled={!selected.length}>Add {selected.length || ""}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Attachment({ file, mine }) {
  const href = apiFileUrl(file.url, api.defaults.baseURL);
  if (file.mimeType?.startsWith("image/")) {
    return <a href={href} target="_blank" rel="noreferrer"><img src={href} alt={file.originalName} className="max-h-56 rounded-lg border mt-1" /></a>;
  }
  return (
    <a href={`${href}&download=1`} className={cn("mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs", mine ? "border-white/30 bg-white/10" : "bg-background")}>
      <FileText className="h-4 w-4 shrink-0" /><span className="truncate">{file.originalName}</span><span className="opacity-70 shrink-0">{formatBytes(file.size)}</span>
    </a>
  );
}

function ChatPane({ conversation, onBack, onConversationChange }) {
  const { user } = useAuth();
  const { emit, onlineIds, refreshCounts } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null);
  const [typing, setTyping] = useState({});
  const [members, setMembers] = useState(conversation.members);
  const [addOpen, setAddOpen] = useState(false);
  const bottomRef = useRef(null);
  const fileInput = useRef(null);
  const typingTimer = useRef(null);
  const id = conversation.id;

  const markRead = useCallback(() => { communicationApi.read(id).then(refreshCounts).catch(() => {}); }, [id, refreshCounts]);

  useEffect(() => {
    setLoading(true); setMessages([]); setTyping({}); setMembers(conversation.members); setEditing(null);
    emit("conversation:join", id);
    communicationApi.messages(id, { limit: 40 }).then((res) => {
      setMessages(res.data); setHasMore(res.meta.hasMore);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
    }).catch((err) => toast.error(getErrorMessage(err))).finally(() => setLoading(false));
    markRead();
    return () => emit("conversation:leave", id);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useRealtimeEvent("message:new", (m) => {
    if (m.conversationId !== id) return;
    setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    setTyping((t) => { const n = { ...t }; if (m.sender) delete n[m.sender.id]; return n; });
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    if (m.sender?.id !== user.id && document.visibilityState === "visible") markRead();
  });
  useRealtimeEvent("message:updated", (m) => {
    if (m.conversationId !== id) return;
    setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...m, mine: x.mine } : x)));
  });
  useRealtimeEvent("typing", (t) => {
    if (t.conversationId !== id || t.userId === user.id) return;
    setTyping((cur) => { const n = { ...cur }; if (t.typing) n[t.userId] = t.name; else delete n[t.userId]; return n; });
  });
  useRealtimeEvent("conversation:read", (r) => {
    if (r.conversationId !== id) return;
    setMembers((cur) => cur.map((m) => (m.id === r.userId ? { ...m, lastReadAt: r.at } : m)));
  });

  async function loadOlder() {
    const res = await communicationApi.messages(id, { before: messages[0]?.createdAt, limit: 40 });
    setMessages((cur) => [...res.data, ...cur]);
    setHasMore(res.meta.hasMore);
  }

  function onType(v) {
    setText(v);
    emit("typing", { conversationId: id, typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emit("typing", { conversationId: id, typing: false }), 2500);
  }

  async function send(e) {
    e?.preventDefault();
    if (sending || (!text.trim() && !files.length)) return;
    setSending(true);
    try {
      if (editing) {
        const m = await communicationApi.edit(editing.id, text);
        setMessages((cur) => cur.map((x) => (x.id === m.id ? m : x)));
        setEditing(null);
      } else {
        const uploaded = files.length ? await fileApi.upload(files, { purpose: "attachment" }) : [];
        const m = await communicationApi.send(id, { content: text, fileIds: uploaded.map((f) => f.id) });
        setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        setFiles([]);
      }
      setText("");
      emit("typing", { conversationId: id, typing: false });
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) { toast.error(getErrorMessage(err, "Message not sent")); } finally { setSending(false); }
  }

  async function remove(m) {
    if (!window.confirm("Delete this message for everyone?")) return;
    try { await communicationApi.remove(m.id); setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, isDeleted: true, content: null, attachments: [] } : x))); } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function leave() {
    if (!window.confirm("Leave this conversation?")) return;
    try { await communicationApi.leave(id); onConversationChange(null); } catch (err) { toast.error(getErrorMessage(err)); }
  }

  const others = members.filter((m) => m.id !== user.id);
  const direct = conversation.type === "DIRECT";
  const otherOnline = direct && others[0] && (onlineIds.has(others[0].id) || others[0].online);
  // Read receipt only under your own latest message, when it is the last one in the thread.
  const lastMessage = [...messages].reverse().find((m) => m.type !== "SYSTEM");
  const lastMine = lastMessage?.mine && !lastMessage.isDeleted ? lastMessage : null;
  const seenBy = lastMine ? others.filter((o) => o.lastReadAt && new Date(o.lastReadAt) >= new Date(lastMine.createdAt)) : [];
  const typingNames = Object.values(typing);

  let lastDay = "";
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to conversations"><ArrowLeft className="h-4 w-4" /></Button>
        <Avatar name={conversation.title} group={!direct} online={otherOnline} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{conversation.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {direct ? (otherOnline ? "Online" : others[0] ? `${others[0].organization || roleLabel(others[0].role)}` : "") : `${members.length} people: ${members.map((m) => m.name.split(" ")[0]).join(", ")}`}
          </p>
        </div>
        {!direct && user.role !== "CUSTOMER" && canAccess(user, "communication", "EDIT") && (
          <Button variant="ghost" size="icon" onClick={() => setAddOpen(true)} aria-label="Add people"><UserPlus className="h-4 w-4" /></Button>
        )}
        {!direct && <Button variant="ghost" size="sm" onClick={leave}>Leave</Button>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-muted/20">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading messages" /></div>
        ) : (
          <>
            {hasMore && <div className="text-center pb-2"><Button variant="ghost" size="sm" onClick={loadOlder}>Load earlier messages</Button></div>}
            {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No messages yet. Say hello.</p>}
            {messages.map((m) => {
              const day = dayLabel(m.createdAt);
              const divider = day !== lastDay;
              lastDay = day;
              if (m.type === "SYSTEM") {
                return (
                  <React.Fragment key={m.id}>
                    {divider && <p className="text-center text-[11px] text-muted-foreground py-2">{day}</p>}
                    <p className="text-center text-xs text-muted-foreground py-1">{m.content}</p>
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={m.id}>
                  {divider && <p className="text-center text-[11px] text-muted-foreground py-2">{day}</p>}
                  <div className={cn("group flex gap-2", m.mine ? "justify-end" : "justify-start")}>
                    {!m.mine && <Avatar name={m.sender?.name} />}
                    <div className={cn("max-w-[78%] rounded-2xl px-3 py-2 text-sm", m.mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm")}>
                      {!m.mine && !direct && <p className="text-[11px] font-semibold mb-0.5 opacity-80">{m.sender?.name}</p>}
                      {m.isDeleted ? <p className="italic opacity-70">Message deleted</p> : (
                        <>
                          {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                          {m.attachments.map((f) => <Attachment key={f.id} file={f} mine={m.mine} />)}
                        </>
                      )}
                      <p className={cn("text-[10px] mt-1 text-right", m.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {timeOf(m.createdAt)}{m.isEdited && !m.isDeleted ? " · edited" : ""}
                      </p>
                    </div>
                    {m.mine && !m.isDeleted && (
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                        {m.content && <button type="button" onClick={() => { setEditing(m); setText(m.content); }} aria-label="Edit message" className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                        <button type="button" onClick={() => remove(m)} aria-label="Delete message" className="p-1 rounded hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            {lastMine && seenBy.length > 0 && (
              <p className="flex justify-end items-center gap-1 text-[11px] text-muted-foreground pr-1"><CheckCheck className="h-3.5 w-3.5 text-primary" /> Seen{direct ? "" : ` by ${seenBy.map((s) => s.name.split(" ")[0]).join(", ")}`}</p>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-4 text-xs text-muted-foreground" aria-live="polite">
        {typingNames.length > 0 && `${typingNames.join(", ")} ${typingNames.length > 1 ? "are" : "is"} typing...`}
      </div>

      <form onSubmit={send} className="border-t p-3 space-y-2">
        {editing && (
          <div className="flex items-center justify-between rounded bg-muted px-3 py-1.5 text-xs">
            <span>Editing message</span>
            <button type="button" onClick={() => { setEditing(null); setText(""); }} aria-label="Cancel editing"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full border bg-muted px-2 py-1 text-xs">
                <FileText className="h-3 w-3" /> {f.name}
                <button type="button" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => { setFiles((cur) => [...cur, ...Array.from(e.target.files || [])].slice(0, 10)); e.target.value = ""; }} />
          {!editing && <Button type="button" variant="ghost" size="icon" onClick={() => fileInput.current?.click()} aria-label="Attach files"><Paperclip className="w-4 h-4" /></Button>}
          <Textarea
            rows={1} value={text} onChange={(e) => onType(e.target.value)} placeholder="Type a message"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="min-h-[40px] max-h-40 resize-none flex-1" aria-label="Message"
          />
          <Button type="submit" size="icon" disabled={sending || (!text.trim() && !files.length)} aria-label="Send">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Enter to send, Shift + Enter for a new line.</p>
      </form>

      {addOpen && <AddPeopleDialog conversation={{ ...conversation, members }} open={addOpen} onOpenChange={setAddOpen} onDone={(c) => { setMembers(c.members); onConversationChange(c); }} />}
    </div>
  );
}

export default function Communication() {
  const { user } = useAuth();
  const { onlineIds } = useRealtime();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const activeId = params.get("c");

  const load = useCallback(() => communicationApi.conversations().then(setList).catch((err) => { toast.error(getErrorMessage(err)); setList([]); }), []);
  useEffect(() => { load(); }, [load]);
  useRealtimeEvent("message:new", (m) => {
    setList((cur) => {
      if (!cur) return cur;
      const idx = cur.findIndex((c) => c.id === m.conversationId);
      if (idx < 0) { load(); return cur; }
      const c = cur[idx];
      const updated = {
        ...c,
        updatedAt: m.createdAt,
        unread: m.conversationId === activeId || m.mine ? c.unread : c.unread + 1,
        lastMessage: { content: m.content || (m.attachments?.length ? "Attachment" : ""), senderName: m.sender?.name, mine: m.mine, createdAt: m.createdAt },
      };
      return [updated, ...cur.filter((_, i) => i !== idx)];
    });
  });
  useRealtimeEvent("conversation:new", () => load());
  useRealtimeEvent("conversation:read", (r) => { if (r.userId === user.id) setList((cur) => cur?.map((c) => (c.id === r.conversationId ? { ...c, unread: 0 } : c))); });

  const open = (id) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set("c", id); else n.delete("c"); return n; });
  const active = list?.find((c) => c.id === activeId);

  const filtered = useMemo(() => {
    if (!list) return [];
    const needle = q.trim().toLowerCase();
    return needle ? list.filter((c) => c.title.toLowerCase().includes(needle) || c.members.some((m) => m.name.toLowerCase().includes(needle))) : list;
  }, [list, q]);

  const isCustomer = user?.role === "CUSTOMER";
  const canWrite = canAccess(user, "communication", "EDIT");

  return (
    <ModulePageShell
      title="Communication Centre"
      description={isCustomer ? "Talk to the Palmadex team in real time" : "Real-time messages with colleagues and customers"}
      icon={MessageSquare}
      actions={canWrite && <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New message</Button>}
    >
      <div className="surface overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-13rem)] min-h-[480px]">
        <aside className={cn("border-r flex flex-col min-h-0", activeId && "hidden md:flex")}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter conversations" className="pl-9" aria-label="Filter conversations" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!list ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground space-y-3">
                <MessageSquare className="mx-auto h-7 w-7" />
                <p>{list.length ? "No conversations match." : isCustomer ? "Have a question about an order? Message the Palmadex team." : "No conversations yet."}</p>
                {canWrite && !list.length && <Button size="sm" onClick={() => setNewOpen(true)}>{isCustomer ? <><Building2 className="h-4 w-4 mr-1" /> Contact Palmadex</> : "Start a conversation"}</Button>}
              </div>
            ) : filtered.map((c) => {
              const other = c.type === "DIRECT" ? c.members.find((m) => m.id !== user.id) : null;
              return (
                <button key={c.id} type="button" onClick={() => open(c.id)} className={cn("w-full text-left px-4 py-3 flex items-start gap-3 border-b hover:bg-muted/40", c.id === activeId && "bg-muted/60")}>
                  <Avatar name={c.title} group={c.type !== "DIRECT"} online={other && (onlineIds.has(other.id) || other.online)} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", c.unread ? "font-semibold" : "font-medium")}>{c.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ""}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-xs truncate", c.unread ? "text-foreground" : "text-muted-foreground")}>
                        {c.lastMessage ? `${c.lastMessage.mine ? "You: " : c.type !== "DIRECT" && c.lastMessage.senderName ? `${c.lastMessage.senderName.split(" ")[0]}: ` : ""}${c.lastMessage.content}` : "No messages yet"}
                      </span>
                      {c.unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-[11px] font-semibold text-primary-foreground flex items-center justify-center shrink-0">{c.unread}</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
        <section className={cn("min-h-0", !activeId && "hidden md:block")}>
          {active ? (
            <ChatPane key={active.id} conversation={active} onBack={() => open(null)} onConversationChange={(c) => { if (!c) open(null); load(); }} />
          ) : activeId && list ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">This conversation is not available.</div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3" />
              <p className="text-sm">Choose a conversation, or start a new one.</p>
            </div>
          )}
        </section>
      </div>
      <NewConversationDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(c) => { load(); open(c.id); }} />
    </ModulePageShell>
  );
}
