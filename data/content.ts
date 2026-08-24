/**
 * All page copy, in one place.
 *
 * Presentation components import from here rather than embedding strings, so
 * the narrative can be edited (or localised) without touching choreography.
 */

/**
 * External destinations — the single source of truth for every product CTA.
 *
 * ▸ GOPILOT_APP_URL — the RASID SaaS application ("Launch GoPilot" / "Sign up").
 *   REPLACE the placeholder below with the real app URL when it exists; every
 *   CTA on the page (navbar, hero, final) follows automatically. It currently
 *   falls back to the in-page GoPilot demo (#gopilot) so nothing 404s — this is
 *   deliberately NOT a fabricated real-looking URL.
 * ▸ CONTACT_HREF — "Talk to RASID" (bespoke projects / contact).
 */
export const GOPILOT_APP_URL = 'https://app.rasid.ai/try-gopilot'; // TODO(rasid): set to https://app.rasid… when live
export const CONTACT_HREF = '#contact';

/** True once GOPILOT_APP_URL points at a real external app (drives target=_blank). */
export const APP_IS_EXTERNAL = /^https?:\/\//.test(GOPILOT_APP_URL);

export const NAV = {
  brand: 'RASID',
  /* Top-level items. An item with `children` opens a hover dropdown; an item
     with `href` navigates. Anchor hrefs are written as '/#id' (not '#id') so
     they resolve from ANY route — on the home page the navbar smooth-scrolls to
     the section; from /services it routes home and lands on it. Real page routes
     (/services) navigate normally. */
  items: [
    {
      label: 'Products',
      href: '/products',
      children: [
        { label: 'GoPilot', href: '/products#gopilot', note: 'The geospatial AI agent' },
        { label: 'GoServers', href: '/products#platform', note: 'MCP servers & API' },
        { label: 'Plugins', href: '/products#plugins', note: 'QGIS & ArcGIS Pro' },
      ],
    },
    {
      label: 'Services',
      href: '/services',
      children: [
        { label: 'Urban', href: '/services#urban', note: 'Buildings, roads & planning' },
        { label: 'Agriculture', href: '/services#agriculture', note: 'Crops, fields & trees' },
        { label: 'Defense', href: '/services#defense', note: 'Tensions & strike verification' },
        { label: 'Environmental', href: '/services#environmental', note: 'Methane & emissions monitoring' },
        { label: 'Transportation', href: '/services#transportation', note: 'Mobility & road safety' },
      ],
    },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Team', href: '/#team' },
    { label: 'Contact Us', href: '/#contact' },
  ],
  cta: { label: 'Launch GoPilot', href: GOPILOT_APP_URL },
} as const;

export const HERO = {
  eyebrow: 'ASK THE EARTH',
  title: ['MEET GOPILOT,', 'YOUR #1 GeoAI AGENT.'],
  tagline: 'Ask in plain language. GoPilot finds the data, selects the right models, runs the analysis, and gives you the answer.',
  body: 'One platform. 10,000+ datasets. Hundreds of AI models. One natural-language interface.',
  // Value-forward acquisition CTA (§12) — this targets new users, so it names the
  // free tokens rather than "sign in". Points at the SaaS app via GOPILOT_APP_URL.
  primary: { label: 'Sign up free. Get 500 tokens', href: GOPILOT_APP_URL },
  //secondary: { label: 'Explore RASID', href: '#gopilot' },
  secondary: { label: '', href: '' },
  scrollHint: 'Scroll to descend',
} as const;

/**
 * "Earth is data" beats — revealed one after another OVER the hero descent (not
 * a separate section any more). Each string is one beat; "\n" is a hard line
 * break within a beat. Order = reveal order.
 */
export const HERO_DATA = [
  'Earth is data.',
  'Billions of pixels.',
  'Almost none of them mean anything\nuntil you ask the right question.',
  'RASID turns Earth observation data into intelligence.',
  'GoPilot makes that intelligence accessible to everyone.',
  //'We turn satellite pixels into measurable information \n & \n measurable information into decisions.',
] as const;

/* ── GoPilot use-case studio (landing feature) ───────────────────────────────
 * The interactive gallery: a list of use cases; picking one plays a short
 * "GoPilot thinking" sequence, then reveals the result. Only `beirut` has real
 * imagery today (base + result overlay, same files as the scroll demo used) —
 * the rest are placeholders: drop a `base` and/or `result` image into /public
 * and fill `stats`, and they light up. `result` is drawn OVER `base` (a
 * segmentation/heatmap overlay); omit `base` for a standalone result image. */
export const GOPILOT_STUDIO = {
  eyebrow: 'Featured product · GoPilot',
  headline: 'What if you could simply ask?',
  body: 'Ask. GoPilot plans the workflow, finds the right data, selects the right models, runs the analysis, and returns the answer.',
  cases: [
    {
      id: 'scene-parse',
      title: 'Scene parsing',
      place: 'Coastal marina · USA',
      question: 'What’s in this scene? Segment everything.',
      steps: [
        'Understanding request',
        'Searching satellite imagery',
        'Selecting optimal imagery',
        'Running scene segmentation',
        'Analyzing results',
      ],
      model: 'rasid/scene-parse v1.4',
      source: 'VHR optical',
      base: '/gopilot/scene-parse-base.webp',
      result: '/gopilot/scene-parse-overlay.webp',
      resultTitle: 'Scene parsed',
      stats: [
        { k: 'Objects', v: '2,172' },
        { k: 'Classes', v: '7' },
        { k: 'Source', v: 'VHR' },
      ],
    },
    {
      id: 'buildings',
      title: 'Building footprints',
      place: 'Paris · Eiffel 2 km',
      question: 'What’s around the Eiffel Tower? Map every building within 2 km.',
      steps: ['Understanding request', 'Fetching building footprints', 'Filtering to 2 km radius', 'Counting'],
      model: 'rasid/footprints',
      source: 'Building footprints',
      base: '/gopilot/buildings-base.webp',
      result: '/gopilot/buildings-overlay.webp',
      resultTitle: 'Buildings mapped',
      stats: [
        { k: 'Buildings', v: '2,236' },
        { k: 'Radius', v: '2 km' },
        { k: 'City', v: 'Paris' },
      ],
    },
    {
      id: 'solar',
      title: 'Solar panels mapping',
      place: 'Datong, China',
      question: 'What’s here? Find the solar installations.',
      steps: ['Understanding request', 'Searching imagery', 'Detecting panels', 'Measuring area'],
      model: 'rasid/solar-pv v3.2',
      source: 'VHR optical',
      base: '/gopilot/solar-base.webp',
      result: '/gopilot/solar-overlay.webp',
      resultTitle: 'Panels detected',
      stats: [
        { k: 'Panel blocks', v: '131' },
        { k: 'Site', v: 'Datong Panda' },
        { k: 'Type', v: 'PV farm' },
      ],
    },
    {
      id: 'trees',
      title: 'Tree counting',
      place: 'Nairobi, Kenya',
      question: 'How many trees are here? Map the canopy.',
      steps: ['Understanding request', 'Searching imagery', 'Detecting crowns', 'Counting canopy'],
      model: 'rasid/canopy v1.8',
      source: 'VHR optical',
      base: '/gopilot/trees-base.webp',
      result: '/gopilot/trees-overlay.webp',
      resultTitle: 'Canopy mapped',
      stats: [
        { k: 'Trees', v: '884' },
        { k: 'Method', v: 'Crown delineation' },
        { k: 'Source', v: 'VHR' },
      ],
    },
    {
      id: 'water',
      title: 'Waterbody monitoring',
      place: 'Lakeland, USA',
      question: 'What waterbodies are here? Map them.',
      steps: ['Understanding request', 'Computing NDWI', 'Extracting water', 'Filtering lakes'],
      model: 'rasid/water',
      source: 'Sentinel-2 · NDWI',
      base: '/gopilot/water-base.webp',
      result: '/gopilot/water-overlay.webp',
      resultTitle: 'Water mapped',
      stats: [
        { k: 'Lakes', v: '153' },
        { k: 'Largest', v: 'Lake Hancock' },
        { k: 'Index', v: 'NDWI' },
      ],
    },
    {
      id: 'wildfire',
      title: 'Wildfire mapping',
      place: 'Madrid, Spain',
      question: 'How severely did this area burn?',
      steps: ['Understanding request', 'Pairing pre/post imagery', 'Computing dNBR difference', 'Grading severity'],
      model: 'rasid/burn',
      source: 'Sentinel-2 · dNBR',
      base: '/gopilot/wildfire-base.webp',
      result: '/gopilot/wildfire-overlay.webp',
      resultTitle: 'Burn severity mapped',
      stats: [
        { k: 'Index', v: 'dNBR (pre − post)' },
        { k: 'High severity', v: '5.7%' },
        { k: 'Basis', v: 'Pre / post NBR' },
      ],
    },
    {
      id: 'methane',
      title: 'Methane detection',
      place: 'Emissions AOI',
      question: 'Where are the methane plumes here?',
      steps: ['Understanding request', 'Ingesting imagery', 'Screening for plumes', 'Quantifying & locating'],
      model: 'rasid/methane',
      source: 'Sentinel 2 ',
      base: '/gopilot/methane-base.webp',
      result: '/gopilot/methane-overlay.webp',
      resultTitle: 'Plume detected',
      stats: [
        { k: 'Estimated flux', v: '1,240 kg/h' },
        { k: 'Source located', v: '± 30 m' },
        { k: 'Area screened', v: '12,400 km²' },
      ],
    },
    {
      id: 'dinov3',
      title: 'Semantic Embeddings',
      place: 'Dubai, UAE',
      question: 'What patterns are similar in this scene?',
      steps: ['Understanding request', 'Fetching imagery', 'Running DINOv3', 'PCA → RGB'],
      model: 'DINOv3',
      source: 'VHR optical',
      base: '/gopilot/dinov3-base.webp',
      result: '/gopilot/dinov3-overlay.webp',
      resultTitle: 'Embeddings',
      stats: [
        { k: 'Model', v: 'DINOv3' },
        { k: 'Output', v: 'PCA → RGB' },
        { k: 'Use', v: 'Similarity search' },
      ],
    },
  ],
} as const;

/* ── Product ecosystem (asset-free sections) ─────────────────────────────── */

export const PRICING_SECTION = {
  eyebrow: 'Pricing',
  headline: 'Start free. Scale when you need to.',
  note: "Tokens are used across GoPilot, GoBox, and RASID's MCP / API services.",
  plans: [
    {
      id: 'free',
      name: 'Free',
      price: '€0',
      cadence: 'forever',
      tokens: '500',
      unit: 'tokens',
      cta: 'Sign up free',
      featured: false,
      desc: 'Explore GoPilot and run your first analyses.',
      tagline: 'Includes',
      features: [
        { t: 'Basic datasets', on: true },
        { t: 'Basic AI models', on: true },
        { t: 'Export Raster and Vector results', on: true },
        { t: 'Session History Management', on: true },
        { t: 'Storage 1 GB', on: true },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '€149',
      cadence: '/mo',
      tokens: '5,000',
      unit: 'tokens',
      cta: 'Start Pro',
      featured: true,
      desc: 'For analysts running recurring geospatial work.',
      tagline: 'Everything in Free, plus',
      features: [
        { t: 'Pro datasets', on: true },
        { t: 'Pro AI models', on: true },
        { t: 'Dashboard', on: true },
        { t: 'GoBox', on: true },
        { t: 'QGIS Plugin', on: true },
        { t: 'Storage 100 GB', on: true },
        { t: 'Personal license', on: true },
        { t: '1 named user', on: true },
      ],
    },
    {
      id: 'scale',
      name: 'Business',
      price: '€499',
      cadence: '/mo',
      tokens: '25,000',
      unit: 'tokens',
      cta: 'Start Business',
      featured: false,
      desc: 'For organizations scaling geospatial intelligence.',
      tagline: 'Everything in Pro, plus',
      features: [
        { t: 'Premium datasets', on: true },
        { t: 'Premium AI models', on: true },
        { t: 'ArcGIS Pro Add-in', on: true },
        { t: 'Storage 1 TB', on: true },
        { t: 'Priority email support', on: true },
        { t: 'Commercial license', on: true },
        { t: '1 named user', on: true },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '',
      cadence: '',
      tokens: '',
      unit: '',
      cta: 'Talk to sales',
      featured: false,
      desc: 'For organizations with custom deployment needs.',
      tagline: 'Everything in Business, plus',
      features: [
        { t: 'MCP connector for AI agents', on: true },
        { t: 'Custom on-prem installation', on: true },
        { t: 'Custom Cloud installation', on: true },
        { t: 'Dedicated account manager', on: true },
      ],
    },
  ],
  spend: ['GoPilot', 'GoBox', 'MCP / API'],
} as const;

/* ── GoServers / MCP (§23) ───────────────────────────────────────────────────
 * Three MCP servers GoPilot orchestrates — and that you can call directly. The
 * capability lists are the real surface; edit them here as servers gain tools. */
export const GOSERVERS_SECTION = {
  eyebrow: 'GoServers · MCP',
  headline: 'Build with RASID.',
  body: 'Everything GoPilot can do is exposed over MCP as three GoServers. Fetch data, run geospatial operations, and run AI models. Orchestrated by GoPilot, or called directly from your own code.',
  center: 'GoPilot',
  servers: [
    {
      name: 'GoServer Fetch',
      tag: 'Data',
      desc: 'Discover and retrieve imagery, embeddings and Earth-observation data.',
      caps: [
        'Sentinel-2 L2A / L1C',
        'Mapbox tiles · all zoom levels',
        'Google imagery tiles',
        'ERA5 climate reanalysis',
        'DEM elevation',
        'Clay embeddings',
        'AlphaEarth embeddings',
        'ESA WorldCover LULC',
        'Source Cooperative datasets',
        '… and more',
      ],
    },
    {
      name: 'GoServer Geo',
      tag: 'Analysis',
      desc: 'Geospatial operations and analysis on GeoJSON and shapefiles.',
      caps: [
        'Buffer & offset',
        'Intersect · union · difference',
        'Dissolve & merge',
        'Reproject (CRS transform)',
        'Area, length & perimeter',
        'Centroid & bounding box',
        'Clip & mask',
        'Zonal statistics',
        'Spatial join',
        'Simplify & smooth',
      ],
    },
    {
      name: 'GoServer AI',
      tag: 'Inference',
      desc: 'Run RASID’s geospatial AI models on imagery.',
      caps: [
        'Field delineation',
        'Solar panel segmentation',
        'Scene parsing',
        'Methane detection',
        'DINOv3 embeddings + PCA',
        'Change detection',
        '… and more',
      ],
    },
  ],
  flow: ['Your application', 'GoServers / MCP', 'RASID capabilities'],
  note: 'Consume the same capabilities through API usage in your own apps, pipelines and agents.',
} as const;

/* ── QGIS + ArcGIS Pro (§24) ─────────────────────────────────────────────────
 * Media lives in public/plugins/. Drop the handed screenshots there:
 *   public/plugins/arcgis.png  — ArcGIS Pro with the GoPilot add-in (left media)
 *   public/plugins/qgis.png    — QGIS with the GoPilot plugin (right media)
 * When the "opening ArcGIS Pro" video is ready, add public/plugins/arcgis.mp4
 * and set `video` below; the component swaps the <img> for a <video>. Until a
 * file exists, each frame shows a clean labelled placeholder. `links` are dummy
 * (#) until the real download/docs routes exist. */
export const PLUGINS_SECTION = {
  eyebrow: 'Plugins',
  headline: 'Bring RASID into your workflow.',
  body: 'Use GoPilot and RASID tools directly inside the GIS environments you already use.',
  primary: {
    label: 'ArcGIS Pro',
    caption: 'GoPilot, docked inside ArcGIS Pro',
    img: '/plugins/arcgis.webp',
    video: '', // e.g. '/plugins/arcgis.mp4' once the video is ready
  },
  secondary: {
    label: 'QGIS',
    caption: 'GoPilot, inside QGIS',
    img: '/plugins/qgis.webp',
    video: '', // e.g. '/plugins/qgis.mp4' once the video is ready
  },
  links: [
    { label: 'QGIS Plugin', href: '#' },
    { label: 'ArcGIS Pro Add-in', href: '#' },
  ],
} as const;

/* ── Partners (§27) ──────────────────────────────────────────────────────────
 * Rendered as a unified monochrome wordmark wall. To use a real brand logo for
 * any partner, drop a white/monochrome SVG or PNG at public/partners/<slug>.svg
 * (or .png) and set `logo: '/partners/<slug>.svg'` on that entry — the component
 * shows the image instead of the wordmark, and falls back to the wordmark if the
 * file is missing. `name` spellings: confirm "Khatib & Alami" and "BeyondBlue
 * Consulting" match the partners' official wordmarks. */
export const PARTNERS_SECTION = {
  eyebrow: 'Partners',
  headline: 'Built with leading organizations.',
  // Real logos live in public/partners/ (see slug). They're rendered monochrome
  // (white on the dark strip, black in light mode) to keep the wall unified; a
  // missing file falls back to the wordmark (`name`). `name` doubles as alt text.
  partners: [
    { name: 'AWS', slug: 'aws', logo: '/partners/aws.png' },
    { name: 'World Bank', slug: 'world-bank', logo: '/partners/world-bank.png' },
    { name: 'ESA', slug: 'esa', logo: '/partners/esa.svg' },
    { name: 'DAIS', slug: 'dais', logo: '/partners/dais.svg' },
    { name: 'BeyondBlue Consulting', slug: 'beyondblue', logo: '/partners/beyondblue.svg' },
    { name: 'TEAMS International', slug: 'teams', logo: '/partners/teams.jpg' },
    { name: 'METAPLANET', slug: 'metaplanet', logo: '/partners/metaplanet.jfif' },
    { name: 'CGI', slug: 'cgi', logo: '/partners/cgi.png' },
  ] as { name: string; slug: string; logo?: string }[],
} as const;

/* ── Proof / AWS credibility (§26) ───────────────────────────────────────────
 * The quote is attributed to a real person, so it is kept verbatim here and
 * NOT paraphrased in the component. Confirm exact wording + title with Phil
 * Cooper / AWS before publishing; edit only this block to change it. `emphasis`
 * must be an exact substring of `quote` (it's highlighted in place). */
export const PROOF_SECTION = {
  eyebrow: 'Recognition',
  headline: 'Built for real-world geospatial AI.',
  markers: [
    { k: 'AWS Generative AI Challenge', v: '2026 · Winner' },
    { k: 'GoPilot launch', v: 'AWS London' },
  ],
  quote:
    'RASID won the AWS Generative AI Challenge because they made satellite data talk back. They’re leading the market by enabling anyone to perform geospatial analysis in natural language.',
  emphasis: 'made satellite data talk back',
  author: 'Phil Cooper',
  role: 'Commercial Lead, Aerospace, Satellite & Defence — AWS',
  initials: 'PC',
} as const;

/* ── Environmental service — methane monitoring (featured in the landing story).
 * Real detection imagery is dropped into public/ (see baseImage/overlayImage);
 * until the files exist the section falls back to a neutral grey plate. */
export const METHANE_SECTION = {
  eyebrow: 'Services · Environmental',
  headline: 'See methane before it escapes.',
  body: 'GoPilot screens satellite imagery for methane plumes across sites and pipelines — quantifying the leak rate and pinpointing the source, so operators act in hours, not months.',
  question: 'Detect methane emissions across this site.',
  steps: [
    { id: 'ingest', label: 'Ingesting imagery', detail: 'Sentinel-5P · TROPOMI · VHR optical' },
    { id: 'screen', label: 'Screening for plumes', detail: 'rasid/methane · atmospheric retrieval' },
    { id: 'quantify', label: 'Quantifying & locating', detail: 'Flux rate · source geolocation' },
  ],
  /* Drop the real detection scene here (see /public). object-cover, same as the
     Beirut scene-parse, so base and overlay align. */
  baseImage: '/gopilot/methane-base.webp',
  overlayImage: '/gopilot/methane-overlay.webp',
  source: 'Sentinel-5P TROPOMI · methane column (ppb)',
  resultTitle: 'Plume detected',
  stats: [
    { k: 'Estimated flux', v: '1,240 kg/h' },
    { k: 'Source located', v: '± 30 m' },
    { k: 'Area screened', v: '12,400 km²' },
  ],
  cta: { label: 'Explore all services', href: '/services' },
} as const;

/* ── Products bridge — the slim band on the LANDING page after the featured
 * GoPilot demo, pointing to the full /products page (GoPilot + GoServers +
 * Plugins). GoServers and Plugins no longer live on the landing. */
export const PRODUCTS_BRIDGE = {
  eyebrow: 'The product suite',
  headline: 'GoPilot our Main Product.',
  body: 'GoServers exposes every capability over MCP, and our plugins bring RASID into QGIS and ArcGIS Pro. See how they fit together.',
  cta: { label: 'See all products', href: '/products' },
} as const;

/* ── /products full page — the RASID product suite (GoPilot, GoServers, Plugins
 * rendered in full). This header sits above them. */
export const PRODUCTS_PAGE = {
  eyebrow: 'Products',
  headline: 'One engine. Three ways to use it.',
  body: 'GoPilot is the agent, GoServers is the API, and our plugins live inside the GIS tools you already use — all powered by the same RASID models and imagery.',
} as const;

/* ── Team — scaffolded with placeholders. Swap `members` for the real people
 * (add `photo: '/team/<slug>.webp'` to any member to show a photo instead of
 * the initials monogram). `linkedin` is optional per member. */
export const TEAM_SECTION = {
  eyebrow: 'Team',
  headline: 'The people behind RASID.',
  body: 'Geospatial scientists, ML engineers and GIS specialists building the interface to Earth.',
  // `bio` and `expertise` are shown in the hover overlay. Bios are short,
  // editable placeholders — replace with the real wording. `linkedin`/`email`
  // default to the company channels in the component; set them per-person to
  // point at individual profiles.
  members: [
    {
      name: 'Dr. Ali J. Ghandour',
      role: 'AI R&D Consultant',
      initials: 'AG',
      photo: '/team/member-1.webp',
      expertise: 'Vision & Strategy',
      bio: 'Leads RASID’s vision making geospatial intelligence accessible to anyone who can ask a question.',
    },
    {
      name: 'Reda Haidar',
      role: 'Commercial Director',
      initials: 'RH',
      photo: '/team/member-2.webp',
      expertise: 'Growth & Partnerships',
      bio: 'Drives partnerships and growth across sectors and markets.',
    },
    {
      name: 'Hasan Nasrallah',
      role: 'Lead AI Engineer',
      initials: 'HN',
      photo: '/team/member-3.webp',
      expertise: 'Deep Learning · EO',
      bio: 'Builds RASID’s geospatial models, segmentation, detection and change analysis.',
    },
    {
      name: 'Hasan Wehbi',
      role: 'AI R&D Engineer',
      initials: 'HW',
      photo: '/team/member-4.webp',
      expertise: 'Research · Models',
      bio: 'Researches and prototypes the next generation of RASID’s models.',
    },
    {
      name: 'Mohamad Moussawi',
      role: 'Lead Full Stack Engineer',
      initials: 'MM',
      photo: '/team/member-5.webp',
      expertise: 'Platform · Product',
      bio: 'Builds the RASID platform end to end from GoPilot to GoServers.',
    },
    {
      name: 'Amira Al Halabi',
      role: 'Sales & Marketing Engineer',
      initials: 'AH',
      photo: '/team/member-6.webp',
      expertise: 'Sales & Marketing',
      bio: 'Connects RASID’s capabilities to the people and sectors that need them.',
    },
  ] as {
    name: string;
    role: string;
    initials: string;
    photo?: string;
    expertise?: string;
    bio?: string;
    linkedin?: string;
    email?: string;
  }[],
  // note: 'We’re growing the team — reach out if you want to build with us.',
} as const;

/* ── Contact — a booking embed (Calendly or similar). Set CONTACT_BOOKING_URL to
 * the real scheduling link; until then the section shows the direct channels and
 * a disabled "booking coming" state instead of an empty iframe. */
export const CONTACT_BOOKING_URL = 'https://calendly.com/alighandour/30min'; // TODO(rasid): paste Calendly/booking URL
export const CONTACT_SECTION = {
  eyebrow: 'Contact',
  headline: 'Let’s talk.',
  body: 'Book a call and we’ll show you what GoPilot can do with your data or reach us directly.',
  bookingUrl: CONTACT_BOOKING_URL,
  channels: [
    { label: 'Email', value: 'info@rasid.ai', href: 'mailto:info@rasid.ai' },
    { label: 'LinkedIn', value: 'rasid-ai', href: 'https://www.linkedin.com/company/rasid-ai/' },
    { label: 'YouTube', value: '@RASIDAI', href: 'https://www.youtube.com/@RASIDAI' },
  ],
} as const;

/* ── /services full page — one card per sector. Placeholder copy; refine freely.
 * `id` matches the navbar dropdown anchors (/services#<id>). `status: 'live'`
 * marks a shipped service; others read as available offerings. */
/* ── /services — bespoke projects. These are the KINDS of work RASID takes on
 * for clients (real examples, some with named partners), not a fixed product
 * grid. Drop a representative image per service at public/services/<id>.webp
 * (16:10-ish); until then a labelled placeholder shows. Edit copy freely. */
export const SERVICES_PAGE = {
  eyebrow: 'Services',
  headline: 'Bespoke geospatial projects.',
  body: 'RASID takes on real-world projects for clients and partners, powered by GoPilot, our models and imagery. Here’s the kind of work we take on, and some of what we’ve built.',
  services: [
    {
      id: 'urban',
      name: 'Urban',
      summary: 'Turning imagery into building, road and settlement analytics for planning at city and national scale.',
      examples: [
        'Building & road counting',
        'Urban & settlement planning',
        'Solar-panel detection & counting',
        'Scene parsing & land-use mapping',
      ],
      image: '/services/urban.webp',
    },
    {
      id: 'agriculture',
      name: 'Agriculture',
      summary: 'Crop and land intelligence, from national crop mapping to field-level disease early-warning.',
      examples: [
        'National wheat mapping across Lebanon from Sentinel-2',
        'Banana-plant monitoring flagging TR4 disease anomalies from the field (Lebanon)',
        'Field boundary detection',
        'Phenology analysis',
        'Olive tree detection & monitoring',
        'Tree counting',
      ],
      image: '/services/agriculture.webp',
    },
    {
      id: 'defense',
      name: 'Defense',
      summary: 'Ask GoPilot about global tensions and strike sites with imagery-backed verification.',
      examples: [
        'Q&A on tensions & strike locations',
        'Before/after change detection at strike sites',
        'Strike confirmation by locating smoke plumes from imagery',
      ],
      image: '/services/defense.webp',
    },
    {
      id: 'environmental',
      name: 'Environmental',
      // partner: 'With DAIS',
      summary: 'Emissions and land monitoring from satellite currently monitoring methane in Brazil with DAIS.',
      examples: [
        'Methane monitoring in Brazil (with DAIS)',
        'Deforestation & land-cover change',
        'Water & coastline monitoring',
      ],
      image: '/services/environmental.webp',
    },
    {
      id: 'transportation',
      name: 'Transportation',
      // partner: 'With the World Bank',
      summary: 'Mobility and road-safety intelligence from satellite imagery and video.',
      examples: [
        'Vehicle speed mapping from satellite video (with the World Bank)',
        'iRAP road-safety automation',
        'Road & rail network extraction',
      ],
      image: '/services/transportation.webp',
    },
  ] as {
    id: string;
    name: string;
    summary: string;
    examples: string[];
    image: string;
    partner?: string;
  }[],
  cta: { label: 'Talk to RASID', href: '/#contact' },
} as const;

export const DECISION_SECTION = {
  lines: [
    { id: 'pixels', text: 'Pixels aren’t decisions.' },
    { id: 'data', text: 'Data isn’t insight.' },
    { id: 'insight', text: 'Insight becomes valuable when it changes what you do next.' },
    { id: 'from', text: 'From pixels to decisions.' },
  ],
} as const;

export const FINAL_SECTION = {
  headline: 'See Earth differently.',
  body: 'Ask questions. Run models. Explore the planet. Turn geospatial data into decisions.',
  primary: { label: 'Launch GoPilot', href: GOPILOT_APP_URL },
  secondary: { label: 'Talk to RASID', href: CONTACT_HREF },
} as const;

export const FOOTER = {
  brand: 'RASID',
  tagline: 'GoPilot is the interface to Earth.',
  // Ecosystem nav. Anchor hrefs use '/#id' so they work from any route (home or
  // /services); real routes (/services) navigate normally, external URLs open in
  // a new tab, and mailto: hands off to the mail client.
  columns: [
    {
      title: 'Products',
      links: [
        { label: 'GoPilot', href: '/products#gopilot' },
        { label: 'GoServers / MCP', href: '/products#platform' },
        { label: 'Plugins', href: '/products#plugins' },
        { label: 'API Documentation', href: '/products#platform' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Environmental', href: '/services#environmental' },
        { label: 'Urban', href: '/services#urban' },
        { label: 'Agriculture', href: '/services#agriculture' },
        { label: 'All services', href: '/services' },
      ],
    },
    {
      title: 'Company',
      links: [
        // "What we do" drops the reader into the narrative that starts under the
        // hero — the GoPilot act, where the product tells its own story.
        { label: 'What we do', href: '/#gopilot' },
        { label: 'Team', href: '/#team' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'Contact Us', href: '/#contact' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/company/rasid-ai/' },
        { label: 'YouTube', href: 'https://www.youtube.com/@RASIDAI' },
        { label: 'info@rasid.ai', href: 'mailto:info@rasid.ai' },
      ],
    },
  ],
  legal: '© 2026 RASID. All rights reserved.',
  note: 'Imagery shown is procedurally generated for demonstration.',
} as const;
