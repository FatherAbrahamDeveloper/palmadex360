import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Plus,
  Loader2,
} from "lucide-react";

import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const CRM_API_URL = `${API_URL.replace(/\/$/, "")}/crm`;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

const statusLabels = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  FOLLOW_UP: "Follow Up",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  CLOSED: "Closed",
};

const statusColors = {
  NEW: "bg-muted text-muted-foreground",
  CONTACTED: "bg-blue-500/10 text-blue-600",
  QUALIFIED: "bg-primary/10 text-primary",
  FOLLOW_UP: "bg-chart-4/10 text-chart-4",
  NEGOTIATION: "bg-chart-5/10 text-chart-5",
  WON: "bg-green-500/10 text-green-600",
  LOST: "bg-red-500/10 text-red-600",
  CLOSED: "bg-gray-500/10 text-gray-600",
};

export default function CRMContactDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [message, setMessage] = useState("");

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("GENERAL");

  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

 
  const loadContact = async () => {
    if (!id) {
      setError("Contact ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${CRM_API_URL}/contacts/${id}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load contact"
        );
      }

      setContact(data);
    } catch (err) {
      console.error("CRM contact load error:", err);

      setError(
        err.message || "Failed to load contact"
      );

      setContact(null);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load messages
   */
  const loadMessages = async () => {
    if (!id) return;

    try {
      const response = await fetch(
        `${CRM_API_URL}/contacts/${id}/messages`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load messages"
        );
      }

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("CRM messages error:", err);

      /*
       * Don't replace the contact page with an error
       * just because messages failed.
       */
      setConversations([]);
    }
  };

  /*
   * Load contact and messages when ID changes.
   */
  useEffect(() => {
    loadContact();
    loadMessages();
  }, [id]);

  /*
   * Delete contact
   */
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this contact?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${CRM_API_URL}/contacts/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete contact"
        );
      }

      navigate("/crm");
    } catch (err) {
      console.error("CRM contact delete error:", err);

      setError(
        err.message || "Failed to delete contact"
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * Send message
   */
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${CRM_API_URL}/contacts/${id}/messages`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: trimmedMessage,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send message"
        );
      }

      setMessage("");

      await loadMessages();
    } catch (err) {
      console.error("CRM send message error:", err);

      setError(
        err.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * Reset note form
   */
  const resetNoteForm = () => {
    setNoteContent("");
    setNoteType("GENERAL");
    setEditingNoteId(null);
    setShowNoteForm(false);
  };

  /*
   * Save or update note
   */
  const handleSaveNote = async (event) => {
    event.preventDefault();

    const trimmedContent = noteContent.trim();

    if (!trimmedContent) {
      setError("Note content is required");
      return;
    }

    try {
      setSavingNote(true);
      setError("");

      const isEditing = Boolean(editingNoteId);

      const url = isEditing
        ? `${CRM_API_URL}/notes/${editingNoteId}`
        : `${CRM_API_URL}/contacts/${id}/notes`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: noteType,
          content: trimmedContent,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Failed to update note"
              : "Failed to create note")
        );
      }

      setContact((current) => {
        if (!current) return current;

        const notes = Array.isArray(current.notes)
          ? current.notes
          : [];

        if (isEditing) {
          return {
            ...current,
            notes: notes.map((note) =>
              note.id === editingNoteId
                ? data
                : note
            ),
          };
        }

        return {
          ...current,
          notes: [data, ...notes],
        };
      });

      resetNoteForm();
    } catch (err) {
      console.error("CRM note save error:", err);

      setError(
        err.message || "Failed to save note"
      );
    } finally {
      setSavingNote(false);
    }
  };

  /*
   * Start editing a note
   */
  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content || "");
    setNoteType(note.type || "GENERAL");
    setError("");
    setShowNoteForm(true);
  };

  /*
   * Delete note
   */
  const handleDeleteNote = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    try {
      setDeletingNoteId(noteId);
      setError("");

      const response = await fetch(
        `${CRM_API_URL}/notes/${noteId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      setContact((current) => {
        if (!current) return current;

        return {
          ...current,
          notes: (current.notes || []).filter(
            (note) => note.id !== noteId
          ),
        };
      });

      if (editingNoteId === noteId) {
        resetNoteForm();
      }
    } catch (err) {
      console.error(
        "CRM delete note error:",
        err
      );

      setError(
        err.message || "Failed to delete note"
      );
    } finally {
      setDeletingNoteId(null);
    }
  };

  /*
   * Loading state
   */
  if (loading) {
    return (
      <ModulePageShell
        title="CRM"
        description="Loading contact..."
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </ModulePageShell>
    );
  }

  /*
   * Contact not found
   */
  if (!contact) {
    return (
      <ModulePageShell
        title="CRM"
        description="Contact not found"
      >
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button onClick={() => navigate("/crm")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CRM
        </Button>
      </ModulePageShell>
    );
  }

  const contactName =
    contact.displayName ||
    [contact.firstName, contact.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed Contact";

  const allMessages = conversations.flatMap(
    (conversation) =>
      Array.isArray(conversation.messages)
        ? conversation.messages
        : []
  );

  const notes = Array.isArray(contact.notes)
    ? contact.notes
    : [];

  return (
    <ModulePageShell
      title={contactName}
      description={
        contact.companyName || "CRM Contact"
      }
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/crm/${id}/edit`)
            }
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1" />
            )}

            Delete
          </Button>
        </div>
      }
    >
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate("/crm")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Contacts
      </Button>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* =========================
            LEFT COLUMN
        ========================== */}
        <div className="space-y-6">

          {/* Contact Information */}
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-4">
              Contact Information
            </h3>

            <div className="space-y-4 text-sm">

              <div>
                <div className="text-muted-foreground">
                  Name
                </div>

                <div className="font-medium">
                  {contactName}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Company
                </div>

                <div>
                  {contact.companyName || "—"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Email
                </div>

                <div>
                  {contact.email || "—"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Phone
                </div>

                <div>
                  {contact.phone || "—"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Source
                </div>

                <div>
                  {contact.source || "—"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">
                  Status
                </div>

                <Badge
                  className={
                    statusColors[contact.status] ||
                    "bg-muted text-muted-foreground"
                  }
                >
                  {statusLabels[contact.status] ||
                    contact.status}
                </Badge>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Next Follow Up
                </div>

                <div>
                  {contact.nextFollowUpAt
                    ? new Date(
                        contact.nextFollowUpAt
                      ).toLocaleString()
                    : "Not scheduled"}
                </div>
              </div>

            </div>
          </div>

          {/* Notes */}
          <div className="bg-card border rounded-xl p-5">

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">
                  Notes
                </h3>

                <p className="text-sm text-muted-foreground">
                  Internal notes about this contact.
                </p>
              </div>

              {!showNoteForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError("");
                    setEditingNoteId(null);
                    setNoteContent("");
                    setNoteType("GENERAL");
                    setShowNoteForm(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Note Form */}
            {showNoteForm && (
              <form
                onSubmit={handleSaveNote}
                className="mb-5 rounded-lg border bg-muted/20 p-4"
              >
                <div className="mb-4">
                  <h4 className="font-medium">
                    {editingNoteId
                      ? "Edit Note"
                      : "Add Note"}
                  </h4>

                  <p className="text-sm text-muted-foreground">
                    {editingNoteId
                      ? "Update this note."
                      : "Add an internal note about this contact."}
                  </p>
                </div>

                <div className="space-y-4">

                  <div>
                    <label className="text-sm font-medium">
                      Note Type
                    </label>

                    <select
                      className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={noteType}
                      onChange={(event) =>
                        setNoteType(
                          event.target.value
                        )
                      }
                      disabled={savingNote}
                    >
                      <option value="GENERAL">
                        General
                      </option>

                      <option value="FOLLOW_UP">
                        Follow Up
                      </option>

                      <option value="CALL">
                        Call
                      </option>

                      <option value="MEETING">
                        Meeting
                      </option>

                      <option value="IMPORTANT">
                        Important
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Note
                    </label>

                    <textarea
                      className="mt-1 min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      value={noteContent}
                      onChange={(event) =>
                        setNoteContent(
                          event.target.value
                        )
                      }
                      placeholder="Write a note about this contact..."
                      disabled={savingNote}
                    />
                  </div>

                  <div className="flex justify-end gap-2">

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetNoteForm}
                      disabled={savingNote}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        savingNote ||
                        !noteContent.trim()
                      }
                    >
                      {savingNote && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}

                      {savingNote
                        ? "Saving..."
                        : editingNoteId
                        ? "Update Note"
                        : "Save Note"}
                    </Button>

                  </div>
                </div>
              </form>
            )}

            {/* Notes List */}
            {notes.length > 0 ? (
              <div className="space-y-3">

                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="border rounded-lg p-3"
                  >

                    <div className="flex items-center justify-between gap-3 mb-2">

                      <Badge variant="secondary">
                        {note.type || "General"}
                      </Badge>

                      <div className="flex items-center gap-1">

                        <div className="text-xs text-muted-foreground mr-2">
                          {note.createdAt
                            ? new Date(
                                note.createdAt
                              ).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleEditNote(
                              note
                            )
                          }
                          disabled={
                            savingNote ||
                            deletingNoteId ===
                              note.id
                          }
                          title="Edit note"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDeleteNote(
                              note.id
                            )
                          }
                          disabled={
                            savingNote ||
                            deletingNoteId ===
                              note.id
                          }
                          title="Delete note"
                        >
                          {deletingNoteId ===
                          note.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>

                      </div>
                    </div>

                    <div className="text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      {note.author
                        ? `${note.author.firstName || ""} ${
                            note.author.lastName || ""
                          }`.trim() ||
                          "System"
                        : "System"}
                    </div>

                  </div>
                ))}

              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No notes yet.
              </p>
            )}
          </div>
        </div>

        {/* =========================
            RIGHT COLUMN - MESSAGES
        ========================== */}
        <div className="lg:col-span-2">

          <div className="bg-card border rounded-xl overflow-hidden">

            <div className="border-b px-5 py-4">
              <h3 className="font-semibold">
                Messages
              </h3>

              <p className="text-sm text-muted-foreground">
                Conversation with {contactName}
              </p>
            </div>

            <div className="h-[500px] overflow-y-auto p-5 space-y-4">

              {allMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No messages yet.
                </div>
              ) : (
                allMessages.map((msg) => {
                  const outgoing =
                    msg.direction === "OUTBOUND";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        outgoing
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-3 ${
                          outgoing
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >

                        <div className="text-sm">
                          {msg.content}
                        </div>

                        <div
                          className={`text-xs mt-1 ${
                            outgoing
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.createdAt
                            ? new Date(
                                msg.createdAt
                              ).toLocaleString()
                            : ""}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}

            </div>

            {/* Send Message */}
            <div className="border-t p-4">

              <div className="flex gap-2">

                <Input
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sending}
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={
                    sending ||
                    !message.trim()
                  }
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>

              </div>
            </div>

          </div>
        </div>

      </div>
    </ModulePageShell>
  );
}
