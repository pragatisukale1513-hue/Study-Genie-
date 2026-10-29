/**
 * StudyGenie - Rule-Based Flashcard Generator
 * Extracts high-yield Concept/Term <-> Definition pairs from syllabus sentences
 */
import { STOP_WORDS } from './nlpCore';

export function generateFlashcards(parsedSyllabus, options = {}) {
  const { topicId = 'all' } = options;

  if (!parsedSyllabus || !parsedSyllabus.allSentences) return [];

  let sentences = parsedSyllabus.allSentences;
  if (topicId !== 'all') {
    sentences = sentences.filter(s => s.topicId === topicId);
  }

  const flashcards = [];
  const seenTerms = new Set();
  let fId = 1;

  // Patterns for definition extraction
  const patterns = [
    {
      regex: /^([^,:]{2,35}?)\s+is defined as\s+(.+)$/i,
      type: 'Formal Definition'
    },
    {
      regex: /^([^,:]{2,35}?)\s+refers to\s+(.+)$/i,
      type: 'Core Concept'
    },
    {
      regex: /^([^,:]{2,35}?)\s+is a type of\s+(.+)$/i,
      type: 'Classification'
    },
    {
      regex: /^([^,:]{2,35}?)\s+is a\s+(.+)$/i,
      type: 'Overview'
    },
    {
      regex: /^The function of\s+([^,:]{2,35}?)\s+is\s+(.+)$/i,
      type: 'Function / Role'
    },
    {
      regex: /^([A-Z][A-Za-z0-9\s_-]{2,30}?)\s*[:—–]\s+([A-Z].+)$/,
      type: 'Terminology'
    }
  ];

  for (const sObj of sentences) {
    const s = sObj.text.trim();

    for (const pat of patterns) {
      const match = s.match(pat.regex);
      if (match) {
        let term = match[1].replace(/^(The|A|An|In)\s+/i, '').trim();
        let def = match[2].trim();

        if (term.length >= 3 && term.length <= 40 && !STOP_WORDS.has(term.toLowerCase())) {
          const normKey = term.toLowerCase();
          if (!seenTerms.has(normKey) && def.length >= 15) {
            seenTerms.add(normKey);
            flashcards.push({
              id: `fc_${fId++}_${Date.now()}`,
              front: term,
              back: def.charAt(0).toUpperCase() + def.slice(1),
              category: pat.type,
              topicTitle: sObj.topicTitle,
              chapterTitle: sObj.chapterTitle,
              unitTitle: sObj.unitTitle,
              sourceSentence: s,
              status: 'learning',
              reviewsCount: 0
            });
            break;
          }
        }
      }
    }
  }

  // If fewer than 8 flashcards generated, extract cards using top extracted terms
  if (flashcards.length < 8 && parsedSyllabus.allTerms) {
    for (const term of parsedSyllabus.allTerms) {
      if (flashcards.length >= 25) break;
      const normKey = term.toLowerCase();
      if (seenTerms.has(normKey)) continue;

      // Find sentence mentioning this term
      const matchingSentence = sentences.find(s => 
        new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(s.text) && s.text.length > 30
      );

      if (matchingSentence) {
        seenTerms.add(normKey);
        flashcards.push({
          id: `fc_${fId++}_${Date.now()}`,
          front: term,
          back: matchingSentence.text,
          category: 'Key Principle',
          topicTitle: matchingSentence.topicTitle,
          chapterTitle: matchingSentence.chapterTitle,
          unitTitle: matchingSentence.unitTitle,
          sourceSentence: matchingSentence.text,
          status: 'learning',
          reviewsCount: 0
        });
      }
    }
  }

  return flashcards;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
