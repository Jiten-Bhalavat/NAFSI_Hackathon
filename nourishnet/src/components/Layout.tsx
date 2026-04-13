import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/find-food", label: "Find Food" },
  { to: "/donate", label: "Donate" },
  { to: "/food-post", label: "Community" },
  { to: "/about", label: "About" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-green-700 text-white px-4 py-2 rounded z-[9999]"
      >
        Skip to main content
      </a>

      {/* ─── NAVBAR ─── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <nav
          className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-base font-black leading-none">N</span>
            </div>
            <span className="text-[#15803d] text-lg font-black tracking-tight">
              NourishNet
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-[#16a34a] bg-green-50"
                        : "text-gray-600 hover:text-[#16a34a] hover:bg-gray-50"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/volunteer"
              className="text-sm font-semibold text-white bg-[#16a34a] px-4 py-2 rounded-lg hover:bg-[#15803d] transition-colors shadow-sm"
            >
              Register as Volunteer
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 pb-4">
            <ul className="space-y-1 pt-3">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-green-50 text-[#16a34a]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#16a34a]"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link
                to="/volunteer"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-bold text-white bg-[#16a34a] px-4 py-2.5 rounded-lg text-center hover:bg-[#15803d] transition-colors"
              >
                Register as Volunteer
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0d1f15] text-gray-400">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center">
                  <span className="text-white text-base font-black">N</span>
                </div>
                <span className="text-white text-lg font-black tracking-tight">NourishNet</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">
                Connecting Maryland and DC communities with food resources,
                volunteer opportunities, and donation drives.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#16a34a] transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Quick Links</h3>
              <ul className="space-y-2.5">
                {[
                  { to: "/find-food", label: "Find Food" },
                  { to: "/donate", label: "Donate" },
                  { to: "/food-post", label: "Community Board" },
                  { to: "/volunteer", label: "Volunteer" },
                  { to: "/about", label: "About" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm hover:text-[#4ade80] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Programs */}
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Programs</h3>
              <ul className="space-y-2.5 text-sm">
                <li><span className="hover:text-[#4ade80] transition-colors cursor-default">Food Pantry Network</span></li>
                <li><span className="hover:text-[#4ade80] transition-colors cursor-default">Surplus Food Board</span></li>
                <li><span className="hover:text-[#4ade80] transition-colors cursor-default">Volunteer Matching</span></li>
                <li><span className="hover:text-[#4ade80] transition-colors cursor-default">Community Events</span></li>
                <li><span className="hover:text-[#4ade80] transition-colors cursor-default">Food Desert Map</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#4ade80] mt-0.5">📍</span>
                  <span>Maryland &amp; DC Metro Area</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4ade80] mt-0.5">✉️</span>
                  <span>help@nourishnet.org</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4ade80] mt-0.5">📞</span>
                  <span>1-800-NOURISH</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">
              © 2026 NourishNet · Open-source hackathon project · Data may be
              incomplete · Always confirm with the organization
            </p>
            <div className="flex gap-5 text-xs">
              <Link to="/about" className="hover:text-[#4ade80] transition-colors">
                About
              </Link>
              <a
                href="https://github.com/protocorn/NAFSI_Track2"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#4ade80] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
