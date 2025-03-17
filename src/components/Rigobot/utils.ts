import { TUser } from "../../utils/storeTypes";

export function removeHiddenContent(text: string) {
  // Use a regular expression to match and remove the hidden section
  const regex = /<!--hide[\s\S]*?endhide-->/g;
  const textWithoutHidden = text.replace(regex, "").trim();
  return textWithoutHidden;
}
export const formatInitialMessage = (
  message: string,
  user: TUser,
  stepSlug: string,
  fallbackMessage: string
) => {
  if (!message) return fallbackMessage;

  if (!user || !user.first_name || !stepSlug || !message) return message;
  return message
    .replace("{userName}", user.first_name)
    .replace("{stepSlug}", stepSlug);
};

export const slugToTitle = (slug: string, uppercase = true) => {
  // Replace all - and _ with spaces and capitalize the first letter of each word

  if (!slug) return "";

  if (typeof slug !== "string") {
    console.error("slugToTitle: slug is not a string");
    return "";
  }
  let title = slug.replace(/-/g, " ").replace(/_/g, " ");

  if (uppercase) {
    title = title.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return title;
};
