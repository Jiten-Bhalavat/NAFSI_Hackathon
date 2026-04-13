import { useState, useEffect, useCallback } from "react";

export interface StatusPost {
  id: string;
  pantryName: string;
  zip: string;
  statusType: string;
  message: string;
  postedAt: number;
  expiresAt: number; // 48h
}

const STORAGE_KEY = "nourishnet-pantry-status";

const STATUS_TYPES = [
  { value: "produce",   label: "🥦 Fresh produce available",    color: "bg-green-100 text-green-800 border-green-200" },
  { value: "closure",   label: "🔴 Closed today",               color: "bg-red-100 text-red-800 border-red-200" },
  { value: "no-id",     label: "✅ No ID required today",       color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "extended",  label: "⏰ Extended hours today",        color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "shortage",  label: "⚠️ Limited supply today",       color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "special",   label: "🎁 Special items available",     color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "other",     label: "📢 General announcement",        color: "bg-gray-100 text-gray-800 border-gray-200" },
];

function colorForType(type: string) {
  return STATUS_TYPES.find((s) => s.value === type)?.color ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function labelForType(type: string) {
  return STATUS_TYPES.find((s) => s.value === type)?.label ?? type;
}

function loadPosts(): StatusPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StatusPost[] = JSON.parse(raw);
    return parsed.filter((p) => p.expiresAt > Date.now());
  } catch {
    return [];
  }
}

function savePosts(posts: StatusPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function LivePantryStatus() {
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [pantryName, setPantryName] = useState("");
  const [zip, setZip] = useState("");
  const [statusType, setStatusType] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => { setPosts(loadPosts()); }, []);

  // Prune expired every minute
  useEffect(() => {
    const id = setInterval(() => setPosts(loadPosts()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      if (!pantryName.trim()) return setFormError("Please enter the pantry name.");
      if (!statusType) return setFormError("Please select a status type.");
      if (!zip.trim() || !/^\d{5}$/.test(zip.trim())) return setFormError("Please enter a valid 5-digit ZIP code.");

      const newPost: StatusPost = {
        id: crypto.randomUUID(),
        pantryName: pantryName.trim().slice(0, 80),
        zip: zip.trim(),
        statusType,
        message: message.trim().slice(0, 200),
        postedAt: Date.now(),
        expiresAt: Date.now() + 48 * 3_600_000,
      };

      const updated = [newPost, ...loadPosts()];
      savePosts(updated);
      setPosts(updated);

      setPantryName(""); setZip(""); setStatusType(""); setMessage("");
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    },
    [pantryName, zip, statusType, message]
  );

  const removePost = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    savePosts(updated);
    setPosts(updated);
  };

  if (posts.length === 0 && !showForm) {
    // Show collapsed state — just a small button
    return (
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-300 rounded-full" />
          <span className="text-sm text-gray-500">No live pantry updates right now</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-emerald-700 font-semibold hover:underline shrink-0"
        >
          + Post Update (pantry operators)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-bold text-gray-800">What's Available Today</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            {posts.length} live update{posts.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-emerald-700 font-semibold hover:underline"
        >
          {showForm ? "✕ Cancel" : "+ Post Update"}
        </button>
      </div>

      {submitted && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl px-3 py-2 text-xs font-medium mb-3">
          ✅ Status posted! It will appear here for 48 hours.
        </div>
      )}

      {/* Post form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4"
        >
          <p className="text-xs font-semibold text-gray-600 mb-3">
            For pantry / food bank operators — post a live update that visitors will see today.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pantry / Organization Name *</label>
              <input
                type="text"
                value={pantryName}
                onChange={(e) => setPantryName(e.target.value)}
                placeholder="e.g. Prince George's Food Bank"
                maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ZIP Code *</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="e.g. 20743"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status *</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_TYPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatusType(s.value)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      statusType === s.value
                        ? s.color + " ring-2 ring-offset-1 ring-emerald-400"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Additional details (optional)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. 'Fresh bread and tomatoes until 2pm', 'Closed for inventory until noon'…"
                maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
          {formError && <p className="text-red-600 text-xs mt-2">{formError}</p>}
          <button
            type="submit"
            className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-sm transition-colors"
          >
            Post Status
          </button>
        </form>
      )}

      {/* Status feed */}
      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${colorForType(post.statusType)}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold">{labelForType(post.statusType)}</span>
                <span className="text-xs opacity-75">·</span>
                <span className="text-xs font-semibold truncate">{post.pantryName}</span>
                <span className="text-xs opacity-60">ZIP {post.zip}</span>
              </div>
              {post.message && (
                <p className="text-xs mt-0.5 opacity-80">{post.message}</p>
              )}
              <p className="text-xs opacity-50 mt-0.5">{timeAgo(post.postedAt)}</p>
            </div>
            <button
              onClick={() => removePost(post.id)}
              className="shrink-0 opacity-40 hover:opacity-70 text-xs"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
