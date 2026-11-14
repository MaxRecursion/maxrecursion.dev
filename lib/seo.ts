import type { Metadata } from "next";
import { site } from "@/content/site";

/**
 * Title, description, canonical, Open Graph and Twitter metadata for one page.
 *
 * Next.js merges metadata shallowly: a page that sets `openGraph` replaces the layout's whole
 * `openGraph` object, and a page that leaves `twitter` out inherits the layout's homepage card.
 * Building every field here keeps each page's social card describing that page.
 */
export function pageMetadata({
  path,
  title,
  description,
  type = "website",
  image,
  imageAlt,
}: {
  path: string;
  /** Without the " | Akshay Kulkarni" suffix; the layout's template adds it to <title>. */
  title: string;
  description: string;
  type?: "website" | "article";
  /** Absolute or root-relative image. Omit to use the route's opengraph-image file, if any. */
  image?: string;
  imageAlt?: string;
}): Metadata {
  const images = image ? [{ url: image, alt: imageAlt ?? title }] : undefined;
  // Google cuts titles at roughly 60 characters. When the " | Akshay Kulkarni" suffix would push the
  // page's own keywords past that, the title stands alone; the site name still shows above the result.
  const suffixed = `${title} | ${site.name}`;
  return {
    title: suffixed.length > 65 ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type, url: path, siteName: site.handle, locale: "en_US", title, description, ...(images && { images }) },
    twitter: { card: "summary_large_image", title, description, ...(images && { images }) },
  };
}
