import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Layers, 
  HelpCircle, 
  Trash2, 
  BookOpen,
  ArrowRight,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { extractTextFromPDF } from '../engine/pdfExtractor';
import { parseSyllabus } from '../engine/syllabusParser';
import { SAMPLE_SYLLABI } from '../data/sampleSyllabi';

export function SyllabusView({ 
  activeSyllabus, 
  onSaveSyllabus, 
  onDeleteSyllabus, 
  onNavigate,
  onGenerateForTopic 
}) {
  const [activeTab, setActiveTab] = useState(activeSyllabus ? 'explore' : 'upload');
  const [uploadMode, setUploadMode] = useState('file'); // 'file', 'paste', 'sample'
  const [pastedText, setPastedText] = useState('');
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnits, setExpandedUnits] = useState({ unit_1: true });
  const [selectedTopic, setSelectedTopic] = useState(null);

  // File Upload Handler (PDF or TXT)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setExtractionProgress(10);

    try {
      let rawText = '';
      const defaultName = file.name.replace(/\.[^/.]+$/, '');

      if (file.name.toLowerCase().endsWith('.pdf')) {
        rawText = await extractTextFromPDF(file, (progress) => {
          setExtractionProgress(progress);
        });
      } else {
        // Plain text / Markdown
        rawText = await file.text();
        setExtractionProgress(100);
      }

      if (!rawText.trim()) {
        throw new Error('The uploaded file was empty. Please provide a file with readable text.');
      }

      const parsed = parseSyllabus(rawText, subjectNameInput || defaultName);
      
      const newSyllabus = {
        id: `syl_${Date.now()}`,
        name: subjectNameInput || parsed.subject || defaultName,
        rawText,
        parsedData: parsed,
        createdAt: new Date().toISOString()
      };

      await onSaveSyllabus(newSyllabus);
      setActiveTab('explore');
    } catch (err) {
      console.error('File extraction error:', err);
      setErrorMessage(err.message || 'Failed to process file. Ensure it is a text-based PDF or plain text file.');
    } finally {
      setIsProcessing(false);
      setExtractionProgress(0);
    }
  };

  // Paste Text Handler
  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setErrorMessage('Please paste your syllabus text first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const parsed = parseSyllabus(pastedText, subjectNameInput || 'Uploaded Syllabus');
      const newSyllabus = {
        id: `syl_${Date.now()}`,
        name: subjectNameInput || parsed.subject || 'Uploaded Syllabus',
        rawText: pastedText,
        parsedData: parsed,
        createdAt: new Date().toISOString()
      };

      await onSaveSyllabus(newSyllabus);
      setActiveTab('explore');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse text.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample Syllabus Loader
  const handleLoadSample = async (sample) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const parsed = parseSyllabus(sample.text, sample.name);
      const newSyllabus = {
        id: `syl_${Date.now()}`,
        name: sample.name,
        rawText: sample.text,
        parsedData: parsed,
        createdAt: new Date().toISOString()
      };
      await onSaveSyllabus(newSyllabus);
      setActiveTab('explore');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  // Filter topics for search query
  const units = activeSyllabus?.parsedData?.units || [];
  const filteredUnits = units.map(unit => {
    const matchingChapters = unit.chapters.map(chap => {
      const matchingTopics = chap.topics.filter(t => 
        !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.contentLines.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return { ...chap, topics: matchingTopics };
    }).filter(c => c.topics.length > 0);

    return { ...unit, chapters: matchingChapters };
  }).filter(u => u.chapters.length > 0);

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('explore')}
            disabled={!activeSyllabus}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'explore'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : activeSyllabus
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Syllabus Hierarchy</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload or Add New</span>
          </button>
        </div>

        {activeSyllabus && activeTab === 'explore' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('questions')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Generate Questions</span>
            </button>
            <button
              onClick={() => onNavigate('flashcards')}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${activeSyllabus.name}" and all associated study materials?`)) {
                  onDeleteSyllabus(activeSyllabus.id);
                  setActiveTab('upload');
                }
              }}
              title="Delete Syllabus"
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Extraction Notice: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: UPLOAD / ADD NEW SYLLABUS
          ======================================================== */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 max-w-md">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                uploadMode === 'file' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDF or TXT File
            </button>
            <button
              onClick={() => setUploadMode('paste')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                uploadMode === 'paste' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setUploadMode('sample')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                uploadMode === 'sample' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sample Syllabi
            </button>
          </div>

          {/* Sub-mode: File Upload */}
          {uploadMode === 'file' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Upload Syllabus Document
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-5">
                Upload a syllabus in PDF or TXT format. Our browser-based parser reads text client-side with zero cloud uploads.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject or Course Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems, Molecular Genetics"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors rounded-2xl p-8 text-center cursor-pointer relative bg-slate-50 hover:bg-indigo-50/30">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <div className="text-sm font-bold text-slate-800 mb-1">
                  Choose a PDF or TXT file, or drag & drop here
                </div>
                <div className="text-xs text-slate-500">
                  Text-based PDFs, Markdown (.md), and plain text (.txt) supported up to 50MB
                </div>
              </div>

              {isProcessing && (
                <div className="mt-5 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 mb-2">
                    <span className="flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting text & tokenizing syllabus sentences...</span>
                    </span>
                    <span>{extractionProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${extractionProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-mode: Paste Syllabus Text */}
          {uploadMode === 'paste' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Paste Course Syllabus Text
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-5">
                Paste the syllabus text from your university portal, textbook table of contents, or lecture schedule.
              </p>

              <form onSubmit={handlePasteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Course / Subject Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cognitive Psychology (PSY304)"
                    value={subjectNameInput}
                    onChange={(e) => setSubjectNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Syllabus Text
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {pastedText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Unit 1: Fundamentals\nChapter 1: Core Concepts\nTopic 1.1: Foundations of the field...\n(Paste syllabus content with units, chapters, or bullet points here)`}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing || !pastedText.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Parsing Hierarchy...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Process & Structure Syllabus</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-mode: Pre-loaded Samples */}
          {uploadMode === 'sample' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Try Pre-loaded Academic Syllabi
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select a complete curriculum below to immediately test question generation, flashcards, and mock exams with zero setup.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMPLE_SYLLABI.map((sample) => (
                  <div 
                    key={sample.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 mb-3">
                        {sample.category}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm mb-2">
                        {sample.name}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed mb-4">
                        {sample.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLoadSample(sample)}
                      disabled={isProcessing}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Load This Syllabus</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          TAB 2: SYLLABUS HIERARCHY EXPLORER
          ======================================================== */}
      {activeTab === 'explore' && activeSyllabus && (
        <div className="space-y-6">
          
          {/* Syllabus Metadata Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                Structured Course Syllabus
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {activeSyllabus.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span><strong>{activeSyllabus.parsedData?.units?.length || 0}</strong> Units</span>
                <span>•</span>
                <span><strong>{activeSyllabus.parsedData?.stats?.chapterCount || 0}</strong> Chapters</span>
                <span>•</span>
                <span><strong>{activeSyllabus.parsedData?.stats?.topicCount || 0}</strong> Topics</span>
                <span>•</span>
                <span><strong>{activeSyllabus.parsedData?.stats?.sentenceCount || 0}</strong> Sentences</span>
                <span>•</span>
                <span><strong>{activeSyllabus.parsedData?.stats?.termCount || 0}</strong> Key Terms</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search topics or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Units / Chapters / Topics Tree */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tree Accordion (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              {filteredUnits.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                  No topics matching "{searchQuery}".
                </div>
              ) : (
                filteredUnits.map((unit) => {
                  const isExpanded = expandedUnits[unit.id] ?? true;
                  return (
                    <div 
                      key={unit.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Unit Header */}
                      <button
                        onClick={() => toggleUnit(unit.id)}
                        className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left border-b border-slate-200/80"
                      >
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-bold text-slate-800 text-sm">
                            {unit.title}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {unit.chapters.length} Chapters
                        </span>
                      </button>

                      {/* Chapters & Topics */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-4">
                          {unit.chapters.map((chap) => (
                            <div key={chap.id} className="pl-2 border-l-2 border-indigo-200 space-y-2">
                              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                                {chap.title}
                              </div>

                              <div className="grid grid-cols-1 gap-2 pt-1">
                                {chap.topics.map((topic) => {
                                  const isSelected = selectedTopic?.id === topic.id;
                                  return (
                                    <div
                                      key={topic.id}
                                      onClick={() => setSelectedTopic(topic)}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400'
                                          : 'bg-white hover:bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                                          {topic.title}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                      </div>

                                      <div className="flex items-center space-x-2 mt-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                          {topic.sentences?.length || 0} sentences
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                                          {topic.keyTerms?.length || 0} terms
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Topic Inspector Drawer (1 Col) */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Topic Inspector
                  </div>
                  {selectedTopic && (
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Active Topic
                    </span>
                  )}
                </div>

                {selectedTopic ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base mb-1">
                        {selectedTopic.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedTopic.chapterTitle || 'Chapter Topic'}
                      </p>
                    </div>

                    {/* Key Terms */}
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">
                        Key Terms & Phrases
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTopic.keyTerms && selectedTopic.keyTerms.length > 0 ? (
                          selectedTopic.keyTerms.map((term, tIdx) => (
                            <span 
                              key={tIdx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100"
                            >
                              {term}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No isolated key terms</span>
                        )}
                      </div>
                    </div>

                    {/* Sentences Preview */}
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">
                        Extracted Sentences ({selectedTopic.sentences?.length || 0})
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs text-slate-600">
                        {selectedTopic.sentences?.map((s, sIdx) => (
                          <div key={sIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed">
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Trigger Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onGenerateForTopic(selectedTopic.id);
                          onNavigate('questions');
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Generate Questions for This Topic</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Click any topic on the left to inspect extracted sentences and key terms.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
