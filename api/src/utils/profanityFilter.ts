const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PROHIBITED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "slut",
  "whore",
  "damn",
  "nigger",
  "faggot",
  "motherfucker",
  "dick",
  "piss",
  "crap",
];

const PROHIBITED_PATTERNS = PROHIBITED_TERMS.map((term) =>
  new RegExp(`\\b${escapeRegExp(term)}\\b`, "i")
);

export const containsProhibitedLanguage = (value: string): boolean => {
  if (!value) {
    return false;
  }

  return PROHIBITED_PATTERNS.some((pattern) => pattern.test(value));
};
