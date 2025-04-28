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
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onTranscription,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Guardamos la instancia aquí
  const language = useStore((state) => state.language);
  const agent = useStore((state) => state.agent);

  useEffect(() => {
    // Verificar soporte de SpeechRecognition
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI && agent !== "vscode") {
    // if (SpeechRecognitionAPI) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;

      if (recognition) {
        recognition.lang = language;
        recognition.continuous = false; // Detener al terminar
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          onTranscription?.(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Error en SpeechRecognition:", event.error);
        };
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      recognitionRef.current?.stop(); // Limpiar cuando el componente se desmonte
    };
  }, [onTranscription, language]);

  const toggleRecording = () => {
    if (!isSupported) {
      toast.error("The browser does not support speech recognition");
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (!isRecording) {
      recognition.start();
    } else {
      recognition.stop();
    }
    setIsRecording(!isRecording);
  };


  return (
    isSupported && (
      <SimpleButton
        title={isRecording ? "Stop recording" : "Start recording"}
        svg={isRecording ? svgs.microphoneOff : svgs.microphone}
        action={toggleRecording}
        extraClass={`${
          isRecording ? "bg-soft-red" : "bg-gray"
        } padding-medium rounded big-circle  d-flex align-center justify-center pos-absolute right-bottom-corner `}
        disabled={!isSupported}
      />
    )
  );
};
