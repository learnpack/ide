import useStore from "../../../utils/store";
import { useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";
import toast from "react-hot-toast";

import { useTranslation } from "react-i18next";
import { Notifier } from "../../../managers/Notifier";

const rigoSvgString = `
<svg
      width="30"
      height="30"
      viewBox="0 0 24 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.4549 2.36911L17.93 1.40069L17.2413 0.129606C17.1479 -0.0432019 16.8817 -0.0432019 16.7883 0.129606L16.0996 1.40069L15.5936 2.33415H5.89392C5.12428 2.33415 4.46601 2.81711 4.19531 3.50085H19.7989C19.5707 2.92499 19.0677 2.49097 18.4549 2.36861V2.36911Z"
        fill="white"
      />
      <path
        d="M22.8283 4.43156H22.2655V4.25426C22.2655 2.67701 20.9839 1.39844 19.4031 1.39844H17.9308L18.4557 2.36686C19.0685 2.48922 19.5715 2.92274 19.7997 3.4991H4.19609C4.46679 2.81536 5.12505 2.3324 5.8947 2.3324H15.5939L16.0998 1.39894H4.59265C3.01191 1.39894 1.73034 2.67751 1.73034 4.25476V4.43206H1.16696C0.96269 4.43206 0.796875 4.59538 0.796875 4.79715V9.66722C0.796875 9.869 0.96269 10.0323 1.16696 10.0323H3.13127V10.2136C3.13127 10.3954 3.1947 10.5622 3.30009 10.6926C3.31507 10.7111 3.33105 10.729 3.34753 10.746C3.381 10.78 3.41746 10.811 3.45691 10.8379C3.51585 10.8784 3.58077 10.9108 3.6502 10.9328C3.71962 10.9548 3.79354 10.9668 3.86995 10.9668H10.5175L11.413 8.1664L11.8166 6.9038C11.8755 6.72001 12.1213 6.72001 12.1802 6.9038L12.5837 8.1664L13.4792 10.9668H20.1273C20.2422 10.9668 20.3506 10.9403 20.4475 10.8924C20.5014 10.8659 20.5514 10.8329 20.5973 10.7945C20.6338 10.764 20.6672 10.7295 20.6977 10.6926C20.7202 10.6646 20.7412 10.6351 20.7596 10.6042C20.8276 10.4903 20.8665 10.3565 20.8665 10.2136V10.0323H22.8283C23.0326 10.0323 23.1984 9.869 23.1984 9.66722V4.79665C23.1984 4.59488 23.0326 4.43156 22.8283 4.43156ZM7.56384 8.1659V9.34109C7.56384 9.59381 7.35507 9.79858 7.09736 9.79858C6.83964 9.79858 6.63088 9.59381 6.63088 9.34109V4.88855C6.63088 4.63583 6.83964 4.43106 7.09736 4.43106C7.35507 4.43106 7.56384 4.63583 7.56384 4.88855V8.1654V8.1659ZM17.3664 8.1659V9.34109C17.3664 9.59381 17.1576 9.79858 16.8999 9.79858C16.6422 9.79858 16.4335 9.59381 16.4335 9.34109V4.88855C16.4335 4.63583 16.6422 4.43106 16.8999 4.43106C17.1576 4.43106 17.3664 4.63583 17.3664 4.88855V8.1654V8.1659Z"
        fill="#080B16"
      />
      <path
        d="M13.4785 10.9664L12.583 8.16606L12.1795 6.90347C12.1205 6.71968 11.8748 6.71968 11.8159 6.90347L11.4123 8.16606L10.5168 10.9664H4.0625V12.1381C4.0625 13.1665 4.88209 14.0001 5.89346 14.0001H18.0999C19.1112 14.0001 19.9308 13.1665 19.9308 12.1381V10.9664H13.4785Z"
        fill="white"
      />
      <path
        d="M7.09929 4.438C6.84158 4.438 6.63281 4.64277 6.63281 4.89549V9.34803C6.63281 9.60075 6.84158 9.80552 7.09929 9.80552C7.35701 9.80552 7.56577 9.60075 7.56577 9.34803V4.89499C7.56577 4.64227 7.35701 4.4375 7.09929 4.4375V4.438Z"
        fill="#E95B17"
      />
      <path
        d="M16.8962 4.438C16.6385 4.438 16.4297 4.64277 16.4297 4.89549V9.34803C16.4297 9.60075 16.6385 9.80552 16.8962 9.80552C17.1539 9.80552 17.3626 9.60075 17.3626 9.34803V4.89499C17.3626 4.64227 17.1539 4.4375 16.8962 4.4375V4.438Z"
        fill="#0096CF"
      />
    </svg>
`;

const currentQuiz = {
  lastExecution: null,
};

export default function LessonContent() {
  const { currentContent, openLink, toastFromStatus, setRigoContext } =
    useStore((state) => ({
      currentContent: state.currentContent,
      openLink: state.openLink,
      toastFromStatus: state.toastFromStatus,
      setRigoContext: state.setRigoContext,
    }));

  const { t } = useTranslation();
  const lessonContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lessonContentDiv = lessonContentRef.current;
    if (!lessonContentDiv) return;

    const parents =
      lessonContentDiv.getElementsByClassName("contains-task-list");

    const anchors = lessonContentDiv.getElementsByTagName("a");
    const codes = lessonContentDiv.getElementsByTagName("code");
    // const checkboxes =
    // lessonContentDiv.getElementsByClassName("task-list-item");

    const handleClick = (event: any) => {
      event.preventDefault();
      openLink(event.target.href);
    };

    const handleCodeClick = (event: any) => {
      // Copy code text to clipboard
      const codeText = event.target.textContent;
      navigator.clipboard.writeText(codeText);
      toast.success(t("code-copied"));
    };

    const handleRigoClick = () => {
      const quizJson = JSON.stringify(currentQuiz, null, 2);
      // navigator.clipboard.writeText(quizJson);
      setRigoContext(quizJson);
    };

    const handleSubmit = () => {
      const quiz = Object.values(currentQuiz);

      let anyIncorrect = false;
      let correctAnswers = 0;

      const selections = quiz
        // @ts-ignore
        .filter((q) => Boolean(q && q.title))
        .map((q: any) => {
          const isCorrect = q.currentSelection === q.correctAnswer;
          if (!isCorrect) {
            anyIncorrect = true;
          } else {
            correctAnswers++;
          }
          return {
            question: q.title,
            answer: q.currentSelection,
            isCorrect,
          };
        });
      const totalQuestions = selections.length;

      const percentage = (correctAnswers / totalQuestions) * 100;
      const evaluation = {
        status: anyIncorrect ? "ERROR" : "SUCCESS",
        // correctAnswers,
        percentage,
        selections,
      };
      // Add the classname bg-success to the right answers task-list-items and the class bg-danger to the wrong ones
      for (let group of parents) {
        const previousElement = group.previousElementSibling;
        const groupTitle = previousElement?.textContent?.trim();

        toast.success(String(groupTitle));
        if (!groupTitle) return;
        const checkboxes = group.getElementsByClassName("task-list-item");
        const checkboxesArray = Array.from(checkboxes);
        checkboxesArray.forEach((checkbox: any) => {
          const inputElement = checkbox.querySelector("input[type='checkbox']");
          const isChecked = inputElement ? inputElement.checked : false;
          if (!isChecked) {
            checkbox.classList.remove("bg-success");
            checkbox.classList.remove("bg-fail");
            return;
          }

          const isCorrect =
            // @ts-ignore
            currentQuiz[groupTitle].correctAnswer ===
            checkbox.textContent.trim();

          if (isCorrect) {
            checkbox.classList.add("bg-success");
            console.log("correctAnswer", checkbox.textContent.trim());
          } else {
            checkbox.classList.add("bg-fail");
            console.log("wrong", checkbox.textContent.trim());
          }
        });
      }

      // @ts-ignore
      currentQuiz.lastExecution = { ...evaluation };
      if (anyIncorrect) {
        toastFromStatus("quiz-error");
        return;
      }
      toastFromStatus("quiz-success");

      Notifier.confetti();
    };

    const handleCheckboxClick = (event: any) => {
      // encontrar el task-list-item

      const checkbox = event.target.closest(".task-list-item");

      const parent = event.target.closest(".contains-task-list");
      const previousElement = parent.previousElementSibling;
      const groupTitle = previousElement?.textContent?.trim();
      // console.log(currentQuiz[groupTitle], "currentQuiz");
      // @ts-ignore
      currentQuiz[groupTitle].currentSelection = checkbox.textContent.trim();
      // Find all the checkboxes in the parent
      const checkboxes = parent.getElementsByClassName("task-list-item");
      // Uncheck all checkboxes
      for (let checkbox of checkboxes) {
        checkbox.classList.remove("bg-success");
        checkbox.classList.remove("bg-fail");
        const inputElement = checkbox.querySelector("input[type='checkbox']");
        if (inputElement) {
          inputElement.checked = false;
        }
      }

      // Check the clicked checkbox
      const inputElement = checkbox.querySelector("input[type='checkbox']");
      if (inputElement) {
        inputElement.checked = true;
      }
    };

    for (let anchor of anchors) {
      anchor.addEventListener("click", handleClick);
    }

    for (let code of codes) {
      code.addEventListener("dblclick", handleCodeClick);
      code.title = t("double-click-to-copy");
    }

    let counter = 0;
    for (let group of parents) {
      const checkboxes = group.getElementsByClassName("task-list-item");
      const previousElement = group.previousElementSibling;
      const groupTitle = previousElement?.textContent?.trim();

      const checkboxesArray = Array.from(checkboxes);
      let correctAnswer = "";

      // @ts-ignore
      currentQuiz[groupTitle] = {
        title: groupTitle,
        totalQuestions: checkboxes.length,
        checkboxes: checkboxesArray.map((checkbox: any) => {
          const inputElement = checkbox.querySelector("input[type='checkbox']");
          const isChecked = inputElement ? inputElement.checked : false;
          if (isChecked) {
            correctAnswer = checkbox.textContent.trim();
          }
          inputElement.cheched = false;
          return {
            text: checkbox.textContent.trim(),
            isCorrect: inputElement ? inputElement.checked : false,
          };
        }),
        correctAnswer: correctAnswer,
      };

      // Uncheck all checkboxes for the current group
      checkboxesArray.forEach((checkbox: any) => {
        const inputElement = checkbox.querySelector("input[type='checkbox']");
        checkbox.addEventListener("click", handleCheckboxClick);
        if (inputElement) {
          inputElement.checked = false;
        }
      });

      if (counter === parents.length - 1) {

        // Get the last group parent element
        const lastGroupParent = group.parentElement;

        const quizButtonsContainer = document.createElement("div");
        quizButtonsContainer.className = "quiz-buttons-container";
        const quizButton = document.createElement("button");
        const rigoButton = document.createElement("button");

        const textSpan = document.createElement("span");
        textSpan.textContent = t("ask-rigo-for-a-hint");

        const svgSpan = document.createElement("span");
        // @ts-ignore
        svgSpan.innerHTML = rigoSvgString;

        rigoButton.appendChild(textSpan);
        rigoButton.appendChild(svgSpan);
        quizButton.textContent = t("submit-quiz");

        quizButton.className = "quiz-button my-2 active-on-hover";
        rigoButton.className = "quiz-button my-2 active-on-hover";
        quizButton.addEventListener("click", handleSubmit);
        rigoButton.addEventListener("click", handleRigoClick);

        // Append the buttons container after the last group
        if (lastGroupParent) {
          lastGroupParent.appendChild(quizButtonsContainer);
          quizButtonsContainer.appendChild(quizButton);
          quizButtonsContainer.appendChild(rigoButton);
        }
      }

      counter++;
    }

    return () => {
      for (let anchor of anchors) {
        anchor.removeEventListener("click", handleClick);
      }
      for (let code of codes) {
        code.removeEventListener("dblclick", handleCodeClick);
      }
      for (let group of parents) {
        const checkboxes = group.getElementsByClassName("task-list-item");
        for (let checkbox of checkboxes) {
          checkbox.removeEventListener("click", handleCheckboxClick);
        }
      }
      Object.keys(currentQuiz).forEach((key) => {
        // @ts-ignore
        delete currentQuiz[key];
      });

      // Remove the quiz-button if it exists
      const quizButtonsContainer = document.querySelector(
        ".quiz-buttons-container"
      );
      if (quizButtonsContainer) {
        quizButtonsContainer.remove();
      }
    };
  }, [currentContent]);

  return (
    <div
      className="lesson-content"
      ref={lessonContentRef}
      dangerouslySetInnerHTML={{
        __html: convertMarkdownToHTML(currentContent),
      }}
    ></div>
  );
}
