import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, X, Loader2, Clock, Navigation, Star } from 'lucide-react';
import { searchLocations } from '@/services/geocodingService';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useWeatherContext } from '@/context/WeatherContext';
import { locationLabel } from '@/utils/format';

/**
 * variant: 'hero' (large, landing search with quick-access chips) or
 * 'compact' (nav bar search).
 */
export default function SearchBar({ variant = 'compact', onSelect }) {
  const {
    selectLocation, useCurrentLocation, locating, history, favorites, isFavorite,
  } = useWeatherContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [notFound, setNotFound] = useState(false);
  const containerRef = useRef(null);
  const debounced = useDebouncedValue(query, 350);
  const hero = variant === 'hero';

  useEffect(() => {
    let cancelled = false;
    if (!debounced || debounced.trim().length < 2) {
      setResults([]);
      setNotFound(false);
      return;
    }
    setLoading(true);
    searchLocations(debounced)
      .then((res) => {
        if (cancelled) return;
        setResults(res);
        setNotFound(res.length === 0);
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searching = query.trim().length >= 2;
  const list = searching ? results : history;

  function pick(loc) {
    selectLocation(loc);
    onSelect?.(loc);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && list[activeIndex]) pick(list[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const quickChips = hero
    ? [...favorites, ...history.filter((h) => !isFavorite(h))].slice(0, 6)
    : [];

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`group glass flex items-center gap-2.5 rounded-full transition-shadow focus-within:shadow-[0_0_0_3px_rgba(127,171,255,0.25)] ${
          hero ? 'px-5 py-4 sm:px-6 sm:py-4' : 'px-4 py-2'
        }`}
      >
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sky-300 ${hero ? 'h-9 w-9' : 'h-7 w-7'}`}>
          <Search size={hero ? 18 : 15} />
        </span>
        <input
          id={hero ? 'hero-search-input' : undefined}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={hero ? 'Search any city, region, or country…' : 'Search location…'}
          aria-label="Search for a location"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
          className={`w-full bg-transparent text-mist-100 placeholder:text-slate-500 outline-none ${hero ? 'text-base sm:text-lg' : 'text-sm'}`}
        />
        {loading && <Loader2 size={hero ? 18 : 16} className="animate-spin text-slate-400 shrink-0" />}
        {query && !loading && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="shrink-0">
            <X size={16} className="text-slate-400 hover:text-mist-100" />
          </button>
        )}
        <button
          type="button"
          onClick={useCurrentLocation}
          aria-label="Use current location"
          className={`shrink-0 flex items-center gap-1.5 rounded-full font-medium text-sky-300 hover:bg-sky-400/15 transition-colors ${
            hero ? 'px-3.5 py-2 text-sm' : 'p-1.5'
          }`}
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={hero ? 15 : 16} />}
          {hero && <span className="hidden sm:inline">Near me</span>}
        </button>
      </div>

      {open && (
        <div className="glass-panel absolute z-30 mt-2 w-full max-h-80 overflow-y-auto p-2 scrollbar-none">
          {!searching && history.length > 0 && (
            <p className="px-3 pt-1 pb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Recent searches</p>
          )}
          {!searching && history.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-500">Start typing to search for a city — try “Tokyo” or “Ahmedabad”.</p>
          )}
          {notFound && !loading && (
            <p className="px-3 py-4 text-sm text-slate-500">No locations found for “{query}”. Try a different spelling.</p>
          )}
          {list.map((loc, i) => (
            <button
              key={`${loc.lat}-${loc.lon}`}
              type="button"
              onClick={() => pick(loc)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                activeIndex === i ? 'bg-sky-400/15 text-mist-50' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {searching ? <MapPin size={15} className="text-sky-400 shrink-0" /> : <Clock size={15} className="text-slate-500 shrink-0" />}
              <span className="truncate">{locationLabel(loc)}</span>
              {isFavorite(loc) && <Star size={13} className="ml-auto shrink-0 fill-amber-400 text-amber-400" />}
            </button>
          ))}
        </div>
      )}

      {hero && quickChips.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {quickChips.map((loc) => (
            <button
              key={`${loc.lat}-${loc.lon}`}
              type="button"
              onClick={() => pick(loc)}
              className="flex items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-mist-100 hover:bg-white/10 transition-colors"
            >
              {isFavorite(loc) ? <Star size={12} className="fill-amber-400 text-amber-400" /> : <Clock size={12} className="text-slate-500" />}
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
