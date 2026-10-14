import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { BookOpen, Search, FileText, Video, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = [
  { icon: FileText, title: "Getting Started", articles: 12, desc: "Onboarding guides and first steps" },
  { icon: BookOpen, title: "Export Procedures", articles: 24, desc: "Step-by-step export process guides" },
  { icon: HelpCircle, title: "FAQs", articles: 38, desc: "Frequently asked questions" },
  { icon: Video, title: "Video Tutorials", articles: 8, desc: "Walk-through video guides" },
  { icon: FileText, title: "Compliance Guides", articles: 15, desc: "Trade regulation and compliance" },
  { icon: BookOpen, title: "API Documentation", articles: 6, desc: "Technical integration guides" },
];

export default function KnowledgeBase() {
  return (
    <ModulePageShell title="Knowledge Base" description="Guides, FAQs, tutorials, and resources" icon={BookOpen}>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search knowledge base..." className="pl-9" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <div key={i} className="bg-card rounded-xl border border p-5 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{cat.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              <Badge variant="secondary" className="mt-3 bg-accent text-accent-foreground">{cat.articles} articles</Badge>
            </div>
          );
        })}
      </div>
    </ModulePageShell>
  );
}