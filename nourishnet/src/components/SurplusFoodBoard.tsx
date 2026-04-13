import { useState, useEffect, useCallback } from "react";

export interface SurplusPost {
  id: string;
  foodType: string;
  quantity: string;
  description: string;
  expiresAt: number; // unix ms
  pickupZip: string;
  pickupAddress: string;
  contact: string;
  postedAt: number; // unix ms
  claimed: boolean;
}

const STORAGE_KEY = "nourishnet-surplus-posts";

function loadPosts(): SurplusPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: SurplusPost[] = JSON.parse(raw);
    // Remove posts expired more than 1 hour ago
    const cutoff = Date.now() - 60 * 60 * 1000;
    return parsed.filter((p) => p.expiresAt > cutoff);
  } catch {
    return [];
  }
}

function savePosts(posts: SurplusPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function timeLeft(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function formatPostedAt(ts: number): string {
  return new Date(ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

const FOOD_TYPES = [
  "Cooked Meals", "Bread / Bakery", "Produce / Vegetables", "Fruits",
  "Canned Goods", "Dairy", "Meat / Protein", "Beverages", "Baby Food / Formula",
  "Prepared Meals", "Mixed Groceries", "Other",
];

const EXPIRY_OPTIONS = [
  { label: "2 hours", value: 2 },
  { label: "4 hours", value: 4 },
  { label: "8 hours", value: 8 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
];

export default function SurplusFoodBoard() {
  const [posts, setPosts] = useState<SurplusPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tick, setTick] = useState(0); // force countdown re-render

  // Form state
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [expiryHours, setExpiryHours] = useState(4);
  const [pickupZip, setPickupZip] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [contact, setContact] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Load & clean on mount
  useEffect(() => {
    setPosts(loadPosts());
  }, []);

  // Countdown ticker every 60s
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setPosts(loadPosts()); // also prune expired
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      if (!foodType) return setFormError("Please select a food type.");
      if (!quantity.trim()) return setFormError("Please enter a quantity.");
      if (!pickupZip.trim() || !/^\d{5}$/.test(pickupZip.trim()))
        return setFormError("Please enter a valid 5-digit ZIP code.");
      if (!contact.trim()) return setFormError("Please enter a contact method.");

      const newPost: SurplusPost = {
        id: crypto.randomUUID(),
        foodType,
        quantity: quantity.trim(),
        description: description.trim().slice(0, 300),
        expiresAt: Date.now() + expiryHours * 3_600_000,
        pickupZip: pickupZip.trim(),
        pickupAddress: pickupAddress.trim(),
        contact: contact.trim(),
        postedAt: Date.now(),
        claimed: false,
      };

      const updated = [newPost, ...loadPosts()];
      savePosts(updated);
      setPosts(updated);

      // Reset form
      setFoodType("");
      setQuantity("");
      setDescription("");
      setExpiryHours(4);
      setPickupZip("");
      setPickupAddress("");
      setContact("");
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    },
    [foodType, quantity, description, expiryHours, pickupZip, pickupAddress, contact]
  );

  const claimPost = (id: string) => {
    const updated = posts.map((p) => (p.id === id ? { ...p, claimed: true } : p));
    savePosts(updated);
    setPosts(updated);
  };

  const deletePost = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    savePosts(updated);
    setPosts(updated);
  };

  const activePosts = posts.filter((p) => !p.claimed && p.expiresAt > Date.now());
  const claimedPosts = posts.filter((p) => p.claimed);

  // tick used to re-render countdowns
  void tick;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
            🍱 Surplus Food Board
          </h3>
          <p className="text-sm text-orange-700 mt-0.5">
            Have extra food? Post it here so nearby pantries or individuals can claim it before it goes to waste.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-sm transition-colors"
        >
          {showForm ? "✕ Cancel" : "+ Post Surplus Food"}
        </button>
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl px-4 py-2 text-sm font-medium mb-4">
          ✅ Your post is live! Nearby pantries and volunteers can now see and claim it.
        </div>
      )}

      {/* Post form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-orange-200 p-5 mb-5 shadow-sm"
        >
          <h4 className="font-semibold text-gray-800 mb-4">Post Available Food</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Food Type *</label>
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select type…</option>
                {FOOD_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50 lbs, 20 meals, 3 boxes"
                maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fresh baked bread from today, no allergens, halal-friendly…"
                rows={2}
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Available For *</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {EXPIRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup ZIP Code *</label>
              <input
                type="text"
                value={pickupZip}
                onChange={(e) => setPickupZip(e.target.value)}
                placeholder="e.g. 20743"
                maxLength={5}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup Address (optional)</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Street address or cross streets"
                maxLength={120}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contact (phone or email) *</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. (301) 555-0123 or name@email.com"
                maxLength={100}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {formError && (
            <p className="text-red-600 text-xs mt-3">{formError}</p>
          )}

          <button
            type="submit"
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
          >
            Post Food
          </button>
        </form>
      )}

      {/* Active posts */}
      {activePosts.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🥡</div>
          <p className="text-sm">No surplus food posted yet.</p>
          <p className="text-xs mt-1">If you have extra food, click "Post Surplus Food" to share it with the community.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {activePosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="font-semibold text-sm text-gray-900">{post.foodType}</span>
                  <span className="ml-2 text-xs text-orange-700 font-medium bg-orange-100 px-2 py-0.5 rounded-full">
                    {post.quantity}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  post.expiresAt - Date.now() < 2 * 3_600_000
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  ⏱ {timeLeft(post.expiresAt)}
                </span>
              </div>

              {post.description && (
                <p className="text-xs text-gray-600 mb-2">{post.description}</p>
              )}

              <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                <div>📍 ZIP {post.pickupZip}{post.pickupAddress ? ` — ${post.pickupAddress}` : ""}</div>
                <div>📞 {post.contact}</div>
                <div className="text-gray-400">Posted {formatPostedAt(post.postedAt)}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => claimPost(post.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  ✋ I Can Pick This Up
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-gray-400 hover:text-red-500 text-xs px-2 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove post"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claimed posts */}
      {claimedPosts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Recently Claimed</p>
          <div className="space-y-2">
            {claimedPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between gap-2 text-xs text-gray-400">
                <span>✅ {post.foodType} · {post.quantity} · ZIP {post.pickupZip}</span>
                <button onClick={() => deletePost(post.id)} className="hover:text-red-400">🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
