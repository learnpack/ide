// import { useEffect } from "react";
import axios from "axios";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { DEV_MODE } from "../../../utils/lib";

// app.post(
//     "/check-latex/:courseSlug/:exerciseSlug/:lang",
//     async (req, res) => {
//       const { courseSlug, exerciseSlug, lang } = req.params

//       const rigoToken = req.header("x-rigo-token")

//       if (!rigoToken) {
//         return res.status(400).json({ error: "Missing tokens" })
//       }

//       const exercise = await bucket.file(
//         `courses/${courseSlug}/exercises/${exerciseSlug}/README.${lang}.md`
//       )
//       const [content] = await exercise.download()
//       const headers = {
//         Authorization: `Token ${rigoToken}`,
//       }
//       const response = await axios.post(
//         `${RIGOBOT_HOST}/v1/prompting/completion/60865/`,
//         {
//           prompt: content.toString(),
//         }
//       )
//       console.log(response.data, "RESPONSE from Rigobot")
//       res.json({
//         message: "Exercise downloaded",
//         completion: response.data,
//         exercise: content.toString(),
//       })
//     }
//   )

export const TestLatex = () => {
  const configObject = useStore((state) => state.configObject);
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);
  const token = useStore((state) => state.token);
  const language = useStore((state) => state.language);

  const testLatex = async () => {
    console.log("test", token, configObject?.config?.slug, language);
    const bod = {
      prompt: "Hello, world!",
    };
    const exercise = getCurrentExercise();
    const response = await axios.post(
      `${DEV_MODE ? "http://localhost:3000" : ""}/check-latex/${
        configObject?.config?.slug
      }/${exercise?.slug}/${language}`,
      bod,
      { headers: { "x-rigo-token": token } }
    );
    console.log(response.data, "RESPONSE from API");
  };

  return (
    <div>
      <SimpleButton
        extraClass="bg-danger padding-small rounded"
        text="Test $"
        action={testLatex}
      />
    </div>
  );
};
