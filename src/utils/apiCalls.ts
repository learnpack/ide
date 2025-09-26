import axios from "axios";
import { RIGOBOT_HOST, BREATHECODE_HOST } from "./lib";
import { TConsumableSlug } from "./storeTypes";

export const getSession = async (token: string, slug: string) => {
  if (!slug) {
    throw new Error("Slug is required");
  }

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
    return response.data;
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
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

export async function useConsumableCall(
  breathecodeToken: string,
  consumableSlug: TConsumableSlug = "ai-conversation-message"
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

export const isPackageAuthor = async (
  token: string,
  packageSlug: string
): Promise<{ isAuthor: boolean; status: number }> => {
  const url = `${RIGOBOT_HOST}/v1/learnpack/package/${packageSlug}/`;

  console.log("Checking if package is author", url, token);

  const headers = {
    Authorization: `Token ${token}`,
  };

  try {
    const response = await axios.get(url, { headers });
    return { isAuthor: response.status === 200, status: response.status };
  } catch (error: any) {
    const status = error?.response?.status || 500;
    console.error("Error fetching package:", error);
    return { isAuthor: false, status };
  }
};
