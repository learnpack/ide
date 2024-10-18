import axios from 'axios';
import { RIGOBOT_HOST } from "./lib";

export const getSession = async (token: string, slug: string) => {
  const url = `${RIGOBOT_HOST}/v1/learnpack/session/?slug=${slug}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${token}`,
        // "Content-Type": "application/json", // Not needed for GET requests
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching session:", error);
    throw error; // Rethrow the error for further handling
  }
};

export const updateSession = async (
  token: string,
  tab_hash: string,
  package_slug: string,
  config_json: object | null,
  session_key: string
) => {
  const url = `${RIGOBOT_HOST}/v1/learnpack/session/${session_key}/`;

  const body = {
    tab_hash,
    config_json,
    package_slug,
  };

  try {
    const response = await axios.put(url, body, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Session updated!");
    
    return response.data;
  } catch (error) {
    console.error("Error updating session:", error);
    throw error; // Rethrow the error for further handling
  }
};

export const createSession = async (
  token: string,
  tab_hash: string,
  package_slug: string,
  config_json: object | null
) => {
  const url = `${RIGOBOT_HOST}/v1/learnpack/session/`;

  const body = {
    tab_hash,
    config_json,
    package_slug,
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error; // Rethrow the error for further handling
  }
};
