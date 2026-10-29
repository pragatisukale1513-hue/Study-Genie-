/**
 * StudyGenie - Export and Download Utilities
 * Supports TXT, Markdown, HTML, Printable PDFs, and JSON backups
 */

export function downloadFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Question Bank to Formatted Text
 */
export function exportQuestionsToTXT(subjectName, questions) {
  let output = `========================================================================\n`;
  output += `STUDYGENIE QUESTION BANK: ${subjectName.toUpperCase()}\n`;
  output += `Total Questions: ${questions.length} | Generated: ${new Date().toLocaleDateString()}\n`;
  output += `Note: Generated locally using rule-based NLP extraction. 100% Client-Side.\n`;
  output += `========================================================================\n\n`;

  questions.forEach((q, idx) => {
    output += `Question ${idx + 1} [Type: ${q.type.toUpperCase()} | Difficulty: ${q.difficulty.toUpperCase()}]\n`;
    output += `Topic: ${q.topicTitle || 'General'} (${q.chapterTitle || 'Syllabus'})\n`;
    output += `Prompt: ${q.prompt}\n`;

    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        output += `  ${letter}. ${opt}\n`;
      });
    }

    if (q.derivedReliably) {
      output += `Answer: ${q.correctAnswer}\n`;
      output += `Source: ${q.sourceSentence || q.explanation}\n`;
    } else {
      output += `Review Status: Teacher / Student Review Required\n`;
      output += `Key Points:\n${q.correctAnswer}\n`;
    }
    output += `------------------------------------------------------------------------\n\n`;
  });

  downloadFile(`${sanitizeFilename(subjectName)}_Questions.txt`, output, 'text/plain;charset=utf-8');
}

/**
 * Export Notes & Summaries to Markdown
 */
export function exportNotesToMarkdown(subjectName, summaries) {
  let md = `# StudyGenie Exam Notes: ${subjectName}\n\n`;
  md += `*Generated on ${new Date().toLocaleDateString()} using StudyGenie Extractive Summarizer*\n\n`;

  md += `## 1. High-Yield Revision Bullets\n\n`;
  if (summaries.revisionBullets && summaries.revisionBullets.length > 0) {
    summaries.revisionBullets.forEach((bullet) => {
      md += `- **[${bullet.chapterTitle || 'Core'}]** ${bullet.text}\n`;
    });
  }
  md += `\n`;

  md += `## 2. Key Definitions & Glossary\n\n`;
  if (summaries.keyDefinitions && summaries.keyDefinitions.length > 0) {
    summaries.keyDefinitions.forEach((item) => {
      md += `- **${item.term}**: ${item.definition} *(Source: ${item.chapterTitle || 'Syllabus'})*\n`;
    });
  }
  md += `\n`;

  md += `## 3. Chapter-Wise Condensed Notes\n\n`;
  if (summaries.chapterSummaries && summaries.chapterSummaries.length > 0) {
    summaries.chapterSummaries.forEach((chap) => {
      md += `### ${chap.chapterTitle}\n\n`;
      chap.sentences.forEach(s => {
        md += `> ${s}\n\n`;
      });
    });
  }

  downloadFile(`${sanitizeFilename(subjectName)}_Revision_Notes.md`, md, 'text/markdown;charset=utf-8');
}

/**
 * Export Flashcards to CSV
 */
export function exportFlashcardsToCSV(subjectName, flashcards) {
  let csv = `"Front (Term/Concept)","Back (Definition/Explanation)","Category","Chapter"\n`;
  flashcards.forEach(fc => {
    const f = (fc.front || '').replace(/"/g, '""');
    const b = (fc.back || '').replace(/"/g, '""');
    const c = (fc.category || '').replace(/"/g, '""');
    const ch = (fc.chapterTitle || '').replace(/"/g, '""');
    csv += `"${f}","${b}","${c}","${ch}"\n`;
  });

  downloadFile(`${sanitizeFilename(subjectName)}_Flashcards.csv`, csv, 'text/csv;charset=utf-8');
}

/**
 * Print Styled Exam Paper or Study Guide via Browser Print to PDF
 */
export function printDocument(title, htmlBody) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print/PDF view.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; padding: 30px; margin: 0; }
          h1 { color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
          h2 { color: #334155; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          h3 { color: #475569; margin-top: 16px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
          .q-block { margin-bottom: 20px; padding: 14px; background: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px; }
          .q-prompt { font-weight: 600; margin-bottom: 8px; font-size: 15px; }
          .q-opt { margin-left: 20px; font-size: 14px; }
          .q-ans { margin-top: 10px; font-size: 13px; color: #047857; font-weight: 500; }
          .badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: bold; border-radius: 12px; background: #e0e7ff; color: #3730a3; margin-right: 6px; }
          .def-item { margin-bottom: 12px; }
          .def-term { font-weight: bold; color: #1e1b4b; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            🖨️ Print or Save as PDF
          </button>
        </div>
        ${htmlBody}
      </body>
    </html>
  `);

  printWindow.document.close();
}

function sanitizeFilename(name) {
  return (name || 'StudyGenie').replace(/[^a-z0-9_-]/gi, '_').slice(0, 30);
}
