import {
  BREATHECODE_HOST,
  getExercise,
  getParamsObject,
  MissingRigobotAccountError,
  RIGOBOT_HOST,
  setWindowHash,
} from "../utils/lib";
import { TEnvironment } from "./EventProxy";
import frontMatter from "front-matter";
import { LocalStorage } from "./localStorage";
import { v4 as uuidv4 } from "uuid";

// Correct the type definition for TMethods
type TMethods = {
  localStorage: () => Promise<any>;
  localhost: () => Promise<any>;
};

export const FetchManager = {
  ENVIRONMENT: "",
  HOST: "",
  init: (environment: TEnvironment, host: string) => {
    FetchManager.ENVIRONMENT = environment;
    FetchManager.HOST = host;
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
    const methods: TMethods = {
      localhost: async () => {
        const res = await fetch(`${FetchManager.HOST}/check/rigo/status`);
        if (res.status === 400) {
          const tabHash = uuidv4();
          await FetchManager.setTabHash(tabHash);
          return tabHash;
        }
        const json = await res.json();

        if (json && json.payload && "tabHash" in json.payload) {
          return json.payload.tabHash;
        } else {
          const tabHash = uuidv4();
          await FetchManager.setTabHash(tabHash);
          return tabHash;
        }
      },
      localStorage: async () => {
        let tabHash = LocalStorage.get("TAB_HASH");
        if (!tabHash) {
          tabHash = uuidv4();
          await FetchManager.setTabHash(tabHash);
        }
        return tabHash;
      },
    };
    return methods[FetchManager.ENVIRONMENT as keyof TMethods]();
  },
  getSessionKey: async () => {
    const methods: TMethods = {
      localhost: async () => {
        const res = await fetch(`${FetchManager.HOST}/check/rigo/status`);
        if (res.status === 400) {
          throw Error("The user is not logged in");
        }
        const json = await res.json();

        if (json && json .payload && "sessionKey" in json.payload) {
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

    const rigoUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${breathecodeToken}`;
    const rigoResp = await fetch(rigoUrl);

    if (!rigoResp.ok) {
      throw new MissingRigobotAccountError("Unable to obtain Rigobot token");
    }

    const rigobotJson = await rigoResp.json();
    const returns = {
      ...user,
      rigobot: { ...rigobotJson },
      token: breathecodeToken,
    };

    const loggedFormat = {
      payload: { ...returns },
      rigoToken: returns.rigobot.key,
      user,
    };

    if (FetchManager.ENVIRONMENT === "localhost") {
      const tabHash = await FetchManager.getTabHash();
      await setSessionInCLI({
        ...loggedFormat.payload,
        token: breathecodeToken,
        tabHash: tabHash,
      });
    } else {
      LocalStorage.set("session", returns);
    }

    return loggedFormat;
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
        window.location.reload();
      },
    };

    methods[FetchManager.ENVIRONMENT as keyof TMethods]();
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

  const rigoUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${json.token}`;
  const rigoResp = await fetch(rigoUrl);

  const rigobotJson = await rigoResp.json();
  const user = await validateUser(json.token);
  const returns = { ...json, rigobot: { ...rigobotJson }, user };

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
