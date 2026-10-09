import useStore from "../../../utils/store";
import { getHost } from "../../../utils/lib";
import { fetchAllLessons, TPackageLesson } from "../../../utils/packageLessons";

export type TLessonsLoad = {
  key: string;
  promise: Promise<TPackageLesson[]>;
  loaded: number;
  total: number;
  listeners: Set<() => void>;
};

// The lessons live outside the components: the sidebar unmounts every time it
// closes and the READMEs should be downloaded once per session and language.
// The lesson search and the lesson icons of the sidebar share them.
let currentLoad: TLessonsLoad | null = null;

export const getLessonsLoad = (): TLessonsLoad => {
  const { exercises, sidebar, configObject, language, mode } =
    useStore.getState();
  const key = `${language}:${exercises.map((ex) => ex.slug).join(",")}`;

  // Creators edit the lessons, so they get a fresh copy each time they search
  // again (a load in progress is still reused)
  const isLoading =
    currentLoad !== null && currentLoad.loaded < currentLoad.total;
  if (currentLoad?.key === key && (mode !== "creator" || isLoading)) {
    return currentLoad;
  }

  const load: TLessonsLoad = {
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
  });
  // A failed load is not cached, so the next request tries again
  load.promise.catch(() => {
    if (currentLoad === load) currentLoad = null;
  });

  currentLoad = load;
  return load;
};
