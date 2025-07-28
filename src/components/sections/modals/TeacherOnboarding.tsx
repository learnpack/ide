import { useState } from "react";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import { VideoPlayer } from "../../composites/VideoPlayer/VideoPlayer";
import "./TeacherOnboarding.css";

type TStep = {
  title: string;
  description: string;
  video?: string;
};

const stepsJson: Record<
  string,
  { title: string; description: string; instructions: TStep[] }
> = {
  en: {
    title: "Welcome Teacher!",
    description:
      "LearnPack is designed as a teacher copilot, before publishing the tutorial with your students, you can easily use AI for edits in the following ways:",
    instructions: [
      {
        title: "Tell Rigobot to summarize, elaborate or rewrite any content.",
        description:
          "Just select the content you want to edit and click on the pen icon in the left side of the text. You will see different options to edit the content.",
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        title: "Create images and graphs using our internally trained models.",
        description:
          "Add a new element to the lesson clicking the plus icon in the bottom or top of any element. When you add the element, you can generate or upload an image in that section.",
        // video: "https://www.youtube.com/watch?v=aOWtNBiksmg",
      },
      {
        title: "Create a new lesson",
        description:
          "Open the sidebar, locate the place where you want to add a new lesson and click on the plus icon. Write a name for the lesson and click on the check icon.",
        // video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
      },
      {
        title:
          "Crea imágenes y gráficos usando nuestros modelos entrenados internamente.",
        description:
          "Añade un nuevo elemento a la lección haciendo clic en el icono de más en la parte inferior o superior de cualquier elemento. Cuando agregues el elemento, puedes generar o cargar una imagen en esa sección.",
        // video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },  
      {
        title: "Crear una nueva lección",
        description:
          "Abre la barra lateral, localiza el lugar donde quieres agregar una nueva lección y haz clic en el icono de más. Escribe un nombre para la lección y haz clic en el icono de verificación.",
        // video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
};

export const TeacherOnboarding = () => {
  const { setOpenedModals, language } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    language: state.language,
  }));

  const [currentStep, setCurrentStep] = useState(0);

  const steps = stepsJson[language as keyof typeof stepsJson];

  if (!steps) {
    setOpenedModals({ teacherOnboarding: false });
    return null;
  }

  const currentStepData = steps.instructions[currentStep];

  const handleClose = () => {
    setOpenedModals({ teacherOnboarding: false });
  };

  const handleStepChange = (stepIndex: number) => {
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
            {steps.instructions.map((instruction, index) => (
              <div key={index} className="feature-item">
                <div className="feature-checkbox">
                  <input
                    type="checkbox"
                    id={`feature-${index}`}
                    checked={currentStep === index}
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
          </div>
        </div>

        {/* Right Section - Video */}
        {currentStepData.video && (
          <div className="onboarding-video">
            <VideoPlayer link={currentStepData.video} />
          </div>
        )}
      </div>
    </Modal>
  );
};
