import React from "react";
import { Button } from "@/components/ui/button";

export default function Pager({ meta, page, setPage }) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
    </div>
  );
}