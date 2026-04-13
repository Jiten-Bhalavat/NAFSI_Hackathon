# NourishNet — Complete Replication Guide

> **Purpose:** This document contains every detail needed for any developer or AI to replicate NourishNet — structure, colors, fonts, data, components, logic, backend, and behavior — from scratch.

---

## 1. Project Overview

**NourishNet** is a React + TypeScript + Vite web application built for the 2026 NAFSI Hackathon (Track 2). It connects food-insecure Maryland/DC residents with food pantries, donation drives, volunteer opportunities, and community boards — all in one searchable, map-driven interface. No login required, all privacy-first.

**Live concept:** Maryland + DC Metro Area food assistance aggregator.  
**GitHub:** `https://github.com/protocorn/NAFSI_Track2`

---

## 2. Tech Stack (Exact Versions)

| Layer | Library | Version |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Language | TypeScript | ~6.0.2 |
| Build Tool | Vite | 8.0.4 |
| CSS | TailwindCSS | 4.2.2 (via @tailwindcss/vite) |
| Routing | react-router-dom | 7.14.0 |
| Map (primary) | react-map-gl (MapLibre GL) | 8.1.1 |
| Map tiles | OpenFreeMap | Free, no API key required |
| Geocoding | Nominatim (OpenStreetMap) | Free, no API key required |
| Clustering | supercluster | 8.0.1 |
| Map (legacy) | react-leaflet + react-leaflet-cluster | 5.0.0 / 4.1.3 |
| Map CSS | maplibre-gl | 5.23.0 |

**No backend** for most features. Community board data lives in `localStorage`. The AI chatbot calls a single endpoint (`/api/chat`) which can be pointed at any backend via `VITE_CHATBOT_API` env variable.

### Project scaffold

```
nourishnet/
├── public/
│   ├── images/          ← all page images (jpg/png/avif/webp)
│   └── data/
│       ├── catalog.json          ← Consumer data (places + opportunities)
│       ├── donor_catalog.json    ← Donor data (donorPlaces, countyStats, priorityTracts)
│       └── md_counties.geojson  ← Maryland county boundary polygons for choropleth
├── src/
│   ├── App.tsx           ← Route declarations
│   ├── main.tsx          ← Entry point (ReactDOM.createRoot)
│   ├── index.css         ← Global styles + TailwindCSS import + custom classes
│   ├── types.ts          ← All TypeScript interfaces
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Consumer.tsx  ← /find-food
│   │   ├── Donor.tsx     ← /donate
│   │   ├── FoodPost.tsx  ← /food-post (Community Board)
│   │   ├── Planner.tsx   ← /volunteer
│   │   └── About.tsx
│   ├── components/
│   │   ├── Layout.tsx             ← Navbar + footer wrapper (Outlet)
│   │   ├── NourishMap.tsx         ← MapLibre map, clustering, popups
│   │   ├── PlaceCard.tsx          ← Consumer list card
│   │   ├── PlaceDetail.tsx        ← Expanded place info inline panel
│   │   ├── EmergencyFoodModal.tsx ← 🚨 I Need Food Now modal
│   │   ├── QuickFoodRequest.tsx   ← Anonymous food request modal
│   │   ├── SurplusFoodBoard.tsx   ← Surplus food post/list (localStorage)
│   │   ├── CommunityNeedsBoard.tsx← Need requests (localStorage)
│   │   ├── LivePantryStatus.tsx   ← Pantry update posts (localStorage)
│   │   ├── FoodInsecurityOverlay.tsx ← MapLibre choropleth layer
│   │   ├── FoodDesertLayer.tsx    ← Leaflet bubble layer (county circles)
│   │   ├── DonorChatbot.tsx       ← Floating chatbot bubble
│   │   ├── DonorImpactPanel.tsx   ← Donation impact math ladder
│   │   ├── NeighborhoodDonation.tsx ← County stats donation guide
│   │   ├── VolunteerForm.tsx      ← Interest form modal (localStorage)
│   │   ├── MapController.tsx      ← Fly-to / fitBounds helper
│   │   └── RegionOverlay.tsx      ← Geocode boundary overlay
│   ├── hooks/
│   │   ├── useCatalog.ts          ← Fetches /data/catalog.json
│   │   ├── useDonorCatalog.ts     ← Fetches /data/donor_catalog.json
│   │   ├── useGeocode.ts          ← Nominatim debounced search
│   │   └── useGeolocation.ts      ← navigator.geolocation wrapper
│   └── utils/
│       ├── geo.ts                 ← Haversine distance + Google Maps directions URL
│       ├── hours.ts               ← Parse hours string → open/closed/unknown
│       ├── pointInPolygon.ts      ← GeoJSON point-in-polygon for boundary filter
│       └── leafletIcons.ts        ← Leaflet icon factory (legacy)
└── package.json
```

---

## 3. Route Map

```
/            → Home.tsx       (landing page)
/find-food   → Consumer.tsx   (food finder — emerald theme)
/donate      → Donor.tsx      (donation finder — amber theme)
/food-post   → FoodPost.tsx   (community board — all posts)
/volunteer   → Planner.tsx    (volunteer opportunities — blue theme)
/about       → About.tsx      (about the project — yellow cream theme)
```

All routes share `Layout.tsx` (navbar + footer) via React Router's `<Outlet />`.

---

## 4. Color Palette (Exact Hex Values)

### Primary Brand Colors

| Role | Hex | TailwindCSS |
|---|---|---|
| Primary green (buttons, accents) | `#16a34a` | `green-600` |
| Primary green hover | `#15803d` | `green-700` |
| Light green accent text | `#4ade80` | `green-400` |
| Hero/footer dark bg | `#0d1f15` | Custom |
| Hero section light bg | `#f2faf5` | Custom |
| Section alt bg | `#f7f9f7` | Custom |
| Background text watermark | `#bbf7d0` | `green-200` |

### Page-Specific Accent Colors

| Page | Gradient | Tailwind Classes |
|---|---|---|
| Consumer (/find-food) | Emerald | `from-emerald-600 to-emerald-500` |
| Donor (/donate) | Amber | `from-amber-600 to-amber-500` |
| Volunteer (/volunteer) | Blue | `from-blue-700 to-blue-500` |
| About (/about) | Yellow cream | bg `#fefce8` |

### Map Pin Colors

| Type | Color | CSS Class |
|---|---|---|
| Consumer (pantry/bank etc.) | `#059669` (emerald-600) | `.nn-pin-consumer` |
| Donor | `#d97706` (amber-600) | `.nn-pin-donor` |
| Volunteer/Planner | `#2563eb` (blue-600) | `.nn-pin-planner` |

### Cluster Colors (by size)

| Size | Color |
|---|---|
| Small (< ~50) | `#059669` — green |
| Medium (< ~100) | `#d97706` — amber |
| Large (100+) | `#dc2626` — red |

### Food-Insecurity Choropleth (Donor map)

Population buckets → colors (light orange → dark red):
```
0       → #fdd0a2
5,000   → #fca082
10,000  → #fb6a4a
20,000  → #de2d26
40,000  → #a50f15
80,000  → #67000d
```

### About Page Cascade Cards Background Colors

```
Card 1 (The problem):       #f4a94e  (warm orange)
Card 2 (Our solution):      #b8e8d0  (mint green)
Card 3 (For families):      #f9d97a  (yellow)
Card 4 (For donors):        #f4a94e  (warm orange)
Card 5 (Privacy first):     #c5d9f7  (light blue)
```

---

## 5. Typography & Spacing Rules

- **Font family:** System font stack (TailwindCSS default — no custom font import)
- **Headings:** `font-black` (900 weight), `uppercase`, letter spacing `tracking-wide` or `tracking-widest`
- **Section labels:** tiny green pill badge — `bg-[#16a34a] text-white text-xs font-black px-3 py-1.5 rounded tracking-wide`
- **Body text:** `text-gray-500`, `leading-relaxed`
- **Max container width:** `max-w-7xl mx-auto px-6` (most pages), `max-w-6xl mx-auto px-4` (inner content pages)
- **Hero decorative text:** Giant background watermark text — `text-[160px] md:text-[220px] font-black text-green-100 whitespace-nowrap` with `line-height: 0.85`, text reads "FOOD TODAY"

---

## 6. Images

All images live in `public/images/`. They are local static files served by Vite.

| File | Used on |
|---|---|
| `helpinghands.jpg` | Hero left image, events, testimonials, CTA section background |
| `foodnearme.jpg` | Programs card (Find Food), events card |
| `donate.png` | Programs card (Donate) |
| `community.avif` | Programs card (Community Board), testimonials |
| `volunteer.avif` | Programs card (Volunteer), testimonials |
| `homepage.webp` | (Present in root, not actively used in code) |
| `about-header.jpg` | About page full-width header |

> **Note:** Images like `helpinghands.jpg`, `foodnearme.jpg`, `donate.png`, `community.avif`, `volunteer.avif` are real photos representing food bank volunteers and community scenes. Use any royalty-free images matching these descriptions to replicate.

---

## 7. Data Structures (TypeScript Interfaces)

### `types.ts` — all interfaces

```typescript
// Consumer catalog
export type PlaceType = "pantry" | "food-bank" | "snap-store" | "farmers-market";

export interface Place {
  id: string;
  type: PlaceType;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  lat: number | null;
  lng: number | null;
  phone: string;
  hours: string;
  eligibility: string;
  requirements: string | null;
  tags: string[];
  source: string;
  distributionModel: string[];   // ["drive-through", "walk-in", "home-delivery", etc.]
  foodFormats: string[];
  dietaryInfo: string[];
  email: string | null;
  website: string | null;
  hoursStructured: DayHours[] | null;
  acceptsSnap?: boolean;
  acceptsWic?: boolean;
}

export interface Opportunity {
  id: string;
  placeId: string;             // links to Place.id
  type: "donation" | "volunteering";
  title: string;
  summary: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  schedule: string;            // e.g. "Mon–Fri 9am–5pm"
  needsTags: string[];
}

export interface Catalog {
  schemaVersion: string;
  generatedAt: string;
  sources: SourceMeta[];
  places: Place[];
  opportunities: Opportunity[];
}

// Donor catalog
export interface DonorPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string;
  email?: string;
  hours: string;
  eligibility: string;
  requirements: string | null;
  tags: string[];
  source: string;
  summary: string;
  donorType: "pantry" | "food-bank" | "farmers-market" | "store";
  products?: string;
  paymentMethods?: string;
}

export interface CountyStat {
  county: string;
  year: string;                        // "2021", "2022", etc.
  foodInsecurePopulation: number;
  foodInsecurityRate: number | null;   // percentage, e.g. 14.2
  averageMealCost: number | null;
  annualFoodBudgetShortfall: number | null;
  url: string;
}

export interface PriorityTract {
  tractId: string;
  healthyStoreCount: number;
  unhealthyStoreCount: number;
  rfei: number | null;
  isHealthyFoodPriorityArea: boolean;
  tier: string | null;
  municipality: string | null;
}

export interface DonorCatalog {
  schemaVersion: string;
  generatedAt: string;
  donorPlaces: DonorPlace[];
  partnerMarkets: DonorPlace[];
  supplyGapStores: DonorPlace[];
  countyStats: CountyStat[];
  priorityTracts: PriorityTract[];
}
```

### Data Files

- **`public/data/catalog.json`** — Contains `places[]` (200+ locations: pantries, food banks, SNAP stores, farmers markets in Maryland/DC) and `opportunities[]` (150+ volunteer/donation opportunities linked to places by `placeId`).
- **`public/data/donor_catalog.json`** — Contains `donorPlaces[]`, `countyStats[]` (24 Maryland counties, years 2020–2022), `priorityTracts[]` (283 census tracts).
- **`public/data/md_counties.geojson`** — Standard Maryland county boundary GeoJSON (FeatureCollection). Each feature needs `NAME` property matching county names for joining with countyStats. During rendering it gets enriched with `food_insecure_pop` and `food_insecurity_rate` properties.

---

## 8. Layout Component (`Layout.tsx`)

Renders on every page as a shell. Contains:

### Navbar

- **Sticky**, `bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50`
- **Logo:** Green rounded square (`w-8 h-8 bg-[#16a34a] rounded-lg`) with white "N" + "NourishNet" text in `#15803d`
- **Nav links (desktop):** Find Food, Donate, Community, About — `px-3.5 py-2 rounded-lg text-sm font-semibold`; active state: `text-[#16a34a] bg-green-50`
- **CTA button:** "Register as Volunteer" → `/volunteer` — `bg-[#16a34a] text-white px-4 py-2 rounded-lg`
- **Mobile:** Hamburger icon toggles dropdown menu with same links + CTA

### Footer

- Background: `bg-[#0d1f15]` (very dark green)
- 3-column grid on large screens: Brand info + GitHub icon | Quick Links | Contact
- **Brand:** Repeat logo, tagline, GitHub icon link
- **Quick Links:** Find Food, Donate, Community Board, Volunteer, About
- **Contact:** 📍 Maryland & DC Metro Area | ✉️ help@nourishnet.org | 📞 1-800-NOURISH
- Copyright bar: `© 2026 NourishNet · Open-source hackathon project`
- GitHub link: `https://github.com/protocorn/NAFSI_Track2`

### Accessibility

- Skip-to-main-content link (sr-only until focused)
- `aria-label` on all nav elements
- Focus ring: `outline: 3px solid #2563eb`

---

## 9. Home Page (`/`)

The homepage is divided into 8 distinct sections:

### Section 1 — Hero

- **Background:** `bg-[#f2faf5]` (very light mint), `min-h-[80vh] flex items-center`
- **Decorative watermark:** Giant text "FOOD TODAY" in `text-[160px] md:text-[220px] font-black text-green-100` positioned at bottom-left, `lineHeight: 0.85`, pointer-events none
- **Layout:** Two-column flex (left: text + image | right: donate widget) — stacks to single column on mobile

**Left Column:**
- Green pill badge: `● Maryland & DC Metro Area` — `bg-green-100 rounded-full px-4 py-1.5 text-xs font-bold text-green-700`
- Headline: `"Fight Against Hunger, Donating Food Today"` — `text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.05]`. "Hunger," in `text-[#16a34a]`
- Subtext: gray description max-w-lg
- Two CTA buttons:
  - "Find Food Near Me" → `/find-food` — `bg-[#16a34a] text-white font-bold px-8 py-3.5 rounded-lg`
  - "I Want to Help" → `/volunteer` — `border-2 border-[#16a34a] text-[#16a34a] font-bold px-8 py-3.5 rounded-lg`
- Hero image: `helpinghands.jpg` — `rounded-2xl max-w-xl shadow-2xl`

**Right Column — DonateWidget:**
- White card `rounded-2xl shadow-2xl`
- Green header bar: `bg-[#16a34a] px-6 py-4` — "DONATE NOW!" title
- Toggle: One Time / Monthly tabs — active tab: `bg-[#16a34a] text-white`
- Amount grid: $10, $25, $50, Custom — 2×2 grid; selected: `border-[#16a34a] bg-green-50 text-green-700`
- Custom amount: text input visible only when "Custom" selected
- "Donate Now →" button: full-width `bg-[#16a34a] py-4 font-black tracking-widest uppercase`
- Footer note: "Secure donation · 100% goes to food assistance programs"

### Section 2 — Stats Bar

- **Background:** `bg-[#0d1f15]` (dark green), `py-5`
- 4 metrics in a horizontal row, separated by thin white dividers:
  1. `$43,903` Annual Budget Shortfall Tracked
  2. `{placeCount}+` Food Locations (dynamic from catalog)
  3. `{countyCount}` Counties Covered (dynamic)
  4. `{oppCount}+` Volunteer Opportunities (dynamic)
- Each metric has a green `↑` arrow, bold number, and small gray uppercase label

### Section 3 — Current Programs

- **Background:** `bg-white py-20`
- Section header: green badge "CURRENT" + "PROGRAMS" heading + "VIEW ALL PROGRAMS →" link
- **4-card grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`):
  1. **Find Food Near You** → `/find-food` — img: `foodnearme.jpg` — tag: RESOURCES
  2. **Make a Donation** → `/donate` — img: `donate.png` — tag: DONATE
  3. **Community Board** → `/food-post` — img: `community.avif` — tag: COMMUNITY
  4. **Apply as Volunteer** → `/volunteer` — img: `volunteer.avif` — tag: VOLUNTEER
- Each card: image (h-48, zoom on hover), green tag badge top-left, title + desc + "DONATE →" link
- Card style: `rounded-xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100`

### Section 4 — Apply as Volunteer (Testimonials)

- **Background:** `bg-[#f7f9f7] py-20`
- Section header: green badge "APPLY" + "AS VOLUNTEER"
- **12-column grid**, 3 zones:
  - **Left (3 cols):** White card with quote, avatar (`volunteer.avif`), first testimonial
  - **Center (6 cols):** 3 stacked testimonials with avatar + quote + name + role
  - **Right (3 cols):** Join CTA with "Apply Today →" button

**Testimonials data:**
1. Maria Johnson — Food Distribution Volunteer
2. David Park — Community Organizer
3. Aisha Williams — Pantry Coordinator

### Section 5 — Upcoming Events

- **Background:** `bg-white py-20`
- Section header: green badge "UPCOMING" + "EVENTS" + "VIEW ALL EVENTS →"
- **3-card grid** — each card is `h-64 rounded-2xl overflow-hidden` with background image + dark gradient overlay
- Event data:
  1. Community Food Drive — MAY 15, 2026 — Baltimore, MD — img: `helpinghands.jpg`
  2. Volunteer Distribution Day — MAY 22, 2026 — Silver Spring, MD — img: `volunteer.avif`
  3. Farmers Market Donation Day — JUN 5, 2026 — Rockville, MD — img: `foodnearme.jpg`
- Date text: `text-[#4ade80]` (bright green), location with 📍, white arrow circle top-right

### Section 6 — We Reach Every Corner

- **Background:** `bg-white border-t border-gray-100 py-20`
- **2-column layout:** Text left | Dot map SVG right
- Left: Large headline "We Reach Every Corner **of the Country**" (green), 2 counters (Counties, Locations), "Explore the Map →" button
- Right: **SVG dot grid** (`420×280` viewBox, 13 rows × 20 cols, r=4 circles) — inner area colored with 3 greens (`#16a34a`, `#4ade80`, `#bbf7d0`), outer dots `#e2e8f0`. Center overlay: white card with 🗺️ emoji + location count

### Section 7 — Second Hero / CTA

- **Background:** `bg-[#0d1f15]` with `helpinghands.jpg` at 25% opacity
- Dark left gradient: `from-[#0d1f15]/90 to-[#0d1f15]/60`
- Small tag: "Join the Movement" in `#4ade80`
- Headline "Fight Against **Hunger**, Donating Food Today" — white, "Hunger" in `#4ade80`
- Right: DonateWidget (compact variant, `md:w-[300px]`)

### Section 8 — Partners

- **Background:** `bg-white py-14`
- Centered list of 5 partner names in `text-gray-400 font-black text-xs tracking-widest uppercase`:
  Maryland Food Bank, Feeding America, DC Central Kitchen, Capital Area Food Bank, Anne Arundel FC

---

## 10. Find Food Page — Consumer (`/find-food`)

### Page Header

- Gradient: `bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-6`
- Title: "Find Food Near You"
- Subtitle in `text-emerald-100`
- Two action buttons:
  - 🚨 "I Need Food Now" — `bg-red-600 hover:bg-red-700 font-bold px-5 py-2.5 rounded-2xl shadow-lg animate-pulse-slow` — opens EmergencyFoodModal
  - 🍎 "Request Anonymously" — `bg-white/20 border border-white/30 rounded-2xl text-xs` — opens QuickFoodRequest

### Filter Bar

Floats above the content with `-mt-5`, `bg-white/85 backdrop-filter blur(8px)`, `rounded-2xl shadow-lg p-4 border border-gray-200/50 z-10`

**Row 1 — Search + selects:**
- 🔍 Text input: "ZIP code or address…" — debounced geocoding via Nominatim
- County select: "All counties" + dynamic list from catalog
- Day select: Any day / Mon / Tue / Wed / Thu / Fri / Sat / Sun
- 📍 "Near Me" button (geolocation) — `bg-emerald-600`

**Row 2 — Type chips:**
- 🥫 Pantries | 🏦 Food Banks | 🛒 SNAP Stores | 🌽 Farmers Markets
- Active chip: filled with `PLACE_TYPE_COLOR[type]`
- Single-select: clicking an already-active chip deselects (toggle off)
- "Clear all" link if any filters active
- Spinning loader shown during React `useTransition` pending state

**Geocode feedback:** Shows "📍 Near {displayName} — boundary shown on map" in emerald text

### Place Type Colors

```typescript
const PLACE_TYPE_COLOR = {
  "pantry":         "#059669",  // emerald-600
  "food-bank":      "#2563eb",  // blue-600
  "snap-store":     "#7c3aed",  // violet-600
  "farmers-market": "#d97706",  // amber-600
};
```

### Main Layout — Split Panel

`grid lg:grid-cols-5 gap-4`, `height: 620px`

**Left panel (2/5 cols) — Place list:**
- Count bar: "X locations · Y on map"
- Inline PlaceDetail panel (when a place is selected, appears above list)
- Scrollable card list (`styled-scrollbar`) — `space-y-1.5`
- Loads 60 at a time; "Show more (N remaining)" button loads 60 more
- Empty state: 🔍 "No locations match your filters."
- Each list item: `<PlaceCard>` component

**Right panel (3/5 cols) — Map:**
- `rounded-2xl overflow-hidden border border-gray-200 h-[620px]`
- `<NourishMap>` with `variant="consumer"`
- **Legend overlay** (bottom-left of map): collapsible panel showing 4 type chips with colored pin shapes. Clicking a chip in the legend also toggles the filter.

### PlaceCard Component

Compact card showing:
- Name (bold, link-style), type badge (colored chip), open/closed badge
- Address + city, distance in miles (if location known)
- SNAP/WIC badges if applicable
- Hours (truncated)
- Click to select (highlights card + flies map to location)

### EmergencyFoodModal

- **Trigger:** "🚨 I Need Food Now" button
- **Overlay:** `fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm` — slides up from bottom on mobile, centered on desktop
- **Header:** Red `bg-red-600` — "🚨 I Need Food Right Now"
- **Logic:**
  1. Immediately calls `navigator.geolocation.getCurrentPosition`
  2. While locating: animated bouncing 📍 + "Finding your location…"
  3. On success: computes distance to all geocoded places, sorts by open-first then distance, shows top 5
  4. On error: error message + "Call 211" link
- **Each result card:** name + distance badge + address + open/closed status badge + Call button + Directions button
- **Sticky 211 banner** at top: "📞 Call 211 — Free Helpline · Available 24/7"

### QuickFoodRequest

- Anonymous food request form (saves to localStorage as a need post)
- No personal data collected

### Filtering Logic (3 stages)

```
Stage 1 — geo-boundary: if geocode result has a polygon boundary, filter places inside it
Stage 2 — discrete: county, day-of-week, type chips
Stage 3 — distance sort: if userCoords available, sort ascending by Haversine distance
```

Uses React `useTransition` to defer filter re-renders and show a spinner.

---

## 11. Donate Page — Donor (`/donate`)

### Page Header

- Gradient: `bg-gradient-to-r from-amber-600 to-amber-500 text-white py-8`
- Title: "Donate Food or Funds"
- Dynamic count: "Find {N} food pantries and food banks across Maryland where you can donate."

### Summary Cards (4-card row)

`grid grid-cols-2 sm:grid-cols-4 gap-3 -mt-5 mb-4`

1. **Pantry count** — click to filter by pantry (amber bg when active)
2. **Food Bank count** — click to filter by food bank
3. **Food Insecure (MD)** — red number (K format), aggregated from countyStats
4. **Mapped Locations** — amber number (places with lat/lng)

### Filter Bar

Same `filter-bar` class as Consumer. Amber accent (`focus:border-amber-500`, `bg-amber-600` button, ring `focus:ring-amber-100`).

Filters:
- 🔍 Search (geocoded via Nominatim)
- Type: All / 🏠 Pantries / 🏦 Food Banks
- County: All counties + dynamic list
- 📍 My Location button (amber)

### List + Map Grid

`flex flex-col lg:grid lg:grid-cols-5 gap-5`

**List (2/5):** `max-h-[560px] overflow-y-auto`
- Each item: accordion button — closed state shows name + city + donor type badge + distance
- Expanded state (`bg-amber-50 border-amber-400`): address, hours, eligibility, summary, buttons (📞 Call, ✉️ Email, 🌐 Website, 🗺️ Directions), tag pills in amber

**Map (3/5):** `h-[560px] rounded-2xl`
- `<NourishMap variant="donor">` containing `<FoodInsecurityOverlay>` child
- FoodInsecurityOverlay: fetches `md_counties.geojson`, joins countyStats, renders a `fill` layer with orange→red color scale
- Toggle button (overlayToggle prop) to show/hide the choropleth
- Hover tooltip: county name + food insecure population count — shown at `top-3 left-3 z-10 bg-white/90`
- `<InsecurityLegend>` — bottom-right panel showing population buckets → colors

### NeighborhoodDonation Component

Below the list+map, full-width section:
- **Header:** "📍 Where Your Donation Matters Most"
- Cards for each county, sorted by food insecurity rate descending
- Each card: county name, insecurity rate badge (color-coded: green/yellow/orange/red), food insecure population bar, budget shortfall
- Urgency color thresholds:
  - ≥18% → red
  - ≥15% → orange
  - ≥12% → yellow
  - <12% → green
- "Show all N counties" expand button (shows 8 initially)

### DonorChatbot

Floating button `fixed bottom-6 right-6 z-50` — amber bubble with chat icon.

**Flow:**
1. Click bubble → chat panel opens (`w-96 max-h-[500px]`)
2. First shows ZIP code entry form (validates 5-digit ZIP)
3. After ZIP confirmed → shows chat interface
4. Pre-populated suggestion chips:
   - "Food pantries near {zip}"
   - "Where is the highest hunger area near {zip}?"
   - "Which locations accept donations on weekends?"
5. Sends messages to `VITE_CHATBOT_API` (default `/api/chat`) as POST with `{message, zipCode}` body
6. AI response rendered as text
7. Reset button to clear ZIP and start over

---

## 12. Community Board (`/food-post`)

Three interleaved post types, all stored in `localStorage`, all ephemeral with expiry timers.

### Filter Bar

4 filter tabs: 📋 All Posts | 🍱 Surplus Food | 📢 Pantry Updates | 🤝 Food Requests

### Post Types

**1. Surplus Food Posts (`SurplusFoodBoard`)**

Post form fields:
- Food type (dropdown): Cooked Meals / Bread / Produce / Fruits / Canned Goods / Dairy / Meat / Beverages / Baby Food / Prepared Meals / Mixed Groceries / Other
- Quantity (text)
- Description (text)
- Pickup ZIP (text, 5-digit)
- Pickup address (text)
- Contact info (text)
- Expires in: 2h / 4h / 8h / 24h / 48h

Stored in `localStorage` key `nourishnet-surplus-posts`. Posts expire when `expiresAt < Date.now()`.

Each card shows: food type, quantity, description, pickup location, posted time, time left countdown, "Mark Claimed" button.

**2. Pantry Status Updates (`LivePantryStatus`)**

Status types (each with label + color):
```
produce:  🥦 Fresh produce available  → green
closure:  🔴 Closed today             → red
no-id:    ✅ No ID required today      → emerald
extended: ⏰ Extended hours today      → blue
shortage: ⚠️ Limited supply today      → yellow
special:  🎁 Special items available  → purple
other:    📢 General announcement     → gray
```

Form fields: pantry name, status type, optional note, expires in (2h–48h).
Stored in `localStorage` key `nourishnet-pantry-status`.

**3. Community Need Requests (`CommunityNeedsBoard`)**

Urgency levels: ⚡ Need today / 📅 This week / 🕐 Flexible

Mobility options: 🚶 Can walk / 🏠 Need delivery / 🚶/🏠 Either

Need type categories: Baby Formula/Diapers / Halal/Kosher Food / Diabetic-Friendly / Fresh Produce / Canned Goods / Prepared Meals / Pet Food / Hygiene Products / Other

Stored in `localStorage` key `nourishnet-needs-posts`. Anonymous — no PII collected.

### Combined Feed (FoodPost.tsx)

All 3 post types are merged and rendered in a single chronological feed filtered by the active tab.

Time helpers:
- `timeAgo(ts)` → "3m ago", "2h ago", "just now"
- `timeLeft(ms)` → "2h 30m left", "45m left", "Expired"

---

## 13. Volunteer Page — Planner (`/volunteer`)

### Page Header

- Gradient: `bg-gradient-to-r from-blue-700 to-blue-500 text-white py-8`
- Title: "Volunteer Opportunities"
- "✋ Submit Interest" button (white with blue text) → opens VolunteerForm modal

### Filter Bar

Blue accent (`focus:border-blue-500`, `bg-blue-600` button):
- 🔍 Search (geocoded)
- County select
- Schedule toggle: Any | Weekdays | Weekends
- 📍 My Location

### Selected Opportunity Detail Panel

When an opportunity is selected, a detail panel appears above the list:
- Blue top accent bar (`bg-gradient-to-r from-blue-600 to-blue-300 h-1`)
- Title, summary, location + schedule in 2-col grid
- Distance in miles
- Contact buttons (📞 Call, ✉️ Email)
- "✋ I'm Interested" → opens VolunteerForm
- needsTags as blue pill badges

### List + Map

Same 5-col grid as other pages, blue theme. Map uses `variant="planner"` (blue pins).

Each opportunity card:
- Title + distance badge (bg-blue-100)
- Summary, place name, schedule
- ✋ button to quick-submit interest

### VolunteerForm Modal

Modal form to express interest in a specific opportunity:
- Pre-fills opportunity title
- Name (required), email, phone, availability notes
- Saves to `localStorage` key `nourishnet-volunteer-interests`
- No server call — purely client-side

---

## 14. About Page (`/about`)

### Header

Full-width image: `about-header.jpg` (`h-[340px] object-cover`)
Dark gradient overlay. Centered: "NourishNet" title + tagline

### CascadeSection

Auto-scrolling horizontal card carousel (`bg: #fefce8`):
- 5 cards duplicated for infinite loop
- CSS animation: `cascadeLoop` — `translateX(0)` → `translateX(-50%)` in 40s linear
- Hover pauses animation
- Card width: 340px, min-height: 360px, borderRadius: 20px
- Large translucent number (01–05) as background decoration

**Cards:**
1. **01 — The problem** — "Food help exists. Finding it doesn't." — `#f4a94e`
2. **02 — Our solution** — "We unified 5,900+ resources into one app." — `#b8e8d0`
3. **03 — For families** — "Find food near you in seconds." — `#f9d97a`
4. **04 — For donors** — "Give where it is needed most." — `#f4a94e`
5. **05 — Privacy first** — "No account. No tracking." — `#c5d9f7`

### Disclaimer Section

Yellow pill card: "Data may be incomplete or outdated. Please call to confirm before visiting." + "Dial 211" button.

---

## 15. NourishMap Component

The core map component used on Consumer, Donor, and Planner pages.

### Technology

- **MapLibre GL** via `react-map-gl/maplibre`
- **Tiles:** OpenFreeMap — `https://tiles.openfreemap.org/styles/liberty` (free, no key)
- **Clustering:** Supercluster (not MapLibre's built-in clustering)
- **Initial view:** Maryland center `{ lat: 38.9, lng: -77.0, zoom: 9 }`

### Props

```typescript
interface Props {
  points: MapPoint[];           // geocoded markers
  variant: "consumer" | "donor" | "planner";
  selectedId: string | null;
  onSelect: (id: string) => void;
  geocode?: GeocodeResult | null;    // shows boundary polygon + flies to bounds
  addressLookup?: AddressLookup;     // items without coords: geocode on selection
  initialZoom?: number;
  hoverLayerIds?: string[];          // MapLibre layer IDs to enable hover on
  onHoverFeature?: (props) => void;  // callback for hovered feature properties
  overlayToggle?: { visible, onToggle, label }; // for choropleth toggle button
  children?: ReactNode;              // overlay layers (FoodInsecurityOverlay etc.)
}
```

### MapPoint Interface

```typescript
interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  phone?: string;
  hours?: string;
  website?: string;
  email?: string;
  placeType?: string;
  eligibility?: string;
  county?: string;
  zip?: string;
  state?: string;
  acceptsSnap?: boolean;
  acceptsWic?: boolean;
  distributionModel?: string[];
  foodFormats?: string[];
  directionsUrl?: string;
}
```

### Clustering Logic

1. All `points` are fed to a `Supercluster` instance (radius 60, maxZoom 17)
2. On every map move/zoom, `supercluster.getClusters(bbox, zoom)` returns either cluster points or individual markers
3. **Cluster markers:** Custom HTML divs with class `nn-cluster nn-cluster-sm/md/lg` (green/amber/red by count)
4. **Individual pins:** Diamond-shaped divs — `nn-pin nn-pin-{variant}` (rotated 45° square)
5. Selected pin gets class `nn-pin-selected` (scaled up)

### Popup (RichPopup)

Shown on pin click:
- Color accent bar at top matching place type color
- Type badge (icon + label)
- Place name, address (sublabel)
- Hours, eligibility
- SNAP/WIC badges (violet + pink)
- Distribution models (blue chips): drive-through 🚗, walk-in 🚶, home-delivery 🏠, by-appointment 📱, mobile-pantry 🚚
- Food formats chips
- Action buttons: 📞 Call, 🗺 Directions (Google Maps link), 🌐 Website, ✉️ Email

### Geocode Boundary

When `geocode.result.boundary` is a GeoJSON Polygon/MultiPolygon:
- Drawn as a MapLibre `fill` layer (light blue `rgba(37, 99, 235, 0.1)`) + `line` layer (blue `#2563eb`, width 2)
- Map flies to the bounding box of the result

### FoodInsecurityOverlay (Donor map only)

- Fetches `md_counties.geojson` on mount
- Joins each county feature to countyStats by normalized county name (strips " County" suffix, lowercases)
- Sets `food_insecure_pop` and `food_insecurity_rate` properties on each feature
- Renders two MapLibre layers: `food-insecurity-fill` (orange→red fill) + `food-insecurity-line` (white border)
- Toggle-able via `overlayToggle.visible` prop

---

## 16. Geocoding (`useGeocode.ts`)

- **API:** Nominatim (`https://nominatim.openstreetmap.org/search`)
- **Debounce:** 600ms after keystroke
- **Parameters:** `polygon_geojson=1` (gets boundary polygon), `viewbox=-79.5,37.9,-75.0,39.8` (MD/DC bias), `countrycodes=us`, `limit=1`
- ZIP codes are appended `, Maryland, USA` for accuracy
- Returns `GeocodeResult { lat, lng, displayName, boundary, bounds }`
- Boundary (Polygon/MultiPolygon) enables the region-filter and map overlay

---

## 17. Hours Parsing (`utils/hours.ts`)

`getOpenStatus(hoursString: string): "open" | "closed" | "unknown"`

Logic:
- Parses day names (Mon/Tue/etc.) and time ranges (9am-5pm, 9:00-17:00)
- Checks current day + current time against ranges
- Returns `"unknown"` if parsing fails or hours string is "Hours not available"
- Used by EmergencyFoodModal to sort by open-first

---

## 18. CSS Classes & Animations (`index.css`)

```css
/* Filter bar — glass morphism */
.filter-bar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
}

/* Map shadow wrapper */
.map-wrapper { box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.12); }

/* Cluster marker sizes */
.nn-cluster-sm  { width: 36px; height: 36px; background: #059669; }  /* green */
.nn-cluster-md  { width: 46px; height: 46px; background: #d97706; }  /* amber */
.nn-cluster-lg  { width: 56px; height: 56px; background: #dc2626; }  /* red */

/* Pin markers */
.nn-pin {
  width: 14px; height: 14px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.nn-pin-consumer { background: #059669; }
.nn-pin-donor    { background: #d97706; }
.nn-pin-planner  { background: #2563eb; }
.nn-pin-selected { transform: rotate(-45deg) scale(1.4) !important; }

/* Emergency button pulse */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.88; transform: scale(1.03); }
}
.animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }

/* Loading text pulse */
@keyframes subtle-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
.animate-subtle-pulse { animation: subtle-pulse 1.5s ease-in-out infinite; }

/* Styled scrollbar (list panels) */
.styled-scrollbar::-webkit-scrollbar { width: 6px; }
.styled-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

/* Hero gradient utility */
.hero-gradient { background: linear-gradient(135deg, #065f46 0%, #047857 40%, #10b981 100%); }

/* Card lift animation */
.card-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15); }

/* Modal overlay */
.modal-overlay { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
```

All transitions default to 150ms `cubic-bezier(0.4, 0, 0.2, 1)` for `color, background-color, border-color, box-shadow, opacity`.

---

## 19. i18n (Internationalization)

The `src/i18n/` directory exists (inferred from folder listing). The About page mentions support for: **English, Spanish, French, Chinese, Korean**. The i18n setup likely uses `react-i18next` or a custom context, but the UI currently renders in English only.

---

## 20. localStorage Keys

| Key | Content |
|---|---|
| `nourishnet-surplus-posts` | `SurplusPost[]` — surplus food listings |
| `nourishnet-pantry-status` | `StatusPost[]` — pantry status updates |
| `nourishnet-needs-posts` | `NeedPost[]` — anonymous food requests |
| `nourishnet-volunteer-interests` | Interest forms submitted |

All expiry-based: posts filter out entries where `expiresAt < Date.now()` on load.

---

## 21. Environment Variables

```env
VITE_CHATBOT_API=https://your-backend.com/api/chat
# Defaults to /api/chat if not set
```

---

## 22. Build & Dev Commands

```bash
cd nourishnet
npm install
npm run dev      # http://localhost:5173
npm run build    # output to dist/
npm run preview  # preview built output
```

Vite config uses `@tailwindcss/vite` plugin and `@vitejs/plugin-react`.

---

## 23. Data Pipeline (Generating catalog.json)

The root directory contains Python scripts for building the data catalogs from raw sources:

- `build_catalogs.py` — master build script
- `build_consumer_catalog.py` — consumer catalog builder
- `unify_cafb.py` — unifies Capital Area Food Bank data
- `unify_farmers_markets.py` — unifies farmers market data
- `unify_pantries.py` — unifies pantry data
- `geocode_catalog.js` — geocodes addresses to lat/lng
- `clean_data.py`, `clean_data_pass2.py` — data cleaning passes
- `fix_donor_counties.py` — fixes county assignment
- `finalize_unified.py` — final merge

**Data sources referenced:**
- 211 Maryland (food pantries/banks)
- Capital Area Food Bank (CAFB)
- USDA SNAP retailer locator
- Feeding America network
- Maryland farmers markets directory
- Census tracts + RFEI (Retail Food Environment Index) data

**To replicate with mock data:**
Create `public/data/catalog.json` with this structure:
```json
{
  "schemaVersion": "2.0",
  "generatedAt": "2026-04-13T00:00:00Z",
  "sources": [],
  "places": [
    {
      "id": "unique-id-1",
      "type": "pantry",
      "name": "Example Food Pantry",
      "address": "123 Main St",
      "city": "Baltimore",
      "state": "MD",
      "zip": "21201",
      "county": "Baltimore City",
      "lat": 39.2904,
      "lng": -76.6122,
      "phone": "410-555-0100",
      "hours": "Mon-Fri 9am-5pm",
      "eligibility": "Open to all",
      "requirements": null,
      "tags": ["hot-meals", "groceries"],
      "source": "211MD",
      "distributionModel": ["walk-in"],
      "foodFormats": ["groceries"],
      "dietaryInfo": [],
      "email": null,
      "website": null,
      "hoursStructured": null,
      "acceptsSnap": true,
      "acceptsWic": false
    }
  ],
  "opportunities": []
}
```

---

## 24. Assumptions & Known Constraints

1. **No auth:** Entirely anonymous/public. No accounts, no sign-in.
2. **No server for community features:** Everything in localStorage — data is device-local and ephemeral.
3. **No real donations processed:** The Donate Now button links to `/donate` page, no payment gateway.
4. **Maryland/DC only:** All data, geocoding bias, and county stats are scoped to MD + DC metro.
5. **Chatbot requires backend:** The only feature needing a server is DonorChatbot — the endpoint at `VITE_CHATBOT_API` should accept `{message: string, zipCode: string}` POST and return `{reply: string}`.
6. **MapLibre tile source:** OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) — free, no API key. If it goes down, swap the style URL for any MapLibre-compatible style (e.g., MapTiler, Mapbox).
7. **Geocoding rate limits:** Nominatim has 1 req/sec limit. The `useGeocode` hook debounces at 600ms which stays within limits for normal usage.
8. **Performance:** `useTransition` is used on the Consumer filter bar so heavy re-renders don't block UI. Supercluster handles 200+ markers smoothly.
9. **Mobile support:** All layouts are responsive. Map panels stack vertically on mobile (order-1/order-2). Pin sizes are larger on mobile via CSS media query.
10. **About page image:** `about-header.jpg` — fresh fruits/vegetables photo (400×340, covers full width)

---

## 25. Replication Checklist

To clone this site from scratch:

- [ ] `npm create vite@latest nourishnet -- --template react-ts`
- [ ] Install all dependencies from `package.json`
- [ ] Configure TailwindCSS 4 with `@tailwindcss/vite` plugin
- [ ] Set up React Router with `BrowserRouter` in `main.tsx`
- [ ] Create `src/index.css` with all custom classes listed in §18
- [ ] Create `src/types.ts` with all interfaces from §7
- [ ] Create all utility files: `geo.ts`, `hours.ts`, `pointInPolygon.ts`
- [ ] Create all hooks: `useCatalog.ts`, `useDonorCatalog.ts`, `useGeocode.ts`, `useGeolocation.ts`
- [ ] Build `Layout.tsx` (navbar + footer) — see §8
- [ ] Build `NourishMap.tsx` (MapLibre + Supercluster) — see §15
- [ ] Build all 6 pages — see §9–§14
- [ ] Build all supporting components (EmergencyFoodModal, SurplusFoodBoard, etc.)
- [ ] Create `public/images/` with all 7 images
- [ ] Create `public/data/catalog.json` and `donor_catalog.json` (or generate from scripts)
- [ ] Create `public/data/md_counties.geojson` (Maryland county GeoJSON)
- [ ] Set `VITE_CHATBOT_API` env var for chatbot feature (optional)
- [ ] Run `npm run dev` and verify all routes
