import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/find-food",  label: "Find Food",   icon: "🍎" },
  { to: "/donate",     label: "Donate",      icon: "🤲" },
  { to: "/food-post",  label: "Food Post",   icon: "📋" },
  { to: "/volunteer",  label: "Volunteer",   icon: "🙋" },
  { to: "/about",      label: "About",       icon: "ℹ️" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-700 text-white px-4 py-2 rounded z-[9999]"
      >
        Skip to main content
      </a>

      <header className="hero-gradient text-white shadow-lg sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-90">
            <span className="bg-white/20 rounded-lg p-1.5 text-lg">🥦</span>
            NourishNet
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/15 hover:text-white"
                    }`
                  }
                >
                  <span aria-hidden="true" className="mr-1">{l.icon}</span>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/15"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/20 px-4 pb-3">
            <ul className="space-y-1 pt-2">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive ? "bg-white/25" : "hover:bg-white/15"
                      }`
                    }
                  >
                    <span aria-hidden="true" className="mr-2">{l.icon}</span>
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥦</span>
            <span className="text-sm font-medium text-gray-300">NourishNet</span>
          </div>
          <div className="flex gap-4 text-xs">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <a href="https://github.com/protocorn/NAFSI_Track2" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
