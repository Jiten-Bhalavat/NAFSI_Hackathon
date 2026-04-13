import { useState, useEffect, useCallback } from "react";
import {
  fetchAvailableVolunteers,
  createMatch,
  subscribeToVolunteers,
  type Volunteer,
} from "../lib/volunteer-db";

export default function VolunteerCoordination() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [zipFilter, setZipFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await fetchAvailableVolunteers();
    setVolunteers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const unsub = subscribeToVolunteers(() => reload());
    return unsub;
  }, [reload]);

  const filtered = zipFilter
    ? volunteers.filter((v) => v.zip.startsWith(zipFilter))
    : volunteers;

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">🤝 Available Volunteers</h3>
          <p className="text-xs text-gray-500 mt-0.5 max-w-lg">
            Community members who registered to help. Reach out to coordinate pickups, sorting, or deliveries.
          </p>
        </div>
        <div className="relative shrink-0">
          <input
            type="text"
            placeholder="Filter by ZIP…"
            value={zipFilter}
            onChange={(e) => setZipFilter(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-36 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-6 text-center">Loading volunteers…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-2">🙋</div>
          <p className="text-sm text-gray-500">No volunteers available{zipFilter ? ` near ZIP ${zipFilter}` : ""} right now.</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon — new volunteers register regularly.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="text-xs text-gray-500 font-medium">{filtered.length} volunteer{filtered.length !== 1 ? "s" : ""} available</p>
          {filtered.map((v) => (
            <VolunteerCard
              key={v.id}
              volunteer={v}
              isExpanded={expanded === v.id}
              onToggle={() => setExpanded(expanded === v.id ? null : v.id)}
              onMatched={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const h = Math.floor(d / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function VolunteerCard({
  volunteer: v,
  isExpanded,
  onToggle,
  onMatched,
}: {
  volunteer: Volunteer;
  isExpanded: boolean;
  onToggle: () => void;
  onMatched: () => void;
}) {
  const [showContact, setShowContact] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleCoordinate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!donorName.trim()) return setError("Please enter your name.");
    if (!donorEmail.trim()) return setError("Please enter your email.");

    setSending(true);
    const result = await createMatch({
      volunteerId: v.id,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim(),
      placeName: placeName.trim(),
      placeAddress: placeAddress.trim(),
      message: msg.trim(),
    });
    setSending(false);

    if (!result) return setError("Failed to send — please try again.");
    setSent(true);
    onMatched();
  };

  return (
    <div className={`bg-white rounded-xl border transition-all ${isExpanded ? "border-amber-300 shadow-md" : "border-gray-200 shadow-sm hover:border-amber-200"}`}>
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{v.name}</span>
            {v.zip && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📍 {v.zip}</span>}
            <span className="text-xs text-gray-400">{timeAgo(v.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {v.availability.length > 0 && (
              <span className="text-xs text-blue-600">{v.availability.map((d) => d.slice(0, 3)).join(", ")}</span>
            )}
            {v.interests && <span className="text-xs text-gray-500">· {v.interests}</span>}
            {v.opportunityTitle && <span className="text-xs text-amber-600">· {v.opportunityTitle}</span>}
          </div>
        </div>
        <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {v.message && <p className="text-sm text-gray-600 mb-3 italic">"{v.message}"</p>}
          {v.placeName && <p className="text-xs text-gray-500 mb-2">Interested in: {v.placeName}</p>}

          {!showContact && !sent && (
            <button
              onClick={() => setShowContact(true)}
              className="bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors"
            >
              🤝 Coordinate with {v.name.split(" ")[0]}
            </button>
          )}

          {sent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-sm text-green-700 font-medium">✅ Coordination request sent!</p>
              <p className="text-xs text-green-600 mt-1">The volunteer will be notified.</p>
            </div>
          )}

          {showContact && !sent && (
            <form onSubmit={handleCoordinate} className="space-y-3 mt-2">
              <p className="text-xs text-gray-500 font-medium">Your details (so the volunteer can reach you):</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Your name *" value={donorName} onChange={(e) => setDonorName(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                <input type="email" required placeholder="Your email *" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="tel" placeholder="Phone (optional)" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                <input type="text" placeholder="Location name" value={placeName} onChange={(e) => setPlaceName(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>
              <input type="text" placeholder="Address (optional)" value={placeAddress} onChange={(e) => setPlaceAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              <textarea placeholder="Message to volunteer…" rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none" />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={sending} className="flex-1 bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-700 disabled:opacity-50">
                  {sending ? "Sending…" : "Send Coordination Request"}
                </button>
                <button type="button" onClick={() => setShowContact(false)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
