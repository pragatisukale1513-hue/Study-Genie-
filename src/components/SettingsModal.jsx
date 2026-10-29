import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Info, 
  Check, 
  AlertCircle, 
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { exportAllData, importAllData, clearAllStorage } from '../storage/db';
import { downloadFile } from '../utils/exportUtils';

export function SettingsModal({ 
  isOpen, 
  onClose, 
  onDataReset, 
  defaultTab = 'storage' // 'storage' or 'nlp'
}) {
  const [tab, setTab] = useState(defaultTab);
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  // Handle Full JSON Backup Export
  const handleExportBackup = async () => {
    try {
      const data = await exportAllData();
      const filename = `StudyGenie_Backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
    } catch (err) {
      alert('Failed to export backup: ' + err.message);
    }
  };

  // Handle Restore
  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importAllData(parsed);
      setImportStatus('Backup restored successfully!');
      setTimeout(() => {
        setImportStatus(null);
        onDataReset();
        onClose();
      }, 1500);
    } catch (err) {
      setImportStatus('Error: Invalid backup file format.');
    }
  };

  // Clear Storage
  const handleClearAll = async () => {
    if (window.confirm('WARNING: This will permanently delete ALL syllabi, questions, flashcards, and test history from your browser. Are you sure?')) {
      if (window.confirm('Are you absolutely certain? This action cannot be undone.')) {
        await clearAllStorage();
        onDataReset();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {tab === 'storage' ? <Database className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              {tab === 'storage' ? 'Local Storage & Data Management' : 'Local NLP Architecture'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setTab('storage')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'storage' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Storage & Backup</span>
          </button>
          <button
            onClick={() => setTab('nlp')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'nlp' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>How Local NLP Works</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: STORAGE & BACKUP
            ======================================================== */}
        {tab === 'storage' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 leading-relaxed">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>100% Offline & Private Storage</span>
              </div>
              All syllabi, questions, flashcards, summaries, and exam logs are stored directly on your computer inside browser <strong>IndexedDB</strong> (with localStorage fallback). Nothing is ever sent to an external server.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Backup Export */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Export Full Backup</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Download all your study materials, flashcards, questions, and test scores as a JSON file.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup (.json)</span>
                </button>
              </div>

              {/* Restore Import */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Restore from Backup</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Upload a previously exported StudyGenie JSON file to restore your syllabus and tests.
                  </p>
                </div>
                <label className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Import JSON Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importStatus && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                {importStatus}
              </div>
            )}

            {/* Danger Zone: Clear Storage */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
              <h4 className="font-bold text-rose-800 text-sm flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Delete All Stored Content</span>
              </h4>
              <p className="text-xs text-rose-700">
                Wipe all syllabi, saved questions, flashcard mastery states, study plans, and mock test score history.
              </p>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Local Data</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: HOW LOCAL NLP WORKS
            ======================================================== */}
        {tab === 'nlp' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900">
              <span className="font-bold">Transparent Rule-Based Architecture: </span>
              StudyGenie is built entirely with client-side NLP algorithms and heuristics. It does not use any paid or external AI APIs (OpenAI, Gemini, Anthropic, etc.).
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">1. Intelligent Sentence & Word Tokenizer</div>
                <p className="text-xs text-slate-600">
                  Splits syllabus text into grammatical sentences while protecting abbreviations (e.g., "i.e.", "Dr."), decimal values, and mathematical notations. Filters out standard English stop words to compute accurate term frequencies.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">2. Smart Distractor MCQ Generation</div>
                <p className="text-xs text-slate-600">
                  Instead of generating random nonsense options, the engine clusters key terms extracted from the same syllabus. The correct definition is paired with three plausible sibling terms from related topics as distractors.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">3. Logic-Negation True/False Engine</div>
                <p className="text-xs text-slate-600">
                  Transforms factual sentences into plausible false statements by inverting modality verbs ("is" to "is not", "increases" to "decreases") or transposing subject concepts, citing the verified original sentence as the explanation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">4. Extractive Text Summarization</div>
                <p className="text-xs text-slate-600">
                  Scores sentences using a composite metric: keyword frequency weight, document position bias, and cue-phrase bonuses ("is defined as", "primary function"). The top scored sentences are reconstituted in chronological topic order without inventing any facts.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

