import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
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
import { getLessonsLoad, TLessonsLoad } from "./lessonsLoad";

const DEBOUNCE_MS = 200;

// One index per download of the lessons, so reopening the sidebar reuses it
const searchIndexes = new WeakMap<TLessonsLoad, Promise<TSearchEntry[]>>();

const getSearchIndex = (load: TLessonsLoad): Promise<TSearchEntry[]> => {
  let index = searchIndexes.get(load);
  if (!index) {
    index = load.promise.then(buildSearchIndex);
    searchIndexes.set(load, index);
    // A failed index is not kept, so retrying builds it again
    index.catch(() => searchIndexes.delete(load));
  }
  return index;
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
  const [load, setLoad] = useState<TLessonsLoad | null>(null);
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
    getSearchIndex(load)
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
    setLoad((previous) => (previous ? getLessonsLoad() : previous));
  }, [language]);

  const startIndexing = () => setLoad(getLessonsLoad());

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
