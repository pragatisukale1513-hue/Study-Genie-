import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SyllabusView } from './components/SyllabusView';
import { QuestionBankView } from './components/QuestionBankView';
import { FlashcardsView } from './components/FlashcardsView';
import { SummariesView } from './components/SummariesView';
import { MockTestView } from './components/MockTestView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { SettingsModal } from './components/SettingsModal';

import { 
  getAllSyllabi, 
  saveSyllabus, 
  deleteSyllabus, 
  getActiveSyllabusId, 
  setActiveSyllabusId,
  getQuestionBank,
  saveQuestionBank,
  getFlashcards,
  saveFlashcards,
  getSummaries,
  saveSummaries,
  getStudyPlan,
  saveStudyPlan,
  getAllTestResults,
  saveTestResult
} from './storage/db';

import { parseSyllabus } from './engine/syllabusParser';
import { generateQuestionBank } from './engine/questionEngine';
import { generateFlashcards } from './engine/flashcardEngine';
import { generateSummaries } from './engine/summarizerEngine';
import { generateStudyPlan } from './engine/plannerEngine';
import { SAMPLE_SYLLABI } from './data/sampleSyllabi';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syllabi, setSyllabi] = useState([]);
  const [activeSyllabus, setActiveSyllabus] = useState(null);
  
  // Materials associated with active syllabus
  const [questions, setQuestions] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [summaries, setSummaries] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [testHistory, setTestHistory] = useState([]);

  const [preselectedTopicId, setPreselectedTopicId] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('storage');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Load from DB
  const loadInitialData = async () => {
    try {
      const all = await getAllSyllabi();
      const activeId = await getActiveSyllabusId();

      if (all.length > 0) {
        setSyllabi(all);
        const current = all.find(s => s.id === activeId) || all[0];
        await switchActiveSyllabus(current);
      } else {
        // Auto-seed with first rich sample syllabus so app is immediately ready!
        const defaultSample = SAMPLE_SYLLABI[0];
        const parsed = parseSyllabus(defaultSample.text, defaultSample.name);
        const seededSyllabus = {
          id: 'syl_sample_dsa',
          name: defaultSample.name,
          rawText: defaultSample.text,
          parsedData: parsed,
          createdAt: new Date().toISOString()
        };

        await saveSyllabus(seededSyllabus);
        setSyllabi([seededSyllabus]);
        await switchActiveSyllabus(seededSyllabus);
      }
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Switch Active Syllabus
  const switchActiveSyllabus = async (syllabus) => {
    if (!syllabus) return;

    setActiveSyllabus(syllabus);
    await setActiveSyllabusId(syllabus.id);

    // Fetch saved questions or generate initial set
    let savedQ = await getQuestionBank(syllabus.id);
    if (!savedQ || savedQ.length === 0) {
      savedQ = generateQuestionBank(syllabus.parsedData, { count: 18 });
      await saveQuestionBank(syllabus.id, savedQ);
    }
    setQuestions(savedQ);

    // Fetch saved flashcards or generate initial set
    let savedF = await getFlashcards(syllabus.id);
    if (!savedF || savedF.length === 0) {
      savedF = generateFlashcards(syllabus.parsedData);
      await saveFlashcards(syllabus.id, savedF);
    }
    setFlashcards(savedF);

    // Fetch summaries or generate
    let savedS = await getSummaries(syllabus.id);
    if (!savedS) {
      savedS = generateSummaries(syllabus.parsedData);
      await saveSummaries(syllabus.id, savedS);
    }
    setSummaries(savedS);

    // Fetch study plan or generate default 2-week plan
    let savedP = await getStudyPlan(syllabus.id);
    if (!savedP) {
      savedP = generateStudyPlan(syllabus.parsedData, { dailyHours: 2.5 });
      await saveStudyPlan(syllabus.id, savedP);
    }
    setStudyPlan(savedP);

    // Fetch tests
    const tests = await getAllTestResults(syllabus.id);
    setTestHistory(tests);
  };

  // Save new or updated syllabus
  const handleSaveSyllabus = async (newSyllabus) => {
    await saveSyllabus(newSyllabus);
    const all = await getAllSyllabi();
    setSyllabi(all);
    await switchActiveSyllabus(newSyllabus);
    showToast(`Loaded "${newSyllabus.name}" with ${newSyllabus.parsedData?.stats?.topicCount || 0} topics.`);
  };

  // Delete syllabus
  const handleDeleteSyllabus = async (id) => {
    await deleteSyllabus(id);
    const all = await getAllSyllabi();
    setSyllabi(all);
    if (all.length > 0) {
      await switchActiveSyllabus(all[0]);
    } else {
      setActiveSyllabus(null);
      setQuestions([]);
      setFlashcards([]);
      setSummaries(null);
      setStudyPlan(null);
      setTestHistory([]);
    }
    showToast('Syllabus removed.');
  };

  // Question Bank Update
  const handleSaveQuestions = async (updatedQuestions) => {
    if (!activeSyllabus) return;
    setQuestions(updatedQuestions);
    await saveQuestionBank(activeSyllabus.id, updatedQuestions);
    showToast(`Question Bank updated (${updatedQuestions.length} questions).`);
  };

  // Flashcards Update
  const handleSaveFlashcards = async (updatedCards) => {
    if (!activeSyllabus) return;
    setFlashcards(updatedCards);
    await saveFlashcards(activeSyllabus.id, updatedCards);
  };

  // Summaries Update
  const handleSaveSummaries = async (updatedSummaries) => {
    if (!activeSyllabus) return;
    setSummaries(updatedSummaries);
    await saveSummaries(activeSyllabus.id, updatedSummaries);
  };

  // Study Plan Update
  const handleSaveStudyPlan = async (updatedPlan) => {
    if (!activeSyllabus) return;
    setStudyPlan(updatedPlan);
    await saveStudyPlan(activeSyllabus.id, updatedPlan);
    showToast('Study timetable updated.');
  };

  // Save Mock Test Result
  const handleSaveTestResult = async (result) => {
    await saveTestResult(result);
    setTestHistory(prev => [result, ...prev]);
    showToast(`Test completed: Score ${result.percentage}%`);
  };

  // Load sample syllabus from modal / hero
  const handleLoadSampleFromHero = async () => {
    const sample = SAMPLE_SYLLABI[0];
    const parsed = parseSyllabus(sample.text, sample.name);
    const newS = {
      id: `syl_${Date.now()}`,
      name: sample.name,
      rawText: sample.text,
      parsedData: parsed,
      createdAt: new Date().toISOString()
    };
    await handleSaveSyllabus(newS);
  };

  // Sidebar stats
  const sidebarStats = {
    topicsCount: activeSyllabus?.parsedData?.stats?.topicCount || 0,
    questionsCount: questions.length,
    flashcardsCount: flashcards.length,
    testsTaken: testHistory.length,
    examDaysLeft: studyPlan?.examDate 
      ? Math.max(0, Math.round((new Date(studyPlan.examDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : undefined
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        syllabi={syllabi}
        activeSyllabus={activeSyllabus}
        onSelectSyllabus={(id) => {
          const s = syllabi.find(item => item.id === id);
          if (s) switchActiveSyllabus(s);
        }}
        onNewSyllabusClick={() => {
          setActiveTab('syllabus');
        }}
        onOpenSettings={() => {
          setSettingsDefaultTab('storage');
          setIsSettingsOpen(true);
        }}
        onOpenNLPInfo={() => {
          setSettingsDefaultTab('nlp');
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          stats={sidebarStats}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              activeSyllabus={activeSyllabus}
              questions={questions}
              flashcards={flashcards}
              summaries={summaries}
              studyPlan={studyPlan}
              testHistory={testHistory}
              onNavigate={setActiveTab}
              onLoadSample={handleLoadSampleFromHero}
            />
          )}

          {activeTab === 'syllabus' && (
            <SyllabusView
              activeSyllabus={activeSyllabus}
              onSaveSyllabus={handleSaveSyllabus}
              onDeleteSyllabus={handleDeleteSyllabus}
              onNavigate={setActiveTab}
              onGenerateForTopic={(tId) => {
                setPreselectedTopicId(tId);
              }}
            />
          )}

          {activeTab === 'questions' && (
            <QuestionBankView
              activeSyllabus={activeSyllabus}
              questions={questions}
              onSaveQuestions={handleSaveQuestions}
              preselectedTopicId={preselectedTopicId}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsView
              activeSyllabus={activeSyllabus}
              flashcards={flashcards}
              onSaveFlashcards={handleSaveFlashcards}
            />
          )}

          {activeTab === 'summaries' && (
            <SummariesView
              activeSyllabus={activeSyllabus}
              summaries={summaries}
              onSaveSummaries={handleSaveSummaries}
            />
          )}

          {activeTab === 'mocktest' && (
            <MockTestView
              activeSyllabus={activeSyllabus}
              questions={questions}
              onSaveTestResult={handleSaveTestResult}
              testHistory={testHistory}
            />
          )}

          {activeTab === 'planner' && (
            <StudyPlannerView
              activeSyllabus={activeSyllabus}
              studyPlan={studyPlan}
              onSaveStudyPlan={handleSaveStudyPlan}
            />
          )}

        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Settings & Local NLP Architecture Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={loadInitialData}
        defaultTab={settingsDefaultTab}
      />

    </div>
  );
}
