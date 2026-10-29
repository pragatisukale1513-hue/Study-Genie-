import React, { useState } from 'react';
import { 
  HelpCircle, 
  Filter, 
  Sparkles, 
  Download, 
  Printer, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Check, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { generateQuestionBank } from '../engine/questionEngine';
import { exportQuestionsToTXT, printDocument } from '../utils/exportUtils';

export function QuestionBankView({ 
  activeSyllabus, 
  questions = [], 
  onSaveQuestions,
  preselectedTopicId = null
}) {
  const [filterTopic, setFilterTopic] = useState(preselectedTopicId || 'all');
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generation modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTopicId, setGenTopicId] = useState(preselectedTopicId || 'all');
  const [genCount, setGenCount] = useState(15);
  const [genDifficulty, setGenDifficulty] = useState('all');
  const [genTypes, setGenTypes] = useState({
    mcq: true,
    true_false: true,
    fill_blank: true,
    short_answer: true,
    long_answer: true
  });

  // Reveal answer states (set of question IDs whose answer is shown)
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());

  // Add custom question modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq',
    prompt: '',
    difficulty: 'medium',
    correctAnswer: '',
    options: ['', '', '', ''],
    topicTitle: ''
  });

  const handleToggleReveal = (id) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRevealAll = () => {
    if (revealedAnswers.size === filteredQuestions.length) {
      setRevealedAnswers(new Set());
    } else {
      setRevealedAnswers(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // Run Rule-Based Generation
  const handleGenerate = () => {
    if (!activeSyllabus || !activeSyllabus.parsedData) return;

    const selectedTypeKeys = Object.entries(genTypes)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);

    if (selectedTypeKeys.length === 0) {
      alert('Please select at least one question type.');
      return;
    }

    const newQuestions = generateQuestionBank(activeSyllabus.parsedData, {
      topicId: genTopicId,
      types: selectedTypeKeys,
      difficulty: genDifficulty,
      count: genCount
    });

    onSaveQuestions(newQuestions);
    setShowGenerateModal(false);
  };

  // Delete single question
  const handleDeleteQuestion = (id) => {
    const updated = questions.filter(q => q.id !== id);
    onSaveQuestions(updated);
  };

  // Add Custom Question
  const handleAddQuestionSubmit = (e) => {
    e.preventDefault();
    if (!newQuestion.prompt.trim()) return;

    const customQ = {
      id: `q_custom_${Date.now()}`,
      type: newQuestion.type,
      difficulty: newQuestion.difficulty,
      prompt: newQuestion.prompt.trim(),
      options: newQuestion.type === 'mcq' ? newQuestion.options.filter(o => o.trim()) : (newQuestion.type === 'true_false' ? ['True', 'False'] : []),
      correctAnswer: newQuestion.correctAnswer.trim(),
      derivedReliably: true,
      reviewRequired: newQuestion.type === 'long_answer',
      topicTitle: newQuestion.topicTitle || 'Custom Topic',
      explanation: 'User-created custom question.'
    };

    onSaveQuestions([customQ, ...questions]);
    setShowAddModal(false);
    setNewQuestion({
      type: 'mcq',
      prompt: '',
      difficulty: 'medium',
      correctAnswer: '',
      options: ['', '', '', ''],
      topicTitle: ''
    });
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (filterTopic !== 'all' && q.topicId !== filterTopic && q.topicTitle !== filterTopic) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    if (searchQuery) {
      const qText = `${q.prompt} ${q.correctAnswer} ${q.topicTitle || ''}`.toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Handle Print Exam Paper
  const handlePrintExam = () => {
    if (filteredQuestions.length === 0) return;

    let body = `<h1>${activeSyllabus?.name || 'Exam Paper'}</h1>`;
    body += `<div class="meta">StudyGenie Verified Question Bank • Total Questions: ${filteredQuestions.length}</div>`;
    
    filteredQuestions.forEach((q, idx) => {
      body += `<div class="q-block">`;
      body += `<div class="q-prompt">${idx + 1}. <span class="badge">${q.type.toUpperCase()}</span> ${q.prompt}</div>`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          body += `<div class="q-opt">(${String.fromCharCode(65 + oIdx)}) ${opt}</div>`;
        });
      }
      body += `<div class="q-ans"><strong>Answer:</strong> ${q.correctAnswer}</div>`;
      if (q.explanation) {
        body += `<div style="font-size: 12px; color: #64748b;">Source: ${q.explanation}</div>`;
      }
      body += `</div>`;
    });

    printDocument(`Exam Paper - ${activeSyllabus?.name || 'Questions'}`, body);
  };

  const allTopics = activeSyllabus?.parsedData?.allTopics || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900">Question Bank</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
              {questions.length} Questions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Questions generated from syllabus sentences using NLP sentence rules & smart distractors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-100 flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Questions</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Add Custom</span>
          </button>

          <button
            onClick={() => exportQuestionsToTXT(activeSyllabus?.name || 'Syllabus', filteredQuestions)}
            disabled={filteredQuestions.length === 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 disabled:opacity-40 transition-colors"
            title="Download as TXT"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrintExam}
            disabled={filteredQuestions.length === 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 disabled:opacity-40 transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic Filter */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Topics ({allTopics.length})</option>
            {allTopics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="true_false">True / False</option>
            <option value="fill_blank">Fill in Blanks</option>
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer Prompts</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Reveal Answers Toggle */}
          <button
            onClick={handleRevealAll}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold flex items-center space-x-1"
          >
            {revealedAnswers.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Hide All Answers</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Show All Answers</span>
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-60">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
          </input>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">
            {questions.length === 0 ? 'No Questions in Bank Yet' : 'No Matching Questions Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {questions.length === 0 
              ? 'Click "Generate Questions" above to run the local NLP rule engine across your syllabus.'
              : 'Try clearing the filters or searching for different keywords.'}
          </p>
          {questions.length === 0 && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all inline-flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate Questions Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isRevealed = revealedAnswers.has(q.id);

            // Badge styling
            const typeLabels = {
              mcq: { label: 'MCQ', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              true_false: { label: 'True / False', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              fill_blank: { label: 'Fill in Blank', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
              short_answer: { label: 'Short Answer', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
              long_answer: { label: 'Long Answer Prompt', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
            };

            const diffColors = {
              easy: 'bg-emerald-100 text-emerald-800',
              medium: 'bg-amber-100 text-amber-800',
              hard: 'bg-rose-100 text-rose-800'
            };

            const currentType = typeLabels[q.type] || { label: q.type, bg: 'bg-slate-100 text-slate-700 border-slate-200' };

            return (
              <div 
                key={q.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-3"
              >
                {/* Card Top Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${currentType.bg}`}>
                      {currentType.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${diffColors[q.difficulty] || 'bg-slate-100'}`}>
                      {q.difficulty}
                    </span>
                    {q.topicTitle && (
                      <span className="text-xs text-slate-500 font-medium">
                        • {q.topicTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Derivation / Review status badge */}
                    {q.derivedReliably ? (
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200" title="Answer strictly derived from syllabus sentence">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Verified Source
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200" title="Subjective question requiring review">
                        <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                        Teacher Review Required
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete Question"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prompt */}
                <div className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                  {q.prompt}
                </div>

                {/* MCQ Options Rendering */}
                {q.type === 'mcq' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = isRevealed && opt === q.correctAnswer;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-center space-x-2.5 transition-colors ${
                            isCorrect 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {letter}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill in Blank Hint */}
                {q.type === 'fill_blank' && q.hint && !isRevealed && (
                  <div className="text-xs text-amber-700 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                    💡 {q.hint}
                  </div>
                )}

                {/* Toggle Answer Section */}
                <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                  <button
                    onClick={() => handleToggleReveal(q.id)}
                    className="self-start text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isRevealed ? 'Hide Answer' : 'Show Answer & Source'}</span>
                  </button>

                  {isRevealed && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                      <div className="font-bold text-emerald-800 flex items-center space-x-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Answer: {q.correctAnswer}</span>
                      </div>
                      {q.explanation && (
                        <div className="text-slate-600 italic">
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: GENERATE QUESTIONS
          ======================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Generate Question Bank</h3>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Topic
              </label>
              <select
                value={genTopicId}
                onChange={(e) => setGenTopicId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Entire Syllabus (All Topics)</option>
                {allTopics.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Question Types Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Question Types to Include
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={genTypes.mcq}
                    onChange={(e) => setGenTypes({ ...genTypes, mcq: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Multiple Choice (MCQ)</span>
                </label>
                <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={genTypes.true_false}
                    onChange={(e) => setGenTypes({ ...genTypes, true_false: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>True / False</span>
                </label>
                <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={genTypes.fill_blank}
                    onChange={(e) => setGenTypes({ ...genTypes, fill_blank: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Fill in the Blanks</span>
                </label>
                <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={genTypes.short_answer}
                    onChange={(e) => setGenTypes({ ...genTypes, short_answer: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Short Answer</span>
                </label>
                <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 col-span-2">
                  <input
                    type="checkbox"
                    checked={genTypes.long_answer}
                    onChange={(e) => setGenTypes({ ...genTypes, long_answer: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Long Answer Prompts (Review Required)</span>
                </label>
              </div>
            </div>

            {/* Difficulty & Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Mixed (All Difficulties)</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Number of Questions
                </label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="25">25 Questions</option>
                  <option value="40">40 Questions</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Questions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD CUSTOM QUESTION
          ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Custom Question</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_blank">Fill in Blank</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="long_answer">Long Answer Prompt</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  value={newQuestion.prompt}
                  onChange={(e) => setNewQuestion({ ...newQuestion, prompt: e.target.value })}
                  placeholder="Enter the question text..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              {newQuestion.type === 'mcq' && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Options (A, B, C, D)</label>
                  {newQuestion.options.map((opt, oIdx) => (
                    <input
                      key={oIdx}
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newQuestion.options];
                        updated[oIdx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: updated });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correct Answer</label>
                <input
                  type="text"
                  placeholder="Enter the exact correct answer..."
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
