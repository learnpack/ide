import toast from "react-hot-toast";
import { compileHTML, compileReactHTML } from "../utils/compileHTML";
import {
  disconnected,
  getHost,
  onConnectCli,
  RIGOBOT_HOST,
} from "../utils/lib";
import { FetchManager } from "./fetchManager";
import { LocalStorage } from "./localStorage";
import Socket from "./socket";

export type TEnvironment = "localhost" | "localStorage";

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

// function extractAndParseResult(xmlString: string): any {
//   const resultTagStart = "<result>";
//   const resultTagEnd = "</result>";

//   const startIndex = xmlString.indexOf(resultTagStart) + resultTagStart.length;
//   const endIndex = xmlString.indexOf(resultTagEnd);

//   if (startIndex === -1 || endIndex === -1) {
//     throw new Error("Result tags not found in the provided string.");
//   }

//   const resultString = xmlString.substring(startIndex, endIndex).trim();

//   try {
//     return JSON.parse(resultString);
//   } catch (error) {
//     throw new Error("Failed to parse JSON from the result string.");
//   }
// }

let HOST = getHost();

function removeTripleBackticks(input: string): string {
  if (input.startsWith("```json") && input.endsWith("```")) {
    return input.slice(7, -3);
  }
  return input;
}

const localStorageEventEmitter = {
  events: {} as Record<string, EventCallback[]>,
  statusEvents: {} as Record<string, EventCallback>,

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

      const contentToAdd = `
      \`\`\`FILE NAME: ${tab.name}
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
      };
      data.updateEditorTabs(outputTab);
      localStorageEventEmitter.emitStatus("compiler-success", {
        htmlString: compiled,
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
      };
      data.updateEditorTabs(outputTab);
      localStorageEventEmitter.emitStatus("compiler-success", {
        htmlString: compiled,
      });
      return;
    }

    const inputs = {
      code: content,
      inputs: JSON.stringify(inputsObject),
    };
    const dataRigobotReturns = await buildRigo(data.token, inputs);

    const json = JSON.parse(removeTripleBackticks(dataRigobotReturns));

    if (json.exitCode > 0) {
      localStorageEventEmitter.emitStatus("compiler-error", json);
    } else {
      localStorageEventEmitter.emitStatus("compiler-success", json);
    }
    let logs = [json];

    if (logs !== null) {
      let terminalContent = "";
      logs.forEach((log: any) => {
        terminalContent += log.stdout + "\n";
        terminalContent += log.stderr + "\n\n";
        if (log.testResults) {
          terminalContent += log.testResults + "\n\n";
        }
      });

      const terminalTab = {
        id: "terminal",
        content: terminalContent,
        name: "terminal",
        isActive: false,
        from: "build",
      };
      data.updateEditorTabs(terminalTab);
    }
  } catch (e) {
    console.table({
      "Something unexpected happened in the build event": e,
    });
    await FetchManager.logout();
  }
});

localStorageEventEmitter.on("reset", async (data) => {
  LocalStorage.remove(`editorTabs_${data.exerciseSlug}`);
  data.updateEditorTabs();
});

localStorageEventEmitter.on("open", async (data) => {
  const { fileContent } = await FetchManager.getFileContent(
    data.exerciseSlug,
    data.solutionFileName
  );
  const solutionTab = {
    id: generateUUID(),
    name: data.solutionFileName,
    content: fileContent,
    isActive: true,
  };

  data.updateEditorTabs(solutionTab);
});

localStorageEventEmitter.on("test", async (data) => {
  try {
    const exe = await FetchManager.getExerciseInfo(data.exerciseSlug);

    let testContent = "";
    const inputsObject: Record<string, string> = {};

    const userRequiredInputs: string[] = [];

    for (const f of exe.files) {
      if (f.name.includes("solution")) continue;

      const { fileContent } = await FetchManager.getFileContent(
        data.exerciseSlug,
        f.name,
        { cached: true }
      );

      if (f.name.includes("README")) {
        testContent += `
\`\`\`INSTRUCTIONS FILE: ${f.name}. This is what the user needs to do to pass the exercise.
${fileContent}
\`\`\`
      `;
      }

      const inputs = searchInputsForFile(f.name, fileContent);
      if (inputs) {
        userRequiredInputs.push(...inputs);
      }

      testContent += `
\`\`\`<FILE name="${f.name}" file_context="${
        !f.hidden
          ? "THIS FILE IS CODE FROM THE USER, THIS  AND THE OTHER USER FILES WILL BE TESTED BY YOU"
          : "THIS FILE IS A TEST FILE, YOU MUST MIMICK THE EXECUTION OF THIS TEST FILE AGAINST THE USER CODE"
      }">  
${fileContent}
</FILE>
\`\`\`
      `;
    }

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
      userLanguage: data.language,
    };
    console.log(inputs, "INPUTS SENT TO RIGOBOT");

    const starting_at = new Date().getTime();
    const json = await testRigo(data.token, inputs);
    json.ended_at = new Date().getTime();
    // const json = extractAndParseResult(dataRigobotReturns);
    json.source_code = JSON.stringify(inputs);
    json.starting_at = starting_at;

    let terminalContent = "";

    terminalContent += json.stdout + "\n";
    terminalContent += json.stderr + "\n\n";
    if (json.testResults) {
      terminalContent += json.testResults + "\n\n";
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
      content: terminalContent,
      name: "terminal",
      isActive: false,
      from: "test",
    };
    data.updateEditorTabs(terminalTab);

    json.stdout = terminalContent;
    if (json.exitCode === 0) {
      localStorageEventEmitter.emitStatus("testing-success", {
        result: json,
        logs: [JSON.stringify(json)],
      });
    } else {
      localStorageEventEmitter.emitStatus("testing-error", {
        ...json.stdout,
        logs: [JSON.stringify(json)],
      });
    }
  } catch (e) {
    toast.error("ERROR TRYING TO TEST");
    return;
    await FetchManager.logout();
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
    };
    return emitters[environment]();
  },
};

const buildRigo = async (token: string, inputs: object) => {
  const result = await fetch(`${RIGOBOT_HOST}/v1/prompting/completion/57/`, {
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
  const json = await result.json();
  //   console.log(json);

  return json.answer;
};
const testRigo = async (token: string, inputs: object) => {
  const result = await fetch(`${RIGOBOT_HOST}/v1/prompting/completion/93/`, {
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
  const json = await result.json();

  console.log(json, "Test completed successfully");

  return json.parsed;
};
