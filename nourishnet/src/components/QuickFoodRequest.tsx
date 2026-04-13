import { useState, useCallback } from "react";
import { savePosts, loadPosts } from "./CommunityNeedsBoard";
import type { NeedPost } from "./CommunityNeedsBoard";

/**
 * Ultra-minimal 2-step food request for people with slow phones or in crisis.
 * Zero friction: no login, no ID, just ZIP + need + mobility = posted.
 */

const QUICK_NEEDS = [
  "Any Food",
  "Baby Formula / Diapers",
  "Halal / Kosher Food",
  "Prepared / Hot Meals",
  "Fresh Produce",
  "Canned Goods",
];

export default function QuickFoodRequest({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [zip, setZip] = useState("");
  const [needType, setNeedType] = useState("Any Food");
  const [mobility, setMobility] = useState<NeedPost["mobility"]>("either");
  const [zipError, setZipError] = useState("");
  const [done, setDone] = useState(false);

  const handleStep1 = useCallback(() => {
    if (!zip.trim() || !/^\d{5}$/.test(zip.trim())) {
      setZipError("Please enter a valid 5-digit ZIP code.");
      return;
    }
    setZipError("");
    setStep(2);
  }, [zip]);

  const handleSubmit = useCallback(() => {
    const newPost: NeedPost = {
      id: crypto.randomUUID(),
      needType,
      zip: zip.trim(),
      details: "",
      urgency: "today",
      mobility,
      postedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 3_600_000,
      fulfilled: false,
    };
    const updated = [newPost, ...loadPosts()];
    savePosts(updated);
    setDone(true);
    setTimeout(onClose, 3000);
  }, [needType, zip, mobility, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">🍎 I Need Food</div>
            <p className="text-emerald-100 text-xs mt-0.5">Anonymous · No ID required · Takes 10 seconds</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none ml-4" aria-label="Close">×</button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-bold text-gray-900 text-lg">Request Sent!</p>
              <p className="text-sm text-gray-500 mt-1">
                A nearby volunteer or donor will see your request. You can also call{" "}
                <a href="tel:211" className="text-blue-600 font-bold">211</a> for immediate help.
              </p>
            </div>
          ) : step === 1 ? (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">What do you need?</p>

              {/* Need type grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {QUICK_NEEDS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNeedType(n)}
                    className={`text-sm font-medium py-2.5 px-3 rounded-xl border-2 transition-all text-left ${
                      needType === n
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-2">Near ZIP code</p>
              <input
                type="text"
                inputMode="numeric"
                value={zip}
                onChange={(e) => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setZipError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                placeholder="e.g. 20743"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold tracking-widest focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 mb-1"
                maxLength={5}
                autoFocus
              />
              {zipError && <p className="text-red-500 text-xs mb-2">{zipError}</p>}

              <button
                onClick={handleStep1}
                disabled={zip.length !== 5}
                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-base shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Can you travel to pick it up?</p>

              <div className="space-y-2 mb-5">
                {([
                  { v: "walk", icon: "🚶", label: "Yes — I can walk to pick it up" },
                  { v: "delivery", icon: "🏠", label: "No — I need it delivered to me" },
                  { v: "either", icon: "🤷", label: "Either works" },
                ] as const).map(({ v, icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMobility(v)}
                    className={`w-full flex items-center gap-3 text-sm font-medium py-3 px-4 rounded-xl border-2 transition-all ${
                      mobility === v
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500">
                <strong className="text-gray-700">Your request:</strong> {needType} · Near ZIP {zip}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-base shadow-sm transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
