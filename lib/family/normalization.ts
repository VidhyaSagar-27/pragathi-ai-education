/**
 * Pragathi AI — Contact & Student Identity Normalization Engine
 */

/**
 * Normalizes phone numbers to standard 10-digit Indian mobile format.
 * Handles prefixes (+91, 0, spaces, hyphens, brackets).
 */
export function normalizePhone(rawPhone?: string | number | null): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalizes email address by trimming and converting to lowercase.
 */
export function normalizeEmail(rawEmail?: string | null): string {
  if (!rawEmail) return '';
  return String(rawEmail).trim().toLowerCase();
}

/**
 * Normalizes student name:
 * - Lowercase
 * - Strips punctuation, dashes, dots
 * - Normalizes multiple spaces into a single space
 * - Trims edges
 */
export function normalizeStudentName(rawName?: string | null): string {
  if (!rawName) return '';
  return String(rawName)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein edit distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Checks if tokens represent a name with an initial match
 * e.g., ["rahul", "kumar"] vs ["rahul", "k"] -> true
 * e.g., ["r", "kumar"] vs ["rahul", "kumar"] -> true
 */
function checkInitialsMatch(tokensA: string[], tokensB: string[]): boolean {
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  if (tokensA.length !== tokensB.length && Math.abs(tokensA.length - tokensB.length) > 1) {
    return false;
  }

  // Case 1: First name matches exactly, last name is initial
  // e.g., Rahul Kumar vs Rahul K
  if (tokensA[0] === tokensB[0] && tokensA.length >= 2 && tokensB.length >= 2) {
    const lastA = tokensA[tokensA.length - 1];
    const lastB = tokensB[tokensB.length - 1];
    if (
      (lastA.length === 1 && lastB.startsWith(lastA)) ||
      (lastB.length === 1 && lastA.startsWith(lastB))
    ) {
      return true;
    }
  }

  // Case 2: Last name matches exactly, first name is initial
  // e.g., R Kumar vs Rahul Kumar
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    const lastA = tokensA[tokensA.length - 1];
    const lastB = tokensB[tokensB.length - 1];
    const firstA = tokensA[0];
    const firstB = tokensB[0];
    if (
      lastA === lastB &&
      ((firstA.length === 1 && firstB.startsWith(firstA)) ||
        (firstB.length === 1 && firstA.startsWith(firstB)))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Robust Name Similarity Calculator (0.0 to 1.0)
 * Evaluates:
 * 1. Exact match (1.0)
 * 2. Token Set Equality (order inversion e.g. "Rahul Kumar" vs "Kumar Rahul") (0.98)
 * 3. Initial match e.g. "Rahul Kumar" vs "Rahul K" (0.90)
 * 4. Levenshtein edit distance for spelling variations (e.g. "Rahul Kumarr")
 * 5. Token Jaccard similarity
 */
export function calculateNameSimilarity(nameA?: string | null, nameB?: string | null): number {
  const normA = normalizeStudentName(nameA);
  const normB = normalizeStudentName(nameB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const tokensA = normA.split(' ').filter(Boolean);
  const tokensB = normB.split(' ').filter(Boolean);

  // Check token set equality (order inversion)
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (tokensA.length === tokensB.length && tokensA.every((t) => setB.has(t))) {
    return 0.98;
  }

  // Check initial expansion ("Rahul Kumar" vs "Rahul K")
  if (checkInitialsMatch(tokensA, tokensB)) {
    return 0.90;
  }

  // Calculate Levenshtein string similarity
  const maxLen = Math.max(normA.length, normB.length);
  const levDist = levenshteinDistance(normA, normB);
  const levSim = Math.max(0, 1 - levDist / maxLen);

  // Token Jaccard similarity
  const intersection = tokensA.filter((t) => setB.has(t));
  const union = new Set([...tokensA, ...tokensB]);
  const jaccard = union.size > 0 ? intersection.length / union.size : 0;

  // If first names match and last names have high edit distance or vice versa
  let partialTokenScore = 0;
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    if (tokensA[0] === tokensB[0]) {
      const lastA = tokensA[tokensA.length - 1];
      const lastB = tokensB[tokensB.length - 1];
      const lastDist = levenshteinDistance(lastA, lastB);
      const lastSim = 1 - lastDist / Math.max(lastA.length, lastB.length);
      if (lastSim >= 0.75) {
        partialTokenScore = 0.5 + 0.5 * lastSim;
      }
    }
  }

  return Math.max(levSim, jaccard, partialTokenScore);
}
