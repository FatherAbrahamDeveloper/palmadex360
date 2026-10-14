import React, { useEffect, useRef, useState } from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";

import {
  FileText,
  Upload,
  Download,
  File,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";   // Make sure you have this component
import api from "@/services/api";

export default function Documents() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/files");
      setFiles(response.data.files || []);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/files/upload", formData);

      if (response.data.files?.length > 0) {
        setFiles((current) => [...response.data.files, ...current]);
      }

      event.target.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error.response?.data?.message || "One or more files failed to upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;

    try {
      await api.delete(`/files/${id}`);
      setFiles((current) => current.filter((file) => file.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.response?.data?.message || "Failed to delete file.");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${sizes[index]}`;
  };

  // Filter files based on search
  const filteredFiles = files.filter((file) =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModulePageShell
      title="Documentation Center"
      description="Manage export documents, certificates, and compliance records"
      icon={FileText}
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />

          <Button size="sm" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1" />
            )}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {searchTerm
                ? "No documents match your search."
                : "No documents have been uploaded yet."}
            </p>

            {!searchTerm && (
              <Button size="sm" className="mt-4" onClick={handleUploadClick}>
                <Upload className="w-4 h-4 mr-1" />
                Upload First Document
              </Button>
            )}
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-card rounded-xl border px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <File className="w-4 h-4 text-primary" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.mimeType} · {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" asChild>
                  <a href={file.url} download={file.originalName} title="Download file">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(file.id)}
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </ModulePageShell>
  );
}