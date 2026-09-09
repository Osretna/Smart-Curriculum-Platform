/**
 * Client-side text and metadata extractor for uploaded books and documents (PDF, TXT, MD, etc.)
 */

export interface DocumentExtractionResult {
  text: string;
  numPages: number;
  wordCount: number;
  sampleSnippets: string[];
}

/**
 * Extracts readable text from a user uploaded File (PDF, TXT, MD, etc.)
 */
export async function extractDocumentText(file: File): Promise<DocumentExtractionResult> {
  const fileName = file.name.toLowerCase();

  // 1. Text-based files: TXT, Markdown, CSV, JSON, HTML
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.html') ||
    file.type.startsWith('text/')
  ) {
    const text = await readAsTextSafe(file);
    return processExtractedText(text, 1);
  }

  // 2. PDF Document parsing: Extract embedded text streams from PDF bytes
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const extracted = extractTextFromPdfArrayBuffer(buffer);
      if (extracted.text.trim().length > 30) {
        return extracted;
      }
    } catch (err) {
      console.warn('PDF stream extraction warning:', err);
    }
  }

  // Fallback: safe text preview extraction
  const rawPreview = await readSliceAsText(file, 20000);
  const cleaned = cleanRawExtractedText(rawPreview);
  return processExtractedText(cleaned, 1);
}

/**
 * Safely read whole file as text with encoding fallback
 */
function readAsTextSafe(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Read initial slice of file
 */
function readSliceAsText(file: File, bytes: number): Promise<string> {
  return new Promise((resolve) => {
    const slice = file.slice(0, bytes);
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => resolve('');
    reader.readAsText(slice, 'utf-8');
  });
}

/**
 * Lightweight native PDF stream text parser:
 * Scans PDF objects for stream / Tj / TJ text tokens without needing heavy external binaries
 */
function extractTextFromPdfArrayBuffer(buffer: ArrayBuffer): DocumentExtractionResult {
  const bytes = new Uint8Array(buffer);
  const latinText = new TextDecoder('latin1').decode(bytes);

  // Estimate page count by counting "/Type /Page" or "/Type/Page"
  const pageMatches = latinText.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  const estimatedPages = pageMatches && pageMatches.length > 0 ? pageMatches.length : 1;

  // Extract text within stream blocks or text objects (BT ... ET)
  const textChunks: string[] = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = btRegex.exec(latinText)) !== null && textChunks.length < 500) {
    const block = match[0];

    // Match (string) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = decodePdfString(tjMatch[1]);
      if (decoded.length > 1) {
        textChunks.push(decoded);
      }
    }

    // Match [(string)...] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = arrayMatch[1];
      const strRegex = /\(([^)]+)\)/g;
      let sMatch: RegExpExecArray | null;
      while ((sMatch = strRegex.exec(inner)) !== null) {
        const decoded = decodePdfString(sMatch[1]);
        if (decoded.length > 1) {
          textChunks.push(decoded);
        }
      }
    }
  }

  let fullText = textChunks.join(' ');

  // If text was encoded in UTF-8 inside the PDF or Arabic Unicode
  if (fullText.trim().length < 50) {
    // Fallback: search for high-frequency Arabic/English sequences directly in latinText
    const words = latinText.match(/[\u0600-\u06FF\w]{3,}/g) || [];
    fullText = words.slice(0, 300).join(' ');
  }

  return processExtractedText(fullText, estimatedPages);
}

function decodePdfString(str: string): string {
  // Decode common PDF escapes like \n, \r, \t, \(, \)
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

function cleanRawExtractedText(raw: string): string {
  // Remove non-printable control characters except newlines/spaces
  return raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function processExtractedText(rawText: string, pages: number): DocumentExtractionResult {
  const text = rawText.trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Extract representative preview snippets
  const snippets: string[] = [];
  if (words.length > 0) {
    const chunkSize = 25;
    for (let i = 0; i < Math.min(words.length, 120); i += chunkSize) {
      const snippet = words.slice(i, i + chunkSize).join(' ');
      if (snippet.length > 15) {
        snippets.push(snippet);
      }
      if (snippets.length >= 3) break;
    }
  }

  return {
    text: text.slice(0, 30000), // Keep a reasonable length for AI analysis
    numPages: Math.max(1, pages),
    wordCount,
    sampleSnippets: snippets,
  };
}
