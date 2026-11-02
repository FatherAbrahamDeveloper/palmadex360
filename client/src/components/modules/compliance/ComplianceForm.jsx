
import React, { useEffect, useState } from "react";
import { complianceApi, getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const initialForm = {
  title: "",
  region: "",
  authority: "",
  reference: "",
  description: "",
  status: "IN_REVIEW",
  completion: 0,
  dueDate: "",
  notes: "",
};

export default function ComplianceForm({
  open,
  onOpenChange,
  item,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");

      setForm(
        item
          ? {
              title: item.title || "",
              region: item.region || "",
              authority: item.authority || "",
              reference: item.reference || "",
              description: item.description || "",
              status: item.status || "IN_REVIEW",
              completion: Number(item.completion ?? 0),
              dueDate: item.dueDate
                ? new Date(item.dueDate).toISOString().slice(0, 10)
                : "",
              notes: item.notes || "",
            }
          : { ...initialForm }
      );
    }
  }, [open, item]);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.region.trim()) {
      setError("Requirement title and region are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        completion: Number(form.completion),
        dueDate: form.dueDate || null,
      };

      if (item) {
        await complianceApi.update(item.id, payload);
      } else {
        await complianceApi.create(payload);
      }

      if (onSaved) {
        await onSaved();
      }

      onOpenChange(false);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to save compliance requirement.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Requirement" : "Add Compliance Requirement"}
          </DialogTitle>

          <DialogDescription>
            Keep your company's regulatory requirements and certifications up to date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Requirement title *</Label>
            <Input
              value={form.title}
              onChange={(e) => change("title", e.target.value)}
              placeholder="e.g. NAFDAC Export Permit"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Region / Country *</Label>
              <Input
                value={form.region}
                onChange={(e) => change("region", e.target.value)}
                placeholder="e.g. Nigeria"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Regulatory Authority</Label>
              <Input
                value={form.authority}
                onChange={(e) => change("authority", e.target.value)}
                placeholder="e.g. NAFDAC"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reference / Certificate Number</Label>
            <Input
              value={form.reference}
              onChange={(e) => change("reference", e.target.value)}
              placeholder="Enter reference number"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => change("description", e.target.value)}
              placeholder="Describe the requirement..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => change("status", e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="ACTION_REQUIRED">Action Required</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Compliance Completion (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.completion}
                onChange={(e) =>
                  change(
                    "completion",
                    e.target.value === ""
                      ? ""
                      : Math.min(100, Math.max(0, Number(e.target.value)))
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Renewal / Due Date</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => change("dueDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => change("notes", e.target.value)}
              placeholder="Additional information for your team..."
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {item ? "Save Changes" : "Create Requirement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
