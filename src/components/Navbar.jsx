import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  PlusCircle, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Info, 
  Database,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export function Navbar({ 
  syllabi, 
  activeSyllabus, 
  onSelectSyllabus, 
  onNewSyllabusClick, 
  onOpenSettings,
  onOpenNLPInfo 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800 bg-clip-text text-transparent">
                  StudyGenie
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  100% Local NLP • Zero APIs
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block">
                Smart Exam Preparation Assistant
              </p>
            </div>
          </div>

          {/* Active Syllabus Selector & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Syllabus Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="max-w-[130px] sm:max-w-[200px] truncate text-left">
                  {activeSyllabus ? activeSyllabus.name : 'No Syllabus Loaded'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-20 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Your Syllabi ({syllabi.length})
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {syllabi.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center">
                          No syllabi uploaded yet.
                        </div>
                      ) : (
                        syllabi.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              onSelectSyllabus(s.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                              activeSyllabus && activeSyllabus.id === s.id ? 'bg-indigo-50/70 font-semibold text-indigo-700' : 'text-slate-700'
                            }`}
                          >
                            <span className="truncate pr-2">{s.name}</span>
                            {activeSyllabus && activeSyllabus.id === s.id && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onNewSyllabusClick();
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Upload or Paste New Syllabus</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* NLP Info Button */}
            <button
              onClick={onOpenNLPInfo}
              title="How Local Rule-Based NLP Works"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Storage & Settings Button */}
            <button
              onClick={onOpenSettings}
              title="Data Storage, Backup & Export"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
