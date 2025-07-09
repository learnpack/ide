import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";

interface SpeechToTextButtonProps {
  onTranscription?: (text: string) => void;
}

interface SpeechRecognition extends EventTarget {
  start(): void;
  stop(): void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Mapa de idiomas cortos a BCP 47 para SpeechRecognition
const LANGUAGE_MAP: Record<string, string> = {
  en: "en-US", // Inglés (Estados Unidos)
  es: "es-ES", // Español (España)
  fr: "fr-FR", // Francés (Francia)
  de: "de-DE", // Alemán (Alemania)
  it: "it-IT", // Italiano (Italia)
  pt: "pt-PT", // Portugués (Portugal)
  ru: "ru-RU", // Ruso
  zh: "zh-CN", // Chino (Mandarín, China)
  ja: "ja-JP", // Japonés
  ko: "ko-KR", // Coreano
  ar: "ar-SA", // Árabe (Arabia Saudita)
  nl: "nl-NL", // Neerlandés (Países Bajos)
  tr: "tr-TR", // Turco
  pl: "pl-PL", // Polaco
  sv: "sv-SE", // Sueco
  hi: "hi-IN", // Hindi (India)
  th: "th-TH", // Tailandés
  id: "id-ID", // Indonesio
  fa: "fa-IR", // Persa (Irán)
  he: "he-IL", // Hebreo (Israel)
};

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onTranscription,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [langCode, setLangCode] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const language = useStore((state) => state.language); // valor: "es", "en", etc.
  const agent = useStore((state) => state.agent);

  useEffect(() => {
    // Verificar idioma soportado y API disponible
    const langBCP47 = LANGUAGE_MAP[language];
    setLangCode(langBCP47 || null);

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI && langBCP47 && agent !== "vscode") {
      setIsSupported(true);
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognitionAPI();
        const recognition = recognitionRef.current;

        if (!recognition) {
          console.log("No recognition");
          return;
        }

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          onTranscription?.(transcript);
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          toast.error(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
        };
        recognition.onend = () => {
          setIsRecording(false);
        };
      }
      // Actualizar idioma si cambia
      if (!recognitionRef.current) {
        console.log("No recognition");
        return;
      }
      recognitionRef.current.lang = langBCP47;
    } else {
      setIsSupported(false);
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [language, agent, onTranscription]);

  const toggleRecording = () => {
    if (!isSupported || !recognitionRef.current) {
      if (!langCode) {
        toast.error("Transcription is not available for this language.");
      } else {
        toast.error("Speech recognition is not supported in this browser.");
      }
      return;
    }

    if (!isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    isSupported && (
      <SimpleButton
        title={isRecording ? "Stop recording" : "Start recording"}
        svg={isRecording ? svgs.microphoneOff : svgs.microphone}
        action={toggleRecording}
        extraClass={`${
          isRecording ? "bg-soft-red" : "bg-gray"
        } padding-medium rounded big-circle d-flex align-center justify-center pos-absolute right-bottom-corner`}
        disabled={!isSupported}
      />
    )
  );
};
