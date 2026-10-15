(() => {
  const blockedTerms = [
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
    "whore"
  ];
  const substitutions = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
  const blockedSet = new Set(blockedTerms);

  function normalizeToken(token) {
    return token.normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("en")
      .replace(/[013457@$!]/g, character => substitutions[character])
      .replace(/[^a-z0-9]/g, "");
  }

  function containsBlockedLanguage(value) {
    const tokens = value.split(/\s+/).map(normalizeToken).filter(Boolean);
    if (tokens.some(token => blockedSet.has(token))) return true;

    for (let start = 0; start < tokens.length; start += 1) {
      if (tokens[start].length !== 1) continue;
      let combined = "";
      for (let end = start; end < Math.min(tokens.length, start + 16) && tokens[end].length === 1; end += 1) {
        combined += tokens[end];
        if (blockedSet.has(combined)) return true;
      }
    }
    return false;
  }

  window.BLOG_MODERATION = { containsBlockedLanguage };
})();
