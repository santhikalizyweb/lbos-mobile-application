import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { errorMessage } from '../api/client';

/**
 * Each result is stored with the key (the serialised deps) it was loaded for,
 * so "loading" is derived: the screen is loading while the stored result
 * belongs to a different key than the current one.
 */
type Loaded<T> = { key: string | null; data: T | null; error: string | null };

/**
 * Loads one resource. `refresh` is for pull-to-refresh; the data is also
 * reloaded quietly whenever the screen comes back into focus (e.g. after
 * editing on a detail screen).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<Loaded<T>>({ key: null, data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const keyRef = useRef(key);
  const navigation = useNavigation();

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async (forKey: string) => {
    try {
      const data = await fetcherRef.current();
      if (forKey === keyRef.current) {
        setState({ key: forKey, data, error: null });
      }
    } catch (e) {
      if (forKey === keyRef.current) {
        // A failed quiet reload keeps what is already on screen.
        setState(prev => (prev.key === forKey && prev.data !== null ? prev : { key: forKey, data: null, error: errorMessage(e) }));
      }
    }
  }, []);

  useEffect(() => {
    keyRef.current = key;
    run(key);
  }, [key, run]);

  useEffect(() => {
    return navigation.addListener('focus', () => {
      run(keyRef.current);
    });
  }, [navigation, run]);

  const setData = useCallback((next: T | null | ((prev: T | null) => T | null)) => {
    setState(prev => ({
      ...prev,
      data: typeof next === 'function' ? (next as (p: T | null) => T | null)(prev.data) : next,
    }));
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    run(keyRef.current).finally(() => setRefreshing(false));
  }, [run]);

  const current = state.key === key;
  return {
    data: current ? state.data : null,
    setData,
    error: current ? state.error : null,
    loading: !current,
    refreshing,
    refresh,
    reload: () => run(keyRef.current),
  };
}

type PageResult<T> = { items: T[]; lastPage: number; raw: any };

/** Reads Laravel's paginator, API-resource and custom {data, meta} shapes. */
export function readPage<T>(res: any): PageResult<T> {
  const items: T[] = Array.isArray(res) ? res : res?.data ?? [];
  const lastPage = res?.last_page ?? res?.meta?.last_page ?? 1;
  return { items, lastPage, raw: res };
}

type Pages<T> = { key: string | null; items: T[]; raw: any; page: number; lastPage: number; error: string | null };

/** Infinite-scroll list over a paginated endpoint. */
export function usePaginated<T>(fetchPage: (page: number) => Promise<any>, deps: unknown[] = []) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<Pages<T>>({ key: null, items: [], raw: null, page: 1, lastPage: 1, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchRef = useRef(fetchPage);
  const keyRef = useRef(key);
  const navigation = useNavigation();

  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const loadFirst = useCallback(async (forKey: string) => {
    try {
      const res = readPage<T>(await fetchRef.current(1));
      if (forKey === keyRef.current) {
        setState({ key: forKey, items: res.items, raw: res.raw, page: 1, lastPage: res.lastPage, error: null });
      }
    } catch (e) {
      if (forKey === keyRef.current) {
        setState(prev =>
          prev.key === forKey && prev.error === null
            ? prev
            : { key: forKey, items: [], raw: null, page: 1, lastPage: 1, error: errorMessage(e) },
        );
      }
    }
  }, []);

  useEffect(() => {
    keyRef.current = key;
    loadFirst(key);
  }, [key, loadFirst]);

  useEffect(() => {
    return navigation.addListener('focus', () => {
      loadFirst(keyRef.current);
    });
  }, [navigation, loadFirst]);

  const current = state.key === key;

  const loadMore = useCallback(async () => {
    if (loadingMore || !current || state.page >= state.lastPage) {
      return;
    }
    const forKey = key;
    const next = state.page + 1;
    setLoadingMore(true);
    try {
      const res = readPage<T>(await fetchRef.current(next));
      if (forKey === keyRef.current) {
        setState(prev => (prev.key === forKey ? { ...prev, items: [...prev.items, ...res.items], page: next, lastPage: res.lastPage } : prev));
      }
    } catch {
      // Keep what is shown; the user can scroll again to retry.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, current, state.page, state.lastPage, key]);

  const setItems = useCallback((next: (prev: T[]) => T[]) => {
    setState(prev => ({ ...prev, items: next(prev.items) }));
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadFirst(keyRef.current).finally(() => setRefreshing(false));
  }, [loadFirst]);

  return {
    items: current ? state.items : [],
    setItems,
    raw: current ? state.raw : null,
    error: current ? state.error : null,
    loading: !current,
    refreshing,
    loadingMore,
    hasMore: current && state.page < state.lastPage,
    refresh,
    reload: () => loadFirst(keyRef.current),
    loadMore,
  };
}

/** Delays a fast-changing value (search boxes). */
export function useDebounced<T>(value: T, ms = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * State seeded from a route param that also follows later changes to that
 * param (e.g. a dashboard card opening a tab with a filter picked), using
 * React's "adjust state while rendering" pattern instead of an effect.
 */
export function useParamState<S>(param: S | undefined, fallback: S): [S, (v: S) => void] {
  const [value, setValue] = useState<S>(param !== undefined ? param : fallback);
  const [seen, setSeen] = useState(param);
  if (param !== seen) {
    setSeen(param);
    if (param !== undefined) {
      setValue(param);
    }
  }
  return [value, setValue];
}
