import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";

export default function Home() {
  const { catalog } = useCatalog();

  const placeCount = catalog?.places.length ?? 0;
  const oppCount = catalog?.opportunities.length ?? 0;
  const countyCount = catalog
    ? new Set(catalog.places.map((p) => p.county).filter(Boolean)).size
    : 0;

  const cards = [
    {
      to: "/find-food",
      icon: "🍎",
      title: "Find Food",
      desc: "Locate food pantries, banks, and meal programs near you in Maryland and the DC metro area.",
      gradient: "from-emerald-500 to-emerald-700",
      shadow: "shadow-emerald-200",
    },
    {
      to: "/donate",
      icon: "🤲",
      title: "Donate",
      desc: "See what's needed and where to drop off food, produce, or monetary donations.",
      gradient: "from-amber-500 to-amber-700",
      shadow: "shadow-amber-200",
    },
    {
      to: "/volunteer",
      icon: "🙋",
      title: "Volunteer",
      desc: "Find volunteer shifts — sorting, gardening, client services, and more.",
      gradient: "from-blue-500 to-blue-700",
      shadow: "shadow-blue-200",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-300 rounded-full animate-subtle-pulse" />
            Open source · Free · No sign-up required
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Food Assistance,<br />Right Where You Need It
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            NourishNet connects people in Maryland and the DC metro area with food pantries, donation drop-offs, and volunteer opportunities — all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/find-food"
              className="bg-white text-emerald-800 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
            >
              🍎 Find Food Near Me
            </Link>
            <Link
              to="/volunteer"
              className="bg-white/15 text-white font-semibold px-6 py-3 rounded-xl border border-white/30 hover:bg-white/25 transition-colors"
            >
              🙋 I Want to Help
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {catalog && (
        <section className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-700">{placeCount}</div>
              <div className="text-xs text-gray-500 mt-1">Locations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">{oppCount}</div>
              <div className="text-xs text-gray-500 mt-1">Opportunities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{countyCount}</div>
              <div className="text-xs text-gray-500 mt-1">Counties Covered</div>
            </div>
          </div>
        </section>
      )}

      {/* Cards */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center mb-2">How Can We Help?</h2>
        <p className="text-center text-gray-500 mb-10">Choose what you're looking for</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`card-lift bg-gradient-to-br ${c.gradient} text-white rounded-2xl p-7 shadow-lg ${c.shadow} flex flex-col items-center text-center`}
            >
              <span className="text-5xl mb-4 drop-shadow-md" aria-hidden="true">{c.icon}</span>
              <h3 className="text-xl font-bold mb-2">{c.title}</h3>
              <p className="text-sm text-white/90 leading-relaxed">{c.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium bg-white/20 rounded-full px-4 py-1.5">
                Get Started →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", icon: "🔍", title: "Search", desc: "Enter your city, ZIP, or address to find nearby resources." },
              { step: "2", icon: "📋", title: "Browse", desc: "Filter by county, day, type of help, and see details for each location." },
              { step: "3", icon: "🚗", title: "Go", desc: "Get directions, call ahead, and visit. Always confirm hours first." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-emerald-600 mb-1">STEP {s.step}</div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
