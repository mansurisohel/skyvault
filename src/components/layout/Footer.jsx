import logoLockup from '@/assets/images/logo-lockup.webp';
import { DEMO_MODE } from '@/constants';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
        <img src={logoLockup} alt="SkyVault Weather Data" className="h-14 w-auto object-contain" />
        <p className="text-center md:text-right">
          {DEMO_MODE ? 'Running in demo mode — add API keys in .env to go live. ' : ''}
          Data by OpenWeather. Built for clarity, not clutter.
        </p>
      </div>
    </footer>
  );
}
