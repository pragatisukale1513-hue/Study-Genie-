import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  Layers, 
  BookMarked, 
  Award, 
  CalendarClock,
  Sparkles
} from 'lucide-react';

export function Sidebar({ 
  currentTab, 
  onSelectTab, 
  stats = {} 
}) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null 
    },
    { 
      id: 'syllabus', 
      label: 'Syllabus & Topics', 
      icon: FileText,
      badge: stats.topicsCount ? `${stats.topicsCount} topics` : null 
    },
    { 
      id: 'questions', 
      label: 'Question Bank', 
      icon: HelpCircle,
      badge: stats.questionsCount ? `${stats.questionsCount}` : null 
    },
    { 
      id: 'flashcards', 
      label: 'Flashcards', 
      icon: Layers,
      badge: stats.flashcardsCount ? `${stats.flashcardsCount}` : null 
    },
    { 
      id: 'summaries', 
      label: 'Summaries & Notes', 
      icon: BookMarked,
      badge: null 
    },
    { 
      id: 'mocktest', 
      label: 'Mock Tests', 
      icon: Award,
      badge: stats.testsTaken ? `${stats.testsTaken} taken` : null 
    },
    { 
      id: 'planner', 
      label: 'Study Planner', 
      icon: CalendarClock,
      badge: stats.examDaysLeft !== undefined ? `${stats.examDaysLeft}d left` : null 
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 flex-shrink-0">
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Study Portal
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-indigo-700/80 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Local Engine Privacy Callout */}
      <div className="mt-6 p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100/80">
        <div className="flex items-center space-x-2 text-indigo-900 font-semibold text-xs mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Local Rule-Based NLP</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          100% Client-Side. Extracted directly in your browser without transmitting your data to any external server or AI API.
        </p>
      </div>
    </aside>
  );
}
