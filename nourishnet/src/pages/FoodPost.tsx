import { useState, useEffect, useCallback } from "react";
import type { SurplusPost } from "../components/SurplusFoodBoard";
import type { StatusPost } from "../components/LivePantryStatus";
import type { NeedPost } from "../components/CommunityNeedsBoard";
import {
  fetchSurplusPosts, insertSurplusPost, deleteSurplusPost, claimSurplusPost,
  fetchStatusPosts, insertStatusPost, deleteStatusPost,
  fetchNeedPosts, insertNeedPost, deleteNeedPost, fulfillNeedPost,
  subscribeToCommunity,
} from "../lib/community-db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function timeLeft(ms: number): string {
  const d = ms - Date.now();
  if (d <= 0) return "Expired";
  const h = Math.floor(d / 3_600_000);
  const m = Math.floor((d % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  produce:  { label: "🥦 Fresh produce available", color: "bg-green-100 text-green-800 border-green-200" },
  closure:  { label: "🔴 Closed today",            color: "bg-red-100 text-red-800 border-red-200" },
  "no-id":  { label: "✅ No ID required today",    color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  extended: { label: "⏰ Extended hours today",     color: "bg-blue-100 text-blue-800 border-blue-200" },
  shortage: { label: "⚠️ Limited supply today",    color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  special:  { label: "🎁 Special items available", color: "bg-purple-100 text-purple-800 border-purple-200" },
  other:    { label: "📢 General announcement",    color: "bg-gray-100 text-gray-800 border-gray-200" },
};

const URGENCY_LABELS: Record<string, string> = {
  today: "⚡ Need today", week: "📅 This week", flexible: "🕐 Flexible",
};
const MOBILITY_LABELS: Record<string, string> = {
  walk: "🚶 Can walk", delivery: "🏠 Need delivery", either: "🚶/🏠 Either",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = "all" | "surplus" | "update" | "need";

const FILTERS: { id: Filter; icon: string; label: string }[] = [
  { id: "all",     icon: "📋", label: "All Posts" },
  { id: "surplus", icon: "🍱", label: "Surplus Food" },
  { id: "update",  icon: "📢", label: "Pantry Updates" },
  { id: "need",    icon: "🤝", label: "Food Requests" },
];

const FOOD_TYPES = [
  "Cooked Meals", "Bread / Bakery", "Produce / Vegetables", "Fruits",
  "Canned Goods", "Dairy", "Meat / Protein", "Beverages",
  "Baby Food / Formula", "Prepared Meals", "Mixed Groceries", "Other",
];
const STATUS_TYPES = Object.entries(STATUS_META).map(([value, m]) => ({ value, ...m }));
const NEED_TYPES = [
  "Baby Formula / Diapers", "Halal / Kosher Food", "Diabetic-Friendly Food",
  "Fresh Produce", "Canned Goods / Shelf-Stable", "Prepared / Hot Meals",
  "Pet Food", "Hygiene Products", "Other",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function FoodPost() {
  const [filter, setFilter]       = useState<Filter>("all");
  const [surplus, setSurplus]     = useState<SurplusPost[]>([]);
  const [statuses, setStatuses]   = useState<StatusPost[]>([]);
  const [needs, setNeeds]         = useState<NeedPost[]>([]);
  const [loading, setLoading]     = useState(true);

  const reload = useCallback(async () => {
    const [s, st, n] = await Promise.all([
      fetchSurplusPosts(),
      fetchStatusPosts(),
      fetchNeedPosts(),
    ]);
    setSurplus(s);
    setStatuses(st);
    setNeeds(n);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    // Realtime: auto-refresh when any table changes
    const unsub = subscribeToCommunity(() => reload());
    return unsub;
  }, [reload]);

  const counts = {
    all: surplus.length + statuses.length + needs.filter(n => !n.fulfilled).length,
    surplus: surplus.length,
    update: statuses.length,
    need: needs.filter(n => !n.fulfilled).length,
  };

  if (loading) {
    return (
      <div>
        <div className="bg-gradient-to-r from-violet-600 to-violet-500 text-white py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-1">Community Food Board</h1>
            <p className="text-violet-100">Surplus food, pantry updates, and food requests — all in one place.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">Loading posts…</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-500 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">Community Food Board</h1>
          <p className="text-violet-100">Surplus food, pantry updates, and food requests — all in one place.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-5 items-start">

          {/* ── Left panel: category filter ── */}
          <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0 sticky top-20">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Browse</p>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filter === f.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </span>
                {counts[f.id] > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    filter === f.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {counts[f.id]}
                  </span>
                )}
              </button>
            ))}

            {/* Mobile: tab switcher shown below on sm */}
          </aside>

          {/* ── Center: posts feed ── */}
          <main className="flex-1 min-w-0">
            {/* Mobile filter tabs */}
            <div className="flex gap-1 mb-4 md:hidden overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filter === f.id ? "bg-violet-600 text-white" : "bg-white border border-gray-200 text-gray-600"
                  }`}
                >
                  {f.icon} {f.label}
                  {counts[f.id] > 0 && <span className="ml-0.5">({counts[f.id]})</span>}
                </button>
              ))}
            </div>

            <Feed
              filter={filter}
              surplus={surplus}
              statuses={statuses}
              needs={needs}
              onDelete={async (type, id) => {
                if (type === "surplus") { await deleteSurplusPost(id); setSurplus(s => s.filter(p => p.id !== id)); }
                if (type === "update")  { await deleteStatusPost(id);  setStatuses(s => s.filter(p => p.id !== id)); }
                if (type === "need")    { await deleteNeedPost(id);    setNeeds(s => s.filter(p => p.id !== id)); }
              }}
              onFulfill={async (id) => {
                await fulfillNeedPost(id);
                setNeeds(s => s.map(p => p.id === id ? { ...p, fulfilled: true } : p));
              }}
              onClaim={async (id) => {
                await claimSurplusPost(id);
                setSurplus(s => s.map(p => p.id === id ? { ...p, claimed: true } : p));
              }}
            />
          </main>

          {/* ── Right panel: post form ── */}
          <aside className="hidden lg:block w-80 shrink-0 sticky top-20">
            <PostForm filter={filter} onPosted={reload} />
          </aside>
        </div>

        {/* Mobile post button — fixed bottom */}
        <MobilePostButton filter={filter} onPosted={reload} />
      </div>
    </div>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

function Feed({
  filter, surplus, statuses, needs, onDelete, onFulfill, onClaim,
}: {
  filter: Filter;
  surplus: SurplusPost[];
  statuses: StatusPost[];
  needs: NeedPost[];
  onDelete: (type: "surplus" | "update" | "need", id: string) => void;
  onFulfill: (id: string) => void;
  onClaim: (id: string) => void;
}) {
  const activeNeeds = needs.filter(n => !n.fulfilled);

  const showSurplus  = filter === "all" || filter === "surplus";
  const showStatuses = filter === "all" || filter === "update";
  const showNeeds    = filter === "all" || filter === "need";

  const empty = (
    (filter === "all"     && surplus.length === 0 && statuses.length === 0 && activeNeeds.length === 0) ||
    (filter === "surplus" && surplus.length === 0) ||
    (filter === "update"  && statuses.length === 0) ||
    (filter === "need"    && activeNeeds.length === 0)
  );

  if (empty) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-600 font-medium">No posts yet</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to post something here.</p>
      </div>
    );
  }

  // Unified sorted feed for "all"
  if (filter === "all") {
    type Item =
      | { type: "surplus"; data: SurplusPost }
      | { type: "update";  data: StatusPost  }
      | { type: "need";    data: NeedPost    };

    const items: Item[] = [
      ...surplus.map(d => ({ type: "surplus" as const, data: d })),
      ...statuses.map(d => ({ type: "update" as const, data: d })),
      ...activeNeeds.map(d => ({ type: "need" as const, data: d })),
    ].sort((a, b) => b.data.postedAt - a.data.postedAt);

    return (
      <div className="space-y-3">
        {items.map((item) => {
          if (item.type === "surplus") return <SurplusCard key={item.data.id} post={item.data} onDelete={id => onDelete("surplus", id)} onClaim={onClaim} />;
          if (item.type === "update")  return <StatusCard  key={item.data.id} post={item.data} onDelete={id => onDelete("update", id)} />;
          return <NeedCard key={item.data.id} post={item.data} onDelete={id => onDelete("need", id)} onFulfill={onFulfill} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showSurplus  && surplus.map(p =>      <SurplusCard key={p.id} post={p} onDelete={id => onDelete("surplus", id)} onClaim={onClaim} />)}
      {showStatuses && statuses.map(p =>     <StatusCard  key={p.id} post={p} onDelete={id => onDelete("update", id)} />)}
      {showNeeds    && activeNeeds.map(p =>  <NeedCard    key={p.id} post={p} onDelete={id => onDelete("need", id)} onFulfill={onFulfill} />)}
    </div>
  );
}

// ─── Post cards ───────────────────────────────────────────────────────────────

function SurplusCard({ post, onDelete, onClaim }: { post: SurplusPost; onDelete: (id: string) => void; onClaim: (id: string) => void }) {
  const urgent = post.expiresAt - Date.now() < 2 * 3_600_000;
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🍱 Surplus Food</span>
          <span className="font-semibold text-sm text-gray-900">{post.foodType}</span>
          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">{post.quantity}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${urgent ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          ⏱ {timeLeft(post.expiresAt)}
        </span>
      </div>
      {post.description && <p className="text-sm text-gray-600 mb-2">{post.description}</p>}
      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
        <div>📍 ZIP {post.pickupZip}{post.pickupAddress ? ` — ${post.pickupAddress}` : ""}</div>
        <div>📞 {post.contact}</div>
        <div className="text-gray-400">{timeAgo(post.postedAt)}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onClaim(post.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">
          ✋ I Can Pick This Up
        </button>
        <button onClick={() => onDelete(post.id)} className="text-gray-300 hover:text-red-400 px-2 py-2 rounded-xl hover:bg-red-50 transition-colors text-xs">🗑</button>
      </div>
    </div>
  );
}

function StatusCard({ post, onDelete }: { post: StatusPost; onDelete: (id: string) => void }) {
  const meta = STATUS_META[post.statusType] ?? STATUS_META.other;
  return (
    <div className={`rounded-2xl border shadow-sm p-4 ${meta.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">📢 Pantry Update</span>
            <span className="text-xs font-bold">{meta.label}</span>
          </div>
          <p className="font-semibold text-sm">{post.pantryName} <span className="font-normal text-xs opacity-70">· ZIP {post.zip}</span></p>
          {post.message && <p className="text-xs mt-1 opacity-80">{post.message}</p>}
          <p className="text-xs opacity-50 mt-1">{timeAgo(post.postedAt)} · expires in {timeLeft(post.expiresAt)}</p>
        </div>
        <button onClick={() => onDelete(post.id)} className="shrink-0 opacity-30 hover:opacity-70 text-xs">✕</button>
      </div>
    </div>
  );
}

function NeedCard({ post, onDelete, onFulfill }: { post: NeedPost; onDelete: (id: string) => void; onFulfill: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🤝 Food Request</span>
          <span className="font-semibold text-sm text-gray-900">{post.needType}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
          post.urgency === "today" ? "bg-red-100 text-red-700" : post.urgency === "week" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
        }`}>{URGENCY_LABELS[post.urgency]}</span>
      </div>
      {post.details && <p className="text-sm text-gray-600 mb-2">{post.details}</p>}
      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
        <div>📍 Near ZIP {post.zip}</div>
        <div>{MOBILITY_LABELS[post.mobility]}</div>
        <div className="text-gray-400">{timeAgo(post.postedAt)}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onFulfill(post.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">
          ✋ I Can Help
        </button>
        <button onClick={() => onDelete(post.id)} className="text-gray-300 hover:text-red-400 px-2 py-2 rounded-xl hover:bg-red-50 transition-colors text-xs">🗑</button>
      </div>
    </div>
  );
}

// ─── Post Form (right panel) ──────────────────────────────────────────────────

function PostForm({ filter, onPosted }: { filter: Filter; onPosted: () => void }) {
  const [formType, setFormType] = useState<"surplus" | "update" | "need">(
    filter === "need" ? "need" : filter === "update" ? "update" : "surplus"
  );

  // Sync formType when filter changes
  useEffect(() => {
    if (filter !== "all") setFormType(filter as "surplus" | "update" | "need");
  }, [filter]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-violet-600 text-white px-4 py-3">
        <p className="font-bold text-sm">Create a Post</p>
      </div>

      {/* Form type tabs */}
      <div className="flex border-b border-gray-100">
        {(["surplus", "update", "need"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFormType(t)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              formType === t ? "border-b-2 border-violet-600 text-violet-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "surplus" ? "🍱 Surplus" : t === "update" ? "📢 Update" : "🤝 Request"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {formType === "surplus" && <SurplusForm onPosted={onPosted} />}
        {formType === "update"  && <UpdateForm  onPosted={onPosted} />}
        {formType === "need"    && <NeedForm    onPosted={onPosted} />}
      </div>
    </div>
  );
}

// ─── Surplus form ─────────────────────────────────────────────────────────────

function SurplusForm({ onPosted }: { onPosted: () => void }) {
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [expiryHours, setExpiryHours] = useState(4);
  const [pickupZip, setPickupZip] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!foodType) return setError("Please select a food type.");
    if (!quantity.trim()) return setError("Please enter a quantity.");
    if (!/^\d{5}$/.test(pickupZip.trim())) return setError("Please enter a valid 5-digit ZIP.");
    if (!contact.trim()) return setError("Please enter a contact method.");

    const post: SurplusPost = {
      id: crypto.randomUUID(), foodType,
      quantity: quantity.trim(), description: description.trim().slice(0, 300),
      expiresAt: Date.now() + expiryHours * 3_600_000, pickupZip: pickupZip.trim(),
      pickupAddress: pickupAddress.trim(), contact: contact.trim(),
      postedAt: Date.now(), claimed: false,
    };
    const ok = await insertSurplusPost(post);
    if (!ok) return setError("Failed to post — please try again.");
    setFoodType(""); setQuantity(""); setDescription(""); setPickupZip(""); setPickupAddress(""); setContact("");
    setDone(true); onPosted(); setTimeout(() => setDone(false), 3000);
  }, [foodType, quantity, description, expiryHours, pickupZip, pickupAddress, contact, onPosted]);

  if (done) return <p className="text-green-600 font-semibold text-sm text-center py-4">✅ Posted! It's now visible to everyone.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Food Type *</label>
        <select value={foodType} onChange={e => setFoodType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
          <option value="">Select…</option>
          {FOOD_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
        <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 50 lbs, 20 meals" maxLength={80} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={300} placeholder="Optional details…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Available for</label>
          <select value={expiryHours} onChange={e => setExpiryHours(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
            {[2,4,8,24,48].map(h => <option key={h} value={h}>{h}h</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup ZIP *</label>
          <input type="text" value={pickupZip} onChange={e => setPickupZip(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="20743" maxLength={5} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup Address</label>
        <input type="text" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="Street or cross streets" maxLength={120} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Contact *</label>
        <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone or email" maxLength={100} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-colors">Post Surplus Food</button>
    </form>
  );
}

// ─── Pantry update form ───────────────────────────────────────────────────────

function UpdateForm({ onPosted }: { onPosted: () => void }) {
  const [pantryName, setPantryName] = useState("");
  const [zip, setZip] = useState("");
  const [statusType, setStatusType] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pantryName.trim()) return setError("Please enter the pantry name.");
    if (!statusType) return setError("Please select a status type.");
    if (!/^\d{5}$/.test(zip.trim())) return setError("Please enter a valid 5-digit ZIP.");

    const post: StatusPost = {
      id: crypto.randomUUID(), pantryName: pantryName.trim().slice(0, 80),
      zip: zip.trim(), statusType, message: message.trim().slice(0, 200),
      postedAt: Date.now(), expiresAt: Date.now() + 48 * 3_600_000,
    };
    const ok = await insertStatusPost(post);
    if (!ok) return setError("Failed to post — please try again.");
    setPantryName(""); setZip(""); setStatusType(""); setMessage("");
    setDone(true); onPosted(); setTimeout(() => setDone(false), 3000);
  }, [pantryName, zip, statusType, message, onPosted]);

  if (done) return <p className="text-green-600 font-semibold text-sm text-center py-4">✅ Update posted for 48 hours.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Pantry / Organization *</label>
        <input type="text" value={pantryName} onChange={e => setPantryName(e.target.value)} placeholder="e.g. Prince George's Food Bank" maxLength={80} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">ZIP Code *</label>
        <input type="text" value={zip} onChange={e => setZip(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="e.g. 20743" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Status *</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TYPES.map(s => (
            <button key={s.value} type="button" onClick={() => setStatusType(s.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${statusType === s.value ? s.color + " ring-2 ring-offset-1 ring-violet-400" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Additional details</label>
        <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Fresh bread until 2pm…" maxLength={200} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-colors">Post Update</button>
    </form>
  );
}

// ─── Food request form ────────────────────────────────────────────────────────

function NeedForm({ onPosted }: { onPosted: () => void }) {
  const [needType, setNeedType] = useState("");
  const [zip, setZip] = useState("");
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState<NeedPost["urgency"]>("week");
  const [mobility, setMobility] = useState<NeedPost["mobility"]>("either");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!needType) return setError("Please select what you need.");
    if (!/^\d{5}$/.test(zip.trim())) return setError("Please enter a valid 5-digit ZIP.");

    const post: NeedPost = {
      id: crypto.randomUUID(), needType, zip: zip.trim(),
      details: details.trim().slice(0, 200), urgency, mobility,
      postedAt: Date.now(), expiresAt: Date.now() + 7 * 24 * 3_600_000, fulfilled: false,
    };
    const ok = await insertNeedPost(post);
    if (!ok) return setError("Failed to post — please try again.");
    setNeedType(""); setZip(""); setDetails(""); setUrgency("week"); setMobility("either");
    setDone(true); onPosted(); setTimeout(() => setDone(false), 3000);
  }, [needType, zip, details, urgency, mobility, onPosted]);

  if (done) return <p className="text-green-600 font-semibold text-sm text-center py-4">✅ Request posted anonymously.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-gray-500">No name, no ID — completely anonymous.</p>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">I need *</label>
        <select value={needType} onChange={e => setNeedType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
          <option value="">Select…</option>
          {NEED_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Near ZIP *</label>
        <input type="text" inputMode="numeric" value={zip} onChange={e => setZip(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="e.g. 20743" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency</label>
          <select value={urgency} onChange={e => setUrgency(e.target.value as NeedPost["urgency"])} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
            <option value="today">⚡ Need today</option>
            <option value="week">📅 This week</option>
            <option value="flexible">🕐 Flexible</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Can travel?</label>
          <select value={mobility} onChange={e => setMobility(e.target.value as NeedPost["mobility"])} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
            <option value="walk">🚶 Yes</option>
            <option value="delivery">🏠 Need delivery</option>
            <option value="either">🚶/🏠 Either</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Details (optional)</label>
        <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2} maxLength={200} placeholder="e.g. Halal-certified, family of 4…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-colors">Post Request</button>
    </form>
  );
}

// ─── Mobile post button ───────────────────────────────────────────────────────

function MobilePostButton({ filter, onPosted }: { filter: Filter; onPosted: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 bg-violet-600 text-white font-bold px-5 py-3 rounded-2xl shadow-lg text-sm z-50 flex items-center gap-2"
      >
        ✏️ Post
      </button>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="bg-violet-600 text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <p className="font-bold">Create a Post</p>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-4">
              <PostForm filter={filter} onPosted={() => { onPosted(); setOpen(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
