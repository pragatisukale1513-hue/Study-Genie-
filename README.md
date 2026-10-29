# 🧞‍♂️ StudyGenie – Smart Exam Preparation Assistant

A complete, client-side, AI-inspired exam preparation web application built with **React**, **Tailwind CSS**, and **local rule-based Natural Language Processing (NLP)**.

> **100% Privacy & Zero API Cost:** StudyGenie requires **zero external AI APIs**, no OpenAI / Gemini keys, no subscriptions, and no backend servers. All sentence parsing, question generation, extractive summaries, flashcard creation, and mock tests happen **entirely inside the student's browser**.

---

## 🚀 Key Features

### 1. 📄 Syllabus Upload & Hierarchy Explorer
- **File Upload**: Upload text-based **PDFs** (extracted in-browser via `pdfjs-dist`) or **TXT / Markdown** files.
- **Paste Syllabus**: Paste course descriptions, textbook tables of contents, or lecture notes.
- **Hierarchy Tree Organizer**: Automatically segments unstructured or structured syllabi into **Units**, **Chapters**, **Topics**, and **Sentences**.
- **Pre-loaded Academic Syllabi**: One-click instant loading for **Computer Science (Data Structures & Algorithms)**, **Cell Biology & Genetics**, and **Modern Quantum Physics**.

### 2. ❓ Rule-Based Question Bank Generator
Generates realistic questions using deterministic NLP heuristics, TF-IDF term scoring, and educational templates:
- **Multiple Choice Questions (MCQs)**: Generates definition queries and cloze completions paired with **Smart Distractors** extracted from sibling terms in the same syllabus.
- **True / False Statements**: Formulates factual true assertions and logical contrapositives (inverting modality verbs like `is` $\to$ `is not` or swapping subject entities).
- **Fill-in-the-Blanks (Cloze)**: Blanks out high-yield technical terms with first-letter & character count hints.
- **Short-Answer Questions**: Formulates analytical definition and function queries with authoritative source answers.
- **Long-Answer Essay Prompts**: Formulates high-order analytical prompts labeled with **"Teacher / Student Review Required"** and an expected syllabus rubric checklist.

### 3. 🃏 Active Recall 3D Flashcards
- **Interactive 3D Flip Card**: Smooth 3D animation (click or press `Space` to flip).
- **Spaced Repetition & Mastery**: Mark cards as **"Mastered"** or **"Still Learning"**.
- **Controls**: Shuffle deck, keyboard shortcuts (`Space` to flip, `ArrowLeft` / `ArrowRight` to navigate), progress tracker, and custom card creation.
- **Export**: Download cards as CSV or printable double-sided cutout sheets.

### 4. 📝 Extractive Summary & Revision Notes
- **Extractive Sentence Scoring**: Ranks sentences based on keyword frequency, document position bias, and educational cue phrases (`is defined as`, `primary function`, `crucial`).
- **Compression Slider**: Choose between **Quick (25%)**, **Balanced (45%)**, or **Detailed (70%)** notes.
- **Key Definitions Glossary**: Searchable index of all detected term definitions.
- **High-Yield Revision Bullets**: Concise recall points with source chapter citations.
- **Strict Grounding**: Zero synthetic hallucinations; every statement is strictly extracted from the uploaded text.

### 5. ⏱️ Timed Mock Tests & Exam Simulator
- **Configurable Quizzes**: Choose question count (5 to 30), specific topics, and time limits.
- **Exam Simulation UI**: Interactive question palette (jump to any question, view answered status, flag for review), live countdown timer with low-time warning.
- **Comprehensive Scorecard**:
  - Score percentage & grade (with celebratory confetti animation for $\ge 70\%$).
  - **Topic Mastery Matrix**: Performance breakdown identifying weak vs strong chapters.
  - **Authoritative Review**: View your answer, the correct answer, and the exact syllabus source sentence citation.
  - **Retake Missed Questions**: Instantly launch a targeted quiz containing only questions you missed!

### 6. 📅 Adaptive Study Planner & Timetable
- **Smart Scheduling**: Enter your exam target date and daily study hours (1–6 hrs/day).
- **Adaptive Topic Distribution**: Distributes syllabus volume evenly across available calendar days, reserving the final 2–3 days for **Mock Tests & Final Revision**.
- **Interactive Daily Checklist**: Check off reading, flashcards, and question practice tasks day by day.

### 7. 💾 Offline Storage & Multi-Format Downloads
- **Browser-Local Storage**: Uses **IndexedDB** with **localStorage** fallback.
- **Multi-Syllabus Management**: Create, switch, and delete multiple subjects.
- **Export Options**: Download questions as `.txt`, notes as Markdown (`.md`), flashcards as `.csv`, printable exam papers via browser Print-to-PDF, and full JSON backups.

---

## 🛠️ Technology Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **PDF Extraction:** `pdfjs-dist` (client-side worker)
- **Local Persistence:** Browser IndexedDB & localStorage
- **Celebration Effects:** `canvas-confetti`

---

## 💻 Running the Application Locally

1. Open a terminal in the project directory:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
3. To create a production build:
   ```bash
   npm run build
   ```

---

## 🔒 Privacy & Architecture Notice
StudyGenie operates **100% inside your web browser**. No syllabus text, notes, questions, or test results are ever uploaded to any third-party server or external AI provider.
