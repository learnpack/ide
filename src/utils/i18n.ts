import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        report: "Report 🐞",
        "login-message":
          "Log in to 4Geeks to get performance statistics, access to our AI mentor, and many other benefits.",
        Run: "Run",
        theme: "Theme",
        "Run tests": "Run tests",
        "Running...": "Running...",
        "Login to use AI feedback": "Login to get help from AI Mentor",
        login: "Sign in",
        "Get help from AI": "Rigobot AI Mentor",
        "To use the AI services you must login with your 4geeks account, and you have been accepted Rigobot":
          "To use the AI services you must login with your 4geeks account, and you have been accepted Rigobot",
        Password: "Password",
        "Don't have an account? ": "Don't have an account? ",
        "Sign up here!": "Sign up here!",
        "Loading...": "Loading...",
        submit: "Sign in",
        "Review model solution": "Review model solution",
        "Model solution not available": "Model solution not available",
        Reset: "Start over",
        "not available": "not available",
        "About LearnPack": "About LearnPack",
        "Feedback plays an important role when learning technical skills. ":
          "Feedback plays an important role when learning technical skills. ",
        "Learn why": "Learn why",
        "Are you sure you want to reset the exercise? You will lose all your progress":
          "Are you sure you want to reset the exercise? You will lose all your progress",
        Cancel: "Cancel",
        "Report a bug 🪰": "Report a bug 🪰",
        "solved-tests": "Solved tests",
        "Get feedback": "Get help",
        "Try again": "Try again",
        "Current version": "Current version",
        "Rigobot AI-Tutor": "Rigobot AI-Tutor",
        "Ask me something here": "Ask me something here",
        "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.":
          "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.",
        "Hello! I'm **Rigobot**, your friendly **AI Mentor**! \n\n I can help you if you feel stuck, ask me anything about this exercise!":
          "Hello! I'm **Rigobot**, your friendly **AI Mentor**! \n\n I can help you if you feel stuck, ask me anything about this exercise!",

        "The run button": "The run button",
        "No tests available": "No tests available",
        Succeded: "Succeded",
        "Socket disconnected!": "Socket disconnected!",
        Reload: "Reload",
        "Sorry, this error can happen for certain reasons.":
          "Sorry, this error can happen for certain reasons.",
        "The basic steps to troubleshoot this error are the following:":
          "The basic steps to troubleshoot this error are the following:",
        "Step 1": "Step 1",
        "Check that Learnpack is running in your terminal.":
          "Check that Learnpack is running in your terminal.",
        "Run: ": "Run: ",
        "Step 2": "Step 2",
        "If Learnpack is running but you still see this modal, reload the window:":
          "If Learnpack is running but you still see this modal, reload the window:",
        "Use this button to compile and run your code.":
          "Use this button to compile and run your code.",
        "Sometimes you want to start over, use this button to reset the code.":
          "Sometimes you want to start over, use this button to reset the code.",
        "Options to get feedback": "Options to get feedback",
        "Whithin this dropdown you can get feedback on your code.":
          "Whithin this dropdown you can get feedback on your code.",
        skip: "Skip",
        "incremental-test-alert":
          "You must successfully complete and test this step before continuing to the next one. Carefully read the instructions and ask for feedback if you need any help.",
        "agent-mismatch-error":
          "These exercises were designed to run in a different agent",
        instructions: "Instructions",
        "read-instructions":
          "Read the instructions and fill in your code to complete the exercise.",
        "prev-session":
          "You have a session opened in another place, do you want to continue your progress here or start from scratch?",
        "continue-here": "Continue here",
        "start-again": "Start again",
        "we-got-you-covered": "We got you covered",
        "please-select-option": "Please select an option",
        code: "Code",
        output: "Output",
        "compile-first": "You must compile or test your code to see the output",
        or: "or",
        "login-github": "Login with Github",
        continue: "Continue",
        "change-theme": "Change theme",
        exercises: "Exercises",

        "you-must-login-title": "Oops! Looks like you're not logged in.",
        "you-must-login-message":
          "To compile code on the web and use our AI mentor Rigobot, please log in first!",
        "execute-my-code": "Execute my code",
        "test-my-code": "Test my code",
        "display-another-tab": "Display in another tab",
        "close-tab": "Close tab",
        "redirecting-to-github": "Redirecting to GitHub...",
        "code-copied": "Code copied to clipboard",
        "double-click-to-copy": "Double click to copy this code",
        "model-solution": "Model Solution",
      },
    },
    es: {
      translation: {
        theme: "Tema",
        report: "Reportar 🐞",
        login: "Inicia sesión",
        Run: "Ejecutar",
        "Running...": "Ejecutando...",
        "Run tests": "Ejecutar tests",
        "Login to use AI feedback":
          "Inicia sesión para obtener ayuda del Mentor IA",
        "Get help from AI": "Obtener ayuda de Rigobot AI",
        "To use the AI services you must login with your 4geeks account, and you have been accepted Rigobot":
          "Para usar los servicios de IA, debes iniciar sesión con tu cuenta de 4geeks y haber aceptado los servicios de Rigobot",
        Password: "Contraseña",
        "Don't have an account? ": "¿No tienes una cuenta? ",
        "Sign up here!": "¡Regístrate aquí!",
        "Loading...": "Cargando...",
        "Review model solution": "Revisar solución modelo",
        submit: "Iniciar sesión",
        "Model solution not available": "Solución modelo no disponible",
        Reset: "Reiniciar",
        "not available": "no disponible",
        "About LearnPack": "Acerca de LearnPack",
        "Feedback plays an important role when learning technical skills. ":
          "La retroalimentación juega un papel importante al aprender habilidades técnicas. ",
        "Learn why": "Aprende por qué",
        "Are you sure you want to reset the exercise? You will lose all your progress":
          "¿Estás seguro de que quieres reiniciar el ejercicio? Perderás todo tu progreso",
        Cancel: "Cancelar",
        "Report a bug 🪰": "Reportar un error 🪰",
        "solved-tests": "Tests resueltos",
        "Get feedback": "Obtener ayuda",
        "Try again": "Intenta de nuevo",
        "Current version": "Versión actual",
        "Rigobot AI-Tutor": "Rigobot AI",
        "Ask me something here": "Escribe acá tus preguntas",
        "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.":
          "Esta IA, actualmente en beta, sirve como tutor educativo. No es un sustituto de la instrucción profesional. Úsalo bajo tu propio riesgo y confirma los detalles con recursos educativos autorizados.",
        "Hello! I'm **Rigobot**, your friendly **AI Mentor**! \n\n I can help you if you feel stuck, ask me anything about this exercise!":
          "¡Hola! Soy Rigobot, tu amigable Mentor AI, puedo ayudarte si te sientes atascado, ¡pregúntame cualquier cosa sobre este ejercicio!",
        "No tests available": "No hay tests disponibles",
        Succeded: "¡Perfecto!",
        "Socket disconnected!": "¡Conexión perdida!",
        Reload: "Recargar",
        "Sorry, this error can happen for certain reasons.":
          "Lo siento, este error puede ocurrir por ciertas razones.",
        "The basic steps to troubleshoot this error are the following:":
          "Los pasos básicos para solucionar este error son los siguientes:",
        "Step 1": "Paso 1",
        "Check that Learnpack is running in your terminal.":
          "Verifica que Learnpack esté corriendo en tu terminal.",
        "Run: ": "Ejecuta: ",
        "Step 2": "Paso 2",
        "If Learnpack is running but you still see this modal, reload the window:":
          "Si Learnpack está corriendo pero aún ves este modal, recarga la ventana:",
        "The run button": "El botón de ejecución",
        "Use this button to compile or run your code. The behavior depends of the files in the exercise directory. You can also use the shortcut `Ctrl` + `Enter` to run the code.":
          "Usa este botón para compilar o ejecutar tu código. El comportamiento depende de los archivos en el directorio del ejercicio. También puedes usar el atajo `Ctrl` + `Enter` para ejecutar el código.",
        "Options to get feedback": "Opciones para obtener ayuda",
        "Within this dropdown you can get feedback on your code. Let's try the available ones! You can use the following shortcuts:\n\n`Ctrl` + `Shift` + `Enter`: Run the tests if available. \n\n`Ctrl` + `Alt` + `Enter`: Open the chat with Rigobot":
          "Dentro de este menú desplegable puedes obtener ayuda con tu código. ¡Probemos las disponibles! Puedes usar los siguientes atajos:\n\n`Ctrl` + `Shift` + `Enter`: Ejecutar los tests si están disponibles. \n\n`Ctrl` + `Alt` + `Enter`: Abrir el chat con Rigobot",
        "Inside the sidebar you can go through the exercises and see your progress. Also you can report a bug.":
          "Dentro de la barra lateral puedes revisar los ejercicios y ver tu progreso. También puedes reportar un error.",
        "Open the sidebar": "Abrir la barra lateral",
        "Sometimes you want to start over, use this button to `reset` the code to its original state.":
          "A veces quieres empezar de nuevo, usa este botón para `reiniciar` el código a su estado original.",
        "Reset button": "Botón de reinicio",
        "Click on the flag to change the language.":
          "Haz clic en la bandera para cambiar el idioma.",
        "Welcome to LearnPack!": "¡Bienvenido a LearnPack!",
        "If you prefer, you can change the language!":
          "¡Si prefieres, puedes cambiar el idioma!",
        "This is a quick tutorial to help you get started. Click next to continue.":
          "Este es un tutorial rápido para ayudarte a comenzar. Haz clic en siguiente para continuar.",
        "login-message":
          "Inicia session en 4Geeks para obtener estadisticas de tu desempeño, acceso al nuestro mentor AI y muchos otros beneficios.",
        skip: "Saltar",
        "incremental-test-alert":
          "Debes completar y probar con éxito este paso antes de continuar con el siguiente. Lee cuidadosamente las instrucciones y pide retroalimentación si necesitas ayuda.",
        "agent-mismatch-error":
          "Estos ejercicios fueron diseñados para ejecutarse en un agente diferente",
        instructions: "Instrucciones",
        "read-instructions":
          "Lee las instrucciones y rellena tu codigo para compltar el ejercicio",
        "prev-session":
          "Tienes una sesión abierta en otro lugar, ¿quieres continuar con tu progreso acá o empezar desde cero?",
        "continue-here": "Seguir acá",
        "start-again": "Empezar de nuevo",
        "we-got-you-covered": "Te tenemos cubierto",
        "please-select-option": "Por favor selecciona una opción",
        code: "Código",
        output: "Salida",
        "compile-first":
          "Tienes que compilar o testear tu código para ver la salida",
        or: "o",
        "login-github": "Loggeate con Github",
        continue: "Sigue adelante",
        "change-theme": "Cambia el tema",
        exercises: "Ejercicios",
        "you-must-login-title": "¡Ups! Parece que no has iniciado sesión.",
        "you-must-login-message":
          "Para compilar código en la web y usar nuestro mentor AI Rigobot, ¡por favor inicia sesión primero!",
        "execute-my-code": "Ejecutar mi código",
        "test-my-code": "Testear mi código",
        "display-another-tab": "Mostrar en otra pestaña",
        "close-tab": "Cerrar pestaña",
        "redirecting-to-github": "Redirigiendo a GitHub...",
        "code-copied": "Código copiado al portapapeles",
        "double-click-to-copy": "Doble clic para copiar este código",
        "model-solution": "Solución modelo",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
