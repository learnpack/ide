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
  let logs = prevLogs ? prevLogs : [];
  LocalStorage.set(`terminalLogs_${data.exerciseSlug}`, [...logs, json]);

  data.updateEditorTabs();
});

localStorageEventEmitter.on("reset", async (data) => {
  LocalStorage.remove(`terminalLogs_${data.exerciseSlug}`);
  LocalStorage.remove(`editorTabs_${data.exerciseSlug}`);
  data.updateEditorTabs();
});

localStorageEventEmitter.on("test", async (data) => {
  const cachedEditorTabs = LocalStorage.get(`editorTabs_${data.exerciseSlug}`);

  const exe = await FetchManager.getExerciseInfo(data.exerciseSlug);

  let testContent = "";
  for (const f of exe.files) {
    if (f.name.includes("solution") || f.name.includes("README")) continue;

    console.log(f.name);

    const cached = cachedEditorTabs.find((t: any) => {
      console.log(t.name === f.name);
      return t.name === f.name;
    });
    if (cached) {
      testContent += `
\`\`\`FILE: ${f.name} ${!f.hidden ? "USER CODE" : "TEST FILE"}

${cached.content}
\`\`\`
      `;
      continue
    }
 
    const fileContent = await FetchManager.getFileContent(
      data.exerciseSlug,
      f.name
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
  const json = JSON.parse(removeTripleBackticks(dataRigobotReturns));

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
