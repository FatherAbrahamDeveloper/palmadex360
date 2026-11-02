
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  ArrowRight,
  Loader2,
  Users,
  Truck,
  ShoppingCart,
  Package,
  LayoutGrid,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { globalSearchApi } from "@/services/api";
import { MODULES } from "@/lib/RoleConfig";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  customer: Users,
  supplier: Truck,
  order: ShoppingCart,
  product: Package,
  module: LayoutGrid,
};

export default function GlobalSearch({ role, onNavigate }) {
  const navigate = useNavigate();

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");

  // Search modules locally
  const searchableModules = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) return [];

    return MODULES.filter((module) => {
      const searchableText = [
        module.label,
        module.id,
        module.path,
        ...(module.keywords || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchText
        .split(/\s+/)
        .every((word) => searchableText.includes(word));
    });
  }, [query]);

  // Combine module and database results
  const combinedResults = useMemo(() => {
    return [
      ...searchableModules.map((module) => ({
        id: module.id,
        type: "module",
        title: module.label,
        subtitle: "Open module",
        module: "Module",
        path: module.path,
        icon: module.icon,
      })),
      ...results.map((result) => ({
        ...result,
        path: result.path,
      })),
    ];
  }, [searchableModules, results]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Database search with debounce and cancellation
  useEffect(() => {
    const searchQuery = query.trim();

    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await globalSearchApi.search(
          searchQuery,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setResults(response.results || []);
        }
      } catch (err) {
        if (
          !controller.signal.aborted &&
          err.code !== "ERR_CANCELED"
        ) {
          setError("Unable to search right now. Please try again.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleShortcut = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        inputRef.current?.focus();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  // Open selected result
  const openResult = (result) => {
    if (!result?.path) return;

    if (onNavigate) {
      onNavigate(result);
    } else {
      navigate(result.path);
    }

    setQuery("");
    setResults([]);
    setOpen(false);
    setSelectedIndex(0);
    inputRef.current?.blur();
  };

  // Keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setSelectedIndex((current) =>
        Math.min(current + 1, combinedResults.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setSelectedIndex((current) =>
        Math.max(current - 1, 0)
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (combinedResults.length > 0) {
        openResult(combinedResults[selectedIndex]);
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setError("");
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full min-w-0"
    >
      {/* SEARCH INPUT */}
      <div
        className={cn(
          "flex items-center gap-2 w-full",
          "bg-muted rounded-xl px-3 py-2.5",
          "border border-transparent",
          "transition-colors",
          "focus-within:border-primary/30",
          "focus-within:ring-2 focus-within:ring-primary/10"
        )}
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />

        <input
          ref={inputRef}
          type="search"
          value={query}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search modules, orders, documents..."
          className="w-full min-w-0 bg-transparent outline-none border-none text-sm"
          aria-label="Global search"
          aria-expanded={open}
          aria-controls="global-search-results"
          role="combobox"
          aria-autocomplete="list"
        />

        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
        )}

        {query && !loading && (
          <button
            type="button"
            onClick={clearSearch}
            className="shrink-0"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {!query && (
          <kbd className="hidden sm:block shrink-0 text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* SEARCH DROPDOWN */}
      {open && query.trim().length > 0 && (
        <div
          id="global-search-results"
          className={cn(
            "absolute top-full left-0 mt-2",
            "w-full md:w-[440px]",
            "max-w-[calc(100vw-24px)]",
            "bg-popover border border-border",
            "rounded-xl shadow-2xl",
            "z-[100] p-2",
            "max-h-[70vh] overflow-y-auto"
          )}
        >
          {query.trim().length < 2 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">
              Type at least 2 characters to search.
            </p>
          ) : (
            <>
              {/* MODULE RESULTS */}
              {searchableModules.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground px-2 py-2">
                    MODULES ({searchableModules.length})
                  </p>

                  {searchableModules.map((module) => {
                    const Icon = module.icon || LayoutGrid;

                    const index = combinedResults.findIndex(
                      (item) =>
                        item.type === "module" &&
                        item.id === module.id
                    );

                    return (
                      <button
                        key={module.id}
                        type="button"
                        role="option"
                        aria-selected={selectedIndex === index}
                        onClick={() => openResult(combinedResults[index])}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full flex items-center gap-3",
                          "p-2.5 rounded-lg text-left",
                          "transition-colors",
                          selectedIndex === index
                            ? "bg-accent"
                            : "hover:bg-accent/60"
                        )}
                      >
                        <Icon className="w-5 h-5 text-primary shrink-0" />

                        <span className="flex-1 min-w-0 text-sm font-medium truncate">
                          {module.label}
                        </span>

                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DATABASE RESULTS */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground px-2 py-2 mt-1">
                  RECORDS
                </p>

                {loading && results.length === 0 && (
                  <div className="flex items-center justify-center gap-2 p-5 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching your records...
                  </div>
                )}

                {error && (
                  <p className="text-xs text-destructive p-4 text-center">
                    {error}
                  </p>
                )}

                {results.map((result, index) => {
                  const Icon =
                    TYPE_ICONS[result.type] || LayoutGrid;

                  const resultIndex =
                    searchableModules.length + index;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      role="option"
                      aria-selected={selectedIndex === resultIndex}
                      onClick={() => openResult(result)}
                      onMouseEnter={() =>
                        setSelectedIndex(resultIndex)
                      }
                      className={cn(
                        "w-full flex items-center gap-3",
                        "p-2.5 rounded-lg text-left",
                        "transition-colors",
                        selectedIndex === resultIndex
                          ? "bg-accent"
                          : "hover:bg-accent/60"
                      )}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.title}
                        </p>

                        <p className="text-xs text-muted-foreground truncate">
                          {result.module || result.type} · {result.subtitle}
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}

                {!loading &&
                  !error &&
                  results.length === 0 &&
                  searchableModules.length === 0 && (
                    <p className="text-xs text-muted-foreground p-5 text-center">
                      No matching modules or records found.
                    </p>
                  )}
              </div>
            </>
          )}

          {/* KEYBOARD HINTS */}
          <div className="border-t mt-2 pt-2 px-2 flex justify-between text-[10px] text-muted-foreground">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
        </div>
      )}
    </div>
  );
}
