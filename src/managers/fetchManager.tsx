import { TEnvironment } from "./EventProxy";
import frontMatter from "front-matter";

export const fetchManager = {
  environment: "",
  host: "",
  init: (environment: TEnvironment, host: string) => {
    fetchManager.environment = environment;
    fetchManager.host = host;
  },
  getExercises: async () => {
    const configUrl =
      fetchManager.environment === "localhost" ? "config" : "config.json";
    const url =
      fetchManager.environment === "localhost"
        ? `${fetchManager.host}/${configUrl}`
        : "/config.json";
    const res = await fetch(url);
    const config = await res.json();
    return config;
  },

  getReadme: async (slug: string, language: string) => {
    const url =
      fetchManager.environment === "localhost"
        ? `${fetchManager.host}/exercise/${slug}/readme?lang=${language}`
        : `/exercises/${slug}/README.${language === "us" ? "" : "es."}md`;

    const response = await fetch(url);

    if (fetchManager.environment === "localhost") {
      const json = await response.json();
      return json;
    }

    const mdContent = await response.text();
    const matter = frontMatter(mdContent);
    return matter;
  },

  getFileContent: async (slug: string, file: string) => {
    const url =
      fetchManager.environment === "localhost"
        ? `${fetchManager.host}/exercise/${slug}/file/${file}`
        : `/exercises/${slug}/${file}`;

        console.log("URL TO GET CONTENT FROM", url );
        
    const response = await fetch(url);
    const text = await response.text();
    return text;
  },
};
