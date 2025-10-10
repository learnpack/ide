import axios from "axios";
import toast from "react-hot-toast";
import { compileHTML, compileReactHTML } from "../utils/compileHTML";
import {
  DEV_URL,
  disconnected,
  getHost,
  getSlugFromPath,
  onConnectCli,
  reportDataLayer,
  RIGOBOT_HOST,
} from "../utils/lib";
import { FetchManager } from "./fetchManager";
import { LocalStorage } from "./localStorage";
import Socket from "./socket";
import { RigoAI } from "../components/Rigobot/AI";
import { DEV_MODE } from "../utils/lib";

export type TEnvironment =
  | "localhost"
  | "localStorage"
  | "creatorWeb"
  | "scorm";

type EventCallback = (data: any) => void;

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const inputByLang: Record<string, string[]> = {
  js: ["prompt(", "window.prompt("],
  py: ["input("],
  java: ["Scanner(System.in).nextLine()", "Scanner(System.in).next("],
  cs: ["Console.ReadLine(", "Console.Read("],
  rb: ["gets", "gets.chomp"],
  php: ["readline(", "fgets(STDIN", "$_POST['input']", "$_GET['input']"],
  go: ["bufio.NewReader(os.Stdin).ReadString(", "fmt.Scan("],
  swift: ["readLine("],
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function searchInputsForFile(filename: string, fileContent: string) {
  try {
    const extension = filename.split(".").pop();
    if (!extension) return null;
    const patterns = inputByLang[extension as keyof typeof inputByLang];
    if (!patterns || patterns.length === 0) return null;

    const allMatches: string[] = [];

    for (const pattern of patterns) {
      let regex;

      if (pattern.endsWith("(")) {
        const escapedPattern = escapeRegExp(pattern);
        regex = new RegExp(`${escapedPattern}\\s*("(.*?)"|'(.*?)')`, "g");
      } else if (pattern.includes("['") || pattern.includes('["')) {
        const escapedPattern = escapeRegExp(pattern.split("[")[0]);
        regex = new RegExp(`${escapedPattern}\\[['"]([^'"]+)['"]\\]`, "g");
      } else {
        continue;
      }

      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        const capturedValue = match[2] || match[3] || match[1];
        if (capturedValue) {
          allMatches.push(capturedValue);
        }
      }
    }

    const fixedMatches = allMatches.map((match) => match.replace(/['"]/g, ""));
    return fixedMatches.length > 0 ? fixedMatches : null;
  } catch (error) {
    console.error("Something went wrong searching inputs:", error);
    return null;
  }
}

let HOST = getHost();

const localStorageEventEmitter = {
  events: {} as Record<string, EventCallback[]>,
  statusEvents: {} as Record<string, EventCallback>,
  type: "localStorageEventEmitter",

  emit: (event: string, data: any) => {
    if (localStorageEventEmitter.events[event]) {
      localStorageEventEmitter.events[event].forEach((callback) =>
        callback(data)
      );
    }
  },

  emitStatus: (status: string, data: any) => {
    if (localStorageEventEmitter.statusEvents[status]) {
      localStorageEventEmitter.statusEvents[status](data);
    }
  },

  on: (event: string, callback: EventCallback) => {
    if (!localStorageEventEmitter.events[event]) {
      localStorageEventEmitter.events[event] = [];
    }
    localStorageEventEmitter.events[event].push(callback);
  },

  onStatus: (status: string, callback: EventCallback) => {
    localStorageEventEmitter.statusEvents[status] = callback;
  },
  openWindow: (data: any) => {
    if (data && data.url) {
      if (data.options.redirect) {
        window.location.href = data.url;
      } else {
        window.open(data.url, "__blank");
      }
    } else {
      console.error("No URL provided in data");
    }
  },
};

function expandRepeatTags(text: string): string {
  const repeatRegex = /<REPEAT\s+"(.*?)"\s+(\d+)\s*\/>/g;

  return text.replace(repeatRegex, (_, content: string, countStr: string) => {
    const count = parseInt(countStr, 10);
    return Array(count).fill(content).join("\n");
  });
}

localStorageEventEmitter.on("build", async (data) => {
  try {
    const cachedEditorTabs =
      LocalStorage.get(`editorTabs_${data.exerciseSlug}`) || data.editorTabs;

    let content = "";
    let extensions: string[] = [];
    const inputsObject: Record<string, string> = {};

    const userRequiredInputs: string[] = [];

    cachedEditorTabs.forEach((tab: any) => {
      extensions.push(tab.name.split(".").pop());
      const inputs = searchInputsForFile(tab.name, tab.content);

      if (inputs) {
        userRequiredInputs.push(...inputs);
      }

      if (tab.name.includes("solution")) {
        return;
      }

      const contentToAdd = `
      \`\`\`${tab.name}
      ${tab.content} 
      \`\`\`\ 
`;
      content += contentToAdd;
    });

    if (userRequiredInputs.length > 0 && data.submittedInputs.length === 0) {
      localStorageEventEmitter.emit("ask", {
        inputs: userRequiredInputs,
        nextAction: "build",
      });
      return;
    }
    const started_at = new Date().getTime();

    if (data.submittedInputs.length > 0) {
      data.submittedInputs.forEach((input: string, index: number) => {
        inputsObject[`${userRequiredInputs[index]}`] = input;
      });
    }

    if (extensions.includes("html")) {
      const compiled = compileHTML(cachedEditorTabs);
      console.debug(compiled, "COMPILED HTML");

      localStorage.setItem("htmlString", compiled);

      const outputTab = {
        id: generateUUID(),
        name: "terminal",
        content: compiled,
        isActive: false,
        isHTML: true,
        isReact: false,
        status: "ready",
      };
      data.updateEditorTabs(outputTab);
      const ended_at = new Date().getTime();
      localStorageEventEmitter.emitStatus("compiler-success", {
        htmlString: compiled,
        source_code: content,
        stdout: "",
        stderr: "",
        ai_required: false,
        started_at,
        ended_at,
      });
      return;
    }

    if (extensions.includes("jsx")) {
      const compiled = compileReactHTML(cachedEditorTabs);
      localStorage.setItem("htmlString", compiled);

      const outputTab = {
        id: generateUUID(),
        name: "terminal",
        content: compiled,
        isActive: false,
        isHTML: true,
        isReact: true,
        status: "ready",
      };
      data.updateEditorTabs(outputTab);

      const ended_at = new Date().getTime();
      localStorageEventEmitter.emitStatus("compiler-success", {
        htmlString: compiled,
        source_code: content,
        stdout: compiled,
        stderr: "",
        ai_required: false,
        started_at,
        ended_at,
      });
      return;
    }

    const inputs = {
      code: content,
      inputs: JSON.stringify(inputsObject),
    };

    console.log("COMPLETING WITH RIGOBOT AI");

    RigoAI.useTemplate({
      slug: "structured-build-learnpack",
      inputs,
      // target: ,
      onComplete: (success, rigoData) => {
        console.log("RIGOBOT AI COMPLETE the build", success, rigoData);

        const json = rigoData.data.parsed;
        json.ai_required = true;
        json.started_at = started_at;
        const ended_at = new Date().getTime();
        json.ended_at = ended_at;
        if (json.exit_code > 0) {
          localStorageEventEmitter.emitStatus("compiler-error", json);
        } else {
          localStorageEventEmitter.emitStatus("compiler-success", json);
        }

        let logs = [json];

        if (json.reasoning) {
          console.log("RIGOBOT AI REASONING:", json.reasoning);
        }

        if (logs !== null) {
          // toast.success("RIGOBOT AI SUCCESS IN THE BUILD EVENT");
          let terminalContent = ``;
          logs.forEach((log: any) => {
            terminalContent += `\`\`\`stdout\n${log.stdout}\n\`\`\`\n`;
            if (log.stderr) {
              terminalContent += `\`\`\`stderr\n${log.stderr}\n\`\`\`\n`;
            }
          });

          terminalContent = expandRepeatTags(terminalContent);
          const terminalTab = {
            id: "terminal",
            content: terminalContent,
            name: "terminal",
            isActive: false,
            from: "build",
            status: "ready",
          };

          data.updateEditorTabs(terminalTab);
        }
      },
    });
  } catch (error) {
    if (error instanceof TokenExpired) {
      console.warn("Token expired. Logging out...");

      // Handle token expiration (e.g., logout user)
      await FetchManager.logout();
    } else {
      console.table({
        "Something unexpected happened in the build event": error,
      });
      toast.error("Something unexpected happened in the build event");
      reportDataLayer({
        dataLayer: {
          event: "learnpack_unexpected_error",
          origin: "cloud_build",
          agent: "cloud",
          error: error,
        },
      });
    }
  }
});

localStorageEventEmitter.on("reset", async (data) => {
  LocalStorage.remove(`editorTabs_${data.exerciseSlug}`);
  data.updateEditorTabs();
});

const getFileNameFromPath = (path: string) => {
  const fileName = path.split("/").pop();
  if (!fileName) {
    return path;
  }
  return fileName;
};

localStorageEventEmitter.on("open", async (data) => {
  for (const file of data.files) {
    const fileName = getFileNameFromPath(file);
    const { fileContent } = await FetchManager.getFileContent(
      data.exerciseSlug,
      fileName
    );
    const solutionTab = {
      id: generateUUID(),
      name: file,
      content: fileContent,
      isActive: true,
    };
    data.updateEditorTabs(solutionTab);
  }
});

const createTestContext = async (files: any[], exerciseSlug: string) => {
  let testContent = "";
  const userRequiredInputs: string[] = [];

  for (const f of files) {
    if (
      f.name.includes("solution") ||
      f.name.includes("test") ||
      f.name.includes("pycache") ||
      f.name.includes("README")
    )
      continue;

    const { fileContent } = await FetchManager.getFileContent(
      exerciseSlug,
      f.name,
      { cached: true }
    );

    const inputs = searchInputsForFile(f.name, fileContent);
    if (inputs) {
      userRequiredInputs.push(...inputs);
    }

    testContent += `
<USERCODE file_name="${f.name}" file_context="This is the code of the user, you must test if it pass the instructions or not. ">  
${fileContent}
</USERCODE>

    `;
  }

  return { testContent, userRequiredInputs };
};

localStorageEventEmitter.on("test", async (data) => {
  try {
    const exe = await FetchManager.getExerciseInfo(data.exerciseSlug);

    const { testContent, userRequiredInputs } = await createTestContext(
      exe.files,
      data.exerciseSlug
    );
    const inputsObject: Record<string, string> = {};

    if (userRequiredInputs.length > 0 && data.submittedInputs.length === 0) {
      localStorageEventEmitter.emit("ask", {
        inputs: userRequiredInputs,
        nextAction: "test",
      });
      return;
    }

    if (data.submittedInputs.length > 0) {
      data.submittedInputs.forEach((input: string, index: number) => {
        inputsObject[`${userRequiredInputs[index]}`] = input;
      });
    }

    const inputs = {
      code: testContent,
      inputs: JSON.stringify(inputsObject),
      instructions: data.instructions,
      userLanguage: data.language,
    };
    // console.log(inputs, "INPUTS SENT TO RIGOBOT");

    const starting_at = new Date().getTime();
    RigoAI.useTemplate({
      slug: "test-instructions-learnpack",
      inputs,
      onComplete: (success, rigoData) => {
        console.log("RIGOBOT AI COMPLETE the test", success, rigoData);
        const json = rigoData.data.parsed;
        const ended_at = new Date().getTime();
        json.ended_at = ended_at;
        // const json = extractAndParseResult(dataRigobotReturns);
        json.source_code = JSON.stringify(inputs);
        json.started_at = starting_at;

        let terminalContent = "";

        terminalContent += `\`\`\`stdout\n${json.stdout}\n\`\`\`\n`;
        terminalContent += `\`\`\`stderr\n${json.stderr}\n\`\`\`\n`;
        if (json.testResults) {
          terminalContent += json.testResults;
        }
        if (json.message) {
          const separator = "# Rigo Feedback \n\n";
          terminalContent += separator + json.message + "\n\n";
        }

        if (json.reasoning) {
          console.log("AI reasoning", json.reasoning);
        }

        const terminalTab = {
          id: generateUUID(),
          content: expandRepeatTags(terminalContent),
          name: "terminal",
          isActive: false,
          from: "test",
        };
        data.updateEditorTabs(terminalTab);

        json.stdout = terminalContent;
        if (json.exitCode === 0) {
          localStorageEventEmitter.emitStatus("testing-success", {
            result: json,
            ai_required: true,
            logs: [JSON.stringify(json)],
          });
        } else {
          localStorageEventEmitter.emitStatus("testing-error", {
            result: json,
            ai_required: true,
            logs: [JSON.stringify(json)],
          });
        }
      },
    });
  } catch (error) {
    if (error instanceof TokenExpired) {
      console.warn("Token expired. Logging out...");

      // Handle token expiration (e.g., logout user)
      await FetchManager.logout();
    } else {
      console.log(error);

      return;
    }
  }
});

export const EventProxy = {
  getEmitter: (environment: TEnvironment) => {
    const emitters = {
      localhost: () => {
        Socket.start(HOST, disconnected, onConnectCli);
        return Socket.createScope("compiler");
      },
      localStorage: () => {
        return localStorageEventEmitter;
      },
      creatorWeb: () => {
        return localStorageEventEmitter;
      },
      scorm: () => {
        return localStorageEventEmitter;
      },
    };
    return emitters[environment]();
  },
};

class TokenExpired extends Error {
  constructor(message: string = "Token has expired") {
    super(message);
    this.name = "TokenExpired";
  }
}

class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "APIError";
  }
}

const rigoFetch = async (
  url: string,
  token: string,
  inputs: object,
  structured: boolean = true
) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + token,
      },
      body: JSON.stringify({
        inputs: inputs,
        include_purpose_objective: false,
        execute_async: false,
      }),
    });

    if (response.status === 401) {
      throw new TokenExpired();
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const json = await response.json();
    if (structured) {
      return json.parsed;
    }
    return json;
  } catch (error) {
    console.error("Error in API request:", error);
    throw error;
  }
};

type TSuggestExamplesInputs = {
  evaluation: string;
  lesson_content: string;
};

type TSuggestExamplesOutputs = {
  examples: string[];
  reasoning: string;
  confidence: number;
};

export const suggestExamples = (
  token: string,
  inputs: TSuggestExamplesInputs
) => {
  return rigoFetch(
    `${RIGOBOT_HOST}/v1/prompting/completion/885/`,
    token,
    inputs
  ) as Promise<TSuggestExamplesOutputs>;
};

type TFixLessonInputs = {
  lesson_content: string;
  found_errors: string;
};

export const fixLesson = async (
  token: string,
  inputs: TFixLessonInputs,
  exerciseSlug: string,
  language: string
) => {
  const randomId = Math.random().toString(36).substring(2, 15);
  const slug = getSlugFromPath();
  const webhookUrl = `${
    DEV_MODE
      ? DEV_URL
      : window.location.origin
  }/webhooks/${slug}/${exerciseSlug}/${language}/update-readme/${randomId}`;
  const res = await axios.post(
    `${RIGOBOT_HOST}/v1/prompting/completion/fix-lesson-math-and-mermaid/`,
    {
      inputs: inputs,
      include_purpose_objective: false,
      execute_async: true,
      webhook_url: webhookUrl,
    },
    {
      headers: {
        Authorization: "Token " + token,
      },
    }
  );
  return {
    notificationId: randomId,
    response: res,
  };
};
