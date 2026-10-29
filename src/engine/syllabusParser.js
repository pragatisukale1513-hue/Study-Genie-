/**
 * Syllabus Parser & Hierarchy Organizer
 * Breaks down raw text or document into Subjects, Units, Chapters, and Topics
 */
import { splitSentences, extractKeyTerms } from './nlpCore';

export function parseSyllabus(rawText, subjectName = 'General Syllabus') {
  if (!rawText || !rawText.trim()) {
    return {
      subject: subjectName,
      units: [],
      allTopics: [],
      allSentences: [],
      allTerms: [],
      rawText: ''
    };
  }

  const cleanText = rawText.trim();
  const lines = cleanText.split(/\r?\n/);

  // Look for subject line at the very top if not provided
  let detectedSubject = subjectName;
  const firstNonEmpty = lines.find(l => l.trim().length > 0);
  if (firstNonEmpty && (firstNonEmpty.toLowerCase().includes('syllabus') || firstNonEmpty.toLowerCase().includes('course') || firstNonEmpty.toLowerCase().includes('subject'))) {
    detectedSubject = firstNonEmpty.replace(/^(subject|course|syllabus)\s*[:–-]\s*/i, '').trim() || subjectName;
  }

  const units = [];
  let currentUnit = null;
  let currentChapter = null;
  let currentTopic = null;

  // Regex helpers
  const unitRegex = /^(?:unit\s*[-:#]?\s*[0-9ivx]+|module\s*[-:#]?\s*[0-9ivx]+|part\s*[-:#]?\s*[0-9ivx]+)\s*[:–-]?\s*(.*)$/i;
  const chapterRegex = /^(?:chapter\s*[-:#]?\s*[0-9ivx]+|section\s*[-:#]?\s*[0-9ivx]+)\s*[:–-]?\s*(.*)$/i;
  const topicRegex = /^(?:[0-9]+(?:\.[0-9]+)+\s+|topic\s*[-:#]?\s*[0-9ivx]*\s*[:–-]?\s*|[•*–-]\s+)([A-Z0-9].*)$/i;
  const headingRegex = /^[A-Z0-9\s,–-]{4,60}:?$/; // All-caps or short heading lines

  function ensureUnit(title = 'General Unit') {
    if (!currentUnit) {
      currentUnit = {
        id: `unit_${units.length + 1}`,
        title,
        chapters: []
      };
      units.push(currentUnit);
    }
    return currentUnit;
  }

  function ensureChapter(title = 'Core Concepts') {
    ensureUnit();
    if (!currentChapter) {
      currentChapter = {
        id: `chap_${currentUnit.chapters.length + 1}_${Date.now()}`,
        title,
        topics: []
      };
      currentUnit.chapters.push(currentChapter);
    }
    return currentChapter;
  }

  function ensureTopic(title = 'Introduction & Overview') {
    ensureChapter();
    if (!currentTopic) {
      currentTopic = {
        id: `top_${currentChapter.topics.length + 1}_${Date.now()}`,
        title,
        contentLines: []
      };
      currentChapter.topics.push(currentTopic);
    }
    return currentTopic;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check Unit / Module marker
    const unitMatch = line.match(unitRegex);
    if (unitMatch) {
      const title = line;
      currentUnit = {
        id: `unit_${units.length + 1}`,
        title,
        chapters: []
      };
      units.push(currentUnit);
      currentChapter = null;
      currentTopic = null;
      continue;
    }

    // Check Chapter / Section marker
    const chapMatch = line.match(chapterRegex);
    if (chapMatch) {
      ensureUnit(currentUnit ? currentUnit.title : 'Unit 1: Foundations');
      currentChapter = {
        id: `chap_${currentUnit.chapters.length + 1}_${Date.now()}`,
        title: line,
        topics: []
      };
      currentUnit.chapters.push(currentChapter);
      currentTopic = null;
      continue;
    }

    // Check Topic marker
    const topicMatch = line.match(topicRegex);
    if (topicMatch && line.length < 90 && !line.endsWith('.')) {
      ensureChapter(currentChapter ? currentChapter.title : 'Chapter 1: Core Syllabus');
      currentTopic = {
        id: `top_${currentChapter.topics.length + 1}_${Date.now()}`,
        title: line.replace(/^[•*–-]\s+/, '').replace(/^[0-9]+(?:\.[0-9]+)+\s+/, ''),
        contentLines: []
      };
      currentChapter.topics.push(currentTopic);
      continue;
    }

    // Check generic short heading
    if (headingRegex.test(line) && line.length < 50 && !line.includes('. ') && i + 1 < lines.length) {
      ensureUnit();
      if (!currentChapter || currentChapter.topics.length > 2) {
        currentChapter = {
          id: `chap_${currentUnit.chapters.length + 1}_${Date.now()}`,
          title: line.replace(/:$/, ''),
          topics: []
        };
        currentUnit.chapters.push(currentChapter);
        currentTopic = null;
      } else {
        currentTopic = {
          id: `top_${currentChapter.topics.length + 1}_${Date.now()}`,
          title: line.replace(/:$/, ''),
          contentLines: []
        };
        currentChapter.topics.push(currentTopic);
      }
      continue;
    }

    // Normal text content line
    ensureTopic();
    currentTopic.contentLines.push(line);
  }

  // If no units were created (e.g. short unstructured text), create default hierarchy
  if (units.length === 0) {
    const allSentences = splitSentences(cleanText);
    const defaultTopic = {
      id: `top_default_1`,
      title: 'Main Syllabus Overview',
      contentLines: [cleanText],
      sentences: allSentences,
      keyTerms: extractKeyTerms(cleanText, allSentences)
    };
    units.push({
      id: 'unit_1',
      title: 'Unit 1: Foundational Syllabus',
      chapters: [{
        id: 'chap_1',
        title: 'Chapter 1: Comprehensive Topics',
        topics: [defaultTopic]
      }]
    });
  } else {
    // Process content for each topic: generate sentences and key terms
    for (const unit of units) {
      if (unit.chapters.length === 0) {
        unit.chapters.push({
          id: `chap_gen_${unit.id}`,
          title: 'Key Concepts',
          topics: []
        });
      }
      for (const chap of unit.chapters) {
        if (chap.topics.length === 0) {
          chap.topics.push({
            id: `top_gen_${chap.id}`,
            title: chap.title,
            contentLines: [chap.title]
          });
        }
        for (const topic of chap.topics) {
          const fullTopicText = topic.contentLines.length > 0 
            ? topic.contentLines.join(' ') 
            : topic.title;
          topic.rawText = fullTopicText;
          topic.sentences = splitSentences(fullTopicText);
          if (topic.sentences.length === 0 && topic.title) {
            topic.sentences = [topic.title];
          }
          topic.keyTerms = extractKeyTerms(fullTopicText, topic.sentences);
        }
      }
    }
  }

  // Compile flat lists
  const allTopics = [];
  const allSentences = [];
  for (const unit of units) {
    for (const chap of unit.chapters) {
      for (const top of chap.topics) {
        allTopics.push({
          ...top,
          unitTitle: unit.title,
          chapterTitle: chap.title
        });
        for (const s of (top.sentences || [])) {
          allSentences.push({
            text: s,
            topicId: top.id,
            topicTitle: top.title,
            chapterTitle: chap.title,
            unitTitle: unit.title
          });
        }
      }
    }
  }

  const allTerms = extractKeyTerms(cleanText, allSentences.map(s => s.text));

  return {
    subject: detectedSubject,
    units,
    allTopics,
    allSentences,
    allTerms,
    rawText: cleanText,
    stats: {
      unitCount: units.length,
      chapterCount: units.reduce((acc, u) => acc + u.chapters.length, 0),
      topicCount: allTopics.length,
      sentenceCount: allSentences.length,
      termCount: allTerms.length,
      wordCount: cleanText.split(/\s+/).filter(Boolean).length
    }
  };
}
