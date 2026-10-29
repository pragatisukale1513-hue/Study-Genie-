import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  PlusCircle, 
  Download, 
  Printer, 
  Eye, 
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateFlashcards } from '../engine/flashcardEngine';
import { exportFlashcardsToCSV, printDocument } from '../utils/exportUtils';

export function FlashcardsView({ 
  activeSyllabus, 
  flashcards = [], 
  onSaveFlashcards 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'learning', 'mastered'
  const [viewMode, setViewMode] = useState('drill'); // 'drill' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');

  // Add custom card modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '', category: 'Core Concept', chapterTitle: '' });

  // Filter cards
  const filteredCards = flashcards.filter(c => {
    if (filterTopic !== 'all' && c.topicId !== filterTopic && c.topicTitle !== filterTopic) return false;
    if (filterStatus === 'learning' && c.status === 'mastered') return false;
    if (filterStatus === 'mastered' && c.status !== 'mastered') return false;
    if (searchQuery) {
      const text = `${c.front} ${c.back} ${c.topicTitle || ''}`.toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Clamp current index when filter changes
  useEffect(() => {
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  }, [filterTopic, filterStatus, filteredCards.length]);

  // Keyboard navigation (Space: flip, Left: prev, Right: next)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'drill' || showAddModal) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, showAddModal, currentIndex, filteredCards.length]);

  // Re-run flashcard generation from syllabus
  const handleRegenerate = () => {
    if (!activeSyllabus || !activeSyllabus.parsedData) return;
    const generated = generateFlashcards(activeSyllabus.parsedData);
    onSaveFlashcards(generated);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 150);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => 0.5 - Math.random());
    onSaveFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleMarkMastered = () => {
    if (filteredCards.length === 0) return;
    const currentCard = filteredCards[currentIndex];
    const updated = flashcards.map(c => 
      c.id === currentCard.id ? { ...c, status: 'mastered', reviewsCount: (c.reviewsCount || 0) + 1 } : c
    );
    onSaveFlashcards(updated);

    // If all cards mastered, trigger celebratory confetti!
    const masteredCount = updated.filter(c => c.status === 'mastered').length;
    if (masteredCount === updated.length && updated.length > 0) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    handleNext();
  };

  const handleMarkLearning = () => {
    if (filteredCards.length === 0) return;
    const currentCard = filteredCards[currentIndex];
    const updated = flashcards.map(c => 
      c.id === currentCard.id ? { ...c, status: 'learning', reviewsCount: (c.reviewsCount || 0) + 1 } : c
    );
    onSaveFlashcards(updated);
    handleNext();
  };

  const handleResetMastery = () => {
    if (window.confirm('Reset mastery status for all flashcards back to "Learning"?')) {
      const reset = flashcards.map(c => ({ ...c, status: 'learning' }));
      onSaveFlashcards(reset);
    }
  };

  const handleAddCardSubmit = (e) => {
    e.preventDefault();
    if (!newCard.front.trim() || !newCard.back.trim()) return;

    const customCard = {
      id: `fc_custom_${Date.now()}`,
      front: newCard.front.trim(),
      back: newCard.back.trim(),
      category: newCard.category || 'Core Concept',
      chapterTitle: newCard.chapterTitle || 'User Cards',
      status: 'learning',
      reviewsCount: 0
    };

    onSaveFlashcards([customCard, ...flashcards]);
    setShowAddModal(false);
    setNewCard({ front: '', back: '', category: 'Core Concept', chapterTitle: '' });
  };

  const handlePrintFlashcards = () => {
    if (filteredCards.length === 0) return;

    let body = `<h1>Flashcards: ${activeSyllabus?.name || 'Study Material'}</h1>`;
    body += `<div class="meta">Printable Revision Deck • Total Cards: ${filteredCards.length}</div>`;
    body += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">`;

    filteredCards.forEach((c, idx) => {
      body += `
        <div style="border: 2px dashed #94a3b8; padding: 15px; border-radius: 8px; page-break-inside: avoid;">
          <div style="font-size: 11px; text-transform: uppercase; color: #4338ca; font-weight: bold;">
            #${idx + 1} [${c.category || 'Term'}] - ${c.chapterTitle || 'General'}
          </div>
          <div style="font-size: 16px; font-weight: bold; margin: 8px 0; color: #0f172a;">
            ${c.front}
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 13px; color: #334155;">
            ${c.back}
          </div>
        </div>
      `;
    });
    body += `</div>`;

    printDocument(`Flashcards - ${activeSyllabus?.name || 'Deck'}`, body);
  };

  const masteredCount = flashcards.filter(c => c.status === 'mastered').length;
  const progressPct = flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0;
  const currentCard = filteredCards[currentIndex];
  const allTopics = activeSyllabus?.parsedData?.allTopics || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900">Active Recall Flashcards</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700">
              {flashcards.length} Cards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Definitions and core concepts parsed directly from your syllabus with flip drills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('drill')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'drill' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drill Mode
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card Deck View
            </button>
          </div>

          <button
            onClick={handleRegenerate}
            title="Re-extract Flashcards from Syllabus"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-purple-600" />
            <span>Add Card</span>
          </button>

          <button
            onClick={() => exportFlashcardsToCSV(activeSyllabus?.name || 'Syllabus', flashcards)}
            disabled={flashcards.length === 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 disabled:opacity-40 transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrintFlashcards}
            disabled={flashcards.length === 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 disabled:opacity-40 transition-colors"
            title="Print Cutout Cards"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <div className="flex items-center space-x-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mastery Status: {masteredCount} / {flashcards.length} cards mastered ({progressPct}%)</span>
          </div>
          <button
            onClick={handleResetMastery}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
          >
            Reset Progress
          </button>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(progressPct, flashcards.length > 0 ? 3 : 0))}%` }}
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic Filter */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="all">All Topics ({allTopics.length})</option>
            {allTopics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="all">All Cards ({flashcards.length})</option>
            <option value="learning">Still Learning ({flashcards.filter(c => c.status !== 'mastered').length})</option>
            <option value="mastered">Mastered Only ({masteredCount})</option>
          </select>

          <button
            onClick={handleShuffle}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 flex items-center space-x-1"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>

        <div className="w-full sm:w-60">
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50"
          />
        </div>
      </div>

      {/* ========================================================
          MODE 1: ACTIVE 3D DRILL MODE
          ======================================================== */}
      {viewMode === 'drill' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {filteredCards.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">No Flashcards Available</h3>
              <p className="text-xs text-slate-500 mb-4">
                {flashcards.length === 0 
                  ? 'Extract flashcards from your syllabus or add custom cards.' 
                  : 'No cards match the active filters.'}
              </p>
              {flashcards.length === 0 && (
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Generate Flashcards Now
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Card Index & State */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                <span>Card {currentIndex + 1} of {filteredCards.length}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  currentCard.status === 'mastered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentCard.status === 'mastered' ? 'Mastered' : 'Still Learning'}
                </span>
              </div>

              {/* 3D Flip Card Container */}
              <div 
                className="perspective-1000 w-full h-80 sm:h-96 cursor-pointer select-none"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  
                  {/* FRONT FACE (Term / Concept) */}
                  <div className="absolute inset-0 w-full h-full bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-lg flex flex-col justify-between backface-hidden hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {currentCard.category || 'Core Term'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                        {currentCard.chapterTitle || 'Syllabus Concept'}
                      </span>
                    </div>

                    <div className="text-center px-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Concept / Term
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                        {currentCard.front}
                      </h3>
                    </div>

                    <div className="text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Click or press <strong>Space</strong> to flip definition</span>
                    </div>
                  </div>

                  {/* BACK FACE (Definition / Explanation) */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-lg flex flex-col justify-between backface-hidden rotate-y-180">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                        Authoritative Definition
                      </span>
                      <span className="text-xs text-indigo-200 font-medium">
                        {currentCard.front}
                      </span>
                    </div>

                    <div className="px-2 overflow-y-auto max-h-48">
                      <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
                        {currentCard.back}
                      </p>
                    </div>

                    <div className="text-center text-xs text-indigo-300/80 flex items-center justify-center space-x-1.5">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Click to flip back to term</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Navigation & Mastery Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrev}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-colors"
                    title="Previous Card (Left Arrow)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-colors"
                    title="Next Card (Right Arrow)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={handleMarkLearning}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Review Again</span>
                  </button>

                  <button
                    onClick={handleMarkMastered}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-100 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Known</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================
          MODE 2: CARD DECK TABLE VIEW
          ======================================================== */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4 w-1/4">Term / Concept</th>
                  <th className="py-3 px-4">Definition & Explanation</th>
                  <th className="py-3 px-4 w-28">Category</th>
                  <th className="py-3 px-4 w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCards.map((card, idx) => (
                  <tr key={card.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{card.front}</td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">{card.back}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {card.category || 'Term'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        card.status === 'mastered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {card.status === 'mastered' ? 'Mastered' : 'Learning'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD CUSTOM FLASHCARD
          ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Custom Flashcard</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Front: Term or Concept</label>
                <input
                  type="text"
                  placeholder="e.g. Heuristic Evaluation, Mitochondria"
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Back: Definition or Explanation</label>
                <textarea
                  rows={4}
                  placeholder="Enter the detailed definition or concept explanation..."
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Formula, Rule, Term"
                    value={newCard.category}
                    onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chapter / Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 2"
                    value={newCard.chapterTitle}
                    onChange={(e) => setNewCard({ ...newCard, chapterTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
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
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
