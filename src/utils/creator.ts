import axios from "axios";
import { getSlugFromPath } from "./lib";

export const LEARNPACK_LOCAL_URL = "http://localhost:3000";

export const createExercise = async (
  slug: string,
  readme: string,
  language: string
) => {
  try {
    const courseSlug = getSlugFromPath();
    const response = await axios.post(
      `/exercise/${slug}/create?slug=${courseSlug}`,
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
      `/exercise/${slug}/delete?slug=${courseSlug}`
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
    const response = await axios.put(`/actions/rename?slug=${courseSlug}`, {
      slug,
      newSlug,
    });
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
      `/actions/publish/${slug}`,
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
