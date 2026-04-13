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

---

## 26. Prompt Engineering Log — All Prompts Used to Build NourishNet

> This section documents every prompt and task given to the AI assistant across all sessions that produced this project. Reconstructed from `PROMPTS.md`, `Prompts_Sahil.md`, git commit history, and conversation logs. The project was built across 2 days (April 12–13, 2026) with ~70 commits.

---

### Phase 1 — Data Scraping & Pipeline

**Prompt 1**
> Scrape the Feeding America Maryland website for food resource data.

**Prompt 2**
> Scrape Capital Area Food Bank (CAFB) data — 382 food banks with real lat/lon, per-day hours, TEFAP eligibility.

**Prompt 3**
> Scrape SNAP Retailer Locator data (4,196 rows) and Caroline County food pantries.

**Prompt 4**
> Scrape and add farmers market data.

**Prompt 5**
> Add pantry data from multiple sources (211md, pantry2, food_pantries_unified).

**Prompt 6**
> Add data cleaning scripts and clean all datasets — remove duplicates, normalize fields.

**Prompt 7**
> Add a food-only filter script to strip non-food entries from the datasets.

---

### Phase 2 — Initial Frontend Build

**Prompt 8** *(Verbatim — the big initial project setup prompt)*
> We're building a small React app for a class challenge called NourishNet. The idea is to help people in Maryland and the DC metro area find food assistance, figure out how to donate, and find volunteer opportunities. Everything has to be open source and deploy as a static site on GitHub Pages—no backend, no AWS services, no paid APIs. Please use Vite with React and TypeScript, React Router for pages, and Tailwind or CSS Modules for styling—your pick, but stick to one. For maps we want Leaflet with react-leaflet, marker clustering when there are a lot of points, and standard OpenStreetMap tiles with the usual attribution. Use npm. All the content will come from one file: public/data/catalog.json. We'll replace it later with real merged data; for now please include a realistic sample with at least eight places (six with latitude/longitude and two without coordinates so we can test edge cases) and six "opportunities" split between donation and volunteering.
>
> The JSON should look roughly like this conceptually: a schema version and timestamp at the top, then an array of places (name, address fields, county optional, lat/lng nullable, phone, hours, eligibility and requirements text, tags, and source info), and an array of opportunities that can link to a place by id. Each opportunity is either donation or volunteering, with a title, short summary, contact fields, schedule notes, and optional needs tags.
>
> We need three different interfaces, not one page with a toggle:
> - **Consumer** — People looking for food. ZIP or city search, optional "use my location" with a short honest line about what the browser will do. Map with clustered markers plus a list that stays in sync — filters for things like county and day of week if the data supports it. Tapping or selecting a place should show details: hours, rules, phone as a real tel link, and a directions link built from the address. If something doesn't have coordinates, it should still show in the list and never break the app.
> - **Donor** — People who want to give food or money. This should feel different from the consumer view: emphasize what's needed and how to help, not just distance. Filter by type of giving and needs when we have tags. Show donation-type opportunities prominently and use a map only for locations that make sense.
> - **Planner** — People who want to volunteer or help coordinate. Show volunteering opportunities, filters like weekday vs weekend and county, radius from a ZIP if you can do it simply. Use a different marker color than the consumer map. List can be grouped by day if schedule text makes that reasonable; if not, distance sorting is fine.
>
> Also add a simple home page with three big cards that link to those three areas, and an About page that says data might be incomplete, where it came from in general terms, and that users should double-check hours with the organization. Set things up so GitHub Pages works: Vite base path and React Router basename should follow import.meta.env.BASE_URL. Keep accessibility in mind: don't hide important info only on the map, use proper labels and focus styles, and make sure keyboard users aren't stuck.

**Prompt 9** *(Verbatim)*
> Keep the file structure as clean as possible and easy to understand and locate. Also why did you create a `.vscode` folder?

**Prompt 10** *(Verbatim)*
> I want to overlay the region as well. For example if I select on college park area there should be a border, it should show me all the options within that location of college park. Also currently it only accepts zip code, I should be able to enter my city, state or county or address there in order to search for nearby options.

**Prompt 11** *(Verbatim)*
> Also, should we create a submit interest form or something on the volunteers page, so that volunteers can enter their availability or interest in donating their time and supporting at a particular location or within an area? And also make the website more user friendly and attractive, don't keep it basic.

---

### Phase 3 — Data Integration

**Prompt 12** *(Verbatim)*
> We need to unify all the data together in one and remove deduplication as we want to use the whole data in order to integrate it. Now, we have the donor data and the frontend as well, now we need to use that data to replace the mock data on the current web-app and actually get it working with the available donor data.

**Prompt 13** *(Verbatim)*
> Now we have the unified data under the data folder, check the readme file which has the guide on how the data is supposed to be used, make the use of whole donor data and let's get the donor function fully working now!

**Prompt 14** *(Verbatim)*
> Donor map is mostly blank. donor_catalog.json shows "lat": null, "lng": null for the majority of donorPlaces — these come from food_pantries_unified.csv which lacks coordinates. The map the donor sees is empty. Bake the coordinates using geocoder.

---

### Phase 4 — Map & Visualization Features

**Prompt 15** *(Verbatim)*
> We have county level food insecurity data in countyStats and a md_counties.geojson file. Can you add a choropleth overlay on the donor map that colors each county by how many people are food insecure there? Use shades of red/orange, don't use white for any bucket. Also the county names don't always match between the stats and geojson so normalize them.

**Prompt 16** *(Verbatim)*
> The food insecurity layer needs a toggle button but put it on the map itself, top right corner, not in the filter bar. Call it "Show Hunger Map" / "Hide Hunger Map" so people actually understand what it does. Also when I hover over a county on the map it should show me the county name and how many people are food insecure there. And add a small legend at the bottom left of the map, keep it in one line, dark semi-transparent background so it doesn't look like a white box sitting on the map.

**Prompt 17** *(Verbatim)*
> Make the whole website mobile friendly. On phones the map should show first and the list below it, not side by side. Map should be about 45% of the screen height on phones. Filters and buttons should go full width on small screens. Make the pins and clusters a bit bigger on mobile so they're easier to tap. Do this for all three pages not just donor.

**Prompt 18** *(Verbatim)*
> Remove that food insecurity map button from the filter bar, it's now on the map itself. Also the legend was wrapping into two lines, keep it compact. The "My Impact" button can stay in the filters. Clean up any leftover debug code.

---

### Phase 5 — Chatbot & Community Features

**Prompt 19**
> Add a chatbot to the Donor page so donors can ask questions about food pantry needs near them.

**Prompt 20**
> Deploy the chatbot backend on Railway (Python FastAPI). Set the `VITE_CHATBOT_API` environment variable to point to the deployed URL.

**Prompt 21**
> Update chatbot code — fix the response format so the AI reply renders correctly in the UI.

**Prompt 22**
> Add community platform features: emergency food modal (🚨 I Need Food Now), multi-language support (i18n), community needs board, donor tools (Surplus Food Board, Donor Impact Panel).

**Prompt 23**
> Fix Vite build error — supercluster and maplibre-gl resolution failing. Add `optimizeDeps` config to vite.config.ts.

---

### Phase 6 — Community Board

**Prompt 24**
> Fix surplus food and community needs board placement between tabs — Surplus Food should be below the maps, not above.

**Prompt 25**
> Add food insecurity bubble/heatmap map layer on the Donor page (county circles sized by population, colored by insecurity rate).

**Prompt 26**
> Add a Food Post community board page (`/food-post`) with 3-column layout: Surplus Food | Pantry Updates | Food Requests.

---

### Phase 7 — Final Polish & Bug Fixes

**Prompt 27**
> Remove multi-language (i18n) support entirely. Replace all i18n translation keys with hardcoded English strings throughout the app.

**Prompt 28** *(Verbatim from Prompts_Sahil.md)*
> There are lots of duplicates here in the filters for counties and should be normalized. Also make the design intuitive. This can be done by keeping maps and the side panel right below the search filters, so users (all donors, food seekers, and volunteers) know that by using the search filters, the change will be reflected below. Also, when each location is selected, the information of it should be available in the most readable way possible, such that in a small area maximum information can be shown in a clean structured layout. I don't want it to be either directly shown on map when clicked, or should be displayed below in least space. The search filters should be applied as soon as they are selected, and in an efficient way. We can use caching to efficiently apply the filters.

**Prompt 29** *(Verbatim from Prompts_Sahil.md)*
> The map gets updated when a search filter is clicked, but it is not shown in the card list shown on the left, that should be updated as well. Also after a search filter is clicked, it takes some time to load the filters, so this should be shown clearly to the user, so they don't spam any more filters. All the information should be visible on map when a location is selected because anyone would be expecting to see all the details on the map. Also, 🍱 Surplus Food Available should go below, and maps should be shown directly below search filters.

**Prompt 30**
> UI improvements on Donor page — visual polish, better card layout, amber color scheme.

**Prompt 31**
> Fix geolocations on Donor map — many pantry locations were not showing pins correctly.

**Prompt 32**
> Fix page jumps after route navigation changes.

**Prompt 33**
> Bugs fix: counties deduplicated + legend added in Find Food section.

**Prompt 34**
> Minor map fixes — popup rendering, boundary overlay cleanup.

**Prompt 35**
> Improve Find Food filters: type chips as single-select (clicking active chip deselects), add pagination (60 results at a time with "Show more" button), remove SNAP/WIC toggles from filter bar.

**Prompt 36**
> Update About page — redesign with cascade scrolling cards, each explaining a key aspect of NourishNet (the problem, solution, for families, for donors, privacy).

**Prompt 37**
> County list fix on Donor page — dropdown was showing duplicate county names.

**Prompt 38**
> Redesign the homepage to match a reference design — bold uppercase headings, green + dark green color scheme, large hero with donate widget, programs grid, testimonials section, events section, dot map visualization, stats bar, partners row. Use local images instead of external URLs.

**Prompt 39**
> Remove redundant Volunteer nav link from the navbar and the Find Food button from the page header (it was duplicated).

**Prompt 40**
> Clean up footer: remove the Programs column, fix the GitHub link to point to the correct repo.

**Prompt 41**
> Database connection + community food post — connect Supabase for persistent community board data.

---

### Phase 8 — Volunteer Page Data

**Prompt 42** *(Verbatim from Prompts_Sahil.md)*
> Generate Opportunity records in catalog.json from the volunteer CSVs. Each food bank becomes a volunteering opportunity with its phone, email, and hours. Each pantry with a phone number gets one too. Files: build_catalogs.py — generates opportunities[] array in catalog.json. nourishnet/src/pages/Planner.tsx: no changes needed; it already reads opportunities from catalog.

---

### Phase 9 — Documentation & Submission

**Prompt 43**
> Create a `jiten.md` file documenting every single thing about this website — how the homepage looks, what features are in each section, images, color grading, structure, data, backend, tech stack, assumptions — everything. The main aim is that if any other AI looks at it, it can replicate the same structure, same functionalities, same backend, same color grading, just like someone had cloned this.

**Prompt 44**
> Push the jiten.md to GitHub.

**Prompt 45**
> Look for the NourishNet PDF and see what they require in Prompt Engineering. Recall all the prompts I gave you and write a list of prompts I gave you to make this whole project.

**Prompt 46**
> Write all the prompts list into jiten.md. *(this prompt)*

---

### Summary Statistics

| Metric | Value |
|---|---|
| Total prompts | ~46 |
| Days to build | 2 (April 12–13, 2026) |
| Git commits | ~70 |
| Pages built | 6 (Home, Find Food, Donate, Community, Volunteer, About) |
| Components built | 22 |
| Data sources scraped | 7+ (CAFB, 211MD, SNAP, Feeding America, Farmers Markets, Census tracts, County stats) |
| Total food locations in catalog | 200+ (pantries, food banks, SNAP stores, farmers markets) |
| Lines of code | ~5,000+ |
