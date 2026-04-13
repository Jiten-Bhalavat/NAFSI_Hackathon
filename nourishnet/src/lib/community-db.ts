import { supabase } from "./supabase";
import type { SurplusPost } from "../components/SurplusFoodBoard";
import type { StatusPost } from "../components/LivePantryStatus";
import type { NeedPost } from "../components/CommunityNeedsBoard";

// ─── Surplus Food ─────────────────────────────────────────────────────────────

export async function fetchSurplusPosts(): Promise<SurplusPost[]> {
  const { data, error } = await supabase
    .from("surplus_posts")
    .select("*")
    .eq("claimed", false)
    .gt("expires_at", new Date().toISOString())
    .order("posted_at", { ascending: false });

  if (error) { console.error("fetchSurplusPosts:", error); return []; }
  return (data ?? []).map(rowToSurplus);
}

export async function insertSurplusPost(post: SurplusPost): Promise<boolean> {
  const { error } = await supabase.from("surplus_posts").insert(surplusToRow(post));
  if (error) { console.error("insertSurplusPost:", error); return false; }
  return true;
}

export async function deleteSurplusPost(id: string): Promise<boolean> {
  const { error } = await supabase.from("surplus_posts").delete().eq("id", id);
  if (error) { console.error("deleteSurplusPost:", error); return false; }
  return true;
}

export async function claimSurplusPost(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("surplus_posts")
    .update({ claimed: true })
    .eq("id", id);
  if (error) { console.error("claimSurplusPost:", error); return false; }
  return true;
}

function surplusToRow(p: SurplusPost) {
  return {
    id: p.id,
    food_type: p.foodType,
    quantity: p.quantity,
    description: p.description,
    expires_at: new Date(p.expiresAt).toISOString(),
    pickup_zip: p.pickupZip,
    pickup_address: p.pickupAddress,
    contact: p.contact,
    posted_at: new Date(p.postedAt).toISOString(),
    claimed: p.claimed,
  };
}

function rowToSurplus(r: Record<string, unknown>): SurplusPost {
  return {
    id: r.id as string,
    foodType: r.food_type as string,
    quantity: r.quantity as string,
    description: (r.description as string) ?? "",
    expiresAt: new Date(r.expires_at as string).getTime(),
    pickupZip: r.pickup_zip as string,
    pickupAddress: (r.pickup_address as string) ?? "",
    contact: r.contact as string,
    postedAt: new Date(r.posted_at as string).getTime(),
    claimed: r.claimed as boolean,
  };
}

// ─── Pantry Status Updates ────────────────────────────────────────────────────

export async function fetchStatusPosts(): Promise<StatusPost[]> {
  const { data, error } = await supabase
    .from("status_posts")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("posted_at", { ascending: false });

  if (error) { console.error("fetchStatusPosts:", error); return []; }
  return (data ?? []).map(rowToStatus);
}

export async function insertStatusPost(post: StatusPost): Promise<boolean> {
  const { error } = await supabase.from("status_posts").insert(statusToRow(post));
  if (error) { console.error("insertStatusPost:", error); return false; }
  return true;
}

export async function deleteStatusPost(id: string): Promise<boolean> {
  const { error } = await supabase.from("status_posts").delete().eq("id", id);
  if (error) { console.error("deleteStatusPost:", error); return false; }
  return true;
}

function statusToRow(p: StatusPost) {
  return {
    id: p.id,
    pantry_name: p.pantryName,
    zip: p.zip,
    status_type: p.statusType,
    message: p.message,
    posted_at: new Date(p.postedAt).toISOString(),
    expires_at: new Date(p.expiresAt).toISOString(),
  };
}

function rowToStatus(r: Record<string, unknown>): StatusPost {
  return {
    id: r.id as string,
    pantryName: r.pantry_name as string,
    zip: r.zip as string,
    statusType: r.status_type as string,
    message: (r.message as string) ?? "",
    postedAt: new Date(r.posted_at as string).getTime(),
    expiresAt: new Date(r.expires_at as string).getTime(),
  };
}

// ─── Community Needs / Food Requests ──────────────────────────────────────────

export async function fetchNeedPosts(): Promise<NeedPost[]> {
  const { data, error } = await supabase
    .from("need_posts")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("posted_at", { ascending: false });

  if (error) { console.error("fetchNeedPosts:", error); return []; }
  return (data ?? []).map(rowToNeed);
}

export async function insertNeedPost(post: NeedPost): Promise<boolean> {
  const { error } = await supabase.from("need_posts").insert(needToRow(post));
  if (error) { console.error("insertNeedPost:", error); return false; }
  return true;
}

export async function deleteNeedPost(id: string): Promise<boolean> {
  const { error } = await supabase.from("need_posts").delete().eq("id", id);
  if (error) { console.error("deleteNeedPost:", error); return false; }
  return true;
}

export async function fulfillNeedPost(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("need_posts")
    .update({ fulfilled: true })
    .eq("id", id);
  if (error) { console.error("fulfillNeedPost:", error); return false; }
  return true;
}

function needToRow(p: NeedPost) {
  return {
    id: p.id,
    need_type: p.needType,
    zip: p.zip,
    details: p.details,
    urgency: p.urgency,
    mobility: p.mobility,
    posted_at: new Date(p.postedAt).toISOString(),
    expires_at: new Date(p.expiresAt).toISOString(),
    fulfilled: p.fulfilled,
  };
}

function rowToNeed(r: Record<string, unknown>): NeedPost {
  return {
    id: r.id as string,
    needType: r.need_type as string,
    zip: r.zip as string,
    details: (r.details as string) ?? "",
    urgency: r.urgency as NeedPost["urgency"],
    mobility: r.mobility as NeedPost["mobility"],
    postedAt: new Date(r.posted_at as string).getTime(),
    expiresAt: new Date(r.expires_at as string).getTime(),
    fulfilled: r.fulfilled as boolean,
  };
}

// ─── Realtime subscription helper ─────────────────────────────────────────────

export function subscribeToCommunity(onUpdate: () => void) {
  const channel = supabase
    .channel("community-board")
    .on("postgres_changes", { event: "*", schema: "public", table: "surplus_posts" }, onUpdate)
    .on("postgres_changes", { event: "*", schema: "public", table: "status_posts" }, onUpdate)
    .on("postgres_changes", { event: "*", schema: "public", table: "need_posts" }, onUpdate)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
