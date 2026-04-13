import { Link } from "react-router-dom";

export default function About() {
  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">About NourishNet</h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            An open-source class project connecting people with food assistance across Maryland and the DC metro area.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Mission */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">🎯</span>
            <h2 className="text-lg font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            NourishNet helps people find food pantries, donate to organizations in need, and
            discover volunteer opportunities — all from a single, easy-to-use interface.
            We believe everyone deserves access to nutritious food and the chance to help their community.
          </p>
        </section>

        {/* Data Sources */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">📊</span>
            <h2 className="text-lg font-bold text-gray-900">Data Sources</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Location and opportunity data is compiled from publicly available information
            including the Capital Area Food Bank, Maryland Food Bank, Manna Food Center,
            Bread for the City, county social services departments, and community
            organizations. We merge and deduplicate records from these sources into a single catalog.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center text-lg">⚠️</span>
            <h2 className="text-lg font-bold text-amber-900">Important Disclaimer</h2>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed mb-3">
            Data may be incomplete or outdated. Hours, eligibility rules, and contact information
            can change without notice. Please call the organization directly to confirm details before visiting.
          </p>
          <div className="bg-amber-100 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <div className="text-sm font-semibold text-amber-900">Need help now?</div>
              <div className="text-sm text-amber-800">
                Dial <a href="tel:211" className="font-bold underline">211</a> for immediate food assistance referrals.
              </div>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">🔒</span>
            <h2 className="text-lg font-bold text-gray-900">Privacy</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            NourishNet is a static site hosted on GitHub Pages. We do not collect, store, or
            transmit any personal data. The optional "Use My Location" feature runs entirely
            in your browser and is never sent to any server. Volunteer interest forms open your
            email client locally — nothing passes through our infrastructure.
          </p>
        </section>

        {/* Open Source */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-lg">💻</span>
            <h2 className="text-lg font-bold text-gray-900">Open Source</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            This project is fully open source. Contributions, corrections, and new data sources
            are welcome. Check the repository on GitHub for how to get involved.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 mb-4">Ready to get started?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/find-food" className="bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-emerald-700 shadow-sm">
              🍎 Find Food
            </Link>
            <Link to="/donate" className="bg-amber-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-amber-700 shadow-sm">
              🤲 Donate
            </Link>
            <Link to="/volunteer" className="bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 shadow-sm">
              🙋 Volunteer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
