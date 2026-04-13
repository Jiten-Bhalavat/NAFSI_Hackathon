import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";

const BASE = import.meta.env.BASE_URL;

export default function Home() {
  const { catalog } = useCatalog();
  const [donateType, setDonateType] = useState<"one-time" | "monthly">("one-time");
  const [donateAmount, setDonateAmount] = useState("25");

  const placeCount = catalog?.places.length ?? 0;
  const oppCount = catalog?.opportunities.length ?? 0;
  const countyCount = catalog
    ? new Set(catalog.places.map((p) => p.county).filter(Boolean)).size
    : 0;

  const programs = [
    {
      to: "/find-food",
      title: "Find Food Near You",
      desc: "Locate food pantries, banks, and meal programs near you in Maryland and the DC metro area.",
      img: `${BASE}images/foodnearme.jpg`,
      tag: "RESOURCES",
    },
    {
      to: "/donate",
      title: "Make a Donation",
      desc: "See what food and monetary donations are most needed in your area and how you can help.",
      img: `${BASE}images/donate.png`,
      tag: "DONATE",
    },
    {
      to: "/food-post",
      title: "Community Board",
      desc: "Post surplus food, request help, and connect with neighbors in your community.",
      img: `${BASE}images/community.avif`,
      tag: "COMMUNITY",
    },
    {
      to: "/volunteer",
      title: "Apply as Volunteer",
      desc: "Find volunteer shifts near you — sorting, distribution, gardening, client services, and more.",
      img: `${BASE}images/volunteer.avif`,
      tag: "VOLUNTEER",
    },
  ];

  const events = [
    {
      title: "Community Food Drive",
      date: "MAY 15, 2026",
      location: "Baltimore, MD",
      img: `${BASE}images/helpinghands.jpg`,
    },
    {
      title: "Volunteer Distribution Day",
      date: "MAY 22, 2026",
      location: "Silver Spring, MD",
      img: `${BASE}images/volunteer.avif`,
    },
    {
      title: "Farmers Market Donation Day",
      date: "JUN 5, 2026",
      location: "Rockville, MD",
      img: `${BASE}images/foodnearme.jpg`,
    },
  ];

  const testimonials = [
    {
      name: "Maria Johnson",
      role: "Food Distribution Volunteer",
      quote:
        "Volunteering with NourishNet has been one of the most rewarding experiences. I've seen firsthand how much impact a few hours a week can make in my community.",
      img: `${BASE}images/helpinghands.jpg`,
    },
    {
      name: "David Park",
      role: "Community Organizer",
      quote:
        "The platform made it incredibly easy to organize food pickups and connect donors with families who needed help the most. Truly a game changer.",
      img: `${BASE}images/community.avif`,
    },
    {
      name: "Aisha Williams",
      role: "Pantry Coordinator",
      quote:
        "NourishNet helped us reach more families than ever before. The technology really amplifies our community's generosity.",
      img: `${BASE}images/volunteer.avif`,
    },
  ];

  const partners = [
    "Maryland Food Bank",
    "Feeding America",
    "DC Central Kitchen",
    "Capital Area Food Bank",
    "Anne Arundel FC",
  ];

  const DonateWidget = ({ compact = false }: { compact?: boolean }) => (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full">
      <div className="bg-[#16a34a] px-6 py-4">
        <h2 className="text-white text-xl font-black tracking-wide">DONATE NOW!</h2>
        <p className="text-green-100 text-xs mt-0.5">Help feed families in need today.</p>
      </div>
      <div className={compact ? "p-4" : "p-6"}>
        <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 mb-5">
          <button
            onClick={() => setDonateType("one-time")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              donateType === "one-time"
                ? "bg-[#16a34a] text-white"
                : "bg-white text-gray-500 hover:text-gray-700"
            }`}
          >
            One Time
          </button>
          <button
            onClick={() => setDonateType("monthly")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              donateType === "monthly"
                ? "bg-[#16a34a] text-white"
                : "bg-white text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {["10", "25", "50", "custom"].map((amt) => (
            <button
              key={amt}
              onClick={() => setDonateAmount(amt)}
              className={`py-3 rounded-lg text-sm font-bold border-2 transition-colors ${
                donateAmount === amt
                  ? "border-[#16a34a] bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700"
              }`}
            >
              {amt === "custom" ? "Custom" : `$${amt}`}
            </button>
          ))}
        </div>
        {donateAmount === "custom" && (
          <input
            type="number"
            placeholder="Enter amount ($)"
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm mb-5 focus:border-green-500 focus:outline-none"
          />
        )}
        <Link
          to="/donate"
          className="block w-full bg-[#16a34a] text-white text-center font-black py-4 rounded-lg hover:bg-[#15803d] transition-colors text-sm tracking-widest uppercase"
        >
          Donate Now →
        </Link>
        <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
          Secure donation · 100% goes to food assistance programs
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white">
      {/* ─── HERO ─── */}
      <section className="bg-[#f2faf5] relative overflow-hidden min-h-[80vh] flex items-center">
        {/* Decorative large background text */}
        <div
          className="absolute inset-0 flex items-end pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="text-[160px] md:text-[220px] font-black leading-none tracking-tighter text-green-100 whitespace-nowrap -mb-6 -ml-4"
            style={{ lineHeight: 0.85 }}
          >
            FOOD TODAY
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-20 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text + Image */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-1.5 text-xs font-bold text-green-700 uppercase tracking-wide mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Maryland &amp; DC Metro Area
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] uppercase mb-6">
                Fight Against<br />
                <span className="text-[#16a34a]">Hunger,</span>
                <br />
                Donating&nbsp;Food Today
              </h1>
              <p className="text-gray-500 text-lg max-w-lg leading-relaxed mb-8">
                NourishNet connects Maryland and DC residents with food
                pantries, donation drives, and volunteer opportunities — all in
                one place, completely free.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/find-food"
                  className="bg-[#16a34a] text-white font-bold px-8 py-3.5 rounded-lg hover:bg-[#15803d] transition-colors text-sm tracking-wide"
                >
                  Find Food Near Me
                </Link>
                <Link
                  to="/volunteer"
                  className="border-2 border-[#16a34a] text-[#16a34a] font-bold px-8 py-3.5 rounded-lg hover:bg-green-50 transition-colors text-sm tracking-wide"
                >
                  I Want to Help
                </Link>
              </div>

              {/* Hero image */}
              <div className="mt-10 lg:mt-12">
                <img
                  src={`${BASE}images/helpinghands.jpg`}
                  alt="Food bank volunteer helping community"
                  className="rounded-2xl w-full max-w-xl object-cover shadow-2xl"
                />
              </div>
            </div>

            {/* Right: Donate widget */}
            <div className="w-full lg:w-[340px] flex-shrink-0">
              <DonateWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-[#0d1f15] py-5 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-around gap-4 min-w-max md:min-w-0 text-white">
            {[
              { value: `$${(43903).toLocaleString()}`, label: "Annual Budget Shortfall Tracked" },
              { value: placeCount > 0 ? placeCount.toLocaleString() : "200+", label: "Food Locations" },
              { value: countyCount > 0 ? countyCount.toString() : "24", label: "Counties Covered" },
              { value: oppCount > 0 ? oppCount.toLocaleString() : "150+", label: "Volunteer Opportunities" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-4">
                <span className="text-green-400 font-black text-lg">↑</span>
                <div>
                  <div className="text-xl sm:text-2xl font-black">{s.value}</div>
                  <div className="text-gray-400 text-xs uppercase tracking-wide whitespace-nowrap">{s.label}</div>
                </div>
                {i < 3 && <div className="w-px h-10 bg-white/10 ml-4 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CURRENT PROGRAMS (like "Current Campaign") ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <span className="bg-[#16a34a] text-white text-xs font-black px-3 py-1.5 rounded tracking-wide">
                CURRENT
              </span>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                PROGRAMS
              </h2>
            </div>
            <Link
              to="/find-food"
              className="text-xs text-[#16a34a] font-bold uppercase tracking-wide hover:text-green-800 flex items-center gap-1"
            >
              VIEW ALL PROGRAMS →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((prog) => (
              <Link
                key={prog.to}
                to={prog.to}
                className="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={prog.img}
                    alt={prog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-3 left-3 bg-[#16a34a] text-white text-[10px] font-black px-2 py-1 rounded tracking-widest">
                    {prog.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-gray-900 mb-2 text-sm">{prog.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{prog.desc}</p>
                  <span className="text-[#16a34a] text-xs font-black uppercase tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all">
                    DONATE →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APPLY AS VOLUNTEER ─── */}
      <section className="py-20 bg-[#f7f9f7]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-12">
            <span className="bg-[#16a34a] text-white text-xs font-black px-3 py-1.5 rounded tracking-wide">
              APPLY
            </span>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
              AS VOLUNTEER
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Featured card (left) */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-[#16a34a] text-5xl font-black leading-none mb-4">"</div>
                <img
                  src={`${BASE}images/volunteer.avif`}
                  alt={testimonials[0].name}
                  className="w-14 h-14 rounded-full object-cover mb-4 ring-2 ring-green-100"
                />
                <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                  "{testimonials[0].quote}"
                </p>
                <div className="font-black text-gray-900 text-sm">{testimonials[0].name}</div>
                <div className="text-[#16a34a] text-xs font-medium mt-0.5">{testimonials[0].role}</div>
              </div>
            </div>

            {/* Three testimonials (middle) */}
            <div className="lg:col-span-6 space-y-7">
              {testimonials.map((t, i) => (
                <div key={i} className="flex gap-4">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                  />
                  <div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-2">"{t.quote}"</p>
                    <div className="font-black text-gray-900 text-sm">{t.name}</div>
                    <div className="text-[#16a34a] text-xs">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA (right) */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <h3 className="text-xl font-black text-gray-900 uppercase leading-tight mb-4">
                Join Our Community of Volunteers
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Be part of the movement fighting hunger in Maryland and DC.
                Your time and energy make a real difference.
              </p>
              <Link
                to="/volunteer"
                className="bg-[#16a34a] text-white font-black px-6 py-3.5 rounded-lg hover:bg-[#15803d] transition-colors text-sm tracking-widest uppercase text-center"
              >
                Apply Today →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── UPCOMING EVENTS ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <span className="bg-[#16a34a] text-white text-xs font-black px-3 py-1.5 rounded tracking-wide">
                UPCOMING
              </span>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                EVENTS
              </h2>
            </div>
            <button className="text-xs text-[#16a34a] font-bold uppercase tracking-wide hover:text-green-800">
              VIEW ALL EVENTS →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((ev, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden h-64 cursor-pointer shadow-lg"
              >
                <img
                  src={ev.img}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-[#4ade80] text-xs font-black uppercase tracking-widest mb-1">
                    {ev.date}
                  </div>
                  <h3 className="text-white font-black text-base mb-1">{ev.title}</h3>
                  <div className="text-gray-300 text-xs">📍 {ev.location}</div>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-[#16a34a] font-black text-xs shadow">
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WE REACH EVERY CORNER ─── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 uppercase leading-tight mb-6">
                We Reach Every Corner{" "}
                <span className="text-[#16a34a]">of the Country</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-lg">
                Our network spans all 24 Maryland counties and the DC metro
                area, connecting thousands of families with the food resources
                they need. No matter where you are, help is never far away.
              </p>
              <div className="flex gap-12 mb-10">
                <div>
                  <div className="text-4xl font-black text-[#16a34a] mb-1">
                    {countyCount > 0 ? countyCount : 24}+
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Counties</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#16a34a] mb-1">
                    {placeCount > 0 ? placeCount : "200"}+
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Locations</div>
                </div>
              </div>
              <Link
                to="/find-food"
                className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-7 py-3.5 rounded-lg hover:bg-[#15803d] transition-colors text-sm tracking-wide"
              >
                Explore the Map →
              </Link>
            </div>

            {/* Dot map visualization */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <svg
                  viewBox="0 0 420 280"
                  className="w-full h-auto"
                  aria-hidden="true"
                >
                  {Array.from({ length: 13 }, (_, row) =>
                    Array.from({ length: 20 }, (_, col) => {
                      const x = col * 21 + 10;
                      const y = row * 21 + 10;
                      const density =
                        row > 2 && row < 10 && col > 2 && col < 17;
                      const fill = density
                        ? col % 3 === 0
                          ? "#16a34a"
                          : col % 3 === 1
                          ? "#4ade80"
                          : "#bbf7d0"
                        : "#e2e8f0";
                      const opacity =
                        density ? 0.7 + Math.sin(row * col) * 0.3 : 0.25;
                      return (
                        <circle
                          key={`${row}-${col}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill={fill}
                          opacity={Math.abs(opacity)}
                        />
                      );
                    })
                  )}
                </svg>
                {/* Center card */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 text-center border border-green-100">
                    <div className="text-4xl mb-2">🗺️</div>
                    <div className="text-3xl font-black text-[#16a34a]">
                      {placeCount > 0 ? placeCount : "200"}+
                    </div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
                      Active Locations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECOND HERO / CTA ─── */}
      <section className="relative overflow-hidden bg-[#0d1f15]">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={`${BASE}images/helpinghands.jpg`}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f15]/90 to-[#0d1f15]/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-14">
          <div className="flex-1">
            <div className="text-[#4ade80] text-xs font-black uppercase tracking-widest mb-4">
              Join the Movement
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase leading-tight mb-5">
              Fight Against<br />
              <span className="text-[#4ade80]">Hunger,</span>
              <br />
              Donating Food Today
            </h2>
            <p className="text-gray-300 max-w-lg leading-relaxed">
              Together we can end food insecurity in our communities. Every
              donation and volunteer hour makes a measurable difference for
              families across Maryland and DC.
            </p>
          </div>
          <div className="w-full md:w-[300px] flex-shrink-0">
            <DonateWidget compact />
          </div>
        </div>
      </section>

      {/* ─── BRANDS / PARTNERS ─── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-10">
            Brands That Collaborate
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            {partners.map((org) => (
              <div
                key={org}
                className="text-gray-400 font-black text-xs sm:text-sm tracking-widest uppercase hover:text-gray-600 transition-colors cursor-default"
              >
                {org}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
