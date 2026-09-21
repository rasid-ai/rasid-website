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
        { label: 'GoServers', href: '/products#mcps', note: 'MCP servers & API' },
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
        { label: 'AI Consultancy', href: '/services#ai-consultancy', note: 'Custom AI, OCR & advisory' },
      ],
    },
    { label: 'Pricing', href: '/#pricing' },
    {
      // No href: 'Company' is a dropdown trigger, not a page. Children mix full
      // routes (About, Case Studies) with home-page sections (Team, Contact) —
      // the navbar handler resolves both from any route.
      label: 'Company',
      children: [
        { label: 'About', href: '/about', note: 'Who we are' },
        { label: 'Team', href: '/#team', note: 'The people behind RASID' },
        { label: 'Case Studies', href: '/case-studies', note: 'Selected projects' },
        { label: 'Contact', href: '/#contact', note: 'Get in touch' },
      ],
    },
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
  'RASID turns Earth observation data into intelligence. \n GoPilot makes it accessible to everyone.',
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
      cadence: 'per month',
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
      cadence: 'per month',
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
      cadence: 'per month',
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
      price: 'Custom',
      cadence: 'tailored to your deployment',
      tokens: 'Custom',
      unit: 'tokens number',
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
 * Three MCP servers GoPilot orchestrates on every plan — and that Enterprise
 * customers can also call directly. The capability lists are the real surface;
 * edit them here as servers gain tools. */
export const GOSERVERS_SECTION = {
  eyebrow: 'GoServers · MCP',
  headline: 'Build with RASID.',
  body: 'Everything GoPilot can do is exposed over MCP as three GoServers. Fetch data, run geospatial operations, and run AI models. Orchestrated by GoPilot on every plan, with direct MCP / API access on the Enterprise plan.',
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
  note: 'Enterprise customers consume the same capabilities through direct MCP / API access in their own apps, pipelines and agents.',
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
    { label: 'QGIS Plugin', href: 'https://plugins.qgis.org/plugins/rasid_plugin/version/0.2.5/download/' },
    { label: 'ArcGIS Pro Add-in', href: 'https://github.com/rasid-ai/arcgispro_addin_gopilot/releases/latest/download/RASID.esriAddinX' },
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
    { name: 'OGC', slug: 'ogc', logo: '/partners/ogc.svg' },
    { name: 'DAIS', slug: 'dais', logo: '/partners/dais.svg' },
    { name: 'BeyondBlue Consulting', slug: 'beyondblue', logo: '/partners/beyondblue.svg' },
    { name: 'TEAMS International', slug: 'teams', logo: '/partners/teams.png' },
    { name: 'METAPLANET', slug: 'metaplanet', logo: '/partners/metaplanet.png' },
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
  /* Verbatim quotes from real people — no paraphrasing. `emphasis`, when it
     appears in the quote, is highlighted in the accent colour in place. */
  testimonials: [
    {
      quote:
        'What impressed me about RASID is their ability to bring together Earth observation, geospatial technologies, and AI into practical solutions. GoPilot is a strong example of this, combining advanced AI with geospatial data and tools to simplify complex analysis. It has been exciting to see the team develop this capability and we look forward to seeing what they build next.',
      emphasis: 'bring together Earth observation, geospatial technologies, and AI into practical solutions',
      author: 'Miriam Puertos',
      role: 'Partner Manager, AWS',
      initials: 'MP',
    },
    {
      quote:
        'I was impressed by GoPilot’s detailed reasoning and its ability to autonomously adapt its workflow to complex geospatial queries. It successfully produced the requested raster and vector outputs, and its capabilities stood out compared with other geospatial AI systems I have tested.',
      emphasis: 'stood out compared with other geospatial AI systems I have tested',
      author: 'Giulio Poggi',
      role: 'Post-doc researcher, Centre for Cultural Heritage Technology (CCHT), Istituto Italiano di Tecnologia (IIT)',
      initials: 'GP',
    },
    {
      quote:
        'A lot of the work behind RASID’s success happens behind the scenes, but the results are clear to see. The team has put in a tremendous amount of work to turn their vision into a working product, and GoPilot is a great example of what they have achieved. We are happy at AWS to have contributed to this success.',
      emphasis: 'the results are clear to see',
      author: 'Phil Cooper',
      role: 'Commercial Lead, Aerospace, Satellite & Defence, AWS',
      initials: 'PC',
    },
    {
      quote:
        'Using GoPilot gave me a different perspective on how geospatial analysis can be approached. I was particularly interested in exploring how it could be applied to different challenges across the Arab region, and I see significant potential for developing practical use cases around the needs of the region.',
      emphasis: 'significant potential for developing practical use cases around the needs of the region',
      author: 'Dr Osama Rayis',
      role: 'Chair of Agripreneurship, AOAD',
      initials: 'OR',
    },
  ],
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
      linkedin: 'https://www.linkedin.com/in/alighandour/',
      email: 'aghandour@rasid.ai',
    },
    {
      name: 'Reda Haidar',
      role: 'Commercial Director',
      initials: 'RH',
      photo: '/team/member-2.webp',
      expertise: 'Growth & Partnerships',
      bio: 'Drives partnerships and growth across sectors and markets.',
      linkedin: 'https://www.linkedin.com/in/redahaidar/',
      email: 'reda@rasid.ai',
    },
    {
      name: 'Hasan Nasrallah',
      role: 'Lead AI Engineer',
      initials: 'HN',
      photo: '/team/member-3.webp',
      expertise: 'Deep Learning · EO',
      bio: 'Builds RASID’s geospatial models, segmentation, detection and change analysis.',
      linkedin: 'https://www.linkedin.com/in/hasannasrallah-ai/',
      email: 'hasan@rasid.ai',
    },
    {
      name: 'Hasan Wehbi',
      role: 'AI R&D Engineer',
      initials: 'HW',
      photo: '/team/member-4.webp',
      expertise: 'Research · Models',
      bio: 'Researches and prototypes the next generation of RASID’s models.',
      linkedin: 'https://www.linkedin.com/in/hassan-wehbi-3b0b28234/',
      email: 'hwehbi@rasid.ai',
    },
    {
      name: 'Mohamad Moussawi',
      role: 'Lead Full Stack Engineer',
      initials: 'MM',
      photo: '/team/member-5.webp',
      expertise: 'Platform · Product',
      bio: 'Builds the RASID platform end to end from GoPilot to GoServers.',
      linkedin: 'https://www.linkedin.com/in/lesawe/',
      email: 'sawe@rasid.ai',
    },
    {
      name: 'Amira Al Halabi',
      role: 'Sales & Marketing Engineer',
      initials: 'AH',
      photo: '/team/member-6.webp',
      expertise: 'Sales & Marketing',
      bio: 'Connects RASID’s capabilities to the people and sectors that need them.',
      linkedin: 'https://www.linkedin.com/in/amira-el-halabi-6b3b77351/',
      email: 'amira@rasid.ai',
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
export const CONTACT_BOOKING_URL = 'https://calendly.com/rasid/30mins'; // TODO(rasid): paste Calendly/booking URL
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

/* ── Offices — RASID is based in France and Lebanon. One source of truth for the
 * detailed addresses in the Contact section, the compact line in the footer, and
 * the PostalAddress entries in the Organization JSON-LD (app/layout.tsx). The
 * structured `postal` fields exist so the JSON-LD stays accurate without parsing
 * the display `lines`. */
export const OFFICES = [
  {
    city: 'Paris',
    country: 'France',
    lines: ['47 rue Vivienne', '75002 Paris', 'France'],
    postal: {
      streetAddress: '47 rue Vivienne',
      postalCode: '75002',
      addressLocality: 'Paris',
      addressCountry: 'FR',
    },
  },
  {
    city: 'Beirut',
    country: 'Lebanon',
    lines: ['Badaro Building 4961, 3rd Floor', 'Badaro Street, Al Mathaf', 'Beirut 1100', 'Lebanon'],
    postal: {
      streetAddress: 'Badaro Building 4961, 3rd Floor, Badaro Street, Al Mathaf',
      postalCode: '1100',
      addressLocality: 'Beirut',
      addressCountry: 'LB',
    },
  },
] as const;

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
    {
      id: 'ai-consultancy',
      name: 'AI Consultancy',
      summary: 'Beyond geospatial, RASID advises on and builds custom AI solutions from strategy to production, including OCR and document intelligence.',
      examples: [
        'AI strategy & advisory',
        'OCR & document intelligence',
        'Custom model development',
        'Computer-vision solutions',
        'LLM & agent integration',
        'ML deployment & MLOps',
      ],
      image: '/services/ai-consultancy.webp',
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
        { label: 'GoServers / MCP', href: '/products#mcps' },
        { label: 'Plugins', href: '/products#plugins' },
        { label: 'API Documentation', href: '/products#mcps' },
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
        { label: 'Case studies', href: '/case-studies' },
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

/* ── About + FAQ ─────────────────────────────────────────────────────────────
 * Server-rendered, crawlable content (rendered by components/content/AboutContent
 * as real <h2>/<h3>/<p>, NOT behind ssr:false/LazySection) so search engines and
 * LLMs get substantive, quotable, entity-consistent text and FAQPage structured
 * data. Direct-answer-first, self-contained sentences (GEO best practice). Keep
 * "RASID" (org) and "GoPilot" (product) spelled consistently everywhere. */
export const ABOUT_CONTENT = {
  eyebrow: 'About RASID',
  headline: 'Seeing Earth, smarter.',
  intro:
    'RASID is a geospatial-AI company that builds GoPilot, an AI agent for Earth observation. Ask GoPilot a question about the planet in plain language, and it finds the right satellite data, selects the right AI models, runs the analysis, and returns raster and vector answers, with no GIS expertise required. RASID turns billions of satellite pixels into decision-ready intelligence through a single natural-language interface.',
  blocks: [
    {
      h: 'What GoPilot is',
      p: 'GoPilot is an AI geospatial agent. It connects a large language model to a toolbox of Earth-observation data sources and computer-vision models, then plans and runs the workflow needed to answer a question. Instead of manually searching imagery catalogues, writing GIS scripts, and stitching model outputs together, you describe the outcome you want and GoPilot produces it.',
    },
    {
      h: 'How GoPilot works',
      p: 'GoPilot answers a question in four steps. First it interprets the request and plans a workflow. Second it fetches the right imagery and Earth-observation data. Third it selects and runs the appropriate AI models such as segmentation, detection, or change analysis. Fourth it returns the result as downloadable raster and vector layers, alongside the numbers that matter. Every step is shown, so the analysis is auditable rather than a black box.',
    },
    {
      h: 'One interface over 10,000+ datasets',
      p: 'GoPilot reaches more than 10,000 datasets and hundreds of AI models through one interface. Data sources include Sentinel-2 optical imagery, high-resolution optical imagery, DEM elevation, ERA5 climate reanalysis, and foundation-model embeddings such as Clay and AlphaEarth. Because the whole catalogue sits behind natural language, a first-time user and a remote-sensing specialist ask in exactly the same way.',
    },
    {
      h: 'GoServers and plugins',
      p: 'Everything GoPilot can do is exposed over the Model Context Protocol (MCP) as three GoServers: GoServer Fetch for data, GoServer Geo for geospatial operations, and GoServer AI for model inference. GoPilot orchestrates these on every plan; Enterprise customers can also call them directly from their own agents and code. RASID also ships plugins that bring GoPilot into QGIS and ArcGIS Pro, so existing GIS teams keep their tools and gain an AI copilot.',
    },
    {
      h: 'Where RASID works',
      p: 'RASID delivers projects across five sectors. In agriculture it maps national crops, delineates fields, and detects trees and disease. In urban analysis it counts buildings and roads and detects solar installations. In environmental monitoring it screens for methane plumes and tracks deforestation and water change. In defense it verifies strike sites with before-and-after change detection. In transportation it maps vehicle speed from satellite video and automates road-safety assessment.',
    },
    {
      h: 'Recognition and offices',
      p: 'RASID won the AWS Generative AI Challenge in 2026. The company is based in Paris, France and Beirut, Lebanon, and works with partners including AWS, the World Bank, OGC, and DAIS. You can reach the team at info@rasid.ai.',
    },
  ],
} as const;

/* FAQ — visible on the page AND emitted as FAQPage JSON-LD. Each answer is a
 * complete, self-contained statement (≤3 sentences) an LLM can lift verbatim. */
export const FAQ = [
  {
    q: 'What is GoPilot?',
    a: 'GoPilot is RASID’s AI geospatial agent. You ask a question about Earth in plain language, and GoPilot finds the right satellite data, selects the right AI models, runs the analysis, and returns raster and vector results, without needing GIS expertise.',
  },
  {
    q: 'What data and AI models does GoPilot use?',
    a: 'GoPilot reaches more than 10,000 datasets and hundreds of AI models through one interface, including Sentinel-2 imagery, high-resolution optical imagery, DEM elevation, ERA5 climate data, and foundation-model embeddings such as Clay and AlphaEarth. It runs segmentation, object-detection, and change-detection models on top of that data.',
  },
  {
    q: 'How much does GoPilot cost?',
    a: 'GoPilot has four plans: Free at €0 per month with 500 tokens, Pro at €149 per month with 5,000 tokens, Business at €499 per month with 25,000 tokens, and Enterprise with custom pricing plus on-premise or cloud deployment. Tokens are shared across GoPilot, GoBox, and RASID’s MCP and API services.',
  },
  {
    q: 'Can I use GoPilot inside QGIS or ArcGIS Pro?',
    a: 'Yes. RASID ships plugins that bring GoPilot into QGIS and ArcGIS Pro, so GIS professionals can run RASID’s models and workflows directly inside the tools they already use.',
  },
  {
    q: 'Does GoPilot offer an API or MCP access?',
    a: 'Yes, on the Enterprise plan. Every GoPilot capability is exposed over the Model Context Protocol (MCP) as three GoServers: GoServer Fetch for data, GoServer Geo for analysis, and GoServer AI for model inference. Enterprise customers call these directly from their own agents and code; on every plan, GoPilot orchestrates them for you.',
  },
  {
    q: 'What can GoPilot do for agriculture and environmental monitoring?',
    a: 'For agriculture, GoPilot maps crops at national scale, delineates field boundaries, and detects trees and crop disease. For the environment, it screens satellite imagery for methane plumes, estimating leak rate and locating the source, and tracks deforestation, land-cover change, and water and coastline change.',
  },
  {
    q: 'What can GoPilot do for defense and urban planning?',
    a: 'For defense, GoPilot answers questions about tensions and strike sites and verifies them with before-and-after change detection. For urban planning, it counts buildings and roads, maps land use, and detects and counts solar installations from high-resolution imagery.',
  },
  {
    q: 'Who is RASID and where is it based?',
    a: 'RASID is a geospatial-AI company that builds GoPilot. It won the AWS Generative AI Challenge in 2026 and has offices in Paris, France and Beirut, Lebanon. You can reach the team at info@rasid.ai.',
  },
  {
    q: 'Is the imagery shown on this site real?',
    a: 'The animated globe and some demo overlays on this marketing site are procedurally generated for illustration. RASID’s production analyses run on real Sentinel-2 and other Earth-observation imagery and return real raster and vector outputs to customers.',
  },
] as const;

/* ── Case studies / articles ─────────────────────────────────────────────────
 * Real, published case studies sourced from the RASID capability portfolio.
 * Each has a `context` line (programme / client / year), a one-line `summary`,
 * and `sections` (Problem / Approach / Result) rendered as the article body.
 * `authorInitials` matches a TEAM_SECTION member so the Article links to that
 * person's Person schema. status:'published' -> indexed + in the sitemap.
 * Rendered by app/case-studies/[slug]; listed on app/case-studies. */
export const CASE_STUDIES_PAGE = {
  eyebrow: 'Case studies',
  headline: 'Selected work.',
  body: 'A decade of funded, delivered projects: the problem, the approach, and the result. From landfill methane detection to an award-winning AI geospatial agent.',
} as const;

export const CASE_STUDIES = [
  {
    slug: 'gopilot-ai-geospatial-agent',
    title: 'GoPilot: RASID’s AI geospatial agent',
    sector: 'Platform',
    date: '2026-08-01',
    authorInitials: 'HN',
    status: 'published',
    summary:
      'A conversational AI agent that puts RASID’s remote-sensing stack in front of analysts through plain-language requests.',
    context: 'AWS Bedrock · Flagship platform · 2026',
    sections: [
      { h: 'The problem', p: 'Geospatial analysis workflows require specialist GIS skills and manual scripting for every new task, which keeps Earth observation out of reach for most teams.' },
      { h: 'The approach', p: 'GoPilot is built on AWS Bedrock and the Strands agent framework, with Claude as the LLM backbone and SAM3 and DINOv3 vision pipelines for detection and segmentation. It reaches analysts through a QGIS plugin and an ArcGIS Pro add-in, so teams work in the tools they already use.' },
      { h: 'The result', p: 'GoPilot won the AWS Geospatial Gen AI Challenge in August 2026, and has been piloted with national mapping agencies including CIGN in Côte d’Ivoire and OSGOF in Nigeria.' },
    ],
  },
  {
    slug: 'methanemapper-landfill-detection',
    title: 'MethaneMapper: detecting landfill methane plumes from space',
    sector: 'Environmental',
    date: '2025-11-01',
    authorInitials: 'HN',
    status: 'published',
    summary:
      'A satellite system that detects and quantifies methane plumes from landfill sites using multi- and hyperspectral imagery.',
    context: 'EBRD Climate Change Innovation Programme · 2025 · €27,000',
    sections: [
      { h: 'The problem', p: 'Landfill methane is a major but under-monitored contributor to greenhouse-gas emissions, and there has been no consistent way to detect plumes at scale.' },
      { h: 'The approach', p: 'RASID applied multi-modality AI to multispectral and hyperspectral satellite imagery to detect and quantify methane plumes, fine-tuning the models against ground-truth measurements.' },
      { h: 'The result', p: 'The project delivered a working plume-detection pipeline under an EBRD Climate Change Innovation Programme grant of €27,000, from May to November 2025. RASID has since extended methane monitoring commercially, including a two-phase project for a Brazilian firm, and is building a synthetic methane-plume dataset for satellite MRV under a follow-on EBRD grant.' },
    ],
  },
  {
    slug: 'bananasight-tr4-lebanon',
    title: 'BananaSight: early warning for Fusarium Wilt (TR4)',
    sector: 'Agriculture',
    date: '2025-09-01',
    authorInitials: 'AG',
    status: 'published',
    summary:
      'Real-time monitoring for banana plantations that flags early stress and TR4 disease from Sentinel-2 imagery, before symptoms are visible.',
    context: 'EBRD Lebanon Innovation Programme · 2025 · €30,000',
    sections: [
      { h: 'The problem', p: 'Fusarium Wilt Tropical Race 4 (TR4) can devastate a banana plantation before any visible symptoms appear, and growers have had no early-warning tool to act in time.' },
      { h: 'The approach', p: 'BananaSight analyses Sentinel-2 multispectral imagery to detect stress and disease signatures ahead of a visible outbreak, alerting farmers to at-risk areas.' },
      { h: 'The result', p: 'Delivered under an EBRD Lebanon Innovation Programme grant of €30,000, from March to September 2025, BananaSight is the first commercially-ready multispectral solution of its kind.' },
    ],
  },
  {
    slug: 'c-ard-analysis-ready-data',
    title: 'C-ARD: raw satellite imagery into corrected Analysis-Ready Data',
    sector: 'Imagery quality',
    date: '2026-01-01',
    authorInitials: 'HW',
    status: 'published',
    summary:
      'An AI pipeline that automatically corrects geometric and radiometric anomalies in high-resolution imagery, turning raw data into Analysis-Ready Data.',
    context: 'Private satellite-imagery provider · 2026',
    sections: [
      { h: 'The problem', p: 'Imagery providers battle geometric distortion, inconsistent radiometry, and atmospheric interference from cloud, haze and shadow, which drives high rejection rates. Manual correction is slow, costly, and does not scale.' },
      { h: 'The approach', p: 'C-ARD combines deep-learning co-registration and orthorectification, radiometric enhancement, and automatic cloud, haze and shadow detection and removal, with a human-in-the-loop GUI. It deploys in the cloud, on-premise, or on-orbit (EC-ARD).' },
      { h: 'The result', p: 'The client-ready pipeline processes roughly 200 GB in about 2 hours, turning more captures into sellable imagery while cutting QA cost and accelerating delivery for a private imagery provider.' },
    ],
  },
] as {
  slug: string;
  title: string;
  sector: string;
  date: string;
  authorInitials: string;
  status: 'draft' | 'published';
  summary: string;
  context: string;
  sections: { h: string; p: string }[];
}[];
