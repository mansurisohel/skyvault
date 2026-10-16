import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, MapPin, X, Loader2, Clock, Navigation, Star, TriangleAlert, RefreshCw } from 'lucide-react';
import { searchLocations } from '@/services/geocodingService';
import { isAbortError } from '@/services/apiClient';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useWeatherContext } from '@/context/WeatherContext';
import { locationLabel } from '@/utils/format';
import { sanitizeQuery } from '@/utils/location';

/**
 * Location search with an accessible combobox pattern (listbox + options,
 * aria-activedescendant, full keyboard support).
 *
 * Request safety: input is debounced and sanitized, each search is aborted when
 * superseded, and results are only shown if they belong to the CURRENT query,
 * so a slow earlier response can never replace a newer one.
 *
 * variant: 'hero' (large landing search with quick-access chips) or 'compact'.
 */
export default function SearchBar({ variant = 'compact', onSelect }) {
  const {
    selectLocation, useCurrentLocation, locating, locationError, clearLocationError, history, favorites, isFavorite,
  } = useWeatherContext();

  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); // { forQuery, results, demo, error }
  const [retryKey, setRetryKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const optionId = (i) => `${uid}-option-${i}`;

  const hero = variant === 'hero';
  const cleanQuery = sanitizeQuery(query);
  const debouncedQuery = sanitizeQuery(useDebouncedValue(query, 300));
  const searching = cleanQuery.length >= 2;

  useEffect(() => {
    if (debouncedQuery.length < 2) return undefined;
    const controller = new AbortController();
    searchLocations(debouncedQuery, { signal: controller.signal })
      .then((r) => setResult({ forQuery: debouncedQuery, results: r.results, demo: r.demo, error: null }))
      .catch((err) => {
        if (isAbortError(err)) return;
        setResult({ forQuery: debouncedQuery, results: [], demo: false, error: err.message || 'Search failed.' });
      });
    return () => controller.abort();
  }, [debouncedQuery, retryKey]);

  // Only trust a result that belongs to what is currently typed.
  const current = searching && result?.forQuery === cleanQuery ? result : null;
  const loading = searching && !current;

  const recents = useMemo(
    () => [...favorites, ...history.filter((h) => !isFavorite(h))].slice(0, 8),
    [favorites, history, isFavorite],
  );
  const items = searching ? (current?.results ?? []) : recents;

  useEffect(() => {
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function pick(loc) {
    selectLocation(loc);
    onSelect?.(loc);
    setQuery('');
    setResult(null);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur(); // dismisses the on-screen keyboard on phones
  }

  function retrySearch() {
    setResult(null);
    setRetryKey((k) => k + 1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (!items.length) return;
      setActiveIndex((i) => {
        if (e.key === 'ArrowDown') return i >= items.length - 1 ? 0 : i + 1;
        return i <= 0 ? items.length - 1 : i - 1;
      });
    } else if (e.key === 'Home' && open && items.length) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && open && items.length) {
      e.preventDefault();
      setActiveIndex(items.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter picks the highlighted result, or the top result if none is highlighted.
      const target = items[activeIndex >= 0 ? activeIndex : 0];
      if (open && target) pick(target);
    } else if (e.key === 'Escape') {
      if (open) setOpen(false);
      else setQuery('');
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  const showDropdown = open && (items.length > 0 || searching || recents.length === 0);
  const activeId = open && activeIndex >= 0 && items[activeIndex] ? optionId(activeIndex) : undefined;

  let statusMessage = '';
  if (searching && loading) statusMessage = 'Searching…';
  else if (current?.error) statusMessage = `Search failed: ${current.error}`;
  else if (current && current.results.length === 0) statusMessage = `No locations found for ${cleanQuery}.`;
  else if (searching && items.length) statusMessage = `${items.length} result${items.length === 1 ? '' : 's'} available. Use the arrow keys to browse.`;

  const quickChips = hero ? recents.slice(0, 6) : [];

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`group glass-solid flex items-center gap-2.5 rounded-full transition-shadow focus-within:shadow-[0_0_0_3px_rgba(127,171,255,0.25)] ${
          hero ? 'px-4 py-3 sm:px-6 sm:py-4' : 'px-4 py-2'
        }`}
      >
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sky-300 ${hero ? 'h-9 w-9' : 'h-7 w-7'}`}>
          <Search size={hero ? 18 : 15} aria-hidden="true" />
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          maxLength={80}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={hero ? 'Search any city…' : 'Search location…'}
          aria-label="Search for a location"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck="false"
          className={`w-full min-w-0 bg-transparent text-mist-100 caret-sky-300 outline-none placeholder:text-slate-400 ${hero ? 'text-base sm:text-lg' : 'text-base sm:text-sm'}`}
        />
        {loading && <Loader2 size={hero ? 18 : 16} className="shrink-0 animate-spin text-slate-400" aria-hidden="true" />}
        {query && !loading && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setQuery(''); setResult(null); inputRef.current?.focus(); }}
            className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-mist-100"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          aria-label="Use my current location"
          title="Use my current location"
          className={`focus-ring flex shrink-0 items-center gap-1.5 rounded-full font-medium text-sky-300 transition-colors hover:bg-sky-400/15 active:scale-95 disabled:cursor-wait disabled:opacity-70 ${
            hero ? 'min-h-10 px-3.5 py-2 text-sm' : 'h-8 w-8 justify-center'
          }`}
        >
          {locating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Navigation size={hero ? 15 : 16} aria-hidden="true" />}
          {hero && <span className="hidden sm:inline">{locating ? 'Locating…' : 'Near me'}</span>}
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{statusMessage}</p>

      {locationError && (
        <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-2xl bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-100">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{locationError.message}</span>
          <button
            type="button"
            onClick={clearLocationError}
            aria-label="Dismiss location message"
            className="focus-ring -m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {showDropdown && (
        <div className="glass-solid absolute z-30 mt-2 max-h-[min(20rem,55dvh)] w-full overflow-y-auto rounded-2xl p-2 text-left scrollbar-none">
          {!searching && recents.length > 0 && (
            <p id={`${uid}-label`} className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-400">Favorites &amp; recent</p>
          )}
          {!searching && recents.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-400">Start typing to search for a city, for example “Tokyo” or “Ahmedabad”.</p>
          )}
          {current?.demo && (
            <p className="px-3 pb-2 pt-1 text-xs text-amber-300">Demo mode: only a small list of sample cities is searchable until an OpenWeather key is configured.</p>
          )}
          {loading && <p className="px-3 py-4 text-sm text-slate-400">Searching…</p>}
          {current?.error && (
            <div className="flex flex-wrap items-center gap-3 px-3 py-3 text-sm text-amber-200">
              <span className="min-w-0 flex-1">{current.error}</span>
              <button type="button" onClick={retrySearch} className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20">
                <RefreshCw size={12} aria-hidden="true" /> Retry
              </button>
            </div>
          )}
          {current && !current.error && current.results.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-400">No locations found for “{cleanQuery}”. Check the spelling or add a country, for example “Paris, FR”.</p>
          )}

          <ul id={listboxId} role="listbox" aria-label={searching ? 'Search results' : 'Favorites and recent searches'} className="m-0 list-none p-0">
            {items.map((loc, i) => (
              <li
                key={`${loc.lat}-${loc.lon}`}
                id={optionId(i)}
                role="option"
                aria-selected={activeIndex === i}
                onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                onClick={() => pick(loc)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  activeIndex === i ? 'bg-sky-400/15 text-mist-50' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {searching ? <MapPin size={15} className="shrink-0 text-sky-400" aria-hidden="true" /> : <Clock size={15} className="shrink-0 text-slate-500" aria-hidden="true" />}
                <span className="truncate">{locationLabel(loc)}</span>
                {isFavorite(loc) && <Star size={13} className="ml-auto shrink-0 fill-amber-400 text-amber-400" aria-label="Favorite" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hero && quickChips.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {quickChips.map((loc) => (
            <button
              key={`${loc.lat}-${loc.lon}`}
              type="button"
              onClick={() => pick(loc)}
              className="focus-ring flex min-h-9 items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-mist-100 active:scale-95"
            >
              {isFavorite(loc) ? <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden="true" /> : <Clock size={12} className="text-slate-500" aria-hidden="true" />}
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
