import en from "../messages/en.json";
import pt from "../messages/pt.json";

const messages = {
  en,
  pt,
};

export type Locale = "en" | "pt";

export function getDictionary(locale: Locale) {
  return messages[locale];
}
