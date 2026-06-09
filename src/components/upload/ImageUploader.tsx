"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Loader2, ImagePlus, FileText, Video } from "lucide-react";

interface UploadedImage {
  id: string;
  image_url: string;
  public_id: string;
  image_type: string;
  title?: string;
  description?: string;
}

type UploadImageType = "profile" | "portfolio" | "portfolio_video" | "work_image" | "id_document" | "selfie_video";

interface ImageUploaderProps {
  imageType: UploadImageType;
  inquiryId?: string;
  maxImages?: number;
  existingImages?: UploadedImage[];
  onUploadComplete?: (image: UploadedImage) => void;
  onDeleteComplete?: (imageId: string) => void;
  className?: string;
  label?: string;
  compact?: boolean;
}

export function ImageUploader({
  imageType,
  inquiryId,
  maxImages = 10,
  existingImages = [],
  onUploadComplete,
  onDeleteComplete,
  className = "",
  label,
  compact = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingImagesKeyRef = useRef(
    existingImages.map((image) => `${image.id}:${image.image_url}:${image.image_type}`).join("|")
  );

  useEffect(() => {
    const nextKey = existingImages.map((image) => `${image.id}:${image.image_url}:${image.image_type}`).join("|");
    if (existingImagesKeyRef.current === nextKey) return;
    existingImagesKeyRef.current = nextKey;
    setImages(existingImages);
  }, [existingImages]);

  const isVideoUpload = imageType === "selfie_video" || imageType === "portfolio_video";
  const isDocumentUpload = imageType === "id_document";
  const uploadNoun = isVideoUpload ? "video" : isDocumentUpload ? "document" : "image";
  const acceptTypes = isVideoUpload
    ? "video/mp4,video/webm,video/quicktime"
    : isDocumentUpload
      ? "image/jpeg,image/png,image/webp,image/gif,application/pdf"
      : "image/jpeg,image/png,image/webp,image/gif";
  const uploadHelp = isVideoUpload
    ? "MP4, WebM, MOV • Max 100MB"
    : isDocumentUpload
      ? "JPG, PNG, WebP, PDF • Max 25MB"
      : "JPG, PNG, WebP • Max 10MB";

  const handleUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} ${maxImages === 1 ? uploadNoun : `${uploadNoun}s`} allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("image_type", imageType);
        if (inquiryId) formData.append("inquiry_id", inquiryId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const { image } = await response.json();
        setImages((prev) => [...prev, image]);
        onUploadComplete?.(image);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [images.length, maxImages, uploadNoun, imageType, inquiryId, onUploadComplete]);

  const handleDelete = useCallback(async (imageId: string) => {
    try {
      const response = await fetch(`/api/upload?id=${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      setImages((prev) => prev.filter((img) => img.id !== imageId));
      onDeleteComplete?.(imageId);
    } catch {
      setError("Failed to delete image");
    }
  }, [onDeleteComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  if (imageType === "profile") {
    return (
      <div className={className}>
        {label && <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
            {images.length > 0 ? (
              <>
                <img src={images[images.length - 1].image_url} alt="Profile" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(images[images.length - 1].id)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP. Max 10MB.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>}

      {/* Uploaded files */}
      {images.length > 0 && (
        <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"} gap-3 mb-3`}>
          {images.map((img) => {
            const url = img.image_url.toLowerCase();
            const isPdf = url.includes(".pdf") || img.image_type === "id_document";
            const isVideo = img.image_type === "selfie_video" || img.image_type === "portfolio_video" || url.includes(".mp4") || url.includes(".webm") || url.includes(".mov");

            return (
              <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {isVideo ? (
                  <video src={img.image_url} controls className="w-full h-full object-cover" />
                ) : isPdf ? (
                  <a href={img.image_url} target="_blank" rel="noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-sm text-gray-700">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <span className="line-clamp-2">{img.title || "ID document"}</span>
                  </a>
                ) : (
                  <img src={img.image_url} alt={img.title || "Uploaded"} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X className="w-3 h-3" />
                </button>
                {img.title && !isPdf && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                    {img.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl ${compact ? "p-4" : "p-6"} text-center hover:border-red-400 transition-colors cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isVideoUpload ? <Video className="w-6 h-6 text-gray-400" /> : <Upload className="w-6 h-6 text-gray-400" />}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drop {uploadNoun}s here or <span className="text-red-600 font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                {images.length}/{maxImages} {maxImages === 1 ? uploadNoun : `${uploadNoun}s`} • {uploadHelp}
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={maxImages > 1}
        className="hidden"
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
      />
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
