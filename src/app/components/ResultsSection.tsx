import { Calendar, Plane, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, isSameDay, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, isAfter, isBefore } from 'date-fns';
import { OptimizationResult } from '../utils/optimizer';
import { motion } from 'motion/react';
import { useState } from 'react';

interface ResultsSectionProps {
  result: OptimizationResult;
  holidays: Date[];
  currentMonth: Date;
  onMonthChange: (delta: number) => void;
  selectedRecommendationId: number | null;
}

export function ResultsSection({ result, holidays, currentMonth, onMonthChange, selectedRecommendationId }: ResultsSectionProps) {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the selected recommendation if any
  const selectedRecommendation = selectedRecommendationId !== null 
    ? result.recommendations[selectedRecommendationId] 
    : null;

  // Check if a day belongs to the selected recommendation
  const isDayInSelectedRecommendation = (day: Date): boolean => {
    if (!selectedRecommendation) return false;
    
    const normalizedDay = startOfDay(day);
    const start = startOfDay(selectedRecommendation.startDate);
    const end = startOfDay(selectedRecommendation.endDate);
    
    // Check if day is within the range (inclusive)
    return (isSameDay(normalizedDay, start) || isAfter(normalizedDay, start)) &&
           (isSameDay(normalizedDay, end) || isBefore(normalizedDay, end));
  };

  const getDayType = (day: Date) => {
    if (result.optimizedLeaves.some(d => isSameDay(d, day))) return 'leave';
    if (holidays.some(h => isSameDay(h, day))) return 'holiday';
    if (isWeekend(day)) return 'weekend';
    return 'workday';
  };

  const getDayHighlightState = (day: Date): 'active' | 'inactive' | null => {
    if (!selectedRecommendation) return null;
    
    if (isDayInSelectedRecommendation(day)) {
      return 'active';
    }
    
    // Dim days that are not part of the selected recommendation
    const dayType = getDayType(day);
    if (dayType === 'leave' || dayType === 'holiday') {
      return 'inactive';
    }
    
    return null;
  };

  const getDayLabel = (dayType: string) => {
    switch (dayType) {
      case 'holiday': return 'Company Holiday';
      case 'leave': return 'Suggested Leave';
      case 'weekend': return 'Weekend';
      default: return 'Working Day';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Total
            </div>
          </div>
          <div className="text-4xl mb-2">{result.totalVacations}</div>
          <p className="text-sm opacity-90">Vacation Periods Created</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Plane className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Best
            </div>
          </div>
          <div className="text-4xl mb-2">{result.longestBreak}</div>
          <p className="text-sm opacity-90">Longest Continuous Break (days)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Check className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Remaining
            </div>
          </div>
          <div className="text-4xl mb-2">{result.leavesRemaining}</div>
          <p className="text-sm opacity-90">Leaves Still Available</p>
        </motion.div>
      </div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h3>Optimized Leave Plan</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMonthChange(-1)}
              className="px-3 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">{format(currentMonth, 'MMMM yyyy')}</span>
            <button
              onClick={() => onMonthChange(1)}
              className="px-3 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>Company Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary" />
            <span>Suggested Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>Weekend</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3 relative">
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
            const dayType = getDayType(day);
            const isHovered = hoveredDay && isSameDay(hoveredDay, day);
            const highlightState = getDayHighlightState(day);
            
            // Determine base styles
            let baseStyles = '';
            if (dayType === 'holiday') {
              baseStyles = 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg';
            } else if (dayType === 'leave') {
              baseStyles = 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-md hover:shadow-lg';
            } else if (dayType === 'weekend') {
              baseStyles = 'bg-muted/50 text-muted-foreground hover:bg-muted';
            } else {
              baseStyles = 'bg-white border border-border hover:border-primary/30 hover:shadow-sm';
            }

            // Apply highlighting/dimming based on selected recommendation
            if (highlightState === 'active') {
              // Highlight active days with a ring
              baseStyles += ' ring-2 ring-offset-2 ring-secondary';
            } else if (highlightState === 'inactive') {
              // Dim inactive days
              baseStyles += ' opacity-30 grayscale';
            }
            
            return (
              <div key={day.toString()} className="relative group">
                <motion.div
                  whileHover={{ scale: highlightState === 'inactive' ? 1 : 1.08, y: highlightState === 'inactive' ? 0 : -2 }}
                  className={`p-4 rounded-xl text-sm transition-all cursor-pointer relative overflow-hidden ${baseStyles}`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="text-center relative z-10">{format(day, 'd')}</div>
                  
                  {/* Icon indicator */}
                  {dayType === 'holiday' && (
                    <div className="absolute top-1 right-1">
                      <Calendar className="w-3 h-3 opacity-60" />
                    </div>
                  )}
                  {dayType === 'leave' && (
                    <div className="absolute top-1 right-1">
                      <Sparkles className="w-3 h-3 opacity-60" />
                    </div>
                  )}
                  
                  {/* Gradient overlay on hover */}
                  {(dayType === 'holiday' || dayType === 'leave') && (
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                  )}
                  
                  {/* Decorative dot */}
                  {(dayType === 'holiday' || dayType === 'leave') && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full opacity-60" />
                  )}
                </motion.div>
                
                {/* Tooltip on hover */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap text-xs"
                  >
                    <div className="font-medium">{format(day, 'EEEE, MMM dd')}</div>
                    <div className="text-muted-foreground mt-0.5">{getDayLabel(dayType)}</div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}