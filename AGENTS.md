# AGENTS.md

Conventions for agents and contributors working on this repo.

Scope: SEO and metadata plumbing, which is where the non-obvious constraints
live. Several of the rules below look like dead weight or over-complication and
invite "simplification" that silently breaks how Google sees the site. Extend
this file as other areas accumulate rules.

For build/dev commands and where copy lives, see [README.md](README.md).

---

## Sitemap: never use a build-time date

[app/sitemap.ts](app/sitemap.ts) keeps hand-maintained dates in a
`ROUTE_UPDATED` map. **Do not replace them with `new Date()`.**

It previously did exactly that, and the reason it was wrong is not obvious:
`sitemap.xml` is a statically prerendered route, so `new Date()` freezes at
build time. Every deploy minted a new timestamp and announced that all five
static pages had just changed, including deploys that touched no copy at all.
Google discounts a `lastmod` that always reads "now", so the signal decays to
worthless.

Deriving the dates from git history does not work here either, and this is worth
knowing before someone tries it:

- All five `page.tsx` files share a single commit date, because they were
  written in one sweep.
- The copy is centralised in `data/content.ts`, which several pages import. Any
  git-derived value would bump *every* route the moment that one file changes.

That is the same false signal, emitted less often.

**Rules**

- Bump a route's date only when its **visible copy** changes. Refactors,
  styling passes, dependency bumps and metadata-only changes leave it alone.
- Use date-only format (`YYYY-MM-DD`). Do not pass `Date` objects or ISO
  timestamps: `new Date('2025-11-01')` serialises to `2025-11-01T00:00:00.000Z`,
  and midnight UTC implies a precision we do not have.
- The `/case-studies` index date stays **derived** from the newest published
  study, because its freshness genuinely is the newest study listed on it. Do
  not hardcode it into `ROUTE_UPDATED`.
- `changeFrequency` and `priority` are ignored by Google. They are kept for
  other engines. Do not spend effort tuning them, and do not read them as
  meaningful.

**How to verify a change**

Two consecutive builds must produce a byte-identical sitemap:

```bash
npx next build --no-lint && cp .next/server/app/sitemap.xml.body /tmp/sm1.xml
npx next build --no-lint && cp .next/server/app/sitemap.xml.body /tmp/sm2.xml
cmp /tmp/sm1.xml /tmp/sm2.xml && echo "stable"
```

If those differ, a build-time value has crept back in.

---

## Favicons: multiples of 48px, plus a root `.ico`

Google's favicon guidelines require a square icon whose size is a **multiple of
48px**. The site originally declared a single 512x512 PNG and had no
`/favicon.ico`, so nothing qualified and search results rendered with no icon at
all. Fixed in PR #23.

**Must stay true**

- `/favicon.ico` returns 200 at the site root. This is the path Google and
  browsers probe *without parsing any HTML*, so it is not optional even though
  the `<link>` tags exist.
- `metadata.icons` in [app/layout.tsx](app/layout.tsx) declares the 48, 96 and
  192 PNGs with explicit `sizes` and `type`, plus the `.ico`.
- Do not collapse this back to one large icon. A lone 512x512 is exactly the
  state that produced no favicon in search results.

**Regenerating the set**

Source of truth is `public/logo/manifest-512.png` (512x512, transparent).
Downscale with `sharp` using the `lanczos3` kernel, preserving transparency, to
48/96/192. The `.ico` wraps PNG payloads (the PNG-compressed icon variant) at
16, 32 and 48.

The generator currently lives at `.verify/gen-favicons.mjs`, but `.verify/` is
gitignored, so **that script is local-only and not available to other
clones**. The parameters above are recorded here so the set can be rebuilt
without it. Moving it to a committed path would be an improvement.

**Known cosmetic issue:** at the 16 to 24px sizes Google actually displays, the
thin contour lines inside the logo's lens collapse into a grey smudge, and the
lens interior goes muddy in dark mode. The silhouette still reads. A simplified
small-size mark with thicker strokes would be better, but that is a design
decision and the artwork is deliberately untouched.

---

## robots.txt is deliberately wide open

[app/robots.ts](app/robots.ts) allows every crawler, including AI crawlers
(GPTBot, ClaudeBot, PerplexityBot and others), and the explicit allow-list is
intentional documentation rather than redundancy. RASID wants to be cited by
answer engines.

**Do not add `Disallow` rules without an explicit product decision.** A stray
`Disallow` on an asset path is unrecoverable from the outside: it would prevent
Google from fetching things like the favicon, and no amount of correct markup
would compensate.

Two things to keep straight when reasoning about it:

- robots.txt governs **crawling, not indexing**. A blocked page can still appear
  in results as a bare URL if other sites link to it. Use `noindex` to keep a
  page out of the index, which requires the page to remain crawlable so the
  directive can be read.
- It is advisory, not access control. Never use it to hide anything sensitive.

---

## Metadata conventions

- `metadataBase` is set once in [app/layout.tsx](app/layout.tsx). Per-route
  pages set their own `alternates.canonical`; the root is self-referencing.
- The SERP `<title>` leads with the primary keyword phrase and child pages get
  a `· RASID` suffix via the template. The social (OG/Twitter) title uses the
  brand tagline instead, so the two are intentionally different strings.
- Descriptions are kept near 150 characters so they do not truncate in results.
- OG and Twitter images are generated by `app/opengraph-image.tsx` and
  `app/twitter-image.tsx`. Next injects the tags, so do not also declare
  `images` by hand in the metadata object.
