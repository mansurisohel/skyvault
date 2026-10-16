import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchNewsArticles, rankByRelevance, describeNewsFailure } from '@/services/newsService';
import { buildLocalInsights } from '@/services/insightsService';
import { isAbortError } from '@/services/apiClient';

const AUTO_REFRESH_MS = 10 * 60 * 1000;

/**
 * News articles are fetched once and are NOT tied to the selected city
 * (the query is general; see api/news.js). Changing location therefore never
 * triggers a request or a race: articles are simply re-ranked, and the
 * fallback "insights" are derived instantly from the weather snapshot.
 */
export function useWeatherNews(snapshot, location, unit) {
  const [state, setState] = useState({ status: 'loading', articles: [], error: null, updatedAt: null });
  const requestId = useRef(0);
  const abortRef = useRef(null);

  const load = useCallback(async ({ announce = false, silent = false } = {}) => {
    const id = ++requestId.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (announce) setState((s) => ({ ...s, status: 'loading', error: null }));

    try {
      const { articles, fetchedAt } = await fetchNewsArticles({ signal: controller.signal });
      if (id !== requestId.current) return;
      setState({ status: 'ready', articles, error: null, updatedAt: fetchedAt });
    } catch (err) {
      if (id !== requestId.current || isAbortError(err)) return;
      setState((s) => (silent && s.articles.length
        ? s // a failed background refresh keeps showing the last good articles
        : { status: 'ready', articles: [], error: describeNewsFailure(err), updatedAt: s.updatedAt }));
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load({ silent: true }); };
    const interval = window.setInterval(tick, AUTO_REFRESH_MS);
    window.addEventListener('online', tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', tick);
    };
  }, [load]);

  const articles = useMemo(() => rankByRelevance(state.articles, location), [state.articles, location]);
  const insights = useMemo(
    () => (snapshot && location ? buildLocalInsights(snapshot, location, unit) : []),
    [snapshot, location, unit],
  );

  const refresh = useCallback(() => load({ announce: true }), [load]);

  return {
    status: state.status,
    articles,
    insights,
    error: state.error, // { code, message } | null — why live news isn't being shown
    updatedAt: state.updatedAt,
    refresh,
  };
}
