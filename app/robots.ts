import type { MetadataRoute } from 'next';

/**
 * robots.txt — served by Next at /robots.txt.
 *
 * Posture: fully open. RASID *wants* to be found and cited, so we allow every
 * crawler, including AI/LLM crawlers (training, live-retrieval, and user-
 * triggered). The wildcard rule already permits them all; the explicit
 * allow-list below is documentation + future-proofing (so a later Disallow on
 * `*` never accidentally shuts an answer engine out). Points crawlers at the
 * sitemap. Bots that ignore robots.txt (Perplexity-User, Bytespider) are listed
 * for completeness; the allow is a no-op for them either way.
 */
const BASE = 'https://rasid.ai';

const AI_BOTS = [
  'GPTBot', // OpenAI — training
  'OAI-SearchBot', // OpenAI — ChatGPT search
  'ChatGPT-User', // OpenAI — user-triggered fetch
  'ClaudeBot', // Anthropic — training
  'anthropic-ai', // Anthropic — legacy
  'Claude-SearchBot', // Anthropic — search
  'Claude-User', // Anthropic — user-triggered
  'PerplexityBot', // Perplexity — search index
  'Perplexity-User', // Perplexity — user-triggered
  'Google-Extended', // Google — Gemini/Vertex training control
  'Applebot-Extended', // Apple — training control
  'CCBot', // Common Crawl
  'Bytespider', // ByteDance
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
