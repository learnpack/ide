
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Run": "Run",
          "Run tests": "Run tests",
          "Running...": "Running...",
          "Login to use AI feedback": "Login to use AI feedback",
          "Get help from AI": "Get help from AI",
          "To use the AI services you must login with your 4geeks account, and you have been accepted Rigobot": "To use the AI services you must login with your 4geeks account, and you have been accepted Rigobot",
          "Password": "Password",
          "Don't have an account? ": "Don't have an account? ",
          "Sign up here!": "Sign up here!",
          "Loading...": "Loading...",
          "Submit": "Submit",
          "Review model solution": "Review model solution",
          "Model solution not available": "Model solution not available",
          "Reset": "Reset",
          "not available": "not available",
          "About LearnPack": "About LearnPack",
          "Feedback plays an important role when learning technical skills. ": "Feedback plays an important role when learning technical skills. ",
          "Learn why": "Learn why",
          "Are you sure you want to reset the exercise? You will lose all your progress": "Are you sure you want to reset the exercise? You will lose all your progress",
          "Cancel": "Cancel",
          "Report a bug 🪰": "Report a bug 🪰",
          "Solved exercises": "Solved exercises",
          "Get feedback": "Get feedback",
          "Try again": "Try again",
          "Current version": "Current version",
          "Learnpack AI-Tutor": "Learnpack AI-Tutor",
          "Ask me something here": "Ask me something here",
          "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.": "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.",
          "Hello! I'm the Learnpack tutor, I can help you if you feel stuck, ask me anything about this exercise!": "Hello! I'm the Learnpack tutor, I can help you if you feel stuck, ask me anything about this exercise!",
        }
      },
      es: {
        translation: {
          "Run": "Ejecutar",
          "Running...": "Ejecutando...",
          "Run tests": "Ejecutar tests",
          "Login to use AI feedback": "Inicia sesión para obtener ayuda de la IA",
          "Get help from AI": "Obtener ayuda de la IA",
          "To use the AI services you must login with your 4geeks account, and you have been accepted Rigobot": "Para usar los servicios de IA, debes iniciar sesión con tu cuenta de 4geeks y haber aceptado los servicios de Rigobot",
          "Password": "Contraseña",
          "Don't have an account? ": "¿No tienes una cuenta? ",
          "Sign up here!": "¡Regístrate aquí!",
          "Loading...": "Cargando...",
          "Submit": "Enviar",
          "Review model solution": "Revisar solución modelo",
          "Model solution not available": "Solución modelo no disponible",
          "Reset": "Reiniciar",
          "not available": "no disponible",
          "About LearnPack": "Acerca de LearnPack",
          "Feedback plays an important role when learning technical skills. ": "La retroalimentación juega un papel importante al aprender habilidades técnicas. ",
          "Learn why": "Aprende por qué",
          "Are you sure you want to reset the exercise? You will lose all your progress": "¿Estás seguro de que quieres reiniciar el ejercicio? Perderás todo tu progreso",
          "Cancel": "Cancelar",
          "Report a bug 🪰": "Reportar un error 🪰",
          "Solved exercises": "Ejercicios resueltos",
          "Get feedback": "Obtener ayuda",
          "Try again": "Intenta de nuevo",
          "Current version": "Versión actual",
          "Learnpack AI-Tutor": "Tutor AI",
          "Ask me something here": "Escribe acá tus preguntas",
          "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.": "Esta IA, actualmente en beta, sirve como tutor educativo. No es un sustituto de la instrucción profesional. Úsalo bajo tu propio riesgo y confirma los detalles con recursos educativos autorizados.",
          "Hello! I'm the Learnpack tutor, I can help you if you feel stuck, ask me anything about this exercise!": "¡Hola! Soy el tutor de Learnpack, puedo ayudarte si te sientes atascado, ¡pregúntame cualquier cosa sobre este ejercicio!",
          
        }
      },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;


// import React from 'react';
// import { useTranslation } from 'react-i18next';

// function App() {
//   const { t } = useTranslation();

//   return <h2>{t('Welcome to React')}</h2>;
// }

// export default App;


// import React from 'react';
// import { useTranslation } from 'react-i18next';

// function LanguageSwitcher() {
//   const { i18n } = useTranslation();

//   const changeLanguage = (language) => {
//     i18n.changeLanguage(language);
//   };

//   return (
//     <div>
//       <button onClick={() => changeLanguage('en')}>EN</button>
//       <button onClick={() => changeLanguage('de')}>DE</button>
//     </div>
//   );
// }

// export default LanguageSwitcher;