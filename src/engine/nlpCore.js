/**
 * StudyGenie - Rule-Based NLP Core Engine
 * 100% Client-Side, Zero External AI APIs, Zero Cost
 */

export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'also', 'thus', 'therefore', 'furthermore', 'moreover', 'hence', 'overall', 'specifically',
  'e.g.', 'i.e.', 'etc', 'etc.', 'via', 'using', 'used', 'use', 'per', 'various', 'several', 'include', 'includes'
]);

/**
 * Intelligent Sentence Splitter
 * Preserves abbreviations, decimals, and list markers without improper splitting
 */
export function splitSentences(text) {
  if (!text || typeof text !== 'string') return [];

  // Protect common abbreviations and numbers
  let safe = text
    .replace(/(?:e\.g\.|i\.e\.|etc\.|vs\.|Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Fig\.|Vol\.|No\.)/gi, match => match.replace(/\./g, '__DOT__'))
    .replace(/(\d+)\.(\d+)/g, '$1__DOT__$2');

  // Split on sentence-ending punctuation followed by whitespace or line break
  const rawSegments = safe.split(/(?<=[.?!])\s+(?=[A-Z0-9"'(])/);

  const sentences = [];
  for (let seg of rawSegments) {
    // Restore protected dots
    seg = seg.replace(/__DOT__/g, '.').trim();
    // Also handle line break splittings for bullet-like points
    const lines = seg.split(/\r?\n+/);
    for (let line of lines) {
      const clean = line.replace(/^[\s•*–—\d.)]+/, '').trim();
      if (clean.length > 20 && /[a-zA-Z]/.test(clean)) {
        sentences.push(clean);
      }
    }
  }

  return sentences;
}

/**
 * Tokenize words from string
 */
export function tokenizeWords(text) {
  if (!text) return [];
  const matches = text.toLowerCase().match(/\b[a-z0-9_-]{2,}\b/g);
  return matches || [];
}

/**
 * Calculate Word Frequencies excluding stop words
 */
export function getWordFrequencies(sentences) {
  const freq = new Map();
  for (const sentence of sentences) {
    const words = tokenizeWords(sentence);
    for (const w of words) {
      if (!STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
        freq.set(w, (freq.get(w) || 0) + 1);
      }
    }
  }
  return freq;
}

/**
 * Extract Key Phrases and Technical Terms
 * Uses regex heuristics for Title Case phrases, definitions, and high-frequency noun clusters
 */
export function extractKeyTerms(text, sentences = []) {
  const termMap = new Map();

  // Pattern 1: Title Case Multi-word phrases (e.g. "Binary Search Tree", "Cell Membrane")
  const titleCaseMatches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) || [];
  for (const match of titleCaseMatches) {
    const term = match.trim();
    if (term.length > 3 && !['The', 'An', 'A', 'This', 'That'].includes(term)) {
      termMap.set(term, (termMap.get(term) || 0) + 3);
    }
  }

  // Pattern 2: Term preceding definitions: "X is defined as", "X refers to", "X is a", "X:"
  const defPattern = /(?:^|[.!?\n])\s*([A-Z][A-Za-z0-9\s_-]{2,30}?)\s+(?:is defined as|refers to|is a type of|is a|are|denotes|represents|means|functions as)\b/g;
  let match;
  while ((match = defPattern.exec(text)) !== null) {
    const candidate = match[1].replace(/^(The|A|An|In)\s+/i, '').trim();
    if (candidate.length > 2 && candidate.split(' ').length <= 4) {
      termMap.set(candidate, (termMap.get(candidate) || 0) + 5);
    }
  }

  // Pattern 3: Key terms followed by colon / dash: "Recursion: ..." or "Photosynthesis - ..."
  const colonPattern = /(?:^|\n)\s*([A-Z][A-Za-z0-9\s_-]{2,30}?)\s*[:—–]\s+[A-Z]/g;
  while ((match = colonPattern.exec(text)) !== null) {
    const candidate = match[1].replace(/^(The|A|An|Chapter|Unit|Module|Topic)\s+/i, '').trim();
    if (candidate.length > 2 && candidate.split(' ').length <= 4) {
      termMap.set(candidate, (termMap.get(candidate) || 0) + 4);
    }
  }

  // Pattern 4: High-frequency technical single words
  const wordFreqs = getWordFrequencies(sentences.length > 0 ? sentences : splitSentences(text));
  for (const [w, count] of wordFreqs.entries()) {
    if (count >= 2 && w.length >= 4) {
      const cap = w.charAt(0).toUpperCase() + w.slice(1);
      if (!termMap.has(cap) && !termMap.has(w)) {
        termMap.set(cap, count);
      }
    }
  }

  // Convert to sorted list of terms by relevance score
  return Array.from(termMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .filter(term => term.length >= 3);
}

/**
 * Smart Distractor Generator for MCQs
 * Given a correct answer and a pool of extracted terms from the same syllabus,
 * selects the most plausible, distinct, non-overlapping distractors.
 */
export function generateDistractors(correctAnswer, allTermsPool, fallbackPool = []) {
  const normCorrect = correctAnswer.trim().toLowerCase();
  
  // Filter candidates that are not identical or sub-strings of correct answer
  const filtered = allTermsPool.filter(term => {
    const norm = term.trim().toLowerCase();
    return norm !== normCorrect && 
           !norm.includes(normCorrect) && 
           !normCorrect.includes(norm) &&
           term.length > 2;
  });

  // Shuffle candidate list
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  // If we don't have enough, grab from fallback pool
  if (selected.length < 3 && fallbackPool.length > 0) {
    for (const fb of fallbackPool) {
      const normFb = fb.trim().toLowerCase();
      if (normFb !== normCorrect && !selected.some(s => s.toLowerCase() === normFb)) {
        selected.push(fb);
        if (selected.length === 3) break;
      }
    }
  }

  // Generic fallback options if pool is very small
  const genericFallbacks = ['None of the above', 'All of the above', 'Cannot be determined', 'Insufficient data'];
  let gIndex = 0;
  while (selected.length < 3) {
    selected.push(genericFallbacks[gIndex % genericFallbacks.length]);
    gIndex++;
  }

  return selected;
}

/**
 * Score a sentence for importance (Extractive Summarization)
 * Uses Keyword Density, Position, Cue Phrases, and Length Normalization
 */
export function scoreSentence(sentence, index, totalSentences, wordFreqs, maxFreq) {
  const words = tokenizeWords(sentence);
  if (words.length < 6 || words.length > 60) return 0.2; // Penalize extremes

  // 1. Keyword Frequency Score
  let freqScore = 0;
  for (const w of words) {
    if (wordFreqs.has(w)) {
      freqScore += (wordFreqs.get(w) / maxFreq);
    }
  }
  freqScore = freqScore / Math.sqrt(words.length);

  // 2. Position Bias (first 20% and last 10% often contain main conclusions/themes)
  let posScore = 1.0;
  const relPos = index / (totalSentences || 1);
  if (relPos <= 0.15) posScore = 1.4;
  else if (relPos >= 0.85) posScore = 1.2;

  // 3. Cue Phrase Bonus
  let cueScore = 1.0;
  const lower = sentence.toLowerCase();
  const cuePhrases = [
    'is defined as', 'refers to', 'in summary', 'fundamental', 'essential', 
    'primary', 'crucial', 'consists of', 'classified into', 'characterized by',
    'key principle', 'important', 'significantly', 'main function', 'advantage',
    'difference between', 'process of', 'theorem', 'law of'
  ];
  for (const cue of cuePhrases) {
    if (lower.includes(cue)) {
      cueScore += 0.35;
    }
  }

  return freqScore * posScore * cueScore;
}
