import { useEffect, useState } from "react";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { Input } from "../../composites/Input/Input";
import toast from "react-hot-toast";
import { RigoAI } from "../../Rigobot/AI";
import { createExercise, deleteExercise } from "../../../utils/creator";
interface IExerciseList {
  closeSidebar: () => void;
  mode: "list" | "editor";
}

const fixTitleFormat = (title: string): string | null => {
  const match = title.match(/^(\d{1,2})(?:\.(\d{1,2}))?\s*-\s*(.+)$/);

  if (!match) return null; // Invalid format, cannot be fixed

  let [_, mainIndex, decimalPart, text] = match;

  // Ensure main index is two digits
  mainIndex = mainIndex.padStart(2, "0");

  // Normalize the text: remove extra spaces, convert to lowercase
  text = text.trim().replace(/\s+/g, " ").toLowerCase();

  // Ensure decimal part is at most two digits
  if (decimalPart) {
    decimalPart = decimalPart.substring(0, 2);
    return `${mainIndex}.${decimalPart}-${text.replace(/ /g, "")}`;
  }

  return `${mainIndex}-${text.replace(/ /g, "")}`;
};

const AddExerciseButton = ({
  exercises,
  prevExercise,
}: {
  exercises: any[];
  prevExercise: any;
}) => {
  const { config, language, fetchExercises } = useStore((state) => ({
    config: state.configObject,
    language: state.language,
    fetchExercises: state.fetchExercises,
  }));
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    const toastId = toast.loading(t("generatingExercise"));
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const exerciseName = formData.get("exerciseName");
    if (!fixTitleFormat(exerciseName as string)) {
      toast.error(t("invalidExerciseName"));
      return;
    }
    const fixedTitle = fixTitleFormat(exerciseName as string);

    setIsAdding(false);
    RigoAI.useTemplate({
      slug: "write-md-lesson",
      inputs: {
        course_title: JSON.stringify(config.config.title),
        lesson_title: fixedTitle as string,
        list_of_exercises: exercises
          .map((exercise) => exercise.title)
          .join(", "),
        language: language,
      },
      target: document.createElement("div"),
      onComplete: async (success, data) => {
        if (success) {
          try {
            await createExercise(
              fixedTitle as string,
              data.ai_response,
              language
            );
            toast.success(t("exerciseGenerated"), { id: toastId });
            await fetchExercises();
          } catch (error) {
            toast.error(t("errorGeneratingExercise"), { id: toastId });
          }
        } else {
          toast.error(t("errorGeneratingExercise"), { id: toastId });
        }
      },
    });
  };

  return (
    <>
      <SimpleButton
        extraClass="scale-on-hover padding-small rounded"
        svg={svgs.plus}
        action={() => setIsAdding(!isAdding)}
      />
      {isAdding && (
        <form
          onSubmit={handleGenerate}
          className="flex-y gap-small align-center"
        >
          <Input
            name="exerciseName"
            placeholder={t("exerciseName")}
            defaultValue={""}
            useAI={true}
            context={`Generate a new exercise named like: 00.1 - Exercise title, 01.3 - Exercise title, 02.1 - Exercise title... 
              
              Base your response on the following exercises: ${exercises
                .map((exercise) => exercise.title)
                .join(", ")}. 
                
                Return only the exercise name, no other text. The new exercise should not exist in the list of exercises and must fit perfectly in the list of exercises.
              ${
                prevExercise
                  ? `The previous exercise is named like: ${prevExercise.title}. The index of the generated title should be after the previous exercise by a decimal number. For example, if the previous exercise is 00.1, the generated title should be 00.2 and so on. If the previous exercise is 0.1, the generated title should be 01.1.
                  
                  Generate the index and the title, we will convert your title into the correct format.`
                  : ""
              }`}
          />
          <p className="m-0 text-small">{t("exerciseNameDescription")}</p>
          <div className="flex-x gap-small align-center">
            <SimpleButton
              extraClass="active-on-hover padding-small rounded border-gray"
              svg={svgs.rigoSvg}
              text={t("generate")}
              // action={() => setIsAdding(!isAdding)}
              type="submit"
            />
            <SimpleButton
              extraClass="padding-small rounded gray-on-hover border-gray"
              svg={svgs.iconClose}
              text={t("cancel")}
              action={() => setIsAdding(!isAdding)}
            />
          </div>
        </form>
      )}
    </>
  );
};

export default function ExercisesList({ closeSidebar, mode }: IExerciseList) {
  const { exercises } = useStore((state) => ({
    exercises: state.exercises,
  }));
  const { t } = useTranslation();

  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);

  if (!exercises || exercises.length === 0) return null;

  const handleSelect = (index: number) => {
    if (selectedExercises.includes(index)) {
      setSelectedExercises((prev) => prev.filter((item) => item !== index));
    } else {
      setSelectedExercises((prev) => [...prev, index]);
    }
  };

  useEffect(() => {
    if (mode === "list") {
      setSelectedExercises([]);
    }
  }, [mode]);

  return (
    <ul className="exercise-list">
      {selectedExercises.length > 0 && (
        <div className="flex-y gap-small align-center">
          <span>
            {t("selectedExercises")}: {selectedExercises.length}
          </span>
          <SimpleButton
            extraClass="active-on-hover padding-small rounded"
            svg={svgs.translation}
            text={t("translate")}
            action={() => setSelectedExercises([])}
          />
        </div>
      )}
      {exercises.map((item, index) => (
        <div key={index} className="flex-y gap-small align-center">
          <ExerciseCard
            key={index}
            {...item}
            closeSidebar={closeSidebar}
            mode={mode}
            selected={selectedExercises.includes(index)}
            handleSelect={handleSelect}
          />
          {mode === "editor" && (
            <AddExerciseButton
              prevExercise={index > 0 ? exercises[index] : null}
              exercises={exercises}
            />
          )}
        </div>
      ))}
    </ul>
  );
}

interface IExerciseProps {
  position: number;
  title: string;
  done: boolean;
  slug: string;
  graded: boolean;
  mode: "list" | "editor";
  closeSidebar: () => void;
  handleSelect: (index: number) => void;
  selected: boolean;
}

function ExerciseCard({
  title,
  slug,
  position,
  closeSidebar,
  graded,
  done,
  mode,
  handleSelect,
  selected,
}: IExerciseProps) {
  const { t } = useTranslation();
  const { handlePositionChange, fetchExercises, getCurrentExercise } = useStore(
    (state) => ({
      handlePositionChange: state.handlePositionChange,
      fetchExercises: state.fetchExercises,
      getCurrentExercise: state.getCurrentExercise,
    })
  );

  const [isEditing, setIsEditing] = useState(false);

  const titlefy = (str: string) => {
    let arr = str.split("-");
    arr.shift();
    let result = arr.join(" ");
    result = result.charAt(0).toUpperCase() + result.slice(1);
    return result;
  };

  return (
    <li
      className={`w-100 exercise-card  ${selected ? "bg-blue" : ""}`}
      onClick={
        mode === "list"
          ? () => {
              handlePositionChange(position);
              closeSidebar();
            }
          : () => {}
      }
    >
      <div
        onClick={() => {
          if (mode === "editor") {
            handleSelect(position);
          }
        }}
      >
        <button className={`exercise-circle ${done ? "done" : ""}`}>
          <span>{title.split("-")[0]}</span>
        </button>
        {isEditing ? (
          <input
            className="padding-small rounded bg-transparent"
            type="text"
            defaultValue={title}
            // onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <span>{titlefy(title)}</span>
        )}
      </div>
      <div>
        {graded && mode === "list" && (
          <SimpleButton
            svg={done ? svgs.checkIcon : svgs.blankCircle}
            text=""
          />
        )}
        {mode === "editor" && (
          <>
            <SimpleButton
              extraClass="scale-on-hover"
              svg={svgs.trash}
              text=""
              action={async () => {
                const toastId = toast.loading(t("deletingExercise"));

                try {
                  await deleteExercise(slug);
                  const currentExercise = getCurrentExercise();
                  if (currentExercise.slug === slug) {
                    handlePositionChange(0);
                  }
                  toast.success(t("exerciseDeleted"), { id: toastId });

                
                  await fetchExercises();
                } catch (error) {
                  toast.error(t("errorDeletingExercise"), { id: toastId });
                  console.log(error);
                }
              }}
              confirmationMessage={t("sureDeleteExercise")}
            />
            <SimpleButton
              extraClass="scale-on-hover"
              svg={svgs.edit}
              text=""
              action={() => setIsEditing(!isEditing)}
            />
          </>
        )}
      </div>
    </li>
  );
}
