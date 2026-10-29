import React, { useState, useEffect } from 'react';
import { 
  BookMarked, 
  Sparkles, 
  Download, 
  Printer, 
  Search, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Bookmark, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { generateSummaries } from '../engine/summarizerEngine';
import { exportNotesToMarkdown, printDocument } from '../utils/exportUtils';

export function SummariesView({ 
  activeSyllabus, 
  summaries = null, 
  onSaveSummaries 
}) {
  const [activeTab, setActiveTab] = useState('bullets'); // 'bullets', 'glossary', 'chapters', 'executive'
  const [compressionRatio, setCompressionRatio] = useState(0.45);
  const [filterTopic, setFilterTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Compute or generate summaries if not already present
  useEffect(() => {
    if (activeSyllabus?.parsedData && !summaries) {
      const generated = generateSummaries(activeSyllabus.parsedData, {
        compressionRatio,
        topicId: filterTopic
      });
      onSaveSummaries(generated);
    }
  }, [activeSyllabus]);

  // Re-run summarization when slider or topic changes
  const handleRegenerate = (ratio = compressionRatio, topic = filterTopic) => {
    if (!activeSyllabus?.parsedData) return;
    const generated = generateSummaries(activeSyllabus.parsedData, {
      compressionRatio: ratio,
      topicId: topic
    });
    onSaveSummaries(generated);
  };

  const handleRatioChange = (val) => {
    const num = parseFloat(val);
    setCompressionRatio(num);
    handleRegenerate(num, filterTopic);
  };

  const handleTopicChange = (topicId) => {
    setFilterTopic(topicId);
    handleRegenerate(compressionRatio, topicId);
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePrintStudyGuide = () => {
    if (!summaries) return;

    let body = `<h1>Study Guide & Revision Notes: ${activeSyllabus?.name || 'Syllabus'}</h1>`;
    body += `<div class="meta">Extractive Revision Notes • Generated via Local Rule-Based NLP • 100% Grounded</div>`;

    body += `<h2>1. High-Yield Revision Points</h2>`;
    summaries.revisionBullets?.forEach((b, idx) => {
      body += `<div class="q-block"><strong>[${b.chapterTitle || 'Core'}]</strong> ${b.text}</div>`;
    });

    body += `<h2>2. Core Definitions Glossary</h2>`;
    summaries.keyDefinitions?.forEach(d => {
      body += `<div class="def-item"><span class="def-term">${d.term}:</span> ${d.definition} <em>(${d.chapterTitle || 'Syllabus'})</em></div>`;
    });

    body += `<h2>3. Chapter-Wise Condensed Notes</h2>`;
    summaries.chapterSummaries?.forEach(c => {
      body += `<h3>${c.chapterTitle}</h3>`;
      c.sentences?.forEach(s => {
        body += `<p style="background: #f8fafc; padding: 8px 12px; border-left: 3px solid #6366f1; margin-bottom: 8px;">${s}</p>`;
      });
    });

    printDocument(`Study Guide - ${activeSyllabus?.name || 'Notes'}`, body);
  };

  const allTopics = activeSyllabus?.parsedData?.allTopics || [];
  const currentSummaries = summaries || {
    executiveSummary: [],
    chapterSummaries: [],
    keyDefinitions: [],
    revisionBullets: [],
    stats: { originalSentences: 0, summarySentences: 0, compression: '0%' }
  };

  // Filter definitions for search
  const filteredDefs = currentSummaries.keyDefinitions.filter(d => {
    if (!searchQuery) return true;
    const t = `${d.term} ${d.definition} ${d.chapterTitle || ''}`.toLowerCase();
    return t.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900">Extractive Summaries & Notes</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
              {currentSummaries.stats?.compression || 'Condensing'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sentences scored and condensed using TF-IDF term density and position heuristics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleRegenerate()}
            title="Recalculate Summary"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => exportNotesToMarkdown(activeSyllabus?.name || 'Syllabus', currentSummaries)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handlePrintStudyGuide}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Print Study Guide"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compression & Topic Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Compression Presets */}
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Detail Level:</span>
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => handleRatioChange(0.25)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  compressionRatio <= 0.3 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quick (25%)
              </button>
              <button
                onClick={() => handleRatioChange(0.45)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  compressionRatio > 0.3 && compressionRatio <= 0.55 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Balanced (45%)
              </button>
              <button
                onClick={() => handleRatioChange(0.70)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  compressionRatio > 0.55 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Detailed (70%)
              </button>
            </div>
          </div>

          {/* Topic Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">Filter Topic:</span>
            <select
              value={filterTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Entire Syllabus ({allTopics.length} Topics)</option>
              {allTopics.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Grounding Guarantee Callout */}
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Strict Grounding Guarantee:</strong> Generated via extractive NLP scoring. Every summary sentence and definition is sourced directly from your uploaded syllabus without synthetic hallucination.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('bullets')}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'bullets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>High-Yield Revision Points ({currentSummaries.revisionBullets?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'glossary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Key Definitions Glossary ({currentSummaries.keyDefinitions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'chapters'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Chapter-Wise Condensed Notes</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: HIGH-YIELD REVISION BULLETS
          ======================================================== */}
      {activeTab === 'bullets' && (
        <div className="space-y-3">
          {currentSummaries.revisionBullets && currentSummaries.revisionBullets.length > 0 ? (
            currentSummaries.revisionBullets.map((bullet, idx) => (
              <div 
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-indigo-700 mb-0.5">
                      {bullet.chapterTitle || 'Key Concept'}
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed">
                      {bullet.text}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyText(bullet.text, idx)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy Point"
                >
                  {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              No revision bullets generated. Try adjusting the detail level or loading a syllabus.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: KEY DEFINITIONS GLOSSARY
          ======================================================== */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          <div className="max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search definition terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDefs.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-200 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {item.term}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700">
                    Definition
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.definition}
                </p>
                <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                  Topic: {item.chapterTitle || 'Syllabus Core'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CHAPTER-WISE CONDENSED NOTES
          ======================================================== */}
      {activeTab === 'chapters' && (
        <div className="space-y-6">
          {currentSummaries.chapterSummaries?.map((chap, cIdx) => (
            <div 
              key={cIdx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>{chap.chapterTitle}</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {chap.sentences.length} Key Sentences
                </span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {chap.sentences.map((sent, sIdx) => (
                  <p key={sIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    {sent}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
