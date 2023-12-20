// @ts-nocheck
import io from 'socket.io-client'

export const getStatus = function (status = 'initializing') {
    const good = () => {
        const icons = ['🤩', '🙂', '😃', '😎', '🤓', '😍', '🤗', '👌🏽']
        const messages = ['Yeah!', 'Wuju!', 'OMG!', 'YUUUUPPPIII!', 'Congrats!', 'Way to go!', "I'm soooo happy!", "Nice!", "I'm sooo happy for you", "For now...", "Maybe you are smart?", "Coding is your thing", "You are good at this"]
        return `${icons[Math.floor(Math.random() * Math.floor(icons.length))]} ${messages[Math.floor(Math.random() * Math.floor(messages.length))]}`
    };
    const bad = () => {
        const icons = ['🤮', '🤢', '🤐', '🤬', '😡', '😵', '🤷🏽‍♂️', '🤷🏻‍♀️', '😬', '😭', '😤', '🤭', '🤒', '💩', '🧟‍♂️', '🧟‍♀️']
        const messages = ["Don't panic", "Keep trying!", "You'll get it the next time", "Keep going!", "Never give up", "No pain no gain", "Not correct my friend", "Focus on the force inside you"]
        return `${icons[Math.floor(Math.random() * Math.floor(icons.length))]} ${messages[Math.floor(Math.random() * Math.floor(messages.length))]}`
    };
    switch (status) {
        case "initializing": return "Setting up the coding environment"
        case "compiling": return "💼 Building your code..."
        case "testing": return "👀 Testing your code..."
        case "pending": return "👩‍💻 Working..."
        case "conecting": return "📳 Conecting..."
        case "saving": return "💾 Saving Files..."

        case "ready": return "🐶 Ready..."
        case "compiler-error": return `Compiler error.`
        case "compiler-warning": return "⚠️ Compiled with warnings"
        case "compiler-success": return `Compiled.`
        case "testing-error": return `Not as expected ${bad()}`
        case "testing-success": return `Everything as expected ${good()}`
        case "internal-error": return " 🔥💻 Woops! There has been an internal error"
        case "prettifying": return "Making code prettier"
        case "prettify-success": return "Look how beautiful your code is now"
        case "completed": return "Excellent!"
        case "prettify-error": return "Warning! Unable to prettify and save"
        default: throw new Error('Invalid status: ' + status)
    }
}

export const isPending = (status:any) => (status) ? (['initializing', 'compiling', 'testing', 'pending', 'conecting', 'internal-error'].indexOf(status.code || status) > 0) : true

const actions = ['build', 'prettify', 'test', 'run', 'input', 'open', 'preview', 'reset', 'reload', 'open_window', 'generate']

export default {
    socket: null,
    start: function (host, onDisconnect:any = null) {
        this.socket = io.connect(host)

        if (this.socket) {
            
            // console.log("Connected to host " + host);
            this.socket.on('disconnect', () => onDisconnect && onDisconnect())
        } else {
            console.error(`Failed to connect to host: ${host}`);
        }
    },
    createScope: function (scopeName) {
        const scope = {
            socket: this.socket,
            name: scopeName,
            previewWindow: null,
            actionCallBacks: {
                clean: function (data, s) {
                    s.logs = []
                },
            },
            statusCallBacks: {},
            updatedCallback: null,
            status: {
                code: 'conecting',
                message: getStatus('conecting')
            },
            logs: [],
            on: function (action, callBack) {
                this.actionCallBacks[action] = callBack
            },
            onStatus: function (status, callBack) {
                this.statusCallBacks[status] = callBack
            },
            openWindow: function (data) {
                this.emit('open_window', data)
            },
            emit: function (action, data) {
                if (actions.indexOf(action) < 0) throw new Error('Invalid action "' + action + '" for socket connection')
                else this.socket.emit(this.name, { action, data })
            },
            whenUpdated: function (callBack) {
                this.updatedCallback = callBack
            }
        }

        this.socket.on(scopeName, (data) => {

            if (data.logs) scope.logs = scope.logs.concat(data.logs)
            if (data.status) scope.status = {
                code: data.status,
                message: (data.data) ? data.data.message || getStatus(data.status) : getStatus(data.status),
                gif: data.data ? data.data.gif : null,
                video: data.data ? data.data.video : null
            }

            if (typeof scope.actionCallBacks[data.action] === 'function') scope.actionCallBacks[data.action](data, scope)
            if (typeof scope.statusCallBacks[data.status] === 'function') scope.statusCallBacks[data.status](data, scope)
            // if (scope.updatedCallback) console.log(scopeName + " event: ", data) | scope.updatedCallback(scope, data)
            if (scope.updatedCallback) scope.updatedCallback(scope, data)
        })

        return scope
    }
}
