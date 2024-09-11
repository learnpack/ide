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

function extractAndParseResult(xmlString: string): any {
  const resultTagStart = "<result>";
  const resultTagEnd = "</result>";

  const startIndex = xmlString.indexOf(resultTagStart) + resultTagStart.length;
  const endIndex = xmlString.indexOf(resultTagEnd);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Result tags not found in the provided string.");
  }

  const resultString = xmlString.substring(startIndex, endIndex).trim();

  try {
    return JSON.parse(resultString);
  } catch (error) {
    throw new Error("Failed to parse JSON from the result string.");
  }
}

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
      window.open(data.url, "_blank");
    } else {
      console.error("No URL provided in data");
    }
  },
};

localStorageEventEmitter.on("build", async (data) => {
  const cachedEditorTabs =
    LocalStorage.get(`editorTabs_${data.exerciseSlug}`) || data.editorTabs;

  let content = "";

  cachedEditorTabs.forEach((tab: any) => {
    const contentToAdd = `
\`\`\`
${tab.name}
\n${tab.content}\n 
\`\`\`\ 
`;
    content += contentToAdd;
  });

  const inputs = {
    code: content,
  };
  const dataRigobotReturns = await buildRigo(data.token, inputs);

  const prevLogs = LocalStorage.get(`terminalLogs_${data.exerciseSlug}`);

  const json = JSON.parse(removeTripleBackticks(dataRigobotReturns));
  //   console.log(json);

  if (json.exitCode > 0) {
    localStorageEventEmitter.emitStatus("compiler-error", json);
  } else {
    localStorageEventEmitter.emitStatus("compiler-success", json);
  }
  let logs = prevLogs ? [...prevLogs, json] : [json];

  LocalStorage.set(`terminalLogs_${data.exerciseSlug}`, logs);

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
      isActive: true,
    };
    data.updateEditorTabs(terminalTab);
  }
});

localStorageEventEmitter.on("reset", async (data) => {
  LocalStorage.remove(`terminalLogs_${data.exerciseSlug}`);
  LocalStorage.remove(`editorTabs_${data.exerciseSlug}`);
  data.updateEditorTabs();
});

localStorageEventEmitter.on("open", async (data) => {
  const content = await FetchManager.getFileContent(
    data.exerciseSlug,
    data.solutionFileName
  );
  const solutionTab = {
    id: generateUUID(),
    name: data.solutionFileName,
    content: content,
  };

  data.updateEditorTabs(solutionTab);
});

localStorageEventEmitter.on("test", async (data) => {
  const exe = await FetchManager.getExerciseInfo(data.exerciseSlug);

  let testContent = "";
  for (const f of exe.files) {
    if (f.name.includes("solution") || f.name.includes("README")) continue;

    const fileContent = await FetchManager.getFileContent(
      data.exerciseSlug,
      f.name,
      { cached: true }
    );
    testContent += `
\`\`\`FILE: ${f.name} ${!f.hidden ? "USER CODE" : "TEST FILE"}

${fileContent}
\`\`\`
      `;
  }

  const inputs = {
    code: testContent,
  };
  const dataRigobotReturns = await testRigo(data.token, inputs);

  const json = extractAndParseResult(dataRigobotReturns);

  if (json.exitCode === 0) {
    localStorageEventEmitter.emitStatus("testing-success", {
      ...dataRigobotReturns,
      logs: [json.stdout],
    });
  } else {
    localStorageEventEmitter.emitStatus("testing-error", {
      ...dataRigobotReturns,
      logs: [json.stdout],
    });
  }
  const prevLogs = LocalStorage.get(`terminalLogs_${data.exerciseSlug}`);
  let logs = prevLogs ? [...prevLogs, json] : [json];
  LocalStorage.set(`terminalLogs_${data.exerciseSlug}`, logs);

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
      id: generateUUID(),
      content: terminalContent,
      name: "terminal",
      isActive: true,
    };
    data.updateEditorTabs(terminalTab);
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
  const result = await fetch(`${RIGOBOT_HOST}/v1/prompting/completion/58/`, {
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

// const getTemplate = async (token: string) => {
//   const request_url = `${RIGOBOT_HOST}/v1/prompting/templates/${57}`;
//   const res = await fetch(request_url, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: "Token " + token,
//     },
//   });
//   const json = await res.json();
//   return json;
// };
