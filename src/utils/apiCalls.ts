import axios from "axios";
import { RIGOBOT_HOST, BREATHECODE_HOST } from "./lib";

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
    throw error;
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

export async function getConsumables(token: string): Promise<any> {
  const url = `${BREATHECODE_HOST}/v1/payments/me/service/consumable?virtual=true`;

  const headers = {
    Authorization: `Token ${token}`,
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching consumables:", error);
    throw error;
  }
}

export async function useConsumable(
  breathecodeToken: string,
  consumableSlug:
    | "ai-conversation-message"
    | "ai-compilation" = "ai-conversation-message"
): Promise<boolean> {
  const url = `${BREATHECODE_HOST}/v1/payments/me/service/${consumableSlug}/consumptionsession`;

  const headers = {
    Authorization: `Token ${breathecodeToken}`,
  };

  try {
    const response = await axios.put(url, {}, { headers });

    if (response.status >= 200 && response.status < 300) {
      console.log(response.data);
      console.log(`Successfully consumed ${consumableSlug}`);
      return true;
    } else {
      console.error(`Request failed with status code: ${response.status}`);
      console.error(`Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.error(`Error consuming ${consumableSlug}:`, error);
    return false;
  }
}
