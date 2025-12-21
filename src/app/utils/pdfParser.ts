/**
 * PDF Holiday Calendar Parser
 * Extracts holiday dates from PDF files using client-side parsing
 */

export interface ParsedHoliday {
  date: Date;
  name?: string;
}

/**
 * Parse PDF file and extract holiday dates
 * Uses pdf.js for client-side PDF parsing
 */
export async function parseHolidayPDF(file: File): Promise<ParsedHoliday[]> {
  try {
    // Dynamically import pdf.js to keep bundle size manageable
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source - try CDN first, fallback to local if needed
    if (typeof window !== 'undefined') {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      } catch (e) {
        // Fallback: use unpkg CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      }
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const holidays: ParsedHoliday[] = [];
    const datePatterns = [
      // Common date formats
      /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})\b/g, // MM/DD/YYYY or DD-MM-YYYY
      /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g,   // YYYY-MM-DD
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/gi, // Month DD, YYYY
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/gi, // DD Month YYYY
    ];

    const monthNames: { [key: string]: number } = {
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

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      // Try to find dates in the text
      for (const pattern of datePatterns) {
        let match;
        while ((match = pattern.exec(pageText)) !== null) {
          try {
            let date: Date | null = null;

            if (pattern === datePatterns[0]) {
              // MM/DD/YYYY or DD-MM-YYYY
              const part1 = parseInt(match[1], 10);
              const part2 = parseInt(match[2], 10);
              const part3 = parseInt(match[3], 10);
              
              // Heuristic: if part3 is 4 digits, it's year
              if (part3 > 31) {
                // YYYY-MM-DD format
                date = new Date(part3, part2 - 1, part1);
              } else if (part1 > 12) {
                // DD-MM-YYYY format
                date = new Date(part3 > 31 ? part3 : part3 + 2000, part2 - 1, part1);
              } else {
                // MM-DD-YYYY format
                date = new Date(part3 > 31 ? part3 : part3 + 2000, part1 - 1, part2);
              }
            } else if (pattern === datePatterns[1]) {
              // YYYY-MM-DD
              const year = parseInt(match[1], 10);
              const month = parseInt(match[2], 10);
              const day = parseInt(match[3], 10);
              date = new Date(year, month - 1, day);
            } else if (pattern === datePatterns[2]) {
              // Month DD, YYYY
              const monthName = match[1].toLowerCase();
              const day = parseInt(match[2], 10);
              const year = parseInt(match[3], 10);
              const month = monthNames[monthName];
              if (month !== undefined) {
                date = new Date(year, month, day);
              }
            } else if (pattern === datePatterns[3]) {
              // DD Month YYYY
              const day = parseInt(match[1], 10);
              const monthName = match[2].toLowerCase();
              const year = parseInt(match[3], 10);
              const month = monthNames[monthName];
              if (month !== undefined) {
                date = new Date(year, month, day);
              }
            }

            if (date && isValidDate(date)) {
              // Check if date is reasonable (within next 2 years)
              const now = new Date();
              const twoYearsFromNow = new Date();
              twoYearsFromNow.setFullYear(now.getFullYear() + 2);
              
              if (date >= now && date <= twoYearsFromNow) {
                // Try to extract holiday name (text near the date)
                const contextStart = Math.max(0, match.index - 30);
                const contextEnd = Math.min(pageText.length, match.index + match[0].length + 30);
                const context = pageText.substring(contextStart, contextEnd);
                
                // Look for holiday name patterns
                const nameMatch = context.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                const name = nameMatch ? nameMatch[1] : undefined;

                // Avoid duplicates
                const isDuplicate = holidays.some(h => 
                  h.date.getTime() === date.getTime()
                );

                if (!isDuplicate) {
                  holidays.push({ date, name });
                }
              }
            }
          } catch (e) {
            // Skip invalid dates
            console.debug('Failed to parse date:', match[0], e);
          }
        }
      }
    }

    // Sort by date
    holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

    return holidays;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Please ensure it contains readable text and dates.');
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
 * This attempts to extract dates from the file name or prompts user for manual entry
 */
export function parseHolidayPDFFallback(file: File): Promise<ParsedHoliday[]> {
  return new Promise((resolve) => {
    // Try to extract year from filename
    const yearMatch = file.name.match(/\b(20\d{2})\b/);
    const currentYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    
    // For fallback, return empty array and let user manually select
    // The UI should handle this gracefully
    resolve([]);
  });
}

