const blockedTerms = new Set([
  "arse",
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dick",
  "douche",
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "piss",
  "prick",
  "shit",
  "shitty",
  "slut",
  "twat",
  "whore",
]);

const substitutions: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

function normalizeToken(token: string): string {
  return token.normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[013457@$!]/g, (character) => substitutions[character])
    .replace(/[^a-z0-9]/g, "");
}

export function containsBlockedLanguage(value: string): boolean {
  const tokens = value.split(/\s+/).map(normalizeToken).filter(Boolean);
  if (tokens.some((token) => blockedTerms.has(token))) return true;

  for (let start = 0; start < tokens.length; start += 1) {
    if (tokens[start].length !== 1) continue;
    let combined = "";
    for (let end = start; end < Math.min(tokens.length, start + 16) && tokens[end].length === 1; end += 1) {
      combined += tokens[end];
      if (blockedTerms.has(combined)) return true;
    }
  }
  return false;
}

export function hasBlockedSubmissionText(...values: string[]): boolean {
  return values.some(containsBlockedLanguage);
}
