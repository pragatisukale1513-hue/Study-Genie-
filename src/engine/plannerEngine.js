/**
 * StudyGenie - Intelligent Exam Study Planner Engine
 * Generates an adaptive, day-by-day study timetable based on syllabus volume and exam deadline
 */

export function generateStudyPlan(parsedSyllabus, options = {}) {
  const {
    examDate,
    dailyHours = 2,
    studyPace = 'balanced' // 'relaxed', 'balanced', 'intensive'
  } = options;

  if (!parsedSyllabus || !parsedSyllabus.units || parsedSyllabus.units.length === 0) {
    return null;
  }

  // Calculate days available
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = examDate ? new Date(examDate) : new Date(today.getTime() + 14 * 86400000);
  targetDate.setHours(0, 0, 0, 0);

  let daysAvailable = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
  if (daysAvailable < 1) daysAvailable = 7; // Default to 1-week crash course if exam is today/passed

  // Collect all chapters
  const allChapters = [];
  for (const unit of parsedSyllabus.units) {
    for (const chap of unit.chapters) {
      allChapters.push({
        chapterId: chap.id,
        chapterTitle: chap.title,
        unitTitle: unit.title,
        topics: chap.topics.map(t => ({ id: t.id, title: t.title })),
        sentenceCount: chap.topics.reduce((acc, t) => acc + (t.sentences ? t.sentences.length : 0), 0)
      });
    }
  }

  if (allChapters.length === 0) return null;

  // Reserve 15-25% of days at the end for Final Mock Exams & Revision
  const revisionDaysCount = Math.max(1, Math.min(4, Math.floor(daysAvailable * 0.2)));
  const learningDaysCount = Math.max(1, daysAvailable - revisionDaysCount);

  // Distribute chapters across learning days
  const schedule = [];
  const chaptersPerDay = Math.ceil(allChapters.length / learningDaysCount);

  let currentChapIdx = 0;

  for (let day = 1; day <= learningDaysCount; day++) {
    const dayDate = new Date(today.getTime() + day * 86400000);
    const assignedChapters = [];

    for (let c = 0; c < chaptersPerDay && currentChapIdx < allChapters.length; c++) {
      assignedChapters.push(allChapters[currentChapIdx]);
      currentChapIdx++;
    }

    if (assignedChapters.length === 0 && allChapters.length > 0) {
      // Loop or review previous chapters
      assignedChapters.push(allChapters[(day - 1) % allChapters.length]);
    }

    const assignedTopics = assignedChapters.flatMap(c => c.topics);

    schedule.push({
      dayNumber: day,
      date: dayDate.toISOString().split('T')[0],
      displayDate: dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      phase: 'Concept Learning & Drill',
      assignedChapters: assignedChapters.map(c => ({ id: c.chapterId, title: c.chapterTitle, unit: c.unitTitle })),
      assignedTopics: assignedTopics.slice(0, 4),
      allocatedHours: Number(dailyHours),
      tasks: [
        { id: `t_${day}_1`, text: `Read & review concepts in ${assignedChapters.map(c => c.chapterTitle).join(', ')}`, duration: `${Math.round(dailyHours * 35)} mins`, completed: false },
        { id: `t_${day}_2`, text: `Active recall: Flashcards drill (${assignedTopics.length * 3 || 10} terms)`, duration: `${Math.round(dailyHours * 15)} mins`, completed: false },
        { id: `t_${day}_3`, text: `Practice 10-15 Question Bank items for this chapter`, duration: `${Math.round(dailyHours * 10)} mins`, completed: false }
      ],
      completed: false
    });
  }

  // Add Final Mock Test & Revision Days
  for (let r = 1; r <= revisionDaysCount; r++) {
    const dayNumber = learningDaysCount + r;
    const dayDate = new Date(today.getTime() + dayNumber * 86400000);
    const isLastDay = r === revisionDaysCount;

    schedule.push({
      dayNumber,
      date: dayDate.toISOString().split('T')[0],
      displayDate: dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      phase: isLastDay ? 'Final Exam Simulation & Readiness' : 'High-Yield Consolidation',
      assignedChapters: allChapters.slice(0, Math.ceil(allChapters.length / 2)).map(c => ({ id: c.chapterId, title: c.chapterTitle, unit: c.unitTitle })),
      assignedTopics: [{ id: 'rev_all', title: 'Comprehensive Syllabus Review' }],
      allocatedHours: Number(dailyHours),
      tasks: isLastDay ? [
        { id: `t_${dayNumber}_1`, text: 'Take Full-Length Timed Mock Exam (30 Questions)', duration: '60 mins', completed: false },
        { id: `t_${dayNumber}_2`, text: 'Analyze missed answers and review authoritative explanations', duration: '30 mins', completed: false },
        { id: `t_${dayNumber}_3`, text: 'Light review of High-Yield Summary notes before exam day', duration: '30 mins', completed: false }
      ] : [
        { id: `t_${dayNumber}_1`, text: 'Review High-Yield Revision Bullets & Key Definitions Glossary', duration: '45 mins', completed: false },
        { id: `t_${dayNumber}_2`, text: 'Run timed mini-mock tests on flagged weak topics', duration: '45 mins', completed: false },
        { id: `t_${dayNumber}_3`, text: 'Flip through all "Mastered" and "Learning" flashcards', duration: '30 mins', completed: false }
      ],
      completed: false
    });
  }

  return {
    examDate: targetDate.toISOString().split('T')[0],
    dailyHours: Number(dailyHours),
    studyPace,
    totalDays: schedule.length,
    learningDaysCount,
    revisionDaysCount,
    schedule,
    createdAt: new Date().toISOString()
  };
}
