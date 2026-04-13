import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export interface NeedPost {
  id: string;
  needType: string;
  zip: string;
  details: string;
  urgency: "today" | "week" | "flexible";
  mobility: "walk" | "delivery" | "either";
  postedAt: number;
  expiresAt: number; // 7 days
  fulfilled: boolean;
}

const STORAGE_KEY = "nourishnet-community-needs";

const NEED_TYPES = [
  "Baby Formula / Diapers",
  "Halal / Kosher Food",
  "Diabetic-Friendly Food",
  "Fresh Produce",
  "Canned Goods / Shelf-Stable",
  "Prepared / Hot Meals",
  "Pet Food",
  "Hygiene Products",
  "Other",
];

export function loadPosts(): NeedPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: NeedPost[] = JSON.parse(raw);
    return parsed.filter((p) => p.expiresAt > Date.now());
  } catch {
    return [];
  }
}

export function savePosts(posts: NeedPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const URGENCY_COLORS = {
  today: "bg-red-100 text-red-700",
  week: "bg-yellow-100 text-yellow-700",
  flexible: "bg-green-100 text-green-700",
};

export default function CommunityNeedsBoard({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<NeedPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [needType, setNeedType] = useState("");
  const [zip, setZip] = useState("");
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState<NeedPost["urgency"]>("week");
  const [mobility, setMobility] = useState<NeedPost["mobility"]>("either");
  const [formError, setFormError] = useState("");

  useEffect(() => { setPosts(loadPosts()); }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      if (!needType) return setFormError("Please select what you need.");
      if (!zip.trim() || !/^\d{5}$/.test(zip.trim()))
        return setFormError("Please enter a valid 5-digit ZIP code.");

      const newPost: NeedPost = {
        id: crypto.randomUUID(),
        needType,
        zip: zip.trim(),
        details: details.trim().slice(0, 200),
        urgency,
        mobility,
        postedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 3_600_000,
        fulfilled: false,
      };

      const updated = [newPost, ...loadPosts()];
      savePosts(updated);
      setPosts(updated);

      setNeedType(""); setZip(""); setDetails("");
      setUrgency("week"); setMobility("either");
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    },
    [needType, zip, details, urgency, mobility]
  );

  const fulfillPost = (id: string) => {
    const updated = posts.map((p) => (p.id === id ? { ...p, fulfilled: true } : p));
    savePosts(updated);
    setPosts(updated);
  };

  const deletePost = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    savePosts(updated);
    setPosts(updated);
  };

  const activePosts = posts.filter((p) => !p.fulfilled);
  const fulfilledPosts = posts.filter((p) => p.fulfilled);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            {t.needsBoardTitle}
          </h3>
          <p className="text-sm text-blue-700 mt-0.5">
            {readOnly
              ? "Food requests from people in need — help fulfill them."
              : t.needsBoardSub}
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-sm transition-colors"
          >
            {showForm ? t.needsBoardCancel : t.needsBoardPostBtn}
          </button>
        )}
      </div>

      {!readOnly && submitted && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl px-4 py-2 text-sm font-medium mb-4">
          {t.needsBoardSuccess}
        </div>
      )}

      {!readOnly && showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-blue-200 p-5 mb-5 shadow-sm"
        >
          <h4 className="font-semibold text-gray-800 mb-1">{t.needsBoardFormTitle}</h4>
          <p className="text-xs text-gray-500 mb-4">{t.needsBoardAnon}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t.needsBoardINeed} *</label>
              <select
                value={needType}
                onChange={(e) => setNeedType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select…</option>
                {NEED_TYPES.map((nt) => (
                  <option key={nt} value={nt}>{nt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t.needsBoardZip} *</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="e.g. 20743"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t.needsBoardUrgency}</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as NeedPost["urgency"])}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="today">{t.needsBoardUrgencyToday}</option>
                <option value="week">{t.needsBoardUrgencyWeek}</option>
                <option value="flexible">{t.needsBoardUrgencyFlex}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t.needsBoardTravel}</label>
              <select
                value={mobility}
                onChange={(e) => setMobility(e.target.value as NeedPost["mobility"])}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="walk">{t.needsBoardMobilityWalk}</option>
                <option value="delivery">{t.needsBoardMobilityDelivery}</option>
                <option value="either">{t.needsBoardMobilityEither}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t.needsBoardDetails}</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t.needsBoardDetailsPlaceholder}
                rows={2}
                maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>

          {formError && <p className="text-red-600 text-xs mt-3">{formError}</p>}

          <button
            type="submit"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
          >
            {t.needsBoardSubmit}
          </button>
        </form>
      )}

      {/* Active posts */}
      {activePosts.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🤝</div>
          <p className="text-sm">{t.needsBoardEmpty}</p>
          <p className="text-xs mt-1">
            {readOnly
              ? "No requests right now. When someone on the Find Food tab asks for help, it'll appear here."
              : t.needsBoardEmptySub}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {activePosts.map((post) => {
            const urgencyLabel = post.urgency === "today" ? t.needsBoardUrgencyToday : post.urgency === "week" ? t.needsBoardUrgencyWeek : t.needsBoardUrgencyFlex;
            const mobilityLabel = post.mobility === "walk" ? t.needsBoardMobilityWalk : post.mobility === "delivery" ? t.needsBoardMobilityDelivery : t.needsBoardMobilityEither;
            return (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">{post.needType}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${URGENCY_COLORS[post.urgency]}`}>
                  {urgencyLabel}
                </span>
              </div>

              {post.details && (
                <p className="text-xs text-gray-600 mb-2">{post.details}</p>
              )}

              <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                <div>📍 Near ZIP {post.zip}</div>
                <div>{mobilityLabel}</div>
                <div className="text-gray-400">Posted {timeAgo(post.postedAt)}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fulfillPost(post.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  {t.needsBoardICanHelp}
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
            );
          })}
        </div>
      )}

      {/* Fulfilled posts */}
      {fulfilledPosts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">{t.needsBoardFulfilled}</p>
          <div className="space-y-2">
            {fulfilledPosts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between gap-2 text-xs text-gray-400"
              >
                <span>✅ {post.needType} · ZIP {post.zip}</span>
                <button onClick={() => deletePost(post.id)} className="hover:text-red-400">🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
