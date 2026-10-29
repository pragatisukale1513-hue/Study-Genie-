import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Sparkles, 
  Printer, 
  TrendingUp,
  BarChart3,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { printDocument } from '../utils/exportUtils';

export function MockTestView({ 
  activeSyllabus, 
  questions = [], 
  onSaveTestResult,
  testHistory = [] 
}) {
  const [phase, setPhase] = useState('setup'); // 'setup', 'exam', 'results'

  // Setup options
  const [testCount, setTestCount] = useState(10);
  const [testTopicId, setTestTopicId] = useState('all');
  const [isTimed, setIsTimed] = useState(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [includeTypes, setIncludeTypes] = useState({ mcq: true, true_false: true, fill_blank: true });

  // Active exam state
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: answer }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const timerRef = useRef(null);

  // Result state
  const [latestResult, setLatestResult] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'incorrect', 'flagged'

  // Timer countdown hook
  useEffect(() => {
    if (phase === 'exam' && isTimed) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpentSeconds(s => s + 1);
      }, 1000);
    } else if (phase === 'exam' && !isTimed) {
      timerRef.current = setInterval(() => {
        setTimeSpentSeconds(s => s + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isTimed]);

  // Start Exam
  const handleStartExam = () => {
    // Filter questions by selected criteria
    let candidates = questions.filter(q => {
      if (!includeTypes[q.type]) return false;
      if (testTopicId !== 'all' && q.topicId !== testTopicId) return false;
      return true;
    });

    if (candidates.length === 0) {
      alert('No matching questions available. Please adjust topic or question types in setup.');
      return;
    }

    // Shuffle and pick count
    const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, testCount);

    setExamQuestions(shuffled);
    setCurrentIdx(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setSecondsRemaining(timeLimitMinutes * 60);
    setTimeSpentSeconds(0);
    setPhase('exam');
  };

  // Select answer for current question
  const handleSelectAnswer = (ans) => {
    const q = examQuestions[currentIdx];
    setUserAnswers(prev => ({
      ...prev,
      [q.id]: ans
    }));
  };

  // Toggle flag
  const handleToggleFlag = () => {
    const q = examQuestions[currentIdx];
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  // Auto-submit when time expires
  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your test automatically.');
    finalizeExam();
  };

  // Manual submit
  const handleSubmitExam = () => {
    const answeredCount = Object.keys(userAnswers).length;
    const unanswered = examQuestions.length - answeredCount;

    if (unanswered > 0) {
      if (!window.confirm(`You still have ${unanswered} unanswered question(s). Are you sure you want to submit?`)) {
        return;
      }
    }
    finalizeExam();
  };

  // Finalize exam calculation
  const finalizeExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    let score = 0;
    const topicBreakdown = {};

    examQuestions.forEach(q => {
      const topicName = q.topicTitle || 'General Concepts';
      if (!topicBreakdown[topicName]) {
        topicBreakdown[topicName] = { correct: 0, total: 0 };
      }
      topicBreakdown[topicName].total++;

      const userAns = userAnswers[q.id];
      let isCorrect = false;

      if (userAns !== undefined) {
        if (q.type === 'fill_blank') {
          // Case-insensitive trimmed check
          isCorrect = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        } else {
          isCorrect = userAns === q.correctAnswer;
        }
      }

      if (isCorrect) {
        score++;
        topicBreakdown[topicName].correct++;
      }
    });

    const percentage = Math.round((score / (examQuestions.length || 1)) * 100);

    const result = {
      id: `test_${Date.now()}`,
      syllabusId: activeSyllabus?.id,
      date: new Date().toISOString(),
      score,
      totalQuestions: examQuestions.length,
      percentage,
      timeSpentSeconds,
      topicBreakdown,
      questions: examQuestions,
      userAnswers
    };

    setLatestResult(result);
    onSaveTestResult(result);
    setPhase('results');

    // Confetti celebration if passed with >= 70%
    if (percentage >= 70) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Retake only missed questions
  const handleRetakeMissed = () => {
    if (!latestResult) return;
    const missed = latestResult.questions.filter(q => {
      const u = latestResult.userAnswers[q.id];
      if (u === undefined) return true;
      if (q.type === 'fill_blank') {
        return u.trim().toLowerCase() !== q.correctAnswer.trim().toLowerCase();
      }
      return u !== q.correctAnswer;
    });

    if (missed.length === 0) {
      alert('You got 100%! No missed questions to retake.');
      return;
    }

    setExamQuestions(missed);
    setCurrentIdx(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setSecondsRemaining(Math.max(5, missed.length * 2) * 60);
    setTimeSpentSeconds(0);
    setPhase('exam');
  };

  // Print scorecard
  const handlePrintScorecard = () => {
    if (!latestResult) return;

    let body = `<h1>Mock Test Report: ${activeSyllabus?.name || 'Exam'}</h1>`;
    body += `<div class="meta">Score: ${latestResult.score}/${latestResult.totalQuestions} (${latestResult.percentage}%) • Date: ${new Date(latestResult.date).toLocaleString()}</div>`;

    body += `<h2>Topic Mastery Breakdown</h2>`;
    Object.entries(latestResult.topicBreakdown).forEach(([tName, data]) => {
      const pct = Math.round((data.correct / data.total) * 100);
      body += `<div><strong>${tName}:</strong> ${data.correct}/${data.total} (${pct}%)</div>`;
    });

    body += `<h2>Detailed Question Review</h2>`;
    latestResult.questions.forEach((q, idx) => {
      const u = latestResult.userAnswers[q.id] || 'Not Answered';
      const isRight = q.type === 'fill_blank' 
        ? u.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        : u === q.correctAnswer;

      body += `<div class="q-block">`;
      body += `<div class="q-prompt">${idx + 1}. ${q.prompt}</div>`;
      body += `<div><strong>Your Answer:</strong> <span style="color: ${isRight ? '#047857' : '#b91c1c'}">${u}</span></div>`;
      body += `<div class="q-ans"><strong>Correct Answer:</strong> ${q.correctAnswer}</div>`;
      if (q.explanation) {
        body += `<div style="font-size: 12px; color: #64748b;">Source: ${q.explanation}</div>`;
      }
      body += `</div>`;
    });

    printDocument(`Scorecard - ${activeSyllabus?.name || 'Quiz'}`, body);
  };

  const allTopics = activeSyllabus?.parsedData?.allTopics || [];
  const currentQ = examQuestions[currentIdx];

  // Format time remaining MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================
          PHASE 1: TEST SETUP SCREEN
          ======================================================== */}
      {phase === 'setup' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" />
                <span>Exam Simulator</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Configure Mock Test
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Customize question volume, topics, and countdown timer. Results include topic mastery analytics and source citation reviews.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Question Count */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Number of Questions
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 30].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setTestCount(cnt)}
                      className={`py-2 rounded-xl font-bold transition-all border ${
                        testCount === cnt 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Topic */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Topic Scope
                </label>
                <select
                  value={testTopicId}
                  onChange={(e) => setTestTopicId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">Entire Syllabus (All Topics)</option>
                  {allTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {/* Question Types */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Include Question Types
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={includeTypes.mcq}
                      onChange={(e) => setIncludeTypes({ ...includeTypes, mcq: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium">MCQs</span>
                  </label>
                  <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={includeTypes.true_false}
                      onChange={(e) => setIncludeTypes({ ...includeTypes, true_false: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium">True / False</span>
                  </label>
                  <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={includeTypes.fill_blank}
                      onChange={(e) => setIncludeTypes({ ...includeTypes, fill_blank: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium">Fill Blanks</span>
                  </label>
                </div>
              </div>

              {/* Timer Settings */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-800">Timed Exam Mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTimed}
                    onChange={(e) => setIsTimed(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {isTimed && (
                  <div className="flex items-center space-x-3 pt-1">
                    <span className="text-xs text-slate-600">Time Limit:</span>
                    <div className="flex space-x-2">
                      {[10, 15, 20, 30].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setTimeLimitMinutes(mins)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            timeLimitMinutes === mins 
                              ? 'bg-indigo-600 text-white border-indigo-600' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartExam}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>Begin Timed Mock Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE 2: ACTIVE TIMED EXAM SIMULATION
          ======================================================== */}
      {phase === 'exam' && currentQ && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Top Exam Header & Timer */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                {currentIdx + 1}/{examQuestions.length}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {currentQ.topicTitle || 'Mock Quiz Question'}
                </h3>
                <span className="text-xs text-slate-400 capitalize">
                  {currentQ.type.replace('_', ' ')} • {currentQ.difficulty}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isTimed && (
                <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
                  secondsRemaining < 120 
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(secondsRemaining)}</span>
                </div>
              )}

              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Submit Exam
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Main Question Area (3 Cols) */}
            <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question {currentIdx + 1}
                </span>
                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    flaggedQuestions.has(currentQ.id)
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions.has(currentQ.id) ? 'Flagged' : 'Flag for Review'}</span>
                </button>
              </div>

              {/* Prompt */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQ.prompt}
              </div>

              {/* Interaction by Question Type */}
              {currentQ.type === 'mcq' && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = userAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(opt)}
                        className={`w-full p-4 rounded-xl border text-left text-sm font-medium flex items-center space-x-3 transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-400/20 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {letter}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {['True', 'False'].map((choice) => {
                    const isSelected = userAnswers[currentQ.id] === choice;
                    return (
                      <button
                        key={choice}
                        onClick={() => handleSelectAnswer(choice)}
                        className={`p-6 rounded-2xl border text-center font-bold text-base transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-400/20 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'fill_blank' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Type your answer:
                  </label>
                  <input
                    type="text"
                    value={userAnswers[currentQ.id] || ''}
                    onChange={(e) => handleSelectAnswer(e.target.value)}
                    placeholder="Enter the missing term..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  />
                  {currentQ.hint && (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                      💡 {currentQ.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-slate-400 font-medium">
                  {Object.keys(userAnswers).length} of {examQuestions.length} Answered
                </div>

                <button
                  onClick={() => setCurrentIdx(prev => Math.min(examQuestions.length - 1, prev + 1))}
                  disabled={currentIdx === examQuestions.length - 1}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-colors flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Question Navigator Palette (1 Col) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question Palette
              </div>

              <div className="grid grid-cols-4 gap-2">
                {examQuestions.map((q, qIdx) => {
                  const isAnswered = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                  const isFlagged = flaggedQuestions.has(q.id);
                  const isCurrent = currentIdx === qIdx;

                  let btnClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (isAnswered) btnClass = 'bg-indigo-600 text-white border-indigo-600';
                  if (isFlagged) btnClass = 'bg-amber-400 text-slate-900 border-amber-500';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(qIdx)}
                      className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center border transition-all ${btnClass} ${
                        isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : ''
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-indigo-600" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-amber-400" />
                  <span>Flagged for Review</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          PHASE 3: COMPREHENSIVE RESULTS SCORECARD
          ======================================================== */}
      {phase === 'results' && latestResult && (
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* Hero Scorecard */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6 text-center md:text-left">
              {/* Score Circular Ring Badge */}
              <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center font-extrabold border-4 shadow-md ${
                latestResult.percentage >= 80 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                  : latestResult.percentage >= 60 
                    ? 'border-amber-500 bg-amber-50 text-amber-800' 
                    : 'border-rose-500 bg-rose-50 text-rose-800'
              }`}>
                <span className="text-3xl tracking-tight">{latestResult.percentage}%</span>
                <span className="text-xs font-semibold">{latestResult.score}/{latestResult.totalQuestions}</span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Performance Evaluation
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {latestResult.percentage >= 80 ? 'Outstanding Mastery! 🎉' : latestResult.percentage >= 60 ? 'Solid Effort! Good Progress 👍' : 'Needs More Revision 📚'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Completed in {Math.round(latestResult.timeSpentSeconds / 60)} minutes {latestResult.timeSpentSeconds % 60} seconds.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRetakeMissed}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Missed Only</span>
              </button>

              <button
                onClick={() => setPhase('setup')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                New Mock Test
              </button>

              <button
                onClick={handlePrintScorecard}
                className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Print Full Score Report"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Topic Mastery Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Topic Mastery Matrix</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(latestResult.topicBreakdown).map(([tName, data], idx) => {
                const pct = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="truncate pr-2">{tName}</span>
                      <span className={pct >= 70 ? 'text-emerald-700' : 'text-amber-700'}>
                        {data.correct}/{data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question-by-Question Review */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">
                Question Review & Authoritative Citations
              </h3>

              {/* Review Filter */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reviewFilter === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  All ({latestResult.questions.length})
                </button>
                <button
                  onClick={() => setReviewFilter('incorrect')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reviewFilter === 'incorrect' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Incorrect Only ({latestResult.totalQuestions - latestResult.score})
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {latestResult.questions.map((q, idx) => {
                const userAns = latestResult.userAnswers[q.id];
                const isCorrect = q.type === 'fill_blank'
                  ? userAns && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                  : userAns === q.correctAnswer;

                if (reviewFilter === 'incorrect' && isCorrect) return null;

                return (
                  <div 
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isCorrect ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">
                        #{idx + 1} • {q.topicTitle || 'General'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-sm sm:text-base">
                      {q.prompt}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-semibold text-slate-500 block mb-0.5">Your Answer:</span>
                        <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {userAns || '(No Answer)'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-semibold text-slate-500 block mb-0.5">Correct Answer:</span>
                        <span className="font-bold text-slate-800">
                          {q.correctAnswer}
                        </span>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                        <strong className="text-indigo-900">Authoritative Source: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
