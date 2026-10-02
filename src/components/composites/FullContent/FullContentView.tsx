import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import mermaid from "mermaid";
import useStore from "../../../utils/store";
import { getHost, resolveCourseTitle } from "../../../utils/lib";
import {
  fetchAllLessons,
  TPackageLesson,
} from "../../../utils/packageLessons";
import { svgs } from "../../../assets/svgs";
import { Icon } from "../../Icon";
import { Loader } from "../Loader/Loader";
import { StaticMarkdown } from "./StaticMarkdown";
import "./FullContent.css";

// Class set on <body> while the view is open: the print styles use it to print
// only this view, so the PDF button and the browser's Ctrl+P give the same result
const OPEN_CLASS = "lp-full-content-open";
// Max time to wait for an image before printing anyway
const IMAGE_TIMEOUT_MS = 10000;

const lessonAnchor = (slug: string) => `full-content-lesson-${slug}`;

const waitForImages = (container: HTMLElement) =>
  Promise.all(
    Array.from(container.querySelectorAll("img")).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, IMAGE_TIMEOUT_MS);
        })
    )
  );

export const FullContentView = () => {
  const { t } = useTranslation();
  const language = useStore((state) => state.language);
  const configObject = useStore((state) => state.configObject);
  const setOpenedModals = useStore((state) => state.setOpenedModals);
  const user = useStore((state) => state.user);

  const [lessons, setLessons] = useState<TPackageLesson[] | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [loadError, setLoadError] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const diagramsRendered = useRef<Promise<unknown>>(Promise.resolve());

  const courseTitle = resolveCourseTitle(configObject?.config?.title, language);

  // Who the PDF is for: printed on the cover and as a watermark on every page
  const learnerName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.email ||
    "";
  const learner = {
    name: learnerName,
    email: user?.email ?? "",
    date: new Date().toLocaleDateString(language),
  };

  const close = () => setOpenedModals({ fullContent: false });

  useEffect(() => {
    document.body.classList.add(OPEN_CLASS);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedModals({ fullContent: false });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove(OPEN_CLASS);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setOpenedModals]);

  // The lessons are read from the store when the view opens (or the language
  // changes), so background updates of the exercises don't reload everything
  useEffect(() => {
    let cancelled = false;
    const { exercises, sidebar, configObject } = useStore.getState();

    setLessons(null);
    setLoadError(false);
    setProgress({ loaded: 0, total: exercises.length });

    fetchAllLessons({
      exercises,
      language,
      sidebar,
      host: getHost(),
      variables: (configObject?.config as { variables?: unknown })?.variables,
      onProgress: (loaded, total) => {
        if (!cancelled) setProgress({ loaded, total });
      },
    })
      .then((result) => {
        if (!cancelled) setLessons(result);
      })
      .catch((error) => {
        console.error("Error loading the full content", error);
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (!lessons || !contentRef.current) return;
    const nodes = contentRef.current.querySelectorAll<HTMLElement>(".mermaid");
    if (nodes.length === 0) return;
    diagramsRendered.current = mermaid
      .run({ nodes, suppressErrors: true })
      .catch((error) => console.error("Error rendering diagrams", error));
  }, [lessons]);

  const scrollToLesson = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    document
      .getElementById(lessonAnchor(slug))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const downloadPdf = async () => {
    if (!contentRef.current) return;
    setIsPreparingPdf(true);
    try {
      await Promise.all([
        waitForImages(contentRef.current),
        diagramsRendered.current,
      ]);
    } finally {
      setIsPreparingPdf(false);
    }

    // The browser suggests the document title as the PDF file name
    const previousTitle = document.title;
    document.title = [courseTitle, learnerName].filter(Boolean).join(" - ");
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  return (
    <div
      className="full-content-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("full-content")}
    >
      {/* Only printed: position fixed repeats it on every page of the PDF */}
      <div className="full-content-watermark" aria-hidden="true">
        <span>{t("full-content-watermark-owner", learner)}</span>
        <span>{t("full-content-watermark-no-distribution", learner)}</span>
      </div>

      <header className="full-content-toolbar">
        <div className="full-content-toolbar-info">
          <strong>{courseTitle}</strong>
          <span className="full-content-hint">
            {t("full-content-search-hint")}
          </span>
        </div>
        <div className="full-content-toolbar-actions">
          <button
            className="full-content-button full-content-button-primary"
            onClick={downloadPdf}
            disabled={!lessons || isPreparingPdf}
          >
            <Icon name="Download" size={16} />
            {isPreparingPdf
              ? t("full-content-preparing-pdf")
              : t("full-content-download-pdf")}
          </button>
          <button
            className="full-content-button"
            onClick={close}
            title={t("full-content-close")}
            aria-label={t("full-content-close")}
          >
            <Icon name="X" size={18} />
          </button>
        </div>
      </header>

      <div className="full-content-scroll">
        {loadError && (
          <p className="full-content-status">{t("full-content-load-error")}</p>
        )}
        {!loadError && !lessons && (
          <div className="full-content-status">
            <Loader
              svg={svgs.rigoSoftBlue}
              text={t("full-content-loading", progress)}
            />
          </div>
        )}
        {lessons && (
          <article className="full-content-document" ref={contentRef}>
            <section className="full-content-cover">
              <h1>{courseTitle}</h1>
              <p className="full-content-hint">
                {t("full-content-lessons-count", { count: lessons.length })}
              </p>
              <p className="full-content-license">
                {t("full-content-license-notice", learner)}
              </p>
            </section>

            <nav className="full-content-toc">
              <h2>{t("full-content-table-of-contents")}</h2>
              <ul>
                {lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <a
                      href={`#${lessonAnchor(lesson.slug)}`}
                      onClick={(e) => scrollToLesson(e, lesson.slug)}
                    >
                      {lesson.heading || lesson.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {lessons.map((lesson) => (
              <section
                key={lesson.slug}
                id={lessonAnchor(lesson.slug)}
                className="full-content-lesson lesson-content"
              >
                {/* The README h1 is the lesson title; the sidebar one is only a fallback */}
                {!lesson.heading && <h1>{lesson.title}</h1>}
                {lesson.error ? (
                  <p className="full-content-hint">
                    {t("full-content-lesson-error")}
                  </p>
                ) : (
                  <StaticMarkdown markdown={lesson.body} />
                )}
                {lesson.video && (
                  <p>
                    {t("full-content-video")}:{" "}
                    <a
                      className="link"
                      href={lesson.video}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lesson.video}
                    </a>
                  </p>
                )}
              </section>
            ))}
          </article>
        )}
      </div>
    </div>
  );
};
