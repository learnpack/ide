import { eventBus } from "../managers/eventBus";
import { TPackageLesson } from "./packageLessons";
import useStore from "./store";

export type TSearchEntry = {
  position: number;
  slug: string;
  id: string;
  title: string;
  /** Plain text of the lesson, the one the snippets are cut from */
  text: string;
  /** `text` normalized with `normalizeWithMap` */
  normalized: string;
  /** Index in `text` where each char of `normalized` starts and ends */
  starts: number[];
  ends: number[];
};

export type TSearchResult = {
  position: number;
  slug: string;
  id: string;
  title: string;
  snippet: { before: string; match: string; after: string };
  /** Normalized term to highlight inside the lesson once it opens */
  term: string;
};

export const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;
// Chars of context shown around the match. The snippet is short on purpose:
// the search tells where things are, it does not show the lesson content
const SNIPPET_BEFORE = 50;
const SNIPPET_AFTER = 90;

// Code blocks rendered as interactive components: they hold answers (correct
// options, CORRECT/INCORRECT examples, the right order...) or no visible text
const HIDDEN_FENCES = new Set([
  "question",
  "fill",
  "fill_in_the_blank",
  "select",
  "select_the_blank",
  "order",
  "ordering",
  "code_challenge_proposal",
  "loader",
  "new",
  "mermaid",
]);

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lowercases and removes accents, so "función" and "funcion" match */
export const normalize = (value: string) =>
  value.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();

/**
 * Normalizes `value` keeping, for each char of the result, the range it comes
 * from in `value`. Needed to cut snippets and highlight ranges in the original
 * text from a match found in the normalized one.
 */
export const normalizeWithMap = (value: string) => {
  let normalized = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const char of value) {
    const end = offset + char.length;
    for (const normalizedChar of normalize(char)) {
      normalized += normalizedChar;
      for (let i = 0; i < normalizedChar.length; i++) {
        starts.push(offset);
        ends.push(end);
      }
    }
    offset = end;
  }
  return { normalized, starts, ends };
};

/**
 * Converts a lesson README to the plain text the search runs on. It drops the
 * markdown syntax, the HTML and the interactive components, and the quiz
 * options so a search can't reveal which one is the correct answer.
 */
export const markdownToSearchText = (markdown: string): string => {
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, " ").split(/\r?\n/);
  const output: string[] = [];
  let fence: { marker: string; hidden: boolean } | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```|~~~)\s*([\w-]*)/);
    if (fenceMatch) {
      if (!fence) {
        fence = {
          marker: fenceMatch[1],
          hidden: HIDDEN_FENCES.has(fenceMatch[2].toLowerCase()),
        };
        continue;
      }
      if (fenceMatch[1] === fence.marker) {
        fence = null;
        continue;
      }
    }

    if (fence) {
      // Regular code is searchable: students look for things like `useState`
      if (!fence.hidden) output.push(line);
      continue;
    }

    // Quiz options: "- [ ] wrong answer" / "- [x] correct answer"
    if (/^\s*[-*+]\s+\[[ xX]\]/.test(line)) continue;
    // Table separators
    if (/^[\s|:-]+$/.test(line) && line.includes("-")) continue;

    output.push(
      line
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/^\s{0,3}#{1,6}\s+/, "")
        .replace(/^\s*>\s?/, "")
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
        .replace(/\*\*|__|~~|[*`|]/g, " ")
    );
  }

  return output.join(" ").replace(/\s+/g, " ").trim();
};

export const buildSearchIndex = (lessons: TPackageLesson[]): TSearchEntry[] =>
  lessons.flatMap((lesson, position) => {
    if (lesson.error) return [];
    const title = lesson.heading || lesson.title;
    const text = markdownToSearchText(lesson.body);
    return [
      {
        position,
        slug: lesson.slug,
        id: lesson.id,
        title,
        text,
        ...normalizeWithMap(text),
      },
    ];
  });

const getTerms = (query: string) => normalize(query).split(/\s+/).filter(Boolean);

const cutSnippet = (entry: TSearchEntry, index: number, length: number) => {
  const { text, starts, ends } = entry;
  const matchStart = starts[index];
  const matchEnd = ends[index + length - 1];

  let start = Math.max(0, matchStart - SNIPPET_BEFORE);
  let end = Math.min(text.length, matchEnd + SNIPPET_AFTER);
  // Don't cut words in half
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space >= 0 && space < matchStart) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > matchEnd) end = space;
  }

  return {
    before: (start > 0 ? "…" : "") + text.slice(start, matchStart),
    match: text.slice(matchStart, matchEnd),
    after: text.slice(matchEnd, end) + (end < text.length ? "…" : ""),
  };
};

/**
 * Returns the lessons that contain every word of `query`, in the order of the
 * package, with one short snippet each. The snippet is around the whole query
 * when it appears as is, otherwise around its first word.
 */
export const searchLessons = (
  index: TSearchEntry[],
  query: string
): TSearchResult[] => {
  const terms = getTerms(query);
  const phrase = terms.join(" ");
  if (phrase.length < MIN_QUERY_LENGTH) return [];

  const results: TSearchResult[] = [];
  for (const entry of index) {
    const haystack = `${normalize(entry.title)} ${entry.normalized}`;
    if (!terms.every((term) => haystack.includes(term))) continue;

    const phraseIndex = entry.normalized.indexOf(phrase);
    const term = phraseIndex >= 0 ? phrase : terms[0];
    const termIndex =
      phraseIndex >= 0 ? phraseIndex : entry.normalized.indexOf(terms[0]);

    results.push({
      position: entry.position,
      slug: entry.slug,
      id: entry.id,
      title: entry.title,
      // Lessons that only match by title have no snippet to show
      snippet:
        termIndex >= 0
          ? cutSnippet(entry, termIndex, term.length)
          : { before: "", match: "", after: "" },
      term,
    });
    if (results.length >= MAX_RESULTS) break;
  }
  return results;
};

// --- Highlight of the match inside the opened lesson ---

const HIGHLIGHT_NAME = "lesson-search";
const LESSON_SELECTOR = ".lesson-content";
// Interactive elements are skipped so a quiz option is never highlighted
const SKIPPED_SELECTOR =
  "button, label, select, option, textarea, input, [role='button'], .quiz-container, .monaco-editor";
const POLL_INTERVAL_MS = 150;
const POLL_TIMEOUT_MS = 5000;

type THighlightApi = {
  highlights: Map<string, unknown>;
  Highlight: new (...ranges: Range[]) => unknown;
};

const getHighlightApi = (): THighlightApi | null => {
  const highlights = (CSS as unknown as { highlights?: Map<string, unknown> })
    .highlights;
  const Highlight = (window as unknown as { Highlight?: THighlightApi["Highlight"] })
    .Highlight;
  return highlights && Highlight ? { highlights, Highlight } : null;
};

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let listeningToNavigation = false;

export const clearLessonHighlight = () => {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  getHighlightApi()?.highlights.delete(HIGHLIGHT_NAME);
};

/** Finds every occurrence of the normalized `term` in the opened lesson */
const findRanges = (term: string): Range[] => {
  const container = document.querySelector(LESSON_SELECTOR);
  if (!container) return [];

  const ranges: Range[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (!node.parentElement?.closest(SKIPPED_SELECTOR)) {
      const { normalized, starts, ends } = normalizeWithMap(node.data);
      let index = normalized.indexOf(term);
      while (index >= 0) {
        const range = document.createRange();
        range.setStart(node, starts[index]);
        range.setEnd(node, ends[index + term.length - 1]);
        ranges.push(range);
        index = normalized.indexOf(term, index + term.length);
      }
    }
    node = walker.nextNode() as Text | null;
  }
  return ranges;
};

/**
 * Highlights `term` in the lesson at `position` and scrolls to its first
 * occurrence. Navigation is async (the README is fetched after the position
 * changes), so it waits until that lesson is the one rendered.
 */
export const highlightInLessonWhenReady = (position: number, term: string) => {
  clearLessonHighlight();

  if (!listeningToNavigation) {
    // A new navigation removes the highlight of the previous search. The
    // search emits its own position_change before calling this function
    eventBus.on("position_change", clearLessonHighlight);
    listeningToNavigation = true;
  }

  const initial = useStore.getState();
  const alreadyThere = Number(initial.currentExercisePosition) === position;
  const previousContent = initial.currentContent;
  const startedAt = Date.now();

  const attempt = () => {
    pendingTimer = null;
    const { currentExercisePosition, currentContent } = useStore.getState();
    const isRendered =
      Number(currentExercisePosition) === position &&
      (alreadyThere || currentContent !== previousContent);

    const ranges = isRendered ? findRanges(term) : [];
    if (ranges.length > 0) {
      const api = getHighlightApi();
      if (api) api.highlights.set(HIGHLIGHT_NAME, new api.Highlight(...ranges));
      ranges[0].startContainer.parentElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      pendingTimer = setTimeout(attempt, POLL_INTERVAL_MS);
    }
  };

  attempt();
};
