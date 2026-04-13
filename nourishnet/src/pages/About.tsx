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

        {/* SMS Access */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-lg">📱</span>
              <h2 className="text-lg font-bold text-white">SMS Access — No Internet Required</h2>
            </div>
            <p className="text-sm text-gray-400">
              For people without smartphones or data plans. Just text from any basic phone.
            </p>
          </div>

          <div className="p-6 grid sm:grid-cols-2 gap-6">
            {/* How it works */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">How it works</p>
              <div className="space-y-3">
                {[
                  { step: "1", text: 'Text "FOOD 20743" to (202) 555-0NNN', note: "Replace ZIP with yours" },
                  { step: "2", text: "We look up the 3 nearest open pantries", note: "Using your ZIP code" },
                  { step: "3", text: "You get a text back in seconds", note: "Name, address, phone number" },
                ].map(({ step, text, note }) => (
                  <div key={step} className="flex gap-3">
                    <span className="w-6 h-6 bg-green-600 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{text}</p>
                      <p className="text-xs text-gray-500">{note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-green-900/40 border border-green-700 rounded-xl p-3">
                <p className="text-xs font-bold text-green-400 mb-1">Example command</p>
                <p className="font-mono text-green-300 text-base">FOOD 20743</p>
                <p className="text-xs text-green-600 mt-1">→ sends to (202) 555-0NNN</p>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sample response</p>
              <div className="bg-gray-800 rounded-3xl p-3 w-full max-w-[220px] shadow-xl border border-gray-700">
                {/* Status bar */}
                <div className="flex justify-between text-gray-500 text-xs px-2 mb-2">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                {/* Chat */}
                <div className="bg-gray-900 rounded-2xl p-3 space-y-2 min-h-[200px]">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-green-600 text-white text-xs rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]">
                      FOOD 20743
                    </div>
                  </div>
                  {/* Bot reply */}
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 text-xs rounded-2xl rounded-bl-sm px-3 py-2 max-w-[90%] leading-relaxed">
                      <p className="font-bold text-green-400 mb-1">NourishNet 🥦</p>
                      <p>3 open pantries near 20743:</p>
                      <p className="mt-1">1. <strong>PG Food Bank</strong> — 0.8 mi<br />14010 Laurel Place · (301) 888-2000</p>
                      <p className="mt-1">2. <strong>Help365</strong> — 1.2 mi<br />6210 Seat Pleasant · (301) 773-0500</p>
                      <p className="mt-1">3. <strong>Catholic Charities</strong> — 1.9 mi<br />9222 Basil Ct · (301) 441-9840</p>
                      <p className="mt-2 text-gray-400">Reply HELP for more options</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              SMS feature planned for Phase 2 · Powered by Twilio + NourishNet API ·
              Works on any phone, no internet, no app download required
            </p>
          </div>
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
