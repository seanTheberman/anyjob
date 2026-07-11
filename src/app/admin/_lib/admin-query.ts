export type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "all") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

export function paramIn<T extends string>(value: string, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? value as T : fallback;
}
