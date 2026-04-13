export interface DayHours {
  day: string;
  hours: string;
  byAppointment: boolean;
  residentsOnly: boolean;
  notes: string | null;
}

export interface SourceMeta {
  id: string;
  name: string;
  recordCount: number;
  lastUpdated: string;
}

export interface Place {
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
  hours: string;
  eligibility: string;
  requirements: string | null;
  tags: string[];
  source: string;
  // New fields — all optional-safe for backward compatibility
  distributionModel: string[];
  foodFormats: string[];
  dietaryInfo: string[];
  email: string | null;
  website: string | null;
  hoursStructured: DayHours[] | null;
}

export interface Opportunity {
  id: string;
  placeId: string;
  type: "donation" | "volunteering";
  title: string;
  summary: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  schedule: string;
  needsTags: string[];
}

export interface Catalog {
  schemaVersion: string;
  generatedAt: string;
  sources: SourceMeta[];
  places: Place[];
  opportunities: Opportunity[];
}

/* ── Donor-specific types ── */

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
  year: string;
  foodInsecurePopulation: number;
  foodInsecurityRate: number | null;
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
  donorPlaces: DonorPlace[];        // pantries + food banks — where to donate
  partnerMarkets: DonorPlace[];     // farmers markets — partnership context
  supplyGapStores: DonorPlace[];    // PG County stores — supply gap analysis
  countyStats: CountyStat[];
  priorityTracts: PriorityTract[];
}
