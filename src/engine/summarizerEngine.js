/**
 * StudyGenie - Local Extractive Summarization Engine
 * 100% Client-Side Sentence Scoring & Synthesis
 * Strict Grounding: Does not invent or hallucinate information absent from source text.
 */
import { splitSentences, getWordFrequencies, scoreSentence } from './nlpCore';

export function generateSummaries(parsedSyllabus, options = {}) {
  const {
    compressionRatio = 0.4, // 0.25 (concise), 0.45 (balanced), 0.70 (detailed)
    topicId = 'all'
  } = options;

  if (!parsedSyllabus || !parsedSyllabus.allSentences || parsedSyllabus.allSentences.length === 0) {
    return {
      executiveSummary: [],
      chapterSummaries: [],
      keyDefinitions: [],
      revisionBullets: [],
      stats: { originalSentences: 0, summarySentences: 0, compression: '0%' }
    };
  }

  let sentences = parsedSyllabus.allSentences;
  if (topicId !== 'all') {
    sentences = sentences.filter(s => s.topicId === topicId);
  }

  const rawSentenceTexts = sentences.map(s => s.text);
  const wordFreqs = getWordFrequencies(rawSentenceTexts);
  let maxFreq = 1;
  for (const count of wordFreqs.values()) {
    if (count > maxFreq) maxFreq = count;
  }

  // Score each sentence
  const scoredList = sentences.map((sObj, idx) => {
    const score = scoreSentence(sObj.text, idx, sentences.length, wordFreqs, maxFreq);
    return {
      ...sObj,
      originalIndex: idx,
      score
    };
  });

  // Calculate number of sentences to keep
  const targetCount = Math.max(3, Math.min(sentences.length, Math.ceil(sentences.length * compressionRatio)));

  // Sort by score descending to get top sentences
  const topSentences = [...scoredList]
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount);

  // Restore original chronological order for reading coherence
  topSentences.sort((a, b) => a.originalIndex - b.originalIndex);

  // Extract Key Definitions
  const defPattern = /^([^,:]{2,35}?)\s+(?:is defined as|refers to|is a type of|is known as|denotes)\s+(.+)$/i;
  const keyDefinitions = [];
  const seenTerms = new Set();

  for (const sObj of sentences) {
    const match = sObj.text.match(defPattern);
    if (match) {
      const term = match[1].replace(/^(The|A|An)\s+/i, '').trim();
      const def = match[2].trim();
      if (term.length > 2 && !seenTerms.has(term.toLowerCase())) {
        seenTerms.add(term.toLowerCase());
        keyDefinitions.push({
          term,
          definition: def,
          topicTitle: sObj.topicTitle,
          chapterTitle: sObj.chapterTitle,
          sourceSentence: sObj.text
        });
      }
    }
  }

  // Generate High-Yield Revision Bullets (top scored punchy statements)
  const revisionBullets = [...scoredList]
    .filter(s => s.text.length >= 30 && s.text.length <= 160)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(12, Math.max(5, Math.ceil(sentences.length * 0.2))))
    .map(s => ({
      text: s.text,
      topicTitle: s.topicTitle,
      chapterTitle: s.chapterTitle
    }));

  // Group Chapter Summaries
  const chaptersMap = new Map();
  for (const s of topSentences) {
    const chapKey = s.chapterTitle || 'Core Chapter';
    if (!chaptersMap.has(chapKey)) {
      chaptersMap.set(chapKey, {
        chapterTitle: chapKey,
        unitTitle: s.unitTitle || 'Unit',
        sentences: []
      });
    }
    chaptersMap.get(chapKey).sentences.push(s.text);
  }

  const chapterSummaries = Array.from(chaptersMap.values());

  return {
    executiveSummary: topSentences.map(s => s.text),
    chapterSummaries,
    keyDefinitions: keyDefinitions.slice(0, 15),
    revisionBullets,
    stats: {
      originalSentences: sentences.length,
      summarySentences: topSentences.length,
      compression: `${Math.round((1 - topSentences.length / (sentences.length || 1)) * 100)}% condensed`
    }
  };
}
