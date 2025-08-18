import { MetadataRoute } from 'next'
 
/**
 * Generate the robots.txt configuration for search engines.
 * Allows all user agents and points to the public sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://vscodehub.com/sitemap.xml',
    host: 'https://vscodehub.com',
  }
}