import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import { getHost } from "../../../utils/lib";
import { fetchAllLessons } from "../../../utils/packageLessons";
import {
  buildSearchIndex,
  highlightInLessonWhenReady,
  MIN_QUERY_LENGTH,
  searchLessons,
  TSearchEntry,
  TSearchResult,
} from "../../../utils/lessonSearch";
import { eventBus } from "../../../managers/eventBus";
import { Icon } from "@/components/Icon";

const DEBOUNCE_MS = 200;

type TIndexLoad = {
  key: string;
  promise: Promise<TSearchEntry[]>;
  loaded: number;
  total: number;
  listeners: Set<() => void>;
};

// The index lives outside the component: the sidebar unmounts every time it
// closes and the READMEs should be downloaded once per session and language
let currentLoad: TIndexLoad | null = null;

const getIndexLoad = (): TIndexLoad => {
  const { exercises, sidebar, configObject, language, mode } =
    useStore.getState();
  const key = `${language}:${exercises.map((ex) => ex.slug).join(",")}`;

  // Creators edit the lessons, so they get a fresh index each time they search
  // again (a load in progress is still reused)
  const isLoading =
    currentLoad !== null && currentLoad.loaded < currentLoad.total;
  if (currentLoad?.key === key && (mode !== "creator" || isLoading)) {
    return currentLoad;
  }

  const load: TIndexLoad = {
    key,
    promise: Promise.resolve([]),
    loaded: 0,
    total: exercises.length,
    listeners: new Set(),
  };
  load.promise = fetchAllLessons({
    exercises,
    language,
    sidebar,
    host: getHost(),
    variables: (configObject?.config as { variables?: unknown })?.variables,
    onProgress: (loaded) => {
      load.loaded = loaded;
      load.listeners.forEach((listener) => listener());
    },
  }).then(buildSearchIndex);
  // A failed load is not cached, so the next search tries again
  load.promise.catch(() => {
    if (currentLoad === load) currentLoad = null;
  });

  currentLoad = load;
  return load;
};

type TLessonSearchProps = {
  closeSidebar: () => void;
  /** Called with true while the results are shown instead of the lessons */
  onActiveChange: (active: boolean) => void;
};

export const LessonSearch = ({
  closeSidebar,
  onActiveChange,
}: TLessonSearchProps) => {
  const { t } = useTranslation();
  const language = useStore((state) => state.language);
  const reportEnrichDataLayer = useStore(
    (state) => state.reportEnrichDataLayer
  );

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [load, setLoad] = useState<TIndexLoad | null>(null);
  const [index, setIndex] = useState<TSearchEntry[] | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [failed, setFailed] = useState(false);

  const isActive = query.trim().length > 0;

  useEffect(() => {
    onActiveChange(isActive);
  }, [isActive, onActiveChange]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!load) return;
    let active = true;
    const updateProgress = () =>
      setProgress({ loaded: load.loaded, total: load.total });

    setIndex(null);
    setFailed(false);
    updateProgress();
    load.listeners.add(updateProgress);
    load.promise
      .then((result) => {
        if (active) setIndex(result);
      })
      .catch((error) => {
        console.error("Error building the lesson search index", error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      load.listeners.delete(updateProgress);
    };
  }, [load]);

  // Changing the language invalidates an index that was already requested
  useEffect(() => {
    setLoad((previous) => (previous ? getIndexLoad() : previous));
  }, [language]);

  const startIndexing = () => setLoad(getIndexLoad());

  const results = useMemo(
    () => (index ? searchLessons(index, debouncedQuery) : []),
    [index, debouncedQuery]
  );

  const openResult = (result: TSearchResult) => {
    reportEnrichDataLayer("learnpack_lesson_search_click", {
      query_length: debouncedQuery.trim().length,
      results: results.length,
      position: result.position,
    });
    eventBus.emit("position_change", { position: result.position });
    highlightInLessonWhenReady(result.position, result.term);
    closeSidebar();
  };

  const renderStatus = () => {
    if (failed) {
      return (
        <p className="lesson-search-status">
          {t("lesson-search-error")}{" "}
          <button type="button" className="lesson-search-retry" onClick={startIndexing}>
            {t("lesson-search-retry")}
          </button>
        </p>
      );
    }
    if (!index) {
      return (
        <p className="lesson-search-status">
          {t("lesson-search-indexing", progress)}
        </p>
      );
    }
    if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
      return (
        <p className="lesson-search-status">{t("lesson-search-min-length")}</p>
      );
    }
    if (results.length === 0) {
      return (
        <p className="lesson-search-status">{t("lesson-search-no-results")}</p>
      );
    }
    return null;
  };

  return (
    <div className="lesson-search">
      <div className="lesson-search-input">
        <Icon name="Search" size={16} />
        <input
          type="search"
          value={query}
          placeholder={t("lesson-search-placeholder")}
          aria-label={t("lesson-search-placeholder")}
          onFocus={startIndexing}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
          }}
        />
      </div>

      {isActive && (
        <div className="lesson-search-results">
          {renderStatus()}
          {index &&
            results.map((result) => (
              <button
                type="button"
                key={result.slug}
                className="lesson-search-result"
                onClick={() => openResult(result)}
              >
                <span className="lesson-search-result-title">
                  <span className="lesson-search-result-id">{result.id}</span>
                  {result.title}
                </span>
                {result.snippet.match && (
                  <span className="lesson-search-result-snippet">
                    {result.snippet.before}
                    <mark>{result.snippet.match}</mark>
                    {result.snippet.after}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
