import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { useRef, useState } from "react";
import { DEV_MODE, getSlugFromPath } from "../../../utils/lib";
import toast from "react-hot-toast";

// app.post("/actions/continue-course/:courseSlug", async (req, res) => {
//   console.log("POST /actions/continue-course/:courseSlug")
//   const { courseSlug } = req.params

//   const { feedback }: { feedback: string } = req.body

//   const rigoToken = req.header("x-rigo-token")
//   const bcToken = req.header("x-breathecode-token")
//   if (!rigoToken || !bcToken) {
//     return res.status(400).json({ error: "Missing tokens" })
//   }

//   const syllabus = await bucket.file(
//     `courses/${courseSlug}/.learn/initialSyllabus.json`
//   )
//   const [content] = await syllabus.download()
//   const syllabusJson: Syllabus = JSON.parse(content.toString())
//   const notGeneratedLessons = syllabusJson.lessons.filter(
//     (lesson) => !lesson.generated
//   )

//   const lastGeneratedLesson = findLast(
//     syllabusJson.lessons,
//     (lesson) => lesson.generated ?? false
//   )

//   console.log("ABout to generate", notGeneratedLessons.length, "lessons")
//   console.log("Last generated lesson", lastGeneratedLesson)

//   let lastResult: string = JSON.stringify(lastGeneratedLesson ?? {})
//   lastResult += `\n\nThe user provided this feedback in relation to the course: ${feedback}`

//   for (const lesson of notGeneratedLessons) {
//     lastResult = await processExercise(
//       bucket,
//       rigoToken,
//       syllabusJson.lessons,
//       syllabusJson.courseInfo,
//       lesson,
//       `courses/${courseSlug}`,
//       slugify(syllabusJson.courseInfo.title),
//       syllabusJson.courseInfo.purpose,
//       lastResult
//     )
//     lastResult += `\n\nThe user provided this feedback in relation to the course: ${feedback}`
//   }

//   return res.json({
//     message: "Course continued",
//     slug: slugify(syllabusJson.courseInfo.title),
//   })
// })

export const SyllabusFeedbackModal = () => {
  const { t } = useTranslation();

  const [showTextarea, setShowTextArea] = useState(false);
  const textareaRef = useRef<string>("");

  const { setOpenedModals, token, bc_token } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    token: state.token,
    bc_token: state.bc_token,
  }));

  const continueCourse = () => {
    const courseSlug = getSlugFromPath();
    const endpoint = `${
      DEV_MODE ? "http://localhost:3000" : ""
    }/actions/continue-course/${courseSlug}`;
    // toast.success("FEEDBACL: " + textareaRef.current);
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rigo-token": token,
        "x-breathecode-token": bc_token,
      },
      body: JSON.stringify({ feedback: textareaRef.current }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Course continued:", data);
        // setOpenedModals({ syllabusFeedback: false });
      })
      .catch((error) => {
        console.error("Error continuing course:", error);
      });
  };

  return (
    <Modal
      outsideClickHandler={() => {
        toast.error(t("pleaseSelectAnOption"));
      }}
    >
      <h3 className="d-flex big-svg align-center gap-small bg-2 rounded padding-small">
        {svgs.rigoSoftBlue} {t("howWasTheTutorialSoFar")}
      </h3>
      <p>{t("nextGenerationsDescription")}</p>
      {showTextarea && (
        <div>
          <textarea
            autoFocus
            className="w-100 rounded padding-small textarea"
            placeholder={t("feedbackPlaceholder")}
            defaultValue={""}
            rows={2}
            onChange={(e) => {
              textareaRef.current = e.target.value;
            }}
          />
          <div className="flex-x gap-small justify-center">
            <SimpleButton
              text={t("sendAndGenerate")}
              extraClass="pill bg-blue-rigo big text-white"
              action={() => {
                if (textareaRef.current.trim() === "") {
                  toast.error(t("pleaseWriteSomething"));
                  return;
                }
                continueCourse();
              }}
            />
            <SimpleButton
              text={t("cancel")}
              extraClass="pill bg-gray big "
              action={() => {
                setShowTextArea(false);
              }}
            />
          </div>
        </div>
      )}
      {!showTextarea && (
        <div className="flex-x gap-small justify-center wrap-wrap">
          <SimpleButton
            text={t("idontLikeSomething")}
            extraClass="pill bg-blue-rigo text-white big"
            action={() => {
              setShowTextArea(true);
            }}
          />
          <SimpleButton
            text={t("everythingIsGreat")}
            extraClass="pill color-blue-rigo bg-1 rounded text-blue border-blue big"
            action={() => {
              continueCourse();
              setOpenedModals({ syllabusFeedback: false });
            }}
          />
        </div>
      )}
    </Modal>
  );
};
