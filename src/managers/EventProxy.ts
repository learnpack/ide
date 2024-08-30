import { disconnected, getHost, onConnectCli } from "../utils/lib";
import Socket from "./socket";

export type TEnvironment = "localhost" | "localStorage"

type EventCallback = (data: any) => void;

let HOST = getHost()

const localStorageEventEmitter = {
    events: {} as Record<string, EventCallback[]>,
    statusEvents: {} as Record<string, EventCallback>,

    emit: (event: string, data: any) => {
        if (localStorageEventEmitter.events[event]) {
            localStorageEventEmitter.events[event].forEach(callback => callback(data));
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

        
    }
}

localStorageEventEmitter.on("build", (data) => {
    // console.log("Calling Rigobot to build the file");
    // console.log(data, "\nRECEIVED DATA TO BUILD");
    const success = true

    const dataRigobotReturns = { message: "hello" }
    if (success) {
        localStorageEventEmitter.emitStatus("compiler-success", dataRigobotReturns);
    }
    else {
        localStorageEventEmitter.emitStatus("compiler-error", dataRigobotReturns);
    }
})

localStorageEventEmitter.on("test", (data) => {
    // console.log("Calling Rigobot to TEST the file");
    // console.log(data, "\nRECEIVED DATA TO test");
    const success = true    

    const dataRigobotReturns = { message: "hello", logs: ["Hello world"] }
    if (success) {
        localStorageEventEmitter.emitStatus("testing-success", dataRigobotReturns);
    }
    else {
        localStorageEventEmitter.emitStatus("testing-error", dataRigobotReturns);
    }
})

export const EventProxy = {
    getEmitter: (environment: TEnvironment) => {
        const emitters = {
            localhost: () => {
                Socket.start(HOST, disconnected, onConnectCli);
                return Socket.createScope("compiler")
            },
            localStorage: () => {
                return localStorageEventEmitter
            }
        }
        return emitters[environment]()
    }
}
