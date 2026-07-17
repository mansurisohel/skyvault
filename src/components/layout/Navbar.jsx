import { useState } from 'react';
import { Menu, X, Star, Search } from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import { useActiveSection } from '@/hooks/useActiveSection';
import { NAV_LINKS } from '@/constants';
import UnitToggle from '@/components/common/UnitToggle';
import logoLockup from '@/assets/images/logo-lockup.webp';
import logoIcon from '@/assets/images/logo-icon.webp';

const SECTION_IDS = NAV_LINKS.map((l) => l.to.replace('#', ''));

export default function Navbar() {
  const { favorites } = useWeatherContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);

  function goTo(e, href) {
    e.preventDefault();
    const el = document.getElementById(href.replace('#', ''));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  }

  function focusSearch(e) {
    e.preventDefault();
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
    window.setTimeout(() => document.getElementById('hero-search-input')?.focus(), 450);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5">
      <div className="glass !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-8 md:py-3">
          <a
            href="#overview"
            onClick={(e) => goTo(e, '#overview')}
            className="flex shrink-0 items-center gap-2.5"
            aria-label="SkyVault home"
          >
            <img src={logoIcon} alt="" className="h-14 w-14 shrink-0 object-contain sm:hidden" />
            <img
              src={logoLockup}
              alt="SkyVault Weather Data"
              className="hidden h-14 w-auto object-contain sm:block lg:h-16"
            />
          </a>

          <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const isActive = active === link.to.replace('#', '');
              return (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => goTo(e, link.to)}
                  className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-mist-50' : 'text-slate-400 hover:text-mist-100'
                  }`}
                >
                  {link.label}
                  {isActive && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-sky-400" />}
                  {link.to === '#favorites' && favorites.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-sky-500/25 px-1.5 py-0.5 text-[10px] text-sky-300">
                      {favorites.length}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={focusSearch}
              aria-label="Search for a location"
              className="rounded-full p-2.5 text-slate-300 hover:bg-white/10 transition-colors"
            >
              <Search size={18} />
            </button>

            <UnitToggle className="hidden sm:inline-flex" />

            <a
              href="#favorites"
              onClick={(e) => goTo(e, '#favorites')}
              aria-label="Favorites"
              className="hidden rounded-full p-2.5 text-slate-300 hover:bg-white/10 transition-colors md:block lg:hidden"
            >
              <Star size={18} />
            </a>

            <button
              type="button"
              className="shrink-0 rounded-full p-2.5 text-slate-300 hover:bg-white/10 transition-colors lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/5 px-4 py-4 lg:hidden">
            <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
              <span className="text-sm font-medium text-slate-400">Units</span>
              <UnitToggle />
            </div>
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((link) => {
                const isActive = active === link.to.replace('#', '');
                return (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={(e) => goTo(e, link.to)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-sky-400/15 text-mist-50' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
