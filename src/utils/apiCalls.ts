import { RIGOBOT_HOST } from "./lib";

export const getSession = async (token: string, slug: string) => {
  const url = RIGOBOT_HOST + `/v1/learnpack/session/?slug=${slug}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        // "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
  const url = RIGOBOT_HOST + `/v1/learnpack/session/${session_key}/`;

  const body = JSON.stringify({
    tab_hash,
    config_json,
    package_slug,
  });

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
  const url = RIGOBOT_HOST + `/v1/learnpack/session/`;

  const body = JSON.stringify({
    tab_hash,
    config_json,
    package_slug,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
};
