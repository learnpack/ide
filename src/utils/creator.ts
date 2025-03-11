import axios from "axios";

export const LEARNPACK_LOCAL_URL = "http://localhost:3000";

export const createExercise = async (
  slug: string,
  readme: string,
  language: string
) => {
  try {
    const response = await axios.post(
      `${LEARNPACK_LOCAL_URL}/exercise/${slug}/create`,
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
    const response = await axios.delete(
      `${LEARNPACK_LOCAL_URL}/exercise/${slug}/delete`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    throw error;
  }
};

export const renameExercise = async (slug: string, newSlug: string) => {
  try {
    const response = await axios.put(
      `${LEARNPACK_LOCAL_URL}/actions/rename`,
      { slug, newSlug }
    );
    return response.data;
  } catch (error) {
    console.error("Error renaming exercise:", error);
    throw error;
  }
};
