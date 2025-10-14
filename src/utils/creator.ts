import axios from "axios";
import { DEV_MODE, getSlugFromPath } from "./lib";

export const LEARNPACK_LOCAL_URL = "http://localhost:3000";

export const createExercise = async (
  slug: string,
  readme: string,
  language: string
) => {
  try {
    const courseSlug = getSlugFromPath();
    const response = await axios.post(
      `${
        DEV_MODE ? "http://localhost:3000" : ""
      }/exercise/${slug}/create?slug=${courseSlug}`,
      {
        title: slug,
        readme,
        language,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating exercise:", error);
    throw error;
  }
};

export const deleteExercise = async (slug: string) => {
  try {
    const courseSlug = getSlugFromPath();
    const response = await axios.delete(
      `${
        DEV_MODE ? "http://localhost:3000" : ""
      }/exercise/${slug}/delete?slug=${courseSlug}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    throw error;
  }
};

export const renameExercise = async (slug: string, newSlug: string) => {
  try {
    const courseSlug = getSlugFromPath();
    const response = await axios.put(
      `${
        DEV_MODE ? "http://localhost:3000" : ""
      }/actions/rename?slug=${courseSlug}`,
      {
        slug,
        newSlug,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error renaming exercise:", error);
    throw error;
  }
};

export const publishTutorial = async (
  breathecodeToken: string,
  rigoToken: string
) => {
  try {
    const slug = getSlugFromPath();
    const headers = {
      "x-breathecode-token": breathecodeToken,
      "x-rigo-token": rigoToken,
    };
    const response = await axios.post(
      `${DEV_MODE ? "http://localhost:3000" : ""}/actions/publish/${slug}`,
      {
        categoryId: "663296363296363296363296",
        academyId: "663296363296363296363296",
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error publishing tutorial:", error);
    throw error;
  }
};

export const deleteTutorial = async (
  breathecodeToken: string,
  rigoToken: string
) => {
  try {
    const slug = getSlugFromPath();
    const headers = {
      "x-breathecode-token": breathecodeToken,
      "x-rigo-token": rigoToken,
    };
    const response = await axios.delete(
      `${DEV_MODE ? "http://localhost:3000" : ""}/packages/${slug}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting tutorial:", error);
    throw error;
  }
};

// app.post(
//   "/actions/continue-generating/:courseSlug/:position",
//   async (req, res) => {
//     const { courseSlug, position } = req.params
//     const rigoToken = req.header("x-rigo-token")

//     if (!rigoToken) {
//       return res.status(400).json({
//         error: "Rigo token is required. x-rigo-token header is missing",
//       })
//     }
//     const syllabus = await bucket.file(
//       `courses/${courseSlug}/.learn/initialSyllabus.json`
//     )
//     const [content] = await syllabus.download()
//     const syllabusJson: Syllabus = JSON.parse(content.toString())

//     const exercise = syllabusJson.lessons[parseInt(position)]

//     // previous exercise
//     let previousReadme = ""
//     const previousExercise = syllabusJson.lessons[parseInt(position) - 1]
//     if (previousExercise) {
//       // Get the readme of the previous exercise
//       const exSlug = slugify(
//         previousExercise.id + "-" + previousExercise.title
//       )
//       // llist the files un
//       const [files] = await bucket.getFiles({
//         prefix: `courses/${courseSlug}/exercises/${exSlug}/README`,
//       })
//       // select any README
//       const readmeFiles = files.map((f) => f.name)
//       const readmeFile = readmeFiles.find((f) => f.includes("README"))
//       if (readmeFile) {
//         const [content] = await bucket.file(readmeFile).download()
//         previousReadme = content.toString()
//       }
//     }

//     await startExerciseGeneration(
//       bucket,
//       rigoToken,
//       syllabusJson.lessons,
//       syllabusJson.courseInfo,
//       exercise,
//       `courses/${courseSlug}`,
//       courseSlug,
//       syllabusJson.courseInfo.purpose,
//       previousReadme
//     )
//   }
// )

export const continueGenerating = async (
  courseSlug: string,
  lessonId: string,
  feedback: string,
  mode: "next-three" | "continue-with-all",
  rigoToken: string
) => {
  const headers = {
    "x-rigo-token": rigoToken,
  };
  
  // Add random 6-digit number to feedback to avoid cache issues
  const randomCacheEvict = Math.floor(100000 + Math.random() * 900000);
  const feedbackWithCacheEvict = feedback + `-${randomCacheEvict}`;
  
  const response = await axios.post(
    `${
      DEV_MODE ? "http://localhost:3000" : ""
    }/actions/continue-generating/${courseSlug}/${lessonId}`,
    { lessonId, feedback: feedbackWithCacheEvict, mode },
    { headers }
  );
  return response.data;
};

export const markLessonAsDone = async (
  courseSlug: string,
  lessonId: string,
  rigoToken: string
) => {
  const headers = {
    "x-rigo-token": rigoToken,
  };
  const response = await axios.post(
    `${
      DEV_MODE ? "http://localhost:3000" : ""
    }/actions/mark-as-done/${courseSlug}/${lessonId}`,
    {},
    { headers }
  );
  return response.data;
};

export const generateCodeChallenge = async (
  codeChallenge: string,
  lessonContent: string,
  exercisePosition: number,
  rigoToken: string,
  courseSlug: string
) => {
  const headers = {
    "x-rigo-token": rigoToken,
    "Content-Type": "application/json",
  };

  const response = await axios.post(
    `${DEV_MODE ? "http://localhost:3000" : ""}/actions/generate-code-challenge`,
    {
      code_challenge: codeChallenge,
      lesson_content: lessonContent,
      exercise_position: exercisePosition,
      course_slug: courseSlug,
    },
    { headers }
  );
  return response.data;
};


export const generateImageLearnPack = async (
  courseSlug: string,
  image: { url: string; alt: string },
  rigoToken: string
) => {

  const headers = {
    "x-rigo-token": rigoToken,
  };
  const response = await axios.post(
    `${
      DEV_MODE ? "http://localhost:3000" : ""
    }/actions/generate-image/${courseSlug}`,
    { image },
    { headers }
  );
  return response.data;
};

export const deleteFile = async (exerciseSlug: string, filename: string) => {
  try {
    const courseSlug = getSlugFromPath();
    const response = await axios.delete(
      `${
        DEV_MODE ? "http://localhost:3000" : ""
      }/courses/${courseSlug}/exercises/${exerciseSlug}/file/${filename}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
