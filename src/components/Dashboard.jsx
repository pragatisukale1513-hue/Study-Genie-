import React from 'react';
import { 
  FileText, 
  HelpCircle, 
  Layers, 
  BookMarked, 
  Award, 
  CalendarClock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';

export function Dashboard({ 
  activeSyllabus, 
  questions = [], 
  flashcards = [], 
  summaries = null, 
  studyPlan = null, 
  testHistory = [], 
  onNavigate,
  onLoadSample 
}) {
  // If no syllabus loaded yet, show onboarding hero
  if (!activeSyllabus) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-2xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-4">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              100% Client-Side • Zero External AI APIs • Complete Privacy
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Master Your Exams with StudyGenie
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-6">
              Upload your syllabus in PDF or TXT format. Our local rule-based NLP engine tokenizes sentences, organizes topics, creates question banks (MCQs, Fill-in-the-blanks, True/False, Short & Long Answer), compiles flashcards, and builds an exam study timetable—completely in your browser.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('syllabus')}
                className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl shadow-md hover:bg-indigo-50 transition-all flex items-center space-x-2 text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Upload Your Syllabus</span>
              </button>
              <button
                onClick={onLoadSample}
                className="px-5 py-2.5 bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-semibold rounded-xl border border-white/20 transition-all flex items-center space-x-2 text-sm backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Try Sample Syllabus (Instant Demo)</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-10 -bottom-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Local Question Bank</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Extracts MCQs with smart topic distractors, True/False with negation heuristics, and cloze blanks derived directly from syllabus sentences.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Active Recall Flashcards</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Identifies key terminology and definitions, tracks mastered vs. learning status, and provides 3D flip card drills.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Smart Study Timetable</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Distributes your topics across available days before your exam date with dedicated buffer days for final mock tests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate readiness metric
  const totalCards = flashcards.length;
  const masteredCards = flashcards.filter(c => c.status === 'mastered').length;
  const flashcardScore = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

  const avgTestScore = testHistory.length > 0 
    ? Math.round(testHistory.reduce((acc, t) => acc + t.percentage, 0) / testHistory.length) 
    : 0;

  let planCompletedTasks = 0;
  let planTotalTasks = 0;
  if (studyPlan && studyPlan.schedule) {
    for (const day of studyPlan.schedule) {
      for (const t of day.tasks) {
        planTotalTasks++;
        if (t.completed) planCompletedTasks++;
      }
    }
  }
  const planScore = planTotalTasks > 0 ? (planCompletedTasks / planTotalTasks) * 100 : 0;

  // Weighted overall exam readiness
  const overallReadiness = Math.round(
    (flashcardScore * 0.3) + 
    (avgTestScore * 0.45) + 
    (planScore * 0.25)
  );

  // Calculate days remaining to exam
  let daysLeft = null;
  if (studyPlan && studyPlan.examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(studyPlan.examDate);
    exam.setHours(0, 0, 0, 0);
    daysLeft = Math.max(0, Math.round((exam - today) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6">
      
      {/* Subject Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <span>Active Subject</span>
              <span>•</span>
              <span>{activeSyllabus.parsedData?.stats?.topicCount || 0} Topics Identified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {activeSyllabus.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Organized into {activeSyllabus.parsedData?.units?.length || 0} Units, {activeSyllabus.parsedData?.stats?.chapterCount || 0} Chapters, and {activeSyllabus.parsedData?.stats?.sentenceCount || 0} processed syllabus sentences.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 self-start md:self-auto">
            <CalendarClock className="w-7 h-7 text-indigo-400" />
            <div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                Exam Countdown
              </div>
              <div className="text-lg font-bold text-white">
                {daysLeft !== null ? `${daysLeft} Days Remaining` : 'No Exam Date Set'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Readiness Gauge & Core Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Readiness Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Exam Readiness
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            
            <div className="flex items-baseline space-x-2 mb-2">
              <span className="text-4xl font-extrabold text-slate-900">{overallReadiness}%</span>
              <span className="text-xs text-slate-500 font-medium">prepared</span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, overallReadiness))}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Flashcards Mastered:</span>
              <span className="font-semibold text-slate-800">{masteredCards} / {totalCards}</span>
            </div>
            <div className="flex justify-between">
              <span>Mock Quiz Avg:</span>
              <span className="font-semibold text-slate-800">{avgTestScore}%</span>
            </div>
            <div className="flex justify-between">
              <span>Plan Tasks Done:</span>
              <span className="font-semibold text-slate-800">{planCompletedTasks} / {planTotalTasks}</span>
            </div>
          </div>
        </div>

        {/* Stats 3-Col */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {activeSyllabus.parsedData?.stats?.topicCount || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Topics Analyzed</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{questions.length}</div>
            <div className="text-xs text-slate-500 font-medium">Questions in Bank</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{flashcards.length}</div>
            <div className="text-xs text-slate-500 font-medium">Flashcards Created</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{testHistory.length}</div>
            <div className="text-xs text-slate-500 font-medium">Mock Tests Taken</div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="col-span-2 sm:col-span-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              Quick Study Actions:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate('mocktest')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Take Mock Test</span>
              </button>
              <button
                onClick={() => onNavigate('flashcards')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Drill Flashcards</span>
              </button>
              <button
                onClick={() => onNavigate('summaries')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
              >
                <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
                <span>Read Notes</span>
              </button>
              <button
                onClick={() => onNavigate('planner')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
              >
                <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Study Planner</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Lower Dashboard Section: Topic Structure & Recent Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Syllabus Units Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Syllabus Structure</span>
            </h3>
            <button
              onClick={() => onNavigate('syllabus')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activeSyllabus.parsedData?.units?.map((unit, idx) => (
              <div 
                key={unit.id || idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">
                    {unit.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {unit.chapters?.length || 0} Chapters • {unit.chapters?.reduce((acc, c) => acc + (c.topics?.length || 0), 0) || 0} Topics
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-md">
                  Unit {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Mock Test History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Recent Mock Tests</span>
            </h3>
            <button
              onClick={() => onNavigate('mocktest')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <span>Test History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {testHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-600 font-medium">No mock tests taken yet.</p>
              <button
                onClick={() => onNavigate('mocktest')}
                className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Take Your First Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {testHistory.slice(0, 4).map((test) => (
                <div 
                  key={test.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Score: {test.score} / {test.totalQuestions} ({test.percentage}%)
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(test.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{test.timeSpentSeconds ? `${Math.round(test.timeSpentSeconds / 60)} mins` : 'Untimed'}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    test.percentage >= 80 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : test.percentage >= 60 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    {test.percentage >= 80 ? 'Grade A' : test.percentage >= 60 ? 'Grade B' : 'Needs Review'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
