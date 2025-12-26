/**
 * PDF Holiday Calendar Parser
 * Extracts holiday dates from PDF files using client-side parsing
 */

export interface ParsedHoliday {
  date: Date;
  name?: string;
}

export interface ParseError {
  type: 'NO_DATES' | 'SCANNED_PDF' | 'WORKER_FAILED' | 'UNSUPPORTED_FORMAT' | 'PARSE_ERROR';
  message: string;
  details?: string;
}

// Initialize worker once (singleton pattern)
let workerInitialized = false;
let workerInitPromise: Promise<void> | null = null;

/**
 * Initialize PDF.js worker
 */
async function initializePDFWorker(): Promise<void> {
  if (workerInitialized) {
    return;
  }

  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = (async () => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const version = pdfjsLib.version || '4.0.379';
      
      if (typeof window !== 'undefined') {
        // Try multiple worker sources for maximum compatibility
        const workerSources = [
          // Try unpkg CDN (most reliable)
          `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`,
          // Fallback to jsdelivr
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`,
          // Fallback to cdnjs
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`,
        ];

        // Set the first worker source (will try others if this fails)
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
        
        if (import.meta.env.DEV) {
          console.log('[PDF Parser] Worker source set to:', workerSources[0]);
        }
      }
      
      workerInitialized = true;
    } catch (error) {
      console.error('[PDF Parser] Worker initialization failed:', error);
      throw new Error('PDF worker failed to initialize');
    }
  })();

  return workerInitPromise;
}

/**
 * Normalize whitespace in text
 */
function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Comprehensive date format patterns
 */
const DATE_PATTERNS = [
  // DD Month YYYY (e.g., "01 Jan 2026", "1 January 2026")
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/gi,
  
  // Month DD, YYYY (e.g., "Jan 1, 2026", "January 01, 2026")
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/gi,
  
  // YYYY-MM-DD (e.g., "2026-01-01")
  /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g,
  
  // DD/MM/YYYY or MM/DD/YYYY (e.g., "01/01/2026")
  /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g,
  
  // DD-MM-YYYY (e.g., "01-01-2026")
  /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g,
];

const MONTH_NAMES: { [key: string]: number } = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Parse a date string into a Date object
 */
function parseDateString(match: RegExpMatchArray, patternIndex: number): Date | null {
  try {
    let year: number;
    let month: number;
    let day: number;

    switch (patternIndex) {
      case 0: // DD Month YYYY
        day = parseInt(match[1], 10);
        const monthName1 = match[2].toLowerCase();
        month = MONTH_NAMES[monthName1];
        year = parseInt(match[3], 10);
        if (month === undefined) return null;
        break;

      case 1: // Month DD, YYYY
        const monthName2 = match[1].toLowerCase();
        month = MONTH_NAMES[monthName2];
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
        if (month === undefined) return null;
        break;

      case 2: // YYYY-MM-DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
        break;

      case 3: // DD/MM/YYYY or MM/DD/YYYY
      case 4: // DD-MM-YYYY
        const part1 = parseInt(match[1], 10);
        const part2 = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
        
        // Heuristic: if part1 > 12, it's DD/MM format, else MM/DD
        if (part1 > 12) {
          day = part1;
          month = part2 - 1;
        } else {
          month = part1 - 1;
          day = part2;
        }
        break;

      default:
        return null;
    }

    // Validate date components
    if (year < 2000 || year > 2100) return null;
    if (month < 0 || month > 11) return null;
    if (day < 1 || day > 31) return null;

    const date = new Date(year, month, day);
    
    // Verify the date is valid (handles invalid dates like Feb 30)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }

    return null;
  } catch (e) {
    console.debug('[PDF Parser] Date parsing error:', e);
    return null;
  }
}

/**
 * Validate if a date is reasonable for a holiday calendar
 */
function isValidHolidayDate(date: Date): boolean {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const year = date.getFullYear();

  // Accept dates from 1 year ago to 3 years ahead (covers current year + planning ahead)
  return year >= currentYear - 1 && year <= currentYear + 3;
}

/**
 * Extract holiday name from context around date
 */
function extractHolidayName(text: string, dateMatch: RegExpMatchArray): string | undefined {
  const matchIndex = dateMatch.index || 0;
  const contextStart = Math.max(0, matchIndex - 50);
  const contextEnd = Math.min(text.length, matchIndex + dateMatch[0].length + 50);
  const context = text.substring(contextStart, contextEnd);

  // Look for capitalized words (potential holiday names)
  const namePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const matches = Array.from(context.matchAll(namePattern));
  
  // Return the first substantial match (at least 3 characters)
  for (const match of matches) {
    if (match[1].length >= 3 && !match[1].match(/^\d+$/)) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Parse PDF file and extract holiday dates
 */
export async function parseHolidayPDF(file: File): Promise<ParsedHoliday[]> {
  const DEBUG = import.meta.env.DEV;

  try {
    // Validate file
    if (file.type !== 'application/pdf') {
      throw { type: 'UNSUPPORTED_FORMAT', message: 'File must be a PDF' } as ParseError;
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw { 
        type: 'PARSE_ERROR', 
        message: 'File too large', 
        details: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit` 
      } as ParseError;
    }

    if (DEBUG) console.log('[PDF Parser] Starting PDF parsing for file:', file.name, `(${(file.size / 1024).toFixed(2)}KB)`);

    // Initialize worker
    await initializePDFWorker();
    if (DEBUG) console.log('[PDF Parser] Worker initialized');

    // Import pdf.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    if (DEBUG) console.log('[PDF Parser] File loaded, size:', arrayBuffer.byteLength, 'bytes');
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: DEBUG ? 1 : 0
    });
    
    const pdf = await loadingTask.promise;
    if (DEBUG) console.log('[PDF Parser] PDF loaded, pages:', pdf.numPages);

    if (pdf.numPages === 0) {
      throw { 
        type: 'PARSE_ERROR', 
        message: 'PDF contains no pages' 
      } as ParseError;
    }

    // Extract text from all pages
    let fullText = '';
    const holidays: ParsedHoliday[] = [];
    const seenDates = new Set<string>();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (DEBUG) console.log(`[PDF Parser] Processing page ${pageNum}/${pdf.numPages}`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items with proper spacing
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      
      const normalizedPageText = normalizeText(pageText);
      fullText += normalizedPageText + ' ';
      
      if (DEBUG && pageNum === 1) {
        console.log('[PDF Parser] Sample text from page 1:', normalizedPageText.substring(0, 200));
      }
    }

    if (DEBUG) {
      console.log('[PDF Parser] Total text length:', fullText.length);
      console.log('[PDF Parser] Full text preview:', fullText.substring(0, 500));
    }

    // Check if text extraction was successful
    if (fullText.trim().length < 10) {
      throw { 
        type: 'SCANNED_PDF', 
        message: 'PDF appears to be scanned (image-only). Please use a text-based PDF or manually select holidays.',
        details: 'No readable text found in PDF'
      } as ParseError;
    }

    // Extract dates using all patterns
    const dateMatches: Array<{ date: Date; match: RegExpMatchArray; name?: string }> = [];

    DATE_PATTERNS.forEach((pattern, patternIndex) => {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      let match: RegExpMatchArray | null;
      while ((match = pattern.exec(fullText)) !== null) {
        const date = parseDateString(match, patternIndex);
        
        if (date && isValidHolidayDate(date)) {
          const dateKey = date.toISOString().split('T')[0];
          
          if (!seenDates.has(dateKey)) {
            seenDates.add(dateKey);
            const name = extractHolidayName(fullText, match);
            dateMatches.push({ date, match, name });
            
            if (DEBUG) {
              console.log(`[PDF Parser] Found date: ${date.toDateString()} (${match[0]})`, name ? `- ${name}` : '');
            }
          }
        }
      }
    });

    if (DEBUG) {
      console.log(`[PDF Parser] Total dates found: ${dateMatches.length}`);
    }

    // Convert to ParsedHoliday format
    const parsedHolidays: ParsedHoliday[] = dateMatches.map(({ date, name }) => ({
      date,
      name,
    }));

    // Sort by date
    parsedHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Validation: must have at least one date
    if (parsedHolidays.length === 0) {
      throw { 
        type: 'NO_DATES', 
        message: 'PDF contains no recognizable holiday dates',
        details: 'Please ensure your PDF contains dates in formats like "01 Jan 2026", "Jan 1, 2026", or "01/01/2026"'
      } as ParseError;
    }

    if (DEBUG) {
      console.log('[PDF Parser] Successfully parsed', parsedHolidays.length, 'holidays');
      console.log('[PDF Parser] Sample dates:', parsedHolidays.slice(0, 5).map(h => h.date.toDateString()));
    }

    return parsedHolidays;
  } catch (error) {
    console.error('[PDF Parser] Error:', error);
    
    // If it's already a ParseError, rethrow it
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        throw { 
          type: 'WORKER_FAILED', 
          message: 'PDF worker failed to initialize',
          details: error.message
        } as ParseError;
      }
      
      if (error.message.includes('Invalid PDF')) {
        throw { 
          type: 'PARSE_ERROR', 
          message: 'Invalid PDF file',
          details: error.message
        } as ParseError;
      }
    }

    // Generic fallback
    throw { 
      type: 'PARSE_ERROR', 
      message: 'Failed to parse PDF file',
      details: error instanceof Error ? error.message : String(error)
    } as ParseError;
  }
}

/**
 * Validate if a date is valid
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Fallback: Simple text-based parser for PDFs that can't be parsed with pdf.js
 */
export function parseHolidayPDFFallback(file: File): Promise<ParsedHoliday[]> {
  return new Promise((resolve) => {
    // Try to extract year from filename
    const yearMatch = file.name.match(/\b(20\d{2})\b/);
    const currentYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    
    // For fallback, return empty array and let user manually select
    resolve([]);
  });
}
