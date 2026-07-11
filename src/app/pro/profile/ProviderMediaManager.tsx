"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload, Video } from "lucide-react";

import { ImageUploader } from "@/components/upload/ImageUploader";

export interface UploadedFile {
  id: string;
  image_url: string;
  public_id: string;
  image_type: string;
  title?: string;
  description?: string;
}

type ProviderMediaManagerProps = {
  initialImages: UploadedFile[];
  initialVideo: UploadedFile | null;
  onImagesChange?: (files: UploadedFile[]) => void;
  onVideoChange?: (file: UploadedFile | null) => void;
};

type VideoMetadata = {
  thumbnailUrl?: string;
  thumbnailSecond?: number;
};
type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

const MAX_PORTFOLIO_IMAGES = 4;

function isMobileCameraDevice() {
  if (typeof window === "undefined") return false;

  const navigatorWithData = navigator as NavigatorWithUserAgentData;
  if (navigatorWithData.userAgentData?.mobile) return true;

  const userAgent = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent)) return true;

  const coarsePointer = window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false;
  const touchPoints = navigator.maxTouchPoints || 0;
  const smallestScreenSide = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);

  return coarsePointer && touchPoints > 0 && smallestScreenSide <= 1024;
}

async function requestUserCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });

  stream.getTracks().forEach((track) => track.stop());
}

function cameraPermissionErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera permission was denied. Allow camera access in your browser settings or upload a video file.";
    }

    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "No usable camera was found on this device. Upload a video file instead.";
    }
  }

  return "Camera could not be opened. Allow camera access or upload a video file.";
}

function parseVideoMetadata(description?: string): VideoMetadata {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description) as VideoMetadata;
    return {
      thumbnailUrl: typeof parsed.thumbnailUrl === "string" ? parsed.thumbnailUrl : undefined,
      thumbnailSecond: typeof parsed.thumbnailSecond === "number" && Number.isFinite(parsed.thumbnailSecond) ? parsed.thumbnailSecond : undefined,
    };
  } catch {
    return {};
  }
}

function cloudinaryVideoThumbnail(videoUrl: string, seconds: number) {
  if (!videoUrl.includes("/upload/")) return "";

  const cleanSecond = Math.max(0, Math.round(seconds * 10) / 10);
  const transformedUrl = videoUrl.replace("/upload/", `/upload/so_${cleanSecond},f_jpg/`);
  return transformedUrl.replace(/\.(mp4|webm|mov)(\?.*)?$/i, ".jpg$2");
}

async function patchVideoMetadata(file: UploadedFile, seconds: number) {
  const thumbnailUrl = cloudinaryVideoThumbnail(file.image_url, seconds);
  const description = JSON.stringify({ thumbnailUrl, thumbnailSecond: seconds });
  const response = await fetch(`/api/upload?id=${file.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.image) {
    throw new Error(payload?.error || "Could not save video thumbnail");
  }

  return payload.image as UploadedFile;
}

export function ProviderMediaManager({
  initialImages,
  initialVideo,
  onImagesChange,
  onVideoChange,
}: ProviderMediaManagerProps) {
  const [images, setImages] = useState<UploadedFile[]>(initialImages);
  const [videoFile, setVideoFile] = useState<UploadedFile | null>(initialVideo);
  const [videoDuration, setVideoDuration] = useState(30);
  const [thumbnailSecond, setThumbnailSecond] = useState(() => parseVideoMetadata(initialVideo?.description).thumbnailSecond || 0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [savingThumbnail, setSavingThumbnail] = useState(false);
  const [isMobileCamera, setIsMobileCamera] = useState(false);
  const [requestingCameraPermission, setRequestingCameraPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    setVideoFile(initialVideo);
    setThumbnailSecond(parseVideoMetadata(initialVideo?.description).thumbnailSecond || 0);
  }, [initialVideo]);

  useEffect(() => {
    const updateMobileCameraAvailability = () => setIsMobileCamera(isMobileCameraDevice());
    updateMobileCameraAvailability();
    window.addEventListener("resize", updateMobileCameraAvailability);
    window.addEventListener("orientationchange", updateMobileCameraAvailability);

    return () => {
      window.removeEventListener("resize", updateMobileCameraAvailability);
      window.removeEventListener("orientationchange", updateMobileCameraAvailability);
    };
  }, []);

  const metadata = parseVideoMetadata(videoFile?.description);
  const thumbnailUrl = videoFile
    ? cloudinaryVideoThumbnail(videoFile.image_url, thumbnailSecond) || metadata.thumbnailUrl || ""
    : "";

  async function uploadVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (videoFile) {
      setError("Delete the current video before uploading another one.");
      return;
    }

    setUploadingVideo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("image_type", "portfolio_video");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.image) {
        throw new Error(payload?.error || "Video upload failed");
      }

      const savedVideo = await patchVideoMetadata(payload.image as UploadedFile, 0);
      setVideoFile(savedVideo);
      setThumbnailSecond(0);
      onVideoChange?.(savedVideo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function saveThumbnail() {
    if (!videoFile) return;

    setSavingThumbnail(true);
    setError(null);
    try {
      const updatedVideo = await patchVideoMetadata(videoFile, thumbnailSecond);
      setVideoFile(updatedVideo);
      onVideoChange?.(updatedVideo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save video thumbnail");
    } finally {
      setSavingThumbnail(false);
    }
  }

  async function deleteVideo() {
    if (!videoFile) return;

    setError(null);
    const response = await fetch(`/api/upload?id=${videoFile.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete video");
      return;
    }

    setVideoFile(null);
    setThumbnailSecond(0);
    onVideoChange?.(null);
  }

  async function openCameraVideoCapture() {
    if (!isMobileCamera) {
      setError("Camera recording is only available on mobile. Upload a video file on this device.");
      return;
    }

    try {
      setError(null);
      setRequestingCameraPermission(true);
      await requestUserCameraPermission();
      cameraVideoInputRef.current?.click();
    } catch (err) {
      setError(cameraPermissionErrorMessage(err));
    } finally {
      setRequestingCameraPermission(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Portfolio images</h4>
            <p className="text-xs text-gray-500">{images.length}/{MAX_PORTFOLIO_IMAGES} images added</p>
          </div>
        </div>
        <ImageUploader
          imageType="portfolio"
          maxImages={MAX_PORTFOLIO_IMAGES}
          label=""
          existingImages={images}
          onUploadComplete={(file) => {
            setImages((prev) => {
              const next = [file, ...prev].slice(0, MAX_PORTFOLIO_IMAGES);
              onImagesChange?.(next);
              return next;
            });
          }}
          onDeleteComplete={(imageId) => {
            setImages((prev) => {
              const next = prev.filter((file) => file.id !== imageId);
              onImagesChange?.(next);
              return next;
            });
          }}
        />
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Profile video</h4>
            <p className="text-xs text-gray-500">{videoFile ? "1/1 video added" : "0/1 video added"}</p>
          </div>
          {videoFile ? (
            <button
              type="button"
              onClick={deleteVideo}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>

        {videoFile ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
            <video
              src={videoFile.image_url}
              controls
              className="aspect-video w-full rounded-lg bg-black object-cover"
              onLoadedMetadata={(event) => {
                const duration = Number(event.currentTarget.duration);
                if (Number.isFinite(duration) && duration > 0) setVideoDuration(duration);
              }}
            />
            <div className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Selected video thumbnail" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="video-thumbnail-second" className="mb-2 block text-sm font-medium text-gray-700">
                  Thumbnail frame: {thumbnailSecond.toFixed(1)}s
                </label>
                <input
                  id="video-thumbnail-second"
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(videoDuration))}
                  step={0.5}
                  value={thumbnailSecond}
                  onChange={(event) => setThumbnailSecond(Number(event.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
              <button
                type="button"
                onClick={saveThumbnail}
                disabled={savingThumbnail}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {savingThumbnail ? "Saving..." : "Use this thumbnail"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingVideo ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <Upload className="h-6 w-6 text-gray-400" />}
              <span className="text-sm font-medium text-gray-700">{uploadingVideo ? "Uploading video..." : "Upload one video"}</span>
              <span className="text-xs text-gray-400">MP4, WebM, MOV. Max 100MB.</span>
            </button>
            {isMobileCamera ? (
              <button
                type="button"
                onClick={() => void openCameraVideoCapture()}
                disabled={uploadingVideo || requestingCameraPermission}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                {requestingCameraPermission ? "Allow camera..." : "Record with camera"}
              </button>
            ) : null}
          </div>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(event) => uploadVideo(event.target.files)}
        />
        {isMobileCamera ? (
          <input
            ref={cameraVideoInputRef}
            type="file"
            accept="video/*"
            capture="user"
            className="hidden"
            onChange={(event) => uploadVideo(event.target.files)}
          />
        ) : null}
        {error ? <p className="mt-3 text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
