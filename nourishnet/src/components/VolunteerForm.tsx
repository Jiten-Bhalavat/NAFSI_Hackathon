import { useState, useEffect, useRef } from "react";
import type { Opportunity, Place } from "../types";
import { insertVolunteer } from "../lib/volunteer-db";

interface Props {
  opportunity?: (Opportunity & { place?: Place }) | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  zip: string;
  availability: string[];
  interests: string;
  message: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function VolunteerForm({ opportunity, onClose }: Props) {
  const [form, setForm] = useState<FormData>({
    name: "", email: "", phone: "", zip: "", availability: [], interests: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { dialogRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const update = (field: keyof FormData, value: string | string[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(day)
        ? f.availability.filter((d) => d !== day)
        : [...f.availability, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.email.trim()) return setError("Please enter your email.");

    setSubmitting(true);
    const result = await insertVolunteer({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      zip: form.zip.trim(),
      availability: form.availability,
      interests: form.interests.trim(),
      message: form.message.trim(),
      opportunityId: opportunity?.id ?? null,
      opportunityTitle: opportunity?.title ?? null,
      placeName: opportunity?.place?.name ?? null,
    });
    setSubmitting(false);

    if (!result) return setError("Something went wrong — please try again.");
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Volunteer interest form"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Register as Volunteer</h2>
              {opportunity && (
                <p className="text-blue-100 text-sm mt-1">
                  For: {opportunity.title}
                  {opportunity.place && ` at ${opportunity.place.name}`}
                </p>
              )}
            </div>
            <button onClick={onClose} aria-label="Close form" className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/20">✕</button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You're Registered!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your volunteer profile is now visible to food banks and pantries looking for help.
              They can reach out to coordinate with you directly.
            </p>
            <button onClick={onClose} className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="vol-name" className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input id="vol-name" type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Jane Doe" />
            </div>
            <div>
              <label htmlFor="vol-email" className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input id="vol-email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="jane@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="vol-phone" className="block text-sm font-semibold text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input id="vol-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="(301) 555-0123" />
              </div>
              <div>
                <label htmlFor="vol-zip" className="block text-sm font-semibold text-gray-700 mb-1">ZIP Code <span className="text-gray-400 font-normal">(optional)</span></label>
                <input id="vol-zip" type="text" inputMode="numeric" maxLength={5} value={form.zip} onChange={(e) => update("zip", e.target.value.replace(/\D/g, "").slice(0, 5))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="20743" />
              </div>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Availability <span className="text-gray-400 font-normal">(select all that apply)</span></legend>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.availability.includes(day) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"}`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="vol-interests" className="block text-sm font-semibold text-gray-700 mb-1">Areas of Interest <span className="text-gray-400 font-normal">(optional)</span></label>
              <input id="vol-interests" type="text" value={form.interests} onChange={(e) => update("interests", e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g. sorting, gardening, client services" />
            </div>
            <div>
              <label htmlFor="vol-message" className="block text-sm font-semibold text-gray-700 mb-1">Additional Message <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea id="vol-message" rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" placeholder="Anything else you'd like to share…" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50">
              {submitting ? "Registering…" : "✋ Register as Volunteer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
