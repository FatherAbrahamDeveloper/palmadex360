import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-7xl font-light text-muted-foreground/40">404</p>
          <h1 className="text-2xl font-heading font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has moved.
          </p>
        </div>
        <Button asChild>
          <Link to="/">Go to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
