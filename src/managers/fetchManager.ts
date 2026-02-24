import {
  BREATHECODE_HOST,
  getExercise,
  getParamsObject,
  MissingRigobotAccountError,
  RIGOBOT_HOST,
  setQueryParams,
  TokenExpiredError,
  getSlugFromPath,
  DEV_MODE,
  getReadmeExtension,
  ENVIRONMENT,
} from "../utils/lib";
import { TEnvironment } from "./EventProxy";
import frontMatter from "front-matter";
import { LocalStorage } from "./localStorage";
import TelemetryManager from "./telemetry";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { TSidebar } from "../utils/storeTypes";
import { fixLang } from "../components/sections/header/LanguageButton";
import useStore from "../utils/store";
// import axios from "axios";

// Correct the type definition for TMethods
type TMethods = {
  localStorage: () => Promise<any>;
  localhost: () => Promise<any>;
  creatorWeb: () => Promise<any>;
  scorm: () => Promise<any>;
};

export const FetchManager = {
  ENVIRONMENT: "",
  HOST: "",
  LOGOUT_CALLBACK: () => { },
  init: (
    environment: TEnvironment,
    host: string,
    logoutCallback: () => void
  ) => {
    FetchManager.ENVIRONMENT = environment;
    FetchManager.HOST = host;
    if (typeof logoutCallback === "function") {
      FetchManager.LOGOUT_CALLBACK = logoutCallback;
    }
  },
  getExercises: async (rigoToken: string) => {
    const methods: TMethods = {
      localhost: async () => {
        const url = `${FetchManager.HOST}/config`;
        const response = await fetch(url);
        const config = await response.json();
        return config;
      },
      localStorage: async () => {
        const url = "/config.json";
        const response = await fetch(url);
        const config = await response.json();
        return config;
      },
      creatorWeb: async () => {
        let url = `${FetchManager.HOST}/config`;
        const slug = getSlugFromPath();

        if (slug) {
          url = `${url}?slug=${slug}`;
        }

        const response = await fetch(url, {
          headers: {
            "x-rigo-token": rigoToken,
          },
        });
        const config = await response.json();
        return config;
      },
      scorm: async () => {
        const url = `${FetchManager.HOST}/.learn/config.json`;
        const response = await fetch(url);
        const config = await response.json();
        return config;
      },
    };

    const config = await methods[FetchManager.ENVIRONMENT as keyof TMethods]();
    return config;
  },

  getReadme: async (slug: string, language: string) => {
    const fixedLanguage = fixLang(language, FetchManager.ENVIRONMENT);
    const exerciseSlug = getSlugFromPath();
  
    const methods: TMethods = {
      localhost: async () => {
        const url = `${FetchManager.HOST}/exercise/${slug}/readme?lang=${fixedLanguage}${exerciseSlug ? `&slug=${exerciseSlug}` : ""}`;
        const response = await fetch(url);
        const json = await response.json();
        return json;
      },
      creatorWeb: async () => {
        const url = `${FetchManager.HOST}/exercise/${slug}/readme?lang=${fixedLanguage}${exerciseSlug ? `&slug=${exerciseSlug}` : ""}`;
        const response = await fetch(url);
        const json = await response.json();
        return json;
      },
      localStorage: async () => {
        const url = `/exercises/${slug}/README${getReadmeExtension(fixedLanguage)}`;
        const response = await fetch(url);
        const mdContent = await response.text();
        const matter = frontMatter(mdContent);
        return matter;
      },
      scorm: async () => {
        const url = `${FetchManager.HOST}/exercises/${slug}/README${getReadmeExtension(fixedLanguage)}`;
        console.log("URL in SCORM", url);
        const response = await fetch(url);
        const mdContent = await response.text();
        const matter = frontMatter(mdContent);
        return matter;
      },
    };
  
    return await methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  
  getFileContent: async (
    slug: string,
    file: string,
    opts: { cached: boolean } = { cached: false }
  ) => {
    const methods: TMethods = {
      localhost: async () => {
        const url = `${FetchManager.HOST}/exercise/${slug}/file/${file}`;
        const response = await fetch(url);
        const fileContent = await response.text();
        return { fileContent, edited: false };
      },

      localStorage: async () => {
        let edited = false;
        const url = `/exercises/${slug}/${file}`;
        const response = await fetch(url);
        const fileContent = await response.text();

        if (opts.cached) {
          const cachedEditorTabs = LocalStorage.get(`editorTabs_${slug}`);
          if (cachedEditorTabs) {
            const cached = cachedEditorTabs.find((t: any) => t.name === file);
            if (cached) {
              edited = true;
              return { fileContent: cached.content, edited };
            }
          }
        }

        return { fileContent, edited };
      },

      scorm: async () => {
        const url = `${FetchManager.HOST}/exercises/${slug}/${file}`;
        const response = await fetch(url);
        const fileContent = await response.text();
        return { fileContent, edited: false };
      },

      creatorWeb: async () => {
        const mode = useStore.getState().mode;

        // In student mode, prefer localStorage when cached so the student doesn't lose progress on reload
        if (mode !== "creator" && opts.cached) {
          const cachedEditorTabs = LocalStorage.get(`editorTabs_${slug}`);
          if (cachedEditorTabs) {
            const cached = cachedEditorTabs.find((t: any) => t.name === file);
            if (cached) {
              return { fileContent: cached.content, edited: true };
            }
          }
        }

        const exerciseSlug = getSlugFromPath();
        const url = `${FetchManager.HOST}/courses/${exerciseSlug}/exercises/${slug}/file/${file}`;
        const response = await fetch(url);

        if (!response.ok) {
          return { fileContent: "", edited: false, notFound: true };
        }

        const fileContent = await response.text();
        return { fileContent, edited: false };
      },
    };

    return await methods[FetchManager.ENVIRONMENT as keyof typeof methods]();
  },

  getExerciseInfo: async (slug: string) => {
    const methods: TMethods = {
      localhost: async () => {
        const respose = await getExercise(slug);
        const exercise = await respose.json();
        console.log("EXERCISE FROM LOCALHOST", exercise);
        return exercise;
      },
      localStorage: async () => {
        const respose = await fetch("/config.json");
        const config = await respose.json();
        const exercise = config.exercises.find((e: any) => e.slug === slug);
        return exercise;
      },
      scorm: async () => {
        const respose = await fetch(`${FetchManager.HOST}/.learn/config.json`);
        const config = await respose.json();
        const exercise = config.exercises.find((e: any) => e.slug === slug);
        return exercise;
      },
      creatorWeb: async () => {
        try {
          const exerciseSlug = getSlugFromPath();
          const respose = await fetch(
            `${DEV_MODE ? "http://localhost:3000" : ""
            }/courses/${exerciseSlug}/exercises/${slug}/`
          );
          const exercise = await respose.json();
          return exercise;
        } catch (e) {
          console.log("Error fetching exercise info in creatorWeb");
          console.log(e);
          return null;
        }
      },
    };

    return await methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  saveFileContent: async (slug: string, filename: string, content: string) => {
    const methods: TMethods = {
      localhost: async () => {
        try {
          const url = `${FetchManager.HOST}/exercise/${slug}/file/${filename}`;
          await fetch(url, {
            method: "PUT",
            body: JSON.stringify({ content: content ?? "" }),
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          console.log("Error saving file content in CLI");
          console.log(e);
        }
      },
      localStorage: async () => {
        console.log("SAVING FILE IN LS: NOT IMPLEMENTED");
      },
      scorm: async () => {
        console.log("SAVING FILE IN SCORM: NOT ALLOWED");
      },
      creatorWeb: async () => {
        const exerciseSlug = getSlugFromPath();
        const url = `${FetchManager.HOST}/exercise/${slug}/file/${filename}?slug=${exerciseSlug}`;
        const res = await fetch(url, {
          method: "PUT",
          body: JSON.stringify({ content: content ?? "" }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          return false;
        }
        return true;
      },
    };

    return await methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  createFile: async (slug: string, filename: string, content: string = "") => {
    const methods: TMethods = {
      localhost: async () => {
        try {
          const url = `${FetchManager.HOST}/exercise/${slug}/file/${filename}`;
          await fetch(url, {
            method: "PUT",
            body: JSON.stringify({ content: content ?? "" }),
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          console.log("Error creating file in CLI");
          console.log(e);
        }
      },
      localStorage: async () => {
        console.log("CREATING FILE IN LS: NOT IMPLEMENTED");
      },
      scorm: async () => {
        console.log("CREATING FILE IN SCORM: NOT ALLOWED");
      },
      creatorWeb: async () => {
        const courseSlug = getSlugFromPath();
        const url = `${FetchManager.HOST}/exercise/${slug}/file/${filename}?slug=${courseSlug}`;
        const res = await fetch(url, {
          method: "PUT",
          body: JSON.stringify({ content: content ?? "" }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          return false;
        }
        return true;
      },
    };

    return await methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  getTelemetryStep: async (stepPosition: number) => {
    return TelemetryManager.getStep(stepPosition);
  },

  checkLoggedStatus: async () => {
    const methods: TMethods = {
      localStorage: async () => {
        const session = LocalStorage.get("session");
        if (!session) {
          console.log("No session in LS");

          throw Error("The user is not logged in");
        }

        const user = await validateUser(session.token);

        if (!user) {
          LocalStorage.remove("session");
          throw Error("The token is invalid or inactive!");
        }

        const isValid = await validateRigobotToken(session.rigobot.key);

        if (!isValid) {
          LocalStorage.remove("session");
          throw Error("The token is invalid or inactive!");
        }

        const loggedFormat = {
          payload: { ...session },
          rigoToken: session.rigobot.key,
          user,
        };
        return loggedFormat;
      },
      localhost: async () => {
        const res = await fetch(`${FetchManager.HOST}/check/rigo/status`);
        if (res.status === 400) {
          throw Error("The user is not logged in");
        }
        const json = await res.json();

        const user = await validateUser(json.payload.token);
        if (user === null) {
          FetchManager.logout();
          throw Error("The user session is expired!");
        }
        return { ...json, user };
      },
      scorm: async () => {
        const session = LocalStorage.get("session");
        if (!session) {
          console.log("No session in LS");

          throw Error("The user is not logged in");
        }

        const user = await validateUser(session.token);

        if (!user) {
          LocalStorage.remove("session");
          throw Error("The token is invalid or inactive!");
        }

        const isValid = await validateRigobotToken(session.rigobot.key);

        if (!isValid) {
          LocalStorage.remove("session");
          throw Error("The token is invalid or inactive!");
        }

        const loggedFormat = {
          payload: { ...session },
          rigoToken: session.rigobot.key,
          user,
        };
        return loggedFormat;
      },
      creatorWeb: async () => {
        const session = LocalStorage.get("session");
        if (!session) {
          console.log("No session in LS");

          throw Error("The user is not logged in");
        }

        const user = await validateUser(session.token);

        if (!user) {
          LocalStorage.remove("session");
          console.log("No user in session");

          throw Error("The token is invalid or inactive!");
        }

        const isValid = await validateRigobotToken(session.rigobot.key);

        if (!isValid) {
          LocalStorage.remove("session");
          throw Error("The token is invalid or inactive!");
        }

        const loggedFormat = {
          payload: { ...session },
          rigoToken: session.rigobot.key,
          user,
        };
        return loggedFormat;
      },
    };

    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  getSyllabus: async () => {
    const methods: TMethods = {
      localhost: async () => {
        return null;
      },
      scorm: async () => {
        console.log("GETTING SYLLABUS IN SCORM: NOT IMPLEMENTED");
        const respose = await fetch(`${FetchManager.HOST}/.learn/syllabus.json`);
        const syllabus = await respose.json();
        return syllabus;
      },
      localStorage: async () => {
        // const respose = await fetch("/syllabus.json");
        // const syllabus = await respose.json();
        // return syllabus;
        return null;
      },
      creatorWeb: async () => {
        try {
          const courseSlug = getSlugFromPath();
          const respose = await fetch(
            `${FetchManager.HOST}/courses/${courseSlug}/syllabus`
          );
          const syllabus = await respose.json();
          return syllabus;
        } catch (e) {
          console.log("Error fetching syllabus in creatorWeb");
          console.log(e);
          return null;
        }
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  setTabHash: async (tabHash: string) => {
    const methods: TMethods = {
      localhost: async () => {
        const body = {
          hash: tabHash,
        };

        const res = await fetch(`${FetchManager.HOST}/set-tab-hash`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (res.status === 400) {
          console.log("ERROR");
          console.log(res);
          throw Error("Impossible to set tab hash");
        }
        await res.json();
        return true;
      },
      scorm: async () => {
        console.log("SETTING TAB HASH IN SCORM: NOT IMPLEMENTED");
        return true;
      },
      localStorage: async () => {
        LocalStorage.set("TAB_HASH", tabHash);
        return true;
      },
      creatorWeb: async () => {
        LocalStorage.set("TAB_HASH", tabHash);
        return true;
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  getTabHash: async () => {
    const tabHash = createTabHashFromURL();
    return tabHash;
  },
  getSessionKey: async () => {
    const methods: TMethods = {
      localhost: async () => {
        const res = await fetch(`${FetchManager.HOST}/check/rigo/status`);
        if (res.status === 400) {
          throw Error("The user is not logged in");
        }
        const json = await res.json();

        if (json && json.payload && "sessionKey" in json.payload) {
          return json.payload.sessionKey;
        } else {
          return null;
        }
      },
      scorm: async () => {
        console.log("GETTING SESSION KEY IN SCORM: NOT IMPLEMENTED");
        return null;
      },
      localStorage: async () => {
        let sessionKey = LocalStorage.get("LEARNPACK_SESSION_KEY");
        if (!sessionKey) {
          return null;
        }
        return sessionKey;
      },
      creatorWeb: async () => {
        let sessionKey = LocalStorage.get("LEARNPACK_SESSION_KEY");
        if (!sessionKey) {
          return null;
        }
        return sessionKey;
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  setSessionKey: async (sessionKey: string) => {
    const methods: TMethods = {
      localhost: async () => {
        const body = {
          sessionKey: sessionKey,
        };

        const res = await fetch(`${FetchManager.HOST}/set-session-key`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (res.status === 400) {
          console.log("ERROR");
          console.log(res);
          throw Error("Impossible to set session key");
        }
        await res.json();
        return true;
      },
      scorm: async () => {
        console.log("SETTING SESSION KEY IN SCORM: NOT IMPLEMENTED");
        return true;
      },
      localStorage: async () => {
        LocalStorage.set("LEARNPACK_SESSION_KEY", sessionKey);
      },
      creatorWeb: async () => {
        LocalStorage.set("LEARNPACK_SESSION_KEY", sessionKey);
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  getSidebar: async (rigoToken: string): Promise<TSidebar> => {
    const methods: TMethods = {
      localhost: async () => {
        try {
          const res = await fetch(`${FetchManager.HOST}/sidebar`);
          const json = await res.json();
          return json;
        } catch (e) {
          console.error(e, "error getting sidebar");
          return {};
        }
      },
      scorm: async () => {
        const respose = await fetch(`${FetchManager.HOST}/.learn/sidebar.json`);
        const sidebar = await respose.json();
        return sidebar;
      },
      localStorage: async () => {
        try {
          const sidebar = await fetch(`/sidebar.json`);
          const json = await sidebar.json();
          return json;
        } catch (e) {
          console.error(e, "error getting sidebar");
          return {};
        }
      },
      creatorWeb: async () => {
        try {
          const exerciseSlug = getSlugFromPath();
          const headers = {
            "Content-Type": "application/json",
            "x-rigo-token": rigoToken,
          };
          const sidebar = await fetch(
            `${FetchManager.HOST}/translations/sidebar?slug=${exerciseSlug}`,
            {
              headers,
            }
          );
          const json = await sidebar.json();
          return json;
        } catch (e) {
          console.error(e, "error getting sidebar");
          return {};
        }
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  login: async (loginInfo: any) => {
    const methods: TMethods = {
      localhost: async () => {
        return await loginLocalhost(loginInfo, FetchManager.HOST);
      },
      scorm: async () => {
        return await loginLocalStorage(loginInfo);
      },
      localStorage: async () => {
        return await loginLocalStorage(loginInfo);
      },
      creatorWeb: async () => {
        return await loginLocalStorage(loginInfo);
      },
    };

    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  loginWithToken: async (breathecodeToken: string) => {
    const user = await validateUser(breathecodeToken);

    if (!user) {
      throw Error("Unable to login with provided credentials");
    }

    const rigoJson = await getRigobotJSON(breathecodeToken);

    const returns = {
      ...user,
      rigobot: { ...rigoJson },
      token: breathecodeToken,
    };

    const tabHash = await FetchManager.getTabHash();
    const loggedFormat = {
      payload: { ...returns },
      rigoToken: returns.rigobot.key,
      user,
      tabHash,
      rigobot: { ...returns.rigobot },
      user_id: returns.id,
    };

    if (FetchManager.ENVIRONMENT === "localhost") {
      await setSessionInCLI({
        ...loggedFormat.payload,
        token: breathecodeToken,
        tabHash: tabHash,
      });
    } else if (
      FetchManager.ENVIRONMENT === "localStorage" ||
      FetchManager.ENVIRONMENT === "creatorWeb"
    ) {
      LocalStorage.set("session", {
        token: breathecodeToken,
        user_id: loggedFormat.user_id,
        rigobot: { ...loggedFormat.rigobot },
        user: { ...loggedFormat.user },
      });
    }

    return loggedFormat;
  },

  replaceReadme: async (
    slug: string,
    language: string,
    newReadme: string,
    skipSyncNotification?: boolean,
    versionId?: string,
    contentToSaveInHistory?: string
  ): Promise<{ success: boolean; status?: number; version?: string } | false> => {
    const methods: TMethods = {
      localhost: async () => {
        const url = `${FetchManager.HOST
          }/exercise/${slug}/file/README${getReadmeExtension(language)}`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (versionId) {
          headers["x-history-version"] = versionId;
        }

        // Send both the new content and the content to save in history
        const body = JSON.stringify({
          content: newReadme,
          historyContent: contentToSaveInHistory,
        });

        const res = await fetch(url, {
          method: "PUT",
          headers,
          body,
        });

        if (!res.ok) {
          if (res.status === 409) {
            toast.error("Version conflict. Refreshing content...");
          }
          return { success: false, status: res.status };
        }

        const result = await res.json();
        return result;
      },
      scorm: async () => {
        console.log("REPLACING README IN SCORM: NOT IMPLEMENTED");
        return false;
      },
      localStorage: async () => {
        toast.error("IMPOSSIBLE TO REPLACE README IN LS");
        // console.log("REPLACING README IN LS");
      },
      creatorWeb: async () => {
        const exerciseSlug = getSlugFromPath();
        const url = `${FetchManager.HOST
          }/exercise/${slug}/file/README${getReadmeExtension(
            language
          )}?slug=${exerciseSlug}&lang=${language}`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (versionId) {
          headers["x-history-version"] = versionId;
        }

        // Send both the new content and the content to save in history
        const body = JSON.stringify({
          content: newReadme,
          historyContent: contentToSaveInHistory,
        });

        const res = await fetch(url, {
          method: "PUT",
          headers,
          body,
        });

        if (!res.ok) {
          if (res.status === 409) {
            toast.error("Version conflict. Refreshing content...");
          }
          return { success: false, status: res.status };
        }

        const result = await res.json();

        // Create sync notification if there are other languages available
        // Skip notification if explicitly requested (e.g., when inserting/removing placeholder)
        if (!skipSyncNotification) {
          try {
            const { exercises } = useStore.getState();
            const currentExercise = exercises.find((ex) => ex.slug === slug);
            const availableLanguages = Object.keys(
              currentExercise?.translations || {}
            );

            // Only create notification if there are multiple languages
            if (availableLanguages.length > 1) {
              const { createSyncNotification } = await import(
                "../utils/syncNotifications"
              );
              await createSyncNotification({
                exerciseSlug: slug,
                sourceLanguage: language,
              });

              // Refresh notifications in the background
              const { getSyncNotifications } = useStore.getState();
              getSyncNotifications().catch((err) => {
                // Silently fail - non-critical operation
                console.error("Error refreshing sync notifications:", err);
              });
            }
          } catch (notifError) {
            // Non-critical error - README was saved successfully
            // Don't show error to user - notification creation is optional
            console.error("Error creating sync notification:", notifError);
          }
        }

        return result;
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  logout: async () => {
    const methods: TMethods = {
      localhost: async () => {
        await logoutCLI(FetchManager.HOST);
      },
      scorm: async () => {
        console.log("LOGOUT IN SCORM: NOT IMPLEMENTED");
      },
      localStorage: async () => {
        LocalStorage.remove("session");
        const params = getParamsObject();
        if (params.token) {
          delete params.token;
        }
        setQueryParams(params);

        if (typeof FetchManager.LOGOUT_CALLBACK === "function") {
          FetchManager.LOGOUT_CALLBACK();
        }
      },
      creatorWeb: async () => {
        LocalStorage.remove("session");
        const params = getParamsObject();
        if (params.token) {
          delete params.token;
        }
        setQueryParams(params);
      },
    };

    methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  translateExercises: async (
    exerciseSlugs: string[],
    languages: string,
    currentLanguage: string,
    token: string
  ) => {
    const methods: TMethods = {
      localhost: async () => {
        const url = `${FetchManager.HOST}/actions/translate`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exerciseSlugs, languages }),
        });
        const json = await res.json();
        return json;
      },
      scorm: async () => {
        console.log("TRANSLATING EXERCISES IN SCORM: NOT IMPLEMENTED");
        return null;
      },
      localStorage: async () => {
        toast.error("IMPOSSIBLE TO TRANSLATE EXERCISES IN LS");
        return null
      },
      creatorWeb: async () => {
        const exerciseSlug = getSlugFromPath();
        try {
          const url = `${FetchManager.HOST}/actions/translate?slug=${exerciseSlug}`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              exerciseSlugs,
              languages,
              currentLanguage,
              rigoToken: token,
            }),
          });
          const json = await res.json();

          return json;
        } catch (e) {
          console.error(e, "error translating exercises");
          return {};
        }
      },
    };
    
    // Use FetchManager.ENVIRONMENT, or fallback to ENVIRONMENT from lib.tsx
    const env = FetchManager.ENVIRONMENT || ENVIRONMENT;

    console.log("TRANSLATING EXERCISES in ENVIRONMENT: ", env);
    
    if (!env) {
      console.error("Environment not detected. Cannot translate exercises.");
      return null;
    }
    
    const method = methods[env as keyof TMethods];
    if (!method) {
      console.error(`No method found for environment: ${env}`);
      return null;
    }
    
    return method();
  },

  getMemoryBank: async (rigoToken: string) => {
    const methods: TMethods = {
      localhost: async () => {
        console.log("GETTING MEMORY BANK IN LOCALHOST: NOT IMPLEMENTED");
        return { content: "" };
      },
      scorm: async () => {
        console.log("GETTING MEMORY BANK IN SCORM: NOT IMPLEMENTED");
        return { content: "" };
      },
      localStorage: async () => {
        console.log("GETTING MEMORY BANK IN LOCALSTORAGE: NOT IMPLEMENTED");
        return { content: "" };
      },
      creatorWeb: async () => {
        try {
          const courseSlug = getSlugFromPath();
          const url = `${FetchManager.HOST}/memory-bank/${courseSlug}`;
          const res = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-rigo-token": rigoToken,
            },
          });
          
          if (!res.ok) {
            console.error("Error fetching memory bank:", res.statusText);
            return { content: "" };
          }
          
          const json = await res.json();
          return json;
        } catch (e) {
          console.error(e, "error getting memory bank");
          return { content: "" };
        }
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  saveMemoryBank: async (content: string, rigoToken: string) => {
    const methods: TMethods = {
      localhost: async () => {
        console.log("SAVING MEMORY BANK IN LOCALHOST: NOT IMPLEMENTED");
        return { success: false };
      },
      scorm: async () => {
        console.log("SAVING MEMORY BANK IN SCORM: NOT IMPLEMENTED");
        return { success: false };
      },
      localStorage: async () => {
        console.log("SAVING MEMORY BANK IN LOCALSTORAGE: NOT IMPLEMENTED");
        return { success: false };
      },
      creatorWeb: async () => {
        try {
          const courseSlug = getSlugFromPath();
          const url = `${FetchManager.HOST}/memory-bank/${courseSlug}`;
          const res = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-rigo-token": rigoToken,
            },
            body: JSON.stringify({ content }),
          });
          
          if (!res.ok) {
            console.error("Error saving memory bank:", res.statusText);
            return { success: false };
          }
          
          const json = await res.json();
          return { success: true, message: json.message };
        } catch (e) {
          console.error(e, "error saving memory bank");
          return { success: false };
        }
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
};

const validateUser = async (breathecodeToken: string) => {
  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${breathecodeToken}`,
    },
  };

  const res = await fetch(`${BREATHECODE_HOST}/v1/auth/user/me`, config);
  if (!res.ok) {
    return null;
  }
  const json = await res.json();

  if ("roles" in json) {
    delete json.roles;
  }
  if ("permissions" in json) {
    delete json.permissions;
  }
  if ("settings" in json) {
    delete json.settings;
  }

  return json;
};

const logoutCLI = async (host: string) => {
  const config = {
    method: "post",
    body: JSON.stringify({}),
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await fetch(host + "/logout", config);
  if (!res.ok) {
    console.log("Error trying to logout", res.statusText);
  }
};

const loginLocalhost = async (loginInfo: any, host: string) => {
  const config = {
    method: "post",
    body: JSON.stringify(loginInfo),
    headers: {
      "Content-Type": "application/json",
    },
  };
  const res = await fetch(host + "/login", config);
  const json = await res.json();

  const user = await validateUser(json.token);

  return { ...json, user };
};

const getRigobotJSON = async (breathecodeToken: string) => {
  const rigoUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${breathecodeToken}`;
  const rigoResp = await fetch(rigoUrl);
  if (!rigoResp.ok) {
    throw new MissingRigobotAccountError("Unable to obtain Rigobot token");
  }
  const rigobotJson = await rigoResp.json();
  return rigobotJson;
};

const loginLocalStorage = async (loginInfo: any) => {
  const url = `${BREATHECODE_HOST}/v1/auth/login/`;

  const res = await fetch(url, {
    body: JSON.stringify(loginInfo),
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw Error("Unable to login with provided credentials");
  }

  const json = await res.json();

  const rigoJson = await getRigobotJSON(json.token);

  const user = await validateUser(json.token);
  const returns = { ...json, rigobot: { ...rigoJson }, user };

  // PII will be automatically removed by LocalStorage.set()
  LocalStorage.set("session", returns);

  return returns;
};

const setSessionInCLI = async (payload: any) => {
  const body = {
    payload: { ...payload },
  };

  const res = await fetch(`${FetchManager.HOST}/set-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 400) {
    console.log("ERROR");
    console.log(res);
    throw Error("Impossible to set tab hash");
  }
  await res.json();
  return true;
};

export const validateRigobotToken = async (rigobotToken: string) => {
  const rigoUrl = `${RIGOBOT_HOST}/v1/auth/token/${rigobotToken}`;
  const rigoResp = await fetch(rigoUrl);
  if (!rigoResp.ok) {
    throw new TokenExpiredError("Unable to obtain Rigobot token");
  }
  return true;
};

const fnv1aHash = (str: string) => {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
};

const createTabHashFromURL = () => {
  try {
    const currentURL = window.location.href;
    const url = currentURL.split("?")[0].split("#")[0];
    const hash = fnv1aHash(url);
    console.debug(hash, "HASH");
    return hash;
  } catch (error) {
    console.error("Error generating tab hash:", error);
    return uuidv4();
  }
};
