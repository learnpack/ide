import { useEffect, useRef, useState } from "react";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { RigoAI } from "../../Rigobot/AI";
import {
  createExercise,
  deleteExercise,
  renameExercise,
} from "../../../utils/creator";
import { FetchManager } from "../../../managers/fetchManager";
import { TMode } from "../../../utils/storeTypes";
interface IExerciseList {
  closeSidebar: () => void;
  mode: "creator" | "student";
}

const fixTitleFormat = (title: string): string | null => {
  const match = title.match(/^(\d{1,2})(?:\.(\d{1,2}))?\s*-\s*(.+)$/);

  if (!match) return null; // Invalid format, cannot be fixed

  let [_, mainIndex, decimalPart, text] = match;

  // Ensure main index is two digits
  mainIndex = mainIndex.padStart(2, "0");

  // Normalize the text: remove extra spaces, convert to lowercase, and replace spaces with "-"
  text = text.trim().replace(/\s+/g, "-").toLowerCase();

  // Ensure decimal part is at most two digits
  if (decimalPart) {
    decimalPart = decimalPart.substring(0, 2);
    return `${mainIndex}.${decimalPart}-${text}`;
  }

  return `${mainIndex}-${text}`;
};

const getExerciseIndexFromTitle = (title: string): string => {
  const match = title.match(/^(\d{1,2})(?:\.(\d{1,2}))?\s*-\s*(.+)$/);
  if (!match) return "00";

  // If there's a decimal part, concatenate it
  return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
};

function incrementDecimalPart(numberStr: string): string {
  let parts = numberStr.split(".");

  if (parts.length === 2) {
    parts[1] = (parseInt(parts[1], 10) + 1).toString();
  } else {
    parts.push("1");
  }

  return parts.join(".");
}

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
    const exerciseIndex =
      prevExercise && typeof prevExercise.title === "string"
        ? incrementDecimalPart(
            getExerciseIndexFromTitle(prevExercise.title) as string
          )
        : "00.1";
    if (!fixTitleFormat((exerciseIndex + "-" + exerciseName) as string)) {
      toast.error(t("invalidExerciseName"));
      return;
    }
    const fixedTitle = fixTitleFormat(
      (exerciseIndex + "-" + exerciseName) as string
    );

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
            setIsAdding(false);
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
      {isAdding ? (
        <form
          onSubmit={handleGenerate}
          className=" bg-soft-blue rounded padding-small w-100 flex-x gap-small"
        >
          {prevExercise &&
          prevExercise.title &&
          typeof prevExercise.title === "string" ? (
            <div className="exercise-circle">
              {incrementDecimalPart(
                getExerciseIndexFromTitle(prevExercise.title) as string
              )}
            </div>
          ) : (
            <div className="exercise-circle">00.1</div>
          )}
          <input
            type="text"
            className="input"
            name="exerciseName"
            placeholder={t("exerciseName")}
          />

          <div className="flex-x gap-small align-center">
            <SimpleButton
              extraClass="scale-on-hover padding-small rounded "
              svg={svgs.iconCheck}
              title={t("generate")}
              type="submit"
            />
            <SimpleButton
              extraClass="padding-small rounded scale-on-hover "
              svg={svgs.iconClose}
              title={t("cancel")}
              action={() => setIsAdding(!isAdding)}
            />
          </div>
        </form>
      ) : (
        <SimpleButton
          extraClass="scale-on-hover padding-small rounded"
          svg={svgs.plus}
          action={() => setIsAdding(!isAdding)}
        />
      )}
    </>
  );
};

export default function ExercisesList({ closeSidebar, mode }: IExerciseList) {
  const { exercises, fetchExercises } = useStore((state) => ({
    exercises: state.exercises,
    fetchExercises: state.fetchExercises,
  }));
  const inputLanguageRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  if (!exercises || exercises.length === 0) return null;

  const handleSelect = (slug: string) => {
    if (selectedExercises.includes(slug)) {
      setSelectedExercises((prev) => prev.filter((item) => item !== slug));
    } else {
      setSelectedExercises((prev) => [...prev, slug]);
    }
  };

  useEffect(() => {
    if (mode === "student") {
      setSelectedExercises([]);
    }
  }, [mode]);

  const handleTranslate = async () => {
    const toastId = toast.loading(t("translatingExercises"));
    try {
      if (!inputLanguageRef.current) return;
      const languages = inputLanguageRef.current.value;

      if (!languages) {
        toast.error(t("invalidLanguage"), {
          duration: 5000,
          id: toastId,
        });
        return;
      }

      await FetchManager.translateExercises(selectedExercises, languages);
      toast.success(t("exercisesTranslated"), { id: toastId });
      await fetchExercises();
      setSelectedExercises([]);
    } catch (error) {
      toast.error(t("errorTranslatingExercises"), { id: toastId });
      console.log(error, "Error");
    }
  };

  return (
    <ul className="exercise-list">
      {selectedExercises.length > 0 && (
        <div className="flex-y gap-small align-center">
          <div className="flex-x gap-small align-center">
            <SimpleButton
              extraClass=" active-on-hover rounded"
              svg={svgs.translation}
              text={t("translate")}
              action={handleTranslate}
            />
            <input
              ref={inputLanguageRef}
              type="text"
              placeholder={t("languagesCSV")}
              className="rounded padding-small"
            />
          </div>
        </div>
      )}
      {exercises.map((item, index) => (
        <div key={index} className="flex-y align-center gap-small">
          <ExerciseCard
            key={index}
            {...item}
            closeSidebar={closeSidebar}
            mode={mode}
            selected={selectedExercises.includes(item.slug)}
            handleSelect={handleSelect}
          />
          {mode === "creator" && (
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
  mode: TMode;
  closeSidebar: () => void;
  handleSelect: (slug: string) => void;
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
  const titleInputRef = useRef<HTMLInputElement>(null);
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

  const handleEdit = async () => {
    if (isEditing) {
      const newTitle = titleInputRef.current?.value;
      const toastId = toast.loading(t("updatingExercise"));
      const fixedTitle = fixTitleFormat(newTitle as string);
      if (!fixedTitle) {
        toast.error(t("invalidExerciseName"), { id: toastId });
        return;
      }
      try {
        await renameExercise(slug, fixedTitle);
        setIsEditing(false);
        toast.success(t("exerciseRenamed"), { id: toastId });
        await fetchExercises();
      } catch (e) {
        toast.error(t("errorRenamingExercise"), { id: toastId });
        console.log(e);
      }
    } else {
      setIsEditing(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <li
      className={`exercise-card ${selected ? "bg-2" : "bg-white"}`}
      onClick={
        mode === "student"
          ? () => {
              handlePositionChange(position);
              closeSidebar();
            }
          : () => {}
      }
    >
      <div className="z-index-1 flex-x align-center gap-small">
        {mode === "creator" && selected && (
          <SimpleButton
            extraClass="padding-small margin-left-small"
            svg={svgs.checked}
            text=""
            action={() => handleSelect(slug)}
          />
        )}
        {mode === "creator" && !selected && (
          <SimpleButton
            extraClass="padding-small margin-left-small"
            svg={svgs.unchecked}
            text=""
            action={() => handleSelect(slug)}
          />
        )}

        {isEditing ? (
          <input
            className="padding-small rounded bg-transparent"
            type="text"
            defaultValue={title}
            ref={titleInputRef}
            // onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <>
            <button className={`exercise-circle ${done ? "done" : ""}`}>
              <span>{title.split("-")[0]}</span>
            </button>
            <span>{titlefy(title)}</span>
          </>
        )}
      </div>

      <div className="flex-x align-center gap-small">
        {graded && mode === "student" && (
          <SimpleButton
            svg={done ? svgs.checkIcon : svgs.blankCircle}
            text=""
          />
        )}
        {mode === "creator" && (
          <>
            <SimpleButton
              extraClass="scale-on-hover"
              svg={isEditing ? svgs.iconCheck : svgs.edit}
              text=""
              action={handleEdit}
            />
            <SimpleButton
              extraClass="scale-on-hover"
              svg={isEditing ? svgs.iconClose : svgs.trash}
              text=""
              action={async () => {
                if (isEditing) {
                  setIsEditing(false);
                  return;
                }
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
              confirmationMessage={
                isEditing ? undefined : t("sureDeleteExercise")
              }
            />
          </>
        )}
      </div>
    </li>
  );
}

/* <Input
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
          /> */
