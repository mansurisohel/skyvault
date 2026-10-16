import { useMemo } from 'react';
import UnitToggle from '@/components/common/UnitToggle';
import { useWeatherContext } from '@/context/WeatherContext';
import { useActiveSection } from '@/hooks/useActiveSection';
import logoLockup from '@/assets/images/logo-lockup.webp';
import logoIcon from '@/assets/images/logo-icon.webp';

const SECTIONS = [
  { id: 'overview', label: 'Overview', needsData: false },
  { id: 'forecast', label: 'Forecast', needsData: true },
  { id: 'health', label: 'Health', needsData: true },
  { id: 'map', label: 'Map', needsData: false },
  { id: 'news', label: 'News', needsData: false },
  { id: 'favorites', label: 'Favorites', needsData: false },
];
const ALL_IDS = SECTIONS.map((s) => s.id);

export default function Navbar() {
  const { snapshot, isStale } = useWeatherContext();
  const ready = Boolean(snapshot) && !isStale;
  const active = useActiveSection(ALL_IDS, ready);
  const links = useMemo(() => SECTIONS.filter((s) => ready || !s.needsData), [ready]);

  function goHome(e) {
    e.preventDefault();
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5">
      <div className="glass !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#overview" onClick={goHome} className="focus-ring flex shrink-0 items-center rounded-lg" aria-label="SkyVault home">
            <img src={logoIcon} alt="" width="56" height="58" className="h-14 w-14 shrink-0 object-contain sm:hidden" />
            <img src={logoLockup} alt="SkyVault Weather Data" className="hidden h-14 w-auto object-contain sm:block lg:h-16" />
          </a>

          <nav aria-label="Page sections" className="hidden items-center gap-1 lg:flex">
            {links.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
                className={`focus-ring rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active === s.id ? 'bg-sky-500/20 text-sky-200' : 'text-slate-300 hover:bg-white/5 hover:text-mist-50'
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>

          <UnitToggle />
        </div>
      </div>
    </header>
  );
}
