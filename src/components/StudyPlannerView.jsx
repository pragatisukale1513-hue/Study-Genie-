import React, { useState } from 'react';
import { 
  CalendarClock, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  BookOpen, 
  Layers, 
  Award, 
  AlertCircle,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateStudyPlan } from '../engine/plannerEngine';

export function StudyPlannerView({ 
  activeSyllabus, 
  studyPlan = null, 
  onSaveStudyPlan 
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExamStr = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [examDate, setExamDate] = useState(studyPlan?.examDate || defaultExamStr);
  const [dailyHours, setDailyHours] = useState(studyPlan?.dailyHours || 2.5);
  const [studyPace, setStudyPace] = useState(studyPlan?.studyPace || 'balanced');

  // Generate or regenerate study plan
  const handleGeneratePlan = (e) => {
    if (e) e.preventDefault();
    if (!activeSyllabus?.parsedData) return;

    const newPlan = generateStudyPlan(activeSyllabus.parsedData, {
      examDate,
      dailyHours,
      studyPace
    });

    onSaveStudyPlan(newPlan);
  };

  // Toggle individual task within a day
  const handleToggleTask = (dayNumber, taskId) => {
    if (!studyPlan?.schedule) return;

    let allCompleted = true;
    const updatedSchedule = studyPlan.schedule.map(day => {
      if (day.dayNumber === dayNumber) {
        const updatedTasks = day.tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const dayComplete = updatedTasks.every(t => t.completed);
        return {
          ...day,
          tasks: updatedTasks,
          completed: dayComplete
        };
      }
      return day;
    });

    const isEntirePlanFinished = updatedSchedule.every(d => d.completed);
    if (isEntirePlanFinished) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }

    onSaveStudyPlan({
      ...studyPlan,
      schedule: updatedSchedule
    });
  };

  // Toggle entire day completion
  const handleToggleDayComplete = (dayNumber) => {
    if (!studyPlan?.schedule) return;

    const updatedSchedule = studyPlan.schedule.map(day => {
      if (day.dayNumber === dayNumber) {
        const newStatus = !day.completed;
        return {
          ...day,
          completed: newStatus,
          tasks: day.tasks.map(t => ({ ...t, completed: newStatus }))
        };
      }
      return day;
    });

    onSaveStudyPlan({
      ...studyPlan,
      schedule: updatedSchedule
    });
  };

  // Metrics
  let totalTasks = 0;
  let completedTasks = 0;
  let completedDays = 0;

  if (studyPlan?.schedule) {
    studyPlan.schedule.forEach(day => {
      if (day.completed) completedDays++;
      day.tasks.forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });
  }

  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Days remaining calculation
  let daysRemaining = null;
  if (studyPlan?.examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exDate = new Date(studyPlan.examDate);
    exDate.setHours(0, 0, 0, 0);
    daysRemaining = Math.max(0, Math.round((exDate - today) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900">Adaptive Study Planner</h2>
            {daysRemaining !== null && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                {daysRemaining} Days to Exam
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evenly distributes your syllabus chapters into daily learning targets with reserved final revision days.
          </p>
        </div>

        {studyPlan && (
          <button
            onClick={() => handleGeneratePlan()}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-sm self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recalculate Schedule</span>
          </button>
        )}
      </div>

      {/* Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Target Exam Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Exam Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                min={todayStr}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Daily Study Hours */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Daily Study Time
              </label>
              <span className="text-xs font-bold text-indigo-600">
                {dailyHours} hrs/day
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Study Pace */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Study Pace
            </label>
            <select
              value={studyPace}
              onChange={(e) => setStudyPace(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="relaxed">Relaxed (Gentle distribution)</option>
              <option value="balanced">Balanced (Recommended)</option>
              <option value="intensive">Intensive (Faster coverage)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{studyPlan ? 'Update Timetable' : 'Generate Study Plan'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Progress Metric Card */}
      {studyPlan && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-2">
            <span className="text-slate-700 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Syllabus Target Progress: {completedTasks} / {totalTasks} Tasks Completed ({completionPct}%)</span>
            </span>
            <span className="text-slate-500">
              {completedDays} of {studyPlan.totalDays} Study Days Checked
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(completionPct, 2))}%` }}
            />
          </div>
        </div>
      )}

      {/* Day by Day Timetable Grid */}
      {studyPlan?.schedule ? (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Day-By-Day Itinerary ({studyPlan.schedule.length} Days)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyPlan.schedule.map((day) => {
              const isRevision = day.phase.includes('Simulation') || day.phase.includes('Consolidation');

              return (
                <div 
                  key={day.dayNumber}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    day.completed 
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' 
                      : isRevision
                        ? 'bg-purple-50/30 border-purple-200 shadow-sm'
                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          Day {day.dayNumber}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-500">
                          {day.displayDate}
                        </span>
                      </div>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                        isRevision 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {day.phase}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleDayComplete(day.dayNumber)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors flex items-center space-x-1 ${
                        day.completed 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{day.completed ? 'Completed' : 'Mark Day Done'}</span>
                    </button>
                  </div>

                  {/* Assigned Chapters */}
                  <div className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                      Assigned Chapters:
                    </span>
                    {day.assignedChapters?.map(c => c.title).join(', ') || 'Comprehensive Review'}
                  </div>

                  {/* Task Checklist */}
                  <div className="space-y-2 pt-1">
                    {day.tasks.map((task) => (
                      <label 
                        key={task.id}
                        className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer text-xs ${
                          task.completed 
                            ? 'bg-emerald-50/70 border-emerald-200 text-slate-500 line-through' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(day.dayNumber, task.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                        />
                        <div className="flex-1 leading-snug">
                          {task.text}
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Est. {task.duration}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">No Study Plan Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Select your target exam date and daily available study time above to generate your customized study schedule.
          </p>
        </div>
      )}

    </div>
  );
}
