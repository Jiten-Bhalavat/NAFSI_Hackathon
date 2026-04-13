const CASCADE_CARDS = [
  {
    num: "01",
    tag: "The problem",
    title: "Food help exists.\nFinding it doesn't.",
    text: "Maryland has hundreds of food pantries, food banks, and SNAP retailers but their info is scattered across PDFs, hotlines, and dozens of disconnected websites.",
    bg: "#f4a94e",
  },
  {
    num: "02",
    tag: "Our solution",
    title: "We unified\n5,900+ resources\ninto one app.",
    text: "NourishNet aggregates data from 211 Maryland, Capital Area Food Bank, USDA SNAP, Feeding America, census tracts, and more then deduplicates, geocodes, and serves it through a fast, searchable map.",
    bg: "#b8e8d0",
  },
  {
    num: "03",
    tag: "For families",
    title: "Find food\nnear you\nin seconds.",
    text: "Search by ZIP code, city, or county. Filter by day of the week. See what is open now. Get directions with one tap. Available in English, Spanish, French, Chinese, and Korean.",
    bg: "#f9d97a",
  },
  {
    num: "04",
    tag: "For donors and volunteers",
    title: "Give where\nit is needed most.",
    text: "See county-level food insecurity rates, identify food deserts, and find the pantries and food banks closest to the communities with the greatest need.",
    bg: "#f4a94e",
  },
  {
    num: "05",
    tag: "Privacy first",
    title: "No account.\nNo tracking.",
    text: "Your location stays in your browser. Nothing is sent to any server. Open source, funded by the NSF through UMD.",
    bg: "#c5d9f7",
  },
];

function CascadeSection() {
  const doubled = [...CASCADE_CARDS, ...CASCADE_CARDS];
  return (
    <section style={{ background: "#fefce8" }} className="py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
          NourishNet
        </p>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            What makes us different
          </h2>
          <span className="text-sm text-gray-400 font-medium whitespace-nowrap pb-1 animate-pulse">
            auto-scrolling
          </span>
        </div>
      </div>
      <style>{`
        @keyframes cascadeLoop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .cascade-track {
          display: flex; gap: 28px; width: max-content;
          animation: cascadeLoop 40s linear infinite;
        }
        .cascade-track:hover { animation-play-state: paused; }
        .cascade-wrap::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="cascade-wrap" style={{ overflow: "hidden", scrollbarWidth: "none", paddingLeft: 24 }}>
        <div className="cascade-track">
          {doubled.map((card, i) => (
            <div key={`${card.num}-${i}`} className="relative overflow-hidden" style={{
              flexShrink: 0, width: 340, minHeight: 360, background: card.bg,
              borderRadius: 20, padding: "32px 28px", display: "flex", flexDirection: "column",
            }}>
              <span className="absolute top-4 right-5 font-bold select-none pointer-events-none"
                style={{ fontSize: 96, lineHeight: 1, opacity: 0.12, color: "#000" }}>{card.num}</span>
              <span className="absolute pointer-events-none" style={{
                bottom: -50, right: -50, width: 180, height: 180,
                borderRadius: "50%", border: "2px solid rgba(0,0,0,0.06)",
              }} />
              <span className="inline-block self-start text-xs font-semibold px-3 py-1 rounded-full mb-6"
                style={{ background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.7)" }}>{card.tag}</span>
              <h3 className="font-bold text-2xl leading-snug mb-5"
                style={{ color: "rgba(0,0,0,0.85)", whiteSpace: "pre-line" }}>{card.title}</h3>
              <p className="text-sm leading-relaxed mt-auto"
                style={{ color: "rgba(0,0,0,0.55)" }}>{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div>
      <div className="relative text-white overflow-hidden">
        <img src="/images/about-header.jpg" alt="Fresh fruits and vegetables"
          className="w-full h-[340px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">NourishNet</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              We are committed to eliminating hunger by putting healthy food in the hands of the food insecure.
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: "#fefce8" }}>
        <CascadeSection />
        <div className="max-w-5xl mx-auto px-6 py-5 space-y-4">
          <section className="rounded-lg px-8 py-4 flex items-center gap-6"
            style={{ background: "#f9f4bb", border: "1px solid rgba(0,0,0,0.06)" }}>
            <span className="w-10 h-10 rounded-md flex items-center justify-center text-xl shrink-0"
              style={{ background: "rgba(0,0,0,0.06)" }}>&#9888;&#65039;</span>
            <p className="text-lg leading-snug flex-1" style={{ color: "rgba(0,0,0,0.6)" }}>
              <span className="font-bold" style={{ color: "rgba(0,0,0,0.8)" }}>Disclaimer:</span>{" "}
              Data may be incomplete or outdated. Please call to confirm before visiting.
            </p>
            <div className="rounded-md px-5 py-2.5 flex items-center gap-2 shrink-0"
              style={{ background: "rgba(0,0,0,0.05)" }}>
              <span className="text-xl">&#128222;</span>
              <span className="text-lg font-medium" style={{ color: "rgba(0,0,0,0.65)" }}>
                Dial <a href="tel:211" className="font-bold underline"
                  style={{ color: "rgba(0,0,0,0.8)" }}>211</a> for assistance
              </span>
            </div>
          </section>
          <div className="text-center pb-4">
            <p className="text-xs text-gray-400">
              Learn more at{" "}
              <a href="https://nourishnet.umd.edu" target="_blank" rel="noopener noreferrer"
                className="text-emerald-600 underline hover:text-emerald-700">nourishnet.umd.edu</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
