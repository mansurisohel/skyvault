import UnitToggle from '@/components/common/UnitToggle';
import logoLockup from '@/assets/images/logo-lockup.webp';
import logoIcon from '@/assets/images/logo-icon.webp';

export default function Navbar() {
  function goHome(e) {
    e.preventDefault();
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5">
      <div className="glass !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a
            href="#overview"
            onClick={goHome}
            className="flex shrink-0 items-center"
            aria-label="SkyVault home"
          >
            <img src={logoIcon} alt="" className="h-14 w-14 shrink-0 object-contain sm:hidden" />
            <img
              src={logoLockup}
              alt="SkyVault Weather Data"
              className="hidden h-14 w-auto object-contain sm:block lg:h-16"
            />
          </a>

          <UnitToggle />
        </div>
      </div>
    </header>
  );
}
