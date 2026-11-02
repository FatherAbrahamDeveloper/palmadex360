import React, { useEffect, useMemo, useRef, useState } from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";

import {
  FileText,
  Upload,
  Download,
  File,
  Trash2,
  Loader2,
  Search,
  Image as ImageIcon,
  Video,
  Files,
  FolderOpen,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

const FOLDERS = [
  {
    id: "documents",
    label: "Documents",
    description: "PDFs, Word, Excel and certificates",
    icon: FileText,
    color: "text-blue-600",
    activeColor: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "images",
    label: "Images",
    description: "Photos, graphics and pictures",
    icon: ImageIcon,
    color: "text-green-600",
    activeColor: "border-green-500 bg-green-50 dark:bg-green-950/30",
  },
  {
    id: "videos",
    label: "Videos",
    description: "Video clips and recordings",
    icon: Video,
    color: "text-purple-600",
    activeColor: "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "others",
    label: "Others / Miscellaneous",
    description: "Archives, audio and other file types",
    icon: Files,
    color: "text-amber-600",
    activeColor: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
  },
];

const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "csv",
  "ppt", "pptx", "txt", "rtf", "odt", "ods",
  "odp", "html", "htm", "xml", "json",
]);


function getFileCategory(file) {
  const mime = (file.mimeType || "").toLowerCase();
  const name = (file.originalName || "").toLowerCase();
  const extension = name.includes(".")
    ? name.split(".").pop()
    : "";

  if (mime.startsWith("image/")) return "images";
  if (mime.startsWith("video/")) return "videos";

  // Fall back to extensions for older files or generic MIME types.
  if (DOCUMENT_EXTENSIONS.has(extension)) return "documents";

  // Treat common document MIME types as documents, too.
  if (
    mime === "application/pdf" ||
    mime.includes("msword") ||
    mime.includes("wordprocessingml") ||
    mime.includes("spreadsheetml") ||
    mime.includes("presentationml") ||
    mime === "application/rtf" ||
    mime === "text/plain" ||
    mime === "text/csv"
  ) {
    return "documents";
  }

  return "others";
}

function formatFileSize(bytes) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) {
    return "0 Bytes";
  }

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(Number(bytes)) / Math.log(1024)),
    sizes.length - 1
  );

  return `${parseFloat(
    (Number(bytes) / Math.pow(1024, index)).toFixed(2)
  )} ${sizes[index]}`;
}

function getDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleDateString();
}
function getFilePreviewUrl(file) {
  if (!file?.id) return "";

  const baseURL = api.defaults.baseURL;

  if (!baseURL) {
    throw new Error("API base URL is not configured.");
  }

  return `/files/${encodeURIComponent(file.id)}/content`;
}

export default function Documents() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFolder, setActiveFolder] = useState("documents");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 20;
const [previewUrl, setPreviewUrl] = useState("");
const [previewError, setPreviewError] = useState("");
// Close preview and release browser memory
const closePreview = () => {
  if (previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }

  setPreviewFile(null);
  setPreviewUrl("");
  setPreviewError("");
};

// Load file securely with Axios authentication
const handlePreview = async (file) => {
  try {
    setPreviewFile(file);
    setPreviewUrl("");
    setPreviewError("");

    const response = await api.get(
      getFilePreviewUrl(file),
      { responseType: "blob" }
    );

    const blobUrl = URL.createObjectURL(response.data);
    setPreviewUrl(blobUrl);
  } catch (error) {
    console.error("File preview failed:", error);

    setPreviewError(
      error.response?.data?.message ||
      "Unable to load this file. Please try again."
    );
  }
};

useEffect(() => {
  if (!previewFile) return;

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setPreviewFile(null);
      setPreviewUrl("");
      setPreviewError("");
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [previewFile]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/files");
      setFiles(response.data.files || []);
    } catch (error) {
      console.error("Failed to load files:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to load files."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const folderCounts = useMemo(() => {
    const counts = {
      documents: 0,
      images: 0,
      videos: 0,
      others: 0,
    };

    files.forEach((file) => {
      counts[getFileCategory(file)] += 1;
    });

    return counts;
  }, [files]);

  const filteredFiles = useMemo(() => {
  const query = searchTerm.trim().toLowerCase();

  return files.filter((file) => {
    const inFolder = getFileCategory(file) === activeFolder;
    const name = (file.originalName || "").toLowerCase();
    const mime = (file.mimeType || "").toLowerCase();

    return (
      inFolder &&
      (!query || name.includes(query) || mime.includes(query))
    );
  });
}, [files, activeFolder, searchTerm]);

// Pagination
const totalPages = Math.ceil(
  filteredFiles.length / ITEMS_PER_PAGE
);

const paginatedFiles = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return filteredFiles.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
}, [filteredFiles, currentPage]);

// Reset to page 1 when the folder or search changes
useEffect(() => {
  setCurrentPage(1);
}, [activeFolder, searchTerm]);

// Keep the current page valid when files are deleted
useEffect(() => {
  if (currentPage > Math.max(1, totalPages)) {
    setCurrentPage(Math.max(1, totalPages));
  }
}, [currentPage, totalPages]);

const currentFolder = FOLDERS.find(
  (folder) => folder.id === activeFolder
);

  

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    try {
      setUploading(true);
      setErrorMessage("");

      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/files/upload", formData);

      if (response.data.files?.length) {
        setFiles((current) => [
          ...response.data.files,
          ...current,
        ]);
      }
    } catch (error) {
      console.error("Upload failed:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "One or more files failed to upload."
      );
    } finally {
      setUploading(false);

      // Allow the same file to be selected again.
      event.target.value = "";
    }
  };

  const handleDelete = async (file) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.originalName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(file.id);
      setErrorMessage("");

      await api.delete(`/files/${file.id}`);

      setFiles((current) =>
        current.filter((item) => item.id !== file.id)
      );
    } catch (error) {
      console.error("Delete failed:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to delete file."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ModulePageShell
      title="Documents & Media Center"
      description="Organize your documents, images, videos and other files."
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

          <Button
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading || loading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </>
      }
    >
      {/* Folder cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {FOLDERS.map((folder) => {
          const Icon = folder.icon;
          const isActive = activeFolder === folder.id;

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                setActiveFolder(folder.id);
                setSearchTerm("");
                setErrorMessage("");
              }}
              aria-pressed={isActive}
              className={`text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                isActive
                  ? folder.activeColor
                  : "bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${folder.color}`} />
                  </div>

                  <span className="font-semibold text-sm">
                    {folder.label}
                  </span>
                </div>

                <span className="text-sm font-semibold tabular-nums">
                  {folderCounts[folder.id]}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {folder.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Current folder toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold">{currentFolder?.label}</h2>
            <p className="text-xs text-muted-foreground">
              {filteredFiles.length}{" "}
              {filteredFiles.length === 1 ? "file" : "files"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search ${currentFolder?.label.toLowerCase()}...`}
              className="pl-10"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={loadFiles}
            disabled={loading}
            title="Refresh files"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <div className="flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMessage("")}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl">
            {currentFolder && (
              <currentFolder.icon className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-60" />
            )}

            <p className="font-medium">
              {searchTerm
                ? "No files match your search."
                : `No files in ${currentFolder?.label} yet.`}
            </p>

            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upload files to add them to your media center.
            </p>

            {!searchTerm && (
              <Button
                size="sm"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            )}
          </div>
        ) : (
          paginatedFiles.map((file) => {
            const isImage = getFileCategory(file) === "images";
            const isVideo = getFileCategory(file) === "videos";
            const Icon = isImage
              ? ImageIcon
              : isVideo
                ? Video
                : File;

            return (
              <div
                key={file.id}
                className="bg-card rounded-xl border px-4 sm:px-5 py-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      title={file.originalName}
                    >
                      {file.originalName || "Unnamed file"}
                    </p>

                    <p className="text-xs text-muted-foreground truncate">
                      {file.mimeType || "Unknown file type"} ·{" "}
                      {formatFileSize(file.size)}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {getDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
  variant="ghost"
  size="icon"
onClick={() => handlePreview(file)}

  disabled={!file.url}
  title="Preview file"
  aria-label={`Preview ${file.originalName || "file"}`}
>
  <Eye className="w-4 h-4" />
</Button>
                  {file.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="Download file"
                    >
                      <a
                        href={file.url}
                        download={file.originalName || true}
                        aria-label={`Download ${file.originalName || "file"}`}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(file)}
                    disabled={deletingId === file.id}
                    title="Delete file"
                    aria-label={`Delete ${file.originalName || "file"}`}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {!loading && filteredFiles.length > 0 && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
    <p className="text-sm text-muted-foreground">
      Showing{" "}
      {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
      {Math.min(currentPage * ITEMS_PER_PAGE, filteredFiles.length)}{" "}
      of {filteredFiles.length} files
    </p>

    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((page) => page - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>

      <span className="text-sm tabular-nums">
        Page {currentPage} of {Math.max(1, totalPages)}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((page) => page + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
)}

{/* File Preview Modal */}
      {previewFile && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
    onClick={() => {
      setPreviewFile(null);
      setPreviewUrl("");
      setPreviewError("");
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="File preview"
      className="relative flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      {/* Modal header */}
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <h2 className="min-w-0 truncate font-semibold">
          {previewFile.originalName || "File Preview"}
        </h2>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closePreview}

        >
          Close
        </Button>
      </div>

      {/* Modal content */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {previewError ? (
          <div className="py-10 text-center">
            <p className="mb-4 text-sm text-destructive">
              {previewError}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewError("")}
            >
              Try Again
            </Button>
          </div>
        ) : getFileCategory(previewFile) === "images" ? (
          <img
            key={previewUrl}
            src={previewUrl}
            alt={previewFile.originalName || "Image preview"}
            className="mx-auto block max-h-[70vh] max-w-full object-contain"
            onError={() => setPreviewError("Image could not be loaded.")}
          />
        ) : getFileCategory(previewFile) === "videos" ? (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            className="mx-auto block max-h-[70vh] w-full"
            onError={() => setPreviewError("Video could not be loaded.")}
          />
        ) : (
          previewFile.mimeType?.toLowerCase() === "application/pdf" ||
          previewFile.originalName?.toLowerCase().endsWith(".pdf")
        ) ? (
          <iframe
            key={previewUrl}
  src={previewUrl}
  title={previewFile.originalName || "PDF preview"}
  className="h-[70vh] w-full rounded-lg border bg-white"
  onLoad={() => {
    console.log("PDF iframe loaded:", previewUrl);
  }}
          />
        ) : (
          <div className="py-10 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Preview is unavailable for this file type.
            </p>

            <Button asChild>
              <a
                href={previewUrl}
                download={previewFile.originalName || true}
              >
                <Download className="mr-2 h-4 w-4" />
                Download File
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </ModulePageShell>
  );
}