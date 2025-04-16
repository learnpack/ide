import axios from "axios";
import { getParamsObject } from "./lib";

export const LEARNPACK_LOCAL_URL = "http://localhost:3000";

export const createExercise = async (
  slug: string,
  readme: string,
  language: string
) => {
  try {
    const courseSlug = getParamsObject().slug;
    const response = await axios.post(
      `${LEARNPACK_LOCAL_URL}/exercise/${slug}/create?slug=${courseSlug}`,
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
    const courseSlug = getParamsObject().slug;
    const response = await axios.delete(
      `${LEARNPACK_LOCAL_URL}/exercise/${slug}/delete?slug=${courseSlug}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    throw error;
  }
};

export const renameExercise = async (slug: string, newSlug: string) => {
  try {
    const courseSlug = getParamsObject().slug;
    const response = await axios.put(
      `${LEARNPACK_LOCAL_URL}/actions/rename?slug=${courseSlug}`,
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
