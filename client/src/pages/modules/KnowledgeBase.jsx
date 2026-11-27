import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen, Search, Plus, Loader2, ArrowLeft, Pencil, ThumbsUp, ThumbsDown, Eye, FolderPlus, Trash2, HeadphonesIcon,
} from "lucide-react";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { knowledgeApi, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { renderMarkdown } from "@/lib/markdown";
import { cn, formatDate, prettyEnum } from "@/lib/utils";

const TYPES = ["ARTICLE", "FAQ", "GUIDE", "TUTORIAL"];
const TYPE_LABEL = { ARTICLE: "Article", FAQ: "FAQ", GUIDE: "Guide", TUTORIAL: "Tutorial" };
const STATUS_STYLE = { DRAFT: "bg-amber-100 text-amber-800", PUBLISHED: "bg-emerald-100 text-emerald-800", ARCHIVED: "bg-slate-200 text-slate-700" };

function ArticleEditor({ open, onOpenChange, article, categories, onSaved }) {
  const empty = { title: "", categoryId: "", type: "ARTICLE", status: "DRAFT", audience: "ALL", summary: "", tags: "", body: "" };
  const [form, setForm] = useState(empty);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setPreview(false);
    setForm(article ? {
      title: article.title, categoryId: article.category?.id || "", type: article.type, status: article.status,
      audience: article.audience, summary: article.summary || "", tags: (article.tags || []).join(", "), body: article.body || "",
    } : empty);
  }, [open, article]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === "string" ? v : v.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...form, categoryId: form.categoryId || null };
      const saved = article ? await knowledgeApi.update(article.id, body) : await knowledgeApi.create(body);
      toast.success(saved.status === "PUBLISHED" ? "Article published" : "Article saved");
      onOpenChange(false);
      onSaved(saved);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[94vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{article ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="a-title">Title</Label><Input id="a-title" value={form.title} onChange={set("title")} required /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={set("type")}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId || "none"} onValueChange={(v) => set("categoryId")(v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Uncategorised</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>Who can read it</Label>
              <Select value={form.audience} onValueChange={set("audience")}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">Everyone, including customers</SelectItem><SelectItem value="INTERNAL">Palmadex staff only</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set("status")}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem><SelectItem value="ARCHIVED">Archived</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="a-sum">Summary</Label><Textarea id="a-sum" rows={2} value={form.summary} onChange={set("summary")} placeholder="One or two sentences shown in search results" /></div>
          <div className="space-y-1.5"><Label htmlFor="a-tags">Tags</Label><Input id="a-tags" value={form.tags} onChange={set("tags")} placeholder="Comma separated, e.g. shipping, documents, NAFDAC" /></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="a-body">Content</Label>
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => setPreview((p) => !p)}>{preview ? "Edit" : "Preview"}</button>
            </div>
            {preview ? (
              <div className="min-h-[260px] rounded-lg border p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body) }} />
            ) : (
              <Textarea id="a-body" rows={14} value={form.body} onChange={set("body")} required className="font-mono text-sm" placeholder={"# Heading\n\nWrite in plain text. Use **bold**, *italic*, lists with - or 1., links like [text](https://...) and ``` for code."} />
            )}
          </div>
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "Save article"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({ open, onOpenChange, categories, onChanged }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  async function add(e) {
    e.preventDefault();
    try { await knowledgeApi.createCategory({ name, description }); setName(""); setDescription(""); onChanged(); toast.success("Category added"); } catch (err) { toast.error(getErrorMessage(err)); }
  }
  async function remove(c) {
    if (!window.confirm(`Delete the category "${c.name}"? Its articles stay, without a category.`)) return;
    try { await knowledgeApi.removeCategory(c.id); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Categories</DialogTitle></DialogHeader>
        <ul className="divide-y rounded-lg border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{c.name} <span className="text-xs text-muted-foreground">({c.articleCount})</span></span>
              <button type="button" onClick={() => remove(c)} aria-label={`Delete ${c.name}`} className="p-1 rounded hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </li>
          ))}
          {!categories.length && <li className="px-3 py-4 text-sm text-muted-foreground text-center">No categories yet.</li>}
        </ul>
        <form onSubmit={add} className="space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" required minLength={2} aria-label="New category name" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" aria-label="Description" />
          <Button type="submit" size="sm"><FolderPlus className="h-4 w-4 mr-1" /> Add category</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArticleView({ slug, categories, onEdit }) {
  const navigate = useNavigate();
  const [a, setA] = useState(null);
  const [voted, setVoted] = useState(false);
  useEffect(() => {
    setA(null); setVoted(false);
    knowledgeApi.get(slug).then(setA).catch((err) => { toast.error(getErrorMessage(err)); navigate("/knowledge"); });
  }, [slug, navigate]);

  async function vote(helpful) {
    try { const r = await knowledgeApi.feedback(a.id, helpful); setA((x) => ({ ...x, ...r })); setVoted(true); } catch (err) { toast.error(getErrorMessage(err)); }
  }

  if (!a) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <article className="lg:col-span-3 surface p-6 md:p-8">
        <Button variant="ghost" size="sm" className="-ml-2 mb-3" asChild><Link to="/knowledge"><ArrowLeft className="h-4 w-4 mr-1" /> Knowledge Base</Link></Button>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">{TYPE_LABEL[a.type]}</span>
          {a.category && <span>{a.category.name}</span>}
          {a.status !== "PUBLISHED" && <span className={cn("rounded-full px-2 py-0.5", STATUS_STYLE[a.status])}>{prettyEnum(a.status)}</span>}
          {a.audience === "INTERNAL" && <span className="rounded-full bg-slate-200 px-2 py-0.5">Staff only</span>}
          <span>Updated {formatDate(a.updatedAt)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.viewCount}</span>
        </div>
        <div className="flex items-start justify-between gap-3 mt-2">
          <h1 className="text-2xl md:text-3xl font-heading font-bold">{a.title}</h1>
          {a.canEdit && <Button variant="outline" size="sm" onClick={() => onEdit(a)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
        </div>
        {a.summary && <p className="mt-2 text-muted-foreground">{a.summary}</p>}
        <div className="mt-6 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />
        {a.tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{a.tags.map((t) => <span key={t} className="rounded-full border px-2 py-0.5 text-xs">#{t}</span>)}</div>}
        <div className="mt-8 border-t pt-5 flex flex-wrap items-center gap-3">
          {voted ? <p className="text-sm text-muted-foreground">Thanks for your feedback.</p> : (
            <>
              <p className="text-sm">Was this helpful?</p>
              <Button size="sm" variant="outline" onClick={() => vote(true)}><ThumbsUp className="h-4 w-4 mr-1" /> Yes</Button>
              <Button size="sm" variant="outline" onClick={() => vote(false)}><ThumbsDown className="h-4 w-4 mr-1" /> No</Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="ml-auto" asChild><Link to="/support?new=1"><HeadphonesIcon className="h-4 w-4 mr-1" /> Still need help? Raise a ticket</Link></Button>
        </div>
      </article>
      <aside className="space-y-4">
        {a.related.length > 0 && (
          <div className="surface p-5">
            <p className="font-medium text-sm mb-3">Related</p>
            <ul className="space-y-2">{a.related.map((r) => <li key={r.id}><Link to={`/knowledge/${r.slug}`} className="text-sm text-primary hover:underline">{r.title}</Link></li>)}</ul>
          </div>
        )}
        <div className="surface p-5">
          <p className="font-medium text-sm mb-3">Categories</p>
          <ul className="space-y-1">{categories.map((c) => <li key={c.id}><Link to={`/knowledge?category=${c.id}`} className="text-sm hover:underline">{c.name}</Link> <span className="text-xs text-muted-foreground">({c.articleCount})</span></li>)}</ul>
        </div>
      </aside>
    </div>
  );
}

export default function KnowledgeBase() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [category, setCategory] = useState(urlParams.get("category") || "ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("recent");
  const [data, setData] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [catOpen, setCatOpen] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  const canEdit = user?.role !== "CUSTOMER" && canAccess(user, "knowledge", "EDIT");

  const loadCategories = useCallback(() => knowledgeApi.categories().then(setCategories).catch(() => {}), []);
  const load = useCallback(() => knowledgeApi.list({
    q: q || undefined, type: type === "ALL" ? undefined : type, categoryId: category === "ALL" ? undefined : category,
    status: status === "ALL" ? undefined : status, sort, limit: 50,
  }).then(setData).catch((err) => toast.error(getErrorMessage(err))), [q, type, category, status, sort]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { if (!slug) { const t = setTimeout(load, 250); return () => clearTimeout(t); } return undefined; }, [load, slug]);

  const openEditor = (article = null) => {
    if (article && !article.body) knowledgeApi.get(article.id, true).then((full) => { setEditing(full); setEditorOpen(true); });
    else { setEditing(article); setEditorOpen(true); }
  };

  return (
    <ModulePageShell
      title="Knowledge Base"
      description="Guides, FAQs, tutorials and how-to articles"
      icon={BookOpen}
      actions={canEdit && (
        <>
          <Button size="sm" variant="outline" onClick={() => setCatOpen(true)}><FolderPlus className="w-4 h-4 mr-1" /> Categories</Button>
          <Button size="sm" onClick={() => openEditor(null)}><Plus className="w-4 h-4 mr-1" /> New article</Button>
        </>
      )}
    >
      {slug ? (
        <ArticleView key={`${slug}-${viewKey}`} slug={slug} categories={categories} onEdit={openEditor} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="space-y-4 order-2 lg:order-1">
            <div className="surface p-4">
              <p className="font-medium text-sm mb-2">Categories</p>
              <ul className="space-y-0.5">
                <li><button type="button" onClick={() => setCategory("ALL")} className={cn("w-full text-left text-sm rounded px-2 py-1.5 hover:bg-muted", category === "ALL" && "bg-muted font-medium")}>All articles</button></li>
                {categories.map((c) => (
                  <li key={c.id}><button type="button" onClick={() => setCategory(c.id)} className={cn("w-full flex justify-between text-left text-sm rounded px-2 py-1.5 hover:bg-muted", category === c.id && "bg-muted font-medium")}>{c.name}<span className="text-xs text-muted-foreground">{c.articleCount}</span></button></li>
                ))}
                <li><button type="button" onClick={() => setCategory("none")} className={cn("w-full text-left text-sm rounded px-2 py-1.5 hover:bg-muted text-muted-foreground", category === "none" && "bg-muted")}>Uncategorised</button></li>
              </ul>
            </div>
            <div className="surface p-4 text-sm">
              <p className="font-medium mb-1">Can't find an answer?</p>
              <p className="text-muted-foreground mb-3">Our team will help.</p>
              <Button size="sm" variant="outline" asChild className="w-full"><Link to="/support?new=1">Raise a support ticket</Link></Button>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-4 order-1 lg:order-2">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles, FAQs and guides" className="pl-9" aria-label="Search the knowledge base" />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="md:w-40" aria-label="Sort"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="recent">Recently updated</SelectItem><SelectItem value="popular">Most viewed</SelectItem><SelectItem value="title">A to Z</SelectItem></SelectContent>
              </Select>
              {canEdit && (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="md:w-36" aria-label="Status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ALL">Any status</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem><SelectItem value="DRAFT">Drafts</SelectItem><SelectItem value="ARCHIVED">Archived</SelectItem></SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Article type">
              {["ALL", ...TYPES].map((t) => (
                <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => setType(t)} className={cn("rounded-full border px-3 py-1 text-xs", type === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
                  {t === "ALL" ? "All" : `${TYPE_LABEL[t]}s`}
                </button>
              ))}
            </div>

            {!data ? (
              <div className="grid sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
            ) : data.data.length === 0 ? (
              <div className="surface p-10 text-center space-y-3">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{q ? `No articles match "${q}".` : "No articles here yet."}</p>
                {canEdit && <Button size="sm" onClick={() => openEditor(null)}>Write the first article</Button>}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.data.map((a) => (
                  <div key={a.id} className="group relative surface p-5 hover:shadow-md hover:border-primary/30 transition-all">
                    <Link to={`/knowledge/${a.slug}`} className="absolute inset-0" aria-label={a.title} />
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">{TYPE_LABEL[a.type]}</span>
                      {a.category && <span>{a.category.name}</span>}
                      {a.status !== "PUBLISHED" && <span className={cn("rounded-full px-2 py-0.5", STATUS_STYLE[a.status])}>{prettyEnum(a.status)}</span>}
                      {a.audience === "INTERNAL" && <span className="rounded-full bg-slate-200 px-2 py-0.5">Staff only</span>}
                    </div>
                    <h3 className="font-semibold mt-2 group-hover:text-primary">{a.title}</h3>
                    {a.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>}
                    <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.viewCount} · updated {formatDate(a.updatedAt)}</span>
                      {canEdit && <button type="button" onClick={() => openEditor(a)} className="relative z-10 flex items-center gap-1 text-primary hover:underline"><Pencil className="h-3 w-3" /> Edit</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ArticleEditor
        open={editorOpen} onOpenChange={setEditorOpen} article={editing} categories={categories}
        onSaved={(a) => { loadCategories(); if (slug) { navigate(`/knowledge/${a.slug}`, { replace: true }); setViewKey((k) => k + 1); } else load(); }}
      />
      {canEdit && <CategoryDialog open={catOpen} onOpenChange={setCatOpen} categories={categories} onChanged={() => { loadCategories(); load(); }} />}
      {canEdit && slug && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
            if (!canAccess(user, "knowledge", "FULL")) return toast.error("You need full Knowledge Base access to delete articles");
            if (!window.confirm("Delete this article? This cannot be undone.")) return;
            try { const a = await knowledgeApi.get(slug, true); await knowledgeApi.remove(a.id); toast.success("Article deleted"); navigate("/knowledge"); } catch (err) { toast.error(getErrorMessage(err)); }
          }}><Trash2 className="h-4 w-4 mr-1" /> Delete article</Button>
        </div>
      )}
    </ModulePageShell>
  );
}
