import { FetchManager } from "../managers/fetchManager";
import { fillReadmePlaceholders, getLessonDisplayInfo } from "./lib";
import { TExercise, TSidebar } from "./storeTypes";

export type TFullContentLesson = {
  slug: string;
  id: string;
  /** Title from the sidebar, used when the README has no h1 */
  title: string;
  /** First h1 of the README, which is how the lesson titles itself */
  heading?: string;
  body: string;
  video?: string;
  error?: boolean;
};

type TFetchAllLessonsOptions = {
  exercises: TExercise[];
  language: string;
  sidebar: TSidebar;
  host: string;
  variables?: unknown;
  onProgress?: (loaded: number, total: number) => void;
};

// How many READMEs are requested at the same time
const CONCURRENCY = 5;
const ENGLISH = ["en", "us"];

/**
 * Returns the text of the first `# ` heading of a README, ignoring the ones
 * inside code blocks.
 */
export const getFirstHeading = (markdown: string): string | undefined => {
  let inCodeBlock = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inCodeBlock = !inCodeBlock;
    if (inCodeBlock) continue;
    const match = line.match(/^#\s+(.+?)\s*#*\s*$/);
    // Drop inline markdown marks so the title reads as plain text in the index
    if (match) return match[1].replace(/[*`]/g, "");
  }
  return undefined;
};

/**
 * Picks the language to request a lesson README in: the requested one when the
 * lesson has that translation (en and us are the same README.md), otherwise
 * English, otherwise the first translation it has. This avoids requesting a
 * README that does not exist.
 */
export const resolveLessonLanguage = (
  exercise: TExercise,
  language: string
): string => {
  const available = Object.keys(exercise.translations || {});
  if (available.length === 0) return language;

  const hasLanguage = ENGLISH.includes(language)
    ? available.some((lang) => ENGLISH.includes(lang))
    : available.includes(language);
  if (hasLanguage) return language;

  return available.find((lang) => ENGLISH.includes(lang)) || available[0];
};

const fetchLesson = async (
  exercise: TExercise,
  { language, sidebar, host, variables }: TFetchAllLessonsOptions
): Promise<TFullContentLesson> => {
  const { id, formattedTitle } = getLessonDisplayInfo(
    exercise.slug,
    sidebar,
    language,
    exercise.title
  );
  const lesson = { slug: exercise.slug, id, title: formattedTitle, body: "" };

  try {
    const readme = await FetchManager.getReadme(
      exercise.slug,
      resolveLessonLanguage(exercise, language)
    );
    if (!readme || readme.error || typeof readme.body !== "string") {
      return { ...lesson, error: true };
    }
    const attributes = readme.attributes || {};
    const body = fillReadmePlaceholders(readme.body, host, variables);
    return {
      ...lesson,
      heading: getFirstHeading(body),
      body,
      video: attributes.tutorial || attributes.intro || undefined,
    };
  } catch (error) {
    console.error(`Error loading the README of ${exercise.slug}`, error);
    return { ...lesson, error: true };
  }
};

/**
 * Loads the README of every lesson of the package, keeping the order of
 * `exercises`. A lesson that fails to load is returned with `error: true`
 * instead of failing the whole package.
 */
export const fetchAllLessons = async (
  options: TFetchAllLessonsOptions
): Promise<TFullContentLesson[]> => {
  const { exercises, onProgress } = options;
  const lessons: TFullContentLesson[] = new Array(exercises.length);
  let nextIndex = 0;
  let loaded = 0;

  const worker = async () => {
    while (nextIndex < exercises.length) {
      const index = nextIndex++;
      lessons[index] = await fetchLesson(exercises[index], options);
      loaded++;
      onProgress?.(loaded, exercises.length);
    }
  };

  const workers = Math.min(CONCURRENCY, exercises.length);
  await Promise.all(Array.from({ length: workers }, worker));
  return lessons;
};
