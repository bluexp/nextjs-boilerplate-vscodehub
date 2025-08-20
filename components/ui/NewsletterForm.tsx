"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

/**
 * NewsletterForm
 * - Minimal email subscription form that posts to /api/newsletter
 * - Client component with basic validation and UX states
 * - Internationalized via useI18n hook
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const { t } = useI18n();

  /**
   * Handle newsletter subscription form submission
   * - Posts email to API endpoint
   * - Sets loading and status states based on response
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus("idle");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Subscription failed");
      }
      setStatus("success");
      setMessage(t("newsletter.success", "Thanks for subscribing!"));
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || t("newsletter.error", "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("newsletter.placeholder", "you@example.com")}
        className="h-10 flex-1"
        aria-label={t("newsletter.aria.email", "Email address")}
        required
      />
      <Button type="submit" disabled={loading} className="h-10">
        {loading ? t("newsletter.button.subscribing", "Subscribing...") : t("newsletter.button.subscribe", "Subscribe")}
      </Button>
      {message && (
        <span
          className={
            "ml-2 text-sm " + (status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-muted-foreground")
          }
          role={status === "error" ? "alert" : undefined}
        >
          {message}
        </span>
      )}
    </form>
  );
}