"use client";

import { useCallback, useEffect, useState } from "react";

export type CameraCaptureMode = "user" | "environment";

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

type CameraCaptureMessages = {
  unavailable?: string;
  denied?: string;
  notFound?: string;
  failed?: string;
};

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

async function requestCameraPermission(captureMode: CameraCaptureMode) {
  if (!navigator.mediaDevices?.getUserMedia) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: captureMode },
    audio: false,
  });

  stream.getTracks().forEach((track) => track.stop());
}

function cameraPermissionErrorMessage(error: unknown, messages: CameraCaptureMessages) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return messages.denied || "Camera permission was denied. Allow camera access or use file upload.";
    }

    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return messages.notFound || "No usable camera was found on this device. Use file upload instead.";
    }
  }

  return messages.failed || "Camera could not be opened. Allow camera access or use file upload.";
}

export function useMobileCameraCapture(messages: CameraCaptureMessages = {}) {
  const [isMobileCamera, setIsMobileCamera] = useState(false);
  const [requestingCameraPermission, setRequestingCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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

  const requestCameraCapture = useCallback(
    async (captureMode: CameraCaptureMode, openCaptureInput: () => void) => {
      if (!isMobileCamera) {
        setCameraError(messages.unavailable || "Camera capture is only available on mobile. Use file upload on this device.");
        return false;
      }

      try {
        setCameraError(null);
        setRequestingCameraPermission(true);
        await requestCameraPermission(captureMode);
        openCaptureInput();
        return true;
      } catch (error) {
        setCameraError(cameraPermissionErrorMessage(error, messages));
        return false;
      } finally {
        setRequestingCameraPermission(false);
      }
    },
    [isMobileCamera, messages]
  );

  return {
    isMobileCamera,
    requestingCameraPermission,
    cameraError,
    clearCameraError: () => setCameraError(null),
    requestCameraCapture,
  };
}
