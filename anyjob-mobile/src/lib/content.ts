import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { api } from "./api";

type AppContentResponse = {
  content: Record<string, string>;
  updatedAt: string | null;
};

export function useAppContent() {
  const query = useQuery({
    queryKey: ["app-content"],
    queryFn: () => api<AppContentResponse>("/api/mobile/content"),
    staleTime: 5 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });
  const copy = useCallback(
    (key: string, fallback: string) => {
      const value = query.data?.content?.[key];
      return typeof value === "string" && value.trim() ? value : fallback;
    },
    [query.data?.content],
  );

  return { ...query, copy, content: query.data?.content || {} };
}
