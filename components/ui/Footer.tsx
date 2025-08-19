import { Github, Heart, ExternalLink } from "lucide-react";
import Link from "next/link";
import { NewsletterForm } from "@/components/ui/NewsletterForm";

/**
 * Global footer component with copyright, attribution, and links
 * Provides site-wide footer with branding, data source acknowledgment, and relevant links
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Information + Newsletter */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-secondary shadow-sm" />
              <span className="text-lg font-semibold text-foreground">
                vscodehub.com
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Developer resource hub with curated tools and libraries
            </p>
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-foreground">Newsletter</h3>
              <p className="mb-2 text-sm text-muted-foreground">Get updates when we add new resources</p>
              <NewsletterForm />
            </div>
          </div>

          {/* Data Source Attribution */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Data Source</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Based on</span>
                <Link
                  href="https://github.com/sindresorhus/awesome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Awesome Lists
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p>Following CC0-1.0 license, synced daily</p>
            </div>
          </div>

          {/* Related Links */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Related Links</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="https://github.com/sindresorhus/awesome"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                Awesome Project
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/api/admin/sync"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                Data Sync Status
              </Link>
              <Link
                href="/sitemap.xml"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                Sitemap
              </Link>
              <Link
                href="https://github.com/bluexp/nextjs-boilerplate-vscodehub/issues/new?template=submit-resource.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                Submit Resource
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright Information */}
        <div className="mt-8 flex flex-col items-center justify-between border-t border-border/30 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>
            © {currentYear} vscodehub.com. Built with{" "}
            <Link
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Next.js
            </Link>{" "}
            and deployed on{" "}
            <Link
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vercel
            </Link>
            .
          </p>
          <p className="mt-2 md:mt-0">
            Honoring all open source contributors 🚀
          </p>
        </div>
      </div>
    </footer>
  );
}