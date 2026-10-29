/**
 * StudyGenie - Rule-Based Question Bank Generator
 * Generates MCQs, True/False, Fill-in-the-Blanks, Short Answers, and Long-Answer Prompts
 * 100% Client-Side, No External AI APIs
 */

import { generateDistractors, STOP_WORDS } from './nlpCore';

export function generateQuestionBank(parsedSyllabus, options = {}) {
  const {
    topicId = 'all',
    types = ['mcq', 'true_false', 'fill_blank', 'short_answer', 'long_answer'],
    difficulty = 'all', // 'all', 'easy', 'medium', 'hard'
    count = 20
  } = options;

  if (!parsedSyllabus || !parsedSyllabus.allSentences || parsedSyllabus.allSentences.length === 0) {
    return [];
  }

  // Filter sentences by topic if specified
  let candidateSentences = parsedSyllabus.allSentences;
  if (topicId !== 'all') {
    candidateSentences = candidateSentences.filter(s => s.topicId === topicId);
  }

  if (candidateSentences.length === 0) {
    candidateSentences = parsedSyllabus.allSentences;
  }

  const allTermsPool = parsedSyllabus.allTerms || [];
  const generatedQuestions = [];

  // Categorize sentences into definition, functional, process, or general informative
  const defSentences = [];
  const generalSentences = [];

  const defPatterns = [
    /\b(?:is defined as|refers to|is a type of|is a|are known as|represents|denotes|consists of)\b/i,
    /:\s+[A-Z]/
  ];

  for (const sObj of candidateSentences) {
    const s = sObj.text;
    const isDef = defPatterns.some(p => p.test(s));
    if (isDef && s.length > 25 && s.length < 250) {
      defSentences.push(sObj);
    } else if (s.length > 30 && s.length < 220) {
      generalSentences.push(sObj);
    }
  }

  let qIndex = 1;

  // ----------------------------------------------------
  // 1. GENERATE MULTIPLE CHOICE QUESTIONS (MCQs)
  // ----------------------------------------------------
  if (types.includes('mcq')) {
    for (const sObj of [...defSentences, ...generalSentences]) {
      const sentence = sObj.text;
      
      // Try to find subject term: "X is defined as Y" or "X refers to Y"
      let term = null;
      let predicate = null;

      const defMatch = sentence.match(/^([^,:]{2,35}?)\s+(?:is defined as|refers to|is a type of|is known as|denotes)\s+(.+)$/i);
      if (defMatch) {
        term = defMatch[1].replace(/^(The|A|An)\s+/i, '').trim();
        predicate = defMatch[2].replace(/[.!?]+$/, '').trim();
      } else {
        // Try finding a key term in this sentence from the topic's keyTerms or global terms
        const topicTerms = sObj.topicTitle ? allTermsPool.filter(t => sentence.toLowerCase().includes(t.toLowerCase())) : [];
        if (topicTerms.length > 0) {
          term = topicTerms[0];
          predicate = sentence;
        }
      }

      if (term && term.length >= 3 && term.length <= 40 && !STOP_WORDS.has(term.toLowerCase())) {
        const distractors = generateDistractors(term, allTermsPool, [
          'Linear Structure', 'Non-linear Model', 'Dynamic Paradigm', 'Abstract Entity', 'Primitive Element'
        ]);

        const optionsList = [term, ...distractors].sort(() => 0.5 - Math.random());
        const correctIndex = optionsList.indexOf(term);

        // Assign difficulty based on sentence length and vocabulary
        let diff = 'easy';
        if (sentence.length > 140 || sentence.includes('however') || sentence.includes('furthermore')) {
          diff = 'hard';
        } else if (sentence.length > 80) {
          diff = 'medium';
        }

        if (difficulty === 'all' || difficulty === diff) {
          const prompt = defMatch 
            ? `Which of the following is defined as: "${predicate}"?`
            : `Complete the statement: "${sentence.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i'), '__________')}"`;

          generatedQuestions.push({
            id: `q_mcq_${qIndex++}_${Date.now()}`,
            type: 'mcq',
            difficulty: diff,
            prompt,
            options: optionsList,
            correctAnswer: term,
            correctIndex,
            sourceSentence: sentence,
            topicTitle: sObj.topicTitle,
            chapterTitle: sObj.chapterTitle,
            unitTitle: sObj.unitTitle,
            topicId: sObj.topicId,
            derivedReliably: true,
            reviewRequired: false,
            explanation: `Derived from syllabus: "${sentence}"`
          });
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. GENERATE TRUE / FALSE QUESTIONS
  // ----------------------------------------------------
  if (types.includes('true_false')) {
    const tfCandidates = [...candidateSentences].sort(() => 0.5 - Math.random());
    for (const sObj of tfCandidates) {
      const sentence = sObj.text;
      if (sentence.length < 35 || sentence.length > 180) continue;

      const makeFalse = Math.random() > 0.5;
      let prompt = sentence;
      let explanation = `Verified True from syllabus: "${sentence}"`;
      let diff = sentence.length > 100 ? 'medium' : 'easy';

      if (makeFalse) {
        // Create realistic negation or keyword swap
        let altered = false;
        if (/\bis\b/i.test(sentence) && !/\bis not\b/i.test(sentence)) {
          prompt = sentence.replace(/\bis\b/i, 'is NOT');
          altered = true;
        } else if (/\bcan\b/i.test(sentence) && !/\bcannot\b/i.test(sentence)) {
          prompt = sentence.replace(/\bcan\b/i, 'cannot');
          altered = true;
        } else if (/\balways\b/i.test(sentence)) {
          prompt = sentence.replace(/\balways\b/i, 'never');
          altered = true;
        } else if (/\bincreases\b/i.test(sentence)) {
          prompt = sentence.replace(/\bincreases\b/i, 'decreases');
          altered = true;
        } else {
          // Swap a key term with a distractor
          const foundTerm = allTermsPool.find(t => sentence.toLowerCase().includes(t.toLowerCase()) && t.length > 3);
          if (foundTerm) {
            const alt = allTermsPool.find(t => t !== foundTerm && t.length > 3);
            if (alt) {
              prompt = sentence.replace(new RegExp(`\\b${escapeRegExp(foundTerm)}\\b`, 'i'), alt);
              altered = true;
            }
          }
        }

        if (altered) {
          diff = 'medium';
          explanation = `False. The syllabus states: "${sentence}"`;
          if (difficulty === 'all' || difficulty === diff) {
            generatedQuestions.push({
              id: `q_tf_${qIndex++}_${Date.now()}`,
              type: 'true_false',
              difficulty: diff,
              prompt: `True or False: "${prompt}"`,
              options: ['True', 'False'],
              correctAnswer: 'False',
              correctIndex: 1,
              sourceSentence: sentence,
              topicTitle: sObj.topicTitle,
              chapterTitle: sObj.chapterTitle,
              unitTitle: sObj.unitTitle,
              topicId: sObj.topicId,
              derivedReliably: true,
              reviewRequired: false,
              explanation
            });
          }
        }
      } else {
        // True question
        if (difficulty === 'all' || difficulty === diff) {
          generatedQuestions.push({
            id: `q_tf_${qIndex++}_${Date.now()}`,
            type: 'true_false',
            difficulty: diff,
            prompt: `True or False: "${prompt}"`,
            options: ['True', 'False'],
            correctAnswer: 'True',
            correctIndex: 0,
            sourceSentence: sentence,
            topicTitle: sObj.topicTitle,
            chapterTitle: sObj.chapterTitle,
            unitTitle: sObj.unitTitle,
            topicId: sObj.topicId,
            derivedReliably: true,
            reviewRequired: false,
            explanation
          });
        }
      }
    }
  }

  // ----------------------------------------------------
  // 3. GENERATE FILL-IN-THE-BLANK (CLOZE)
  // ----------------------------------------------------
  if (types.includes('fill_blank')) {
    for (const sObj of candidateSentences) {
      const sentence = sObj.text;
      if (sentence.length < 35 || sentence.length > 200) continue;

      // Find best technical keyword in the sentence
      const targetTerm = allTermsPool.find(t => {
        const regex = new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i');
        return regex.test(sentence) && t.length >= 3 && !STOP_WORDS.has(t.toLowerCase());
      });

      if (targetTerm) {
        const blankedSentence = sentence.replace(new RegExp(`\\b${escapeRegExp(targetTerm)}\\b`, 'i'), '__________');
        const diff = targetTerm.length > 8 ? 'hard' : 'medium';

        if (difficulty === 'all' || difficulty === diff) {
          generatedQuestions.push({
            id: `q_fib_${qIndex++}_${Date.now()}`,
            type: 'fill_blank',
            difficulty: diff,
            prompt: `Fill in the blank: "${blankedSentence}"`,
            correctAnswer: targetTerm,
            hint: `Starts with "${targetTerm.charAt(0)}" (${targetTerm.length} letters)`,
            sourceSentence: sentence,
            topicTitle: sObj.topicTitle,
            chapterTitle: sObj.chapterTitle,
            unitTitle: sObj.unitTitle,
            topicId: sObj.topicId,
            derivedReliably: true,
            reviewRequired: false,
            explanation: `Authoritative sentence from syllabus: "${sentence}"`
          });
        }
      }
    }
  }

  // ----------------------------------------------------
  // 4. GENERATE SHORT-ANSWER QUESTIONS
  // ----------------------------------------------------
  if (types.includes('short_answer')) {
    for (const sObj of candidateSentences) {
      const sentence = sObj.text;
      let concept = null;
      let prompt = null;

      const defMatch = sentence.match(/^([^,:]{2,35}?)\s+(?:is defined as|refers to|is a type of|is a|denotes)\s+(.+)$/i);
      if (defMatch) {
        concept = defMatch[1].replace(/^(The|A|An)\s+/i, '').trim();
        prompt = `Define "${concept}" and explain its role in ${sObj.topicTitle || 'this subject'}.`;
      } else {
        const term = allTermsPool.find(t => sentence.toLowerCase().includes(t.toLowerCase()) && t.length > 3);
        if (term) {
          concept = term;
          prompt = `What is the significance or function of "${concept}" as described in ${sObj.topicTitle || 'the syllabus'}?`;
        }
      }

      if (prompt && concept) {
        const diff = sentence.length > 120 ? 'hard' : 'medium';
        if (difficulty === 'all' || difficulty === diff) {
          generatedQuestions.push({
            id: `q_sa_${qIndex++}_${Date.now()}`,
            type: 'short_answer',
            difficulty: diff,
            prompt,
            correctAnswer: sentence,
            conceptTarget: concept,
            sourceSentence: sentence,
            topicTitle: sObj.topicTitle,
            chapterTitle: sObj.chapterTitle,
            unitTitle: sObj.unitTitle,
            topicId: sObj.topicId,
            derivedReliably: true,
            reviewRequired: false,
            explanation: `Direct answer from syllabus: "${sentence}"`
          });
        }
      }
    }
  }

  // ----------------------------------------------------
  // 5. GENERATE LONG-ANSWER / ESSAY PROMPTS
  // ----------------------------------------------------
  if (types.includes('long_answer')) {
    // Generate high-order analytical prompts grouped by topic
    const uniqueTopics = Array.from(new Set(candidateSentences.map(s => s.topicId))).map(id => {
      return candidateSentences.find(s => s.topicId === id);
    }).filter(Boolean);

    for (const topObj of uniqueTopics) {
      const topicSentences = candidateSentences.filter(s => s.topicId === topObj.topicId);
      if (topicSentences.length < 2) continue;

      const topicTerms = (parsedSyllabus.allTerms || []).filter(t => 
        topicSentences.some(s => s.text.toLowerCase().includes(t.toLowerCase()))
      ).slice(0, 4);

      const promptTemplates = [
        `Provide an in-depth analytical explanation of "${topObj.topicTitle}". Detail the core principles, operational mechanisms, and key characteristics outlined in the syllabus.`,
        `Critically examine the concepts governing "${topObj.topicTitle}". Analyze the relationship between ${topicTerms.slice(0, 2).join(' and ') || 'its sub-components'} and their practical applications.`,
        `Synthesize a structured examination of "${topObj.topicTitle}" from ${topObj.chapterTitle || 'the syllabus'}. Discuss primary definitions, classification schemes, and relevant trade-offs.`
      ];

      const chosenPrompt = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
      const keyPointsExpected = topicSentences.slice(0, 4).map(s => s.text);

      if (difficulty === 'all' || difficulty === 'hard') {
        generatedQuestions.push({
          id: `q_la_${qIndex++}_${Date.now()}`,
          type: 'long_answer',
          difficulty: 'hard',
          prompt: chosenPrompt,
          correctAnswer: `Expected Key Points to cover:\n• ` + keyPointsExpected.join('\n• '),
          keyPoints: keyPointsExpected,
          keyTerms: topicTerms,
          sourceSentence: keyPointsExpected.join(' '),
          topicTitle: topObj.topicTitle,
          chapterTitle: topObj.chapterTitle,
          unitTitle: topObj.unitTitle,
          topicId: topObj.topicId,
          derivedReliably: false, // Broad analytical synthesis
          reviewRequired: true,   // Requires student or teacher review
          explanation: `Subjective analytical question. Answers should be evaluated against the ${keyPointsExpected.length} key syllabus statements provided.`
        });
      }
    }
  }

  // Deduplicate by prompt
  const seenPrompts = new Set();
  const uniqueQuestions = [];
  for (const q of generatedQuestions) {
    const key = q.prompt.toLowerCase().trim();
    if (!seenPrompts.has(key)) {
      seenPrompts.add(key);
      uniqueQuestions.push(q);
    }
  }

  // Shuffle and trim to requested count
  const shuffled = uniqueQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
