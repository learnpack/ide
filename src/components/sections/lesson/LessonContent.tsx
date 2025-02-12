// import useStore from "../../../utils/store";
// import "highlight.js/styles/atom-one-dark.css";
// import { useEffect, useRef } from "react";
// import hljs from "highlight.js";
// import { convertMarkdownToHTML, hashText } from "../../../utils/lib";
// import toast from "react-hot-toast";

// import { useTranslation } from "react-i18next";
// import { Notifier } from "../../../managers/Notifier";

// // const failSvgString = `
// // <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
// // <path d="M5.875 5.14453L9.8125 1.20703C10.0625 0.957031 10.0625 0.582031 9.8125 0.332031C9.5625 0.0820313 9.1875 0.0820313 8.9375 0.332031L5 4.26953L1.0625 0.332031C0.8125 0.0820313 0.4375 0.0820313 0.1875 0.332031C-0.0624999 0.582031 -0.0624999 0.957031 0.1875 1.20703L4.125 5.14453L0.1875 9.08203C0.0625001 9.20703 0 9.33203 0 9.51953C0 9.89453 0.25 10.1445 0.625 10.1445C0.8125 10.1445 0.9375 10.082 1.0625 9.95703L5 6.01953L8.9375 9.95703C9.0625 10.082 9.1875 10.1445 9.375 10.1445C9.5625 10.1445 9.6875 10.082 9.8125 9.95703C10.0625 9.70703 10.0625 9.33203 9.8125 9.08203L5.875 5.14453Z" fill="#EB5757"/>
// // </svg>
// // `;

// const rigoSvgString = `
// <svg
//       width="30"
//       height="30"
//       viewBox="0 0 24 14"
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <path
//         d="M18.4549 2.36911L17.93 1.40069L17.2413 0.129606C17.1479 -0.0432019 16.8817 -0.0432019 16.7883 0.129606L16.0996 1.40069L15.5936 2.33415H5.89392C5.12428 2.33415 4.46601 2.81711 4.19531 3.50085H19.7989C19.5707 2.92499 19.0677 2.49097 18.4549 2.36861V2.36911Z"
//         fill="white"
//       />
//       <path
//         d="M22.8283 4.43156H22.2655V4.25426C22.2655 2.67701 20.9839 1.39844 19.4031 1.39844H17.9308L18.4557 2.36686C19.0685 2.48922 19.5715 2.92274 19.7997 3.4991H4.19609C4.46679 2.81536 5.12505 2.3324 5.8947 2.3324H15.5939L16.0998 1.39894H4.59265C3.01191 1.39894 1.73034 2.67751 1.73034 4.25476V4.43206H1.16696C0.96269 4.43206 0.796875 4.59538 0.796875 4.79715V9.66722C0.796875 9.869 0.96269 10.0323 1.16696 10.0323H3.13127V10.2136C3.13127 10.3954 3.1947 10.5622 3.30009 10.6926C3.31507 10.7111 3.33105 10.729 3.34753 10.746C3.381 10.78 3.41746 10.811 3.45691 10.8379C3.51585 10.8784 3.58077 10.9108 3.6502 10.9328C3.71962 10.9548 3.79354 10.9668 3.86995 10.9668H10.5175L11.413 8.1664L11.8166 6.9038C11.8755 6.72001 12.1213 6.72001 12.1802 6.9038L12.5837 8.1664L13.4792 10.9668H20.1273C20.2422 10.9668 20.3506 10.9403 20.4475 10.8924C20.5014 10.8659 20.5514 10.8329 20.5973 10.7945C20.6338 10.764 20.6672 10.7295 20.6977 10.6926C20.7202 10.6646 20.7412 10.6351 20.7596 10.6042C20.8276 10.4903 20.8665 10.3565 20.8665 10.2136V10.0323H22.8283C23.0326 10.0323 23.1984 9.869 23.1984 9.66722V4.79665C23.1984 4.59488 23.0326 4.43156 22.8283 4.43156ZM7.56384 8.1659V9.34109C7.56384 9.59381 7.35507 9.79858 7.09736 9.79858C6.83964 9.79858 6.63088 9.59381 6.63088 9.34109V4.88855C6.63088 4.63583 6.83964 4.43106 7.09736 4.43106C7.35507 4.43106 7.56384 4.63583 7.56384 4.88855V8.1654V8.1659ZM17.3664 8.1659V9.34109C17.3664 9.59381 17.1576 9.79858 16.8999 9.79858C16.6422 9.79858 16.4335 9.59381 16.4335 9.34109V4.88855C16.4335 4.63583 16.6422 4.43106 16.8999 4.43106C17.1576 4.43106 17.3664 4.63583 17.3664 4.88855V8.1654V8.1659Z"
//         fill="#080B16"
//       />
//       <path
//         d="M13.4785 10.9664L12.583 8.16606L12.1795 6.90347C12.1205 6.71968 11.8748 6.71968 11.8159 6.90347L11.4123 8.16606L10.5168 10.9664H4.0625V12.1381C4.0625 13.1665 4.88209 14.0001 5.89346 14.0001H18.0999C19.1112 14.0001 19.9308 13.1665 19.9308 12.1381V10.9664H13.4785Z"
//         fill="white"
//       />
//       <path
//         d="M7.09929 4.438C6.84158 4.438 6.63281 4.64277 6.63281 4.89549V9.34803C6.63281 9.60075 6.84158 9.80552 7.09929 9.80552C7.35701 9.80552 7.56577 9.60075 7.56577 9.34803V4.89499C7.56577 4.64227 7.35701 4.4375 7.09929 4.4375V4.438Z"
//         fill="#E95B17"
//       />
//       <path
//         d="M16.8962 4.438C16.6385 4.438 16.4297 4.64277 16.4297 4.89549V9.34803C16.4297 9.60075 16.6385 9.80552 16.8962 9.80552C17.1539 9.80552 17.3626 9.60075 17.3626 9.34803V4.89499C17.3626 4.64227 17.1539 4.4375 16.8962 4.4375V4.438Z"
//         fill="#0096CF"
//       />
//     </svg>
// `;

// type TQuizSubmissionSelection = {
//   question: string;
//   answer: string;
//   isCorrect: boolean;
// };

// type TQuizSubmission = {
//   submittedAt: number;
//   selections: TQuizSubmissionSelection[];
// };

// type TQuiz = {
//   hash: string;
//   attempts: TQuizSubmission[];
//   [key: string]: any;
// };

// export default function LessonContent() {
//   const {
//     currentContent,
//     openLink,
//     toastFromStatus,
//     setRigoContext,
//     toggleRigo,
//     isRigoOpened,
//     maxQuizRetries,
//     registerTelemetryEvent,
//   } = useStore((state) => ({
//     currentContent: state.currentContent,
//     openLink: state.openLink,
//     toastFromStatus: state.toastFromStatus,
//     setRigoContext: state.setRigoContext,
//     toggleRigo: state.toggleRigo,
//     isRigoOpened: state.isRigoOpened,
//     maxQuizRetries: state.maxQuizRetries,
//     registerTelemetryEvent: state.registerTelemetryEvent,
//   }));

//   const { t } = useTranslation();

//   const quizzesRef = useRef<TQuiz[]>([]);
//   const lessonContentRef = useRef<HTMLDivElement>(null);

//   const handleCheckboxClick = (event: any) => {
//     const checkbox = event.target.closest(".task-list-item");
//     const parent = event.target.closest(".contains-task-list");
//     const previousElement = parent.previousElementSibling;
//     const groupTitle = previousElement?.textContent?.trim();

//     const quiz = quizzesRef.current.find((q) => q[groupTitle]);

//     if (!quiz) return;

//     if (quiz.attempts.length >= maxQuizRetries) {
//       toast.error(t("max-quiz-retries-reached"));
//       return;
//     }

//     // Update the selected answer
//     quiz[groupTitle].currentSelection = checkbox.textContent.trim();
//     const checkboxes = parent.getElementsByClassName("task-list-item");

//     // Uncheck all checkboxes
//     for (let checkbox of checkboxes) {
//       checkbox.classList.remove("success");
//       checkbox.classList.remove("fail");
//       const inputElement = checkbox.querySelector("input[type='checkbox']");
//       if (inputElement) {
//         inputElement.checked = false;
//       }
//     }

//     // Check the clicked checkbox
//     const inputElement = checkbox.querySelector("input[type='checkbox']");
//     if (inputElement) {
//       inputElement.checked = true;
//     }
//   };

//   const handleSubmit = (position: number) => {
//     const listsContainingTasks = lessonContentRef.current?.querySelectorAll(
//       "ul:has(.contains-task-list), ol:has(.contains-task-list)"
//     );
//     if (!listsContainingTasks) return;

//     const list = listsContainingTasks[position];
//     const currentQuiz = quizzesRef.current[position];

//     // Number of attempts
//     const attempts = currentQuiz.attempts.length;
//     if (attempts >= maxQuizRetries) {
//       toast.error(t("max-quiz-retries-reached"));
//       return;
//     }

//     const quizQuestions = Object.values(currentQuiz);

//     let anyIncorrect = false;
//     let correctAnswers = 0;

//     const selections = quizQuestions
//       // @ts-ignore
//       .filter((question) => Boolean(question && question.title))
//       .map((question: any) => {
//         const isCorrect = question.currentSelection === question.correctAnswer;
//         if (!isCorrect) {
//           anyIncorrect = true;
//         } else {
//           correctAnswers++;
//         }
//         return {
//           question: question.title,
//           answer: question.currentSelection,
//           isCorrect,
//         };
//       });

//     const totalQuestions = selections.length;

//     const percentage = (correctAnswers / totalQuestions) * 100;
//     const evaluation = {
//       status: anyIncorrect ? "ERROR" : "SUCCESS",
//       percentage,
//       selections,
//       quizHash: currentQuiz.hash,
//       submittedAt: new Date().getTime(),
//     };
//     registerTelemetryEvent("quiz_submission", evaluation);

//     const quizQuestionParents =
//       list.getElementsByClassName("contains-task-list");

//     for (let group of quizQuestionParents) {
//       const previousElement = group.previousElementSibling;
//       const groupTitle = previousElement?.textContent?.trim();

//       if (!groupTitle) return;
//       const checkboxes = group.getElementsByClassName("task-list-item");
//       const checkboxesArray = Array.from(checkboxes);
//       checkboxesArray.forEach((checkbox: any) => {
//         const inputElement = checkbox.querySelector("input[type='checkbox']");
//         const isChecked = inputElement ? inputElement.checked : false;
//         if (!isChecked) {
//           checkbox.classList.remove("success");
//           checkbox.classList.remove("fail");
//           return;
//         }

//         const isCorrect =
//           // @ts-ignore
//           currentQuiz[groupTitle].correctAnswer === checkbox.textContent.trim();

//         if (isCorrect) {
//           checkbox.classList.add("success");
//           // Add an svg inside the checkbox

//           // console.log("correctAnswer", checkbox.textContent.trim());
//         } else {
//           checkbox.classList.add("fail");
//         }
//       });
//     }

//     // @ts-ignore
//     quizzesRef.current[position].lastExecution = { ...evaluation };
//     quizzesRef.current[position].attempts.push(evaluation);
//     if (anyIncorrect) {
//       toastFromStatus("quiz-error");
//       return;
//     }
//     toastFromStatus("quiz-success");

//     Notifier.confetti();
//   };

//   const handleArchorClick = (event: any) => {
//     event.preventDefault();
//     openLink(event.target.href);
//   };

//   const handleCodeClick = (event: any) => {
//     // Copy code text to clipboard
//     const codeText = event.target.textContent;
//     navigator.clipboard.writeText(codeText);
//     toast.success(t("code-copied"));
//   };

//   const handleRigoClick = (position: number) => {
//     const quizJson = JSON.stringify(quizzesRef.current[position], null, 2);

//     setRigoContext({
//       context: quizJson,
//       userMessage: "",
//     });
//     if (!isRigoOpened) {
//       toggleRigo();
//     }
//   };

//   useEffect(() => {
//     const lessonContentDiv = lessonContentRef.current;
//     if (!lessonContentDiv) return;

//     const listsContainingTasks = lessonContentDiv.querySelectorAll(
//       "ul:has(.contains-task-list), ol:has(.contains-task-list)"
//     );

//     const anchors = lessonContentDiv.getElementsByTagName("a");
//     const codes = lessonContentDiv.getElementsByTagName("code");

//     for (let anchor of anchors) {
//       anchor.addEventListener("click", handleArchorClick);
//     }

//     for (let code of codes) {
//       code.addEventListener("dblclick", handleCodeClick);
//       code.title = t("double-click-to-copy");
//     }

//     let _quizzes: TQuiz[] = [];
//     for (let list of listsContainingTasks) {
//       const listPosition = Array.from(listsContainingTasks).indexOf(list);
//       let quiz: TQuiz = {
//         hash: "",
//         attempts: [],
//       };
//       let counter = 0;
//       const quizQuestionParents =
//         list.getElementsByClassName("contains-task-list");

//       let concatenatedTitles = "";
//       for (let group of quizQuestionParents) {
//         const checkboxes = group.getElementsByClassName("task-list-item");
//         const previousElement = group.previousElementSibling;
//         const groupTitle = previousElement?.textContent?.trim();
//         if (!groupTitle) {
//           console.log("No group title found for group", group);
//           continue;
//         }
//         concatenatedTitles += groupTitle;
//         const checkboxesArray = Array.from(checkboxes);
//         let correctAnswer = "";

//         // @ts-ignore
//         quiz[groupTitle] = {
//           title: groupTitle,
//           checkboxes: checkboxesArray.map((checkbox: any) => {
//             const inputElement = checkbox.querySelector(
//               "input[type='checkbox']"
//             );
//             const isChecked = inputElement ? inputElement.checked : false;
//             if (isChecked) {
//               correctAnswer = checkbox.textContent.trim();
//             }
//             inputElement.cheched = false;
//             return {
//               text: checkbox.textContent.trim(),
//               isCorrect: inputElement ? inputElement.checked : false,
//             };
//           }),
//           correctAnswer: correctAnswer,
//         };

//         // Uncheck all checkboxes for the current group
//         checkboxesArray.forEach((checkbox: any) => {
//           const inputElement = checkbox.querySelector("input[type='checkbox']");
//           checkbox.addEventListener("click", handleCheckboxClick);
//           if (inputElement) {
//             inputElement.checked = false;
//           }
//         });

//         if (counter === quizQuestionParents.length - 1) {
//           // Get the last group parent element
//           const lastGroupParent = group.parentElement;

//           const quizButtonsContainer = document.createElement("div");
//           quizButtonsContainer.className = "quiz-buttons-container";
//           const quizButton = document.createElement("button");
//           const rigoButton = document.createElement("button");

//           const textSpan = document.createElement("span");
//           textSpan.textContent = t("ask-rigo-for-a-hint");

//           const svgSpan = document.createElement("span");
//           // @ts-ignore
//           svgSpan.innerHTML = rigoSvgString;

//           rigoButton.appendChild(textSpan);
//           rigoButton.appendChild(svgSpan);
//           quizButton.textContent = t("submit-quiz");

//           quizButton.className = "quiz-button my-2 active-on-hover";
//           rigoButton.className = "quiz-button my-2 active-on-hover";
//           quizButton.addEventListener("click", () =>
//             handleSubmit(listPosition)
//           );
//           rigoButton.addEventListener("click", () =>
//             handleRigoClick(listPosition)
//           );

//           if (lastGroupParent) {
//             quizButtonsContainer.appendChild(quizButton);
//             quizButtonsContainer.appendChild(rigoButton);
//             group.insertAdjacentElement("afterend", quizButtonsContainer);
//           }
//         }

//         counter++;
//       }
//       hashText(concatenatedTitles, (hash) => {
//         quiz.hash = hash;
//         _quizzes.push(quiz);
//       });
//     }
//     quizzesRef.current = _quizzes;

//     setTimeout(() => {
//       hljs.highlightAll();
//     }, 50);
//     return () => {
//       for (let anchor of anchors) {
//         anchor.removeEventListener("click", handleArchorClick);
//       }
//       for (let code of codes) {
//         code.removeEventListener("dblclick", handleCodeClick);
//       }
//       for (let list of listsContainingTasks) {
//         const quizQuestionParents =
//           list.getElementsByClassName("contains-task-list");
//         for (let group of quizQuestionParents) {
//           const checkboxes = group.getElementsByClassName("task-list-item");
//           for (let checkbox of checkboxes) {
//             checkbox.removeEventListener("click", handleCheckboxClick);
//           }
//         }
//       }

//       // Remove the quiz-button if it exists
//       const quizButtonsContainer = document.querySelector(
//         ".quiz-buttons-container"
//       );
//       if (quizButtonsContainer) {
//         quizButtonsContainer.remove();
//       }
//     };
//   }, [currentContent]);

//   return (
//     <div
//       className="lesson-content"
//       ref={lessonContentRef}
//       dangerouslySetInnerHTML={{
//         __html: convertMarkdownToHTML(currentContent),
//       }}
//     ></div>
//   );
// }
