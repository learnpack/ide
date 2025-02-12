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

export const slugToTitle = (slug: string) => {
  // Replace all - and _ with spaces and capitalize the first letter of each word

  if (!slug) return "";
  return slug
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
