/**
 * Read environment variable safely in Edge runtime using globalThis.
 * Avoids direct reference to Node's `process` symbol for type compatibility.
 */
export function getEnv(name: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any)?.process?.env ?? {};
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}