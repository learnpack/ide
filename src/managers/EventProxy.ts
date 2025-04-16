import toast from "react-hot-toast";
import { compileHTML, compileReactHTML } from "../utils/compileHTML";
import {
  disconnected,
  getHost,
  onConnectCli,
  reportDataLayer,
  RIGOBOT_HOST,
} from "../utils/lib";
import { FetchManager } from "./fetchManager";
import { LocalStorage } from "./localStorage";
import Socket from "./socket";
import { RigoAI } from "../components/Rigobot/AI";

export type TEnvironment = "localhost" | "localStorage" | "creatorWeb";

type EventCallback = (data: any) => void;

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const inputByLang = {
  js: "prompt(",
  py: "input(",
  java: "Scanner(System.in).nextLine()",
  cs: "Console.ReadLine()",
  rb: "gets",
  php: "$_POST['input']",
  go: "bufio.NewReader(os.Stdin).ReadString('\\n')",
  swift: "readLine()",
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function searchInputsForFile(filename: string, fileContent: string) {
  try {
    // Get the extension of the filename
    const extension = filename.split(".").pop();
    if (!extension) return null;
    const input = inputByLang[extension as keyof typeof inputByLang];
    if (!input) return null;

    let regex;

    if (extension === "js" || extension === "py" || extension === "swift") {
      const escapedInput = escapeRegExp(input);
      regex = new RegExp(`${escapedInput}\\s*\\s*("(.*?)"|'(.*?)')`, "g");
    }

    const matches = [];
    let match;

    while ((match = regex?.exec(fileContent)) !== null) {
      if (match) {
        matches.push(match[1] || match[2]);
      }
    }

    const fixedMatches = matches.map((match) => match.replace(/['"]/g, ""));
    return fixedMatches.length > 0 ? fixedMatches : null;
  } catch (error) {
    console.error("Something went wrong:", error);
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
    const starting_at = new Date().getTime();

    if (data.submittedInputs.length > 0) {
      data.submittedInputs.forEach((input: string, index: number) => {
        inputsObject[`${userRequiredInputs[index]}`] = input;
      });
    }

    if (extensions.includes("html")) {
      const compiled = compileHTML(cachedEditorTabs);
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
      const ending_at = new Date().getTime();
      localStorageEventEmitter.emitStatus("compiler-success", {
        htmlString: compiled,
        source_code: content,
        stdout: "",
        stderr: "",
        ai_required: false,
        starting_at,
        ending_at,
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

      const ending_at = new Date().getTime();
      localStorageEventEmitter.emitStatus("compiler-success", {
        htmlString: compiled,
        source_code: content,
        stdout: compiled,
        stderr: "",
        ai_required: false,
        starting_at,
        ending_at,
      });
      return;
    }

    const inputs = {
      code: content,
      inputs: JSON.stringify(inputsObject),
    };

    // const target = document.querySelector("#learnpack-editor");
    console.log("COMPLETING WITH RIGOBOT AI");

    RigoAI.useTemplate({
      slug: "structured-build-learnpack",
      inputs,
      // target: ,
      onComplete: (success, rigoData) => {
        console.log("RIGOBOT AI COMPLETE the build", success, rigoData);

        const json = rigoData.data.parsed;
        json.ai_required = true;
        json.starting_at = starting_at;
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
          console.log("UPDATING EDITOR TABS", terminalTab);
          console.log("data", data.updateEditorTabs);

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
    const json = await testRigo(data.token, inputs);
    const ended_at = new Date().getTime();
    json.ended_at = ended_at;
    // const json = extractAndParseResult(dataRigobotReturns);
    json.source_code = JSON.stringify(inputs);
    json.starting_at = starting_at;

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

type TBuildInputs = {
  code: string;
  inputs: string;
};

export const buildRigo = (token: string, inputs: TBuildInputs) => {
  return rigoFetch(
    `${RIGOBOT_HOST}/v1/prompting/completion/324/`,
    token,
    inputs
  );
};

const testRigo = (token: string, inputs: object) => {
  return rigoFetch(
    `${RIGOBOT_HOST}/v1/prompting/completion/126/`,
    token,
    inputs
  );
};

type TCheckAnswerInputs = {
  eval: string;
  lesson_content: string;
  student_response: string;
  examples: string;
};

type TCheckAnswerOutputs = {
  exit_code: 0 | 1;
  reasoning: string;
  feedback: string;
  correct_answer: string;
  confidence: string;
};

export const checkAnswer = (token: string, inputs: TCheckAnswerInputs) => {
  return rigoFetch(
    `${RIGOBOT_HOST}/v1/prompting/completion/786/`,
    token,
    inputs
  ) as Promise<TCheckAnswerOutputs>;
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
