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
  body: 'GoPilot\'s geospatial capabilities are exposed over MCP through four GoServers. Fetch data, run geospatial operations, and run AI models. Orchestrated by GoPilot, or called directly from your own code.',
  center: 'GoPilot-MCPs',
  servers: [
    {
      name: 'GoServer-Fetch',
      tag: 'Data',
      desc: 'Discover and retrieve 10, 000+ dataet including imagery, embeddings and vector data.',
      caps: [
        'Sentinel-2 L2A / L1C',
        'Mapbox tiles · all zoom levels',
        'ERA5 climate reanalysis',
        'DEM layer',
        'Clay embeddings',
        'AlphaEarth embeddings',
        'ESA WorldCover LULC',
        'Source Cooperative datasets',
        '… and more',
      ],
    },
    {
      name: 'GoServer-Geo',
      tag: 'Geospatial',
      desc: 'Geospatial operations on GeoJSON and shapefiles.',
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
      name: 'GoServer-AI',
      tag: 'Inference',
      desc: 'Run geospatial AI models on imagery.',
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
  headline: 'Applied GeoAI for real-world challenges.',
  body: 'RASID works with organizations to turn Earth observation data into actionable intelligence. We build and deploy solutions tailored to specific operational needs.',
  services: [
    {
      id: 'urban',
      name: 'Urban',
      summary: 'Geospatial intelligence for understanding buildings, infrastructure, land use, and urban growth at city and national scale.',
      examples: [
        'Building & road mapping',
        'Urban & settlement analysis',
        'Solar-panel detection & counting',
        'Scene parsing & land-use mapping',
      ],
      image: '/services/urban.webp',
    },
    {
      id: 'agriculture',
      name: 'Agriculture',
      summary: 'Earth observation and AI for crop mapping, field monitoring, and agricultural intelligence from field to national scale.',
      examples: [
        'National wheat mapping from Sentinel-2',
        'Banana-plant monitoring & TR4 disease anomaly detection',
        'Field boundary detection',
        'Crop phenology analysis',
        'Olive tree detection & monitoring',
        'Plam oil tree mapping',
      ],
      image: '/services/agriculture.webp',
    },
    {
      id: 'defense',
      name: 'Defense',
      summary: 'Satellite-based intelligence for monitoring changes, infrastructure, and areas of interest.',
      examples: [
        'Change detection at sites of interest',
        'Before/after imagery analysis',
        'Infrastructure and scene analysis',
        'Imagery-based event verification',
      ],
      image: '/services/defense.webp',
    },
    {
      id: 'environmental',
      name: 'Environmental',
      // partner: 'With DAIS',
      summary: 'Satellite-based monitoring of emissions, ecosystems, land, and water to support environmental decision-making.',
      examples: [
        'Methane quantification',
        'Deforestation & land-cover change',
        'Water-body monitoring',
        'Coastline monitoring',
      ],
      image: '/services/environmental.webp',
    },
    {
      id: 'transportation',
      name: 'Transportation',
      // partner: 'With the World Bank',
      summary: 'Earth observation and GeoAI for road, mobility, and transportation intelligence.',
      examples: [
        'Vehicle speed mapping from satellite data',
        'iRAP road-safety automation',
        'Road & rail network extraction',
        'Transportation network analysis',
      ],
      image: '/services/transportation.webp',
    },
    {
      id: 'ai-consultancy',
      name: 'AI Consultancy',
      summary: 'Beyond geospatial, RASID helps organisations turn AI ideas into production systems, from strategy and model development to deployment and integration.',
      examples: [
        'AI strategy & advisory',
        'Custom AI model development',
        'Computer-vision solutions',
        'OCR & document intelligence',
        'Custom model development',
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
 * data. Direct-answer-first, self-contained sentences (GEO best practice).
 * Keep "RASID" (org) and "GoPilot" (product) spelled consistently everywhere.
 */
export const ABOUT_CONTENT = {
  eyebrow: 'About RASID',
  headline: 'Seeing Earth, smarter.',
  intro:
    'RASID is a boutique geospatial technology and consultancy company specializing in Earth Observation, remote sensing and GeoAI. We combine satellite data, geospatial analysis, computer vision and AI to build practical solutions for real-world challenges. Our work spans product development through GoPilot and bespoke geospatial R&D and consulting projects.',

  blocks: [
    {
      h: 'What RASID is',
      p: 'RASID is a geospatial technology and consultancy company specializing in Earth Observation, remote sensing and GeoAI. We combine satellite data, geospatial analysis, computer vision, AI and software engineering to turn complex Earth-observation data into actionable intelligence. Our two main activities are developing GoPilot, our flagship AI geospatial product, and delivering bespoke geospatial R&D and consulting projects.',
    },

    {
      h: 'What GoPilot is',
      p: 'GoPilot is RASID’s flagship AI geospatial agent. It connects language models to Earth-observation data, geospatial tools and AI models, allowing users to describe what they need in natural language. GoPilot finds relevant data, selects and runs the appropriate analytical workflow, and returns maps, raster and vector layers, measurements and other results.',
    },

    {
      h: 'How GoPilot works',
      p: 'GoPilot turns a geospatial question into an executable analysis workflow. First, it interprets the request and plans the workflow. Second, it retrieves the relevant imagery and Earth-observation data. Third, it selects and runs appropriate AI models and geospatial operations, such as segmentation, detection and change analysis. Fourth, it returns the results as downloadable raster and vector layers alongside the numbers that matter. The workflow and results are surfaced to the user, making the analysis transparent and reproducible.',
    },

    {
      h: 'One interface over 10,000+ datasets',
      p: 'GoPilot reaches more than 10,000 datasets and hundreds of AI models through one interface. Data sources include Sentinel-2 optical imagery, high-resolution optical imagery, DEM elevation, ERA5 climate reanalysis, and foundation-model embeddings such as Clay and AlphaEarth. Because the catalogue is accessible through natural language, both geospatial specialists and users who do not work directly with GIS tools can use the same interface.',
    },

    {
      h: 'GoServers API/MCP',
      p: 'GoPilot capabilities are exposed through the Model Context Protocol (MCP) as four GoServers: GoServer-Fetch for data, GoServer-Geo for geospatial operations, GoServer-Analyse and GoServer-AI for model inference. GoPilot orchestrates these services to retrieve data, perform geospatial processing and run AI models.',
    },

    {
      h: 'GIS plugins',
      p: 'RASID also provides plugins for QGIS and ArcGIS Pro, allowing existing GIS teams to use GoPilot within their established workflows.',
    },

    {
      h: 'Beyond GoPilot',
      p: 'RASID also delivers bespoke geospatial consultancy and R&D projects for organisations with specific Earth-observation and AI requirements. We develop custom AI models, geospatial datasets, data pipelines and software for real-world applications. This work spans environmental monitoring, agriculture, energy, infrastructure, transportation and urban analysis, combining research, engineering and operational deployment.',
    },

    {
      h: 'Where RASID works',
      p: 'RASID applies Earth Observation and GeoAI across multiple sectors. In agriculture, it maps crops and fields and detects trees and disease. In environmental monitoring, it screens for methane plumes, deforestation and water change. In energy and infrastructure, it analyses facilities and assets using satellite imagery. In urban analysis, it extracts buildings, roads and solar installations. In transportation, it analyses satellite video and automates road-safety assessment.',
    },

    {
      h: 'Research and applied innovation',
      p: 'RASID combines scientific research with applied engineering. Our work spans remote sensing, computer vision, GeoAI, agentic AI, geospatial software and cloud infrastructure. Research and consultancy projects feed new methods and capabilities into our technology, while GoPilot provides a platform for turning those capabilities into repeatable geospatial workflows.',
    },

    {
      h: 'Recognition and offices',
      p: 'RASID won the AWS Generative AI Challenge in 2026. The company is based in Paris, France and Beirut, Lebanon, and works internationally with research institutions, international organisations and technology partners. RASID also participates in the wider geospatial ecosystem through organisations and initiatives including AWS, the World Bank and the Open Geospatial Consortium (OGC). You can reach the team at info@rasid.ai.',
    },
  ],
} as const;

/* FAQ — visible on the page AND emitted as FAQPage JSON-LD.
 *
 * Each answer is:
 * - self-contained
 * - direct-answer-first
 * - 1–3 sentences
 * - written so search engines and LLMs can quote it without surrounding context
 *
 * Keep "RASID" (organisation) and "GoPilot" (product) spelled consistently.
 */
export const FAQ = [
  {
    q: 'What is RASID?',
    a: 'RASID is a geospatial technology and consultancy company specializing in Earth Observation, remote sensing and GeoAI. RASID develops GoPilot, its flagship AI geospatial product, and delivers bespoke geospatial R&D and consulting projects.',
  },

  {
    q: 'What is GoPilot?',
    a: 'GoPilot is RASID’s AI geospatial agent for Earth Observation. Users describe a geospatial question in natural language, and GoPilot finds relevant data, selects and runs the appropriate tools and AI models, and returns maps, raster and vector results.',
  },

  {
    q: 'What does GoPilot do?',
    a: 'GoPilot turns natural-language questions into geospatial analysis workflows. It can discover Earth-observation data, perform geospatial operations, run AI models such as segmentation and object detection, analyse change over time, and return the results as maps and downloadable geospatial layers.',
  },

  {
    q: 'How does GoPilot work?',
    a: 'GoPilot first interprets a user request and plans the required workflow. It then retrieves relevant Earth-observation data, selects and runs appropriate geospatial tools and AI models, and returns the resulting layers, measurements and analysis.',
  },

  {
    q: 'Does GoPilot require GIS expertise?',
    a: 'GoPilot is designed to let users interact with geospatial data through natural language instead of manually performing the underlying GIS workflow. GIS professionals can also use GoPilot through existing tools such as QGIS and ArcGIS Pro.',
  },

  {
    q: 'What data does GoPilot use?',
    a: 'GoPilot provides access to more than 10,000 datasets, including Sentinel-2 imagery, high-resolution optical imagery, digital elevation models, ERA5 climate reanalysis and foundation-model embeddings such as Clay and AlphaEarth. The available data depends on the analysis requested.',
  },

  {
    q: 'How many datasets are available in GoPilot?',
    a: 'GoPilot provides access to more than 10,000 datasets through a single natural-language interface. These include satellite imagery, elevation data, climate data and other Earth-observation and geospatial datasets.',
  },

  {
    q: 'What AI models does GoPilot use?',
    a: 'GoPilot can orchestrate hundreds of AI models and geospatial tools. Depending on the task, these include models and workflows for segmentation, object detection, change detection and other forms of Earth-observation analysis.',
  },

  {
    q: 'What types of geospatial analysis can GoPilot perform?',
    a: 'GoPilot can perform tasks including image segmentation, object detection, change detection, feature extraction, spatial analysis and Earth-observation data processing. The available workflows depend on the datasets and models relevant to the user’s request.',
  },

  {
    q: 'Can GoPilot analyse satellite imagery?',
    a: 'Yes. GoPilot can discover and analyse satellite imagery and other Earth-observation data, select appropriate analytical models and return the results as geospatial layers and measurements.',
  },

  {
    q: 'Can GoPilot analyse Sentinel-2 imagery?',
    a: 'Yes. Sentinel-2 is one of the Earth-observation data sources available to GoPilot. It can be used for applications including environmental monitoring, land-cover analysis, change detection and other geospatial workflows.',
  },

  {
    q: 'Can I use GoPilot inside QGIS or ArcGIS Pro?',
    a: 'Yes. RASID provides plugins for QGIS and ArcGIS Pro, allowing GIS professionals to use GoPilot and RASID’s geospatial models and workflows within the tools they already use.',
  },

  {
    q: 'Does GoPilot provide an API?',
    a: 'Yes. RASID provides programmatic access to GoPilot capabilities through its MCP and API services, with direct access available according to the applicable plan. This allows organisations to integrate RASID’s geospatial capabilities into their own software and workflows.',
  },

  {
    q: 'Does GoPilot support MCP?',
    a: 'Yes. GoPilot capabilities are exposed through the Model Context Protocol (MCP) using four GoServers: GoServer-Fetch for data access, GoServer-Geo for geospatial operations, GoServer-Analyze and GoServer-AI for model inference.',
  },

  {
    q: 'What are RASID GoServers?',
    a: 'GoServers are RASID’s MCP-based services for geospatial data and AI workflows. GoServer-Fetch handles data access, GoServer-Geo provides geospatial operations, GoServer-Analyze handles complex time-series data analysis and GoServer-AI provides model inference.',
  },

  {
    q: 'Can developers integrate RASID into their own AI agents?',
    a: 'Yes. RASID exposes geospatial data, operations and AI inference through MCP-based GoServers and API services. This allows compatible AI agents and software applications to use RASID’s geospatial capabilities programmatically.',
  },

  {
    q: 'How much does GoPilot cost?',
    a: 'GoPilot has four plans: Free at €0 per month with 500 tokens, Pro at €149 per month with 5,000 tokens, Business at €499 per month with 25,000 tokens, and Enterprise with custom pricing. Enterprise also provides deployment options including cloud and on-premise environments.',
  },

  {
    q: 'What are GoPilot tokens?',
    a: 'GoPilot tokens represent usage capacity across RASID’s platform services. Tokens are shared across GoPilot, GoBox, and RASID’s MCP and API services, with the amount included depending on the subscription plan.',
  },

  {
    q: 'What is GoBox?',
    a: 'GoBox is RASID’s GIS-focused interface for working with geospatial data and AI capabilities. It is part of the RASID platform and shares usage capacity with GoPilot through the platform’s token system.',
  },

  {
    q: 'What is the difference between GoPilot and RASID consultancy?',
    a: 'GoPilot is RASID’s commercial geospatial AI product for repeatable Earth-observation and geospatial workflows. RASID also delivers bespoke consultancy and R&D projects involving custom AI models, geospatial datasets, data pipelines and software for organisations with specific requirements.',
  },

  {
    q: 'What does RASID do besides GoPilot?',
    a: 'RASID delivers bespoke geospatial consultancy and R&D projects in addition to GoPilot. Its work includes satellite image analysis, computer vision, environmental monitoring, agricultural intelligence, infrastructure mapping, transportation analysis and other Earth-observation applications.',
  },

  {
    q: 'What industries does RASID work with?',
    a: 'RASID applies Earth Observation and GeoAI across agriculture, environmental monitoring, energy, infrastructure, transportation and urban analysis. The company develops both reusable platform capabilities and custom solutions for specific industry requirements.',
  },

  {
    q: 'What can GoPilot do for agriculture?',
    a: 'GoPilot can support agricultural workflows including crop mapping, field delineation, tree detection and crop-condition analysis. These workflows use Earth-observation data and AI models to extract information at different geographic scales.',
  },

  {
    q: 'What can GoPilot do for environmental monitoring?',
    a: 'GoPilot can support environmental monitoring workflows including methane plume screening, deforestation monitoring, land-cover change analysis, and water and coastline change detection. Users can combine Earth-observation data with other geospatial datasets to investigate environmental conditions.',
  },

  {
    q: 'Can GoPilot detect methane emissions?',
    a: 'Yes. RASID has developed a methane-monitoring workflow combining GoPilot with a specialized methane detection model. The workflow uses satellite imagery to identify and investigate potential methane plumes and can be applied to oil and gas and other emission sources.',
  },

  {
    q: 'What is MethaneMapper?',
    a: 'MethaneMapper is RASID’s specialized methane detection model for satellite imagery. It works alongside GoPilot, which provides the agentic layer for discovering data, orchestrating the workflow and contextualising the resulting methane detections.',
  },

  {
    q: 'How does GoPilot support methane monitoring?',
    a: 'GoPilot can interpret a methane-monitoring request, identify suitable satellite observations, select and execute the methane detection workflow, and return a mapped result. The result can then be investigated alongside other geospatial information such as infrastructure, land cover and historical observations.',
  },

  {
    q: 'What can GoPilot do for infrastructure?',
    a: 'GoPilot can extract and analyse infrastructure features from Earth-observation imagery, including buildings, roads, solar installations and other assets. RASID also develops bespoke infrastructure-mapping workflows for specific projects.',
  },

  {
    q: 'What can GoPilot do for transportation?',
    a: 'GoPilot supports transportation workflows including road and infrastructure mapping, satellite-video analysis and automated road-safety assessment. RASID also develops bespoke geospatial solutions for transportation and infrastructure projects.',
  },

  {
    q: 'Can GoPilot perform change detection?',
    a: 'Yes. GoPilot can compare Earth-observation imagery and run change-detection workflows to identify changes between observations. Change detection can be applied to applications such as environmental monitoring, infrastructure analysis and site investigation.',
  },

  {
    q: 'What outputs does GoPilot produce?',
    a: 'GoPilot can return maps, quantitative results and downloadable raster and vector layers. Supported outputs include formats such as GeoTIFF and GeoJSON, allowing results to be used in standard GIS workflows.',
  },

  {
    q: 'Can GoPilot export GeoJSON and GeoTIFF?',
    a: 'Yes. GoPilot can produce interoperable geospatial outputs including GeoJSON and GeoTIFF. These formats can be used in standard GIS and geospatial analysis workflows.',
  },

  {
    q: 'Is GoPilot available now?',
    a: 'Yes. GoPilot is available at app.rasid.ai and runs in production on AWS. RASID continues to develop and expand the platform’s datasets, models, integrations and analytical workflows.',
  },

  {
    q: 'Where does GoPilot run?',
    a: 'GoPilot runs on cloud infrastructure powered by AWS. RASID uses AWS services for the platform’s AI, compute, storage and agent runtime infrastructure.',
  },

  {
    q: 'Does RASID use real satellite imagery?',
    a: 'Yes. RASID’s production analyses use real Earth-observation imagery and geospatial datasets, including Sentinel-2. The outputs generated by production workflows are real raster and vector analysis results.',
  },

  {
    q: 'Is the imagery shown on the RASID website real?',
    a: 'Some animated globe visuals and demo overlays on the RASID marketing site are procedurally generated for illustration. RASID’s production analyses use real Earth-observation imagery and return real geospatial outputs.',
  },

  {
    q: 'Is GoPilot only for remote-sensing specialists?',
    a: 'No. GoPilot is designed to make Earth-observation analysis accessible through natural language while also supporting professional GIS workflows. Specialists can use GoPilot through the web platform, QGIS, ArcGIS Pro, MCP and API integrations.',
  },

  {
    q: 'Who is GoPilot for?',
    a: 'GoPilot is designed for professionals and organisations that need to work with Earth-observation and geospatial data. Potential users include GIS teams, researchers, environmental organisations, engineering companies, infrastructure organisations, energy companies and public-sector institutions.',
  },

  {
    q: 'Where is RASID based?',
    a: 'RASID is based in Paris, France and Beirut, Lebanon, and works internationally with organisations across different geospatial application areas.',
  },

  {
    q: 'Has RASID received recognition for its technology?',
    a: 'RASID won the AWS Generative AI Challenge in 2026. The recognition supported the development of GoPilot and its applications in agentic AI and Earth Observation.',
  },

  {
    q: 'What technologies does RASID specialize in?',
    a: 'RASID specializes in Earth Observation, remote sensing, GeoAI, computer vision, agentic AI, geospatial software engineering and cloud-based geospatial infrastructure. These capabilities are combined to build both reusable products and bespoke solutions.',
  },

  {
    q: 'What is GeoAI?',
    a: 'GeoAI is the application of artificial intelligence to geospatial data and location-based problems. It combines technologies such as machine learning, computer vision and geospatial analysis to extract information and insights from satellite imagery and other spatial datasets.',
  },

  {
    q: 'How is GoPilot different from a general AI chatbot?',
    a: 'GoPilot is specialized for geospatial analysis and connects AI reasoning directly to Earth-observation datasets, geospatial operations and AI models. Instead of only generating text, it can execute analytical workflows and return actual geospatial data products such as maps, raster layers and vector layers.',
  },

  {
    q: 'How is GoPilot different from a traditional GIS workflow?',
    a: 'Traditional GIS workflows often require users to find data, configure tools, write scripts or manually connect multiple processing steps. GoPilot uses an AI agent to interpret the objective, select relevant data and tools, execute the workflow and return the resulting geospatial outputs.',
  },

  {
    q: 'Can GoPilot combine multiple datasets?',
    a: 'Yes. GoPilot can orchestrate workflows involving multiple Earth-observation and geospatial datasets. This allows analyses to combine satellite imagery with information such as elevation, climate data, infrastructure and other spatial datasets when relevant to the task.',
  },

  {
    q: 'Can GoPilot combine different AI models?',
    a: 'Yes. GoPilot can select and orchestrate different AI models and geospatial operations within a single workflow. This allows a question to be addressed through multiple analytical steps rather than relying on a single model.',
  },

  {
    q: 'Can RASID build custom geospatial AI solutions?',
    a: 'Yes. RASID develops bespoke geospatial AI solutions for organisations with requirements that are not fully addressed by the standard GoPilot platform. These projects can include custom models, data pipelines, geospatial datasets, software and operational workflows.',
  },

  {
    q: 'Can RASID develop a geospatial AI model for a specific use case?',
    a: 'Yes. RASID develops and integrates computer-vision and geospatial AI models for specific applications. Custom model development can be delivered as part of a bespoke R&D or consultancy project and can also contribute capabilities to the GoPilot platform.',
  },

  {
    q: 'What organisations can work with RASID?',
    a: 'RASID works with organisations that need Earth-observation data, geospatial AI or custom geospatial software. This includes companies, engineering and consulting firms, research organisations, international organisations and public-sector institutions.',
  },

  {
    q: 'Does RASID work internationally?',
    a: 'Yes. RASID is based in Paris and Beirut and delivers geospatial technology and consulting work internationally. Its Earth-observation workflows can be applied across geographic regions wherever suitable data is available.',
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
      'A geospatial AI agent that turns natural-language questions into executable Earth-observation workflows, connecting satellite data, geospatial tools and AI models in one interface.',
    context: 'AI · Earth Observation · SaaS',
    sections: [
      {
        h: 'The problem',
        p: 'Earth-observation data is increasingly abundant, but turning it into an answer still requires specialist knowledge. Analysts must find suitable imagery, prepare the data, select the right models, write or configure GIS workflows, and combine outputs from different tools. This makes many satellite-based analyses slow, fragmented and difficult to scale.',
      },
      {
        h: 'The approach',
        p: 'GoPilot is RASID’s AI geospatial agent. Built on AWS Bedrock and the Strands agent framework, it connects a language model to Earth-observation datasets, geospatial operations and AI models. A user describes the desired analysis in natural language; GoPilot interprets the request, plans the workflow, retrieves relevant data, selects appropriate tools and models, executes the analysis and returns the resulting maps, raster and vector layers and measurements.',
      },
      {
        h: 'The agentic architecture',
        p: 'GoPilot separates AI reasoning from specialised geospatial computation. Its agent orchestrates tools exposed through RASID’s MCP-based GoServers: GoServer Fetch for data access, GoServer Geo for geospatial operations and GoServer AI for model inference. This allows the same agentic layer to combine satellite imagery, geospatial processing and specialised computer-vision models rather than relying on a single AI model.',
      },
      {
        h: 'The geospatial stack',
        p: 'GoPilot provides access to more than 10,000 datasets and hundreds of AI models through a single interface. Its workflows can use sources including Sentinel-2 imagery, high-resolution optical imagery, digital elevation data, ERA5 climate data and foundation-model embeddings such as Clay and AlphaEarth. RASID also provides QGIS and ArcGIS Pro integrations, allowing professional GIS teams to use the platform within existing workflows.',
      },
      {
        h: 'From prototype to production',
        p: 'GoPilot has progressed from an AWS Geospatial Challenge prototype into a production platform running on AWS. It is available at app.rasid.ai, with separate production and beta environments, continuous deployment and monitoring. The platform is being expanded through both commercial subscriptions and bespoke geospatial projects.',
      },
      {
        h: 'The result',
        p: 'GoPilot won the AWS Generative AI Challenge in 2026 and has been tested with potential users and institutional partners, including national mapping organisations. The platform now provides a general-purpose agentic layer for Earth-observation analysis, while specialised workflows such as methane detection demonstrate how the same architecture can be applied to specific high-value use cases.',
      },
    ],
  },

  {
    slug: 'methanemapper-landfill-detection',
    title: 'MethaneMapper: Monitoring Methane Plumes from Space',
    sector: 'Environmental',
    date: '2025-11-01',
    authorInitials: 'HN',
    status: 'published',
    summary:
      'A physics-informed methane detection system that combines satellite imagery, synthetic plume generation and AI to identify potential methane emission sources from space.',
    context: ' Climate Change . Methane · GHG',
    sections: [
      {
        h: 'The problem',
        p: 'Methane is a powerful greenhouse gas, but detecting emission sources over large areas remains difficult. Satellite data is increasingly available, yet turning imagery into reliable methane detections requires specialised atmospheric, remote-sensing and machine-learning workflows.',
      },
      {
        h: 'The approach',
        p: 'RASID developed MethaneMapper, a specialised methane detection model that works with satellite imagery to identify potential methane plumes. The system combines computer vision with Earth-observation analysis and is designed to work with real observations as well as physics-informed synthetic training data.',
      },
      {
        h: 'Physics-informed synthetic data',
        p: 'Because confirmed methane plume observations are scarce, RASID developed a synthetic-data pipeline that generates realistic methane plumes and inserts them into real Sentinel-2 scenes. The approach combines radiative-transfer modelling with a Gaussian puff plume simulator and atmospheric information to generate more than 100,000 synthetic plume samples for model development and testing.',
      },
      {
        h: 'Real-world validation',
        p: 'The models were evaluated against independently confirmed methane plume observations, including the UNEP Eye on Methane dataset. The current detector recovers 80% of confirmed plume events in the validation set. Each detection is also evaluated against reference observations to reduce the risk of fixed surface features being interpreted as methane plumes.',
      },
      {
        h: 'From methane detection to investigation',
        p: 'MethaneMapper became a core specialised model within GoPilot. GoPilot provides the agentic layer around the detector: it can interpret a methane-monitoring request, identify suitable satellite observations, retrieve the imagery, select and execute the detection workflow, and return a mapped plume. The result can then be contextualised using other geospatial information such as infrastructure, land cover and historical observations.',
      },
      {
        h: 'Operational workflow',
        p: 'The methane workflow runs on real Sentinel-2 imagery and can be repeated wherever suitable observations are available rather than being tied to a prepared monitoring site. A full investigation, from scene selection to a mapped plume, can be completed in minutes, turning a workflow that traditionally requires specialist intervention into a repeatable analysis process.',
      },
      {
        h: 'The result',
        p: 'The initial methane work was developed in collaboration with a Brazilian client and has since evolved into a broader methane-monitoring capability within GoPilot. RASID is extending the system with additional sensors, detection models, contextual analysis and pilots with environmental authorities and oil and gas operators, with the longer-term objective of continuous regional monitoring and automated alerts.',
      },
    ],
  },

    {
    slug: 'bananasight-tr4-lebanon',
    title: 'BananaSight: Early Warning for Fusarium Wilt',
    sector: 'Agriculture',
    date: '2025-09-01',
    authorInitials: 'AG',
    status: 'published',
    summary:
      'Real-time monitoring for banana plantations that flags early stress and TR4 disease from Sentinel-2 imagery, before symptoms are visible.',
    context: 'Agriculture · TR4 · Panama Disease',
    sections: [
      {
        h: 'The problem',
        p: 'Fusarium Wilt Tropical Race 4 (TR4) can devastate a banana plantation before any visible symptoms appear, leaving growers with limited time to respond. There is a need for scalable early-warning methods that can monitor plantations without relying entirely on field inspection.',
      },
      {
        h: 'The approach',
        p: 'BananaSight analyses Sentinel-2 multispectral imagery to detect patterns of vegetation stress associated with potential disease. The system monitors plantation areas over time and identifies locations showing abnormal changes, allowing farmers and agricultural teams to focus field inspections where they are most needed.',
      },
      {
        h: 'The approach to early warning',
        p: 'Rather than relying only on visible symptoms, BananaSight uses satellite observations to identify changes in plant condition across the plantation. This enables repeated monitoring over large areas and provides an additional layer of information for agricultural decision-making.',
      },
      {
        h: 'The result',
        p: 'BananaSight established a satellite-based monitoring workflow for banana plantations and demonstrated how Sentinel-2 imagery can support earlier identification of areas requiring investigation.',
      },
    ],
  },

  {
    slug: 'c-ard-analysis-ready-data',
    title: 'C-ARD: Raw to Corrected Analysis-Ready Data',
    sector: 'Imagery quality',
    date: '2026-01-01',
    authorInitials: 'HW',
    status: 'published',
    summary:
      'An AI pipeline that automatically corrects geometric and radiometric anomalies in high-resolution imagery, turning raw data into Analysis-Ready Data.',
    context: 'Analysis-Ready Data . Orthorectification . Radiometric Anomalies',
    sections: [
      {
        h: 'The problem',
        p: 'Satellite-imagery providers deal with geometric distortion, inconsistent radiometry, and atmospheric interference from cloud, haze and shadow. These issues can increase rejection rates and make imagery preparation slow and costly when corrections are performed manually.',
      },
      {
        h: 'The approach',
        p: 'C-ARD combines deep-learning co-registration and orthorectification with radiometric enhancement and automated cloud, haze and shadow detection and removal. A human-in-the-loop interface allows operators to review and control the processing, while the pipeline can be deployed in cloud, on-premise or on-orbit environments through EC-ARD.',
      },
      {
        h: 'The processing pipeline',
        p: 'The system brings multiple image-correction and quality-control steps into a single workflow. By automating repetitive preprocessing tasks while retaining human review where required, C-ARD helps imagery providers produce more consistent Analysis-Ready Data at scale.',
      },
      {
        h: 'The result',
        p: 'The client-ready pipeline processes roughly 200 GB of imagery in about two hours. The system helps turn more captures into usable and sellable imagery while reducing quality-assurance effort and accelerating delivery for the satellite-imagery provider.',
      },
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
