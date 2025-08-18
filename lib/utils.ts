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

/**
 * Converts a string into a URL-friendly slug.
 * @param text The string to slugify.
 * @returns The slugified string.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}