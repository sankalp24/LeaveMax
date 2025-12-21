import { useState, useRef } from 'react';
import { Upload, FileText, Calendar, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { parseHolidayPDF } from '../utils/pdfParser';

interface HolidayInputProps {
  selectedHolidays: Date[];
  onHolidaysChange: (holidays: Date[]) => void;
}

export function HolidayInput({ selectedHolidays, onHolidaysChange }: HolidayInputProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleHoliday = (date: Date) => {
    const exists = selectedHolidays.some(h => isSameDay(h, date));
    if (exists) {
      onHolidaysChange(selectedHolidays.filter(h => !isSameDay(h, date)));
    } else {
      onHolidaysChange([...selectedHolidays, date]);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setParseError('Please upload a PDF file');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseSuccess(null);

    try {
      const parsedHolidays = await parseHolidayPDF(file);
      
      if (parsedHolidays.length === 0) {
        setParseError('No dates found in PDF. Please try manual selection or ensure the PDF contains readable dates.');
        setIsParsing(false);
        return;
      }

      // Extract dates from parsed holidays
      const dates = parsedHolidays.map(h => h.date);
      
      // Merge with existing holidays (avoid duplicates)
      const existingDateKeys = new Set(selectedHolidays.map(d => format(d, 'yyyy-MM-dd')));
      const newDates = dates.filter(d => !existingDateKeys.has(format(d, 'yyyy-MM-dd')));
      
      if (newDates.length > 0) {
        onHolidaysChange([...selectedHolidays, ...newDates]);
        setParseSuccess(newDates.length);
      } else {
        setParseError('All dates from PDF are already selected');
      }
    } catch (error) {
      console.error('PDF parsing error:', error);
      setParseError(error instanceof Error ? error.message : 'Failed to parse PDF. Please try manual selection.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/5 p-2 rounded-lg">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3>Company Holidays</h3>
          <p className="text-sm text-muted-foreground">Select or upload your company holiday calendar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === 'manual'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Manual Selection
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === 'upload'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Upload PDF
        </button>
      </div>

      {/* Content */}
      {activeTab === 'manual' ? (
        <div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              ←
            </button>
            <h4>{format(currentMonth, 'MMMM yyyy')}</h4>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs text-center text-muted-foreground p-2">
                {day}
              </div>
            ))}
            {/* Empty cells for alignment */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            {/* Days */}
            {monthDays.map(day => {
              const isHoliday = selectedHolidays.some(h => isSameDay(h, day));
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => toggleHoliday(day)}
                  className={`p-2 rounded-lg text-sm transition-all hover:scale-105 ${
                    isHoliday
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isWeekend
                      ? 'bg-muted/50 text-muted-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            {selectedHolidays.length} holidays selected
          </p>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-border hover:border-primary/50'
            } ${isParsing ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-xl transition-colors ${
                isParsing ? 'bg-primary/20' : 'bg-primary/10'
              }`}>
                {isParsing ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
            
            {isParsing ? (
              <>
                <h4 className="mb-2">Parsing PDF...</h4>
                <p className="text-sm text-muted-foreground">
                  Extracting holiday dates from your calendar
                </p>
              </>
            ) : (
              <>
                <h4 className="mb-2">Upload Company Holiday Calendar</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your PDF file or click to browse
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Supported format: PDF</span>
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Error parsing PDF</p>
                <p className="text-xs text-destructive/80 mt-1">{parseError}</p>
              </div>
              <button
                onClick={() => setParseError(null)}
                className="text-destructive/60 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {parseSuccess !== null && !isParsing && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">Successfully parsed PDF</p>
                <p className="text-xs text-green-700 mt-1">
                  Added {parseSuccess} holiday{parseSuccess > 1 ? 's' : ''} from the PDF
                </p>
              </div>
              <button
                onClick={() => setParseSuccess(null)}
                className="text-green-600/60 hover:text-green-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Info about manual editing */}
          {selectedHolidays.length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                You can switch to "Manual Selection" to review or edit the {selectedHolidays.length} selected holiday{selectedHolidays.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}