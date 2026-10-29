/**
 * StudyGenie - Client-Side PDF Text Extractor
 * Uses pdfjs-dist directly in the browser with zero server uploads
 */
import * as pdfjsLib from 'pdfjs-dist';

// Set up worker source
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  } catch (err) {
    console.warn('PDF.js worker initialization notice:', err);
  }
}

/**
 * Extracts plain text from an ArrayBuffer or File
 */
export async function extractTextFromPDF(fileOrBuffer, onProgress) {
  try {
    let arrayBuffer;
    if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      arrayBuffer = fileOrBuffer;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(Math.round((pageNum / numPages) * 100));
      }

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let lastY, pageText = '';
      for (const item of textContent.items) {
        if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }

      fullText += `\n\n--- Page ${pageNum} ---\n` + pageText;
    }

    const cleaned = fullText.trim();
    if (!cleaned || cleaned.replace(/--- Page \d+ ---/g, '').trim().length < 20) {
      throw new Error('This PDF appears to be empty or contains scanned images without selectable text. Please upload a text-based PDF or paste syllabus text directly.');
    }

    return cleaned;
  } catch (err) {
    console.error('PDF extraction failed:', err);
    throw new Error(err.message || 'Failed to extract text from PDF.');
  }
}
