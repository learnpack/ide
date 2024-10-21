// @ts-nocheck
import io from "socket.io-client";
// TODOs: add dialog event ,
const messages = {
  us: {
    testing: "Testing your code...",
    initializing: "Setting up the coding environment",
    compiling: "Building your code...",
    pending: "Working...",
    connecting: "Connecting...",
    saving: "Saving Files...",
    ready: "Ready...",
    compilerError: "Compiler error.",
    compilerWarning: "Compiled with warnings",
    compilerSuccess: "Compiled successfully!",
    testingError: "Check the terminal for more detailed info.",
    testingSuccess: "Everything as expected.",
    internalError: "Woops! There has been an internal error",
    prettifying: "Making code prettier",
    prettifySuccess: "Look how beautiful your code is now",
    completed: "Excellent!",
    prettifyError: "Warning! Unable to prettify and save",
    openWindow: "Opening window...",
    dialog: "Dialog Received",
    goodMessages: [
      "Yeah!",
      "Wuju!",
      "OMG!",
      "YUUUUPPPIII!",
      "Congrats!",
      "Way to go!",
      "I'm soooo happy!",
      "Nice!",
      "I'm sooo happy for you",
      "For now...",
      "Maybe you are smart?",
      "Coding is your thing",
      "You are good at this",
    ],
    badMessages: [
      "Not as expected, don't panic!",
      "Not as expected, keep trying!",
      "You'll get it the next time!",
      "Never give up!",
      "No pain no gain.",
      "Not correct my friend.",
      "Focus on the force inside you.",
    ],
  },
  es: {
    testing: "Testeando tu código...",
    initializing: "Configurando el entorno de codificación",
    compiling: "Construyendo tu código...",
    pending: "Trabajando...",
    connecting: "Conectando...",
    saving: "Guardando archivos...",
    ready: "Listo...",
    compilerError: "Error de compilación.",
    compilerWarning: "Compilado con advertencias",
    compilerSuccess: "¡Compilado con éxito!",
    testingError: "Consulta la terminal para más información detallada.",
    testingSuccess: "Todo como se esperaba.",
    internalError: "¡Ups! Ha habido un error interno",
    prettifying: "Haciendo el código más bonito",
    prettifySuccess: "Mira qué bonito está tu código ahora",
    completed: "¡Excelente!",
    prettifyError: "¡Advertencia! No se pudo embellecer y guardar",
    openWindow: "Abriendo ventana...",
    dialog: "Diálogo recibido",
    goodMessages: [
      "¡Sí!",
      "¡Wuju!",
      "¡OMG!",
      "¡YUUUUPPPIII!",
      "¡Felicidades!",
      "¡Bien hecho!",
      "¡Estoy tan feliz!",
      "¡Genial!",
      "¡Estoy tan feliz por ti",
      "Por ahora...",
      "¿Tal vez eres inteligente?",
      "Codificar es lo tuyo",
      "Eres bueno en esto",
    ],
    badMessages: [
      "No como se esperaba, ¡no entres en pánico!",
      "No como se esperaba, ¡sigue intentando!",
      "¡Lo conseguirás la próxima vez!",
      "¡Nunca te rindas!",
      "Sin dolor no hay ganancia.",
      "No es correcto, amigo.",
      "Concéntrate en la fuerza dentro de ti.",
    ],
  },
};

export const getStatus = function (status = "initializing", language = "us") {
  const goodIcons = ["🤩", "🙂", "😃", "😎", "🤓", "😍", "🤗", "👌🏽", "✅"];
  const badIcons = [
    "🤮",
    "🤢",
    "🤐",
    "🤬",
    "😡",
    "😵",
    "🤷🏽‍♂️",
    "🤷🏻‍♀️",
    "😬",
    "😭",
    "😤",
    "🤭",
    "🤒",
    "💩",
    "🧟‍♂️",
  ];

  const getGoodIcon = () =>
    goodIcons[Math.floor(Math.random() * goodIcons.length)];
  const getBadIcon = () =>
    badIcons[Math.floor(Math.random() * badIcons.length)];

  const good = (lang = "us") => {
    const goodMessages = messages[lang].goodMessages;
    return `${getGoodIcon()} ${
      goodMessages[Math.floor(Math.random() * goodMessages.length)]
    }`;
  };
  const bad = (lang = "us") => {
    const badMessage = messages[lang].badMessages;
    return `${badMessage[Math.floor(Math.random() * badMessage.length)]}`;
  };

  switch (status) {
    case "initializing":
      return ["🚀", messages[language].initializing];
    case "compiling":
      return ["💼", messages[language].compiling];
    case "testing":
      return ["👀", messages[language].testing];
    case "pending":
      return ["👩‍💻", messages[language].pending];
    case "connecting":
      return ["📳", messages[language].connecting];
    case "saving":
      return ["💾", messages[language].saving];
    case "ready":
      return ["🐶", messages[language].ready];
    case "compiler-error":
      return [getBadIcon(), messages[language].compilerError];
    case "compiler-warning":
      return ["⚠️", messages[language].compilerWarning];
    case "compiler-success":
      return [getGoodIcon(), messages[language].compilerSuccess];
    case "testing-error":
      return [
        getBadIcon(),
        `${bad(language)} ${messages[language].testingError}`,
      ];
    case "testing-success":
      return [getGoodIcon(), messages[language].testingSuccess];
    case "internal-error":
      return ["🔥💻", messages[language].internalError];
    case "prettifying":
      return ["✨", messages[language].prettifying];
    case "prettify-success":
      return ["🌟", messages[language].prettifySuccess];
    case "completed":
      return ["🎉", messages[language].completed];
    case "prettify-error":
      return ["⚠️", messages[language].prettifyError];
    case "open_window":
      return ["👀", messages[language].openWindow];
    case "dialog":
      return ["💬", messages[language].dialog];
    default:
      throw new Error("Invalid status: " + status);
  }
};

export const isPending = (status: any) =>
  status
    ? [
        "initializing",
        "compiling",
        "testing",
        "pending",
        "conecting",
        "internal-error",
      ].indexOf(status.code || status) > 0
    : true;

const actions = [
  "build",
  "prettify",
  "test",
  "run",
  "input",
  "open",
  "preview",
  "reset",
  "reload",
  "open_window",
  "generate",
  "ai_interaction",
  "open_terminal",
];

const scopes = {}; // Add this line to store created scopes

export default {
  socket: null,
  start: function (host, onDisconnect: any = null, onConnect: any = null) {
    this.socket = io.connect(host, {
      reconnectionAttempts: 5,
    });

    if (this.socket) {
      this.socket.on("connect", () => onConnect && onConnect());
      console.log("Connected to host " + host);
      this.socket.on("disconnect", () => onDisconnect && onDisconnect());
    } else {
      console.error(`Failed to connect to host: ${host}`);
    }
  },
  createScope: function (scopeName) {
    if (scopes[scopeName]) {
      return scopes[scopeName]; // Return existing scope if already created
    }

    const scope = {
      socket: this.socket,
      name: scopeName,
      previewWindow: null,
      actionCallBacks: {
        clean: function (data, s) {
          s.logs = [];
        },
      },
      statusCallBacks: {},
      updatedCallback: null,
      status: {
        code: "connecting",
        message: getStatus("connecting"),
      },
      logs: [],
      on: function (action, callBack) {
        this.actionCallBacks[action] = callBack;
      },
      onStatus: function (status, callBack) {
        this.statusCallBacks[status] = callBack;
      },
      openWindow: function (data) {
        this.emit("open_window", data);
      },
      emit: function (action, data) {
        if (actions.indexOf(action) < 0)
          throw new Error(
            'Invalid action "' + action + '" for socket connection'
          );
        else this.socket.emit(this.name, { action, data });
      },
      whenUpdated: function (callBack) {
        this.updatedCallback = callBack;
      },
    };

    this.socket.on(scopeName, (data) => {

      if (data.logs) {
        scope.logs = scope.logs.concat(data.logs);
      }

      if (data.status) {
        scope.status = {
          code: data.status,
          message: data.data
            ? data.data.message || getStatus(data.status)
            : getStatus(data.status),
          gif: data.data ? data.data.gif : null,
          video: data.data ? data.data.video : null,
        };
      }
      if (typeof scope.actionCallBacks[data.action] === "function") {
        scope.actionCallBacks[data.action](data, scope);
      }
      if (typeof scope.statusCallBacks[data.status] === "function")
        scope.statusCallBacks[data.status](data, scope);
      if (scope.updatedCallback) scope.updatedCallback(scope, data);
    });

    scopes[scopeName] = scope; // Store the created scope
    return scope;
  },
};
