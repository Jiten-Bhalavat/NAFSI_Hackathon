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
  places: Place[];
  opportunities: Opportunity[];
}
