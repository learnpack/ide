import {
  BREATHECODE_HOST,
  getExercise,
  getParamsObject,
  MissingRigobotAccountError,
  RIGOBOT_HOST,
  setWindowHash,
  TokenExpiredError,
} from "../utils/lib";
import { TEnvironment } from "./EventProxy";
import frontMatter from "front-matter";
import { LocalStorage } from "./localStorage";
import TelemetryManager from "./telemetry";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

// Correct the type definition for TMethods
type TMethods = {
  localStorage: () => Promise<any>;
  localhost: () => Promise<any>;
};

export const FetchManager = {
  ENVIRONMENT: "",
  HOST: "",
  LOGOUT_CALLBACK: () => {},
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
  getExercises: async () => {
    const configUrl =
      FetchManager.ENVIRONMENT === "localhost" ? "config" : "config.json";
    const url =
      FetchManager.ENVIRONMENT === "localhost"
        ? `${FetchManager.HOST}/${configUrl}`
        : "/config.json";
    const res = await fetch(url);
    const config = await res.json();
    return config;
  },

  getReadme: async (slug: string, language: string) => {
    const url =
      FetchManager.ENVIRONMENT === "localhost"
        ? `${FetchManager.HOST}/exercise/${slug}/readme?lang=${language}`
        : `/exercises/${slug}/README.${language === "us" ? "" : "es."}md`;

    const response = await fetch(url);

    if (FetchManager.ENVIRONMENT === "localhost") {
      const json = await response.json();
      return json;
    }

    const mdContent = await response.text();
    const matter = frontMatter(mdContent);
    return matter;
  },

  getFileContent: async (
    slug: string,
    file: string,
    opts: { cached: boolean } = { cached: false }
  ) => {
    let edited = false;
    const url =
      FetchManager.ENVIRONMENT === "localhost"
        ? `${FetchManager.HOST}/exercise/${slug}/file/${file}`
        : `/exercises/${slug}/${file}`;

    const response = await fetch(url);

    if (FetchManager.ENVIRONMENT === "localStorage" && opts.cached) {
      const cachedEditorTabs = LocalStorage.get(`editorTabs_${slug}`);
      if (cachedEditorTabs) {
        const cached = cachedEditorTabs.find((t: any) => {
          return t.name === file;
        });

        if (cached) {
          edited = true;
          return { fileContent: cached.content, edited };
        }
      }
    }

    const fileContent = await response.text();
    return { fileContent, edited };
  },

  getExerciseInfo: async (slug: string) => {
    const methods: TMethods = {
      localhost: async () => {
        const respose = await getExercise(slug);
        const exercise = await respose.json();
        return exercise;
      },
      localStorage: async () => {
        const respose = await fetch("/config.json");
        const config = await respose.json();
        const exercise = config.exercises.find((e: any) => e.slug === slug);
        return exercise;
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
            body: content,
          });
        } catch (e) {
          console.log("Error saving file content in CLI");
          console.log(e);
        }
      },
      localStorage: async () => {
        // console.log("SAVING FILE IN LS");
      },
    };

    return await methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  getTelemetryStep: async (stepPosition: number) => {
    const methods: TMethods = {
      localStorage: async () => {
        return TelemetryManager.getStep(stepPosition);
      },
      localhost: async () => {
        const res = await fetch(
          `${FetchManager.HOST}/telemetry/step/${stepPosition}`
        );
        const json = await res.json();

        return json;
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  checkLoggedStatus: async () => {
    const methods: TMethods = {
      localStorage: async () => {
        const session = LocalStorage.get("session");
        if (!session) throw Error("The user is not logged in");

        const user = await validateUser(session.token);

        if (!user) {
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
      localStorage: async () => {
        LocalStorage.set("TAB_HASH", tabHash);
        return true;
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  getTabHash: async () => {
    // const methods: TMethods = {
    // localhost: async () => {
    //   const res = await fetch(`${FetchManager.HOST}/check/rigo/status`);
    //   if (res.status === 400) {
    //     const tabHash = createTabHashFromURL();
    //     await FetchManager.setTabHash(tabHash);
    //     return tabHash;
    //   }
    //   const json = await res.json();
    //   if (json && json.payload && "tabHash" in json.payload) {
    //     return json.payload.tabHash;
    //   } else {
    //     const tabHash = createTabHashFromURL();
    //     await FetchManager.setTabHash(tabHash);
    //     return tabHash;
    //   }
    // },
    // localStorage: async () => {
    //   let tabHash = LocalStorage.get("TAB_HASH");
    //   if (!tabHash) {
    //
    //     await FetchManager.setTabHash(tabHash);
    //   }
    //   return tabHash;
    // },
    // };
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
      localStorage: async () => {
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
      localStorage: async () => {
        LocalStorage.set("LEARNPACK_SESSION_KEY", sessionKey);
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  login: async (loginInfo: any) => {
    const methods: TMethods = {
      localhost: async () => {
        return await loginLocalhost(loginInfo, FetchManager.HOST);
      },
      localStorage: async () => {
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
    };

    if (FetchManager.ENVIRONMENT === "localhost") {
      await setSessionInCLI({
        ...loggedFormat.payload,
        token: breathecodeToken,
        tabHash: tabHash,
      });
    } else if (FetchManager.ENVIRONMENT === "localStorage") {
      LocalStorage.set("session", loggedFormat);
    }

    return loggedFormat;
  },

  replaceReadme: async (slug: string, language: string, newReadme: string) => {
    const methods: TMethods = {
      localhost: async () => {
        const url = `${FetchManager.HOST}/exercise/${slug}/file/README.${
          language === "us" ? "" : "es."
        }md`;
        const res = await fetch(url, {
          method: "PUT",
          body: newReadme,
        });
        if (!res.ok) {
          return false;
        }
        // await res.json();
        return true;
      },
      localStorage: async () => {
        toast.error("IMPOSSIBLE TO REPLACE README IN LS");
        // console.log("REPLACING README IN LS");
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  logout: async () => {
    const methods: TMethods = {
      localhost: async () => {
        await logoutCLI(FetchManager.HOST);
      },
      localStorage: async () => {
        LocalStorage.remove("session");
        const params = getParamsObject();
        if (params.token) {
          delete params.token;
        }
        setWindowHash(params);

        if (typeof FetchManager.LOGOUT_CALLBACK === "function") {
          FetchManager.LOGOUT_CALLBACK();
        }
      },
    };

    methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },

  translateExercises: async (exerciseSlugs: string[], languages: string) => {
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
      localStorage: async () => {
        toast.error("IMPOSSIBLE TO TRANSLATE EXERCISES IN LS");
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
  console.debug(breathecodeToken, "Breathecode Token in validation");

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
