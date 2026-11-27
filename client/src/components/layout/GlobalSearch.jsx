import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, ArrowRight, Loader2, Users, Truck, ShoppingCart, Package, LayoutGrid, Ship,
  Building2, HeadphonesIcon, BookOpen, UserCog,
} from "lucide-react";
import { globalSearchApi } from "@/services/api";
import { getModulesForUser } from "@/lib/roleConfig";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  contact: Users, supplier: Truck, order: ShoppingCart, product: Package, shipment: Ship,
  customer: Building2, ticket: HeadphonesIcon, article: BookOpen, user: UserCog,
};

// The single search for the whole app: modules you can open plus matching records,
// limited server-side to what your role is allowed to see.
export default function GlobalSearch({ autoFocus = false, onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0);

  const modules = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return getModulesForUser(user)
      .filter((m) => {
        const text = [m.label, m.id, m.desc, ...(m.keywords || [])].join(" ").toLowerCase();
        return words.every((w) => text.includes(w));
      })
      .map((m) => ({ id: m.id, type: "module", title: m.label, subtitle: "Open module", path: m.path, icon: m.icon }));
  }, [query, user]);

  const items = [...modules, ...results];

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); setError(""); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await globalSearchApi.search(q, controller.signal);
        setResults(res.results || []);
      } catch (err) {
        if (err.code !== "ERR_CANCELED") { setError("Search is unavailable right now."); setResults([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    const outside = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    const shortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener("mousedown", outside);
    window.addEventListener("keydown", shortcut);
    return () => { document.removeEventListener("mousedown", outside); window.removeEventListener("keydown", shortcut); };
  }, []);

  const go = (item) => {
    if (!item) return;
    navigate(item.path);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
    onNavigate?.();
  };

  const onKeyDown = (e) => {
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); go(items[selected]); }
  };

  // Group record results by module for readability.
  const groups = results.reduce((acc, r) => { (acc[r.module] ||= []).push(r); return acc; }, {});

  const Row = ({ item, index }) => {
    const Icon = item.icon || TYPE_ICONS[item.type] || LayoutGrid;
    return (
      <button
        type="button" role="option" aria-selected={selected === index}
        onClick={() => go(item)} onMouseEnter={() => setSelected(index)}
        className={cn("w-full flex items-center gap-3 p-2.5 rounded-lg text-left", selected === index ? "bg-accent" : "hover:bg-accent/60")}
      >
        <Icon className={cn("w-5 h-5 shrink-0", item.type === "module" ? "text-primary" : "text-muted-foreground")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  };

  let index = modules.length;
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-soft transition focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <input
          ref={inputRef} value={query} type="search" role="combobox" aria-expanded={open} aria-label="Search Palmadex 360"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
          placeholder="Search modules, orders, customers, help..."
          className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-label="Searching" />}
        {query && !loading && (
          <button type="button" onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }} aria-label="Clear search">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {!query && <kbd className="hidden lg:block text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">Ctrl K</kbd>}
      </div>

      {open && query.trim() && (
        <div role="listbox" className="absolute top-full left-0 mt-2 w-full md:w-[460px] max-h-[70vh] overflow-y-auto bg-popover border rounded-2xl shadow-lift z-[100] p-2">
          {modules.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5">MODULES</p>
              {modules.map((m, i) => <Row key={m.id} item={m} index={i} />)}
            </>
          )}
          {query.trim().length < 2 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">Type at least 2 characters to search records.</p>
          ) : (
            <>
              {Object.entries(groups).map(([module, rows]) => (
                <div key={module}>
                  <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 mt-1 uppercase">{module}</p>
                  {rows.map((r) => <Row key={`${r.type}-${r.id}`} item={r} index={index++} />)}
                </div>
              ))}
              {error && <p className="text-xs text-destructive p-3 text-center">{error}</p>}
              {!loading && !error && !results.length && !modules.length && (
                <p className="text-sm text-muted-foreground p-6 text-center">No results for "{query.trim()}"</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
