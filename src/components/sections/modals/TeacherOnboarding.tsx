import { useState } from "react";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import { VideoPlayer } from "../../composites/VideoPlayer/VideoPlayer";
import "./TeacherOnboarding.css";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";

type TStep = {
  title: string;
  description: string;
  video?: string;
  done: boolean;
};

const stepsJson: Record<
  string,
  { title: string; description: string; instructions: TStep[] }
> = {
  en: {
    title:
      "What you can do as a Teacher with the Rigobot AI Agent in LearnPack",
    description:
      "LearnPack is designed as a teacher copilot, before publishing the tutorial with your students, you can easily use AI for edits and help you with the content of the course. ",
    instructions: [
      {
        title: "Notion-style editing",
        description:
          "Update lessons block-by-block just by telling the Rigobot AI Agent what you want (rewrite, simplify, add examples, change tone).",
        video: "youtube.com/watch?v=blPx2dKW4lg&feature=youtu.be",
        done: false,
      },
      {
        title: "AI-powered content creation",
        description:
          "Create quizzes, coding challenges, file/URL deliverables, and multimedia in just a few back-and-forths with the Rigobot AI Agent.",
        video: "youtube.com/watch?v=blPx2dKW4lg&feature=youtu.be",
        done: false,
      },
      {
        title: "Instant multilingual translation",
        description:
          "Translate your lessons into any language preserving meaning and content.",
        video: "youtube.com/watch?v=blPx2dKW4lg&feature=youtu.be",
        done: false,
      },
      {
        title: "One-click publishing",
        description:
          "Once your content is ready, publish your course instantly and share it via link or social media, with the Rigobot AI Agent guiding your students if needed.",
        video: "youtube.com/watch?v=blPx2dKW4lg&feature=youtu.be",
        done: false,
      },
    ],
  },
  es: {
    title: "¡Bienvenido Profesor!",
    description:
      "LearnPack está diseñado como un copiloto para profesores, antes de publicar el tutorial con tus estudiantes, puedes usar fácilmente la IA para ediciones de las siguientes maneras:",
    instructions: [
      {
        title:
          "Dile a Rigobot que resuma, elabore o reescriba cualquier contenido.",
        description:
          "Selecciona el contenido que quieres editar y haz clic en el icono de lápiz en el lado izquierdo del texto. Verás diferentes opciones para editar el contenido.",
        // video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        done: false,
      },
      {
        title:
          "Crea imágenes y gráficos usando nuestros modelos entrenados internamente.",
        description:
          "Añade un nuevo elemento a la lección haciendo clic en el icono de más en la parte inferior o superior de cualquier elemento. Cuando agregues el elemento, puedes generar o cargar una imagen en esa sección.",
        // video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        done: false,
      },
      {
        title: "Crear una nueva lección",
        description:
          "Abre la barra lateral, localiza el lugar donde quieres agregar una nueva lección y haz clic en el icono de más. Escribe un nombre para la lección y haz clic en el icono de verificación.",
        // video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        done: false,
      },
    ],
  },
};

export const TeacherOnboarding = () => {
  const { t } = useTranslation();
  const { setOpenedModals, language } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    language: state.language,
  }));

  // Inicializa el estado local de instrucciones
  const steps = stepsJson[language as keyof typeof stepsJson];

  // Cierra modal si no hay pasos definidos
  if (!steps) {
    setOpenedModals({ teacherOnboarding: false });
    return null;
  }

  // Estado local para instrucciones y paso actual
  const [instructions, setInstructions] = useState<TStep[]>(
    steps.instructions.map((inst) => ({ ...inst }))
  );
  const [currentStep, setCurrentStep] = useState(0);

  const currentStepData = instructions[currentStep];

  const handleClose = () => {
    setOpenedModals({ teacherOnboarding: false });
  };

  const handleStepChange = (stepIndex: number) => {
    setInstructions((prev) =>
      prev.map((inst, idx) =>
        idx === stepIndex ? { ...inst, done: true } : inst
      )
    );
    setCurrentStep(stepIndex);
  };

  return (
    <Modal
      outsideClickHandler={handleClose}
      extraClass="teacher-onboarding-modal"
      minWidth="1200px"
    >
      <div className="teacher-onboarding-container">
        {/* Left Section - Content */}
        <div className="onboarding-content">
          <div className="onboarding-header">
            <h1 className="onboarding-title">{steps.title}</h1>
          </div>
          <div className="onboarding-description">{steps.description}</div>
          {/* Features List */}
          <div className="features-list">
            {instructions.map((instruction, index) => (
              <div key={index} className="feature-item">
                <div className="feature-checkbox">
                  <input
                    type="checkbox"
                    id={`feature-${index}`}
                    checked={instruction.done}
                    onChange={() => handleStepChange(index)}
                  />
                  <label
                    htmlFor={`feature-${index}`}
                    className={currentStep === index ? "active" : ""}
                  >
                    {instruction.title}
                  </label>
                </div>
                {currentStep === index && (
                  <div className="feature-description">
                    {instruction.description}
                  </div>
                )}
              </div>
            ))}
            <SimpleButton
              extraClass="bg-blue-rigo padding-medium rounded text-white fit-content"
              text={t("startReviewingMyPackage")}
              action={handleClose}
            />
          </div>
        </div>

        {/* Right Section - Video */}
        {currentStepData && (
          <div className="onboarding-video">
            {currentStepData.video && (
              <VideoPlayer link={currentStepData.video} />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
