import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  availability: string[];
  interests: string;
  message: string;
  zip: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  placeName: string | null;
  status: "available" | "matched" | "inactive";
  createdAt: number;
}

export interface VolunteerMatch {
  id: string;
  volunteerId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  placeName: string;
  placeAddress: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

// ─── Volunteer CRUD ───────────────────────────────────────────────────────────

export async function insertVolunteer(v: Omit<Volunteer, "id" | "status" | "createdAt">): Promise<Volunteer | null> {
  const { data, error } = await supabase
    .from("volunteers")
    .insert({
      name: v.name,
      email: v.email,
      phone: v.phone,
      availability: v.availability,
      interests: v.interests,
      message: v.message,
      zip: v.zip,
      opportunity_id: v.opportunityId,
      opportunity_title: v.opportunityTitle,
      place_name: v.placeName,
    })
    .select()
    .single();

  if (error) { console.error("insertVolunteer:", error); return null; }
  return rowToVolunteer(data);
}

export async function fetchAvailableVolunteers(): Promise<Volunteer[]> {
  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) { console.error("fetchAvailableVolunteers:", error); return []; }
  return (data ?? []).map(rowToVolunteer);
}

export async function fetchVolunteersByZip(zip: string): Promise<Volunteer[]> {
  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .eq("status", "available")
    .eq("zip", zip)
    .order("created_at", { ascending: false });

  if (error) { console.error("fetchVolunteersByZip:", error); return []; }
  return (data ?? []).map(rowToVolunteer);
}

// ─── Match CRUD ───────────────────────────────────────────────────────────────

export async function createMatch(m: Omit<VolunteerMatch, "id" | "status" | "createdAt">): Promise<VolunteerMatch | null> {
  const { data, error } = await supabase
    .from("volunteer_matches")
    .insert({
      volunteer_id: m.volunteerId,
      donor_name: m.donorName,
      donor_email: m.donorEmail,
      donor_phone: m.donorPhone,
      place_name: m.placeName,
      place_address: m.placeAddress,
      message: m.message,
    })
    .select()
    .single();

  if (error) { console.error("createMatch:", error); return null; }

  // Mark volunteer as matched
  await supabase.from("volunteers").update({ status: "matched" }).eq("id", m.volunteerId);

  return rowToMatch(data);
}

export async function fetchMatchesForVolunteer(volunteerId: string): Promise<VolunteerMatch[]> {
  const { data, error } = await supabase
    .from("volunteer_matches")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .order("created_at", { ascending: false });

  if (error) { console.error("fetchMatchesForVolunteer:", error); return []; }
  return (data ?? []).map(rowToMatch);
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToVolunteers(onUpdate: () => void) {
  const channel = supabase
    .channel("volunteers-board")
    .on("postgres_changes", { event: "*", schema: "public", table: "volunteers" }, onUpdate)
    .on("postgres_changes", { event: "*", schema: "public", table: "volunteer_matches" }, onUpdate)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToVolunteer(r: Record<string, unknown>): Volunteer {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    phone: (r.phone as string) ?? "",
    availability: (r.availability as string[]) ?? [],
    interests: (r.interests as string) ?? "",
    message: (r.message as string) ?? "",
    zip: (r.zip as string) ?? "",
    opportunityId: (r.opportunity_id as string) ?? null,
    opportunityTitle: (r.opportunity_title as string) ?? null,
    placeName: (r.place_name as string) ?? null,
    status: r.status as Volunteer["status"],
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

function rowToMatch(r: Record<string, unknown>): VolunteerMatch {
  return {
    id: r.id as string,
    volunteerId: r.volunteer_id as string,
    donorName: r.donor_name as string,
    donorEmail: r.donor_email as string,
    donorPhone: (r.donor_phone as string) ?? "",
    placeName: (r.place_name as string) ?? "",
    placeAddress: (r.place_address as string) ?? "",
    message: (r.message as string) ?? "",
    status: r.status as VolunteerMatch["status"],
    createdAt: new Date(r.created_at as string).getTime(),
  };
}
