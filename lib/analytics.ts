import posthog from 'posthog-js';

/**
 * Analytics for the "go to the SaaS app" conversion path.
 *
 * Every CTA on the marketing site that sends a visitor to the GoPilot app
 * (GOPILOT_APP_URL → app.rasid.ai) fires ONE event — `gopilot_app_clicked` —
 * with a `location` property saying where it was clicked. One event with a
 * breakdown property beats a separate event per placement: the signup funnel
 * stays a single step, and you can still split it by navbar / hero / pricing /
 * etc. in PostHog whenever you want.
 */
export type GoPilotCtaLocation =
  | 'navbar'
  | 'navbar_mobile'
  | 'hero'
  | 'pricing'
  | 'final'
  | 'footer';

export function trackGoPilotClick(
  location: GoPilotCtaLocation,
  props?: Record<string, unknown>,
) {
  posthog.capture('gopilot_app_clicked', { location, ...props });
}

/**
 * Fires when a visitor downloads a GIS plugin (QGIS plugin, ArcGIS Pro add-in).
 * `plugin_name` is the link label so you can see which plugin is most popular;
 * `href` is the actual download URL.
 */
export function trackPluginDownload(pluginName: string, href: string) {
  posthog.capture('plugin_download_clicked', {
    plugin_name: pluginName,
    href,
    source: 'landing_page',
  });
}

export type SocialPlatform = 'linkedin' | 'youtube';

/**
 * Derives the social platform from a link's URL. Returns null for non-social
 * links (email, in-page anchors) so callers can attach one onClick to a whole
 * list of mixed links and only fire for the social ones.
 */
export function socialPlatformFromHref(href: string): SocialPlatform | null {
  if (/linkedin\.com/i.test(href)) return 'linkedin';
  if (/youtube\.com|youtu\.be/i.test(href)) return 'youtube';
  return null;
}

/** Fires when a visitor clicks a social link (LinkedIn, YouTube). */
export function trackSocialClick(
  platform: SocialPlatform,
  props?: Record<string, unknown>,
) {
  posthog.capture('social_link_clicked', { platform, ...props });
}
