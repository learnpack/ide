import axios from "axios";

const LEARNPACK_URL = "http://localhost:3000";

export const createExercise = async (
  slug: string,
  readme: string,
  language: string
) => {
  try {
    const response = await axios.post(
      `${LEARNPACK_URL}/exercise/${slug}/create`,
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
      `${LEARNPACK_URL}/exercise/${slug}/delete`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    throw error;
  }
};
