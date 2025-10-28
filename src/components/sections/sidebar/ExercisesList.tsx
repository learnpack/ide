import { useEffect, useRef, useState } from "react";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  createStep,
  deleteExercise,
  markLessonAsDone,
  renameExercise,
  migrateCourseToFlexible,
} from "../../../utils/creator";
import { FetchManager } from "../../../managers/fetchManager";
import { Syllabus, TMode } from "../../../utils/storeTypes";
import { cleanFloatString, DEV_MODE } from "../../../utils/lib";
import { slugify } from "../../../utils/lib.tsx";
import { eventBus } from "../../../managers/eventBus";
import { Loader } from "../../composites/Loader/Loader";
import { Modal } from "@/components/mockups/Modal";
import { RigoMessage } from "@/components/Creator/RealtimeImage";
import { AutoResizeTextarea } from "@/components/composites/AutoResizeTextarea/AutoResizeTextarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const getNextDisplayId = (prevExercise: any, syllabus: Syllabus): string => {
  // Buscar la lección en el syllabus por slug
  const foundLesson = syllabus?.lessons?.find((lesson) => {
    const lessonSlug = slugify(lesson.id + "-" + lesson.title);
    return lessonSlug === prevExercise.slug;
  });

  // Si encontró la lección y tiene displayId, usar el sistema flexible
  if (foundLesson?.displayId) {
    return incrementDecimalPart(foundLesson.displayId);
  }

  // Si no, usar el sistema legacy (extraer del título)
  return incrementDecimalPart(
    getExerciseIndexFromTitle(prevExercise.title) as string
  );
};

const AddExerciseButton = ({
  prevExercise,
  syllabus,
}: {
  prevExercise: any;
  syllabus: Syllabus;
}) => {
  const { token, fetchExercises, getSidebar, getSyllabus } = useStore((state) => ({
    token: state.token,
    fetchExercises: state.fetchExercises,
    getSidebar: state.getSidebar,
    getSyllabus: state.getSyllabus,
  }));
  const [isAdding, setIsAdding] = useState(false);
  const exerciseIndexRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const { t } = useTranslation();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const original = e.target.value;
    const cleaned = original.replace(/[^a-zA-Z0-9ñÑ\s,!:]/g, "");

    const removedChars = original
      .split("")
      .filter((c, i) => cleaned[i] !== c)
      .filter((c, i, arr) => arr.indexOf(c) === i);

    if (removedChars.length > 0) {
      toast.error(t("symbolsNotAllowed") + `: ${removedChars.join(" ")}`);
    }

    setDescription(cleaned);
  };

  const handleGenerate = async () => {
    const toastId = toast.loading(t("generatingExercise"));
    const stepIndex = exerciseIndexRef.current?.innerText as string;

    try {
      await createStep(
        token,
        description,
        stepIndex
      );
      toast.success(t("exerciseGenerated"), { id: toastId });
  
      setIsAdding(false);
      await fetchExercises();
      await getSidebar();
      await getSyllabus();
    }
    catch (error: any) {
      // Si requiere migración, ejecutar automáticamente
      if (error.response?.data?.error === "MIGRATION_REQUIRED") {
        try {
          // Migración automática sin confirmación
          await migrateCourseToFlexible(token);
          
          // Reintentar creación
          await createStep(token, description, stepIndex);
          toast.success(t("exerciseGenerated"), { id: toastId });
          
          setIsAdding(false);
          await fetchExercises();
          await getSidebar();
          await getSyllabus();
        } catch (migrationError) {
          toast.error(t("errorGeneratingExercise"), { id: toastId });
          console.log(migrationError);
        }
      } else {
        toast.error(t("errorGeneratingExercise"), { id: toastId });
        console.log(error);
      }
    }
  };

  return (
    <>
      {isAdding ? (
        <Modal outsideClickHandler={() => setIsAdding(!isAdding)}>
          <RigoMessage message={t("addExerciseHelpText")} />
          <div className=" bg-soft-blue rounded padding-small w-100 flex-x gap-small">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  ref={exerciseIndexRef}
                  className="exercise-circle"
                  contentEditable={false}
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                >
                  {getNextDisplayId(prevExercise, syllabus)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>La numeración se asigna automáticamente</p>
              </TooltipContent>
            </Tooltip>
            <AutoResizeTextarea
              className="w-100 rounded padding-small"
              defaultValue={description}
              onChange={handleInputChange}
              placeholder={t("exerciseDescription")}
            />


          </div>
          <div className="flex-x justify-center gap-small align-center">
            <SimpleButton
              extraClass="bg-blue-rigo text-white padding-small rounded"
              svg={svgs.rigoSoftBlue}
              text={t("generate")}
              action={handleGenerate}
            />
            <SimpleButton
              extraClass="bg-gray text-black padding-small rounded"
              text={t("cancel")}
              action={() => setIsAdding(!isAdding)}
            />
          </div>
        </Modal>
      ) : (
        <SimpleButton
          extraClass="scale-on-hover padding-small rounded"
          svg={svgs.plus}
          title={t("add-exercise-tooltip")}
          action={() => setIsAdding(!isAdding)}
        />
      )}
    </>
  );
};

export default function ExercisesList({ closeSidebar, mode }: IExerciseList) {
  const {
    exercises,
    fetchExercises,
    getSidebar,
    getSyllabus,
    sidebar,
    token,
    language,
    syllabus,
  } = useStore((state) => ({
    exercises: state.exercises,
    fetchExercises: state.fetchExercises,
    getSidebar: state.getSidebar,
    getSyllabus: state.getSyllabus,
    sidebar: state.sidebar,
    token: state.token,
    language: state.language,
    syllabus: state.syllabus,
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

  useEffect(() => {
    if (Object.keys(sidebar).length === 0) {
      getSidebar();
    }
  }, []);

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

      await FetchManager.translateExercises(
        selectedExercises,
        languages,
        language,
        token
      );
      toast.success(t("exercisesTranslated"), { id: toastId });
      await fetchExercises();
      await getSidebar();
      setSelectedExercises([]);
    } catch (error) {
      toast.error(t("errorTranslatingExercises"), { id: toastId });
      console.log(error, "Error");
    }
  };

  return (
    <div className="exercise-list">
      {selectedExercises.length > 0 && (
        <div className="flex-y gap-small align-center">
          <div className="flex-x gap-small align-center bg-1 rounded padding-small w-100">
            <input
              ref={inputLanguageRef}
              type="text"
              placeholder={t("languagesCSV")}
              className="rounded padding-small w-100"
            />
            <SimpleButton
              extraClass=" scale-on-hover rounded"
              svg={svgs.iconCheck}
              title={t("translate")}
              action={handleTranslate}
            />
            <SimpleButton
              extraClass=" scale-on-hover rounded"
              svg={svgs.iconClose}
              title={t("cancel")}
              action={() => setSelectedExercises([])}
            />
          </div>
        </div>
      )}
      {exercises.map((ex, index) => (
        <div key={ex.slug + index} className="flex-y align-center">
          <ExerciseCard
            key={ex.slug + index}
            {...ex}
            closeSidebar={closeSidebar}
            mode={mode}
            handleSelect={handleSelect}
            selected={selectedExercises.includes(ex.slug)}
            syllabus={syllabus}
            getSidebar={getSidebar}
            getSyllabus={getSyllabus}
          />
          {mode === "creator" && (
            <AddExerciseButton
              prevExercise={exercises[index]}
              syllabus={syllabus}
            />
          )}
        </div>
      ))}
    </div>
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
  syllabus: Syllabus;
  getSidebar: () => Promise<any>;
  getSyllabus: () => Promise<void>;
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
  syllabus,
  getSidebar,
  getSyllabus,
}: IExerciseProps) {
  const { t } = useTranslation();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const {
    handlePositionChange,
    fetchExercises,
    getCurrentExercise,
    sidebar,
    language,
    token,
    config,
  } = useStore((state) => ({
    handlePositionChange: state.handlePositionChange,
    fetchExercises: state.fetchExercises,
    getCurrentExercise: state.getCurrentExercise,
    sidebar: state.sidebar,
    language: state.language,
    token: state.token,
    config: state.configObject,
  }));

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

  const index = title.split("-")[0];

  // Buscar la lección por slug (construido con id + title)
  const foundInSyllabus = syllabus?.lessons?.find((lesson) => {
    const lessonSlug = slugify(lesson.id + "-" + lesson.title);
    return lessonSlug === slug;
  });

  // Obtener el displayId para mostrar en lugar del id
  const displayIdToShow = foundInSyllabus?.displayId || index;

  const current = getCurrentExercise();
  const isCurrent = current.slug === slug;

  console.log(current, slug, isCurrent);

  return (
    <div
      className={`exercise-card  ${isCurrent ? "bg-2" : selected ? "bg-1" : "bg-white"
        }`}
      onClick={
        mode === "student"
          ? () => {
            eventBus.emit("position_change", {
              position: position,
            });
            closeSidebar();
          }
          : () => { }
      }
    >
      <div className="z-index-1 flex-x align-center gap-small">
        {mode === "creator" && selected && (
          <SimpleButton
            extraClass="padding-small margin-left-small"
            svg={svgs.checked}
            text=""
            title={t("deselect-exercise-tooltip")}
            action={() => handleSelect(slug)}
          />
        )}
        {mode === "creator" && !selected && (
          <SimpleButton
            extraClass="padding-small margin-left-small"
            svg={svgs.unchecked}
            text=""
            title={t("select-exercise-tooltip")}
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
          <div
            className="flex-x gap-small align-center w-100"
            onClick={() => {
              if (mode === "creator") {
                eventBus.emit("position_change", {
                  position: position,
                });
              }
            }}
          >
            <button className={`exercise-circle ${done ? "done" : ""}`}>
              <span>{cleanFloatString(displayIdToShow)}</span>
            </button>
            <span>{titlefy(sidebar?.[slug]?.[language] || title)}</span>
          </div>
        )}
      </div>

      <div className="flex-x align-center gap-small">
        {foundInSyllabus &&
          !foundInSyllabus.generated &&
          foundInSyllabus.status === "GENERATING" && (
            <>
              <Loader color="gray" extraClass="svg-blue" />
              {DEV_MODE && (
                <button
                  onClick={() => {
                    markLessonAsDone(
                      config.config.slug,
                      foundInSyllabus.id,
                      token
                    );
                  }}
                >
                  IS DONE
                </button>
              )}
            </>
          )}
        {foundInSyllabus &&
          !foundInSyllabus.generated &&
          foundInSyllabus.status === "PENDING" && (
            <SimpleButton
              extraClass="svg-gray"
              title={t("not-generated-yet")}
              svg={svgs.pause}
            />
          )}
        {graded && mode === "student" && (
          <SimpleButton
            svg={done ? svgs.checkIcon : svgs.blankCircle}
            text=""
          />
        )}
        {mode === "creator" &&
          (!foundInSyllabus ||
            (foundInSyllabus && foundInSyllabus.generated)) && (
            <>
              <SimpleButton
                extraClass=""
                svg={isEditing ? svgs.iconCheck : svgs.edit}
                text=""
                title={isEditing ? t("save-changes-tooltip") : t("edit-exercise-tooltip")}
                action={handleEdit}
              />
              <SimpleButton
                extraClass=""
                svg={isEditing ? svgs.iconClose : svgs.trash}
                text=""
                title={isEditing ? t("cancel-edit-tooltip") : t("delete-exercise-tooltip")}
                action={async () => {
                  if (isEditing) {
                    setIsEditing(false);
                    return;
                  }
                  const toastId = toast.loading(t("deletingExercise"));

                  try {
                    await deleteExercise(slug, token);
                    const currentExercise = getCurrentExercise();
                    if (currentExercise.slug === slug) {
                      handlePositionChange(0);
                    }
                    toast.success(t("exerciseDeleted"), { id: toastId });

                    await fetchExercises();
                    try {
                      await getSidebar();
                    } catch (e) {
                      console.error("Error fetching sidebar:", e);
                    }
                    try {
                      await getSyllabus();
                    } catch (e) {
                      console.error("Error fetching syllabus:", e);
                    }
                  } catch (error) {
                    toast.error(t("errorDeletingExercise"), {
                      id: toastId,
                    });
                    console.log(error);
                  }
                }}
                confirmationMessage={isEditing ? undefined : t("sure?")}
              />
            </>
          )}
      </div>
    </div>
  );
}
